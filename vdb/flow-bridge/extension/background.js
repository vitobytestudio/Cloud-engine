/* ═══════════════════════════════════════════════════════════════════
   NEXUS FLOW BRIDGE — background.js (MV3 service worker)
   ─────────────────────────────────────────────────────────────────
   المهمة: موجّه مركزي بين أستوديو NEXUS (صفحة ويب) وتبويب Google Flow
   في متصفح الزبون نفسه. التوليد يجري بجلسته هو ورصيده هو — نحن نوجّه
   ونجمع النتيجة ونمررها فقط.

   عهود الأمان غير القابلة للنقاش:
   1) لا نقرأ أي كوكيز ولا رموز مصادقة — أبداً. الجلسة ملك المتصفح.
   2) لا نخزن أي سر. chrome.storage.session يحمل حالة مهام فقط
      (معرفات، حالة، نسبة تقدم) — ذاكرة فقط، تُمسح بإغلاق المتصفح.
   3) الإضافة لا تسمع إلا أصول منصتنا (externally_connectable) —
      ونعيد التحقق من الأصل يدوياً في كل رسالة (دفاع بعمق طبقتين).
   4) الفيديو لا يقيم في أي خادم: رابط مباشر أو Blob مجزأ للمشغل.
   ═══════════════════════════════════════════════════════════════════ */
"use strict";

/* ─── الإعدادات ─── */
const CFG = {
  NS: "nx.flow",                    /* مساحة أسماء البروتوكول */
  V: 1,                             /* إصدار المغلف */
  EXT_VER: chrome.runtime.getManifest().version,
  FLOW_URL: "https://labs.google/fx/tools/flow",
  FLOW_TAB_PAT: "https://labs.google/*",
  /* أصول منصتنا المسموح لها بالأمر — نطاق مزدوج فوق externally_connectable */
  ALLOWED_ORIGINS: [
    "https://nexus.vitobytestudio.workers.dev",
    "https://naksab.vitobytestudio.workers.dev",
    "https://vdb.vitobytestudio.workers.dev"
  ],
  CHUNK: 8 * 1024 * 1024,           /* 8MB قبل base64 — تحت حدود الرسائل بأمان */
  ACK_TIMEOUT: 15000,               /* انتظار إقرار استلام الجزء */
  RETRY_ONCE: 1,                    /* إعادة جزء واحد عند فشل الإقرار */
  RENDER_POLL_MS: 1500,             /* نبض التقدم من تبويب العمل */
  RENDER_MAX_MS: 10 * 60000,        /* سقف الرندر — فشل بعده */
  KEEPALIVE_ALARM: "nx-flow-keepalive"
};

/* ─── سجل المهام: ذاكرة + مرآة جلسة (بلا أسرار إطلاقاً) ─── */
const jobs = new Map(); /* jobId → {id, state, progress, studioTab, flowTab, started, spec} */
const ackWaiters = new Map(); /* jobId+seq → resolve */
let portToStudio = null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nowId = () => "job_" + crypto.randomUUID().replace(/-/g, "").slice(0, 20);

async function saveJobs() {
  try { await chrome.storage.session.set({ jobs: [...jobs.values()].map(j => ({ ...j })) }); } catch {}
}
async function loadJobs() {
  try {
    const { jobs: arr } = await chrome.storage.session.get("jobs");
    (arr || []).forEach(j => { if (j.state !== "ready" && j.state !== "failed") j.state = "interrupted"; jobs.set(j.id, j); });
  } catch {}
}
loadJobs();

/* ─── مغلف الرسائل الموحد ─── */
const env = (type, jobId, payload) => ({ v: CFG.V, ns: CFG.NS, type, jobId: jobId || null, ts: Date.now(), payload: payload || {} });

function originAllowed(sender) {
  const o = sender.origin || (sender.url ? new URL(sender.url).origin : "");
  return CFG.ALLOWED_ORIGINS.includes(o);
}

/* ─── الإرسال إلى صفحة الأستوديو: المنفذ أولاً ثم الرسالة المباشرة ─── */
function toStudio(job, msg) {
  if (portToStudio) { try { portToStudio.postMessage(msg); return; } catch { portToStudio = null; } }
  if (job && job.studioTab) chrome.tabs.sendMessage(job.studioTab, msg).catch(() => {});
}

/* ─── تحديث حالة مهمة وإشعار الأستوديو ─── */
function setJob(job, state, progress, note) {
  job.state = state;
  if (progress != null) job.progress = Math.max(0, Math.min(100, Math.round(progress)));
  if (note) job.note = note;
  toStudio(job, env("JOB_UPDATE", job.id, { state: job.state, progress: job.progress, note: job.note || "" }));
  saveJobs();
}

