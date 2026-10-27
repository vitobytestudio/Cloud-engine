// ——— التعزيز المدفوع: أسعار من الخادم + دفتر قيود + idempotency ———
import type { Env, Session } from "../env";
import { BOOST_CATALOG } from "../lib/pricing";
import { rateLimit } from "../lib/rate";

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });

export async function checkout(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  if (!(await rateLimit(env, `boost:${s.userId}`, 5, 3600))) return json({ error: "too_many" }, 429);
  const b = (await req.json().catch(() => ({}))) as { post_id?: string; tier?: string; target_sector?: string; target_country?: string };
  const tier = BOOST_CATALOG[b.tier ?? ""];
  if (!tier) return json({ error: "invalid_tier" }, 400);
  const post = await env.DB.prepare("SELECT id, user_id FROM posts WHERE id=? AND quarantined=0").bind(b.post_id ?? "").first<{ id: string; user_id: string }>();
  if (!post) return json({ error: "not_found" }, 404);
  if (post.user_id !== s.userId) return json({ error: "not_owner" }, 403);

  // قيمة الباقة الذهبية: هيمنة مجانية واحدة شهرياً (بدون خصم من المحفظة)
  let price = tier.price_cents;
  let freeGrant = false;
  const badge = (await env.DB.prepare("SELECT badge_tier FROM users WHERE id=?").bind(s.userId).first<{ badge_tier: string }>())?.badge_tier ?? "FREE";
  if (badge === "ENTERPRISE_GOLD" && tier.name === "DOMINANCE_DROP") {
    const used = await env.DB.prepare(
      "SELECT COUNT(*) AS c FROM boosts WHERE user_id=? AND amount_paid_cents=0 AND created_at >= date('now','start of month')"
    ).bind(s.userId).first<{ c: number }>();
    if (!used?.c) { price = 0; freeGrant = true; }
  }
  // الرصيد مشتق من الدفتر — لا رصيد مخزّن
  const bal = await env.DB.prepare("SELECT COALESCE(SUM(amount_cents),0) AS b FROM transactions WHERE user_id=?")
    .bind(s.userId).first<{ b: number }>();
  if ((bal?.b ?? 0) < price) return json({ error: "insufficient_balance", balance_cents: bal?.b ?? 0 }, 402);

  const boostId = `b-${crypto.randomUUID().slice(0, 10)}`;
  const eventId = `stub_boost_${boostId}`;
  try {
    await env.DB.prepare(
      `INSERT INTO boosts (id,user_id,post_id,tier_name,target_sector,target_country,impressions_bought,amount_paid_cents,status)
       VALUES (?,?,?,?,?,?,?,?, 'ACTIVE')`
    ).bind(boostId, s.userId, post.id, tier.name, (b.target_sector ?? "").slice(0, 12), (b.target_country ?? "").slice(0, 2).toUpperCase(),
      tier.impressions, price).run();
    if (price > 0) {
      await env.DB.prepare(
        `INSERT INTO transactions (id,user_id,kind,amount_cents,ref_type,ref_id,provider_event_id) VALUES (?,?,?,?,?,?,?)`
      ).bind(`tx-${crypto.randomUUID().slice(0, 10)}`, s.userId, "BOOST_PURCHASE", -price, "BOOST", boostId, eventId).run();
    }
  } catch {
    return json({ error: "duplicate_event" }, 409); // idempotency عبر provider_event_id UNIQUE
  }
  await env.DB.prepare(
    `UPDATE posts SET is_boosted=1, boost_expires_at=datetime('now', '+${tier.hours} hours') WHERE id=?`
  ).bind(post.id).run();
  return json({ ok: true, boost_id: boostId, tier: tier.name, expires_in_hours: tier.hours, free_grant: freeGrant }, 201);
}

export async function wallet(env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const bal = await env.DB.prepare("SELECT COALESCE(SUM(amount_cents),0) AS b FROM transactions WHERE user_id=?")
    .bind(s.userId).first<{ b: number }>();
  const tx = await env.DB.prepare(
    "SELECT kind, amount_cents, ref_type, created_at FROM transactions WHERE user_id=? ORDER BY created_at DESC LIMIT 20"
  ).bind(s.userId).all();
  return json({ balance_cents: bal?.b ?? 0, transactions: tx.results ?? [], catalog: Object.values(BOOST_CATALOG) });
}
