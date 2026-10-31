// ——— المصادقة: PBKDF2 للدخول + جلسات مبهمة في KV — (مفاتيح النماذج لا علاقة لها بهذا الملف إطلاقاً) ———
import type { Env } from "../env";

const ITERATIONS = 210_000;

function hex(n: number): string {
  const u = new Uint8Array(n);
  crypto.getRandomValues(u);
  return Array.from(u).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function newId(prefix: string): string {
  return `${prefix}-${hex(6)}`;
}

function b64(buf: ArrayBuffer): string {
  const u = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
  return btoa(s);
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
  const x = new TextEncoder().encode(bits), y = new TextEncoder().encode(parts[3]);
  if (x.length !== y.length) return false;
  let r = 0;
  for (let i = 0; i < x.length; i++) r |= x[i] ^ y[i];
  return r === 0;
}

async function derive(password: string, salt: string, pepper: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password + "|" + pepper), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: ITERATIONS },
    key, 256
  );
  return b64(bits);
}

export type SessionData = { userId: string; csrf: string; lastSeen: number };

// مفتاح KV = SHA-256 للتوكن: تسريب KV أو نسخة قاعدة لا يعطي جلسات صالحة
async function tokenHash(token: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSession(env: Env, userId: string): Promise<{ token: string; csrf: string }> {
  const token = hex(32), csrf = hex(16);
  await env.CACHE_KV.put(`session:${await tokenHash(token)}`, JSON.stringify({ userId, csrf, lastSeen: Date.now() }), { expirationTtl: 60 * 60 * 24 * 30 });
  return { token, csrf };
}

export async function getSessionData(env: Env, token: string | null): Promise<SessionData | null> {
  if (!token) return null;
  let raw = await env.CACHE_KV.get(`session:${await tokenHash(token)}`);
  if (!raw) {
    // جلسات أقدم من التجزئة: نرقّها صامتاً إلى المفتاح المجزأ
    raw = await env.CACHE_KV.get(`session:${token}`);
    if (raw) {
      await env.CACHE_KV.put(`session:${await tokenHash(token)}`, raw, { expirationTtl: 60 * 60 * 24 * 30 });
      await env.CACHE_KV.delete(`session:${token}`);
    }
  }
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as SessionData;
    return d.userId ? d : null;
  } catch { return null; }
}

export async function destroySession(env: Env, token: string | null): Promise<void> {
  if (!token) return;
  await env.CACHE_KV.delete(`session:${await tokenHash(token)}`);
  await env.CACHE_KV.delete(`session:${token}`);
}
