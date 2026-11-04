// ——— NEXUS v1.0 — منصة اجتماعية للتجار والصنّاع الجزائريين — تصفير كامل، قلب أنستغرامي نقي ———
import type { Env, Session } from "./env";
import {
  json, id, now, esc, clip, parseCookies, getSession, createSession, sessionCookie, clearCookie,
  hex, serverHash, verifyHash, rl, isEmail, isUsername, isK0, isHttpsUrl,
} from "./lib";

type Route = { m: string; pat: string; h: (r: Request, e: Env, s: Session, p: Record<string, string>) => Promise<Response>; auth?: boolean };
const R: Route[] = [];
const route = (m: string, pat: string, h: Route["h"], o: Partial<Route> = {}) => R.push({ m, pat, h, ...o });
const bad = (err: string, status = 400) => json({ error: err }, status);
function matchPath(pat: string, path: string): Record<string, string> | null {
  const a = pat.split("/"), b = path.split("/");
  if (a.length !== b.length) return null;
  const out: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) out[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return out;
}

const DAY = 86400_000;
const publicUser = (u: any) => ({ username: u.username, name: u.name, bio: u.bio, avatar_url: u.avatar_url, store_url: u.store_url, category: u.category, verified: u.verified });

// ═══ الصحة ═══
route("GET", "/api/health", async () => json({ ok: true, v: "1.0.0", app: "nexus" }));

// ═══ المصادقة ═══
route("POST", "/api/auth/register", async (req, env) => {
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  if (!(await rl(env, `reg:${ip}`, 20, DAY))) return bad("too_many", 429);
  const b = (await req.json().catch(() => ({}))) as any;
  const email = clip(String(b.email ?? "").toLowerCase().trim(), 190);
  const k0 = String(b.k0 ?? "");
  const name = clip(String(b.name ?? "").trim(), 60);
  const username = clip(String(b.username ?? "").toLowerCase().trim(), 30);
  if (!isEmail(email)) return bad("invalid_email");
  if (!isK0(k0)) return bad("invalid_k0");
  if (name.length < 2) return bad("invalid_name");
  if (!isUsername(username)) return bad("invalid_username");
  if (await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first()) return bad("email_taken", 409);
  if (await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first()) return bad("username_taken", 409);
  const salt = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  const uid = id("u");
  await env.DB.prepare("INSERT INTO users (id, email, username, name, pass_hash, created_at) VALUES (?,?,?,?,?,?)")
    .bind(uid, email, username, name, await serverHash(k0, salt), now()).run();
  const s = await createSession(env, uid);
  return new Response(JSON.stringify({ ok: true, csrf: s.csrf, user: { username, name, bio: "", avatar_url: "", store_url: "", category: "", verified: 0 } }), {
    status: 201, headers: { "content-type": "application/json; charset=utf-8", "set-cookie": sessionCookie(s.token, false) },
  });
});

route("POST", "/api/auth/login", async (req, env) => {
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  if (!(await rl(env, `log:${ip}`, 30, 3600))) return bad("too_many", 429);
  const b = (await req.json().catch(() => ({}))) as any;
  const email = clip(String(b.email ?? "").toLowerCase().trim(), 190);
  const k0 = String(b.k0 ?? "");
  const u = await env.DB.prepare("SELECT id, username, name, bio, avatar_url, store_url, category, verified, banned, pass_hash FROM users WHERE email = ?").bind(email).first<any>();
  if (!u || u.banned || !(await verifyHash(k0, u.pass_hash))) return bad("invalid_credentials", 401);
  const s = await createSession(env, u.id);
  return new Response(JSON.stringify({ ok: true, csrf: s.csrf, user: { username: u.username, name: u.name, bio: u.bio, avatar_url: u.avatar_url, store_url: u.store_url, category: u.category, verified: u.verified } }), {
    status: 200, headers: { "content-type": "application/json; charset=utf-8", "set-cookie": sessionCookie(s.token, false) },
  });
});

route("POST", "/api/auth/logout", async (_req, env, s) => {
  if (!s) return json({ ok: true });
  const tok = parseCookies(_req)["nx_s"];
  if (tok) await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(tok).run();
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json", "set-cookie": clearCookie } });
});

route("GET", "/api/me", async (_r, env, s) => {
  if (!s) return json({ user: null });
  const u = await env.DB.prepare("SELECT username, name, bio, avatar_url, store_url, category, verified FROM users WHERE id = ?").bind(s.userId).first<any>();
  if (!u) return json({ user: null });
  const posts = await env.DB.prepare("SELECT COUNT(*) AS c FROM posts WHERE user_id = ? AND active = 1").bind(s.userId).first<any>();
  const followers = await env.DB.prepare("SELECT COUNT(*) AS c FROM follows WHERE followee_id = ?").bind(s.userId).first<any>();
  const following = await env.DB.prepare("SELECT COUNT(*) AS c FROM follows WHERE follower_id = ?").bind(s.userId).first<any>();
  return json({ user: u, csrf: s.csrf, counts: { posts: Number(posts?.c ?? 0), followers: Number(followers?.c ?? 0), following: Number(following?.c ?? 0) } });
});

