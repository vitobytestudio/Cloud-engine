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
  // ——— v0.11.1: وسائط المستخدم محتوى دائم — بلا TTL (كانت تُحذف بعد 7 أيام!) ———
  await env.CACHE_KV.put(`media:${p.media_id}`, buf);
  await env.DB.prepare("UPDATE pending_uploads SET ready=1, content_type=?, bytes=? WHERE media_id=?")
    .bind(ct.slice(0, 60), buf.byteLength, p.media_id).run();
  return json({ ok: true, playback_url: `/media/${p.media_id}`, content_type: ct });
}

function serveMedia(buf: ArrayBuffer, ct: string, rangeHdr: string | null): Response {
  const base: Record<string, string> = { "content-type": ct, "cache-control": "public, max-age=86400", "accept-ranges": "bytes" };
  const size = buf.byteLength;
  // ——— v0.11.1: دعم Range/206 — التشغيل والتمرير السليم على كروم أندرويد ———
  const m = rangeHdr ? /^bytes=(\d*)-(\d*)$/.exec(rangeHdr.trim()) : null;
  if (m) {
    const start = m[1] === "" ? (m[2] === "" ? 0 : Math.max(0, size - parseInt(m[2], 10))) : parseInt(m[1], 10);
    let end = m[1] !== "" && m[2] !== "" ? parseInt(m[2], 10) : size - 1;
    if (isNaN(start) || isNaN(end) || start > end || start >= size)
      return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
    end = Math.min(end, size - 1);
    return new Response(buf.slice(start, end + 1), { status: 206, headers: { ...base, "content-range": `bytes ${start}-${end}/${size}` } });
  }
  return new Response(buf, { headers: base });
}

export async function mediaGet(env: Env, req: Request, mediaId: string): Promise<Response> {
  const range = req.headers.get("range");
  const kv = await env.CACHE_KV.get(`media:${mediaId}`, { type: "arrayBuffer" });
  if (kv) {
    const meta = await env.DB.prepare("SELECT content_type FROM pending_uploads WHERE media_id=?").bind(mediaId).first<{ content_type: string }>();
    return serveMedia(kv, meta?.content_type ?? "video/mp4", range);
  }
  // ——— v0.11.1: الوسائط الساكنة (ريلز/بوسترات البذور) تُخدم من الأصول — كانت ترجع 404 ولا تعمل أبداً ———
  const origin = new URL(req.url).origin;
  const asset = await env.ASSETS.fetch(new Request(`${origin}/media/${mediaId}`));
  if (asset.status === 200) return serveMedia(await asset.arrayBuffer(), asset.headers.get("content-type") ?? "application/octet-stream", range);
  return new Response("not found", { status: 404 });
}
