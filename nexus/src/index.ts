// ——— NEXUS — منصة التجار: متجر برابط مستقل + سوق/فيد + طلبيات + مالية ———
import type { Env, Session, Plan } from "./env";
import { fleetChat, buildSystemPrompt, parseFleet, PLAN_QUOTA, PLAN_PRODUCTS } from "./agent";
import {
  json, bad, id, now, clip, parseCookies, getSession, createSession, sessionCookie, clearCookie,
  destroySession, hex, ctEqual, rl, isEmail, isK0, isSlug, isPhoneDZ, isHttpsUrl, isImagePath, sniffImage, isStr, RESERVED_SLUGS,
} from "./lib";

type Route = {
  m: string; pat: string;
  h: (r: Request, e: Env, s: Session | null, p: Record<string, string>) => Promise<Response>;
  auth?: boolean; csrf?: boolean;
};
const R: Route[] = [];
const route = (m: string, pat: string, h: Route["h"], o: Partial<Route> = {}) => R.push({ m, pat, h, auth: !!o.auth, csrf: !!o.csrf });

function matchPath(pat: string, path: string): Record<string, string> | null {
  const a = pat.split("/"), b = path.split("/");
  if (a.length !== b.length) return null;
  const out: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    const pa = a[i]!, pb = b[i]!;
    if (pa.startsWith(":")) out[pa.slice(1)] = decodeURIComponent(pb);
    else if (pa !== pb) return null;
  }
  return out;
}

const DAY = 86400_000; // ملّي — للاستعلامات
const DAY_S = 86400; // ثوانٍ — لنوافذ rl

// ═══ الحماية: ترويسات أمنية على كل رد ═══
const SEC: Record<string, string> = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "content-security-policy":
    "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};
function secure(res: Response): Response {
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(SEC)) h.set(k, v);
  return new Response(res.body, { status: res.status, headers: h });
}

// ═══ الإشعارات ═══
async function notify(env: Env, userId: string, type: string, title: string, body: string): Promise<void> {
  await env.DB.prepare("INSERT INTO notifications (id, user_id, type, title, body, read, created_at) VALUES (?,?,?,?,?,0,?)")
    .bind(id("n"), userId, type, clip(title, 80), clip(body, 200), now()).run();
}

const body = async (req: Request): Promise<Record<string, unknown>> => {
  try { return (await req.json()) as Record<string, unknown>; } catch { return {}; }
};
const str = (b: Record<string, unknown>, k: string): string => (typeof b[k] === "string" ? (b[k] as string) : "");
const num = (b: Record<string, unknown>, k: string): number => {
  const n = Number(b[k]);
  return Number.isFinite(n) ? n : NaN;
};

const CATEGORIES = ["mode", "beauty", "electronics", "home", "kids", "food", "sport", "other"];

type UserRow = {
  id: string; email: string; name: string; slug: string; k0: string;
  store_name: string; bio: string; logo: string; banner: string; whatsapp: string; color: string;
  plan: Plan; credits: number; verified: number; created_at: number;
};
const publicUser = (u: UserRow) => ({
  slug: u.slug, store_name: u.store_name || u.name, bio: u.bio, logo: u.logo, banner: u.banner,
  whatsapp: u.whatsapp, color: u.color, created_at: u.created_at,
  plan: u.plan ?? "free", verified: u.verified ?? 0,
});

async function getUser(env: Env, sessionId: string): Promise<UserRow | null> {
  const r = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(sessionId).first<UserRow>();
  return r ?? null;
}

// ═══ الصحة ═══
route("GET", "/api/health", async (_r, e) => json({ ok: true, v: "2.0.0", app: "nexus", env: e.ENVIRONMENT }));

// ═══ المصادقة ═══
route("POST", "/api/auth/register", async (req, env) => {
  const ip = req.headers.get("cf-connecting-ip") ?? "x";
  if (!(await rl(env, `reg:${ip}`, 15, DAY_S))) return bad("too_many", 429);
  const b = await body(req);
  const email = clip(str(b, "email").toLowerCase().trim(), 190);
  const k0 = str(b, "k0");
  const name = clip(str(b, "name").trim(), 60);
  const slug = clip(str(b, "slug").toLowerCase().trim(), 30);
  const store_name = clip(str(b, "store_name").trim(), 60) || name;
  if (!isEmail(email)) return bad("invalid_email");
  if (!isK0(k0)) return bad("invalid_k0");
  if (!isStr(name, 2, 60)) return bad("invalid_name");
  if (!isSlug(slug) || RESERVED_SLUGS.has(slug)) return bad("invalid_slug");
  const dupe = await env.DB.prepare("SELECT id FROM users WHERE email = ? OR slug = ?").bind(email, slug).first();
  if (dupe) return bad("exists", 409);
  const uid = id("u");
  await env.DB.prepare(
    "INSERT INTO users (id, email, name, slug, k0, store_name, created_at) VALUES (?,?,?,?,?,?,?)"
  ).bind(uid, email, name, slug, k0, store_name, now()).run();
  const s = await createSession(env, uid);
  return json({ ok: true, slug, csrf: s.csrf }, 200, { "set-cookie": sessionCookie(s.sid) });
}, { csrf: false });

route("POST", "/api/auth/login", async (req, env) => {
  const ip = req.headers.get("cf-connecting-ip") ?? "x";
  if (!(await rl(env, `log:${ip}`, 30, 600))) return bad("too_many", 429);
  const b = await body(req);
  const email = clip(str(b, "email").toLowerCase().trim(), 190);
  if (!(await rl(env, `logE:${email}`, 8, 900))) return bad("too_many", 429);
  const k0 = str(b, "k0");
  if (!isEmail(email) || !isK0(k0)) return bad("invalid", 401);
  const u = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<UserRow>();
  if (!u || !ctEqual(u.k0, k0)) return bad("invalid", 401);
  const s = await createSession(env, u.id);
  return json({ ok: true, slug: u.slug, csrf: s.csrf }, 200, { "set-cookie": sessionCookie(s.sid) });
}, { csrf: false });

route("POST", "/api/auth/logout", async (req, env, s) => {
  if (s) await destroySession(env, req);
  return json({ ok: true }, 200, { "set-cookie": clearCookie() });
});

