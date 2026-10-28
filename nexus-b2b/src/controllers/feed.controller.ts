// ——— محرك الفيد التنفيذي: نقاط النية + تضاؤل زمني + طبقة التعزيز المنفصلة ———
import type { Env, Session } from "../env";
import { notify } from "./features.controller";
import { tierRank, getOwnerId } from "../lib/tiers";

type FeedPost = {
  id: string; user_id: string; playback_url: string; thumbnail_url: string;
  title: string; description: string; category_tag: string;
  artifact_type: string | null; artifact_url: string;
  views_count: number; likes_count: number; saves_count: number; downvotes_count: number;
  is_boosted: number; boost_expires_at: string | null; created_at: string;
  quarantined: number;
  username: string; full_name: string; sector: string; badge_tier: string;
  avatar_color: string; reputation_score: number; company_name: string;
};

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });

const WEIGHT: Record<string, number> = {
  REVENUE_WIN: 1.5, CASE_STUDY: 1.3, PRODUCT_DEMO: 1.2, WORKFLOW_HACK: 1.15, SHOWCASE: 1.0,
};

function score(p: FeedPost, viewerSector: string | null): number {
  const ageH = Math.max(0, (Date.now() - Date.parse(p.created_at.replace(" ", "T") + "Z")) / 3_600_000);
  const decay = Math.pow(0.5, ageH / 36);
  const engage = 1 + Math.log1p(p.likes_count + 2 * p.saves_count - 0.5 * p.downvotes_count);
  const intent = WEIGHT[p.category_tag] ?? 1;
  const rep = (p.reputation_score ?? 100) / 100;
  const sectorMatch = viewerSector && p.sector === viewerSector ? 1.1 : 1;
  return intent * engage * decay * rep * sectorMatch;
}

export async function postDetail(req: Request, env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  const row = await env.DB.prepare(
    `SELECT p.id, p.user_id, p.playback_url, p.thumbnail_url, p.title, p.description, p.category_tag,
            p.artifact_type, p.artifact_url, p.views_count, p.likes_count, p.saves_count, p.is_boosted, p.created_at, p.media_kind,
            u.username, u.full_name, u.sector, u.badge_tier, u.avatar_color, u.company_name
     FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id=? AND p.quarantined=0`
  ).bind(p.id).first<Record<string, unknown>>();
  if (!row) return json({ error: "not_found" }, 404);
  let liked = 0, saved = 0;
  if (s.userId) {
    liked = (await env.DB.prepare("SELECT 1 AS x FROM post_votes WHERE post_id=? AND user_id=? AND vote=1").bind(p.id, s.userId).first()) ? 1 : 0;
    saved = (await env.DB.prepare("SELECT 1 AS x FROM post_saves WHERE post_id=? AND user_id=?").bind(p.id, s.userId).first()) ? 1 : 0;
  }
  return json({ ...row, liked, saved, is_self: s.userId === row.user_id });
}

export async function deletePost(req: Request, env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  if (!s.userId || !s.csrf) return json({ error: "auth_required" }, 401);
  const own = await env.DB.prepare("SELECT id FROM posts WHERE id=? AND user_id=?").bind(p.id, s.userId).first();
  if (!own) return json({ error: "not_found" }, 404);
  await env.DB.prepare("DELETE FROM post_votes WHERE post_id=?").bind(p.id).run();
  await env.DB.prepare("DELETE FROM post_saves WHERE post_id=?").bind(p.id).run();
  await env.DB.prepare("DELETE FROM boosts WHERE post_id=?").bind(p.id).run();
  await env.DB.prepare("DELETE FROM post_stats_daily WHERE post_id=?").bind(p.id).run();
  await env.DB.prepare("DELETE FROM posts WHERE id=?").bind(p.id).run();
  return json({ ok: true, deleted: true });
}

export async function gallery(req: Request, env: Env, s: Session): Promise<Response> {
  const q = await env.DB.prepare(
    `SELECT p.id, p.user_id, p.playback_url, p.thumbnail_url, p.title, p.category_tag, p.views_count, p.likes_count, p.created_at,
            u.username, u.full_name, u.avatar_color, u.badge_tier
     FROM posts p JOIN users u ON u.id = p.user_id
     WHERE p.quarantined=0 AND p.media_kind='IMAGE'
     ORDER BY CASE WHEN p.user_id=(SELECT value FROM app_config WHERE key='owner_user_id') THEN 0 ELSE 1 END, p.created_at DESC LIMIT 36`
  ).all();
  return json({ items: q.results ?? [] });
}

