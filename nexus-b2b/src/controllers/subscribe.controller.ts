// ——— v0.10-B: الاشتراكات (أزرق/زمردي/ذهبي — شهري أو سنوي −20%) + التحكم الأمني ———
import type { Env, Session } from "../env";
import { PLAN_PRICES, isPlan, getOwnerId, isDev } from "../lib/tiers";
import { runDaily } from "../lib/cron";
import { setLocked, resetActor, unlockBehavior } from "../lib/security";
import { notify } from "./features.controller";

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });

export async function subscribe(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const b = (await req.json().catch(() => ({}))) as { plan?: string; cycle?: string };
  if (!isPlan(b.plan ?? "")) return json({ error: "invalid_plan" }, 400);
  const cycle = b.cycle === "YEARLY" ? "YEARLY" : "MONTHLY";
  const plan = b.plan as keyof typeof PLAN_PRICES;
  const amount = PLAN_PRICES[plan][cycle === "YEARLY" ? "yearly" : "monthly"];

  // الدفع: مدمج لاحقاً (Lemon Squeezy/Stripe) — التفعيل الآن مباشر بلا فواتير (لا مال حقيقي بعد)
  const old = await env.DB.prepare(
    "SELECT id FROM subscriptions WHERE user_id=? AND status='ACTIVE'"
  ).bind(s.userId).first<{ id: string }>();
  if (old) await env.DB.prepare("UPDATE subscriptions SET status='EXPIRED' WHERE id=?").bind(old.id).run();

  const id = `sub-${crypto.randomUUID().slice(0, 12)}`;
  const renews = cycle === "YEARLY" ? "+365 days" : "+30 days";
  await env.DB.prepare(
    "INSERT INTO subscriptions (id,user_id,plan,cycle,status,amount_cents,renews_at) VALUES (?,?,?,?,'ACTIVE',?,datetime('now', ?))"
  ).bind(id, s.userId, plan, cycle, amount, renews).run();
  await env.DB.prepare("UPDATE users SET badge_tier=? WHERE id=?").bind(plan, s.userId).run();
  await notify(env, s.userId, s.userId, "subscribe", "subscription", id);
  return json({ ok: true, plan, cycle, amount_cents: amount, badge_tier: plan,
    renews_at: (await env.DB.prepare("SELECT renews_at FROM subscriptions WHERE id=?").bind(id).first<{ renews_at: string }>())?.renews_at }, 201);
}

export async function subStatus(_req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const sub = await env.DB.prepare(
    "SELECT plan, cycle, status, amount_cents, started_at, renews_at FROM subscriptions WHERE user_id=? AND status IN ('ACTIVE','CANCELED') ORDER BY started_at DESC LIMIT 1"
  ).bind(s.userId).first();
  return json({ subscription: sub ?? null });
}

export async function cancel(_req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const r = await env.DB.prepare(
    "UPDATE subscriptions SET status='CANCELED' WHERE user_id=? AND status='ACTIVE'"
  ).bind(s.userId).run();
  return json({ ok: true, canceled: (r.meta.changes ?? 0) > 0 });
}

// ——— بوابة التحكم: التطوير، أو المالك في الإنتاج ———
async function gate(env: Env, s: Session): Promise<boolean> {
  if (isDev(env)) return !!s.userId;
  if (!s.userId) return false;
  return (await getOwnerId(env)) === s.userId;
}

export async function cron(req: Request, env: Env, s: Session): Promise<Response> {
  if (!(await gate(env, s))) return json({ error: "forbidden" }, 403);
  const b = (await req.json().catch(() => ({}))) as {
    dev_backdate_story_hours?: number; dev_backdate_grants_days?: number;
    dev_backdate_subs_days?: number; force_weekly?: boolean;
  };
  const summary = await runDaily(env, {
    devBackdateStoryHours: isDev(env) ? Math.min(720, Math.max(0, Math.round(b.dev_backdate_story_hours ?? 0))) : 0,
    devBackdateGrantsDays: isDev(env) ? Math.min(3650, Math.max(0, Math.round(b.dev_backdate_grants_days ?? 0))) : 0,
    devBackdateSubsDays: isDev(env) ? Math.min(3650, Math.max(0, Math.round(b.dev_backdate_subs_days ?? 0))) : 0,
    forceWeekly: isDev(env) ? !!b.force_weekly : false,
  });
  return json({ ok: true, summary });
}

export async function lock(req: Request, env: Env, s: Session): Promise<Response> {
  if (!(await gate(env, s))) return json({ error: "forbidden" }, 403);
  const b = (await req.json().catch(() => ({}))) as { username?: string; locked?: boolean };
  const u = await env.DB.prepare("SELECT id FROM users WHERE username=?").bind((b.username ?? "").trim()).first<{ id: string }>();
  if (!u) return json({ error: "not_found" }, 404);
  const ownerId = await getOwnerId(env);
  if (u.id === ownerId) return json({ error: "cannot_lock_owner" }, 403);
  if (b.locked) await setLocked(env, u.id, true);
  else { await unlockBehavior(env, u.id); await resetActor(env, `u:${u.id}`); }
  return json({ ok: true, username: b.username, locked: !!b.locked });
}

export async function events(_req: Request, env: Env, s: Session): Promise<Response> {
  if (!(await gate(env, s))) return json({ error: "forbidden" }, 403);
  const rows = await env.DB.prepare(
    "SELECT kind, severity, actor_key, created_at FROM security_events ORDER BY created_at DESC LIMIT 50"
  ).all();
  const states = await env.DB.prepare("SELECT actor_key, strikes, level, penalty_until, locked FROM security_state").all();
  return json({ events: rows.results ?? [], states: states.results ?? [] });
}
