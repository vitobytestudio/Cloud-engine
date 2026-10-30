// ——— سقوف المعدل: نافذة منزلقة في KV — تحمي البنية بلا ظلم ———
import type { Env } from "../env";

export async function rateLimit(env: Env, key: string, limit: number, windowSec: number): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const window = Math.floor(now / windowSec);
  const k = `rl:${key}:${window}`;
  const current = parseInt((await env.CACHE_KV.get(k)) ?? "0", 10);
  if (current >= limit) return false;
  await env.CACHE_KV.put(k, String(current + 1), { expirationTtl: Math.max(60, windowSec) });
  return true;
}
