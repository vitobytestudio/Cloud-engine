// ——— حاجز الجشع: حدود انزلاقية عبر KV ———
import type { Env } from "../env";

export async function rateLimit(env: Env, key: string, max: number, windowSec: number): Promise<boolean> {
  const k = `rl:${key}`;
  const raw = await env.CACHE_KV.get(k);
  let n = 1;
  if (raw) {
    try { n = (JSON.parse(raw).n ?? 0) + 1; } catch { n = 1; }
  }
  if (n > max) return false;
  await env.CACHE_KV.put(k, JSON.stringify({ n }), { expirationTtl: Math.max(60, windowSec) });
  return true;
}

export function clientIp(req: Request): string {
  return req.headers.get("cf-connecting-ip") ?? "local";
}
