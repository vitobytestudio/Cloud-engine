/* ═══════════════════════════════════════════════════════════════════
   NEXUS FLOW BRIDGE — content-beacon.js (دومينات المنصة حصراً)
   ─────────────────────────────────────────────────────────────────
   دوران:
   1) بثّ EXT_HELLO للصفحة — الإعلان الذاتي عن وجود الإضافة ومعرفها
      (Auto-Discovery: المستخدم لا ينسخ معرّفاً أبداً).
   2) مِرحّال الإضافة→الصفحة: رسائل الـbackground تصل سكربتات المحتوى
      فقط، وهذا السكربت ينقلها للصفحة عبر window.postMessage ليلمها
      bridge-sdk داخل صفحة الأستوديو. لا يقرأ ولا يخزن أي شيء.
   ═══════════════════════════════════════════════════════════════════ */
"use strict";
(function () {
  let announced = false;
  function hello() {
    if (announced) return;
    announced = true;
    try {
      window.postMessage({ v: 1, ns: "nx.flow", type: "EXT_HELLO", payload: { extId: chrome.runtime.id, ver: chrome.runtime.getManifest().version } }, "*");
    } catch {}
  }
  hello();
  document.addEventListener("DOMContentLoaded", hello);
  window.addEventListener("load", hello);
  /* إعادة الإعلان إن طلبت الصفحة ذلك (بعد فشل تحقق أول) */
  window.addEventListener("message", (ev) => {
    if (ev.source === window && ev.data && ev.data.ns === "nx.flow" && ev.data.type === "EXT_WHO") hello();
  });
  /* المِرحّال: background → هنا → الصفحة */
  chrome.runtime.onMessage.addListener((m) => {
    if (m && m.ns === "nx.flow") { try { window.postMessage(m, "*"); } catch {} }
  });
})();
