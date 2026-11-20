/* ═══════════════════════════════════════════════════════════════════
   NEXUS FLOW BRIDGE — content-script.js (عالم معزول داخل صفحة Flow)
   ─────────────────────────────────────────────────────────────────
   دوره حصراً: جسر ناقل بين الـbackground وعالم الصفحة (MAIN world).
   لا يقرأ كوكيز، لا يعرف أسراراً، لا يخزن شيئاً — يمرر طلبات RPC وينقل
   نقرات روابط الفيديو التي يرصدها معترض عالم الصفحة.
   ═══════════════════════════════════════════════════════════════════ */
"use strict";

(function () {
  /* ─── RPC: background → هنا → MAIN → هنا → background ─── */
  const pending = new Map(); /* id → {resolve, reject, to} */

  function mainRPC(op, args, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      const id = "c" + Math.random().toString(36).slice(2, 10);
      const to = setTimeout(() => { pending.delete(id); reject(new Error("main_timeout:" + op)); }, timeoutMs);
      pending.set(id, { resolve, reject, to });
      window.postMessage({ __nx: "req", id, op, args: args || {} }, "*");
    });
  }

  /* ردود عالم الصفحة */
  window.addEventListener("message", (ev) => {
    if (ev.source !== window || !ev.data) return;

    /* رد RPC */
    if (ev.data.__nx === "res") {
      const w = pending.get(ev.data.id);
      if (w) { clearTimeout(w.to); pending.delete(ev.data.id); ev.data.ok ? w.resolve(ev.data.data) : w.reject(new Error(ev.data.err)); }
      return;
    }

    /* نقرة اعتراض شبكة/DOM من عالم الصفحة — تُحوَّل للـbackground فوراً */
    if (ev.data.__nx === "tap" && ev.data.kind === "video" && ev.data.url) {
      try { chrome.runtime.sendMessage({ cmd: "nx-tap", url: ev.data.url, note: ev.data.note || "" }); } catch {}
    }
  });

  /* أوامر الـbackground */
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || msg.cmd !== "nx-rpc") return false;
    mainRPC(msg.op, msg.args, 120000)
      .then((data) => sendResponse({ ok: true, id: msg.id, data }))
      .catch((e) => sendResponse({ ok: false, id: msg.id, err: String(e && e.message || e) }));
    return true; /* رد غير متزامن */
  });

  /* ─── ملاحظة حية: إن فُتحت الصفحة قبل الجسر نؤكد للـbackground أننا هنا ─── */
  try { chrome.runtime.sendMessage({ cmd: "nx-tap", url: "", note: "content_ready:" + location.pathname }).catch(() => {}); } catch {}

  console.log("[NX-FlowBridge] content-script ready");
})();
