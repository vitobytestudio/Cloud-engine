// ——— NAKSAB — منصة العمل الحر — Stage 1 — Cloudflare Workers ———
// عزل كامل عن nexus-hub: قاعدة D1 مستقلة، Worker مستقل، لا مساس بأي مورد قائم.
import type { Env, Session } from "./env";
import {
  json, id, now, esc, clip, parseCookies, getSession, createSession, sessionCookie, clearCookie,
  hex, serverHash, verifyHash, rl, isEmail, isUsername, isK0, isHttpsUrl, jsonArr, notify, audit,
  sha256hex, hmacHex, b62Of, timingSafeEq, getSetting, setSetting, getAdminMeta, adminDeviceCookie, verifyAdminDevice,
} from "./lib";
import { runTask, STRUCTURE_SYSTEM } from "./ai";
import { paymentsEnabled, canTransit, genReference, REF_RE, amountExact, verifyWebhookSig, finAudit, idemKeyOf, riskFlags, type PayState } from "./payments";

type Route = { m: string; pat: string; h: (r: Request, e: Env, s: Session, p: Record<string, string>) => Promise<Response>; auth?: boolean; admin?: boolean; csrf?: boolean };
const R: Route[] = [];
const route = (m: string, pat: string, h: Route["h"], o: Partial<Route> = {}) => R.push({ m, pat, h, ...o });
const bad = (err: string, status = 400) => json({ error: err }, status);

// ═══ الصحة ═══
route("GET", "/api/health", async (_r, e) => json({ ok: true, v: "1.0.0", env: e.ENVIRONMENT }));

// ═══ المصادقة ═══
route("POST", "/api/auth/register", async (req, env) => {
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  if (!(await rl(env, `reg:${ip}`, 20, 86400))) return bad("too_many", 429);
  const b = (await req.json().catch(() => ({}))) as any;
  const email = clip(String(b.email ?? "").toLowerCase().trim(), 190);
  const k0 = String(b.k0 ?? "");
  const name = clip(String(b.name ?? "").trim(), 60);
  const username = clip(String(b.username ?? "").toLowerCase().trim(), 30);
  const role = ["freelancer", "client"].includes(b.role) ? b.role : "freelancer";
  if (!isEmail(email)) return bad("invalid_email");
  if (!isK0(k0)) return bad("invalid_k0");
  if (name.length < 2) return bad("invalid_name");
  if (!isUsername(username)) return bad("invalid_username");
  const dupEmail = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (dupEmail) return bad("email_taken", 409);
  const dupUser = await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
  if (dupUser) return bad("username_taken", 409);
  const salt = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  const hash = await serverHash(k0, salt);
  const uid = id("u");
  const bootstrap = false; // الإدارة تُنشأ حصراً عبر /api/admin/setup (لمرة واحدة) — لا منح عبر متغيرات
  await env.DB.prepare("INSERT INTO users (id, email, username, name, role, pass_hash, created_at) VALUES (?,?,?,?,?,?,?)")
    .bind(uid, email, username, name, role, hash, now()).run();
  const { token, csrf } = await createSession(env, uid);
  const cookie = sessionCookie(token, new URL(req.url).protocol === "https:", b.remember === false ? 30 : 365);
  return new Response(JSON.stringify({ ok: true, user: { id: uid, email, username, name, role }, csrf }), { status: 201, headers: { "content-type": "application/json; charset=utf-8", "set-cookie": cookie } });
}, { csrf: false });

route("POST", "/api/auth/login", async (req, env) => {
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  if (!(await rl(env, `login:${ip}`, 30, 3600))) return bad("too_many", 429);
  const b = (await req.json().catch(() => ({}))) as any;
  const email = clip(String(b.email ?? "").toLowerCase().trim(), 190);
  const k0 = String(b.k0 ?? "");
  if (!isEmail(email) || !isK0(k0)) return bad("invalid_credentials", 401);
  const u = await env.DB.prepare("SELECT id, pass_hash, role, username, name, banned FROM users WHERE email = ?").bind(email).first<any>();
  if (!u || u.banned) return bad("invalid_credentials", 401);
  const legacy = !String(u.pass_hash).startsWith("pbkdf2$");
  if (legacy) return json({ error: "legacy" }, 409);
  if (!(await verifyHash(k0, u.pass_hash))) return bad("invalid_credentials", 401);
  // بوابة المالك: حساب الإدارة لا يُسجَّل دخله إلا من رابط اللوحة السري — من الموقع الرئيسي: 401 صامت
  if (u.role === "admin") {
    const xp = req.headers.get("x-panel") ?? "";
    const ph = await getAdminMeta(env, "panel_hash");
    if (!ph || !xp || (await sha256hex(xp)) !== ph) return bad("invalid_credentials", 401);
  }
  const { token, csrf } = await createSession(env, u.id);
  const https = new URL(req.url).protocol === "https:";
  const days = u.role === "admin" || b.remember !== false ? 365 : 30;
  const extra: Record<string, string> = {};
  // جهاز المدير: يُسجَّل آلياً عند دخول ناجح بكلمة السر (ويُبطل من اللوحة عند الحاجة)
  if (u.role === "admin") {
    const dev = hex(32);
    await env.DB.prepare("INSERT INTO admin_devices (id, admin_id, token_hash, label, created_at, last_seen) VALUES (?,?,?,?,?,?)")
      .bind(id("d"), u.id, await sha256hex(dev), `login ${ip} ${new Date().toISOString().slice(0, 10)}`, now(), now()).run();
    extra["set-cookie2"] = adminDeviceCookie(dev, https);
  }
  await notify(env, u.id, "admin_login", `Admin sign-in from ${ip}. If this was not you, rotate the panel URL immediately.`);
  const h2: Record<string, string> = { "content-type": "application/json; charset=utf-8", "set-cookie": sessionCookie(token, https, days), ...extra };
  return new Response(JSON.stringify({ ok: true, user: { id: u.id, email, username: u.username, name: u.name, role: u.role }, csrf }), { status: 200, headers: h2 });
}, { csrf: false });

route("POST", "/api/auth/logout", async (req, env) => {
  const tok = parseCookies(req)["nk_s"];
  if (tok) await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(tok).run();
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json", "set-cookie": clearCookie } });
}, { auth: true });

route("GET", "/api/me", async (_r, env, s) => {
  if (!s) return json({ user: null });
  const u = await env.DB.prepare("SELECT id, email, username, name, role, headline, bio, avatar_url, country, langs, categories, skills, links, available, verified, reputation, reviews_count, completed FROM users WHERE id = ?").bind(s.userId).first<any>();
  // الباقة وحدود الذكاء (كلها من إعدادات الإدارة)
  const plan = await env.DB.prepare("SELECT id, name, ai_quota_daily, ai_quota_monthly FROM plans WHERE id = ?").bind(String((u as any)?.plan_id || "free")).first<any>()
    || await env.DB.prepare("SELECT id, name, ai_quota_daily, ai_quota_monthly FROM plans WHERE id = 'free'").first<any>();
  const daily = Number(plan?.ai_quota_daily ?? 10), monthly = Number(plan?.ai_quota_monthly ?? 100);
  const kv = await env.CACHE_KV.get(`rl:ai:${s.userId}`); const kvm = await env.CACHE_KV.get(`rl:aim:${s.userId}`);
  return json({ user: u, csrf: s.csrf, plan: { id: plan?.id ?? "free", name: plan?.name ?? "FREE" }, ai: { used_daily: Number(kv ?? 0), limit_daily: daily, used_monthly: Number(kvm ?? 0), limit_monthly: monthly, price_dzd_per_100: Number(await getSetting(env, "credits_price_dzd_per_100", "300")) } });
});

// ═══ التصنيفات العامة ═══
route("GET", "/api/categories", async (_r, env) => {
  const { results } = await env.DB.prepare("SELECT slug, name, icon FROM categories ORDER BY name").all<any>();
  return json({ categories: results ?? [] });
});