/* ─── نبض إبقاء الـservice worker مستيقظاً أثناء الرندر ─── */
async function keepAlive(on) {
  if (on) chrome.alarms.create(CFG.KEEPALIVE_ALARM, { periodInMinutes: 0.4 });
  else chrome.alarms.clear(CFG.KEEPALIVE_ALARM);
}
chrome.alarms.onAlarm.addListener((a) => { if (a.name === CFG.KEEPALIVE_ALARM) { /* مجرد نبض — وجوده يصفّر مؤقت الخمول */ } });

/* ═══ التبويب: إيجاد تبويب Flow أو فتحه بصمت ═══ */
async function findOrOpenFlowTab(active = false) {
  const tabs = await chrome.tabs.query({ url: CFG.FLOW_TAB_PAT });
  for (const t of tabs) if (t.url && t.url.includes("/flow")) return t;
  return chrome.tabs.create({ url: CFG.FLOW_URL, active });
}

async function flowTabReady(job) {
  let tab = await chrome.tabs.get(job.flowTab).catch(() => null);
  if (!tab || tab.status === "unloaded") {
    tab = await findOrOpenFlowTab(false);
    job.flowTab = tab.id;
    await sleep(2500); /* تحميل أولي */
  }
  await injectMain(job.flowTab);
  return tab.id;
}

/* ═══ حقن المعترض في عالم الصفحة (MAIN world) — قابل للتكرار بأمان ═══ */
async function injectMain(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: mainWorldBoot,
      args: [mainWorldAdapt()]
    });
  } catch (e) {
    throw new Error("inject_main_failed:" + (e && e.message));
  }
}

