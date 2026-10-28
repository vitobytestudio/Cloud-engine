// ——— الأفاق: 24 ساعة ثم يختفي ———
import type { Env, Session } from "../env";
import { tierRank, getOwnerId } from "../lib/tiers";
import { rateLimit } from "../lib/rate";

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });

type StoryRow = {
  id: string; user_id: string; playback_url: string; thumbnail_url: string;
  caption: string; created_at: string; expires_at: string;
  username: string; full_name: string; badge_tier: string; avatar_color: string;
};

export async function list(env: Env, s: Session): Promise<Response> {
  const rows = await env.DB.prepare(
    `SELECT s.id, s.user_id, s.playback_url, s.thumbnail_url, s.caption, s.created_at, s.expires_at,
            u.username, u.full_name, u.badge_tier, u.avatar_color
     FROM stories s JOIN users u ON u.id=s.user_id
     WHERE s.expires_at > datetime('now') ORDER BY s.created_at DESC LIMIT 40`
  ).all<StoryRow>();
  let viewed = new Set<string>();
  if (s.userId) {
    const v = await env.DB.prepare(
      `SELECT sv.story_id FROM story_views sv JOIN stories st ON st.id=sv.story_id
       WHERE sv.viewer_id=? AND st.expires_at > datetime('now')`
    ).bind(s.userId).all<{ story_id: string }>();
    viewed = new Set((v.results ?? []).map((r) => r.story_id));
  }
  const groups = new Map<string, { user: Record<string, unknown>; mine?: boolean; items: Array<Record<string, unknown>>; all_seen: boolean }>();
  for (const r of rows.results ?? []) {
    const g = groups.get(r.user_id) ?? {
      user: { id: r.user_id, username: r.username, full_name: r.full_name, badge_tier: r.badge_tier, avatar_color: r.avatar_color },
      mine: r.user_id === s.userId,
      items: [], all_seen: true,
    };
    const seen = viewed.has(r.id);
    g.items.push({ id: r.id, playback_url: r.playback_url, thumbnail_url: r.thumbnail_url, caption: r.caption, seen });
    if (!seen) g.all_seen = false;
    groups.set(r.user_id, g);
  }
  const ownerIdS = await getOwnerId(env);
  const arr = Array.from(groups.values()).sort((a, b) => {
    const ra = ownerIdS && a.user.id === ownerIdS ? 0 : tierRank((a.user as { badge_tier?: string }).badge_tier);
    const rb = ownerIdS && b.user.id === ownerIdS ? 0 : tierRank((b.user as { badge_tier?: string }).badge_tier);
    return ra - rb;
  });
  return json({ groups: arr });
}

export async function view(_req: Request, env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  if (!s.userId) return json({ ok: false }, 200);
  await env.DB.prepare("INSERT OR IGNORE INTO story_views (story_id,viewer_id) VALUES (?,?)").bind(p.id, s.userId).run();
  return json({ ok: true });
}

export async function del(req: Request, env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  if (!s.userId || !s.csrf) return json({ error: "auth_required" }, 401);
  const own = await env.DB.prepare("SELECT id FROM stories WHERE id=? AND user_id=?").bind(p.id, s.userId).first();
  if (!own) return json({ error: "not_found" }, 404);
  await env.DB.prepare("DELETE FROM story_views WHERE story_id=?").bind(p.id).run();
  await env.DB.prepare("DELETE FROM stories WHERE id=?").bind(p.id).run();
  return json({ ok: true, deleted: true });
}

export async function create(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  if (!(await rateLimit(env, `story:${s.userId}`, 8, 3600))) return json({ error: "too_many" }, 429);
  const b = (await req.json().catch(() => ({}))) as { media_id?: string; caption?: string; media_type?: string };
  const up = await env.DB.prepare("SELECT user_id, ready, purpose FROM pending_uploads WHERE media_id=?")
    .bind(b.media_id ?? "").first<{ user_id: string; ready: number; purpose: string }>();
  if (!up || up.user_id !== s.userId || !up.ready) return json({ error: "media_not_ready" }, 400);
  const id = `s-${crypto.randomUUID().slice(0, 12)}`;
  const isImage = (b.media_type ?? "VIDEO") === "IMAGE";
  await env.DB.prepare(
    "INSERT INTO stories (id,user_id,media_id,playback_url,media_type,caption,expires_at) VALUES (?,?,?,?,?,?,datetime('now','+24 hours'))"
  ).bind(id, s.userId, b.media_id, `/media/${b.media_id}`, isImage ? "IMAGE" : "VIDEO", (b.caption ?? "").slice(0, 200)).run();
  return json({ ok: true, id }, 201);
}