function reasonFor(p: FeedPost, viewerSector: string | null): string {
  if (p.is_boosted) return "boost";
  if (viewerSector && p.sector === viewerSector) return "sector";
  const ageH = (Date.now() - Date.parse(p.created_at.replace(" ", "T") + "Z")) / 3_600_000;
  if (ageH < 8) return "fresh";
  return "top";
}

export async function feed(req: Request, env: Env, s: Session): Promise<Response> {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? "";
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0") || 0);
  const limit = Math.min(10, parseInt(url.searchParams.get("limit") ?? "6") || 6);

  let viewerSector: string | null = null;
  if (s.userId) {
    const v = await env.DB.prepare("SELECT sector FROM users WHERE id=?").bind(s.userId).first<{ sector: string }>();
    viewerSector = v?.sector ?? null;
  }

  const catClause = category && category !== "ALL" ? "AND p.category_tag=? " : "";
  const q = await env.DB.prepare(
    `SELECT p.*, u.username,u.full_name,u.sector,u.badge_tier,u.avatar_color,u.reputation_score,u.company_name
     FROM posts p JOIN users u ON u.id=p.user_id
     WHERE p.quarantined=0 AND (p.media_kind IS NULL OR p.media_kind='VIDEO') ${catClause}
     ORDER BY p.created_at DESC LIMIT 80`
  ).bind(...(category && category !== "ALL" ? [category] : [])).all<FeedPost>();

  const nowIso = new Date().toISOString().slice(0, 19).replace("T", " ");
  const all = (q.results ?? []).map((p) => ({
    ...p,
    boost_active: !!p.is_boosted && !!p.boost_expires_at && p.boost_expires_at > nowIso,
    is_self: !!s.userId && s.userId === p.user_id,
  }));

  // ——— v0.10-B: الأولوية العالمية — المالك أول عالمياً دائماً ثم الباقات ———
  const ownerId = await getOwnerId(env);
  const rankOf = (p: FeedPost) => (ownerId && p.user_id === ownerId ? 0 : tierRank(p.badge_tier));
  const organic = all
    .filter((p) => !p.boost_active && !(ownerId && p.user_id === ownerId))
    .sort((a, b) => rankOf(a) - rankOf(b) || score(b, viewerSector) - score(a, viewerSector));
  const boosted = all.filter((p) => p.boost_active && !(ownerId && p.user_id === ownerId));
  const ownerPost = ownerId ? all.find((p) => p.user_id === ownerId) : undefined;

  // طبقة التعزيز: أعلى الصفحة الأولى فقط (≤1 لكل 8 لمنع الإرهاق)
  let items: Array<FeedPost & { boost_active: boolean; reason: string }> = [];
  if (offset === 0 && ownerPost) items.push({ ...ownerPost, reason: "owner" });
  if (offset === 0 && boosted.length) items.push({ ...boosted[0], reason: "boost" });
  const merged = [...items, ...organic.map((p) => ({ ...p, reason: reasonFor(p, viewerSector) }))];
  items = merged.slice(offset, offset + limit);

  return json({
    items: items.map(({ quarantined, ...rest }) => rest),
    next_offset: offset + items.length,
    has_more: merged.length > offset + items.length,
  });
}

