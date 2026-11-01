// ——— NAKSAB lib: أنماط المصنع المجرَّبة (جلسات، csrf، حدود، تحقق) ———
import type { Env, Session } from "./env";

export const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });

export const id = (p: string) => `${p}-${crypto.randomUUID().slice(0, 8)}${Date.now().toString(36).slice(-4)}`;
export const now = () => Date.now();
export const esc = (s: string) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

export function clip(s: string, n: number): string {
  s = String(s ?? "");
  return s.length > n ? s.slice(0, n) : s;
}

// ─── كوكي الجلسة ───
export function parseCookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (req.headers.get("cookie") ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export async function getSession(env: Env, req: Request): Promise<Session> {
  const tok = parseCookies(req)["nk_s"];
  if (!tok) return null;
  const row = await env.DB.prepare("SELECT s.user_id, s.csrf, s.expires, u.role, u.banned FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?").bind(tok).first<any>();
  if (!row || row.expires < now() || row.banned) return null;
  return { userId: row.user_id, role: row.role, csrf: row.csrf };
}

export async function createSession(env: Env, userId: string): Promise<{ token: string; csrf: string }> {
  const token = hex(32);
  const csrf = hex(16);
  await env.DB.prepare("INSERT INTO sessions (id, user_id, csrf, expires) VALUES (?,?,?,?)").bind(token, userId, csrf, now() + 30 * 86400_000).run();
  return { token, csrf };
}

export function sessionCookie(token: string, secureHttps: boolean): string {
  const secure = secureHttps ? " Secure;" : "";
  return `nk_s=${token}; Path=/; HttpOnly; SameSite=Lax;${secure} Max-Age=${30 * 86400}`;
}
export const clearCookie = `nk_s=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

export function hex(n: number): string {
  const u8 = new Uint8Array(n);
  crypto.getRandomValues(u8);
  return [...u8].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── كلمة المرور: k0 (تمطيط المتصفح) → تجزئة الخادم pbkdf2$iter$salt$b64 ───
export async function serverHash(k0: string, saltB64: string, iter = 15000): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(k0), "PBKDF2", false, ["deriveBits"]);
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: iter }, key, 256);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(bits)));
  return `pbkdf2$${iter}$${saltB64}$${b64}`;
}

export async function verifyHash(k0: string, stored: string): Promise<boolean> {
  const [, iterStr, saltB64] = stored.split("$");
  const h = await serverHash(k0, saltB64, Number(iterStr));
  return timingEq(h, stored);
}

function timingEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

// ─── حدود المعدل (KV) ───
export async function rl(env: Env, key: string, limit: number, windowSec: number): Promise<boolean> {
  const k = `rl:${key}`;
  const cur = Number((await env.CACHE_KV.get(k)) ?? "0");
  if (cur >= limit) return false;
  await env.CACHE_KV.put(k, String(cur + 1), { expirationTtl: Math.max(60, windowSec) });
  return true;
}

// ─── التحقق من المدخلات ───
export const isEmail = (s: string) => /^[^\s@]{1,64}@[^\s@]{1,255}\.[a-z]{2,}$/i.test(s);
export const isUsername = (s: string) => /^[a-z0-9][a-z0-9-]{2,23}[a-z0-9]$/.test(s);
export const isK0 = (s: string) => /^[0-9a-f]{64}$/.test(s);
export function isHttpsUrl(s: string): boolean {
  try {
    const u = new URL(s);
    if (u.protocol !== "https:") return false;
    const h = u.hostname;
    if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|\[::)/.test(h)) return false;
    return !!h.includes(".");
  } catch {
    return false;
  }
}
export function jsonArr(s: unknown, max = 12): string[] {
  try {
    const v = JSON.parse(String(s ?? "[]"));
    return Array.isArray(v) ? v.slice(0, max).map((x) => clip(String(x), 40)) : [];
  } catch {
    return [];
  }
}

export async function notify(env: Env, userId: string, type: string, body: string, ref = ""): Promise<void> {
  await env.DB.prepare("INSERT INTO notifications (id, user_id, type, body, ref, read, created_at) VALUES (?,?,?,?,?,0,?)")
    .bind(id("n"), userId, type, clip(body, 200), clip(ref, 120), now()).run();
}

export async function audit(env: Env, adminId: string, action: string, detail = ""): Promise<void> {
  await env.DB.prepare("INSERT INTO audit (id, admin_id, action, detail, created_at) VALUES (?,?,?,?,?)")
    .bind(id("a"), adminId, action, clip(detail, 300), now()).run();
}