// ═══ الملف الشخصي ═══
route("PUT", "/api/profile", async (req, env, s) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const b = (await req.json().catch(() => ({}))) as any;
  const cur = await env.DB.prepare("SELECT name, bio, avatar_url, store_url, category FROM users WHERE id = ?").bind(s.userId).first<any>();
  if (!cur) return bad("auth_required", 401);
  const name = b.name !== undefined ? clip(String(b.name).trim(), 60) : cur.name;
  if (name.length < 2) return bad("invalid_name");
  const bio = b.bio !== undefined ? clip(String(b.bio).trim(), 300) : cur.bio;
  const avatar = b.avatar_url !== undefined ? (isHttpsUrl(String(b.avatar_url ?? "")) ? String(b.avatar_url) : "") : cur.avatar_url;
  let store = cur.store_url;
  if (b.store_url !== undefined) {
    const v = String(b.store_url ?? "").trim();
    if (v && !isHttpsUrl(v)) return bad("invalid_url");
    store = clip(v, 300);
  }
  const category = b.category !== undefined ? clip(String(b.category).trim(), 30) : cur.category;
  await env.DB.prepare("UPDATE users SET name=?, bio=?, avatar_url=?, store_url=?, category=? WHERE id=?").bind(name, bio, avatar, store, category, s.userId).run();
  return json({ ok: true });
});

route("GET", "/api/users/:username", async (_r, env, s, p) => {
  const u = await env.DB.prepare("SELECT id, username, name, bio, avatar_url, store_url, category, verified, created_at FROM users WHERE username = ?").bind(p.username).first<any>();
  if (!u) return bad("not_found", 404);
  const posts = await env.DB.prepare("SELECT COUNT(*) AS c FROM posts WHERE user_id = ? AND active = 1").bind(u.id).first<any>();
  const followers = await env.DB.prepare("SELECT COUNT(*) AS c FROM follows WHERE followee_id = ?").bind(u.id).first<any>();
  const following = await env.DB.prepare("SELECT COUNT(*) AS c FROM follows WHERE follower_id = ?").bind(u.id).first<any>();
  const grid = await env.DB.prepare("SELECT id, image_url, caption, (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = posts.id) AS likes FROM posts WHERE user_id = ? AND active = 1 ORDER BY created_at DESC LIMIT 24").bind(u.id).all<any>();
  let following_me = false, me = false;
  if (s) {
    me = s.userId === u.id;
    following_me = !me && !!(await env.DB.prepare("SELECT 1 AS x FROM follows WHERE follower_id = ? AND followee_id = ?").bind(s.userId, u.id).first());
  }
  return json({ user: publicUser(u), counts: { posts: Number(posts?.c ?? 0), followers: Number(followers?.c ?? 0), following: Number(following?.c ?? 0) }, posts: grid.results ?? [], following_me, me });
});

// ═══ المنشورات ═══
route("POST", "/api/posts", async (req, env, s) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  if (!(await rl(env, `post:${s.userId}`, 20, DAY))) return bad("too_many", 429);
  const b = (await req.json().catch(() => ({}))) as any;
  const image = String(b.image_url ?? "").trim();
  if (!isHttpsUrl(image)) return bad("invalid_image");
  const caption = clip(String(b.caption ?? "").trim(), 500);
  const category = clip(String(b.category ?? "").trim(), 30);
  const pid = id("p");
  await env.DB.prepare("INSERT INTO posts (id, user_id, image_url, caption, category, created_at) VALUES (?,?,?,?,?,?)").bind(pid, s.userId, clip(image, 500), caption, category, now()).run();
  return json({ ok: true, id: pid }, 201);
});

route("GET", "/api/feed", async (req, env, s) => {
  if (!s) return bad("auth_required", 401);
  const offset = Math.max(0, Math.min(500, Number(new URL(req.url).searchParams.get("offset") ?? 0)));
  const { results } = await env.DB.prepare(
    `SELECT p.id, p.image_url, p.caption, p.category, p.created_at, u.username, u.name, u.avatar_url, u.verified,
      (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS likes,
      (SELECT COUNT(*) FROM post_comments c WHERE c.post_id = p.id) AS comments,
      EXISTS(SELECT 1 FROM post_likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS liked_by_me,
      EXISTS(SELECT 1 FROM post_saves sv WHERE sv.post_id = p.id AND sv.user_id = ?) AS saved_by_me
    FROM posts p JOIN users u ON u.id = p.user_id
    WHERE p.active = 1 AND (p.user_id = ? OR p.user_id IN (SELECT followee_id FROM follows WHERE follower_id = ?))
    ORDER BY p.created_at DESC LIMIT 12 OFFSET ?`
  ).bind(s.userId, s.userId, s.userId, s.userId, offset).all<any>();
  return json({ posts: results ?? [] });
});

