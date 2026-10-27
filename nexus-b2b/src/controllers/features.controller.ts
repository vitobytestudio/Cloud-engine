// ——— الميزات المتقدمة: تحليلات + بحث + إشعارات + متابعة + عينات (بوابات الباقات من الخادم) ———
import type { Env, Session } from "../env";
import { atLeast } from "../lib/tiers";

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });

export async function notify(env: Env, userId: string, actorId: string, kind: string, refType = "", refId = "") {
  if (userId === actorId) return;
  await env.DB.prepare(
    "INSERT INTO notifications (id,user_id,actor_id,kind,ref_type,ref_id) VALUES (?,?,?,?,?,?)"
  ).bind(`n-${crypto.randomUUID().slice(0, 12)}`, userId, actorId, kind, refType, refId).run();
}

const badgeOf = async (env: Env, userId: string) =>
  (await env.DB.prepare("SELECT badge_tier FROM users WHERE id=?").bind(userId).first<{ badge_tier: string }>())?.badge_tier ?? "FREE";

// ——— تحليلات المؤلف: باقة زرقاء فأعلى ———
export async function analytics(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const tier = await badgeOf(env, s.userId);
  if (!atLeast(tier, "PRO_TALENT")) return json({ error: "tier_required", required: "PRO_TALENT", tier }, 403);
  const totals = await env.DB.prepare(
    "SELECT COALESCE(SUM(views_count),0) v, COALESCE(SUM(likes_count),0) l, COALESCE(SUM(saves_count),0) sv, COUNT(*) c FROM posts WHERE user_id=? AND quarantined=0"
  ).bind(s.userId).first<{ v: number; l: number; sv: number; c: number }>();
  const series = await env.DB.prepare(
    `SELECT day, SUM(views) v, SUM(likes) l FROM post_stats_daily
     WHERE day >= date('now','-13 days') AND post_id IN (SELECT id FROM posts WHERE user_id=?)
     GROUP BY day ORDER BY day`
  ).bind(s.userId).all();
  const top = await env.DB.prepare(
    "SELECT id,title,thumbnail_url,views_count,likes_count,saves_count FROM posts WHERE user_id=? AND quarantined=0 ORDER BY views_count DESC LIMIT 5"
  ).bind(s.userId).all();
  const views = totals?.v ?? 0;
  const engage = views ? Math.round((((totals?.l ?? 0) + (totals?.sv ?? 0)) / views) * 1000) / 10 : 0;
  return json({ tier, totals: { views, likes: totals?.l ?? 0, saves: totals?.sv ?? 0, posts: totals?.c ?? 0, engagement: engage }, series: series.results ?? [], top: top.results ?? [] });
}

// ——— بحث عالمي: المؤسسون المميزون أولاً (قيمة الباقة) ———
export async function search(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 40);
  if (q.length < 2) return json({ users: [], posts: [] });
  const like = `%${q.replace(/[%_]/g, "")}%`;
  const users = await env.DB.prepare(
    `SELECT username,full_name,sector,badge_tier,avatar_color,company_name,reputation_score FROM users
     WHERE full_name LIKE ?1 OR username LIKE ?1 OR company_name LIKE ?1
     ORDER BY CASE badge_tier WHEN 'ENTERPRISE_GOLD' THEN 0 WHEN 'MERCHANT_EMERALD' THEN 1 WHEN 'PRO_TALENT' THEN 2 ELSE 3 END, reputation_score DESC
     LIMIT 8`
  ).bind(like).all();
  const posts = await env.DB.prepare(
    `SELECT p.id,p.title,p.thumbnail_url,p.views_count,p.likes_count,p.category_tag,u.username,u.full_name,u.badge_tier
     FROM posts p JOIN users u ON u.id=p.user_id
     WHERE (p.title LIKE ?1 OR p.description LIKE ?1) AND p.quarantined=0
     ORDER BY p.is_boosted DESC, p.views_count DESC LIMIT 10`
  ).bind(like).all();
  return json({ users: users.results ?? [], posts: posts.results ?? [] });
}

export async function notifications(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const items = await env.DB.prepare(
    `SELECT n.id,n.kind,n.ref_type,n.ref_id,n.is_read,n.created_at,
            a.username AS actor_username, a.full_name AS actor_name, a.avatar_color AS actor_color
     FROM notifications n LEFT JOIN users a ON a.id=n.actor_id
     WHERE n.user_id=? ORDER BY n.created_at DESC LIMIT 30`
  ).bind(s.userId).all();
  const unread = await env.DB.prepare("SELECT COUNT(*) AS c FROM notifications WHERE user_id=? AND is_read=0")
    .bind(s.userId).first<{ c: number }>();
  return json({ items: items.results ?? [], unread: unread?.c ?? 0 });
}