// ═══ الملف الشخصي ═══
route("PUT", "/api/profile", async (req, env, s) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const b = (await req.json().catch(() => ({}))) as any;
  // دمج جزئي: الحقول المرسلة فقط تُحدَّث (b.x !== undefined)
  const cur = await env.DB.prepare("SELECT headline, bio, avatar_url, country, langs, categories, skills, links, available FROM users WHERE id = ?").bind(s.userId).first<any>();
  if (!cur) return bad("auth_required", 401);
  const headline = b.headline !== undefined ? clip(String(b.headline).trim(), 90) : cur.headline;
  const bio = b.bio !== undefined ? clip(String(b.bio).trim(), 1200) : cur.bio;
  const avatar = b.avatar_url !== undefined ? (isHttpsUrl(String(b.avatar_url ?? "")) ? String(b.avatar_url) : "") : cur.avatar_url;
  const country = b.country !== undefined ? clip(String(b.country).trim(), 40) : cur.country;
  const langs = b.langs !== undefined ? jsonArr(JSON.stringify(b.langs ?? []), 4).join(",") : cur.langs;
  const cats = b.categories !== undefined ? jsonArr(JSON.stringify(b.categories ?? []), 4) : JSON.parse(cur.categories || "[]");
  const skills = b.skills !== undefined ? jsonArr(JSON.stringify(b.skills ?? []), 15) : JSON.parse(cur.skills || "[]");
  const links = b.links !== undefined ? (Array.isArray(b.links) ? b.links : []).slice(0, 5).map((l: any) => ({ label: clip(String(l.label ?? ""), 30), url: isHttpsUrl(String(l.url ?? "")) ? String(l.url) : "" })) : JSON.parse(cur.links || "[]");
  const available = b.available !== undefined ? (b.available ? 1 : 0) : Number(cur.available);
  await env.DB.prepare("UPDATE users SET headline=?, bio=?, avatar_url=?, country=?, langs=?, categories=?, skills=?, links=?, available=? WHERE id=?")
    .bind(headline, bio, avatar, country, langs, JSON.stringify(cats), JSON.stringify(skills), JSON.stringify(links), available, s.userId).run();
  return json({ ok: true });
}, { auth: true, csrf: true });

// ═══ اكتشاف عام (بلا تسجيل) ═══
route("GET", "/api/freelancers", async (req, env) => {
  const url = new URL(req.url);
  const q = clip(url.searchParams.get("q") ?? "", 40).toLowerCase();
  const cat = clip(url.searchParams.get("category") ?? "", 40);
  let sql = `SELECT u.username, u.name, u.headline, u.avatar_url, u.country, u.skills, u.categories, u.available, u.reputation, u.reviews_count, u.completed, u.verified,
    (SELECT COUNT(*) FROM services sv WHERE sv.user_id = u.id AND sv.active = 1) AS services_count
    FROM users u WHERE u.banned = 0 AND u.role = 'freelancer'`;
  const binds: any[] = [];
  if (cat) { sql += ` AND u.categories LIKE ?`; binds.push(`%"${cat}"%`); }
  if (q) { sql += ` AND (LOWER(u.name) LIKE ? OR LOWER(u.headline) LIKE ? OR LOWER(u.skills) LIKE ?)`; binds.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  sql += ` ORDER BY u.available DESC, u.reputation DESC, u.completed DESC LIMIT 36`;
  const { results } = await env.DB.prepare(sql).bind(...binds).all<any>();
  return json({ freelancers: results ?? [] });
});

route("GET", "/api/services", async (req, env) => {
  const url = new URL(req.url);
  const q = clip(url.searchParams.get("q") ?? "", 40).toLowerCase();
  const cat = clip(url.searchParams.get("category") ?? "", 40);
  let sql = `SELECT s.id, s.title, s.description, s.category, s.price_min, s.price_max, s.currency, s.delivery_days, s.boost_until,
    u.username, u.name, u.avatar_url, u.reputation, u.verified FROM services s JOIN users u ON u.id = s.user_id
    WHERE s.active = 1 AND u.banned = 0`;
  const binds: any[] = [];
  if (cat) { sql += ` AND s.category = ?`; binds.push(cat); }
  if (q) { sql += ` AND (LOWER(s.title) LIKE ? OR LOWER(s.description) LIKE ?)`; binds.push(`%${q}%`, `%${q}%`); }
  sql += ` ORDER BY (s.boost_until > ?) DESC, u.reputation DESC, s.created_at DESC LIMIT 36`;
  binds.push(now());
  const { results } = await env.DB.prepare(sql).bind(...binds).all<any>();
  return json({ services: results ?? [] });
});

route("GET", "/api/services/:id", async (_r, env, _s, p) => {
  const row = await env.DB.prepare(`SELECT s.*, u.username, u.name, u.avatar_url, u.reputation, u.reviews_count, u.verified
    FROM services s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.active = 1`).bind(p.id).first<any>();
  if (!row) return bad("not_found", 404);
  return json({ service: row });
});

route("POST", "/api/services", async (req, env, s) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const u = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(s.userId).first<any>();
  if (u?.role !== "freelancer" && u?.role !== "admin") return bad("freelancer_only", 403);
  if (!(await rl(env, `svc:${s.userId}`, 20, 86400))) return bad("too_many", 429);
  const b = (await req.json().catch(() => ({}))) as any;
  const title = clip(String(b.title ?? "").trim(), 90);
  const description = clip(String(b.description ?? "").trim(), 2500);
  const category = clip(String(b.category ?? ""), 40);
  if (title.length < 6 || description.length < 20) return bad("invalid_input");
  const price_min = Math.max(0, Math.min(1_000_000, Number(b.price_min) || 0));
  const price_max = Math.max(price_min, Math.min(1_000_000, Number(b.price_max) || price_min));
  const sid = id("sv");
  await env.DB.prepare("INSERT INTO services (id, user_id, title, description, category, skills, price_min, price_max, currency, delivery_days, revisions, addons, requirements, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
    .bind(sid, s.userId, title, description, category, JSON.stringify(jsonArr(JSON.stringify(b.skills ?? []), 8)), price_min, price_max,
      ["USD", "EUR", "DZD"].includes(b.currency) ? b.currency : "USD",
      Math.max(1, Math.min(90, Number(b.delivery_days) || 7)), Math.max(0, Math.min(10, Number(b.revisions) ?? 1)),
      JSON.stringify((Array.isArray(b.addons) ? b.addons : []).slice(0, 5).map((a: any) => ({ title: clip(String(a.title ?? ""), 50), price: Math.max(0, Number(a.price) || 0) }))),
      clip(String(b.requirements ?? ""), 500), now()).run();
  return json({ ok: true, id: sid }, 201);
}, { auth: true, csrf: true });

route("PUT", "/api/services/:id", async (req, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const row = await env.DB.prepare("SELECT user_id FROM services WHERE id = ?").bind(p.id).first<any>();
  if (!row) return bad("not_found", 404);
  const me = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(s.userId).first<any>();
  if (row.user_id !== s.userId && me?.role !== "admin") return bad("forbidden", 403);
  const b = (await req.json().catch(() => ({}))) as any;
  await env.DB.prepare("UPDATE services SET title=?, description=?, active=? WHERE id=?")
    .bind(clip(String(b.title ?? "").trim(), 90) || "Untitled", clip(String(b.description ?? "").trim(), 2500), b.active === false ? 0 : 1, p.id).run();
  return json({ ok: true });
}, { auth: true, csrf: true });

route("POST", "/api/portfolio", async (req, env, s) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  if (!(await rl(env, `pf:${s.userId}`, 30, 86400))) return bad("too_many", 429);
  const b = (await req.json().catch(() => ({}))) as any;
  const title = clip(String(b.title ?? "").trim(), 90);
  if (title.length < 3) return bad("invalid_input");
  const media_url = isHttpsUrl(String(b.media_url ?? "")) ? String(b.media_url) : "";
  const thumb_url = isHttpsUrl(String(b.thumb_url ?? "")) ? String(b.thumb_url) : "";
  const media_type = b.media_type === "video" ? "video" : "image";
  const pid = id("pf");
  await env.DB.prepare("INSERT INTO portfolio (id, user_id, kind, title, description, media_type, media_url, thumb_url, tags, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .bind(pid, s.userId, ["work", "achievement", "post"].includes(b.kind) ? b.kind : "work", title,
      clip(String(b.description ?? "").trim(), 800), media_type, media_url, thumb_url,
      JSON.stringify(jsonArr(JSON.stringify(b.tags ?? []), 6)), now()).run();
  return json({ ok: true, id: pid }, 201);
}, { auth: true, csrf: true });