route("GET", "/api/me", async (_r, env, s) => {
  if (!s) return bad("auth_required", 401);
  const u = await getUser(env, s.userId);
  if (!u) return bad("auth_required", 401);
  const counts = await env.DB.prepare(
    `SELECT
      (SELECT COUNT(*) FROM products WHERE user_id = ?1 AND active = 1) AS products,
      (SELECT COUNT(*) FROM orders WHERE user_id = ?1 AND status = 'new') AS orders_new,
      (SELECT COUNT(*) FROM orders WHERE user_id = ?1) AS orders`
  ).bind(u.id).first<{ products: number; orders_new: number; orders: number }>();
  const day = new Date().toISOString().slice(0, 10);
  const agentToday = Number((await env.CACHE_KV.get(`aq:${u.id}:${day}`)) ?? "0");
  return json({
    user: { ...publicUser(u), name: u.name, email: u.email },
    csrf: s.csrf, counts,
    plan: u.plan ?? "free", credits: u.credits ?? 0,
    plan_products: PLAN_PRODUCTS[u.plan ?? "free"] ?? 3,
    agent_today: agentToday, agent_quota: PLAN_QUOTA[u.plan ?? "free"] ?? 15,
  });
});

route("PUT", "/api/me", async (req, env, s) => {
  if (!s) return bad("auth_required", 401);
  const b = await body(req);
  const store_name = clip(str(b, "store_name").trim(), 60);
  const bio = clip(str(b, "bio").trim(), 400);
  const logo = clip(str(b, "logo").trim(), 600);
  const banner = clip(str(b, "banner").trim(), 600);
  const whatsapp = clip(str(b, "whatsapp").replace(/[^\d+]/g, ""), 15);
  const color = clip(str(b, "color").trim(), 20);
  if (logo && !isHttpsUrl(logo)) return bad("invalid_logo");
  if (banner && !isHttpsUrl(banner)) return bad("invalid_banner");
  await env.DB.prepare("UPDATE users SET store_name = ?, bio = ?, logo = ?, banner = ?, whatsapp = ?, color = ? WHERE id = ?")
    .bind(store_name, bio, logo, banner, whatsapp, color, s.userId).run();
  const u = await getUser(env, s.userId);
  return u ? json({ ok: true, user: { ...publicUser(u), name: u.name } }) : bad("gone", 404);
}, { auth: true, csrf: true });

// ═══ المنتجات ═══
function validateProduct(b: Record<string, unknown>): { error?: string; v?: ProductInput } {
  const title = clip(str(b, "title").trim(), 120);
  const descr = clip(str(b, "descr").trim(), 2000);
  const price = num(b, "price");
  const compare_at = num(b, "compare_at") || 0;
  const image = str(b, "image").trim();
  const category = clip(str(b, "category").trim(), 20);
  const stock = Number.isFinite(num(b, "stock")) ? Math.trunc(num(b, "stock")) : -1;
  const featured = b.featured ? 1 : 0;
  if (!isStr(title, 3, 120)) return { error: "invalid_title" };
  if (!Number.isFinite(price) || price < 1 || price > 99_000_000) return { error: "invalid_price" };
  if (compare_at && (compare_at < price || compare_at > 99_000_000)) return { error: "invalid_compare" };
  if (!isHttpsUrl(image) && !isImagePath(image)) return { error: "invalid_image" };
  if (!CATEGORIES.includes(category)) return { error: "invalid_category" };
  if (stock < -1 || stock > 100_000) return { error: "invalid_stock" };
  return { v: { title, descr, price: Math.trunc(price), compare_at: Math.trunc(compare_at), image, category, stock, featured } };
}
type ProductInput = { title: string; descr: string; price: number; compare_at: number; image: string; category: string; stock: number; featured: number };

route("POST", "/api/products", async (req, env, s) => {
  if (!s) return bad("auth_required", 401);
  if (!(await rl(env, `prd:${s.userId}`, 80, DAY_S))) return bad("too_many", 429);
  const v = validateProduct(await body(req));
  if (v.error) return bad(v.error);
  const u = await getUser(env, s.userId);
  if (!u) return bad("auth_required", 401);
  const plan = (u.plan ?? "free") as Plan;
  const cnt = await env.DB.prepare("SELECT COUNT(*) AS n FROM products WHERE user_id = ? AND active = 1").bind(u.id)
    .first<{ n: number }>();
  const limit = PLAN_PRODUCTS[plan] ?? 3;
  if ((cnt?.n ?? 0) >= limit) {
    if ((u.credits ?? 0) > 0) {
      const ded = await env.DB.prepare("UPDATE users SET credits = credits - 1 WHERE id = ? AND credits > 0").bind(u.id).run();
      if ((ded.meta.changes ?? 0) === 0) return bad("plan_limit", 402);
    } else return json({ error: "plan_limit", limit }, 402);
  }
  const pid = id("p");
  await env.DB.prepare(
    "INSERT INTO products (id, user_id, title, descr, price, compare_at, image, category, stock, featured, active, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)"
  ).bind(pid, s.userId, v.v!.title, v.v!.descr, v.v!.price, v.v!.compare_at, v.v!.image, v.v!.category, -1, v.v!.featured, 1, now()).run();
  return json({ ok: true, id: pid }, 201);
}, { auth: true, csrf: true });

route("GET", "/api/products", async (_r, env, s) => {
  if (!s) return bad("auth_required", 401);
  const { results } = await env.DB.prepare("SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC LIMIT 200")
    .bind(s.userId).all();
  return json({ products: results ?? [] });
}, { auth: true });

route("PUT", "/api/products/:id", async (req, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  const own = await env.DB.prepare("SELECT id FROM products WHERE id = ? AND user_id = ?").bind(p.id, s.userId).first();
  if (!own) return bad("not_found", 404);
  const v = validateProduct(await body(req));
  if (v.error) return bad(v.error);
  await env.DB.prepare(
    "UPDATE products SET title=?, descr=?, price=?, compare_at=?, image=?, category=?, stock=?, featured=? WHERE id=? AND user_id=?"
  ).bind(v.v!.title, v.v!.descr, v.v!.price, v.v!.compare_at, v.v!.image, v.v!.category, -1, v.v!.featured, p.id, s.userId).run();
  return json({ ok: true });
}, { auth: true, csrf: true });

route("DELETE", "/api/products/:id", async (_r, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  const r = await env.DB.prepare("DELETE FROM products WHERE id = ? AND user_id = ?").bind(p.id, s.userId).run();
  return json({ ok: true, deleted: r.meta.changes ?? 0 });
}, { auth: true, csrf: true });

