// ——— المصادقة: تسجيل، دخول، جلسات، حساب تجريبي فوري ———
import type { Env, Session } from "../env";
import { hashPassword, verifyPassword, createSession, sessionCookie, clearCookie, newId } from "../lib/auth";
import { rateLimit, clientIp } from "../lib/rate";

const json = (obj: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } });

const SECTORS = new Set(["FOUNDER", "MERCHANT", "FREELANCER"]);

export async function me(env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ user: null });
  const u = await env.DB.prepare(
    "SELECT id,email,username,full_name,sector,badge_tier,country_code,locale,avatar_color,bio,reputation_score,company_name,created_at FROM users WHERE id=?"
  ).bind(s.userId).first();
  if (!u) return json({ user: null });
  const bal = await env.DB.prepare("SELECT COALESCE(SUM(amount_cents),0) AS b FROM transactions WHERE user_id=?")
    .bind(s.userId).first<{ b: number }>();
  return json({ user: u, csrf: s.csrf, balance_cents: bal?.b ?? 0 });
}

export async function register(req: Request, env: Env, s: Session): Promise<Response> {
  if (!(await rateLimit(env, `reg:${clientIp(req)}`, 5, 3600))) return json({ error: "too_many" }, 429);
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const email = (b.email ?? "").trim().toLowerCase();
  const username = (b.username ?? "").trim().toLowerCase();
  const password = b.password ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "invalid_email" }, 400);
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return json({ error: "invalid_username" }, 400);
  if (password.length < 8) return json({ error: "weak_password" }, 400);
  if (!SECTORS.has(b.sector ?? "")) return json({ error: "invalid_sector" }, 400);
  const exists = await env.DB.prepare("SELECT id FROM users WHERE email=? OR username=?").bind(email, username).first();
  if (exists) return json({ error: "exists" }, 409);
  const id = newId("u");
  const hash = await hashPassword(password, env.AUTH_PEPPER ?? "");
  await env.DB.prepare(
    "INSERT INTO users (id,email,password_hash,username,full_name,sector,country_code,avatar_color,bio,company_name) VALUES (?,?,?,?,?,?,?,?,?,?)"
  ).bind(id, email, hash, username, (b.full_name ?? username).slice(0, 80), b.sector,
    (b.country ?? "").slice(0, 2).toUpperCase(), "#3B82F6", "", "").run();
  const { token, csrf } = await createSession(env, id);
  return json({ ok: true, csrf }, 201, { "set-cookie": sessionCookie(token, env) });
}

export async function login(req: Request, env: Env, s: Session): Promise<Response> {
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const email = (b.email ?? "").trim().toLowerCase();
  if (!(await rateLimit(env, `login:${clientIp(req)}:${email}`, 5, 900))) return json({ error: "locked" }, 429);
  const u = await env.DB.prepare("SELECT id,password_hash FROM users WHERE email=?").bind(email).first<{ id: string; password_hash: string }>();
  if (!u || u.password_hash === "!disabled" || !(await verifyPassword(b.password ?? "", u.password_hash, env.AUTH_PEPPER ?? "")))
    return json({ error: "invalid_credentials" }, 401);
  const { token, csrf } = await createSession(env, u.id);
  return json({ ok: true, csrf }, 200, { "set-cookie": sessionCookie(token, env) });
}

export async function demoLogin(req: Request, env: Env, s: Session): Promise<Response> {
  if (!(await rateLimit(env, `demo:${clientIp(req)}`, 20, 3600))) return json({ error: "too_many" }, 429);
  const u = await env.DB.prepare("SELECT id FROM users WHERE id='u-demo-amin'").first<{ id: string }>();
  if (!u) return json({ error: "no_demo" }, 500);
  const { token, csrf } = await createSession(env, u.id);
  return json({ ok: true, csrf, user_id: u.id }, 200, { "set-cookie": sessionCookie(token, env) });
}

export async function logout(_req: Request, env: Env, s: Session): Promise<Response> {
  const { destroySession } = await import("../lib/auth");
  await destroySession(env, s.token);
  return json({ ok: true }, 200, { "set-cookie": clearCookie() });
}
