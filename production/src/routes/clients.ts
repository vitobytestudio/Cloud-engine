import { Hono } from "hono";
import type { Env } from "../env";
import { matchClient, openingMessage, professionById } from "../lib/matching";
import { planById } from "../lib/plans";
import { randomId } from "../lib/crypto";

export const clientRoutes = new Hono<{ Bindings: Env; Variables: { user: { id: string; email: string; name: string; role: string } } }>();

const RETENTION_MS = 72 * 3600_000; // الجديد فقط — 72 ساعة

async function getProfile(db: D1Database, userId: string) {
  return db
    .prepare("SELECT profession_id, keywords_json, wilayas_json, setup_done FROM profiles WHERE user_id = ?1")
    .bind(userId)
    .first<{ profession_id: string; keywords_json: string; wilayas_json: string; setup_done: number }>();
}

async function getActiveSub(db: D1Database, userId: string) {
  return db
    .prepare(
      `SELECT plan_id, status, renews_at FROM subscriptions
       WHERE user_id = ?1 AND status = 'active' ORDER BY started_at DESC LIMIT 1`
    )
    .bind(userId)
    .first<{ plan_id: string; status: string; renews_at: number }>();
}

/** حساب الحصة المتبقية حسب الباقة — حتمي وصارم */
async function remainingQuota(db: D1Database, userId: string, planId: string): Promise<number> {
  const plan = planById(planId);
  if (!plan) return 0;
  const now = Date.now();
  let windowStart: number;
  let quota: number;

  if (plan.dailyDeliver === -1) return 999; // محترف: بلا حدود عملياً
  if (plan.dailyDeliver > 0) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    windowStart = d.getTime();
    quota = plan.dailyDeliver;
  } else {
    windowStart = now - 7 * 86400_000;
    quota = plan.weeklyDeliver ?? 0;
  }

  const used = await db
    .prepare("SELECT COUNT(*) AS n FROM client_deliveries WHERE user_id = ?1 AND delivered_at >= ?2")
    .bind(userId, windowStart)
    .first<{ n: number }>();
  return Math.max(0, quota - (used?.n ?? 0));
}

/** جلب الزبائن الجاهزين — التسليم الفعلي: منشور + رابط + رسالة جاهزة */
clientRoutes.get("/api/clients", async (c) => {
  const user = c.get("user");
  const db = c.env.DB;

  const profile = await getProfile(db, user.id);
  if (!profile || !profile.setup_done) {
    return c.json({ error: "فعّل ملف التخصص أولاً (دقيقة واحدة)", code: "ONBOARDING_REQUIRED" }, 400);
  }

  const sub = await getActiveSub(db, user.id);
  if (!sub) return c.json({ error: "لا اشتراك نشط" }, 403);

  const remaining = await remainingQuota(db, user.id, sub.plan_id);
  const limit = Math.min(50, parseInt(c.req.query("limit") ?? "20", 10) || 20);

  // منحوم المرشحون: نشطون، حديثون (72 ساعة)، غير مسلَّمين لهذا المستخدم
  const cutoff = Date.now() - RETENTION_MS;
  const candidates = await db
    .prepare(
      `SELECT id, title, excerpt, author_public, platform, source_url, keyword,
              location_hint, likes, comments, published_at
       FROM clients
       WHERE status = 'active' AND published_at >= ?1
         AND id NOT IN (SELECT client_id FROM client_deliveries WHERE user_id = ?2)
       ORDER BY published_at DESC LIMIT 200`
    )
    .bind(cutoff, user.id)
    .all<{
      id: string; title: string; excerpt: string; author_public: string; platform: string;
      source_url: string; keyword: string; location_hint: string | null;
      likes: number; comments: number; published_at: number;
    }>();

  // المطابقة والترتيب — قواعد حتمية
  const profLabel = profile.profession_id ? professionById(profile.profession_id)?.label ?? null : null;
  const enriched = candidates.results
    .map((cl) => ({ ...cl, match: matchClient(cl, profile), opening: openingMessage(cl, profLabel) }))
    .sort((a, b) => {
      if (a.match.matched !== b.match.matched) return b.match.matched ? 1 : -1;
      if (a.match.matched && b.match.matched && a.match.score !== b.match.score) return b.match.score - a.match.score;
      return b.published_at - a.published_at;
    });

  // التسليم: للمحترف كل المرشحين؛ لغيره المطابقون أولاً ثم حد الحصة
  const deliverable =
    planById(sub.plan_id)?.dailyDeliver === -1
      ? enriched.slice(0, limit)
      : enriched.filter((e) => e.match.matched).slice(0, Math.min(remaining, limit));

  if (deliverable.length) {
    const now = Date.now();
    await db.batch(
      deliverable.map((cl) =>
        db.prepare("INSERT OR IGNORE INTO client_deliveries (client_id, user_id, delivered_at) VALUES (?1,?2,?3)").bind(cl.id, user.id, now)
      )
    );
  }

  const usageRow = await db
    .prepare("SELECT COUNT(*) AS n FROM client_deliveries WHERE user_id = ?1 AND delivered_at >= ?2")
    .bind(user.id, Date.now() - 7 * 86400_000)
    .first<{ n: number }>();

  return c.json({
    clients: deliverable,
    quota: {
      plan: sub.plan_id,
      remaining_today_or_week: remaining,
      delivered_this_week: usageRow?.n ?? 0,
    },
  });
});

