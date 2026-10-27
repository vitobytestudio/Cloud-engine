// ——— إعدادات الحساب: الباقة والقطاع (بيئة العرض) ———
import type { Env, Session } from "../env";

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });

const TIERS = ["FREE", "PRO_TALENT", "MERCHANT_EMERALD", "ENTERPRISE_GOLD"];
const SECTORS = ["FOUNDER", "MERCHANT", "FREELANCER"];

export async function updateTier(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId || !s.csrf) return json({ error: "auth_required" }, 401);
  const b = (await req.json().catch(() => ({}))) as { tier?: string };
  if (!b.tier || !TIERS.includes(b.tier)) return json({ error: "invalid_tier" }, 400);
  await env.DB.prepare("UPDATE users SET badge_tier=? WHERE id=?").bind(b.tier, s.userId).run();
  return json({ ok: true, badge_tier: b.tier });
}

export async function updateSector(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId || !s.csrf) return json({ error: "auth_required" }, 401);
  const b = (await req.json().catch(() => ({}))) as { sector?: string };
  if (!b.sector || !SECTORS.includes(b.sector)) return json({ error: "invalid_sector" }, 400);
  await env.DB.prepare("UPDATE users SET sector=? WHERE id=?").bind(b.sector, s.userId).run();
  return json({ ok: true, sector: b.sector });
}
