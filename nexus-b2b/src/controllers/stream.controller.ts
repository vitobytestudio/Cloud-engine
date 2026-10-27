// ——— الوسائط: روابط رفع لمرة واحدة (Cloudflare Stream في الإنتاج / تخزين تطوير محلي) + إثبات الملكية ———
import type { Env, Session } from "../env";
import { rateLimit } from "../lib/rate";
import { newId } from "../lib/auth";

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });

const MAX_BYTES = 20 * 1024 * 1024;

export async function directUpload(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  if (!(await rateLimit(env, `up:${s.userId}`, 10, 3600))) return json({ error: "too_many" }, 429);
  const b = (await req.json().catch(() => ({}))) as { purpose?: string; bytes?: number; content_type?: string };
  const bytes = b.bytes ?? 0;
  if (bytes <= 0 || bytes > MAX_BYTES) return json({ error: "size_invalid", max: MAX_BYTES }, 400);
  const purpose = b.purpose === "STORY" ? "STORY" : "POST";
  const mediaId = newId("m");
  await env.DB.prepare(
    "INSERT INTO pending_uploads (media_id,user_id,purpose,content_type,bytes,ready) VALUES (?,?,?,?,?,0)"
  ).bind(mediaId, s.userId, purpose, (b.content_type ?? "video/mp4").slice(0, 60), bytes).run();

  // الإنتاج: Cloudflare Stream — Direct Creator Upload (رابط لمرة واحدة، صفر حمل على الـWorker)
  if (env.STREAM_API_TOKEN && env.CF_ACCOUNT_ID) {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/stream/direct_upload`, {
      method: "POST",
      headers: { authorization: `Bearer ${env.STREAM_API_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({ maxDurationSeconds: 600, requireSignedURLs: false }),
    });
    const d = await r.json<any>().catch(() => null);
    if (d?.success) {
      await env.DB.prepare("UPDATE pending_uploads SET ready=1 WHERE media_id=?").bind(mediaId).run();
      return json({ media_id: mediaId, upload_url: d.result.uploadURL, provider: "stream" });
    }
    return json({ error: "stream_error" }, 502);
  }
  // التطوير المحلي: تخزين مؤقت في KV عبر مسار رفع خاص (نفس عقد الواجهة تماماً)
  return json({ media_id: mediaId, upload_url: `/api/stream/upload/${mediaId}`, provider: "dev-kv" });
}

export async function uploadPut(req: Request, env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const rec = await env.DB.prepare("SELECT user_id, ready, bytes FROM pending_uploads WHERE media_id=?")
    .bind(p.media_id).first<{ user_id: string; ready: number; bytes: number }>();
  if (!rec || rec.user_id !== s.userId) return json({ error: "not_found" }, 404);
  if (rec.ready) return json({ error: "already_uploaded" }, 409);
  const buf = await req.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) return json({ error: "size_invalid" }, 413);
  const ct = req.headers.get("content-type") ?? "application/octet-stream";
  await env.CACHE_KV.put(`media:${p.media_id}`, buf, { expirationTtl: 60 * 60 * 24 * 7 });
  await env.DB.prepare("UPDATE pending_uploads SET ready=1, content_type=?, bytes=? WHERE media_id=?")
    .bind(ct.slice(0, 60), buf.byteLength, p.media_id).run();
  return json({ ok: true, playback_url: `/media/${p.media_id}`, content_type: ct });
}

export async function mediaGet(env: Env, mediaId: string): Promise<Response> {
  const val = await env.CACHE_KV.get(`media:${mediaId}`, { type: "arrayBuffer" });
  if (!val) return new Response("not found", { status: 404 });
  const meta = await env.DB.prepare("SELECT content_type FROM pending_uploads WHERE media_id=?").bind(mediaId).first<{ content_type: string }>();
  return new Response(val, { headers: { "content-type": meta?.content_type ?? "video/mp4", "cache-control": "public, max-age=86400" } });
}