route("GET", "/api/u/:username", async (_r, env, _s, p) => {
  const u = await env.DB.prepare(`SELECT id, username, name, role, headline, bio, avatar_url, country, langs, categories, skills, links, available, verified, reputation, reviews_count, completed, created_at
    FROM users WHERE username = ? AND banned = 0`).bind(p.username).first<any>();
  if (!u) return bad("not_found", 404);
  const services = (await env.DB.prepare("SELECT id, title, description, category, price_min, price_max, currency, delivery_days, revisions FROM services WHERE user_id = ? AND active = 1 ORDER BY created_at DESC LIMIT 24").bind(u.id).all<any>()).results ?? [];
  const works = (await env.DB.prepare("SELECT id, kind, title, description, media_type, media_url, thumb_url, tags, likes, created_at FROM portfolio WHERE user_id = ? ORDER BY created_at DESC LIMIT 24").bind(u.id).all<any>()).results ?? [];
  const reviews = (await env.DB.prepare(`SELECT r.rating, r.body, r.created_at, ru.username AS author_username, ru.name AS author_name, ru.avatar_url AS author_avatar
    FROM reviews r JOIN users ru ON ru.id = r.author_id WHERE r.target_id = ? AND r.status = 'published' ORDER BY r.created_at DESC LIMIT 12`).bind(u.id).all<any>()).results ?? [];
  return json({ profile: u, services, works, reviews });
});

// ═══ طلبات المشاريع + المطابقة ═══
route("POST", "/api/requests", async (req, env, s) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  if (!(await rl(env, `req:${s.userId}`, 10, 86400))) return bad("too_many", 429);
  const b = (await req.json().catch(() => ({}))) as any;
  const title = clip(String(b.title ?? "").trim(), 120);
  const description = clip(String(b.description ?? "").trim(), 3000);
  if (title.length < 6 || description.length < 20) return bad("invalid_input");
  const rid = id("rq");
  await env.DB.prepare("INSERT INTO requests (id, client_id, title, description, category, skills, budget_min, budget_max, currency, structured, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
    .bind(rid, s.userId, title, description, clip(String(b.category ?? ""), 40),
      JSON.stringify(jsonArr(JSON.stringify(b.skills ?? []), 8)),
      Math.max(0, Number(b.budget_min) || 0), Math.max(0, Number(b.budget_max) || 0),
      ["USD", "EUR", "DZD"].includes(b.currency) ? b.currency : "USD",
      String(b.structured ? "1" : ""), now()).run();
  return json({ ok: true, id: rid }, 201);
}, { auth: true, csrf: true });

// الهيكلة الذكية — تعزيز فقط: عند تعطل المزودين يعمل النموذج اليدوي (قرار هـ)
route("POST", "/api/requests/structure", async (req, env, s) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const aiDaily = Number(await getSetting(env, "ai_free_daily", "10"));
  const aiMonthly = Number(await getSetting(env, "ai_free_monthly", "100"));
  if (!(await rl(env, `ai:${s.userId}`, aiDaily, 86400))) return bad("too_many", 429);
  if (!(await rl(env, `aim:${s.userId}`, aiMonthly, 2592000))) return bad("too_many", 429);
  const b = (await req.json().catch(() => ({}))) as any;
  const text = clip(String(b.text ?? "").trim(), 4000);
  if (text.length < 15) return bad("invalid_input");
  const r = await runTask(env, s.userId, { kind: "structure", system: STRUCTURE_SYSTEM, user: text, json: true, maxTokens: 900 });
  if (!r.ok) return json({ error: "ai_unavailable", trace: r.trace }, 503);
  try {
    const m = r.text.match(/\{[\s\S]*\}/);
    const j = JSON.parse(m ? m[0] : "");
    return json({
      ok: true, via: "vito-ai",
      data: {
        title: clip(String(j.title ?? ""), 120),
        category: clip(String(j.category ?? ""), 40),
        skills: jsonArr(JSON.stringify(j.skills ?? []), 8),
        budget_min: Math.max(0, Number(j.budget_min) || 0),
        budget_max: Math.max(0, Number(j.budget_max) || 0),
        questions: jsonArr(JSON.stringify(j.questions ?? []), 3),
      },
    });
  } catch {
    return json({ error: "ai_invalid", trace: "parse" }, 502);
  }
}, { auth: true, csrf: true });

route("GET", "/api/requests", async (_r, env, s) => {
  if (!s) return bad("auth_required", 401);
  const mine = (await env.DB.prepare(`SELECT r.*, (SELECT COUNT(*) FROM proposals pr WHERE pr.request_id = r.id) AS proposals_count
    FROM requests r WHERE r.client_id = ? ORDER BY r.created_at DESC LIMIT 50`).bind(s.userId).all<any>()).results ?? [];
  return json({ requests: mine });
});

route("GET", "/api/requests/open", async (_r, env, s) => {
  if (!s) return bad("auth_required", 401);
  // الطلبات المفتوحة المطابقة لملف المستقل (بإغراق: سقف 20، مرتبة بالمطابقة)
  const me = await env.DB.prepare("SELECT categories, skills FROM users WHERE id = ?").bind(s.userId).first<any>();
  if (!me) return bad("auth_required", 401);
  const { results } = await env.DB.prepare(`SELECT r.id, r.title, r.description, r.category, r.skills, r.budget_min, r.budget_max, r.currency, r.created_at,
    (SELECT COUNT(*) FROM proposals pr WHERE pr.request_id = r.id) AS proposals_count,
    (CASE WHEN r.category != '' AND json_array_length(r.skills) > 0 THEN
      (SELECT COUNT(*) FROM json_each(r.skills) je WHERE je.value IN (SELECT je2.value FROM json_each(?) je2))
    ELSE 0 END) + (CASE WHEN r.category != '' AND u_check.categories LIKE '%' || r.category || '%' THEN 2 ELSE 0 END) AS score
    FROM requests r, (SELECT ? AS categories) u_check
    WHERE r.status = 'open' ORDER BY score DESC, r.created_at DESC LIMIT 20`).bind(me.skills ?? "[]", me.categories ?? "[]").all<any>();
  return json({ requests: results ?? [] });
});

// المطابقة الموزونة SQL (قرار هـ): تداخل المهارات + التصنيف + التوفر + السمعة + الإنجاز
route("GET", "/api/requests/:id/matches", async (_r, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  const req0 = await env.DB.prepare("SELECT * FROM requests WHERE id = ? AND client_id = ?").bind(p.id, s.userId).first<any>();
  if (!req0) return bad("not_found", 404);
  const { results } = await env.DB.prepare(`
    WITH req_skills AS (SELECT je.value AS skill FROM json_each(?) je),
    overlap AS (SELECT u.id AS uid, COUNT(js.value) AS skill_hits
      FROM users u, json_each(u.skills) js JOIN req_skills rs ON rs.skill = js.value
      WHERE u.role = 'freelancer' AND u.banned = 0 GROUP BY u.id)
    SELECT u.username, u.name, u.headline, u.avatar_url, u.available, u.reputation, u.reviews_count, u.completed, u.verified, u.skills,
      COALESCE(o.skill_hits, 0) * 3
      + (CASE WHEN u.categories LIKE '%' || ? || '%' THEN 4 ELSE 0 END)
      + (CASE WHEN u.available = 1 THEN 2 ELSE 0 END)
      + CAST(u.reputation * 0.6 AS INTEGER)
      + (CASE WHEN u.completed > 0 THEN MIN(u.completed, 5) ELSE 0 END) AS score
    FROM users u LEFT JOIN overlap o ON o.uid = u.id
    WHERE u.role = 'freelancer' AND u.banned = 0
    ORDER BY score DESC, u.reputation DESC LIMIT 12`).bind(req0.skills || "[]", req0.category ?? "").all<any>();
  return json({ matches: results ?? [] });
});

route("POST", "/api/requests/:id/close", async (req, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const r = await env.DB.prepare("SELECT client_id FROM requests WHERE id = ?").bind(p.id).first<any>();
  if (!r || r.client_id !== s.userId) return bad("not_found", 404);
  await env.DB.prepare("UPDATE requests SET status = 'closed' WHERE id = ?").bind(p.id).run();
  return json({ ok: true });
}, { auth: true, csrf: true });