// ═══ الطلبيات (عامة على رابط المتجر) ═══
route("POST", "/api/store/:slug/order", async (req, env, _s, p) => {
  const ip = req.headers.get("cf-connecting-ip") ?? "x";
  if (!(await rl(env, `ord:${p.slug}:${ip}`, 20, DAY_S)) || !(await rl(env, `ord:${ip}`, 60, DAY_S))) return bad("too_many", 429);
  const b = await body(req);
  const store = await env.DB.prepare("SELECT id FROM users WHERE slug = ?").bind(p.slug).first<{ id: string }>();
  if (!store) return bad("not_found", 404);
  const pid = clip(str(b, "product_id"), 30);
  const prod = await env.DB.prepare("SELECT * FROM products WHERE id = ? AND user_id = ? AND active = 1").bind(pid, store.id)
    .first<{ id: string; title: string; price: number; stock: number }>();
  if (!prod) return bad("product_unavailable", 404);
  const cname = clip(str(b, "cname").trim(), 80);
  const phone = str(b, "phone").replace(/\s+/g, "");
  const wilaya = Math.trunc(num(b, "wilaya"));
  const commune = clip(str(b, "commune").trim(), 60);
  const delivery = str(b, "delivery") === "desk" ? "desk" : "home";
  const address = clip(str(b, "address").trim(), 200);
  const note = clip(str(b, "note").trim(), 300);
  const qty = Math.max(1, Math.min(20, Math.trunc(num(b, "qty")) || 1));
  if (!isStr(cname, 3, 80)) return bad("invalid_name");
  if (!isPhoneDZ(phone)) return bad("invalid_phone");
  if (!(wilaya >= 1 && wilaya <= 69)) return bad("invalid_wilaya");
  if (!isStr(commune, 2, 60)) return bad("invalid_commune");
  if (delivery === "home" && address.length < 5) return bad("invalid_address");
  if (prod.stock >= 0 && prod.stock < qty) return bad("out_of_stock");
  if (prod.stock >= 0) {
    const up = await env.DB.prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?")
      .bind(qty, prod.id, qty).run();
    if ((up.meta.changes ?? 0) === 0) return bad("out_of_stock");
  }
  const oid = id("o");
  await env.DB.prepare(
    "INSERT INTO orders (id, user_id, product_id, ptitle, qty, unit_price, total, cname, phone, wilaya, commune, delivery, address, note, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'new',?)"
  ).bind(oid, store.id, prod.id, prod.title, qty, prod.price, prod.price * qty, cname, phone, wilaya, commune, delivery, address, note, now()).run();
  await notify(env, store.id, "order", "طلبية جديدة", `${cname} طلب ${qty} × ${prod.title} — ${commune}`);
  return json({ ok: true, id: oid }, 201);
});

route("GET", "/api/orders", async (req, env, s) => {
  if (!s) return bad("auth_required", 401);
  const st = new URL(req.url).searchParams.get("status") ?? "";
  const q = st
    ? "SELECT * FROM orders WHERE user_id = ?1 AND status = ?2 ORDER BY created_at DESC LIMIT 200"
    : "SELECT * FROM orders WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 200";
  const { results } = await env.DB.prepare(q).bind(...(st ? [s.userId, st] : [s.userId])).all();
  return json({ orders: results ?? [] });
}, { auth: true });

route("PATCH", "/api/orders/:id", async (req, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  const b = await body(req);
  const status = str(b, "status");
  if (!["new", "confirmed", "shipped", "delivered", "cancelled"].includes(status)) return bad("invalid_status");
  const r = await env.DB.prepare("UPDATE orders SET status = ? WHERE id = ? AND user_id = ?")
    .bind(status, p.id, s.userId).run();
  if ((r.meta.changes ?? 0) === 0) return bad("not_found", 404);
  return json({ ok: true });
}, { auth: true, csrf: true });

// ═══ المالية ═══
route("GET", "/api/finance", async (_r, env, s) => {
  if (!s) return bad("auth_required", 401);
  const sums = await env.DB.prepare(
    `SELECT
      COALESCE(SUM(CASE WHEN status='delivered' THEN total END),0) AS revenue,
      COALESCE(SUM(CASE WHEN status IN ('new','confirmed','shipped') THEN total END),0) AS pending,
      COALESCE(SUM(CASE WHEN status='cancelled' THEN total END),0) AS cancelled
    FROM orders WHERE user_id = ?`
  ).bind(s.userId).first<{ revenue: number; pending: number; cancelled: number }>();
  const exp = await env.DB.prepare("SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE user_id = ?").bind(s.userId)
    .first<{ total: number }>();
  const byStatus = await env.DB.prepare("SELECT status, COUNT(*) AS n FROM orders WHERE user_id = ? GROUP BY status").bind(s.userId).all();
  const revSeries = await env.DB.prepare(
    `SELECT (created_at / 86400000) AS d, COALESCE(SUM(total),0) AS v FROM orders
     WHERE user_id = ?1 AND status='delivered' AND created_at > ?2 GROUP BY d ORDER BY d`
  ).bind(s.userId, now() - 14 * DAY).all();
  const expSeries = await env.DB.prepare(
    `SELECT (created_at / 86400000) AS d, COALESCE(SUM(amount),0) AS v FROM expenses
     WHERE user_id = ?1 AND created_at > ?2 GROUP BY d ORDER BY d`
  ).bind(s.userId, now() - 14 * DAY).all();
  return json({
    revenue: sums?.revenue ?? 0, pending: sums?.pending ?? 0, cancelled: sums?.cancelled ?? 0,
    expenses: exp?.total ?? 0, net: (sums?.revenue ?? 0) - (exp?.total ?? 0),
    by_status: byStatus.results ?? [], rev_series: revSeries.results ?? [], exp_series: expSeries.results ?? [],
  });
}, { auth: true });

route("POST", "/api/expenses", async (req, env, s) => {
  if (!s) return bad("auth_required", 401);
  if (!(await rl(env, `exp:${s.userId}`, 80, DAY_S))) return bad("too_many", 429);
  const b = await body(req);
  const label = clip(str(b, "label").trim(), 80);
  const amount = Math.trunc(num(b, "amount"));
  if (!isStr(label, 2, 80)) return bad("invalid_label");
  if (!Number.isFinite(amount) || amount < 1 || amount > 99_000_000) return bad("invalid_amount");
  const eid = id("e");
  await env.DB.prepare("INSERT INTO expenses (id, user_id, label, amount, created_at) VALUES (?,?,?,?,?)")
    .bind(eid, s.userId, label, amount, now()).run();
  return json({ ok: true, id: eid }, 201);
}, { auth: true, csrf: true });

