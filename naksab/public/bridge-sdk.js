/* ═══════════════════════════════════════════════════════════════════
   NEXUS FLOW BRIDGE — sdk/bridge-sdk.js (v1.1 — Auto-Discovery)
   ─────────────────────────────────────────────────────────────────
   مكتبة الربط داخل واجهة الأستوديو — صفر تبعيات، ملف واحد، تُحمل بوسم
   <script> وتعلن window.NXFlow.

   الواجهة:
     NXFlow.state()                    → {connected, ver, extId}
     NXFlow.onState(cb)                → unsubscribe (يُنادى فوراً بالحالة الحالية)
     NXFlow.detect()                   → {installed, ver}
     NXFlow.session()                  → {loggedIn, flowTab, ...}
     NXFlow.generate(spec, onProgress) → {kind:"url",url} | {kind:"blob",objectUrl,size}
     NXFlow.cancel(jobId?)
     NXFlow.attach(videoEl, result)    — تشغيل تلقائي متوافق مع سياسات المتصفح

   قناتا الاتصال (لا ثالثة لهما):
     صفحة → إضافة : chrome.runtime.sendMessage(extId, envelope) — عبر externally_connectable
     إضافة → صفحة : background → content-beacon (دوميناتنا) → window.postMessage → هنا

   عهود ثابتة: لا كوكيز ولا رموز تعبر هنا — روابط وحالة وأجزاء فيديو فقط.
   ═══════════════════════════════════════════════════════════════════ */
