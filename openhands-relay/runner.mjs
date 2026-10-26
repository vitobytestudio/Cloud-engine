// ——— عدّاء القناة: يعمل على GitHub Actions، يفتح WebSocket صادراً إلى المرحّل ———
// يمرر طلبات الزوار إلى OpenHands المحلي (127.0.0.1:3000) ويرد بالنتائج.
import WebSocket from "ws";

const RELAY = process.env.RELAY_URL;                    // wss://oh-relay.<sub>.workers.dev
const TOKEN = process.env.SERVER_PASS ?? "";
const UP = process.env.UPSTREAM ?? "http://127.0.0.1:3000";
const sockets = new Map();
let ws = null;
let stopping = false;

function connect() {
  if (stopping) return;
  ws = new WebSocket(`${RELAY.replace(/\/$/, "")}/__connect?token=${encodeURIComponent(TOKEN)}`, {
    maxPayload: 256 * 1024 * 1024,
  });
  ws.on("open", () => console.log("▸ متصل بالمرحّل الرسمي — الرابط حي"));
  ws.on("message", (raw) => onMsg(raw).catch((e) => console.log("معالجة:", e?.message ?? e)));
  ws.on("close", () => { if (!stopping) { console.log("انقطع — إعادة اتصال بعد 3 ثوان"); setTimeout(connect, 3000); } });
  ws.on("error", (e) => console.log("ws:", e?.message ?? e));
}

async function onMsg(raw) {
  let m;
  try { m = JSON.parse(raw.toString()); } catch { return; }

  if (m.t === "req") {
    try {
      const body = m.b ? Buffer.from(m.b, "base64") : undefined;
      const r = await fetch(UP + m.p, { method: m.m, headers: m.h ?? {}, body });
      const buf = Buffer.from(await r.arrayBuffer());
      const hh = {};
      r.headers.forEach((v, k) => {
        if (!["content-length", "transfer-encoding", "connection", "content-encoding"].includes(k)) hh[k] = v;
      });
      ws.send(JSON.stringify({ t: "res", id: m.id, s: r.status, h: hh, b: buf.length ? buf.toString("base64") : null }));
    } catch (e) {
      const b = Buffer.from(JSON.stringify({ error: "upstream down" })).toString("base64");
      ws.send(JSON.stringify({ t: "res", id: m.id, s: 502, h: { "content-type": "application/json" }, b }));
    }
    return;
  }

  if (m.t === "wsopen") {
    const h = { ...(m.h ?? {}) };
    for (const k of ["host", "connection", "upgrade", "origin", "sec-websocket-key", "sec-websocket-version", "sec-websocket-extensions"]) delete h[k];
    // workerd يحذف sec-websocket-protocol من ترويسات الطلب الوارد — نعيد حقن بروتوكول طرفية ttyd.
    // مهم: يمرَّر كوسيط protocols رسمي — مكتبة ws ترفض المصافحة لو أعاد الخادم بروتوكولاً وصلها كترويسة عادية.
    const proto = h["sec-websocket-protocol"] ?? "tty";
    delete h["sec-websocket-protocol"];
    const wsBase = UP.replace(/^http/, "ws");
    const up = new WebSocket(`${wsBase}${m.p}`, proto, {
      headers: h,
      maxPayload: 64 * 1024 * 1024,
    });
    sockets.set(m.id, up);
    up.on("message", (d) => {
      const txt = (() => { try { const s = d.toString("utf8"); JSON.parse(s); return s; } catch { return null; } })();
      ws.send(JSON.stringify({ t: "wsd", id: m.id, b: Buffer.from(txt ?? d).toString("base64"), x: txt ? 1 : 0 }));
    });
    up.on("close", () => ws.send(JSON.stringify({ t: "wsc", id: m.id })));
    up.on("error", () => {});
    return;
  }

  if (m.t === "wsd") {
    const up = sockets.get(m.id);
    if (up && up.readyState === WebSocket.OPEN) {
      const buf = Buffer.from(m.b, "base64");
      m.x ? up.send(buf.toString("utf8")) : up.send(buf);
    }
    return;
  }

  if (m.t === "wsc") {
    sockets.get(m.id)?.close();
    sockets.delete(m.id);
  }
}

connect();
setInterval(() => { try { ws?.ping(); } catch (e) {} }, 30000);
process.on("SIGTERM", () => { stopping = true; try { ws?.close(); } catch (e) {} process.exit(0); });
