// ——— NEXUS core lib: جلسات، حدود معدل، تحقق مدخلات ———
import type { Env, Session } from "./env";

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } });

export const bad = (error: string, status = 400) => json({ error }, status);

export const id = (p: string) => `${p}_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
export const now = () => Date.now();
export const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n) : s);

export const hex = (bytes: number) =>
  [...new Uint8Array(crypto.getRandomValues(new Uint8Array(bytes)))].map((b) => b.toString(16).padStart(2, "0")).join("");

export function ctEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export function parseCookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

const SESS_TTL = 30 * 86400; // 30 يوماً

export type CreatedSession = { sid: string; csrf: string };

export async function createSession(env: Env, userId: string): Promise<CreatedSession> {
  const sid = hex(24);
  const exp = now() + SESS_TTL * 1000;
  const csrf = hex(16);
  await env.CACHE_KV.put(`sess:${sid}`, JSON.stringify({ userId, csrf, exp } satisfies Session), { expirationTtl: SESS_TTL });
  return { sid, csrf };
}

export function sessionCookie(sessionId: string): string {
  return `nx_s=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESS_TTL}`;
}
export const clearCookie = () => "nx_s=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";

export async function getSession(env: Env, req: Request): Promise<Session | null> {
  const sid = parseCookies(req)["nx_s"];
  if (!sid || !/^[0-9a-f]{48}$/.test(sid)) return null;
  const raw = await env.CACHE_KV.get(`sess:${sid}`);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Session;
    if (!s.userId || !s.csrf || s.exp < now()) return null;
    return s;
  } catch {
    return null;
  }
}

export async function destroySession(env: Env, req: Request): Promise<void> {
  const sid = parseCookies(req)["nx_s"];
  if (sid) await env.CACHE_KV.delete(`sess:${sid}`);
}

// ——— حدود المعدل (KV عدادات بنوافذ ثوانٍ) ———
export async function rl(env: Env, key: string, limit: number, windowSec: number): Promise<boolean> {
  const k = `rl:${key}`;
  const cur = Number((await env.CACHE_KV.get(k)) ?? "0");
  if (cur >= limit) return false;
  await env.CACHE_KV.put(k, String(cur + 1), { expirationTtl: Math.max(60, windowSec) });
  return true;
}

// ——— تحقق المدخلات ———
export const isEmail = (s: string) => /^[^\s@]{1,64}@[^\s@]{1,255}\.[a-z]{2,}$/i.test(s);
export const isK0 = (s: string) => /^[0-9a-f]{64}$/.test(s);
export const isSlug = (s: string) => /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(s);
export const isPhoneDZ = (s: string) => /^0[5-7]\d{8}$/.test(s) || /^0[2-4]\d{7}$/.test(s);
export function isHttpsUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "https:" && !!u.hostname && s.length <= 600;
  } catch {
    return false;
  }
}
export const isStr = (v: unknown, min: number, max: number): v is string =>
  typeof v === "string" && v.trim().length >= min && v.trim().length <= max;

export const RESERVED_SLUGS = new Set([
  "api", "admin", "auth", "dash", "explore", "store", "p", "home", "account", "settings",
  "login", "register", "logout", "me", "orders", "products", "feed", "finance", "data", "assets",
]);
