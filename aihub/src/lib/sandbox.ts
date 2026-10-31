// ——— Nexus Sandbox: لينكس سحابي لحظي (E2B) — يقلع عند العمل ويموت بانتهائه ———
// الإنشاء/القتل عبر REST الرسمي (api.e2b.app) والتنفيذ عبر ConnectRPC (envd) — موثق من كود SDK الرسمي.
import type { Env } from "../env";

const API = "https://api.e2b.app";
const ENVD_PORT = 49983;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// إطار Connect: بايت أعلام + طول 4 بايت (BE) + الحمولة
function frame(payload: string): Uint8Array {
  const body = encoder.encode(payload);
  const f = new Uint8Array(5 + body.length);
  new DataView(f.buffer).setUint32(1, body.length);
  f[0] = 0;
  f.set(body, 5);
  return f;
}

function deframe(buf: ArrayBuffer): { events: any[]; trailer: any } {
  const dv = new DataView(buf);
  const u8 = new Uint8Array(buf);
  const events: any[] = [];
  let trailer: any = null;
  let i = 0;
  while (i + 5 <= u8.length) {
    const flags = u8[i];
    const len = dv.getUint32(i + 1);
    const chunk = decoder.decode(u8.subarray(i + 5, i + 5 + len));
    try {
      const j = JSON.parse(chunk);
      if (flags & 0x02) trailer = j;
      else events.push(j);
    } catch {}
    i += 5 + len;
  }
  return { events, trailer };
}

function b64(s: string): string {
  try {
    const bin = atob(s);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return decoder.decode(u8);
  } catch {
    return "";
  }
}

export function previewHost(sid: string, port: number): string {
  return `https://${port}-${sid}.e2b.app`;
}

export async function sbxCreate(env: Env, meta: Record<string, string>, timeoutMin = 15): Promise<{ ok: true; sid: string } | { ok: false; status: number; err: string }> {
  const res = await fetch(`${API}/sandboxes`, {
    method: "POST",
    headers: { "X-API-Key": env.E2B_API_KEY ?? "", "content-type": "application/json" },
    body: JSON.stringify({ templateID: "base", timeout: timeoutMin, metadata: meta }),
    signal: AbortSignal.timeout(20000),
  }).catch(() => null);
  if (!res) return { ok: false, status: 502, err: "engine_unreachable" };
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok || !j.sandboxId) return { ok: false, status: res.status, err: String(j.message ?? j.error ?? "create_failed").slice(0, 200) };
  return { ok: true, sid: String(j.sandboxId) };
}

// تنفيذ سكربت bash داخل البيئة — يجمع stdout/stderr ورمز الخروج من أحداث البث
export async function sbxExec(env: Env, sid: string, script: string, timeoutMs = 90000): Promise<{ ok: boolean; pid?: number; stdout: string; stderr: string; exit: number }> {
  const base = `https://${ENVD_PORT}-${sid}.e2b.app`;
  const body = frame(JSON.stringify({ process: { cmd: "bash", args: ["-lc", script], envVars: {} } }));
  const res = await fetch(`${base}/process.Process/Start`, {
    method: "POST",
    headers: { "content-type": "application/connect+json", "connect-protocol-version": "1" },
    body: body as unknown as BodyInit,
    signal: AbortSignal.timeout(timeoutMs),
  }).catch(() => null);
  if (!res) return { ok: false, stdout: "", stderr: "exec_unreachable", exit: -1 };
  if (!res.ok) return { ok: false, stdout: "", stderr: `envd_http_${res.status}`, exit: -1 };
  const { events, trailer } = deframe(await res.arrayBuffer());
  let out = "";
  let err = "";
  let exit = -1;
  let pid: number | undefined;
  for (const ev of events) {
    const e = ev?.event ?? {};
    if (e.start?.pid != null) pid = e.start.pid;
    if (e.data?.stdout) out += b64(e.data.stdout);
    if (e.data?.stderr) err += b64(e.data.stderr);
    if (e.end) exit = Number(e.end.exitCode ?? e.end.exit_code ?? -1);
  }
  const streamErr = trailer && trailer.error ? String(trailer.error).slice(0, 300) : "";
  if (streamErr && err === "") err = streamErr;
  return { ok: exit === 0 && !streamErr, pid, stdout: out, stderr: err, exit };
}

export async function sbxKill(env: Env, sid: string): Promise<boolean> {
  const res = await fetch(`${API}/sandboxes/${encodeURIComponent(sid)}`, {
    method: "DELETE",
    headers: { "X-API-Key": env.E2B_API_KEY ?? "" },
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);
  return !!res && res.ok;
}

export async function sbxInfo(env: Env, sid: string): Promise<any | null> {
  const res = await fetch(`${API}/sandboxes/${encodeURIComponent(sid)}`, {
    headers: { "X-API-Key": env.E2B_API_KEY ?? "" },
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return res.json().catch(() => null);
}
