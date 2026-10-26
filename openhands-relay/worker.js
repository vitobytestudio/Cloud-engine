// ——— المرحّل الرسمي: workers.dev → قناة صادرة من GitHub Actions → OpenHands المحلي ———
// بروتوكول: WebSocket واحد من العدّاء + تعدد إرسال HTTP وWS عبره. بلا تخزين دائم.

const SKIP = new Set([
  "host", "connection", "upgrade", "content-length",
  "sec-websocket-key", "sec-websocket-version", "sec-websocket-extensions", "sec-websocket-protocol",
]);

function pickHeaders(req) {
  const h = {};
  req.headers.forEach((v, k) => {
    k = k.toLowerCase();
    if (SKIP.has(k) || k.startsWith("cf-") || k.startsWith("x-forwarded") || k === "accept-encoding") return;
    h[k] = v;
  });
  h["accept-encoding"] = "identity"; // أجسام مفكوكة — إعادة الإرسال بلا مفاجآت
  return h;
}
function toB64(buf) {
  let s = "";
  const u = new Uint8Array(buf);
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
}
function fromB64(b) {
  const s = atob(b);
  const u = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u;
}
function safeEq(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export class Relay {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.server = null;          // قناة العدّاء
    this.pending = new Map();    // طلبات HTTP قيد الانتظار
    this.sockets = new Map();    // متصفحات WS مفتوحة
  }
  send(o) { try { this.server && this.server.send(JSON.stringify(o)); } catch (e) {} }

  async fetch(req) {
    const url = new URL(req.url);

    // ——— قناة العدّاء (خلف SERVER_PASS) ———
    if (url.pathname === "/__connect") {
      const token = url.searchParams.get("token") ?? req.headers.get("x-server-pass") ?? "";
      const expected = this.env.SERVER_PASS ?? "";
      if (!expected || !safeEq(token, expected)) return new Response("forbidden", { status: 403 });
      if ((req.headers.get("upgrade") ?? "").toLowerCase() !== "websocket")
        return new Response("websocket expected", { status: 400 });
      const pair = new WebSocketPair();
      this.server = pair[1];
      this.server.accept();
      this.server.addEventListener("message", (ev) => this.fromRunner(ev.data));
      this.server.addEventListener("close", () => { this.server = null; });
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    // ——— حركة الزوار ———
    if (!this.server) return new Response(
      JSON.stringify({ error: "الجلسة السحابية غير متصلة الآن — شغّل سير عمل الجلسة (OpenCode أو OpenHands) من Actions ليعمل الرابط" }),
      { status: 503, headers: { "content-type": "application/json; charset=utf-8" } }
    );

    // متصفح يطلب WebSocket (واجهة OpenHands تقوده إلى /ws)
    if ((req.headers.get("upgrade") ?? "").toLowerCase() === "websocket") {
      const id = crypto.randomUUID();
      const pair = new WebSocketPair();
      pair[1].accept();
      this.sockets.set(id, pair[1]);
      pair[1].addEventListener("message", (ev) => {
        const b = typeof ev.data === "string" ? toB64(new TextEncoder().encode(ev.data)) : toB64(ev.data);
        this.send({ t: "wsd", id, b, x: typeof ev.data === "string" ? 1 : 0 });
      });
      pair[1].addEventListener("close", () => { this.sockets.delete(id); this.send({ t: "wsc", id }); });
      this.send({ t: "wsopen", id, p: url.pathname + url.search, h: pickHeaders(req) });
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    // HTTP عادي
    const id = crypto.randomUUID();
    const body = req.method === "GET" || req.method === "HEAD" ? null : toB64(await req.arrayBuffer());
    const p = new Promise((res, rej) => {
      this.pending.set(id, res);
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error("timeout")); } }, 180000);
    });
    this.send({ t: "req", id, m: req.method, p: url.pathname + url.search, h: pickHeaders(req), b: body });
    try {
      const r = await p;
      const headers = new Headers(r.h ?? {});
      headers.delete("content-length");
      headers.delete("transfer-encoding");
      const out = r.b ? fromB64(r.b) : null;
      return new Response(out, { status: r.s ?? 502, headers });
    } catch {
      return new Response(JSON.stringify({ error: "انتهت مهلة الاستجابة من الجلسة" }), { status: 504, headers: { "content-type": "application/json" } });
    }
  }

  fromRunner(data) {
    let m; try { m = JSON.parse(data); } catch { return; }
    if (m.t === "res") {
      const r = this.pending.get(m.id);
      if (r) { this.pending.delete(m.id); r(m); }
    } else if (m.t === "wsd") {
      const sock = this.sockets.get(m.id);
      if (!sock) return;
      if (m.x) sock.send(new TextDecoder().decode(fromB64(m.b)));
      else sock.send(fromB64(m.b).buffer);
    } else if (m.t === "wsc") {
      const sock = this.sockets.get(m.id);
      if (sock) { this.sockets.delete(m.id); try { sock.close(1000); } catch (e) {} }
    }
  }
}

export default {
  fetch(req, env, ctx) {
    const ns = env.RELAY;
    const stub = ns.get(ns.idFromName("main"));
    return stub.fetch(req);
  },
};