route("GET", "/api/expenses", async (_r, env, s) => {
  if (!s) return bad("auth_required", 401);
  const { results } = await env.DB.prepare("SELECT * FROM expenses WHERE user_id = ? ORDER BY created_at DESC LIMIT 100").bind(s.userId).all();
  return json({ expenses: results ?? [] });
}, { auth: true });

route("DELETE", "/api/expenses/:id", async (_r, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  await env.DB.prepare("DELETE FROM expenses WHERE id = ? AND user_id = ?").bind(p.id, s.userId).run();
  return json({ ok: true });
}, { auth: true, csrf: true });

// ═══ منتج مفرد (صفحة المنتج تعمل دائماً) ═══
route("GET", "/api/product/:id", async (_r, env, _s, p) => {
  const r = await env.DB.prepare(
    `SELECT pr.id, pr.user_id, pr.title, pr.descr, pr.price, pr.compare_at, pr.image, pr.category, pr.stock, pr.created_at,
      u.slug AS store_slug, u.store_name AS store_name, u.logo AS store_logo, u.whatsapp AS store_whatsapp
    FROM products pr JOIN users u ON u.id = pr.user_id
    WHERE pr.id = ?1 AND pr.active = 1`
  ).bind(p.id).first();
  if (!r) return bad("not_found", 404);
  return json({ product: { ...r, user_id: undefined }, store: { slug: r.store_slug, store_name: r.store_name, logo: r.store_logo, whatsapp: r.store_whatsapp } });
});

