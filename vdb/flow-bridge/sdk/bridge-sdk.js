/* ═══════════════════════════════════════════════════════════════════
   NEXUS FLOW BRIDGE — sdk/bridge-sdk.js
   ─────────────────────────────────────────────────────────────────
   مكتبة الربط داخل واجهة الأستوديو — صفر تبعيات، ملف واحد.
   تُحمل بوسم <script> أو تُستورد كوحدة (تعلن window.NXFlow).

   الواجهة:
     NXFlow.configure({ extId })      — معرّف الإضافة (مرة واحدة)
     NXFlow.detect()                  → {installed, ver}
     NXFlow.session()                 → {loggedIn, flowTab, ...}
     NXFlow.generate(spec, onProgress) → {kind:"url",url} | {kind:"blob",objectUrl,size}
     NXFlow.cancel(jobId)
     NXFlow.attach(videoEl, result)   — تشغيل تلقائي متوافق مع سياسات المتصفح

   عهود ثابتة: لا كوكيز ولا رموز تعبر هنا — كل ما يمر روابط وحالة ونقل
   أجزاء الفيديو نفسه. البروتوكول مُغلّف: {v,ns:"nx.flow",type,jobId,ts,payload}
   ═══════════════════════════════════════════════════════════════════ */
"use strict";
(function (global) {
  const NS = "nx.flow", V = 1;
  const PING_TO = 1500, GEN_TO = 10.5 * 60000, PROBE_TO = 6000;

  let EXT_ID = (global.NX_FLOW_EXT_ID) || null;
  try { EXT_ID = EXT_ID || global.localStorage.getItem("nx_flow_ext_id") || null; } catch {}

  const env = (type, jobId, payload) => ({ v: V, ns: NS, type, jobId: jobId || null, ts: Date.now(), payload: payload || {} });
  const withTo = (p, ms, code) => Promise.race([
    p,
    new Promise((_, rj) => setTimeout(() => rj({ code, message: "timeout:" + code }), ms))
  ]);

  function send(msg) {
    if (!EXT_ID) return Promise.reject({ code: "no_ext_id", message: "اضبط معرّف الإضافة: NXFlow.configure({extId}) أو localStorage.nx_flow_ext_id" });
    return global.chrome.runtime.sendMessage(EXT_ID, msg);
  }

  const configured = () => !!EXT_ID;

  /* ─── كشف الإضافة: PING بصمت ─── */
  async function detect() {
    if (!configured()) return { installed: false, reason: "no_ext_id" };
    try {
      const r = await withTo(send(env("PING")), PING_TO, "ping");
      return r && r.type === "PONG" ? { installed: true, ver: r.payload.ver, caps: r.payload.caps } : { installed: false };
    } catch { return { installed: false, reason: "not_installed" }; }
  }

  /* ─── حالة جلسة Flow في متصفح الزبون ─── */
  async function session() {
    const r = await withTo(send(env("GET_SESSION")), 25000, "session");
    if (!r || r.type === "ERR") throw { code: "session_failed", detail: r && r.payload };
    return { ...r.payload, installed: true };
  }

  /* ─── التوليد: دورة كاملة بمنفذ أحداث واحد ─── */
  let active = null; /* {jobId, onProgress, resolve, reject, chunks, timer} */

  function onRuntimeMessage(msg, sender, sendResponse) {
    if (!msg || msg.ns !== NS) return false;
    if (active && (msg.jobId === active.jobId || msg.type === "ERR")) dispatch(msg);
    if (sendResponse) sendResponse({ ok: true });
    return false;
  }

  function dispatch(msg) {
    const a = active; if (!a) return;
    const p = msg.payload || {};
    switch (msg.type) {
      case "JOB_UPDATE":
        a.onProgress && a.onProgress(p.state, p.progress, p.note);
        break;
      case "VIDEO_READY":
        tryDirect(a, p.url);
        break;
      case "VIDEO_CHUNK": {
        a.chunks.set(p.seq, p.b64);
        a.onProgress && a.onProgress("transferring", null, "استلام جزء " + p.seq);
        send(env("CHUNK_ACK", a.jobId, { seq: p.seq })).catch(() => {});
        break;
      }
      case "VIDEO_CHUNK_END":
        finishBlob(a);
        break;
      case "VIDEO_CHUNK_ERR":
        fail(a, { code: "transfer_failed", detail: p.error });
        break;
      case "ERR":
        fail(a, { code: p.error || "ext_error" });
        break;
      case "CANCELLED":
        fail(a, { code: "cancelled" });
        break;
    }
  }

  /* الطبقة الأولى: الرابط المباشر — probe فيديو خفي */
  function tryDirect(a, url) {
    a.onProgress && a.onProgress("link_probe", null, "تجربة الرابط المباشر");
    const v = document.createElement("video");
    v.preload = "metadata"; v.muted = true; v.crossOrigin = "anonymous";
    const bail = setTimeout(() => { cleanup(); requestBlob(a, url); }, PROBE_TO);
    const ok = () => { clearTimeout(bail); cleanup(); v.src = ""; v.load();
      send(env("VIDEO_DIRECT_OK", a.jobId, {})).catch(() => {});
      succeed(a, { kind: "url", url, jobId: a.jobId });
    };
    const cleanup = () => { v.removeEventListener("loadedmetadata", ok); v.removeEventListener("error", bail2); };
    const bail2 = () => { clearTimeout(bail); cleanup(); requestBlob(a, url); };
    v.addEventListener("loadedmetadata", ok);
    v.addEventListener("error", bail2);
    v.src = url;
  }

  /* الطبقة الثانية: النقل المجزأ — نبني Blob هنا ونمنحه رابطاً محلياً */
  function requestBlob(a, url) {
    a.chunks = new Map();
    a.onProgress && a.onProgress("transferring", 90, "نقل عبر الجسر");
    send(env("REQUEST_BLOB", a.jobId, { url })).catch((e) => fail(a, { code: "pump_start_failed", detail: e && e.message }));
  }

  async function finishBlob(a) {
    try {
      const seqs = [...a.chunks.keys()].sort((x, y) => x - y);
      let total = 0; const parts = [];
      for (const s of seqs) {
        const b64 = a.chunks.get(s);
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        parts.push(bytes); total += bytes.length;
        a.chunks.delete(s);
      }
      const blob = new Blob(parts, { type: "video/mp4" });
      const objectUrl = URL.createObjectURL(blob);
      succeed(a, { kind: "blob", objectUrl, size: total, jobId: a.jobId });
    } catch (e) {
      fail(a, { code: "assemble_failed", detail: String(e && e.message) });
    }
  }

  function succeed(a, result) { cleanup(); a.resolve(result); }
  function fail(a, err) { cleanup(); a.reject(err); }
  function cleanup() { if (active && active.timer) clearTimeout(active.timer); active = null; }

  function generate(spec, onProgress) {
    if (active) return Promise.reject({ code: "busy", jobId: active.jobId });
    if (!configured()) return Promise.reject({ code: "no_ext_id", message: "NXFlow.configure({extId}) أولاً" });
    return new Promise(async (resolve, reject) => {
      const a = active = { jobId: null, onProgress, resolve, reject, chunks: null,
        timer: setTimeout(() => fail(a, { code: "overall_timeout" }), GEN_TO) };
      try {
        const d = await detect();
        if (!d.installed) throw { code: "not_installed", message: "أضف إضافة NEXUS Flow Bridge أولاً" };
        const s = await session();
        if (!s.loggedIn) throw { code: "flow_not_logged_in", message: "ادخل بحسابك في Google Flow مرة واحدة ثم أعد المحاولة" };
        onProgress && onProgress("sending", 1, "إرسال الأمر بجلستك");
        const r = await withTo(send(env("GENERATE", null, spec)), 50000, "generate");
        if (!r || r.type === "ERR") throw { code: (r && r.payload && r.payload.error) || "generate_rejected" };
        a.jobId = r.payload.jobId || r.jobId;
      } catch (e) { fail(a, e); }
    });
  }

  async function cancel(jobId) {
    if (!jobId && active) jobId = active.jobId;
    if (!jobId) return false;
    try { await send(env("CANCEL", jobId, {})); } catch {}
    return true;
  }

  /* ─── تشغيل النتيجة في مشغل الأستوديو (سياسات Autoplay آمنة) ─── */
  function attach(videoEl, result) {
    if (!videoEl || !result) return;
    videoEl.crossOrigin = "anonymous";
    videoEl.src = result.kind === "url" ? result.url : result.objectUrl;
    const tryPlay = videoEl.play();
    if (tryPlay) tryPlay.catch(() => {
      videoEl.muted = true;
      videoEl.play().then(() => {
        const unlock = () => { videoEl.muted = false; global.removeEventListener("pointerdown", unlock); };
        global.addEventListener("pointerdown", unlock, { once: true });
      }).catch(() => {});
    });
  }

  /* تسجيل مستمع الأحداث مرة واحدة */
  try { global.chrome.runtime.onMessage.addListener(onRuntimeMessage); } catch {}

  global.NXFlow = { configure({ extId } = {}) {
      if (extId) { EXT_ID = extId; try { global.localStorage.setItem("nx_flow_ext_id", extId); } catch {} }
      return { configured: configured(), extId: EXT_ID };
    },
    detect, session, generate, cancel, attach,
    /* تشخيص داخلي */
    _extId: () => EXT_ID
  };
})(window);
