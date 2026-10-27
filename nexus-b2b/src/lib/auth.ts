// ——— الأمان: تجزئة كلمات المرور (PBKDF2-SHA256 عبر WebCrypto) + جلسات مبهمة في KV ———
import type { Env } from "../env";

const ITERATIONS = 210_000;

function b64(buf: ArrayBuffer): string {
  const u = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
  return btoa(s);
}

function hex(n: number): string {
  const u = new Uint8Array(n);
  crypto.getRandomValues(u);
  return Array.from(u).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string, pepper: string): Promise<string> {
  const salt = hex(16);
  const bits = await derive(password, salt, pepper);
  return `pbkdf2$${ITERATIONS}$${salt}$${bits}`;
}

export async function verifyPassword(password: string, stored: string, pepper: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4) return false;
  const bits = await derive(password, parts[2], pepper);
  // مقارنة زمنية ثابتة
  let r = 0;
  const x = new TextEncoder().encode(bits), y = new TextEncoder().encode(parts[3]);
  if (x.length !== y.length) return false;
  for (let i = 0; i < x.length; i++) r |= x[i] ^ y[i];
  return r === 0;
}

async function derive(password: string, salt: string, pepper: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password + "|" + pepper),
    "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: ITERATIONS },
    key, 256
  );
  return b64(bits);
}

// ——— الجلسات المبهمة ———
export type SessionData = { userId: string; csrf: string; lastSeen: number };

export async function createSession(env: Env, userId: string): Promise<{ token: string; csrf: string }> {
  const token = hex(32);
  const csrf = hex(16);
  await env.CACHE_KV.put(`session:${token}`, JSON.stringify({ userId, csrf, lastSeen: Date.now() }), { expirationTtl: 60 * 60 * 24 * 30 });
  return { token, csrf };
}

export async function getSessionData(env: Env, token: string | null): Promise<SessionData | null> {
  if (!token) return null;
  const raw = await env.CACHE_KV.get(`session:${token}`);
  if (!raw) return null;
  try { return JSON.parse(raw) as SessionData; } catch { return null; }
}

export async function destroySession(env: Env, token: string | null): Promise<void> {
  if (token) await env.CACHE_KV.delete(`session:${token}`);
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

export function sessionCookie(token: string, env: Env): string {
  const secure = env.ENVIRONMENT === "production" ? " Secure;" : "";
  return `nx_s=${token}; Path=/; HttpOnly; SameSite=Lax;${secure} Max-Age=${60 * 60 * 24 * 30}`;
}

export function clearCookie(): string {
  return "nx_s=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
}

export const newId = (p: string) => `${p}-${hex(8)}`;
