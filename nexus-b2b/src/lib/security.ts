// ——— v0.10-B: محرك التهديد الحقيقي — عقوبات تصاعدية + قفل حسابات + سجل أحداث ———
import type { Env } from "../env";

const json = (obj: unknown, status: number) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });

const WINDOWS_MIN = 30;
const L1 = 4;  // تباطؤ
const L2 = 8;  // حجب ساعة
const L3 = 14; // حجب طويل

export async function recordViolation(env: Env, actorKey: string, kind: string, severity = 1): Promise<void> {
  if (!actorKey) return;
  try {
    await env.DB.prepare("INSERT INTO security_events (id,actor_key,kind,severity) VALUES (?,?,?,?)")
      .bind(`se-${crypto.randomUUID().slice(0, 12)}`, actorKey, kind, severity).run();
    const win = new Date(Date.now() - WINDOWS_MIN * 60000).toISOString().slice(0, 19).replace("T", " ");
    const c = await env.DB.prepare(
      "SELECT COUNT(*) AS c FROM security_events WHERE actor_key=? AND created_at > ?"
    ).bind(actorKey, win).first<{ c: number }>();
    const n = c?.c ?? 0;
    const level = n >= L3 ? 3 : n >= L2 ? 2 : n >= L1 ? 1 : 0;
    const mins = level === 3 ? 24 * 60 : level === 2 ? 60 : level === 1 ? 15 : 0;
    if (level > 0) {
      // ——— v0.10-B fix: D1 لا يقيّم المعامل داخل datetime() — نحسب التاريخ في JS ———
      const penalty = new Date(Date.now() + mins * 60000).toISOString().slice(0, 19).replace("T", " ");
      await env.DB.prepare(
        `INSERT INTO security_state (actor_key,strikes,level,penalty_until,updated_at) VALUES (?,?,?,?,datetime('now'))
         ON CONFLICT(actor_key) DO UPDATE SET strikes=excluded.strikes, level=excluded.level,
           penalty_until=excluded.penalty_until, updated_at=datetime('now')`
      ).bind(actorKey, n, level, penalty).run();
    }
  } catch { /* الأمن لا يُسقط الطلب أبداً */ }
}

export type Guard = { locked?: boolean; blocked?: boolean; slow?: boolean; level?: number };

export async function guard(env: Env, actorKey: string): Promise<Guard> {
  if (!actorKey) return {};
  try {
    const st = await env.DB.prepare("SELECT level, penalty_until, locked FROM security_state WHERE actor_key=?")
      .bind(actorKey).first<{ level: number; penalty_until: string | null; locked: number }>();
    if (!st) return {};
    if (st.locked) return { locked: true };
    if (st.penalty_until && st.penalty_until > new Date().toISOString().slice(0, 19).replace("T", " ")) {
      return { blocked: st.level >= 2, slow: st.level === 1, level: st.level };
    }
    return {};
  } catch {
    return {};
  }
}

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function enforce(env: Env, actorKey: string): Promise<Response | null> {
  const g = await guard(env, actorKey);
  if (g.locked) return json({ error: "account_locked" }, 423);
  if (g.blocked) return json({ error: "blocked", retry: "1h" }, 403);
  if (g.slow) await delay(350);
  return null;
}

export async function resetActor(env: Env, actorKey: string): Promise<void> {
  await env.DB.prepare("DELETE FROM security_state WHERE actor_key=?").bind(actorKey).run();
}

export async function setLocked(env: Env, userId: string, locked: boolean): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO security_state (actor_key,locked,updated_at) VALUES (?,?,datetime('now'))
     ON CONFLICT(actor_key) DO UPDATE SET locked=excluded.locked, updated_at=datetime('now')`
  ).bind(`u:${userId}`, locked ? 1 : 0).run();
}

// فك الحجب السلوكي مع إبقاء قفل الحساب الإداري كما هو
export async function unlockBehavior(env: Env, userId: string): Promise<void> {
  const key = `u:${userId}`;
  const st = await env.DB.prepare("SELECT locked FROM security_state WHERE actor_key=?").bind(key).first<{ locked: number }>();
  await env.DB.prepare(
    `INSERT INTO security_state (actor_key,strikes,level,penalty_until,locked,updated_at) VALUES (?,0,0,NULL,?,datetime('now'))
     ON CONFLICT(actor_key) DO UPDATE SET strikes=0, level=0, penalty_until=NULL, locked=excluded.locked, updated_at=datetime('now')`
  ).bind(key, st?.locked ?? 0).run();
}
