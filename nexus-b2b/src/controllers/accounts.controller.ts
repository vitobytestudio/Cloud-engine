// ——— إعدادات الحساب: الباقة والقطاع والملف والمنتجات والخدمات ———
import type { Env, Session } from "../env";

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });

const TIERS = ["FREE", "PRO_TALENT", "MERCHANT_EMERALD", "ENTERPRISE_GOLD"];
const SECTORS = ["FOUNDER", "MERCHANT", "FREELANCER"];
const COLORS = ["#E5A93C", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#14B8A6"];

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

// ——— تحرير الملف الشخصي: قائمة بيضاء صارمة + حدود طول ———
export async function updateProfile(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId || !s.csrf) return json({ error: "auth_required" }, 401);
  const b = (await req.json().catch(() => ({}))) as {
    full_name?: string; bio?: string; company_name?: string; country_code?: string; portfolio_website?: string; avatar_color?: string;
  };
  const name = (b.full_name ?? "").trim().slice(0, 60);
  if (!name) return json({ error: "invalid_name" }, 400);
  const bio = (b.bio ?? "").trim().slice(0, 300);
  const company = (b.company_name ?? "").trim().slice(0, 60);
  const country = (b.country_code ?? "").trim().toUpperCase().slice(0, 2).replace(/[^A-Z]/g, "");
  let site = (b.portfolio_website ?? "").trim().slice(0, 200);
  if (site && !/^https?:\/\//i.test(site)) site = "https://" + site;
  const color = COLORS.includes(b.avatar_color ?? "") ? b.avatar_color! : "#3B82F6";
  await env.DB.prepare(
    "UPDATE users SET full_name=?, bio=?, company_name=?, country_code=?, portfolio_website=?, avatar_color=? WHERE id=?"
  ).bind(name, bio, company, country, site, color, s.userId).run();
  const u = await env.DB.prepare(
    "SELECT username, full_name, bio, company_name, country_code, portfolio_website, avatar_color, sector, badge_tier FROM users WHERE id=?"
  ).bind(s.userId).first();
  return json({ ok: true, user: u });
}

const cap = async (env: Env, table: string, uid: string) =>
  (await env.DB.prepare(`SELECT COUNT(*) AS c FROM ${table} WHERE user_id=?`).bind(uid).first<{ c: number }>())?.c ?? 0;

// ——— منتجات التاجر ———
export async function addProduct(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId || !s.csrf) return json({ error: "auth_required" }, 401);
  const u = await env.DB.prepare("SELECT sector FROM users WHERE id=?").bind(s.userId).first<{ sector: string }>();
  if (u?.sector !== "MERCHANT") return json({ error: "merchant_only" }, 403);
  if ((await cap(env, "merchant_products", s.userId)) >= 20) return json({ error: "limit_reached" }, 409);
  const b = (await req.json().catch(() => ({}))) as { title?: string; price_cents?: number; inventory_count?: number; sample_available?: boolean };
  const title = (b.title ?? "").trim().slice(0, 80);
  const price = Math.round(b.price_cents ?? 0);
  if (!title || price < 1 || price > 10_000_000) return json({ error: "invalid_fields" }, 400);
  const id = `mp-${crypto.randomUUID().slice(0, 10)}`;
  await env.DB.prepare(
    "INSERT INTO merchant_products (id,user_id,title,price_cents,inventory_count,sample_available) VALUES (?,?,?,?,?,?)"
  ).bind(id, s.userId, title, price, Math.max(0, Math.round(b.inventory_count ?? 0)), b.sample_available ? 1 : 0).run();
  return json({ ok: true, id }, 201);
}

export async function deleteProduct(req: Request, env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  if (!s.userId || !s.csrf) return json({ error: "auth_required" }, 401);
  const r = await env.DB.prepare("DELETE FROM merchant_products WHERE id=? AND user_id=? RETURNING id").bind(p.id, s.userId).first();
  if (!r) return json({ error: "not_found" }, 404);
  return json({ ok: true });
}

// ——— باقات المستقل ———
export async function addService(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId || !s.csrf) return json({ error: "auth_required" }, 401);
  const u = await env.DB.prepare("SELECT sector FROM users WHERE id=?").bind(s.userId).first<{ sector: string }>();
  if (u?.sector !== "FREELANCER") return json({ error: "freelancer_only" }, 403);
  if ((await cap(env, "freelancer_services", s.userId)) >= 20) return json({ error: "limit_reached" }, 409);
  const b = (await req.json().catch(() => ({}))) as { service_title?: string; starting_price_cents?: number; rate_unit?: string; delivery_days?: number };
  const title = (b.service_title ?? "").trim().slice(0, 80);
  const price = Math.round(b.starting_price_cents ?? 0);
  const unit = b.rate_unit === "HOURLY" ? "HOURLY" : "PROJECT";
  const days = Math.min(90, Math.max(1, Math.round(b.delivery_days ?? 3)));
  if (!title || price < 1 || price > 10_000_000) return json({ error: "invalid_fields" }, 400);
  const id = `fs-${crypto.randomUUID().slice(0, 10)}`;
  await env.DB.prepare(
    "INSERT INTO freelancer_services (id,user_id,service_title,starting_price_cents,rate_unit,delivery_days) VALUES (?,?,?,?,?,?)"
  ).bind(id, s.userId, title, price, unit, days).run();
  return json({ ok: true, id }, 201);
}

export async function deleteService(req: Request, env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  if (!s.userId || !s.csrf) return json({ error: "auth_required" }, 401);
  const r = await env.DB.prepare("DELETE FROM freelancer_services WHERE id=? AND user_id=? RETURNING id").bind(p.id, s.userId).first();
  if (!r) return json({ error: "not_found" }, 404);
  return json({ ok: true });
}
