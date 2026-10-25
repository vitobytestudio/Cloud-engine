import { Hono } from "hono";
import type { Env } from "../env";
import { audit, requireAdmin } from "../lib/auth";
import { aesDecrypt, safeEqual, randomId } from "../lib/crypto";
import { planById } from "../lib/plans";
import { matchClient } from "../lib/matching";

export const adminRoutes = new Hono<{ Bindings: Env; Variables: { user: { id: string; email: string; name: string; role: string } } }>();

adminRoutes.use("/api/admin/*", requireAdmin);

/** قائمة الطلبات قيد المراجعة */
adminRoutes.get("/api/admin/payments", async (c) => {
  const status = c.req.query("status") ?? "submitted";
  const rows = await c.env.DB.prepare(
    `SELECT o.id, o.plan_id, o.amount_dzd, o.reference, o.status, o.risk_flag, o.created_at,
            u.email, u.name,
            r.filename, r.content_type, r.size, r.transfer_name, r.transfer_date, r.created_at AS submitted_at
     FROM payment_orders o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN payment_receipts r ON r.order_id = o.id
     WHERE o.status = ?1
     ORDER BY o.updated_at DESC LIMIT 100`
  )
    .bind(status)
    .all();
  return c.json({ payments: rows.results });
});

/** معاينة الوصل — فك التشفير لحظياً، مُوثّق في سجل التدقيق */
adminRoutes.get("/api/admin/payments/:id/receipt", async (c) => {
  const admin = c.get("user");
  const orderId = c.req.param("id");
  const receipt = await c.env.DB.prepare(
    "SELECT storage_key, content_type, filename FROM payment_receipts WHERE order_id = ?1"
  )
    .bind(orderId)
    .first<{ storage_key: string; content_type: string; filename: string }>();
  if (!receipt) return c.json({ error: "لا وصل لهذا الطلب" }, 404);

  const stored = await c.env.KV.get(receipt.storage_key, "arrayBuffer");
  if (!stored) return c.json({ error: "الملف غير موجود في التخزين" }, 404);

  const plain = await aesDecrypt(c.env.RECEIPT_ENCRYPTION_KEY, stored);
  await audit(c, admin.id, "receipt_viewed", orderId);
  return new Response(plain, {
    headers: {
      "content-type": receipt.content_type,
      "content-disposition": `inline; filename="${receipt.filename.replace(/[^\w.-]/g, "_")}"`,
      "cache-control": "no-store",
    },
  });
});

/** القرار البشري النهائي — اعتماد يفعّل الاشتراك 30 يوماً، رفض بسبب موثّق */
adminRoutes.post("/api/admin/payments/:id/decision", async (c) => {
  const admin = c.get("user");
  const orderId = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const decision = String(body?.decision ?? "");
  const reason = String(body?.reason ?? "").trim();

  if (!["approve", "reject"].includes(decision)) return c.json({ error: "قرار غير معروف" }, 400);
  if (decision === "reject" && reason.length < 4)
    return c.json({ error: "سبب الرفض إلزامي (4 أحرف على الأقل)" }, 400);

  const order = await c.env.DB.prepare(
    "SELECT id, user_id, plan_id, amount_dzd, status FROM payment_orders WHERE id = ?1"
  )
    .bind(orderId)
    .first<{ id: string; user_id: string; plan_id: string; amount_dzd: number; status: string }>();
  if (!order) return c.json({ error: "الطلب غير موجود" }, 404);
  if (order.status !== "submitted")
    return c.json({ error: "الطلب ليس قيد المراجعة (حالته: " + order.status + ")" }, 409);

  const now = Date.now();
  if (decision === "approve") {
    const plan = planById(order.plan_id);
    if (!plan || plan.priceDzd !== order.amount_dzd)
      return c.json({ error: "عدم تطابق المبلغ مع الباقة — راجع الطلب" }, 409);

    // إبطال الاشتراكات السابقة وتفعيل الجديدة
    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE subscriptions SET status = 'expired', updated_at = ?2 WHERE user_id = ?1 AND plan_id != ?3 AND status = 'active'")
        .bind(order.user_id, now, order.plan_id),
      c.env.DB.prepare(
        `INSERT INTO subscriptions (id, user_id, plan_id, status, started_at, renews_at, updated_at)
         VALUES (?1,?2,?3,'active',?4,?5,?4)`
      ).bind(randomId("s_"), order.user_id, order.plan_id, now, now + 30 * 86400_000),
      c.env.DB.prepare("UPDATE payment_orders SET status = 'approved', updated_at = ?2 WHERE id = ?1").bind(orderId, now),
      c.env.DB.prepare(
        "INSERT INTO payment_decisions (id, order_id, admin_id, decision, reason, created_at) VALUES (?1,?2,?3,'approved',NULL,?4)"
      ).bind(randomId("pd_"), orderId, admin.id, now),
    ]);
    await audit(c, admin.id, "payment_approved", orderId, { user: order.user_id, plan: order.plan_id });
    return c.json({ ok: true, status: "approved", subscription_until: now + 30 * 86400_000 });
  }

  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE payment_orders SET status = 'rejected', updated_at = ?2 WHERE id = ?1").bind(orderId, now),
    c.env.DB.prepare(
      "INSERT INTO payment_decisions (id, order_id, admin_id, decision, reason, created_at) VALUES (?1,?2,?3,'rejected',?4,?5)"
    ).bind(randomId("pd_"), orderId, admin.id, reason.slice(0, 500), now),
  ]);
  await audit(c, admin.id, "payment_rejected", orderId, { reason: reason.slice(0, 200) });
  return c.json({ ok: true, status: "rejected" });
});