/* ─── خريطة نقاط التلاؤم ⟲ADAPT: كل ما قد تغيّره جوجل يجتمع هنا ─── */
function mainWorldAdapt() {
  return {
    flowUrlIncludes: "/flow",
    loginMarkers: [
      '[data-test-id*="sign-in"]', 'a[href*="accounts.google.com/SignIn"]',
      'button[aria-label*="Sign in"]', '[aria-label*="Sign in"]'
    ],
    projectMarkers: [
      '[data-test-id*="project"]', '[data-test-id*="prompt"]',
      'textarea[placeholder]', '[contenteditable="true"]'
    ],
    promptInput: [
      'textarea[data-test-id*="prompt"]', 'textarea[placeholder]',
      'div[contenteditable="true"][role="textbox"]'
    ],
    generateBtn: [
      'button[data-test-id*="create"]', 'button[data-test-id*="generate"]',
      'button[aria-label*="Create"]', 'button[aria-label*="Generate"]'
    ],
    videoUrlPat: /(googleusercontent|storage\.googleapis)\.com\/[^\s"']+/,
    videoExts: /\.(mp4|webm|mov)(\?|$)/i,
    progressText: /generat|render|٪|%|جارٍ|قيد/i
  };
}

/* ═══ مهمة الإقلاع في عالم الصفحة — تُسلسل وتُحقن (بلا مراجع خارجية) ═══ */
function mainWorldBoot(A) {
  if (window.__nxFlowMain) return; /* محقون مسبقاً */
  window.__nxFlowMain = true;

  const pending = new Map();
  let seq = 0;

  /* RPC من عالم المحتوى → عالم الصفحة */
  window.addEventListener("message", (ev) => {
    if (ev.source !== window || !ev.data || ev.data.__nx !== "req") return;
    const { id, op, args } = ev.data;
    handle(op, args).then(
      (data) => window.postMessage({ __nx: "res", id, ok: true, data }, "*"),
      (err) => window.postMessage({ __nx: "res", id, ok: false, err: String(err && err.message || err) }, "*")
    );
  });

  async function handle(op, args) {
    if (op === "session") return sessionProbe();
    if (op === "generate") return uiDispatch(args);
    if (op === "fetchStart") return fetchStart(args.url);
    if (op === "fetchChunk") return fetchChunk(args.handle, args.offset, args.len);
    if (op === "fetchEnd") return fetchEnd(args.handle);
    throw new Error("unknown_op:" + op);
  }

  /* ─── فحص الجلسة: هل الزبون داخلاً بحسابه في Flow؟ ─── */
  function sessionProbe() {
    const txt = document.body ? document.body.innerText : "";
    const loggedOut = A.loginMarkers.some(sel => document.querySelector(sel));
    const loggedIn = !loggedOut && A.projectMarkers.some(sel => document.querySelector(sel));
    return { url: location.href, loggedIn: !!loggedIn, loggedOutSeen: !!loggedOut, hasFlow: location.href.includes(A.flowUrlIncludes) };
  }

  /* ─── إطلاق التوليد: تعبئة البرومبت وضغط الزر بجلسة الزبون نفسها ─── */
  async function uiDispatch(spec) {
    const el = A.promptInput.map(s => document.querySelector(s)).find(Boolean);
    if (!el) throw new Error("prompt_input_not_found");
    const text = spec.prompt || "";
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      const setter = Object.getOwnPropertyDescriptor(el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, "value").set;
      setter.call(el, text);
    } else {
      el.textContent = text;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise(r => setTimeout(r, 350));
    const btn = A.generateBtn.map(s => [...document.querySelectorAll(s)].find(b => !b.disabled)).find(Boolean);
    if (!btn) throw new Error("generate_button_not_found");
    btn.click();
    return { dispatched: true, mode: "ui" };
  }

  /* ─── اعتراض الشبكة: نلتقط روابط الفيديو من استجابات الصفحة نفسها ─── */
  const VIDEO_PAT = A.videoUrlPat;
  const EXT_PAT = A.videoExts;
  const found = new Set();

  function tapHit(url, note) {
    if (!url || found.has(url)) return;
    try { if (!VIDEO_PAT.test(url)) return; } catch { return; }
    found.add(url);
    window.postMessage({ __nx: "tap", kind: "video", url, note: note || "" }, "*");
  }

  function scanJSON(x) {
    if (!x) return;
    try {
      const s = typeof x === "string" ? x : JSON.stringify(x);
      if (s.length > 4e6) return;
      const m = s.match(new RegExp(VIDEO_PAT.source, "g"));
      if (m) m.forEach(u => tapHit(u.replace(/\\u0026/g, "&").replace(/\\\//g, "/"), "net"));
    } catch {}
  }

  const of = window.fetch;
  window.fetch = async function (...args) {
    const res = await of.apply(this, args);
    try {
      const ct = res.headers && res.headers.get("content-type") || "";
      if (ct.includes("json") || ct.includes("text")) {
        const cl = res.clone();
        cl.text().then(scanJSON).catch(() => {});
      }
    } catch {}
    return res;
  };

  const XHR = XMLHttpRequest.prototype;
  const oOpen = XHR.open, oSend = XHR.send;
  XHR.open = function (m, u) { this.__nxUrl = u; return oOpen.apply(this, arguments); };
  XHR.send = function () {
    this.addEventListener("load", () => { try { scanJSON(this.responseText); } catch {} });
    return oSend.apply(this, arguments);
  };

  /* ─── سحب الفيديو من سياق الصفحة (جلسة الزبون) على شكل أجزاء base64 ─── */
  const handles = new Map();
  async function fetchStart(url) {
    const res = await of(url, { credentials: "include" });
    if (!res.ok) throw new Error("fetch_" + res.status);
    const body = res.body || await res.blob().then(b => b.stream());
    const reader = body.getReader();
    const h = "h" + (++seq);
    handles.set(h, { reader, buf: [], size: 0 });
    return { handle: h };
  }
  async function fetchChunk(handle, offset, len) {
    const st = handles.get(handle);
    if (!st) throw new Error("bad_handle");
    let got = 0, out = [];
    while (got < len) {
      const { done, value } = await st.reader.read();
      if (done) break;
      out.push(value); st.buf.push(value); got += value.length; st.size += value.length;
    }
    const total = out.reduce((n, c) => n + c.length, 0);
    const bytes = new Uint8Array(total);
    let o = 0; out.forEach(c => { bytes.set(c, o); o += c.length; });
    let bin = "";
    const STEP = 32768;
    for (let i = 0; i < bytes.length; i += STEP) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + STEP));
    return { b64: btoa(bin), bytes: total, done: false };
  }
  async function fetchEnd(handle) { handles.delete(handle); return { done: true }; }

  /* ─── مراقبة DOM: أي فيديو يظهر في Flow يُبلَّغ عنه فوراً ─── */
  const mo = new MutationObserver(() => {
    document.querySelectorAll("video").forEach(v => {
      const src = v.currentSrc || v.src || "";
      if (src) tapHit(src, "dom");
      if (v.poster) tapHit(v.poster, "dom-poster");
    });
  });
  mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
}

/* ═══ جسر عالم المحتوى: طلب/رد + نقرات ─══ */
let rpcSeq = 0;
const rpcPending = new Map();

function flowRPC(tabId, op, args, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const id = "r" + (++rpcSeq);
    const to = setTimeout(() => { rpcPending.delete(id); reject(new Error("rpc_timeout:" + op)); }, timeoutMs);
    rpcPending.set(id, { resolve, reject, to });
    chrome.tabs.sendMessage(tabId, { cmd: "nx-rpc", id, op, args: args || {} }).catch((e) => {
      clearTimeout(to); rpcPending.delete(id); reject(e);
    });
  });
}