route("GET", "/api/explore", async (req, env) => {
  const url = new URL(req.url);
  const cat = clip(url.searchParams.get("cat") ?? "", 30);
  const q = clip(url.searchParams.get("q") ?? "", 40).toLowerCase();
  const offset = Math.max(0, Math.min(500, Number(url.searchParams.get("offset") ?? 0)));
  let where = "p.active = 1";
  const binds: any[] = [];
  if (cat) { where += " AND p.category = ?"; binds.push(cat); }
  if (q) { where += " AND (LOWER(p.caption) LIKE ? OR LOWER(u.name) LIKE ? OR u.username LIKE ?)"; binds.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const { results } = await env.DB.prepare(
    `SELECT p.id, p.image_url, p.caption, p.category, p.created_at, u.username, u.name, u.verified,
      (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS likes
    FROM posts p JOIN users u ON u.id = p.user_id WHERE ${where}
    ORDER BY p.created_at DESC LIMIT 24 OFFSET ?`
  ).bind(...binds, offset).all<any>();
  return json({ posts: results ?? [] });
});

async function loadPost(env: Env, pid: string) {
  return env.DB.prepare(
    `SELECT p.*, u.username, u.name, u.avatar_url, u.verified,
      (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS likes,
      (SELECT COUNT(*) FROM post_comments c WHERE c.post_id = p.id) AS comments
    FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ? AND p.active = 1`
  ).bind(pid).first<any>();
}

route("GET", "/api/posts/:id", async (_r, env, s, p) => {
  const post = await loadPost(env, p.id);
  if (!post) return bad("not_found", 404);
  let liked_by_me = false, saved_by_me = false;
  if (s) {
    liked_by_me = !!(await env.DB.prepare("SELECT 1 AS x FROM post_likes WHERE post_id = ? AND user_id = ?").bind(p.id, s.userId).first());
    saved_by_me = !!(await env.DB.prepare("SELECT 1 AS x FROM post_saves WHERE post_id = ? AND user_id = ?").bind(p.id, s.userId).first());
  }
  return json({ post: { ...post, liked_by_me, saved_by_me } });
});

route("DELETE", "/api/posts/:id", async (req, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const post = await env.DB.prepare("SELECT user_id FROM posts WHERE id = ? AND active = 1").bind(p.id).first<any>();
  if (!post) return bad("not_found", 404);
  if (post.user_id !== s.userId) return bad("forbidden", 403);
  await env.DB.prepare("UPDATE posts SET active = 0 WHERE id = ?").bind(p.id).run();
  return json({ ok: true });
}, {});

// ═══ التفاعلات ═══
route("POST", "/api/posts/:id/like", async (req, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const post = await env.DB.prepare("SELECT id FROM posts WHERE id = ? AND active = 1").bind(p.id).first();
  if (!post) return bad("not_found", 404);
  if (await env.DB.prepare("SELECT 1 AS x FROM post_likes WHERE post_id = ? AND user_id = ?").bind(p.id, s.userId).first()) {
    const c0 = await env.DB.prepare("SELECT COUNT(*) AS c FROM post_likes WHERE post_id = ?").bind(p.id).first<any>();
    return json({ ok: true, liked: true, likes: Number(c0?.c ?? 0) });
  }
  await env.DB.prepare("INSERT INTO post_likes (post_id, user_id, created_at) VALUES (?,?,?)").bind(p.id, s.userId, now()).run();
  const c = await env.DB.prepare("SELECT COUNT(*) AS c FROM post_likes WHERE post_id = ?").bind(p.id).first<any>();
  return json({ ok: true, liked: true, likes: Number(c?.c ?? 0) });
});

route("DELETE", "/api/posts/:id/like", async (req, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  await env.DB.prepare("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?").bind(p.id, s.userId).run();
  const c = await env.DB.prepare("SELECT COUNT(*) AS c FROM post_likes WHERE post_id = ?").bind(p.id).first<any>();
  return json({ ok: true, liked: false, likes: Number(c?.c ?? 0) });
});

route("POST", "/api/posts/:id/save", async (req, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  await env.DB.prepare("INSERT OR IGNORE INTO post_saves (post_id, user_id, created_at) VALUES (?,?,?)").bind(p.id, s.userId, now()).run();
  return json({ ok: true, saved: true });
});

route("DELETE", "/api/posts/:id/save", async (req, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  await env.DB.prepare("DELETE FROM post_saves WHERE post_id = ? AND user_id = ?").bind(p.id, s.userId).run();
  return json({ ok: true, saved: false });
});

route("GET", "/api/posts/:id/comments", async (_r, env, _s, p) => {
  const { results } = await env.DB.prepare(
    "SELECT c.id, c.body, c.created_at, u.username, u.name, u.avatar_url FROM post_comments c JOIN users u ON u.id = c.user_id WHERE c.post_id = ? ORDER BY c.created_at ASC LIMIT 100"
  ).bind(p.id).all<any>();
  return json({ comments: results ?? [] });
});

route("POST", "/api/posts/:id/comments", async (req, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const post = await env.DB.prepare("SELECT id FROM posts WHERE id = ? AND active = 1").bind(p.id).first();
  if (!post) return bad("not_found", 404);
  const body = clip(String((await req.json().catch(() => ({})) as any).body ?? "").trim(), 300);
  if (body.length < 1) return bad("invalid_body");
  await env.DB.prepare("INSERT INTO post_comments (id, post_id, user_id, body, created_at) VALUES (?,?,?,?,?)").bind(id("c"), p.id, s.userId, body, now()).run();
  return json({ ok: true }, 201);
});

route("POST", "/api/users/:username/follow", async (req, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const u = await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(p.username).first<any>();
  if (!u) return bad("not_found", 404);
  if (u.id === s.userId) return bad("cannot_follow_self");
  await env.DB.prepare("INSERT OR IGNORE INTO follows (follower_id, followee_id, created_at) VALUES (?,?,?)").bind(s.userId, u.id, now()).run();
  const c = await env.DB.prepare("SELECT COUNT(*) AS c FROM follows WHERE followee_id = ?").bind(u.id).first<any>();
  return json({ ok: true, following: true, followers: Number(c?.c ?? 0) });
});

route("DELETE", "/api/users/:username/follow", async (req, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const u = await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(p.username).first<any>();
  if (!u) return bad("not_found", 404);
  await env.DB.prepare("DELETE FROM follows WHERE follower_id = ? AND followee_id = ?").bind(s.userId, u.id).run();
  const c = await env.DB.prepare("SELECT COUNT(*) AS c FROM follows WHERE followee_id = ?").bind(u.id).first<any>();
  return json({ ok: true, following: false, followers: Number(c?.c ?? 0) });
});

// ═══ الستوريات (تعيش 24 ساعة) ═══
route("POST", "/api/stories", async (req, env, s) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  if (!(await rl(env, `story:${s.userId}`, 10, DAY))) return bad("too_many", 429);
  const b = (await req.json().catch(() => ({}))) as any;
  const image = String(b.image_url ?? "").trim();
  if (!isHttpsUrl(image)) return bad("invalid_image");
  const sid = id("st");
  await env.DB.prepare("INSERT INTO stories (id, user_id, image_url, caption, created_at) VALUES (?,?,?,?,?)").bind(sid, s.userId, clip(image, 500), clip(String(b.caption ?? "").trim(), 200), now()).run();
  return json({ ok: true, id: sid }, 201);
});

