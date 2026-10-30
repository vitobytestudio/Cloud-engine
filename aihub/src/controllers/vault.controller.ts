// ——— الخزنة الصفرية المعرفة: الخادم يخزّن نصاً مشفّراً فقط، ويتحقق فقط من الحجم ———
import type { Env, Session } from "../env";
import { planLimits, audit } from "../lib/usage";

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });

export async function getVault(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const row = await env.DB.prepare("SELECT blob, updated_at FROM vault_blobs WHERE user_id=?").bind(s.userId)
    .first<{ blob: string; updated_at: string }>();
  return json({ blob: row?.blob ?? null, updated_at: row?.updated_at ?? null });
}

export async function putVault(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId || !s.csrf) return json({ error: "auth_required" }, 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return json({ error: "csrf" }, 403);
  const b = (await req.json().catch(() => ({}))) as { blob?: string };
  const blob = b.blob ?? "";
  // الخادم لا يفهم المحتوى — يتحقق فقط أنه JSON مشفّر بحجم معقول (دفاع عمق ضد إساءة التخزين)
  if (blob.length === 0 || blob.length > 5_000_000) return json({ error: "size_invalid" }, 400);
  let parsed: unknown;
  try { parsed = JSON.parse(blob); } catch { return json({ error: "blob_invalid" }, 400); }
  const p = parsed as { v?: number; salt?: string; iv?: string; ct?: string };
  if (typeof p.v !== "number" || typeof p.salt !== "string" || typeof p.iv !== "string" || typeof p.ct !== "string")
    return json({ error: "blob_invalid" }, 400);
  const lim = await planLimits(env, (await env.DB.prepare("SELECT plan FROM users WHERE id=?").bind(s.userId).first<{ plan: string }>())?.plan ?? "FREE");
  if (blob.length > lim.vault_size) return json({ error: "vault_full", limit: lim.vault_size }, 413);
  await env.DB.prepare(
    `INSERT INTO vault_blobs (user_id, blob, updated_at) VALUES (?,?,datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET blob=excluded.blob, updated_at=datetime('now')`
  ).bind(s.userId, blob).run();
  await audit(env, s.userId, "vault_save");
  return json({ ok: true, updated_at: new Date().toISOString().slice(0, 19).replace("T", " ") });
}