export async function vote(req: Request, env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  if (!s.userId || !s.csrf) return json({ error: "auth_required" }, 401);
  const b = (await req.json().catch(() => ({}))) as { vote?: number };
  const v = b.vote === 1 ? 1 : b.vote === -1 ? -1 : 0;
  const postId = p.id;
  const post = await env.DB.prepare("SELECT id, user_id FROM posts WHERE id=? AND quarantined=0").bind(postId).first<{ id: string; user_id: string }>();
  if (!post) return json({ error: "not_found" }, 404);
  if (v === 1) await notify(env, post.user_id, s.userId, "like", "post", postId);
  // الفرق التلقائي: نحفظ تأثير صوت هذا المستخدم فقط على العدادات المخزنة
  // (إعادة العد من الصفر تمحو أعداد الإعجاب التاريخية للبيانات التجريبية)
  const prev = await env.DB.prepare("SELECT vote FROM post_votes WHERE post_id=? AND user_id=?")
    .bind(postId, s.userId).first<{ vote: number }>();
  const prevV = prev?.vote ?? 0;
  if (prevV === v) {
    const cur = await env.DB.prepare("SELECT likes_count, downvotes_count FROM posts WHERE id=?").bind(postId).first<{ likes_count: number; downvotes_count: number }>();
    return json({ ok: true, likes: cur?.likes_count ?? 0, downvotes: cur?.downvotes_count ?? 0 });
  }
  if (v === 0) await env.DB.prepare("DELETE FROM post_votes WHERE post_id=? AND user_id=?").bind(postId, s.userId).run();
  else await env.DB.prepare(
    "INSERT INTO post_votes (post_id,user_id,vote) VALUES (?,?,?) ON CONFLICT(post_id,user_id) DO UPDATE SET vote=excluded.vote"
  ).bind(postId, s.userId, v).run();
  const dLike = (v === 1 ? 1 : 0) - (prevV === 1 ? 1 : 0);
  const dDown = (v === -1 ? 1 : 0) - (prevV === -1 ? 1 : 0);
  const row = await env.DB.prepare(
    "UPDATE posts SET likes_count=MAX(0,likes_count+?), downvotes_count=MAX(0,downvotes_count+?) WHERE id=? RETURNING likes_count, downvotes_count"
  ).bind(dLike, dDown, postId).first<{ likes_count: number; downvotes_count: number }>();
  return json({ ok: true, likes: row?.likes_count ?? 0, downvotes: row?.downvotes_count ?? 0 });
}

export async function save(req: Request, env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const postId = p.id;
  const ex = await env.DB.prepare("SELECT 1 AS x FROM post_saves WHERE post_id=? AND user_id=?").bind(postId, s.userId).first();
  if (ex) {
    await env.DB.prepare("DELETE FROM post_saves WHERE post_id=? AND user_id=?").bind(postId, s.userId).run();
    await env.DB.prepare("UPDATE posts SET saves_count=MAX(0,saves_count-1) WHERE id=?").bind(postId).run();
    return json({ ok: true, saved: false });
  }
  await env.DB.prepare("INSERT OR IGNORE INTO post_saves (post_id,user_id) VALUES (?,?)").bind(postId, s.userId).run();
  await env.DB.prepare("UPDATE posts SET saves_count=saves_count+1 WHERE id=?").bind(postId).run();
  const owner = await env.DB.prepare("SELECT user_id FROM posts WHERE id=?").bind(postId).first<{ user_id: string }>();
  if (owner) await notify(env, owner.user_id, s.userId, "save", "post", postId);
  return json({ ok: true, saved: true });
}

export async function view(req: Request, env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  const postId = p.id;
  await env.DB.prepare(
    "INSERT INTO post_stats_daily (post_id,day,views) VALUES (?,date('now'),1) ON CONFLICT(post_id,day) DO UPDATE SET views=views+1"
  ).bind(postId).run();
  const r = await env.DB.prepare("SELECT views_count, downvotes_count FROM posts WHERE id=?").bind(postId)
    .first<{ views_count: number; downvotes_count: number }>();
  if (!r) return json({ error: "not_found" }, 404);
  const views = r.views_count + 1;
  await env.DB.prepare("UPDATE posts SET views_count=? WHERE id=?").bind(views, postId).run();
  // بوابة مكافحة المحتوى الفارغ: 3 أصوات سلبية خلال أول 20 مشاهدة → عزل من الفيد العام
  if (views <= 20 && r.downvotes_count >= 3) {
    await env.DB.prepare("UPDATE posts SET quarantined=1 WHERE id=?").bind(postId).run();
  }
  // محاسبة انطباعات التعزيز
  const boost = await env.DB.prepare(
    "SELECT id, impressions_bought, impressions_delivered FROM boosts WHERE post_id=? AND status='ACTIVE'"
  ).bind(postId).first<{ id: string; impressions_bought: number; impressions_delivered: number }>();
  if (boost && boost.impressions_delivered < boost.impressions_bought) {
    const d = boost.impressions_delivered + 1;
    const done = d >= boost.impressions_bought;
    await env.DB.prepare("UPDATE boosts SET impressions_delivered=? WHERE id=?").bind(d, boost.id).run();
    if (done) await env.DB.prepare("UPDATE boosts SET status='COMPLETED' WHERE id=?").bind(boost.id).run();
  }
  return json({ ok: true });
}