// ═══ العروض ═══
route("POST", "/api/proposals", async (req, env, s) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const u = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(s.userId).first<any>();
  if (u?.role !== "freelancer" && u?.role !== "admin") return bad("freelancer_only", 403);
  if (!(await rl(env, `prop:${s.userId}`, 25, 86400))) return bad("too_many", 429);
  const b = (await req.json().catch(() => ({}))) as any;
  const request_id = clip(String(b.request_id ?? ""), 40);
  const amount = Math.max(1, Math.min(1_000_000, Number(b.amount) || 0));
  const days = Math.max(1, Math.min(180, Number(b.days) || 7));
  const cover = clip(String(b.cover ?? "").trim(), 2000);
  if (!request_id || cover.length < 30) return bad("invalid_input");
  const r = await env.DB.prepare("SELECT id, client_id, status, title FROM requests WHERE id = ? AND status = 'open'").bind(request_id).first<any>();
  if (!r) return bad("not_found", 404);
  const dup = await env.DB.prepare("SELECT id FROM proposals WHERE request_id = ? AND freelancer_id = ?").bind(request_id, s.userId).first();
  if (dup) return bad("already_proposed", 409);
  const pid = id("pp");
  await env.DB.prepare("INSERT INTO proposals (id, request_id, freelancer_id, amount, days, cover, created_at) VALUES (?,?,?,?,?,?,?)")
    .bind(pid, request_id, s.userId, amount, days, cover, now()).run();
  await notify(env, r.client_id, "proposal", `New proposal on "${r.title}" — review it now`, request_id);
  return json({ ok: true, id: pid }, 201);
}, { auth: true, csrf: true });

route("GET", "/api/requests/:id/proposals", async (_r, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  const r = await env.DB.prepare("SELECT client_id FROM requests WHERE id = ?").bind(p.id).first<any>();
  if (!r) return bad("not_found", 404);
  if (r.client_id !== s.userId) {
    const mine = await env.DB.prepare("SELECT id, request_id, amount, days, cover, status, created_at FROM proposals WHERE request_id = ? AND freelancer_id = ?").bind(p.id, s.userId).first<any>();
    return json({ proposals: mine ? [mine] : [], owner: false });
  }
  const { results } = await env.DB.prepare(`SELECT pr.*, u.username, u.name, u.avatar_url, u.reputation, u.completed, u.verified
    FROM proposals pr JOIN users u ON u.id = pr.freelancer_id WHERE pr.request_id = ? ORDER BY pr.created_at DESC`).bind(p.id).all<any>();
  return json({ proposals: results ?? [], owner: true });
});

route("POST", "/api/proposals/:id/accept", async (req, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const pr = await env.DB.prepare("SELECT pr.*, r.client_id, r.title AS rtitle FROM proposals pr JOIN requests r ON r.id = pr.request_id WHERE pr.id = ? AND pr.status = 'pending'").bind(p.id).first<any>();
  if (!pr) return bad("not_found", 404);
  if (pr.client_id !== s.userId) return bad("forbidden", 403);
  await env.DB.prepare("UPDATE proposals SET status = 'accepted' WHERE id = ?").bind(p.id).run();
  await env.DB.prepare("UPDATE proposals SET status = 'rejected' WHERE request_id = ? AND id != ? AND status = 'pending'").bind(pr.request_id, p.id).run();
  await env.DB.prepare("UPDATE requests SET status = 'closed' WHERE id = ?").bind(pr.request_id).run();
  const projId = id("pj");
  await env.DB.prepare("INSERT INTO projects (id, request_id, client_id, freelancer_id, proposal_id, amount, title, created_at) VALUES (?,?,?,?,?,?,?,?)")
    .bind(projId, pr.request_id, pr.client_id, pr.freelancer_id, pr.id, pr.amount, pr.rtitle, now()).run();
  await notify(env, pr.freelancer_id, "accepted", `Your proposal was accepted — project room is open`, projId);
  return json({ ok: true, project_id: projId });
}, { auth: true, csrf: true });

// ═══ غرفة المشروع ═══
async function projectAccess(env: Env, pid: string, s: Session): Promise<any | null> {
  if (!s) return null;
  const proj = await env.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(pid).first<any>();
  if (!proj) return null;
  if (proj.client_id !== s.userId && proj.freelancer_id !== s.userId && s.role !== "admin") return null;
  return proj;
}

route("GET", "/api/projects", async (_r, env, s) => {
  if (!s) return bad("auth_required", 401);
  const { results } = await env.DB.prepare(`SELECT p.*, ru.name AS freelancer_name, ru.username AS freelancer_username, cu.name AS client_name, cu.username AS client_username
    FROM projects p JOIN users ru ON ru.id = p.freelancer_id JOIN users cu ON cu.id = p.client_id
    WHERE p.client_id = ? OR p.freelancer_id = ? ORDER BY p.created_at DESC LIMIT 50`).bind(s.userId, s.userId).all<any>();
  return json({ projects: results ?? [] });
});

route("GET", "/api/projects/:id", async (_r, env, s, p) => {
  const proj = await projectAccess(env, p.id, s);
  if (!proj) return bad("not_found", 404);
  const messages = (await env.DB.prepare("SELECT m.*, u.name AS sender_name FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.project_id = ? ORDER BY m.created_at ASC LIMIT 200").bind(p.id).all<any>()).results ?? [];
  const milestones = (await env.DB.prepare("SELECT * FROM milestones WHERE project_id = ? ORDER BY created_at ASC").bind(p.id).all<any>()).results ?? [];
  const deliverables = (await env.DB.prepare("SELECT d.*, u.name AS added_by_name FROM deliverables d JOIN users u ON u.id = d.added_by WHERE d.project_id = ? ORDER BY d.created_at DESC").bind(p.id).all<any>()).results ?? [];
  const reviewed = (await env.DB.prepare("SELECT author_id FROM reviews WHERE project_id = ?").bind(p.id).all<any>()).results?.map((x) => x.author_id) ?? [];
  return json({ project: proj, messages, milestones, deliverables, reviewed });
});

route("POST", "/api/projects/:id/messages", async (req, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const proj = await projectAccess(env, p.id, s);
  if (!proj) return bad("not_found", 404);
  const b = (await req.json().catch(() => ({}))) as any;
  const body = clip(String(b.body ?? "").trim(), 3000);
  if (body.length < 1) return bad("invalid_input");
  if (!(await rl(env, `msg:${s.userId}`, 200, 3600))) return bad("too_many", 429);
  await env.DB.prepare("INSERT INTO messages (id, project_id, sender_id, body, created_at) VALUES (?,?,?,?,?)").bind(id("m"), p.id, s.userId, body, now()).run();
  const other = proj.client_id === s.userId ? proj.freelancer_id : proj.client_id;
  await notify(env, other, "message", `New message in "${proj.title}"`, p.id);
  return json({ ok: true }, 201);
}, { auth: true, csrf: true });

route("POST", "/api/projects/:id/milestones", async (req, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const proj = await projectAccess(env, p.id, s);
  if (!proj) return bad("not_found", 404);
  const b = (await req.json().catch(() => ({}))) as any;
  const title = clip(String(b.title ?? "").trim(), 120);
  if (title.length < 3) return bad("invalid_input");
  const count = await env.DB.prepare("SELECT COUNT(*) AS c FROM milestones WHERE project_id = ?").bind(p.id).first<any>();
  if ((count?.c ?? 0) >= 10) return bad("too_many_milestones", 409);
  await env.DB.prepare("INSERT INTO milestones (id, project_id, title, due_days, created_at) VALUES (?,?,?,?,?)")
    .bind(id("ms"), p.id, title, Math.max(1, Math.min(180, Number(b.due_days) || 7)), now()).run();
  return json({ ok: true }, 201);
}, { auth: true, csrf: true });