// ═══ رفع الصور (KV — بلا R2) ═══
route("POST", "/api/media", async (req, env, s) => {
  if (!s) return bad("auth_required", 401);
  if (!(await rl(env, `med:${s.userId}`, 60, DAY_S))) return bad("too_many", 429);
  const ct = (req.headers.get("content-type") ?? "").split(";")[0]?.trim() ?? "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(ct)) return bad("invalid_type");
  const buf = await req.arrayBuffer();
  if (buf.byteLength < 64) return bad("too_small");
  if (buf.byteLength > 600_000) return bad("too_large", 413);
  const kind = sniffImage(buf);
  if (!kind) return bad("invalid_image");
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const hash = [...new Uint8Array(digest)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
  await env.CACHE_KV.put(`img:${hash}`, buf);
  return json({ ok: true, url: `/media/${hash}.${kind}` }, 201);
}, { auth: true, csrf: true });

// ═══ المتجر العام ═══
route("GET", "/api/store/:slug", async (_r, env, _s, p) => {
  const u = await env.DB.prepare("SELECT * FROM users WHERE slug = ?").bind(p.slug).first<UserRow>();
  if (!u) return bad("not_found", 404);
  const { results } = await env.DB.prepare(
    "SELECT id, title, descr, price, compare_at, image, category, stock, created_at FROM products WHERE user_id = ? AND active = 1 ORDER BY featured DESC, created_at DESC LIMIT 100"
  ).bind(u.id).all();
  return json({ store: publicUser(u), products: results ?? [], agent_enabled: !!env.AI_KEYS });
});

// ═══ الفيد والاستكشاف ═══
route("GET", "/api/feed", async (req, env) => {
  const url = new URL(req.url);
  const before = Number(url.searchParams.get("before")) || now() + 1;
  const cat = clip(url.searchParams.get("cat") ?? "", 20);
  const q = clip((url.searchParams.get("q") ?? "").trim(), 60);
  let sql = `SELECT pr.id, pr.title, pr.price, pr.compare_at, pr.image, pr.category, pr.created_at,
    u.slug AS store_slug, u.store_name AS store_name, u.logo AS store_logo, u.verified AS store_verified, u.plan AS store_plan
    FROM products pr JOIN users u ON u.id = pr.user_id
    WHERE pr.active = 1 AND pr.created_at < ?1`;
  const binds: (string | number)[] = [before];
  if (cat) { sql += " AND pr.category = ?2"; binds.push(cat); }
  if (q) { sql += ` AND (pr.title LIKE ?${binds.length + 1} OR u.store_name LIKE ?${binds.length + 1})`; binds.push(`%${q}%`); }
  sql += ` ORDER BY CASE u.plan WHEN 'vip' THEN 0 WHEN 'pro' THEN 1 ELSE 2 END, pr.featured DESC, pr.created_at DESC LIMIT 24`;
  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  return json({ posts: results ?? [] });
});

route("GET", "/api/categories", async (_r, env) => {
  const { results } = await env.DB.prepare(
    "SELECT category, COUNT(*) AS n FROM products WHERE active = 1 AND category != '' GROUP BY category ORDER BY n DESC"
  ).all();
  return json({ categories: results ?? [] });
});

// ═══ الوكيل الذكي (قناتنا الأولى داخل المتجر — القنوات الخارجية لاحقاً بأمر المالك) ═══
route("GET", "/api/store/:slug/agent", async (_r, env, _s, p) => {
  const u = await env.DB.prepare("SELECT id, store_name, plan, verified FROM users WHERE slug = ?").bind(p.slug).first<UserRow>();
  if (!u) return bad("not_found", 404);
  const day = new Date().toISOString().slice(0, 10);
  const used = Number((await env.CACHE_KV.get(`aq:${u.id}:${day}`)) ?? "0");
  const quota = PLAN_QUOTA[(u.plan ?? "free") as Plan] ?? 15;
  const fleet = parseFleet(env.AI_KEYS);
  const out = { counts: { gemini: 0, groq: 0, openrouter: 0 } };
  for (const f of fleet) out.counts[f.p as "gemini" | "groq" | "openrouter"]++;
  return json({
    enabled: !!env.AI_KEYS && used < quota,
    store_name: u.store_name || u.name,
    plan: u.plan ?? "free", verified: u.verified ?? 0,
    remaining: Math.max(0, quota - used),
    fleet: { gemini: out.counts.gemini, groq: out.counts.groq, openrouter: out.counts.openrouter },
  });
});

route("POST", "/api/agent/chat", async (req, env) => {
  if (!env.AI_KEYS) return json({ error: "agent_disabled" }, 503);
  const ip = req.headers.get("cf-connecting-ip") ?? "x";
  if (!(await rl(env, `chat:${ip}`, 30, 600))) return bad("too_many", 429);
  const b = await body(req);
  const slug = clip(str(b, "store_slug").toLowerCase(), 30);
  const message = clip(str(b, "message").trim(), 600);
  const lang = str(b, "lang") === "en" ? "en" : "ar";
  const buyer = clip(str(b, "buyer"), 24) || hex(12);
  const sidIn = clip(str(b, "session_id"), 30);
  if (!isStr(message, 1, 600)) return bad("invalid_message");
  const store = await env.DB.prepare("SELECT * FROM users WHERE slug = ?").bind(slug).first<UserRow>();
  if (!store) return bad("not_found", 404);
  const day = new Date().toISOString().slice(0, 10);
  const kq = `aq:${store.id}:${day}`;
  const used = Number((await env.CACHE_KV.get(kq)) ?? "0");
  const quota = PLAN_QUOTA[(store.plan ?? "free") as Plan] ?? 15;
  if (used >= quota) return json({ handoff: true, reply: "" }, 200);

  let sess = sidIn
    ? await env.DB.prepare("SELECT * FROM agent_sessions WHERE id = ? AND user_id = ?").bind(sidIn, store.id).first<{ id: string; msgs: number }>()
    : null;
  if (!sess) {
    sess = { id: id("as"), msgs: 0 };
    await env.DB.prepare("INSERT INTO agent_sessions (id, user_id, buyer, status, msgs, created_at, updated_at) VALUES (?,?,?,'open',0,?,?)")
      .bind(sess.id, store.id, buyer, now(), now()).run();
    if (!sidIn) await notify(env, store.id, "agent", "جلسة وكيل جديدة", "زبون بدأ محادثة مع وكيل متجرك");
  }
  const hist = await env.DB.prepare("SELECT role, content FROM agent_messages WHERE session_id = ? ORDER BY created_at DESC LIMIT 8")
    .bind(sess.id).all<{ role: string; content: string }>();
  const msgs = (hist.results ?? []).reverse().map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  msgs.push({ role: "user", content: message });
  const prods = await env.DB.prepare("SELECT title, price, descr FROM products WHERE user_id = ? AND active = 1 ORDER BY featured DESC, created_at DESC LIMIT 20")
    .bind(store.id).all<{ title: string; price: number; descr: string }>();
  const sys = buildSystemPrompt(store.store_name || store.name, prods.results ?? [], lang);
  let reply = await fleetChat(env, sys, msgs);
  if (reply === null) {
    reply = "";
    await env.DB.prepare("INSERT INTO agent_messages (id, session_id, role, content, created_at) VALUES (?,?,?,?,?)")
      .bind(id("am"), sess.id, "user", message, now()).run();
    return json({ handoff: true, session_id: sess.id }, 200);
  }
  await env.DB.batch([
    env.DB.prepare("INSERT INTO agent_messages (id, session_id, role, content, created_at) VALUES (?,?,?,?,?)").bind(id("am"), sess.id, "user", message, now()),
    env.DB.prepare("INSERT INTO agent_messages (id, session_id, role, content, created_at) VALUES (?,?,?,?,?)").bind(id("am"), sess.id, "assistant", clip(reply, 1200), now()),
    env.DB.prepare("UPDATE agent_sessions SET msgs = msgs + 2, updated_at = ? WHERE id = ?").bind(now(), sess.id),
  ]);
  await env.CACHE_KV.put(kq, String(used + 1), { expirationTtl: DAY_S });
  return json({ reply: clip(reply, 1200), session_id: sess.id, remaining: Math.max(0, quota - used - 1) });
});

route("GET", "/api/agent/sessions", async (_r, env, s) => {
  if (!s) return bad("auth_required", 401);
  const { results } = await env.DB.prepare(
    "SELECT * FROM agent_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50"
  ).bind(s.userId).all();
  const day = new Date().toISOString().slice(0, 10);
  const used = Number((await env.CACHE_KV.get(`aq:${s.userId}:${day}`)) ?? "0");
  const u = await getUser(env, s.userId);
  const quota = PLAN_QUOTA[(u?.plan ?? "free") as Plan] ?? 15;
  return json({ sessions: results ?? [], today: used, quota });
}, { auth: true });

route("GET", "/api/agent/sessions/:id", async (_r, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  const sess = await env.DB.prepare("SELECT * FROM agent_sessions WHERE id = ? AND user_id = ?").bind(p.id, s.userId).first();
  if (!sess) return bad("not_found", 404);
  const { results } = await env.DB.prepare("SELECT role, content, created_at FROM agent_messages WHERE session_id = ? ORDER BY created_at")
    .bind(p.id).all();
  return json({ session: sess, messages: results ?? [] });
}, { auth: true });

route("PATCH", "/api/agent/sessions/:id", async (req, env, s, p) => {
  if (!s) return bad("auth_required", 401);
  const b = await body(req);
  const status = str(b, "status");
  if (!["open", "closed"].includes(status)) return bad("invalid_status");
  const r = await env.DB.prepare("UPDATE agent_sessions SET status = ? WHERE id = ? AND user_id = ?").bind(status, p.id, s.userId).run();
  if ((r.meta.changes ?? 0) === 0) return bad("not_found", 404);
  return json({ ok: true });
}, { auth: true, csrf: true });

// ═══ الإدارة (مخفية — 404 صامت بلا سر) ═══
route("POST", "/api/admin/auth", async (req, env) => {
  if (!env.ADMIN_K0) return bad("not_found", 404);
  const b = await body(req);
  const k0 = str(b, "k0");
  if (!isK0(k0) || !ctEqual(env.ADMIN_K0, k0)) return bad("invalid", 401);
  const tok = hex(24);
  await env.CACHE_KV.put(`adm:${tok}`, "1", { expirationTtl: 8 * 3600 });
  return json({ ok: true, csrf: tok }, 200, {
    "set-cookie": `nx_adm=${tok}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${8 * 3600}`,
  });
});

async function adminGuard(env: Env, req: Request): Promise<boolean> {
  if (!env.ADMIN_K0) return false;
  const tok = parseCookies(req)["nx_adm"];
  if (!tok || !/^[0-9a-f]{48}$/.test(tok)) return false;
  return (await env.CACHE_KV.get(`adm:${tok}`)) === "1";
}

route("POST", "/api/admin/grant", async (req, env) => {
  if (!(await adminGuard(env, req))) return bad("not_found", 404);
  const b = await body(req);
  const slug = clip(str(b, "slug").toLowerCase().trim(), 30);
  const u = await env.DB.prepare("SELECT id FROM users WHERE slug = ?").bind(slug).first<{ id: string }>();
  if (!u) return bad("not_found", 404);
  const plan = str(b, "plan");
  if (plan && !["free", "pro", "vip"].includes(plan)) return bad("invalid_plan");
  const addCredits = Math.max(0, Math.min(999, Math.trunc(num(b, "credits")) || 0));
  const verified = typeof b.verified === "boolean" ? (b.verified ? 1 : 0) : null;
  await env.DB.prepare(
    `UPDATE users SET
      plan = COALESCE(?2, plan),
      credits = credits + ?3,
      verified = COALESCE(?4, verified)
    WHERE id = ?1`
  ).bind(u.id, plan || null, addCredits, verified).run();
  await notify(env, u.id, "grant", "تحديث باقتك", [plan ? `الباقة: ${plan}` : "", addCredits ? `رصيد منتجات: +${addCredits}` : "", verified !== null ? (verified ? "موثق" : "") : ""].filter(Boolean).join(" — ") || "تحديث");
  return json({ ok: true });
});

route("GET", "/api/admin/stats", async (req, env) => {
  if (!(await adminGuard(env, req))) return bad("not_found", 404);
  const u = await env.DB.prepare(
    "SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM products) AS products, (SELECT COUNT(*) FROM orders) AS orders"
  ).first<{ users: number; products: number; orders: number }>();
  const recent = await env.DB.prepare("SELECT slug, store_name, created_at FROM users ORDER BY created_at DESC LIMIT 10").all();
  return json({ stats: u, recent_merchants: recent.results ?? [] });
});

// ═══ صياغة وصف المنتج بالوكيل (تحسب من حصة الباقة) ═══
route("POST", "/api/agent/describe", async (req, env, s) => {
  if (!env.AI_KEYS) return json({ error: "agent_disabled" }, 503);
  if (!(await rl(env, `desc:${s!.userId}`, 10, DAY_S))) return bad("too_many", 429);
  const b = await body(req);
  const title = clip(str(b, "title").trim(), 80);
  const hints = clip(str(b, "hints").trim(), 200);
  if (!isStr(title, 2, 80)) return bad("invalid_title");
  const day = new Date().toISOString().slice(0, 10);
  const kq = `aq:${s!.userId}:${day}`;
  const used = Number((await env.CACHE_KV.get(kq)) ?? "0");
  const u = await env.DB.prepare("SELECT plan FROM users WHERE id = ?").bind(s!.userId).first<UserRow>();
  if (!u) return bad("auth_required", 401);
  const quota = PLAN_QUOTA[(u.plan ?? "free") as Plan] ?? 15;
  if (used >= quota) return json({ error: "quota_exhausted" }, 429);
  const sys = `أنت كاتب أوصاف منتجات جزائري محترف في منصة NEXUS. اكتب وصفاً تجارياً جاذباً للمنتج "${title}"${hints ? ` مع إبراز: ${hints}` : ""}.
القواعد: دارجة جزائرية مبسطة، من 25 إلى 60 كلمة، بلا مبالغات كاذبة، بلا أسعار ولا أرقام هواتف، اختم بميزة الثقة (الدفع عند الاستلام لكل الولايات). أرجع الوصف فقط بلا مقدمات.`;
  const text = await fleetChat(env, sys, [{ role: "user", content: hints ? `${title} — ${hints}` : title }]);
  if (text === null) return json({ error: "fleet_down" }, 502);
  await env.CACHE_KV.put(kq, String(used + 1), { expirationTtl: DAY_S });
  return json({ ok: true, descr: clip(text, 600) });
}, { auth: true, csrf: true });

// ═══ إشعارات التاجر ═══
route("GET", "/api/notifications", async (_r, env, s) => {
  const { results } = await env.DB.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30").bind(s!.userId).all();
  const unread = await env.DB.prepare("SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read = 0").bind(s!.userId).first<{ c: number }>();
  return json({ notifications: results ?? [], unread: unread?.c ?? 0 });
}, { auth: true });

route("POST", "/api/notifications/read", async (_r, env, s) => {
  await env.DB.prepare("UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0").bind(s!.userId).run();
  return json({ ok: true });
}, { auth: true, csrf: true });

// ═══ الفيديوهات الإعلانية — استوديو VITO (أسعار أولية والخصم مفروض خادمياً) ═══
const AD_STYLES = [
  { id: "quick", base: 2500, dur: "15-20s" },
  { id: "lifestyle", base: 3900, dur: "20-30s" },
  { id: "sale", base: 2900, dur: "15-25s" },
  { id: "lux", base: 4500, dur: "25-35s" },
  { id: "intro", base: 5900, dur: "30-45s" },
];
const AD_DISCOUNT: Record<Plan, number> = { free: 0, pro: 0.3, vip: 0.5 };
const MEMBER_EXTRA: Record<string, number> = { "bridge-weekly": 0.10, "bridge-monthly": 0.20 };
/* خصم العضوية الجسرية: نتحقق من ناكساب مباشرة (كاش 60 ثانية) — بلا ثقة بكلام العميل */
async function memberExtra(env: Env, username: string): Promise<number> {
  const u = clip(username.trim().toLowerCase(), 30);
  if (!u) return 0;
  const ck = `bmem:${u}`;
  const cached = await env.CACHE_KV.get(ck);
  if (cached) return Number(cached);
  let pct = 0;
  try {
    const res = await fetch(`${env.NAKSAB_ORIGIN || "https://naksab.vitobytestudio.workers.dev"}/api/bridge/member/${encodeURIComponent(u)}`, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const j = (await res.json()) as any;
      if (j?.active) pct = MEMBER_EXTRA[j.plan] ?? 0;
    }
  } catch { pct = 0; }
  await env.CACHE_KV.put(ck, String(pct), { expirationTtl: 60 });
  return pct;
}
const adPrice = (base: number, plan: Plan, extra = 0) => Math.round(base * (1 - (AD_DISCOUNT[plan] ?? 0)) * (1 - extra));

route("GET", "/api/ads", async (req, env, s) => {
  const u = await env.DB.prepare("SELECT plan FROM users WHERE id = ?").bind(s!.userId).first<UserRow>();
  const plan = (u?.plan ?? "free") as Plan;
  const nk = new URL(req.url).searchParams.get("nk") ?? "";
  const extra = await memberExtra(env, nk);
  const { results } = await env.DB.prepare("SELECT * FROM ad_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20").bind(s!.userId).all();
  return json({
    discount: AD_DISCOUNT[plan] ?? 0,
    member_extra: extra,
    styles: AD_STYLES.map((st) => ({ id: st.id, dur: st.dur, base: st.base, price: adPrice(st.base, plan, extra) })),
    orders: results ?? [],
  });
}, { auth: true });

route("POST", "/api/ads/order", async (req, env, s) => {
  if (!(await rl(env, `ad:${s!.userId}`, 5, DAY_S))) return bad("too_many", 429);
  const b = await body(req);
  const st = AD_STYLES.find((x) => x.id === str(b, "style"));
  if (!st) return bad("invalid_style");
  const note = clip(str(b, "note").trim(), 300);
  const pid = clip(str(b, "product_id"), 30);
  if (pid) {
    const p = await env.DB.prepare("SELECT id FROM products WHERE id = ? AND user_id = ? AND active = 1").bind(pid, s!.userId).first();
    if (!p) return bad("invalid_product");
  }
  const u = await env.DB.prepare("SELECT plan FROM users WHERE id = ?").bind(s!.userId).first<UserRow>();
  const extra = await memberExtra(env, str(b, "nk_user"));
  const price = adPrice(st.base, (u?.plan ?? "free") as Plan, extra);
  const oid = id("ad");
  await env.DB.prepare("INSERT INTO ad_orders (id, user_id, style, product_id, status, price, note, created_at, updated_at) VALUES (?,?,?,?, 'new', ?,?,?,?)")
    .bind(oid, s!.userId, st.id, pid || null, price, note, now(), now()).run();
  await notify(env, s!.userId, "ads", "طلب فيديو إعلاني", "طلبك وصل الاستوديو — الحالة تظهر هنا");
  return json({ ok: true, id: oid, price }, 201);
}, { auth: true, csrf: true });

route("GET", "/api/admin/ads", async (req, env) => {
  if (!(await adminGuard(env, req))) return bad("not_found", 404);
  const { results } = await env.DB.prepare(
    "SELECT a.*, u.slug AS store_slug, u.store_name FROM ad_orders a JOIN users u ON u.id = a.user_id ORDER BY a.created_at DESC LIMIT 100").all();
  return json({ orders: results ?? [] });
});

route("PATCH", "/api/admin/ads/:id", async (req, env, _s, p) => {
  if (!(await adminGuard(env, req))) return bad("not_found", 404);
  const b = await body(req);
  const status = str(b, "status");
  if (status && !["new", "wip", "done"].includes(status)) return bad("invalid_status");
  const video = clip(str(b, "video_url").trim(), 500);
  if (video && !isHttpsUrl(video)) return bad("invalid_url");
  const row = await env.DB.prepare("SELECT user_id FROM ad_orders WHERE id = ?").bind(p.id).first<{ user_id: string }>();
  if (!row) return bad("not_found", 404);
  await env.DB.prepare("UPDATE ad_orders SET status = COALESCE(?2, status), video_url = COALESCE(?3, video_url), updated_at = ?4 WHERE id = ?1")
    .bind(p.id, status || null, video || null, now()).run();
  if (status === "done") await notify(env, row.user_id, "ads", "فيديوك الإعلاني جاهز", "شاهده من صفحة الفيديوهات");
  return json({ ok: true });
});

// ═══ وكيل استقبال نيكسوس (عام — يشتغل حتى بلا مفاتيح بذكاء معلب) ═══
const RECEPTION_FALLBACK: [RegExp, string, string][] = [
  [/متجر|افتح|حساب|سجل|store|open|register/i,
   "لفتح متجرك: سجّل بدقيقة (بريد + اسم متجرك ورابطه)، أضف أول منتج بصورته وسعره، وشارك رابط متجرك مع زبائنك — ومنتجاتك تظهر تلقائياً في سوق نيكسوس.",
   "To open your store: register in a minute (email + store name & link), add your first product with photo and price, share your store link — and your products appear in the NEXUS market automatically."],
  [/باقة|اشتراك|سعر المنصة|plan|pro|vip|subscription/i,
   "الباقات: المجانية (3 منتجات، 15 محادثة وكيل يومياً)، الاحترافية PRO (10 منتجات، 300 محادثة، خصم 30% على الفيديوهات)، وVIP النخبة (30 منتج، 1000 محادثة، خصم 50%). الترقية تتم بالتواصل مع إدارة المنصة.",
   "Plans: Free (3 products, 15 agent chats/day), PRO (10 products, 300 chats, 30% off videos), VIP (30 products, 1000 chats, 50% off). Upgrades are done via platform management."],
  [/توصيل|دفع|تسليم|delivery|cod|pay/i,
   "الطلبيات بالدفع عند الاستلام لكل ولايات الجزائر الـ58، والتوصيل للمنزل أو مكتب التوصيل — أنت لا تدفع شيئاً قبل ما تستلم سلعتك.",
   "Orders are cash-on-delivery across all Algerian wilayas, home or desk delivery — you pay nothing before receiving your item."],
  [/فيديو|إعلان|اعلان|ترويج|video|ad/i,
   "في لوحتك صفحة «الفيديوهات»: 5 أنماط إعلانية سينمائية بخصم باقتك، والطلب يوصل استوديو VITO مباشرة عبر واتساب.",
   "In your dashboard there's a Video ads page: 5 cinematic ad styles with your plan discount, ordered straight to the VITO studio via WhatsApp."],
];
function receptionCanned(m: string, lang: string): string {
  for (const [re, ar, en] of RECEPTION_FALLBACK) if (re.test(m)) return lang === "en" ? en : ar;
  return lang === "en"
    ? "Welcome to NEXUS — Algeria's merchant platform: your own store link, a national market, and an AI agent that answers your buyers. Register in a minute and start selling."
    : "أهلاً بك في نيكسوس — منصة التجار الجزائرية: متجر برابط مستقل، سوق وطني، ووكيل ذكي يرد على زبائنك. سجّل بدقيقة وابدأ البيع.";
}

route("POST", "/api/reception/chat", async (req, env) => {
  const ip = req.headers.get("cf-connecting-ip") ?? "x";
  if (!(await rl(env, `rec:${ip}`, 30, 600))) return bad("too_many", 429);
  const b = await body(req);
  const lang = str(b, "lang") === "en" ? "en" : "ar";
  const day = new Date().toISOString().slice(0, 10);
  const kc = `rec:day:${day}`;
  const used = Number((await env.CACHE_KV.get(kc)) ?? "0");
  const last = (Array.isArray(b.messages) ? b.messages : []).slice(-4)
    .map((m: any) => ({ role: m?.role === "assistant" ? "assistant" : "user", content: clip(String(m?.content ?? ""), 300) }))
    .filter((m: any) => m.content.trim());
  const question = last.length ? last[last.length - 1]!.content : clip(str(b, "message"), 300);
  /* السقف اليومي العام يحمي الأسطول — الاستقبال الملبّي لا يُطفأ أبداً */
  if (used >= 400 || !env.AI_KEYS) return json({ reply: receptionCanned(question, lang), canned: true });
  const sys = `أنت موظف استقبال منصة NEXUS (منصة تجار جزائرية). اشرح بإيجاز ودلف: كل تاجر يملك متجراً برابط مستقل + سوق وطني (فيد) + وكيل ذكي يرد زبائنه + باقات Free/PRO/VIP (3/10/30 منتجات) + استوديو فيديوهات إعلانية عبر واتساب. الطلبيات بالدفع عند الاستلام وطنياً. وجه الزائر دائماً نحو التسجيل («ابدأ الآن»). جاوب بسطرين إلى أربعة بالدارجة الجزائرية${lang === "en" ? " or English if asked" : ""}. لا تخترع أرقاماً ولا وعوداً.`;
  const msgs = last.map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content }));
  let reply = await fleetChat(env, sys, msgs.length ? msgs : [{ role: "user", content: question || "سلام، واش هي نيكسوس؟" }]);
  if (reply === null) return json({ reply: receptionCanned(question, lang), canned: true });
  await env.CACHE_KV.put(kc, String(used + 1), { expirationTtl: DAY_S });
  return json({ reply: clip(reply, 900) });
});

