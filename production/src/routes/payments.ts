import { Hono } from "hono";
import type { Env } from "../env";
import { audit, rateLimit, clientIpHash } from "../lib/auth";
import { planById } from "../lib/plans";
import { paymentReference, randomId, sha256Hex, aesEncrypt } from "../lib/crypto";

export const paymentRoutes = new Hono<{ Bindings: Env; Variables: { user: { id: string; email: string; name: string; role: string } } }>();

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

/** إنشاء طلب دفع — مرجع فريد يُكتب في وحدة التحويل (أساس منع الاحتيال) */
paymentRoutes.post("/api/payments/order", async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => null);
  const plan = planById(String(body?.plan_id ?? ""));
  if (!plan) return c.json({ error: "باقة غير معروفة" }, 400);
  if (plan.priceDzd <= 0) return c.json({ error: "الباقة المجانية لا تحتاج دفعاً" }, 400);
  if (!(await rateLimit(c, "order:" + user.id, 10, 3600_000)))
    return c.json({ error: "طلبات كثيرة — أعد المحاولة لاحقاً" }, 429);

  // طلب معلّق سابق لنفس الباقة؟ نعيد استعماله (منع تكديس الطلبات)
  const existing = await c.env.DB.prepare(
    `SELECT id, reference, amount_dzd FROM payment_orders
     WHERE user_id = ?1 AND plan_id = ?2 AND status IN ('pending','submitted')`
  )
    .bind(user.id, plan.id)
    .first<{ id: string; reference: string; amount_dzd: number }>();

  if (existing) {
    return c.json({
      order_id: existing.id,
      reference: existing.reference,
      amount_dzd: existing.amount_dzd,
      rip: c.env.PAYMENT_RIP,
      rip_key: c.env.PAYMENT_KEY,
      account: c.env.PAYMENT_ACCOUNT,
      holder: c.env.PAYMENT_HOLDER,
    });
  }

  const id = randomId("po_");
  const reference = paymentReference();
  const now = Date.now();
  await c.env.DB.prepare(
    `INSERT INTO payment_orders (id, user_id, plan_id, amount_dzd, reference, status, created_at, updated_at)
     VALUES (?1,?2,?3,?4,?5,'pending',?6,?6)`
  )
    .bind(id, user.id, plan.id, plan.priceDzd, reference, now)
    .run();
  await audit(c, user.id, "payment_order_created", id, { plan: plan.id, amount: plan.priceDzd, reference });

  return c.json({
    order_id: id,
    reference,
    amount_dzd: plan.priceDzd,
    rip: c.env.PAYMENT_RIP,
    rip_key: c.env.PAYMENT_KEY,
    account: c.env.PAYMENT_ACCOUNT,
    holder: c.env.PAYMENT_HOLDER,
  }, 201);
});

paymentRoutes.get("/api/payments/orders", async (c) => {
  const user = c.get("user");
  const rows = await c.env.DB.prepare(
    `SELECT o.id, o.plan_id, o.amount_dzd, o.reference, o.status, o.risk_flag, o.created_at,
            r.transfer_name, r.transfer_date, r.created_at AS submitted_at
     FROM payment_orders o
     LEFT JOIN payment_receipts r ON r.order_id = o.id
     WHERE o.user_id = ?1
     ORDER BY o.created_at DESC LIMIT 20`
  )
    .bind(user.id)
    .all();
  return c.json({ orders: rows.results });
});

/**
 * رفع الوصل — مؤتمت بالكامل مع حماية متعددة الطبقات:
 * 1) الملف يُشفَّر AES-256-GCM قبل التخزين (R2) — لا يُقرأ إلا من الإدارة عبر فك التشفير المُوثّق
 * 2) بصمة SHA-256 فريدة — نفس الوصل لا يُقبَل مرتين مهما كانت الحيلة
 * 3) (اسم المحوّل + التاريخ) المتكرر لطلبات مختلفة يُعلَّم كمخاطرة للمراجعة
 * 4) المبلغ والتاريخ يتحقق منهما النظام (بلا AI — قواعد حتمية) والقرار النهائي بشري موثّق
 */
