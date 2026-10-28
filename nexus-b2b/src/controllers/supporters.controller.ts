// ——— v0.10-B: داعمو NEXUS — جمهور معلن يتوسع تلقائياً + خبراء الأمن ———
import type { Env } from "../env";
import { getOwnerId } from "../lib/tiers";

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });

export async function list(_req: Request, env: Env): Promise<Response> {
  const ownerId = await getOwnerId(env);
  const ownerU = ownerId
    ? await env.DB.prepare("SELECT username FROM users WHERE id=?").bind(ownerId).first<{ username: string }>()
    : null;
  const rows = await env.DB.prepare(
    `SELECT username, full_name, headline, sector, country_code, avatar_color, activated_at
     FROM supporter_pool WHERE active=1 ORDER BY activated_at ASC, username ASC LIMIT 200`
  ).all();
  const experts = await env.DB.prepare(
    `SELECT username, full_name, bio, avatar_color FROM users
     WHERE username IN ('sec_nad','sec_mira','sec_tarek') AND verified=1 LIMIT 3`
  ).all();
  return json({
    owner_username: ownerU?.username ?? null,
    count: (rows.results ?? []).length,
    items: rows.results ?? [],
    experts: experts.results ?? [],
  });
}
