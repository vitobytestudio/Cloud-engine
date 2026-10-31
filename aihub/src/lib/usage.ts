// ——— حسابات الاستخدام والسقوف — شفافية كاملة، عدل قبل كل شيء ———
import type { Env } from "../env";

export async function planLimits(env: Env, plan: string): Promise<{ instant_daily: number; auto_daily: number; instant_img_daily: number; proxy_rpm: number; agents: number; vault_size: number }> {
  const row = await env.DB.prepare("SELECT instant_daily, auto_daily, instant_img_daily, proxy_rpm, agents, vault_size FROM plan_limits WHERE plan=?")
    .bind(plan).first<{ instant_daily: number; auto_daily: number; instant_img_daily: number; proxy_rpm: number; agents: number; vault_size: number }>();
  return row ?? { instant_daily: 500, auto_daily: 300, instant_img_daily: 60, proxy_rpm: 10, agents: 1, vault_size: 65536 };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function bumpUsage(env: Env, userId: string, field: "instant" | "auto" | "instant_img" | "proxy", by = 1): Promise<number> {
  const d = today();
  await env.DB.prepare(
    `INSERT INTO usage_daily (user_id, day, ${field}) VALUES (?,?,?)
     ON CONFLICT(user_id, day) DO UPDATE SET ${field} = ${field} + ?`
  ).bind(userId, d, by, by).run();
  const row = await env.DB.prepare(`SELECT ${field} AS v FROM usage_daily WHERE user_id=? AND day=?`).bind(userId, d).first<{ v: number }>();
  return row?.v ?? by;
}

export async function getUsage(env: Env, userId: string): Promise<{ instant: number; auto: number; instant_img: number; proxy: number; day: string }> {
  const d = today();
  const row = await env.DB.prepare("SELECT instant, auto, instant_img, proxy FROM usage_daily WHERE user_id=? AND day=?").bind(userId, d)
    .first<{ instant: number; auto: number; instant_img: number; proxy: number }>();
  return { instant: row?.instant ?? 0, auto: row?.auto ?? 0, instant_img: row?.instant_img ?? 0, proxy: row?.proxy ?? 0, day: d };
}

export async function audit(env: Env, userId: string | null, kind: string, detail = ""): Promise<void> {
  await env.DB.prepare("INSERT INTO audit_events (id,user_id,kind,detail) VALUES (?,?,?,?)")
    .bind(`ae-${crypto.randomUUID().slice(0, 12)}`, userId, kind, detail.slice(0, 300)).run();
}