route("POST", "/api/milestones/:id/status", async (req, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const ms = await env.DB.prepare("SELECT m.*, p.client_id, p.freelancer_id FROM milestones m JOIN projects p ON p.id = m.project_id WHERE m.id = ?").bind(p.id).first<any>();
  if (!ms) return bad("not_found", 404);
  if (ms.client_id !== s.userId && ms.freelancer_id !== s.userId) return bad("forbidden", 403);
  const b = (await req.json().catch(() => ({}))) as any;
  const status = b.status;
  if (status === "delivered" && ms.freelancer_id === s.userId) {
    await env.DB.prepare("UPDATE milestones SET status = 'delivered' WHERE id = ?").bind(p.id).run();
    await notify(env, ms.client_id, "milestone", `Milestone delivered: ${ms.title}`, ms.project_id);
  } else if (status === "approved" && ms.client_id === s.userId && ms.status === "delivered") {
    await env.DB.prepare("UPDATE milestones SET status = 'approved' WHERE id = ?").bind(p.id).run();
    await notify(env, ms.freelancer_id, "milestone", `Milestone approved: ${ms.title}`, ms.project_id);
  } else return bad("invalid_transition");
  return json({ ok: true });
}, { auth: true, csrf: true });

route("POST", "/api/projects/:id/deliverables", async (req, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const proj = await projectAccess(env, p.id, s);
  if (!proj) return bad("not_found", 404);
  const b = (await req.json().catch(() => ({}))) as any;
  const url = String(b.url ?? "");
  if (!isHttpsUrl(url)) return bad("invalid_url");
  await env.DB.prepare("INSERT INTO deliverables (id, project_id, added_by, url, note, created_at) VALUES (?,?,?,?,?,?)")
    .bind(id("dv"), p.id, s.userId, clip(url, 500), clip(String(b.note ?? ""), 300), now()).run();
  const other = proj.client_id === s.userId ? proj.freelancer_id : proj.client_id;
  await notify(env, other, "deliverable", `New deliverable in "${proj.title}"`, p.id);
  return json({ ok: true }, 201);
}, { auth: true, csrf: true });

// التأكيد المتبادل (قرار ج) — الإنجاز يثبت بتأكيد الطرفين
route("POST", "/api/projects/:id/confirm", async (req, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const proj = await projectAccess(env, p.id, s);
  if (!proj || proj.status === "completed" || proj.status === "cancelled") return bad("not_found", 404);
  const isClient = proj.client_id === s.userId;
  const col = isClient ? "client_confirmed" : "freelancer_confirmed";
  const clientConf = isClient ? 1 : Number(proj.client_confirmed);
  const freelancerConf = isClient ? Number(proj.freelancer_confirmed) : 1;
  const status = clientConf && freelancerConf ? "completed" : "delivered";
  await env.DB.prepare(`UPDATE projects SET ${col} = 1, status = ? WHERE id = ?`).bind(status, p.id).run();
  const after = await env.DB.prepare("SELECT client_confirmed, freelancer_confirmed FROM projects WHERE id = ?").bind(p.id).first<any>();
  if (after.client_confirmed && after.freelancer_confirmed) {
    await env.DB.prepare("UPDATE users SET completed = completed + 1 WHERE id IN (?, ?)").bind(proj.client_id, proj.freelancer_id).run();
    await notify(env, proj.client_id, "completed", `Project completed — leave your review`, p.id);
    await notify(env, proj.freelancer_id, "completed", `Project completed — leave your review`, p.id);
  } else {
    const other = isClient ? proj.freelancer_id : proj.client_id;
    await notify(env, other, "confirm", `Waiting for your confirmation in "${proj.title}"`, p.id);
  }
  return json({ ok: true, ...after });
}, { auth: true, csrf: true });

// ═══ التقييمات ═══
route("POST", "/api/reviews", async (req, env, s) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  if (!(await rl(env, `rev:${s.userId}`, 10, 86400))) return bad("too_many", 429);
  const b = (await req.json().catch(() => ({}))) as any;
  const project_id = clip(String(b.project_id ?? ""), 40);
  const rating = Math.max(1, Math.min(5, Number(b.rating) || 0));
  const body = clip(String(b.body ?? "").trim(), 1200);
  if (!rating) return bad("invalid_input");
  const proj = await projectAccess(env, project_id, s);
  if (!proj || proj.status !== "completed") return bad("project_not_completed", 409);
  const dup = await env.DB.prepare("SELECT id FROM reviews WHERE project_id = ? AND author_id = ?").bind(project_id, s.userId).first();
  if (dup) return bad("already_reviewed", 409);
  const target = proj.client_id === s.userId ? proj.freelancer_id : proj.client_id;
  // كشف الأنماط المشبوهة (قرار ج): مشروعان متبادلان بنفس الزوج + تقييم قصوى فوري → flag للمراجعة الإدارية
  const mutual = await env.DB.prepare(`SELECT COUNT(*) AS c FROM projects p1 JOIN projects p2 ON p1.id != p2.id
    WHERE ((p1.client_id = ? AND p1.freelancer_id = ?) OR (p1.client_id = ? AND p1.freelancer_id = ?))
    AND ((p2.client_id = p1.freelancer_id AND p2.freelancer_id = p1.client_id))`).bind(proj.client_id, proj.freelancer_id, proj.freelancer_id, proj.client_id).first<any>();
  const flagged = rating === 5 && body.length < 20 && (mutual?.c ?? 0) > 0 ? 1 : 0;
  await env.DB.prepare("INSERT INTO reviews (id, project_id, author_id, target_id, rating, body, flagged, created_at) VALUES (?,?,?,?,?,?,?,?)")
    .bind(id("rv"), project_id, s.userId, target, rating, body, flagged, now()).run();
  const agg = await env.DB.prepare("SELECT AVG(rating) AS avg, COUNT(*) AS c FROM reviews WHERE target_id = ? AND status = 'published' AND flagged = 0").bind(target).first<any>();
  if (agg && agg.c > 0) await env.DB.prepare("UPDATE users SET reputation = ?, reviews_count = ? WHERE id = ?").bind(Math.round(agg.avg * 10) / 10, agg.c, target).run();
  return json({ ok: true, flagged }, 201);
}, { auth: true, csrf: true });

// ═══ Discover ═══
route("GET", "/api/discover", async (req, env) => {
  const url = new URL(req.url);
  const kind = clip(url.searchParams.get("kind") ?? "", 12);
  let sql = `SELECT pf.*, u.username, u.name, u.avatar_url, u.reputation FROM portfolio pf JOIN users u ON u.id = pf.user_id
    WHERE u.banned = 0`;
  const binds: any[] = [];
  if (["work", "achievement", "post"].includes(kind)) { sql += ` AND pf.kind = ?`; binds.push(kind); }
  sql += ` ORDER BY pf.created_at DESC LIMIT 36`;
  const { results } = await env.DB.prepare(sql).bind(...binds).all<any>();
  return json({ posts: results ?? [] });
});

route("POST", "/api/portfolio/:id/like", async (req, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const existing = await env.DB.prepare("SELECT rowid FROM likes WHERE user_id = ? AND item_id = ?").bind(s.userId, p.id).first();
  if (existing) {
    await env.DB.prepare("DELETE FROM likes WHERE user_id = ? AND item_id = ?").bind(s.userId, p.id).run();
    await env.DB.prepare("UPDATE portfolio SET likes = MAX(0, likes - 1) WHERE id = ?").bind(p.id).run();
    return json({ ok: true, liked: false });
  }
  await env.DB.prepare("INSERT INTO likes (user_id, item_id, created_at) VALUES (?,?,?)").bind(s.userId, p.id, now()).run();
  await env.DB.prepare("UPDATE portfolio SET likes = likes + 1 WHERE id = ?").bind(p.id).run();
  return json({ ok: true, liked: true });
}, { auth: true, csrf: true });

route("POST", "/api/users/:username/follow", async (req, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const u = await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(p.username).first<any>();
  if (!u || u.id === s.userId) return bad("not_found", 404);
  const existing = await env.DB.prepare("SELECT rowid FROM follows WHERE follower_id = ? AND user_id = ?").bind(s.userId, u.id).first();
  if (existing) {
    await env.DB.prepare("DELETE FROM follows WHERE follower_id = ? AND user_id = ?").bind(s.userId, u.id).run();
    return json({ ok: true, following: false });
  }
  await env.DB.prepare("INSERT INTO follows (follower_id, user_id, created_at) VALUES (?,?,?)").bind(s.userId, u.id, now()).run();
  return json({ ok: true, following: true });
}, { auth: true, csrf: true });