route("GET", "/api/stories", async (_r, env, s) => {
  if (!s) return bad("auth_required", 401);
  const { results } = await env.DB.prepare(
    `SELECT s.id, s.user_id, s.image_url, s.caption, s.created_at, u.username, u.name, u.avatar_url
    FROM stories s JOIN users u ON u.id = s.user_id
    WHERE s.created_at > ? AND (s.user_id = ? OR s.user_id IN (SELECT followee_id FROM follows WHERE follower_id = ?))
    ORDER BY s.created_at DESC LIMIT 100`
  ).bind(now() - DAY, s.userId, s.userId).all<any>();
  const groups: any[] = [];
  const byUser = new Map<string, any>();
  for (const st of results ?? []) {
    if (!byUser.has(st.username)) { const g = { username: st.username, name: st.name, avatar_url: st.avatar_url, items: [] as any[] }; byUser.set(st.username, g); groups.push(g); }
    byUser.get(st.username).items.push(st);
  }
  return json({ stories: groups });
});

// ═══ التوجيه المركزي ═══
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    if (path.startsWith("/api/")) {
      const s: Session | null = await getSession(env, req);
      for (const r of R) {
        if (r.m !== req.method) continue;
        const params = matchPath(r.pat, path);
        if (!params) continue;
        try {
          return await r.h(req, env, s as Session, params);
        } catch (err: any) {
          return json({ error: "server_error", detail: clip(String(err?.message ?? err), 200) }, 500);
        }
      }
      return bad("not_found", 404);
    }
    return env.ASSETS.fetch(req);
  },
};