"use strict";
(function (global) {
  const NS = "nx.flow", V = 1;
  const PING_TO = 1500, GEN_TO = 10.5 * 60000, PROBE_TO = 6000, DISCOVER_TO = 8000, LOGIN_TO = 5.5 * 60000;

  let extId = null;
  try { extId = global.localStorage.getItem("nx_flow_ext_id") || null; } catch {}
  const st = { connected: false, ver: null, extId };
  const stateCbs = new Set();

  const env = (type, jobId, payload) => ({ v: V, ns: NS, type, jobId: jobId || null, ts: Date.now(), payload: payload || {} });
  const withTo = (p, ms, code) => Promise.race([
    p,
    new Promise((_, rj) => setTimeout(() => rj({ code, message: "timeout:" + code }), ms))
  ]);

  function setState(patch) {
    Object.assign(st, patch);
    stateCbs.forEach((cb) => { try { cb({ ...st }); } catch {} });
  }

  function send(msg) {
    if (!st.extId && !extId) return Promise.reject({ code: "no_ext", message: "الإضافة غير مكتشفة بعد" });
    return global.chrome.runtime.sendMessage(extId || st.extId, msg);
  }

  /* ─── تحقق الاكتشاف: من يزعم أنه إضافة يجب أن يردّ PING ─── */
  async function verify(id) {
    try {
      const r = await withTo(global.chrome.runtime.sendMessage(id, env("PING")), PING_TO, "ping");
      if (r && r.type === "PONG") return { ver: r.payload.ver, caps: r.payload.caps };
    } catch {}
    return null;
  }

  async function adopt(id, claimedVer) {
    const ok = await verify(id);
    if (!ok) return false;
    extId = id;
    try { global.localStorage.setItem("nx_flow_ext_id", id); } catch {}
    setState({ connected: true, ver: ok.ver || claimedVer || null, extId: id });
    return true;
  }

  /* ─── الاستماع: EXT_HELLO من البثّ + أحداث المهمة عبر المِرحّال ─── */
  global.addEventListener("message", (ev) => {
    if (ev.source !== global || !ev.data || ev.data.ns !== NS) return;
    const m = ev.data;

    if (m.type === "EXT_HELLO") {
      const id = m.payload && m.payload.extId;
      if (!id) return;
      if (st.connected && st.extId === id) return;
      adopt(id, m.payload.ver);
      return;
    }

    if (active) dispatch(m);
    else if (m.type === "SESSION_OK" || m.type === "SESSION_CLOSED") {
      if (loginWait) {
        const lw = loginWait; loginWait = null;
        clearTimeout(lw.to);
        m.type === "SESSION_OK" ? lw.resolve(true) : lw.reject({ code: "login_" + (m.payload && m.payload.why || "closed") });
      }
    }
  });

  /* نطلب إعادة الإعلان إن كنا نحمل معرّفاً محفوظاً ولم يتبثّ بعد */
  if (extId) setTimeout(() => {
    if (!st.connected) try { global.postMessage({ v: V, ns: NS, type: "EXT_WHO", payload: {} }, "*"); } catch {}
  }, 600);

  /* ─── الحالة والاشتراك ─── */
  function state() { return { ...st }; }
  function onState(cb) { stateCbs.add(cb); try { cb({ ...st }); } catch {} return () => stateCbs.delete(cb); }

  async function detect() {
    if (st.connected) return { installed: true, ver: st.ver, extId: st.extId };
    if (extId) { const ok = await adopt(extId); if (ok) return { installed: true, ver: st.ver, extId }; }
    return { installed: false, reason: st.extId ? "ping_failed" : "not_announced" };
  }

  /* ─── انتظار الاكتشاف: تثبيت حار بلا تحديث صفحة ─── */
  function waitDiscovery(ms) {
    if (st.connected) return Promise.resolve(true);
    return new Promise((resolve) => {
      const un = onState((s) => { if (s.connected) { un(); clearTimeout(t); resolve(true); } });
      const t = setTimeout(() => { un(); resolve(st.connected); }, ms);
    });
  }

  /* ─── جلسة Flow ─── */
  async function session() {
    const r = await withTo(send(env("GET_SESSION")), 25000, "session");
    if (!r || r.type === "ERR") throw { code: "session_failed", detail: r && r.payload };
    return { ...r.payload, installed: true };
  }

  /* ─── المهمة النشطة وطابور الدخول ─── */
  let active = null;   /* {jobId, onProgress, resolve, reject, chunks, timer} */
  let loginWait = null;

  function dispatch(m) {
    const a = active; if (!a) return;
    const p = m.payload || {};
    switch (m.type) {
      case "JOB_UPDATE":
        a.onProgress && a.onProgress(p.state, p.progress, p.note);
        break;
      case "VIDEO_READY":
        tryDirect(a, p.url);
        break;
      case "VIDEO_CHUNK": {
        a.chunks = a.chunks || new Map();
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

  /* ─── الطبقة الأولى: الرابط المباشر بprobe فيديو خفي ─── */
  function tryDirect(a, url) {
    a.onProgress && a.onProgress("link_probe", null, "تجربة الرابط المباشر");
    const v = global.document.createElement("video");
    v.preload = "metadata"; v.muted = true;
    const bail = setTimeout(() => { cleanupV(); requestBlob(a, url); }, PROBE_TO);
    const cleanupV = () => { v.removeEventListener("loadedmetadata", ok); v.removeEventListener("error", err); };
    const ok = () => { clearTimeout(bail); cleanupV(); v.src = ""; v.load();
      send(env("VIDEO_DIRECT_OK", a.jobId, {})).catch(() => {});
      succeed(a, { kind: "url", url, jobId: a.jobId });
    };
    const err = () => { clearTimeout(bail); cleanupV(); requestBlob(a, url); };
    v.addEventListener("loadedmetadata", ok);
    v.addEventListener("error", err);
    v.src = url;
  }

  /* ─── الطبقة الثانية: النقل المجزأ وإعادة التجميع ─── */
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
      succeed(a, { kind: "blob", objectUrl: URL.createObjectURL(blob), size: total, jobId: a.jobId });
    } catch (e) {
      fail(a, { code: "assemble_failed", detail: String(e && e.message) });
    }
  }

  function succeed(a, result) { cleanup(); a.resolve(result); }
  function fail(a, err) { cleanup(); a.reject(err); }
  function cleanup() { if (active && active.timer) clearTimeout(active.timer); active = null; }

  /* ─── التوليد: كشف → جلسة (طابور دخول تلقائي) → إرسال ─── */
  function generate(spec, onProgress) {
    if (active) return Promise.reject({ code: "busy", jobId: active.jobId });
    return new Promise(async (resolve, reject) => {
      const a = active = { jobId: null, onProgress, resolve, reject, chunks: null,
        timer: setTimeout(() => fail(a, { code: "overall_timeout" }), GEN_TO) };
      try {
        onProgress && onProgress("discovery", 0, "البحث عن الإضافة");
        const d = await detect();
        if (!d.installed) { await waitDiscovery(DISCOVER_TO); if (!st.connected) throw { code: "not_installed", message: "أضف إضافة NEXUS Flow Bridge أولاً" }; }
        onProgress && onProgress("session", 1, "فحص جلستك");
        let sess = await session();
        if (!sess.loggedIn) {
          /* الحالة ب: نافذة دخول صغيرة — عند النجاح تُغلق وحدها ويُستأنف التوليد */
          onProgress && onProgress("login_needed", 2, "انتظار دخولك إلى Google Flow");
          const watched = await send(env("WATCH_LOGIN", a.jobId, {}));
          if (!watched || watched.type === "ERR") throw { code: "watch_failed" };
          await new Promise((res, rej) => {
            loginWait = { resolve: res, reject: rej, to: setTimeout(() => { loginWait = null; rej({ code: "login_timeout" }); }, LOGIN_TO) };
          });
          onProgress && onProgress("session", 2, "تم الربط — استئناف");
          sess = await session();
          if (!sess.loggedIn) throw { code: "flow_not_logged_in" };
        }
        onProgress && onProgress("sending", 3, "إرسال الأمر بجلستك");
        const r = await withTo(send(env("GENERATE", null, spec)), 50000, "generate");
        if (!r || r.type === "ERR") throw { code: (r && r.payload && r.payload.error) || "generate_rejected" };
        a.jobId = r.payload.jobId || r.jobId;
      } catch (e) { fail(a, e); }
    });
  }

  async function cancel(jobId) {
    if (loginWait) { clearTimeout(loginWait.to); const lw = loginWait; loginWait = null; lw.reject({ code: "cancelled" }); }
    if (!jobId && active) jobId = active.jobId;
    if (!jobId) return false;
    try { await send(env("CANCEL", jobId, {})); } catch {}
    return true;
  }

  /* ─── تشغيل النتيجة في مشغل الأستوديو ─── */
  function attach(videoEl, result) {
    if (!videoEl || !result) return;
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

  global.NXFlow = {
    configure({ extId: id } = {}) {
      if (id) adopt(id);
      return state();
    },
    state, onState, detect, session, generate, cancel, attach
  };
})(window);
