// ——— الملفات الشخصية حسب القطاع + إنشاء المنشورات ———
import type { Env, Session } from "../env";
import { GIFT_CENTS, GIFT_DAYS, GIFT_MIN_POSTS, getOwnerId } from "../lib/tiers";
import { rateLimit } from "../lib/rate";

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });

export async function createPost(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  if (!(await rateLimit(env, `post:${s.userId}`, 6, 3600))) return json({ error: "too_many" }, 429);
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const title = (b.title ?? "").trim();
  const cat = b.category_tag ?? "";
  if (title.length < 4 || title.length > 120) return json({ error: "invalid_title" }, 400);
  if (!["SHOWCASE", "REVENUE_WIN", "PRODUCT_DEMO", "WORKFLOW_HACK", "CASE_STUDY"].includes(cat))
    return json({ error: "invalid_category" }, 400);
  const art = b.artifact_type ?? "";
  if (art && !["GITHUB_REPO", "FIGMA_FILE", "STORE_LINK", "AUDIT_DOC", "CASE_METRIC"].includes(art))
    return json({ error: "invalid_artifact" }, 400);
  const artifactUrl = (b.artifact_url ?? "").trim().slice(0, 300);

  // إثبات ملكية الوسيط: لا نشر إلا بوسيط رفعه هذا المستخدم نفسه
  let playback = "", thumb = "";
  let upCt = "video/mp4";
  if (b.media_id) {
    const up = await env.DB.prepare("SELECT user_id, ready, content_type FROM pending_uploads WHERE media_id=?")
      .bind(b.media_id).first<{ user_id: string; ready: number; content_type: string }>();
    if (!up || up.user_id !== s.userId || !up.ready) return json({ error: "media_not_owned" }, 403);
    upCt = (up.content_type ?? upCt).toLowerCase();
    playback = `/media/${b.media_id}`;
  }
  if (!playback) return json({ error: "media_required" }, 400);
  const mediaKind = b.media_kind === "IMAGE" ? "IMAGE" : "VIDEO";
  if (mediaKind === "IMAGE" && !upCt.startsWith("image/")) return json({ error: "not_an_image" }, 400);
  if (mediaKind === "IMAGE") thumb = playback;
  if (b.thumbnail_media_id) {
    const t = await env.DB.prepare("SELECT user_id, ready FROM pending_uploads WHERE media_id=?")
      .bind(b.thumbnail_media_id).first<{ user_id: string; ready: number }>();
    if (t && t.user_id === s.userId && t.ready) thumb = `/media/${b.thumbnail_media_id}`;
  }

  const id = `p-${crypto.randomUUID().slice(0, 12)}`;
  await env.DB.prepare(
    `INSERT INTO posts (id,user_id,media_id,playback_url,thumbnail_url,media_kind,title,description,category_tag,artifact_type,artifact_url)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(id, s.userId, b.media_id ?? "", playback, thumb, mediaKind, title, (b.description ?? "").slice(0, 600),
    cat, art || null, artifactUrl).run();

  // ——— v0.10-B: هدية NEXUS — 150€ رصيد داخلي ملك المستخدم بعد أول منشرين (ينتهي بعد 90 يوماً) ———
  let giftGranted = false;
  const cnt = await env.DB.prepare("SELECT COUNT(*) AS c FROM posts WHERE user_id=?").bind(s.userId).first<{ c: number }>();
  const hasGrant = await env.DB.prepare("SELECT 1 AS x FROM credit_grants WHERE user_id=? AND source='WELCOME_GIFT' LIMIT 1")
    .bind(s.userId).first();
  if ((cnt?.c ?? 0) >= 2 && !hasGrant) {
    await env.DB.prepare(
      "INSERT INTO credit_grants (id,user_id,amount_cents,remaining_cents,source,expires_at) VALUES (?,?,?,?, 'WELCOME_GIFT', datetime('now', ?))"
    ).bind(`cg-${crypto.randomUUID().slice(0, 12)}`, s.userId, GIFT_CENTS, GIFT_CENTS, `+${GIFT_DAYS} days`).run();
    await env.DB.prepare("INSERT INTO notifications (id,user_id,kind,ref_type,ref_id) VALUES (?,?,?,?,?)")
      .bind(`n-gift-${crypto.randomUUID().slice(0, 10)}`, s.userId, "gift", "wallet", String(GIFT_CENTS)).run();
    giftGranted = true;
  }
  return json({ ok: true, id, gift_granted: giftGranted }, 201);
}

export async function profile(env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  const u = await env.DB.prepare(
    `SELECT id,username,full_name,sector,badge_tier,country_code,avatar_color,bio,reputation_score,company_name,portfolio_website,created_at
     FROM users WHERE username=?`
  ).bind(p.username).first();
  if (!u) return json({ error: "not_found" }, 404);
  const uid = (u as { id: string }).id;
  const posts = await env.DB.prepare(
    `SELECT id,playback_url,thumbnail_url,title,description,category_tag,artifact_type,artifact_url,
            views_count,likes_count,saves_count,created_at,is_boosted
     FROM posts WHERE user_id=? AND quarantined=0 ORDER BY created_at DESC LIMIT 30`
  ).bind(uid).all();
  const products = await env.DB.prepare(
    "SELECT id,title,price_cents,currency,inventory_count,sample_available FROM merchant_products WHERE user_id=?"
  ).bind(uid).all();
  const services = await env.DB.prepare(
    "SELECT id,service_title,starting_price_cents,rate_unit,delivery_days FROM freelancer_services WHERE user_id=?"
  ).bind(uid).all();
  const isSelf = s.userId === uid;
  const rankRow = await env.DB.prepare("SELECT COUNT(*) AS c FROM users WHERE created_at <= (SELECT created_at FROM users WHERE id=?)").bind(uid).first<{ c: number }>();
  const founding = (rankRow?.c ?? 999) <= 100;
  const conv = s.userId
    ? await env.DB.prepare(
        "SELECT id FROM conversations WHERE (participant_one=? AND participant_two=?) OR (participant_one=? AND participant_two=?)"
      ).bind(s.userId, uid, uid, s.userId).first<{ id: string }>()
    : null;
    const followers = await env.DB.prepare("SELECT COUNT(*) AS c FROM follows WHERE followee_id=?").bind(uid).first<{ c: number }>();
  const following = await env.DB.prepare("SELECT COUNT(*) AS c FROM follows WHERE follower_id=?").bind(uid).first<{ c: number }>();
  const isFollowing = s.userId
    ? await env.DB.prepare("SELECT 1 AS x FROM follows WHERE follower_id=? AND followee_id=?").bind(s.userId, uid).first()
    : null;
  const ownerId = await getOwnerId(env);
  return json({ user: u, posts: posts.results ?? [], products: products.results ?? [], services: services.results ?? [],
    conversation_id: conv?.id ?? null, is_self: isSelf,
    followers_count: followers?.c ?? 0, following_count: following?.c ?? 0, is_following: !!isFollowing, founding,
    is_owner: ownerId === uid });
}
