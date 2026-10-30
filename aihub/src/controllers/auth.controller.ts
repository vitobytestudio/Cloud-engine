// ——— المصادقة ———
import type { Env, Session } from "../env";
import { hashPassword, verifyPassword, createSession, destroySession } from "../lib/auth";
import { rateLimit } from "../lib/rate";
import { audit } from "../lib/usage";

const json = (obj: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function register(req: Request, env: Env): Promise<Response> {
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const email = (b.email ?? "").trim().toLowerCase();
  const name = (b.full_name ?? "").trim().slice(0, 60);
  const password = b.password ?? "";
  if (!EMAIL_RE.test(email) || name.length < 2) return json({ error: "invalid_input" }, 400);
  if (password.length < 8) return json({ error: "weak_password" }, 400);
  if (!(await rateLimit(env, `reg:${email}`, 5, 3600))) return json({ error: "too_many" }, 429);
  const exists = await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
  if (exists) return json({ error: "email_taken" }, 409);
  const id = `u-${crypto.randomUUID().slice(0, 12)}`;
  const hash = await hashPassword(password, env.AUTH_PEPPER ?? "");
  await env.DB.prepare("INSERT INTO users (id,email,pass_hash,full_name) VALUES (?,?,?,?)").bind(id, email, hash, name).run();
  await audit(env, id, "register", email);
  const { token, csrf } = await createSession(env, id);
  return json({ ok: true, csrf, user: { id, email, full_name: name, plan: "FREE" } }, 201, { "set-cookie": `ah_s=${token}; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000; Path=/` });
}

export async function login(req: Request, env: Env): Promise<Response> {
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const email = (b.email ?? "").trim().toLowerCase();
  const password = b.password ?? "";
  if (!(await rateLimit(env, `login:${email}`, 8, 900))) return json({ error: "too_many" }, 429);
  const u = await env.DB.prepare("SELECT id,pass_hash,full_name,plan FROM users WHERE email=?").bind(email)
    .first<{ id: string; pass_hash: string; full_name: string; plan: string }>();
  if (!u || !(await verifyPassword(password, u.pass_hash, env.AUTH_PEPPER ?? ""))) {
    await audit(env, u?.id ?? null, "login_fail", email);
    return json({ error: "invalid_credentials" }, 401);
  }
  const { token, csrf } = await createSession(env, u.id);
  return json({ ok: true, csrf, user: { id: u.id, email, full_name: u.full_name, plan: u.plan } }, 200, { "set-cookie": `ah_s=${token}; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000; Path=/` });
}

export async function logout(req: Request, env: Env, s: Session): Promise<Response> {
  await destroySession(env, s.token);
  return json({ ok: true }, 200, { "set-cookie": "ah_s=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/" });
}

export async function me(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const u = await env.DB.prepare("SELECT id,email,full_name,plan FROM users WHERE id=?").bind(s.userId)
    .first<{ id: string; email: string; full_name: string; plan: string }>();
  if (!u) return json({ error: "auth_required" }, 401);
  return json({ ok: true, csrf: s.csrf, user: u });
}