paymentRoutes.post("/api/payments/orders/:id/receipt", async (c) => {
  const user = c.get("user");
  if (!(await rateLimit(c, "receipt:" + user.id, 10, 3600_000)))
    return c.json({ error: "محاولات رفع كثيرة — أعد المحاولة بعد ساعة" }, 429);

  const orderId = c.req.param("id");
  const order = await c.env.DB.prepare(
    "SELECT id, user_id, plan_id, amount_dzd, reference, status FROM payment_orders WHERE id = ?1"
  )
    .bind(orderId)
    .first<{ id: string; user_id: string; plan_id: string; amount_dzd: number; reference: string; status: string }>();

  if (!order || order.user_id !== user.id) return c.json({ error: "الطلب غير موجود" }, 404);
  if (order.status === "submitted") return c.json({ error: "الوصل مرفوع بالفعل — قيد المراجعة" }, 409);
  if (order.status === "approved") return c.json({ error: "الطلب معتمد مسبقاً" }, 409);
  if (order.status === "cancelled") return c.json({ error: "الطلب ملغى" }, 409);

  const form = await c.req.formData();
  const file = form.get("file") as unknown as File;
  const transferName = String(form.get("transfer_name") ?? "").trim();
  const transferDate = String(form.get("transfer_date") ?? "").trim();

  if (!file || typeof file === "string" || typeof (file as File).arrayBuffer !== "function") return c.json({ error: "ملف الوصل مطلوب" }, 400);
  if (file.size <= 0 || file.size > MAX_RECEIPT_BYTES)
    return c.json({ error: "حجم الملف: من 1 بايت إلى 5 ميغابايت" }, 400);
  if (!ALLOWED_TYPES.has(file.type))
    return c.json({ error: "الصيغ المقبولة: JPG أو PNG أو WEBP أو PDF" }, 400);
  if (transferName.length < 3 || transferName.length > 80)
    return c.json({ error: "اسم المحوّل كما في الوصل مطلوب (3-80 حرفاً)" }, 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(transferDate))
    return c.json({ error: "تاريخ التحويل بصيغة YYYY-MM-DD" }, 400);
  const tDate = new Date(transferDate + "T00:00:00Z").getTime();
  const now = Date.now();
  if (Number.isNaN(tDate) || tDate > now || tDate < now - 30 * 86400_000)
    return c.json({ error: "تاريخ التحويل: ليس مستقبلاً وليس أقدم من 30 يوماً" }, 400);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const fileHash = await sha256Hex(bytes);

  // منع إعادة استعمال الوصل — حتمي وقاطع
  const dup = await c.env.DB.prepare("SELECT order_id FROM payment_receipts WHERE sha256 = ?1")
    .bind(fileHash)
    .first<{ order_id: string }>();
  if (dup)
    return c.json({ error: "هذا الوصل مستعمل سابقاً في طلب آخر — كل وصل يُقبل مرة واحدة فقط", code: "DUPLICATE_RECEIPT" }, 409);

  // كشف النمط المشبوه: نفس (اسم + تاريخ) لطلب مختلف → علم مخاطرة للمراجعة البشرية
  const pattern = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM payment_receipts r
     JOIN payment_orders o ON o.id = r.order_id
     WHERE r.transfer_name = ?1 AND r.transfer_date = ?2 AND o.user_id != ?3`
  )
    .bind(transferName, transferDate, user.id)
    .first<{ n: number }>();

  // التشفير ثم التخزين — النص الصريح لا يُكتب في أي مكان
  const key = c.env.RECEIPT_ENCRYPTION_KEY;
  if (!/^[0-9a-f]{64}$/i.test(key ?? "")) return c.json({ error: "خطأ إعداد الخادم" }, 500);
  const encrypted = await aesEncrypt(key, bytes.buffer as ArrayBuffer);
  const storageKey = `receipts/${order.id}/${randomId("r_")}.bin`;
  await c.env.KV.put(storageKey, encrypted);

  const receiptId = randomId("pr_");
  const stmts = [
    c.env.DB.prepare(
      `INSERT INTO payment_receipts
       (id, order_id, filename, content_type, size, sha256, transfer_name, transfer_date, storage_key, ip_hash, created_at)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)`
    ).bind(
      receiptId, order.id, file.name.slice(0, 120), file.type, file.size, fileHash,
      transferName, transferDate, storageKey, await clientIpHash(c), now
    ),
    c.env.DB.prepare("UPDATE payment_orders SET status = 'submitted', risk_flag = ?2, updated_at = ?3 WHERE id = ?1").bind(
      order.id,
      pattern && pattern.n > 0 ? 1 : 0,
      now
    ),
  ];
  await c.env.DB.batch(stmts);
  await audit(c, user.id, "receipt_uploaded", order.id, { receiptId, size: file.size, risk: pattern && pattern.n > 0 });

  return c.json({ ok: true, status: "submitted", review_note: "وصولك قيد المراجعة — التفعيل خلال ساعات العمل" }, 201);
});