// ═══ NAKSAB ADS (أساس — بلا دفع) ═══
route("POST", "/api/ads", async (req, env, s) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  if (!(await rl(env, `ad:${s.userId}`, 5, 86400))) return bad("too_many", 429);
  const b = (await req.json().catch(() => ({}))) as any;
  const title = clip(String(b.title ?? "").trim(), 90);
  const target_url = String(b.target_url ?? "");
  if (title.length < 5 || !isHttpsUrl(target_url)) return bad("invalid_input");
  const aid = id("ad");
  await env.DB.prepare("INSERT INTO ads (id, advertiser_id, title, body, media_url, target_url, created_at) VALUES (?,?,?,?,?,?,?)")
    .bind(aid, s.userId, title, clip(String(b.body ?? "").trim(), 300),
      isHttpsUrl(String(b.media_url ?? "")) ? String(b.media_url) : "", target_url, now()).run();
  return json({ ok: true, id: aid, status: "pending" }, 201);
}, { auth: true, csrf: true });

route("GET", "/api/ads/approved", async (_r, env) => {
  const { results } = await env.DB.prepare("SELECT id, title, body, media_url, target_url FROM ads WHERE status = 'approved' ORDER BY created_at DESC LIMIT 6").all<any>();
  return json({ ads: results ?? [] });
});

route("POST", "/api/ads/:id/click", async (_r, env, _s, p) => {
  await env.DB.prepare("UPDATE ads SET clicks = clicks + 1 WHERE id = ? AND status = 'approved'").bind(p.id).run();
  return json({ ok: true });
});

// ═══ الإشعارات ═══
route("GET", "/api/notifications", async (_r, env, s) => {
  if (!s) return bad("auth_required", 401);
  const { results } = await env.DB.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30").bind(s.userId).all<any>();
  return json({ notifications: results ?? [] });
});

// ═══ لوحة الإدارة ═══
route("GET", "/api/admin/stats", async (_r, env, s) => {
  if (!s || s.role !== "admin") return bad("forbidden", 403);
  const users = await env.DB.prepare("SELECT COUNT(*) AS c FROM users").first<any>();
  const freelancers = await env.DB.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'freelancer'").first<any>();
  const services = await env.DB.prepare("SELECT COUNT(*) AS c FROM services").first<any>();
  const requests = await env.DB.prepare("SELECT COUNT(*) AS c FROM requests").first<any>();
  const projects = await env.DB.prepare("SELECT COUNT(*) AS c FROM projects").first<any>();
  const completed = await env.DB.prepare("SELECT COUNT(*) AS c FROM projects WHERE status = 'completed'").first<any>();
  const flagged = await env.DB.prepare("SELECT COUNT(*) AS c FROM reviews WHERE flagged = 1").first<any>();
  const ai = await env.DB.prepare("SELECT provider, COUNT(*) AS c FROM ai_usage GROUP BY provider").all<any>();
  return json({ users: users?.c, freelancers: freelancers?.c, services: services?.c, requests: requests?.c, projects: projects?.c, completed: completed?.c, flagged_reviews: flagged?.c, ai_usage: ai?.results ?? [] });
}, { auth: true });

route("GET", "/api/admin/users", async (req, env, s) => {
  if (!s || s.role !== "admin") return bad("forbidden", 403);
  const q = clip(new URL(req.url).searchParams.get("q") ?? "", 40).toLowerCase();
  const { results } = await env.DB.prepare("SELECT id, email, username, name, role, verified, banned, reputation, completed, created_at FROM users WHERE LOWER(email) LIKE ? OR LOWER(username) LIKE ? ORDER BY created_at DESC LIMIT 50").bind(`%${q}%`, `%${q}%`).all<any>();
  return json({ users: results ?? [] });
}, { auth: true });

route("POST", "/api/admin/users/:id/flags", async (req, env, s, p) => {
  if (!s || s.role !== "admin") return bad("forbidden", 403);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const b = (await req.json().catch(() => ({}))) as any;
  const sets: string[] = [];
  const binds: any[] = [];
  if (typeof b.verified === "boolean") { sets.push("verified = ?"); binds.push(b.verified ? 1 : 0); }
  if (typeof b.banned === "boolean") { sets.push("banned = ?"); binds.push(b.banned ? 1 : 0); }
  if (!sets.length) return bad("invalid_input");
  binds.push(p.id);
  await env.DB.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).bind(...binds).run();
  await audit(env, s.userId, "user_flags", `${p.id}: ${JSON.stringify(b)}`);
  return json({ ok: true });
}, { auth: true, csrf: true });

route("GET", "/api/admin/reviews/flagged", async (_r, env, s) => {
  if (!s || s.role !== "admin") return bad("forbidden", 403);
  const { results } = await env.DB.prepare(`SELECT r.*, ru.username AS author_username, tu.username AS target_username
    FROM reviews r JOIN users ru ON ru.id = r.author_id JOIN users tu ON tu.id = r.target_id
    WHERE r.flagged = 1 ORDER BY r.created_at DESC LIMIT 50`).all<any>();
  return json({ reviews: results ?? [] });
}, { auth: true });

route("POST", "/api/admin/reviews/:id/moderate", async (req, env, s, p) => {
  if (!s || s.role !== "admin") return bad("forbidden", 403);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const b = (await req.json().catch(() => ({}))) as any;
  if (!["hidden", "published"].includes(b.status)) return bad("invalid_input");
  await env.DB.prepare("UPDATE reviews SET status = ? WHERE id = ?").bind(b.status, p.id).run();
  await audit(env, s.userId, "review_moderate", `${p.id} → ${b.status}`);
  return json({ ok: true });
}, { auth: true, csrf: true });

route("GET", "/api/admin/ads", async (_r, env, s) => {
  if (!s || s.role !== "admin") return bad("forbidden", 403);
  const { results } = await env.DB.prepare(`SELECT a.*, u.username AS advertiser_username FROM ads a JOIN users u ON u.id = a.advertiser_id ORDER BY a.created_at DESC LIMIT 50`).all<any>();
  return json({ ads: results ?? [] });
}, { auth: true });

route("POST", "/api/admin/ads/:id/moderate", async (req, env, s, p) => {
  if (!s || s.role !== "admin") return bad("forbidden", 403);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const b = (await req.json().catch(() => ({}))) as any;
  if (!["approved", "rejected", "pending"].includes(b.status)) return bad("invalid_input");
  await env.DB.prepare("UPDATE ads SET status = ? WHERE id = ?").bind(b.status, p.id).run();
  await audit(env, s.userId, "ad_moderate", `${p.id} → ${b.status}`);
  return json({ ok: true });
}, { auth: true, csrf: true });

route("GET", "/api/admin/audit", async (_r, env, s) => {
  if (!s || s.role !== "admin") return bad("forbidden", 403);
  const { results } = await env.DB.prepare("SELECT * FROM audit ORDER BY created_at DESC LIMIT 100").all<any>();
  return json({ audit: results ?? [] });
}, { auth: true });

// ═══ الراوتر ═══
function matchPath(pat: string, path: string): Record<string, string> | null {
  const pp = pat.split("/").filter(Boolean);
  const aa = path.split("/").filter(Boolean);
  if (pp.length !== aa.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(":")) params[pp[i].slice(1)] = decodeURIComponent(aa[i]);
    else if (pp[i] !== aa[i]) return null;
  }
  return params;
}


// ═══ الإدارة: الإعداد لمرة واحدة + الرابط المشتق المختلط ═══
route("GET", "/api/admin/setup-status", async (_r, env) => json({ done: (await getAdminMeta(env, "setup_done")) === "1" }));