// ═══ منظّم المنتج قبل النشر (وكيل التاجر — من حصة باقته) ═══
route("POST", "/api/agent/organize", async (req, env, s) => {
  if (!env.AI_KEYS) return json({ error: "agent_disabled" }, 503);
  if (!(await rl(env, `org:${s!.userId}`, 20, DAY_S))) return bad("too_many", 429);
  const b = await body(req);
  const title = clip(str(b, "title").trim(), 80);
  const descr = clip(str(b, "descr").trim(), 600);
  const price = Math.trunc(num(b, "price"));
  if (!isStr(title, 2, 80)) return bad("invalid_title");
  const day = new Date().toISOString().slice(0, 10);
  const kq = `aq:${s!.userId}:${day}`;
  const used = Number((await env.CACHE_KV.get(kq)) ?? "0");
  const u = await env.DB.prepare("SELECT plan FROM users WHERE id = ?").bind(s!.userId).first<UserRow>();
  if (!u) return bad("auth_required", 401);
  const quota = PLAN_QUOTA[(u.plan ?? "free") as Plan] ?? 15;
  if (used >= quota) return json({ error: "quota_exhausted" }, 429);
  const sys = `أنت منظّم منتجات محترف في منصة NEXUS الجزائرية. رتب بطاقة المنتج التالية قبل نشرها. أرجع JSON فقط بهذا الشكل بلا أي نص إضافي:
{"title":"عنوان بيعي قصير واضح","descr":"وصف من 30 إلى 60 كلمة بالدارجة المبسطة يبرز الميزة والدفع عند الاستلام، بلا أسعار ولا هواتف","category":"واحد من: ${CATEGORIES.join("/")}","tips":["نصيحة تحسينية قصيرة","نصيحة قصيرة","نصيحة قصيرة"]}
المنتج: العنوان "${title}" — الوصف الحالي "${descr || "(فارغ)"}" — السعر ${price || "(غير محدد)"} دج.`;
  const text = await fleetChat(env, sys, [{ role: "user", content: title }]);
  if (text === null) return json({ error: "fleet_down" }, 502);
  let parsed: any = null;
  try {
    const m = /\{[\s\S]*\}/.exec(text);
    parsed = m ? JSON.parse(m[0]) : null;
  } catch { parsed = null; }
  await env.CACHE_KV.put(kq, String(used + 1), { expirationTtl: DAY_S });
  const out = {
    title: parsed && typeof parsed.title === "string" ? clip(parsed.title, 80) : title,
    descr: parsed && typeof parsed.descr === "string" ? clip(parsed.descr, 600) : descr,
    category: parsed && CATEGORIES.includes(parsed.category) ? parsed.category : null,
    tips: Array.isArray(parsed?.tips) ? parsed.tips.slice(0, 3).map((x: any) => clip(String(x), 120)) : [],
  };
  return json({ ok: true, ...out });
}, { auth: true, csrf: true });