/**
 * استقبال الزبائن من الموصلات الرسمية (Meta Webhook / X API / Telegram / RSS)
 * رمز استقبال سري + رابط المصدر إلزامي وفريد + منشور حديث فقط
 */
// استقبال مفتوح للرمز السري فقط (خارج جلسات الإدارة)
export async function ingestHandler(c: any) {
  const token = c.req.header("x-ingest-token") ?? "";
  if (!safeEqual(token, c.env.INGEST_TOKEN ?? ""))
    return c.json({ error: "رمز استقبال غير صالح" }, 401);

  const body = await c.req.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items.slice(0, 100) : [];
  if (!items.length) return c.json({ error: "لا عناصر" }, 400);

  const now = Date.now();
  let inserted = 0;
  let duplicates = 0;
  const stmts: D1PreparedStatement[] = [];

  for (const it of items) {
    const sourceUrl = String(it?.source_url ?? "").trim();
    const title = String(it?.title ?? "").trim();
    if (!/^https?:\/\/.+/.test(sourceUrl) || title.length < 5) { duplicates++; continue; }
    const publishedAt = Number(it?.published_at) || now;
    if (now - publishedAt > 72 * 3600_000) { duplicates++; continue; } // الجديد فقط

    stmts.push(
      c.env.DB.prepare(
        `INSERT OR IGNORE INTO clients
         (id, title, excerpt, author_public, platform, source_url, keyword, location_hint, likes, comments, source, status, published_at, ingested_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,'active',?12,?13)`
      ).bind(
        randomId("c_"),
        title.slice(0, 160),
        String(it?.excerpt ?? "").slice(0, 600),
        String(it?.author_public ?? "ناشر عام").slice(0, 80),
        String(it?.platform ?? "web").slice(0, 20),
        sourceUrl,
        String(it?.keyword ?? "").slice(0, 40),
        it?.location_hint ? String(it.location_hint).slice(0, 60) : null,
        Number(it?.likes) || 0,
        Number(it?.comments) || 0,
        String(it?.source ?? "ingest").slice(0, 30),
        publishedAt,
        now
      )
    );
  }

  if (stmts.length) {
    const res = await c.env.DB.batch(stmts);
    inserted = (res as D1Result[]).reduce((acc: number, r: D1Result) => acc + (r.meta?.changes ?? 0), 0);
    duplicates += stmts.length - inserted;
  }

  return c.json({ ok: true, inserted, duplicates, received: items.length });
}

adminRoutes.get("/api/admin/stats", async (c) => {
  const db = c.env.DB;
  const users = await db.prepare("SELECT COUNT(*) AS n FROM users").first<{ n: number }>();
  const activeSubs = await db.prepare("SELECT COUNT(*) AS n FROM subscriptions WHERE status = 'active' AND plan_id != 'free'").first<{ n: number }>();
  const pending = await db.prepare("SELECT COUNT(*) AS n FROM payment_orders WHERE status = 'submitted'").first<{ n: number }>();
  const clients72 = await db.prepare("SELECT COUNT(*) AS n FROM clients WHERE published_at >= ?1").bind(Date.now() - 72 * 3600_000).first<{ n: number }>();
  const deliveries = await db.prepare("SELECT COUNT(*) AS n FROM client_deliveries").first<{ n: number }>();
  return c.json({
    users: users?.n ?? 0,
    active_paid_subscriptions: activeSubs?.n ?? 0,
    payments_pending_review: pending?.n ?? 0,
    clients_last_72h: clients72?.n ?? 0,
    total_deliveries: deliveries?.n ?? 0,
  });
});

adminRoutes.get("/api/admin/users", async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.role, u.created_at,
            s.plan_id, s.status AS sub_status, s.renews_at
     FROM users u
     LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
     ORDER BY u.created_at DESC LIMIT 200`
  ).all();
  return c.json({ users: rows.results });
});

export { matchClient };