route("POST", "/api/admin/setup", async (req, env) => {
  if ((await getAdminMeta(env, "setup_done")) === "1") return bad("not_found", 404);
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  if (!(await rl(env, `setup:${ip}`, 3, 3600))) return bad("too_many", 429);
  const b = (await req.json().catch(() => ({}))) as any;
  const email = clip(String(b.email ?? "").toLowerCase().trim(), 190);
  const name = clip(String(b.name ?? "").trim(), 60);
  const k0 = String(b.k0 ?? "");
  if (!isEmail(email) || !isK0(k0) || name.length < 2) return bad("invalid_setup");
  const dup = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<any>();
  if (dup) return bad("email_taken", 409);
  const uid = id("u");
  const hash = await serverHash(k0, hex(16));
  const uname = (email.split("@")[0].replace(/[^a-z0-9-]/g, "") || "owner").slice(0, 20);
  await env.DB.prepare("INSERT INTO users (id, email, username, name, role, pass_hash, created_at) VALUES (?,?,?,?,?,?,?)")
    .bind(uid, email, uname, name, "admin", hash, now()).run();
  const dev = hex(32);
  await env.DB.prepare("INSERT INTO admin_devices (id, admin_id, token_hash, label, created_at, last_seen) VALUES (?,?,?,?,?,?)")
    .bind(id("d"), uid, await sha256hex(dev), "setup device", now(), now()).run();
  let secret = await getAdminMeta(env, "path_secret");
  if (!secret) { secret = hex(32); await env.DB.prepare("INSERT INTO admin_meta (k, v) VALUES ('path_secret', ?)").bind(secret).run(); }
  if (env.ADMIN_PATH_SECRET) secret = env.ADMIN_PATH_SECRET;
  const tok = b62Of(await hmacHex(secret, uid + hex(16))).slice(0, 28);
  await env.DB.prepare("INSERT INTO admin_meta (k, v) VALUES ('panel_hash', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v")
    .bind(await sha256hex(tok)).run();
  await env.DB.prepare("INSERT INTO admin_meta (k, v) VALUES ('setup_done', '1') ON CONFLICT(k) DO UPDATE SET v = '1'").run();
  await finAudit(env, uid, "admin_setup", "", `panel minted, ip=${ip}`);
  const { token, csrf } = await createSession(env, uid);
  const https = new URL(req.url).protocol === "https:";
  const h = new Headers({ "content-type": "application/json; charset=utf-8" });
  h.append("set-cookie", sessionCookie(token, https, 365));
  h.append("set-cookie", adminDeviceCookie(dev, https));
  return new Response(JSON.stringify({ ok: true, csrf, panel_url: `/panel/${tok}`, user: { id: uid, role: "admin" } }), { status: 201, headers: h });
}, { csrf: false });

// ═══ الباقات العامة (FREE نشط — PRO/VIP Coming Soon بلا أي شراء) ═══
route("GET", "/api/plans", async (_r, env) => {
  const { results } = await env.DB.prepare("SELECT id, name, price_dzd, period, ai_quota_daily, ai_quota_monthly, features, active, buyable FROM plans ORDER BY sort").all<any>();
  return json({ plans: results ?? [], payments_enabled: (await paymentsEnabled(env)) ? 1 : 0 });
});