// ═══ جسر المحترفين: كتالوج الموثقين من ناكساب (كاش 5 دقائق) ═══
route("GET", "/api/pro/services", async (_r, env) => {
  const ck = "pro:cat";
  const cached = await env.CACHE_KV.get(ck);
  if (cached) return json({ services: JSON.parse(cached), cached: true });
  let services: any[] = [];
  try {
    const res = await fetch(`${env.NAKSAB_ORIGIN || "https://naksab.vitobytestudio.workers.dev"}/api/bridge/catalog`, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const j = (await res.json()) as any;
      services = Array.isArray(j?.services) ? j.services : [];
      await env.CACHE_KV.put(ck, JSON.stringify(services), { expirationTtl: 300 });
    }
  } catch { services = []; }
  return json({ services, cached: false });
});

route("GET", "/api/pro/member", async (req, env) => {
  const uname = new URL(req.url).searchParams.get("u") ?? "";
  const pct = await memberExtra(env, uname);
  return json({ active: pct > 0, extra_pct: pct });
});

// ═══ الموجّه ═══
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    if (path.startsWith("/media/")) {
      const m = /^\/media\/([0-9a-f]{16})\.(jpg|png|webp)$/.exec(path);
      if (!m) return bad("not_found", 404);
      const obj = await env.CACHE_KV.get(`img:${m[1]}`, { type: "arrayBuffer" });
      if (!obj) return bad("not_found", 404);
      const ct = m[2] === "jpg" ? "image/jpeg" : m[2] === "png" ? "image/png" : "image/webp";
      return secure(new Response(obj, { headers: { "content-type": ct, "cache-control": "public, max-age=31536000, immutable" } }));
    }
    if (path.startsWith("/api/")) {
      const s = await getSession(env, req);
      for (const r of R) {
        const params = matchPath(r.pat, path);
        if (!params || r.m !== req.method) continue;
        if (r.auth && !s) return bad("auth_required", 401);
        if (r.csrf) {
          const hdr = req.headers.get("x-csrf") ?? "";
          if (!s || hdr !== s.csrf) return bad("csrf", 403);
        }
        try {
          return secure(await r.h(req, env, s, params));
        } catch (e) {
          return secure(json({ error: "server", detail: String(e).slice(0, 200) }, 500));
        }
      }
      return bad("not_found", 404);
    }
    return secure(await env.ASSETS.fetch(req));
  },
};