/** فعل على زبون مسلَّم — تواصل/فُز/تجاهل */
clientRoutes.post("/api/clients/:id/action", async (c) => {
  const user = c.get("user");
  const clientId = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const status = String(body?.status ?? "");
  if (!["contacted", "won", "skipped"].includes(status))
    return c.json({ error: "حالة غير معروفة" }, 400);

  const delivered = await c.env.DB.prepare(
    "SELECT 1 AS x FROM client_deliveries WHERE client_id = ?1 AND user_id = ?2"
  )
    .bind(clientId, user.id)
    .first();
  if (!delivered) return c.json({ error: "هذا الزبون غير مسلَّم إليك" }, 403);

  await c.env.DB.prepare(
    `INSERT INTO client_status (client_id, user_id, status, updated_at) VALUES (?1,?2,?3,?4)
     ON CONFLICT(client_id, user_id) DO UPDATE SET status = ?3, updated_at = ?4`
  )
    .bind(clientId, user.id, status, Date.now())
    .run();
  return c.json({ ok: true });
});

/** ملخص لوحة المستخدم */
clientRoutes.get("/api/me/summary", async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  const sub = await getActiveSub(db, user.id);
  const profile = await getProfile(db, user.id);
  const plan = sub ? planById(sub.plan_id) : undefined;

  const week = await db
    .prepare("SELECT COUNT(*) AS n FROM client_deliveries WHERE user_id = ?1 AND delivered_at >= ?2")
    .bind(user.id, Date.now() - 7 * 86400_000)
    .first<{ n: number }>();
  const total = await db
    .prepare("SELECT COUNT(*) AS n FROM client_deliveries WHERE user_id = ?1")
    .bind(user.id)
    .first<{ n: number }>();

  const pendingOrder = await db
    .prepare(
      `SELECT o.id, o.reference, o.amount_dzd, o.plan_id, o.status, o.risk_flag
       FROM payment_orders o WHERE o.user_id = ?1 AND o.status IN ('pending','submitted')
       ORDER BY o.created_at DESC LIMIT 1`
    )
    .bind(user.id)
    .first<{ id: string; reference: string; amount_dzd: number; plan_id: string; status: string; risk_flag: number }>();

  return c.json({
    user,
    subscription: sub ? { ...sub, plan_name: plan?.name, price: plan?.priceDzd } : null,
    profile: profile ? { setup_done: !!profile.setup_done, profession_id: profile.profession_id, profession_label: profile.profession_id ? professionById(profile.profession_id)?.label ?? null : null } : null,
    usage: { week: week?.n ?? 0, total: total?.n ?? 0 },
    pending_order: pendingOrder ?? null,
  });
});