// ═══ الدفع: كل المسارات مغلقة حتى payments_enabled=1 (خامِلة بحكم التصميم) ═══
route("POST", "/api/payments/checkout", async (req, env, s) => {
  if (!s) return bad("auth_required", 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  if (!(await paymentsEnabled(env))) return bad("payments_disabled", 503);
  const b = (await req.json().catch(() => ({}))) as any;
  const kind = b.kind === "credits" ? "credits" : "plan";
  const planId = String(b.plan_id ?? "");
  const plan = await env.DB.prepare("SELECT * FROM plans WHERE id = ? AND active = 1 AND buyable = 1").bind(planId).first<any>();
  if (kind === "plan" && !plan) return bad("not_buyable", 400);
  const amount = kind === "plan" ? Number(plan.price_dzd) : Math.ceil(Number(b.credits ?? 0) / 100) * Number(await getSetting(env, "credits_price_dzd_per_100", "300"));
  if (kind !== "plan" && (!amount || amount < 100)) return bad("invalid_amount");
  const ikey = idemKeyOf(s.userId, kind, kind === "plan" ? planId : String(b.credits ?? 0));
  const exist = await env.DB.prepare("SELECT id, reference, amount_dzd FROM payments WHERE idempotency_key = ? AND status = 'pending'").bind(ikey).first<any>();
  if (exist) return json({ ok: true, payment_id: exist.id, reference: exist.reference, amount_dzd: exist.amount_dzd, pay_url: null });
  const ref = genReference(hex(16));
  if (!REF_RE.test(ref)) return bad("server_error", 500);
  const pid = id("pay");
  await env.DB.prepare("INSERT INTO payments (id, user_id, kind, plan_id, credits, amount_dzd, reference, status, idempotency_key, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .bind(pid, s.userId, kind, kind === "plan" ? planId : null, kind === "credits" ? Number(b.credits ?? 0) : 0, amount, ref, "pending", ikey, now()).run();
  await finAudit(env, s.userId, "checkout_created", pid, `${kind} amount=${amount}`);
  return json({ ok: true, payment_id: pid, reference: ref, amount_dzd: amount, pay_url: null });
}, { auth: true, csrf: true });

// Webhook: موقّع HMAC — بلا توقيع صحيح: رفض 401 + سطر تدقيق مالي
route("POST", "/api/payments/webhook/:provider", async (req, env, _s, p) => {
  if (!(await paymentsEnabled(env))) return bad("payments_disabled", 503);
  const raw = await req.text();
  const secret = await getSetting(env, `webhook_secret_${p.provider}`, "");
  const sig = req.headers.get("x-signature") ?? "";
  if (!(await verifyWebhookSig(raw, sig, secret))) {
    await finAudit(env, `webhook:${p.provider}`, "webhook_rejected", "", `bad signature (${sig.length} chars)`);
    return bad("invalid_signature", 401);
  }
  let b: any = {};
  try { b = JSON.parse(raw); } catch { return bad("invalid_payload", 400); }
  const ref = String(b.reference ?? "");
  if (!REF_RE.test(ref)) return bad("invalid_reference");
  const pay = await env.DB.prepare("SELECT * FROM payments WHERE reference = ?").bind(ref).first<any>();
  if (!pay) { await finAudit(env, `webhook:${p.provider}`, "unknown_reference", "", ref); return bad("invalid_reference", 404); }
  // المكرر: مرجع مزود سبق استخدامه
  const provRef = String(b.provider_ref ?? "");
  if (provRef) {
    const dupl = await env.DB.prepare("SELECT id FROM payments WHERE provider_ref = ? AND id != ?").bind(provRef, pay.id).first<any>();
    if (dupl) { await finAudit(env, `webhook:${p.provider}`, "duplicate_provider_ref", pay.id, provRef); return bad("duplicate_transaction", 409); }
  }
  if (pay.status !== "pending") return json({ ok: true, already: pay.status }); // idempotency الردود المتكررة
  const amount = Number(b.amount_dzd ?? 0);
  const to: PayState = String(b.status) === "paid" ? "confirmed" : "rejected";
  // المبلغ المضبوط + القواعد الحتمية
  if (to === "confirmed" && !amountExact(amount, pay.amount_dzd)) {
    await finAudit(env, `webhook:${p.provider}`, "amount_mismatch", pay.id, `got=${amount} want=${pay.amount_dzd}`);
    await env.DB.prepare("UPDATE payments SET risk_flags = ?, provider = ?, provider_ref = ? WHERE id = ?")
      .bind(JSON.stringify(["amount_mismatch"]), p.provider, provRef, pay.id).run();
    return bad("amount_mismatch", 409);
  }
  if (!canTransit(pay.status, to)) return bad("invalid_transition", 409);
  const ageH = Math.max(0, (now() - Number(pay.created_at)) / 36e5);
  const v24 = await env.DB.prepare("SELECT COUNT(*) AS c FROM payments WHERE user_id = ? AND created_at > ?").bind(pay.user_id, now() - 864e5).first<any>();
  const flags = riskFlags({ userPayments24h: Number(v24?.c ?? 0), userConfirmedTotal: 0, amount: pay.amount_dzd, accountAgeH: ageH });
  if (to === "confirmed" && flags.length >= 2) {
    await env.DB.prepare("UPDATE payments SET status = 'pending', provider = ?, provider_ref = ?, risk_flags = ? WHERE id = ?")
      .bind(p.provider, provRef, JSON.stringify(flags), pay.id).run();
    await finAudit(env, `webhook:${p.provider}`, "held_for_review", pay.id, flags.join(","));
    return json({ ok: true, held: true, flags });
  }
  await env.DB.prepare("UPDATE payments SET status = ?, provider = ?, provider_ref = ?, confirmed_at = ? WHERE id = ?")
    .bind(to, p.provider, provRef, to === "confirmed" ? now() : null, pay.id).run();
  if (to === "confirmed") {
    if (pay.kind === "plan") await env.DB.prepare("UPDATE users SET plan_id = ? WHERE id = ?").bind(pay.plan_id, pay.user_id).run();
    else {
      const bal = await env.DB.prepare("SELECT COALESCE(SUM(delta),0) AS b FROM credit_ledger WHERE user_id = ?").bind(pay.user_id).first<any>();
      const nb = Number(bal?.b ?? 0) + Number(pay.credits);
      await env.DB.prepare("INSERT INTO credit_ledger (id, user_id, delta, reason, ref_id, balance_after, created_at) VALUES (?,?,?,?,?,?,?)")
        .bind(id("cl"), pay.user_id, Number(pay.credits), "topup", pay.id, nb, now()).run();
    }
  }
  await finAudit(env, `webhook:${p.provider}`, to, pay.id, `ref=${ref} amount=${pay.amount_dzd}`);
  return json({ ok: true, status: to });
});

// ═══ مسارات إدارة الدفع والإعدادات (خلف بوابة اللوحة المركزية) ═══
route("GET", "/api/admin/settings", async (_r, env) => {
  const { results } = await env.DB.prepare("SELECT k, v, updated_at, updated_by FROM settings ORDER BY k").all<any>();
  return json({ settings: results ?? [] });
});
route("PUT", "/api/admin/settings", async (req, env, s) => {
  if (!s) return bad("not_found", 404);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const b = (await req.json().catch(() => ({}))) as any;
  const allow = ["payments_enabled", "ai_free_daily", "ai_free_monthly", "credits_price_dzd_per_100", "webhook_secret_chargily", "webhook_secret_sofizpay"];
  let n = 0;
  for (const [k, v] of Object.entries(b)) {
    if (!allow.includes(k)) continue;
    await setSetting(env, k, String(v).slice(0, 200), s.userId); n++;
  }
  await audit(env, s.userId, "settings_update", `${n} keys`);
  return json({ ok: true, updated: n });
});
route("GET", "/api/admin/plans", async (_r, env) => {
  const { results } = await env.DB.prepare("SELECT * FROM plans ORDER BY sort").all<any>();
  return json({ plans: results ?? [] });
});
route("PUT", "/api/admin/plans/:id", async (req, env, s, p) => {
  if (!s) return bad("not_found", 404);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const b = (await req.json().catch(() => ({}))) as any;
  const price = Math.max(0, Math.min(9999999, Number(b.price_dzd ?? 0)));
  await env.DB.prepare("UPDATE plans SET price_dzd = ?, active = ?, buyable = ? WHERE id = ?")
    .bind(price, b.active ? 1 : 0, b.buyable ? 1 : 0, p.id).run();
  await audit(env, s.userId, "plan_update", `${p.id} price=${price} active=${b.active ? 1 : 0} buyable=${b.buyable ? 1 : 0}`);
  return json({ ok: true });
});
route("GET", "/api/admin/payments", async (req, env) => {
  const st = new URL(req.url).searchParams.get("status");
  const rows = st
    ? await env.DB.prepare("SELECT p.*, u.email, u.name FROM payments p JOIN users u ON u.id = p.user_id WHERE p.status = ? ORDER BY p.created_at DESC LIMIT 100").bind(st).all<any>()
    : await env.DB.prepare("SELECT p.*, u.email, u.name FROM payments p JOIN users u ON u.id = p.user_id ORDER BY p.created_at DESC LIMIT 100").all<any>();
  return json({ payments: rows.results ?? [] });
});
route("POST", "/api/admin/payments/:id/status", async (req, env, s, p) => {
  if (!s) return bad("not_found", 404);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  const b = (await req.json().catch(() => ({}))) as any;
  const to = String(b.status ?? "");
  if (!canTransit("pending", to as PayState) && to !== "refunded") return bad("invalid_transition", 400);
  const pay = await env.DB.prepare("SELECT * FROM payments WHERE id = ?").bind(p.id).first<any>();
  if (!pay) return bad("not_found", 404);
  if (!canTransit(pay.status, to as PayState)) return bad("invalid_transition", 409);
  await env.DB.prepare("UPDATE payments SET status = ?, confirmed_at = ? WHERE id = ?").bind(to, to === "confirmed" || to === "refunded" ? now() : pay.confirmed_at, p.id).run();
  await finAudit(env, s.userId, `manual_${to}`, p.id, `was=${pay.status}`);
  return json({ ok: true });
});
route("GET", "/api/admin/devices", async (_r, env) => {
  const { results } = await env.DB.prepare("SELECT id, label, created_at, last_seen, revoked FROM admin_devices ORDER BY created_at DESC LIMIT 50").all<any>();
  return json({ devices: results ?? [] });
});
route("POST", "/api/admin/devices/:id/revoke", async (req, env, s, p) => {
  if (!s) return bad("not_found", 404);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return bad("csrf", 403);
  await env.DB.prepare("UPDATE admin_devices SET revoked = 1 WHERE id = ?").bind(p.id).run();
  await audit(env, s.userId, "device_revoke", p.id);
  return json({ ok: true });
});
route("GET", "/api/admin/audit-financial", async (_r, env) => {
  const { results } = await env.DB.prepare("SELECT * FROM financial_audit ORDER BY at DESC LIMIT 200").all<any>();
  return json({ audit: results ?? [] });
});
// تدوير رابط اللوحة: القديم يموت فوراً — الجديد يُعرض مرة واحدة
route("POST", "/api/admin/rotate-panel", async (_r, env, s) => {
  if (!s) return bad("not_found", 404);
  let secret = await getAdminMeta(env, "path_secret");
  if (!secret) { secret = hex(32); await env.DB.prepare("INSERT INTO admin_meta (k, v) VALUES ('path_secret', ?)").bind(secret).run(); }
  const tok = b62Of(await hmacHex(secret, s.userId + hex(16))).slice(0, 28);
  await env.DB.prepare("INSERT INTO admin_meta (k, v) VALUES ('panel_hash', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v")
    .bind(await sha256hex(tok)).run();
  await audit(env, s.userId, "panel_rotated", "");
  return json({ ok: true, panel_url: `/panel/${tok}` });
});

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    if (path.startsWith("/api/")) {
      const s = await getSession(env, req);
      for (const r of R) {
        if (r.m !== req.method) continue;
        const params = matchPath(r.pat, path);
        if (!params) continue;
        // بوابة الإدارة المركزية: مسار اللوحة السري + جهاز مدير صالح + جلسة مدير — وإلا 404 صامت
        if (r.pat.startsWith("/api/admin") && r.pat !== "/api/admin/setup" && r.pat !== "/api/admin/setup-status") {
          if (!s || s.role !== "admin") return bad("not_found", 404);
          const ph = await getAdminMeta(env, "panel_hash");
          const xp = req.headers.get("x-panel") ?? "";
          if (!ph || !xp || (await sha256hex(xp)) !== ph) return bad("not_found", 404);
          if (!(await verifyAdminDevice(env, req))) return bad("not_found", 404);
        }
        try {
          return await r.h(req, env, s, params);
        } catch (err: any) {
          return json({ error: "server_error", detail: clip(String(err?.message ?? err), 200) }, 500);
        }
      }
      return bad("not_found", 404);
    }
    // الإعداد لمرة واحدة: يختفي تماماً بعد إنشاء المالك
    if (path === "/setup") {
      if ((await getAdminMeta(env, "setup_done")) === "1") return new Response("Not Found", { status: 404, headers: { "content-type": "text/plain" } });
      return env.ASSETS.fetch(new Request(new URL("/", req.url).toString(), { headers: req.headers, method: "GET" }));
    }
    // لوحة الإدارة: العنوان الحقيقي مشتق مختلط — /admin الوهمية وكل مسار آخر 404
    if (path.startsWith("/panel/")) {
      const tok = path.slice("/panel/".length).replace(/\/+$/, "");
      const ph = await getAdminMeta(env, "panel_hash");
      if (!tok || !ph || (await sha256hex(tok)) !== ph) return new Response("Not Found", { status: 404, headers: { "content-type": "text/plain" } });
      return env.ASSETS.fetch(new Request(new URL("/", req.url).toString(), { headers: req.headers, method: "GET" }));
    }
    return env.ASSETS.fetch(req);
  },
};
