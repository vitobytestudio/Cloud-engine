// ——— المصادقة والجلسات: توكن مبعثر في DB، CSRF مزدوج، قفل المحاولات، حدود معدل ———

import type { Context, Next } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { pbkdf2Hash, randomHex, randomToken, randomId, sha256Hex, safeEqual } from "./crypto";
export { getCookie, setCookie };
export { sha256Hex };
import type { Env } from "../env";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

const SESSION_COOKIE = "mirsal_session";
const CSRF_COOKIE = "mirsal_csrf";
const SESSION_TTL_MS = 7 * 86400_000;
const MAX_FAILED = 8;
const LOCK_MS = 15 * 60_000;

export function clientIpHash(c: { req: { header(n: string): string | undefined } }): Promise<string> {
  const ip =
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0].trim() ??
    "local";
  return sha256Hex("ip:" + ip);
}

export async function createSession(
  c: Context<{ Bindings: Env }>,
  userId: string
): Promise<void> {
  const token = randomToken();
  const csrf = randomToken();
  const tokenHash = await sha256Hex(token);
  const now = Date.now();
  await c.env.DB.prepare(
    `INSERT INTO sessions (id, user_id, csrf, created_at, expires_at, ip_hash, ua_hash)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
  )
    .bind(tokenHash, userId, csrf, now, now + SESSION_TTL_MS, await clientIpHash(c), await sha256Hex(c.req.header("user-agent") ?? ""))
    .run();

  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  setCookie(c, CSRF_COOKIE, csrf, {
    httpOnly: false, // CSRF مزدوج الإرسال — يجب أن يقرأه الواجهة
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession(c: Context<{ Bindings: Env }>): Promise<void> {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) {
    await c.env.DB.prepare("DELETE FROM sessions WHERE id = ?1").bind(await sha256Hex(token)).run();
  }
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  deleteCookie(c, CSRF_COOKIE, { path: "/" });
}

type C = Context<{ Bindings: Env; Variables: Record<string, any> }>;

export async function requireAuth(c: C, next: Next) {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return c.json({ error: "يلزم تسجيل الدخول" }, 401);
  const tokenHash = await sha256Hex(token);

  const row = await c.env.DB.prepare(
    `SELECT s.id, s.csrf, s.expires_at, u.id AS uid, u.email, u.name, u.role
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ?1`
  )
    .bind(tokenHash)
    .first<{ id: string; csrf: string; expires_at: number; uid: string; email: string; name: string; role: string }>();

  if (!row || row.expires_at < Date.now()) {
    if (row) await c.env.DB.prepare("DELETE FROM sessions WHERE id = ?1").bind(row.id).run();
    return c.json({ error: "الجلسة منتهية — سجل الدخول من جديد" }, 401);
  }

  // حماية CSRF: كل فعل مُغيِّر يتطلب ترويسة مطابقة لقيمة الجلسة
  if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
    const header = c.req.header("x-csrf") ?? "";
    if (!safeEqual(header, row.csrf)) {
      return c.json({ error: "رمز الحماية غير صالح" }, 403);
    }
  }

  c.set("user", { id: row.uid, email: row.email, name: row.name, role: row.role as "user" | "admin" });
  c.set("csrf", row.csrf);
  await next();
}

export async function requireAdmin(c: C, next: Next) {
  const user = c.get("user");
  if (user.role !== "admin") {
    await audit(c, user.id, "admin_denied", c.req.path);
    return c.json({ error: "صلاحيات غير كافية" }, 403);
  }
  await next();
}

// ——— حدود المعدل عبر KV — عدّاد بنافذة زمنية ———
export async function rateLimit(
  c: { env: Env },
  bucket: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const key = `rl:${bucket}:${Math.floor(Date.now() / windowMs)}`;
  const current = parseInt((await c.env.KV.get(key)) ?? "0", 10);
  if (current >= limit) return false;
  await c.env.KV.put(key, String(current + 1), { expirationTtl: Math.max(60, Math.ceil(windowMs / 1000)) });
  return true;
}

export async function audit(
  c: { env: Env; req: { header(n: string): string | undefined } },
  actor: string,
  action: string,
  target?: string,
  meta?: unknown
): Promise<void> {
  await c.env.DB.prepare(
    "INSERT INTO audit_log (id, actor, action, target, meta, ip_hash, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7)"
  )
    .bind(randomId("au_"), actor, action, target ?? null, meta ? JSON.stringify(meta).slice(0, 2000) : null, await clientIpHash(c), Date.now())
    .run();
}

// ——— إنشاء مستخدم ———
export async function createUser(
  c: { env: Env; req: { header(n: string): string | undefined } },
  opts: { email: string; name: string; password: string; consent: boolean }
): Promise<{ ok: true; id: string; role: string } | { ok: false; error: string; status: number }> {
  const emailNorm = opts.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailNorm)) return { ok: false, error: "بريد إلكتروني غير صالح", status: 400 };
  if (opts.name.trim().length < 2 || opts.name.length > 80) return { ok: false, error: "الاسم غير صالح", status: 400 };
  if (opts.password.length < 8 || opts.password.length > 128)
    return { ok: false, error: "كلمة السر: 8 أحرف على الأقل", status: 400 };
  if (!opts.consent) return { ok: false, error: "يجب الموافقة على الشروط وسياسة الخصوصية", status: 400 };

  const exists = await c.env.DB.prepare("SELECT id FROM users WHERE email_norm = ?1").bind(emailNorm).first();
  if (exists) return { ok: false, error: "هذا البريد مسجل مسبقاً", status: 409 };

  const salt = randomHex(16);
  const hash = await pbkdf2Hash(opts.password, salt);
  const id = randomId("u_");
  const now = Date.now();
  const role = emailNorm === c.env.ADMIN_EMAIL?.toLowerCase() ? "admin" : "user";

  const stmts = [
    c.env.DB.prepare(
      `INSERT INTO users (id, email, email_norm, name, password_hash, salt, role, consent_at, created_at)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)`
    ).bind(id, opts.email.trim(), emailNorm, opts.name.trim(), hash, salt, role, now, now),
    c.env.DB.prepare(
      `INSERT INTO subscriptions (id, user_id, plan_id, status, started_at, renews_at, updated_at)
       VALUES (?1,?2,'free','active',?3,?4,?3)`
    ).bind(randomId("s_"), id, now, now + 3650 * 86400_000),
    c.env.DB.prepare("INSERT INTO profiles (user_id, created_at) VALUES (?1, ?2)").bind(id, now),
  ];
  await c.env.DB.batch(stmts);
  await audit(c, id, "user_registered", id, { role });
  return { ok: true, id, role };
}

export async function verifyLogin(
  c: { env: Env },
  email: string,
  password: string
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string; status: number }> {
  const emailNorm = email.trim().toLowerCase();
  const user = await c.env.DB.prepare(
    "SELECT id, email, name, role, password_hash, salt, failed_attempts, locked_until FROM users WHERE email_norm = ?1"
  )
    .bind(emailNorm)
    .first<{
      id: string; email: string; name: string; role: string;
      password_hash: string; salt: string; failed_attempts: number; locked_until: number | null;
    }>();

  if (!user) return { ok: false, error: "بيانات الدخول غير صحيحة", status: 401 };
  if (user.locked_until && user.locked_until > Date.now())
    return { ok: false, error: "الحساب مقفل مؤقتاً — أعد المحاولة بعد 15 دقيقة", status: 423 };

  const hash = await pbkdf2Hash(password, user.salt);
  if (!safeEqual(hash, user.password_hash)) {
    const attempts = user.failed_attempts + 1;
    await c.env.DB.prepare("UPDATE users SET failed_attempts = ?1, locked_until = ?2 WHERE id = ?3")
      .bind(attempts, attempts >= MAX_FAILED ? Date.now() + LOCK_MS : null, user.id)
      .run();
    await audit({ env: c.env, req: { header: () => undefined } }, user.id, "login_failed", user.id, { attempts });
    return { ok: false, error: "بيانات الدخول غير صحيحة", status: 401 };
  }

  const now = Date.now();
  await c.env.DB.prepare("UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = ?1 WHERE id = ?2")
    .bind(now, user.id)
    .run();
  return {
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role as "user" | "admin" },
  };
}