/* ═══ مضخة نقل الفيديو: Blob من تبويب العمل → أجزاء مقرّة إلى المشغل ═══ */
async function pumpVideo(job, url) {
  const { handle } = await flowRPC(job.flowTab, "fetchStart", { url }, 60000);
  let seqNo = 0;
  try {
    while (true) {
      const part = await flowRPC(job.flowTab, "fetchChunk", { handle, offset: seqNo * CFG.CHUNK, len: CFG.CHUNK }, 120000);
      seqNo++;
      const totalB64 = part.b64.length;
      setJob(job, "transferring", job.progress || 90, "نقل " + seqNo);
      /* إرسال جزء بانتظار الإقرار — ضبط تدفق يحفظ الذاكرة */
      for (let attempt = 0; attempt <= CFG.RETRY_ONCE; attempt++) {
        const done = new Promise((resolve) => ackWaiters.set(job.id + "#" + seqNo, resolve));
        toStudio(job, env("VIDEO_CHUNK", job.id, { seq: seqNo, b64: part.b64, bytes: part.bytes }));
        const got = await Promise.race([done, sleep(CFG.ACK_TIMEOUT).then(() => "timeout")]);
        if (got !== "timeout") break;
        if (attempt === CFG.RETRY_ONCE) throw new Error("chunk_ack_timeout:" + seqNo);
      }
      if (part.done) break;
    }
    await flowRPC(job.flowTab, "fetchEnd", { handle });
    toStudio(job, env("VIDEO_CHUNK_END", job.id, { total: seqNo }));
    setJob(job, "ready", 100, "جاهز في المشغل");
    keepAlive(false);
  } catch (e) {
    toStudio(job, env("VIDEO_CHUNK_ERR", job.id, { error: String(e && e.message || e), seq: seqNo }));
    setJob(job, "failed", job.progress, "فشل النقل: " + String(e && e.message || e));
    keepAlive(false);
  }
}

/* ═══ دورة مراقبة الرندر: تقدم لحظي حتى ظهور الفيديو ═══ */
async function watchRender(job) {
  const t0 = Date.now();
  chrome.alarms.create(CFG.KEEPALIVE_ALARM, { periodInMinutes: 0.4 });
  const poll = setInterval(async () => {
    const j = jobs.get(job.id);
    if (!j || j.state === "ready" || j.state === "failed" || j.state === "cancelled") { clearInterval(poll); return; }
    if (Date.now() - t0 > CFG.RENDER_MAX_MS) {
      clearInterval(poll); setJob(j, "failed", j.progress, "تجاوز زمن الرندر"); keepAlive(false); return;
    }
    /* تقدّم زمني متواضع بين 5% و85% حتى يرسل تبويب العمل إشارة أعلى */
    const est = Math.min(85, 5 + Math.round((Date.now() - t0) / CFG.RENDER_MAX_MS * 80));
    if (j.progress == null || j.progress < est) setJob(j, "rendering", est, "جارٍ الرندر على حساب الزبون");
  }, CFG.RENDER_POLL_MS);
}