export async function readAll(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  await env.DB.prepare("UPDATE notifications SET is_read=1 WHERE user_id=?").bind(s.userId).run();
  return json({ ok: true });
}

// ——— المتابعة ———
export async function follow(req: Request, env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  if (!s.userId || !s.csrf) return json({ error: "auth_required" }, 401);
  const target = await env.DB.prepare("SELECT id FROM users WHERE username=?").bind(p.username).first<{ id: string }>();
  if (!target) return json({ error: "not_found" }, 404);
  if (target.id === s.userId) return json({ error: "self" }, 400);
  const ex = await env.DB.prepare("SELECT 1 AS x FROM follows WHERE follower_id=? AND followee_id=?").bind(s.userId, target.id).first();
  if (ex) {
    await env.DB.prepare("DELETE FROM follows WHERE follower_id=? AND followee_id=?").bind(s.userId, target.id).run();
    return json({ ok: true, following: false });
  }
  await env.DB.prepare("INSERT OR IGNORE INTO follows (follower_id,followee_id) VALUES (?,?)").bind(s.userId, target.id).run();
  await notify(env, target.id, s.userId, "follow", "user", s.userId);
  return json({ ok: true, following: true });
}

// ——— طلبات العينات: الطلب متاح للجميع، الاستلام والإدارة زمردية فأعلى ———
export async function requestSample(req: Request, env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  if (!s.userId || !s.csrf) return json({ error: "auth_required" }, 401);
  const prod = await env.DB.prepare("SELECT id,user_id,sample_available FROM merchant_products WHERE id=?").bind(p.id).first<{ id: string; user_id: string; sample_available: number }>();
  if (!prod) return json({ error: "not_found" }, 404);
  if (prod.user_id === s.userId) return json({ error: "own_product" }, 400);
  if (!prod.sample_available) return json({ error: "no_sample" }, 400);
  const dup = await env.DB.prepare(
    "SELECT 1 AS x FROM sample_requests WHERE product_id=? AND requester_id=? AND status='PENDING'"
  ).bind(prod.id, s.userId).first();
  if (dup) return json({ error: "already_requested" }, 409);
  await env.DB.prepare(
    "INSERT INTO sample_requests (id,product_id,merchant_id,requester_id,note) VALUES (?,?,?,?,?)"
  ).bind(`sr-${crypto.randomUUID().slice(0, 10)}`, prod.id, prod.user_id, s.userId, "").run();
  await notify(env, prod.user_id, s.userId, "sample", "product", prod.id);
  return json({ ok: true }, 201);
}

export async function incomingSamples(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const tier = await badgeOf(env, s.userId);
  if (!atLeast(tier, "MERCHANT_EMERALD")) return json({ locked: true, tier });
  const rows = await env.DB.prepare(
    `SELECT sr.id,sr.status,sr.created_at,sr.qty,mp.title AS product_title,mp.price_cents,
             rq.username AS requester_username, rq.full_name AS requester_name, rq.avatar_color AS requester_color, rq.sector AS requester_sector
     FROM sample_requests sr JOIN merchant_products mp ON mp.id=sr.product_id JOIN users rq ON rq.id=sr.requester_id
     WHERE sr.merchant_id=? ORDER BY sr.created_at DESC LIMIT 20`
  ).bind(s.userId).all();
  return json({ locked: false, items: rows.results ?? [] });
}

export async function sampleAction(req: Request, env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  if (!s.userId || !s.csrf) return json({ error: "auth_required" }, 401);
  const tier = await badgeOf(env, s.userId);
  if (!atLeast(tier, "MERCHANT_EMERALD")) return json({ error: "tier_required", required: "MERCHANT_EMERALD" }, 403);
  const b = (await req.json().catch(() => ({}))) as { action?: string };
  const status = b.action === "accept" ? "ACCEPTED" : b.action === "decline" ? "DECLINED" : null;
  if (!status) return json({ error: "invalid_action" }, 400);
  const row = await env.DB.prepare("UPDATE sample_requests SET status=? WHERE id=? AND merchant_id=? RETURNING requester_id, product_id")
    .bind(status, p.id, s.userId).first<{ requester_id: string; product_id: string }>();
  if (!row) return json({ error: "not_found" }, 404);
  await notify(env, row.requester_id, s.userId, status === "ACCEPTED" ? "sample_ok" : "sample_no", "product", row.product_id);
  return json({ ok: true, status });
}