/* ═══ الراوتر الخارجي: صفحة الأستوديو → الإضافة ═══ */
chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  if (!originAllowed(sender)) return void sendResponse({ v: CFG.V, ns: CFG.NS, type: "ERR", payload: { error: "origin_denied" } });
  if (!msg || msg.ns !== CFG.NS || msg.v !== CFG.V) return void sendResponse(env("ERR", null, { error: "bad_envelope" }));

  (async () => {
    try {
      const studioTab = sender.tab ? sender.tab.id : null;

      if (msg.type === "PING") return sendResponse(env("PONG", null, { ver: CFG.EXT_VER, caps: ["flow.generate", "chunk.transfer", "progress"] }));

      if (msg.type === "GET_SESSION") {
        const tab = await findOrOpenFlowTab(false);
        await sleep(800);
        await injectMain(tab.id);
        const s = await flowRPC(tab.id, "session", {}).catch(() => ({ loggedIn: false, probe_failed: true }));
        return sendResponse(env("SESSION", null, { ...s, flowTab: tab.id }));
      }

      if (msg.type === "GENERATE") {
        const spec = msg.payload || {};
        if (!spec.prompt || String(spec.prompt).length < 3) return sendResponse(env("ERR", null, { error: "invalid_spec" }));
        const job = { id: nowId(), state: "sending", progress: 0, studioTab, flowTab: null, started: Date.now(), spec: { prompt: String(spec.prompt).slice(0, 8000), aspect: spec.aspect || "16:9", duration: spec.duration || 8 } };
        jobs.set(job.id, job);
        try {
          const tab = await findOrOpenFlowTab(false);
          job.flowTab = tab.id;
          await flowTabReady(job);
          await flowRPC(job.flowTab, "generate", job.spec, 45000);
          setJob(job, "rendering", 3, "أُرسل الأمر بجلسة الزبون");
          watchRender(job);
          return sendResponse(env("ACCEPTED", job.id, { jobId: job.id, state: "rendering" }));
        } catch (e) {
          setJob(job, "failed", 0, String(e && e.message || e));
          return sendResponse(env("ERR", job.id, { error: String(e && e.message || e) }));
        }
      }

      if (msg.type === "CANCEL") {
        const j = jobs.get(msg.jobId);
        if (j) { setJob(j, "cancelled", j.progress, "أُلغي من الأستوديو"); keepAlive(false); }
        return sendResponse(env("CANCELLED", msg.jobId, {}));
      }

      if (msg.type === "VIDEO_DIRECT_OK") { /* الأستوديو قرر أن الرابط المباشر يعمل — لا حاجة للنقل */
        const j = jobs.get(msg.jobId); if (j) setJob(j, "ready", 100, "رابط مباشر");
        return sendResponse(env("OK", msg.jobId, {}));
      }

      if (msg.type === "REQUEST_BLOB") { /* الرابط المباشر محجوب — ابدأ النقل المجزأ */
        const j = jobs.get(msg.jobId);
        if (!j || !msg.payload.url) return sendResponse(env("ERR", msg.jobId, { error: "no_job_or_url" }));
        sendResponse(env("PUMPING", j.id, {}));
        pumpVideo(j, msg.payload.url);
        return;
      }

      if (msg.type === "CHUNK_ACK") {
        const w = ackWaiters.get(msg.jobId + "#" + (msg.payload && msg.payload.seq));
        if (w) { ackWaiters.delete(msg.jobId + "#" + msg.payload.seq); w("ack"); }
        return sendResponse(env("OK", msg.jobId, {}));
      }

      return sendResponse(env("ERR", null, { error: "unknown_type:" + msg.type }));
    } catch (e) {
      sendResponse(env("ERR", null, { error: String(e && e.message || e) }));
    }
  })();

  return true; /* رد غير متزامن */
});

/* ═══ المنفذ طويل العمر: يبقي الـworker مستيقظاً ويبث الأحداث بترتيب ═══ */
chrome.runtime.onConnectExternal.addListener((port) => {
  if (!originAllowed(port.sender || {})) { port.disconnect(); return; }
  portToStudio = port;
  port.onDisconnect.addListener(() => { if (portToStudio === port) portToStudio = null; });
});

/* ═══ نقرات عالم المحتوى: روابط فيديو مرصودة ═══ */
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.cmd === "nx-tap") {
      if (msg.url) {
        /* أول رابط فيديو مرصود = النتيجة. نبثه للأستوديو فوراً */
        const j = [...jobs.values()].find(x => x.state === "rendering" || x.state === "sending");
        if (j) {
          toStudio(j, env("VIDEO_READY", j.id, { url: msg.url, mode: msg.note || "net" }));
          setJob(j, "picked", Math.max(j.progress || 0, 88), "رُصد الفيديو");
        }
      }
      return void sendResponse({ ok: true });
    }
  if (msg && msg.cmd === "nx-rpc-res") {
    const w = rpcPending.get(msg.id);
    if (w) { clearTimeout(w.to); rpcPending.delete(msg.id); msg.ok ? w.resolve(msg.data) : w.reject(new Error(msg.err)); }
    return void sendResponse({ ok: true });
  }
  return false;
});

/* ═══ تبويب العمل أُغلق أثناء مهمة؟ فشل صريح فوراً ═══ */
chrome.tabs.onRemoved.addListener((tabId) => {
  [...jobs.values()].forEach(j => {
    if (j.flowTab === tabId && (j.state === "rendering" || j.state === "sending" || j.state === "transferring")) {
      setJob(j, "failed", j.progress, "أُغلق تبويب Flow");
      keepAlive(false);
    }
  });
});

console.log("[NX-FlowBridge] background ready v" + CFG.EXT_VER);
