#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   VITO BYTE FLOW RELAY — عقدة الأتمتة (الجلسة السحابية المعزولة)
   ─────────────────────────────────────────────────────────────────
   1) /login/:token — نافذة دخول تفاعلية حية: بث مباشر لصفحة دخول جوجل
      الرسمية (CDP Page.startScreencast فوق WebSocket صفر تبعيات) —
      الزبون يكتب بريده وكلمة السر بنفسه ويؤكد التحقق بخطوتين بيده
      وبرضاه الكامل — نحن لا نلمس كلمة السر في أي حقل لدينا، ما يمر
      عبرنا بكسلات الصفحة وأحداث الفأرة/اللمس فقط.
   2) متصفح غير مكشوف: Patchright إن وُجد وإلا Playwright مع إخفاء
      AutomationControlled و--enable-automation — تجنب رسالة
      "This browser or app may not be secure".
   3) أبعاد النافذة تتلاءم تلقائياً مع الهاتف (390x844) من User-Agent.
   4) مراقبة نجاح الدخول: عند الوصول إلى labs.google تُحفظ storageState
      مشفرة لدى المنصة، يُغلق البث فوراً، وتظهر «تم الربط بنجاح».
   5) سحب مهام التوليد وتنفيذها بجلسة الزبون — آلية القيادة المجرّبة مستقاة من
      GTAI-1/flow-mcp (★715, ISC): محددات Flow الحية، Frames XOR Ingredients،
      رفع المراجع fm-<job>، انتظار البلاطات (NN% + مصغّرة الفيديو) — مع تعديلنا:
      لا تنزيل — الرابط الحي من بلاط الشبكة يعود لمشغل الزبون.
   6) سحب مهام التوليد الأصلية من طابور المنصة وتنفيذها بجلسة الزبون على حسابه
      في Google Flow → رابط النتيجة يعود للمشغل — صفر تخزين هنا.

   السائقان:
   - mock (افتراضي): للبوابات والتجارب — ربط فوري + إطارات محاكاة حية.
   - flow (إنتاج): الدخول التفاعلي الحقيقي وتشغيل Flow.
     يتطلب على جهاز العقدة:
       npm i patchright && npx patchright install chromium
       (أو: npm i playwright && npx playwright install chromium)

   متغيرات: PORT(8801) NEXUS_ORIGIN VBS_RELAY_TOKEN DRIVER(mock|flow)
            HEADLESS=1 (بلا شاشة — داخل Xvfb) LOGIN_TIMEOUT_MIN(10)
   ═══════════════════════════════════════════════════════════════════ */
"use strict";
import http from "node:http";
import crypto from "node:crypto";

const PORT = Number(process.env.PORT || 8801);
const NEXUS = String(process.env.NEXUS_ORIGIN || "").replace(/\/+$/, "");
const TOKEN = String(process.env.VBS_RELAY_TOKEN || "");
const DRIVER = String(process.env.DRIVER || "mock");
const LOGIN_MIN = Number(process.env.LOGIN_TIMEOUT_MIN || 10);
if (!NEXUS || !TOKEN) { console.error("[relay] NEXUS_ORIGIN و VBS_RELAY_TOKEN إلزاميان"); process.exit(1); }

const FLOW_URL = "https://labs.google/fx/tools/flow";
const PHONE_UA = /Mobi|Android|iPhone|iPad/i;
/* الحسم الثلاثي للنجاح (جرح إنتاج 2026-11-21: بارامتر continue في رابط الدخول يطابق "labs.google" فيعلن نجاحاً زائفاً بلا حساب):
   (أ) عنوان Flow حقيقي: مضيف labs.google|flow.google.com ومساراً — لا بارامترات استعلام أبداً
   (ب) شريحة حساب جوجل موجودة بالصفحة (لا تظهر إلا مسجّلاً)
   (ج) في finishLive: كوكي دخول جوجل فعلي (SID/SAPISID…) داخل الجلسة قبل نشرها — بلاها لا نجاح ولا تخزين */
const FLOW_HOSTS = new Set(["labs.google", "flow.google.com"]);
const GOOGLE_AUTH_COOKIES = new Set(["SID", "SSID", "HSID", "SAPISID", "APISID", "__Secure-1PSID", "__Secure-3PSID"]);
async function reachedFlow(pg) {
  try {
    const u = new URL(pg.url());
    if (!FLOW_HOSTS.has(u.hostname)) return false;
    if (!(u.hostname === "labs.google" ? u.pathname.startsWith("/fx/") : u.pathname.startsWith("/project/"))) return false;
    return await pg.evaluate(() => !!document.querySelector('a[aria-label^="Google Account"], button[aria-label^="Google Account"], img[alt^="Google Account"], [data-ogsr-up]')).catch(() => false);
  } catch { return false; }
}

const page = (title, body, autoClose = false) => `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{background:#05060a;color:#eef0f6;font-family:system-ui,'IBM Plex Sans Arabic',sans-serif;display:grid;place-items:center;min-height:100vh;margin:0}.c{max-width:460px;padding:28px;text-align:center}.m{font-weight:700;letter-spacing:.26em;font-size:12px;color:#cdbaff}h1{font-size:19px}p{color:#939ab1;line-height:1.9;font-size:14px}</style></head><body><div class="c"><div class="m">VITO BYTE STUDIO</div>${body}${autoClose ? '<script>setTimeout(()=>{try{window.close()}catch{}},1200)<\/script>' : ""}</div></body></html>`;

async function postSession(token, session) {
  const r = await fetch(NEXUS + "/api/studio/session", {
    method: "POST",
    headers: { "content-type": "application/json", "x-relay-token": TOKEN },
    body: JSON.stringify({ token, session })
  });
  if (!r.ok) throw new Error("session_post_" + r.status);
}

/* ═══ WebSocket خفيف صفر تبعيات (RFC6455: مصافحة + إطارات + تجزيء + ping) ═══ */
const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const wsAccept = (key) => crypto.createHash("sha1").update(key + WS_GUID).digest("base64");

class WSConn {
  constructor(sock) {
    this.sock = sock;
    this.buf = Buffer.alloc(0);
    this.frags = [];
    this.fragOp = 0;
    this.alive = true;
    this.onmessage = null;
    this.onclose = null;
    sock.on("data", (d) => this._feed(d));
    sock.on("error", () => this.close());
    sock.on("close", () => { if (this.alive) { this.alive = false; clearInterval(this.iv); this.onclose && this.onclose(); } });
    this.iv = setInterval(() => this._raw(0x9, Buffer.alloc(0)), 25000);
  }
  _feed(d) {
    this.buf = this.buf.length ? Buffer.concat([this.buf, d]) : d;
    for (;;) {
      if (this.buf.length < 2) return;
      const b0 = this.buf[0], b1 = this.buf[1];
      const fin = (b0 & 0x80) !== 0, op = b0 & 0x0f, masked = (b1 & 0x80) !== 0;
      let len = b1 & 0x7f, off = 2;
      if (len === 126) { if (this.buf.length < 4) return; len = this.buf.readUInt16BE(2); off = 4; }
      else if (len === 127) {
        if (this.buf.length < 10) return;
        const big = this.buf.readBigUInt64BE(2);
        if (big > 8n * 1024n * 1024n) { this.close(); return; }
        len = Number(big); off = 10;
      }
      if (masked) off += 4;
      if (this.buf.length < off + len) return;
      let pl = this.buf.subarray(off + (masked ? 4 : 0), off + len);
      if (masked) {
        const mk = this.buf.subarray(off - 4, off);
        pl = Buffer.from(pl);
        for (let i = 0; i < pl.length; i++) pl[i] ^= mk[i % 4];
      }
      this.buf = this.buf.subarray(off + len);
      if (op === 0x8) { this._raw(0x8, pl.subarray(0, 2)); this.alive = false; clearInterval(this.iv); try { this.sock.end(); } catch {} this.onclose && this.onclose(); return; }
      if (op === 0x9) { this._raw(0xA, pl); continue; }
      if (op === 0xA) continue;
      if (!fin) { this.frags.push(pl); this.fragOp = this.fragOp || op; continue; }
      let msg = pl;
      if (this.frags.length) { this.frags.push(pl); msg = Buffer.concat(this.frags); this.frags = []; }
      const kind = this.fragOp || op;
      this.fragOp = 0;
      if (kind === 0x1 && this.onmessage) { try { this.onmessage(msg.toString("utf8")); } catch {} }
    }
  }
  _raw(op, pl) {
    if (!this.alive) return;
    const head = Buffer.from([0x80 | op]);
    let lenB;
    const l = pl.length;
    if (l < 126) lenB = Buffer.from([l]);
    else if (l < 65536) { lenB = Buffer.alloc(3); lenB[0] = 126; lenB.writeUInt16BE(l, 1); }
    else { lenB = Buffer.alloc(9); lenB[0] = 127; lenB.writeBigUInt64BE(BigInt(l), 1); }
    try { this.sock.write(Buffer.concat([head, lenB, pl])); } catch {}
  }
  send(s) { this._raw(0x1, Buffer.from(String(s))); }
  close() {
    if (this.alive) { this._raw(0x8, Buffer.alloc(2)); this.alive = false; }
    clearInterval(this.iv);
    try { this.sock.end(); } catch {}
    try { this.sock.destroy(); } catch {}
    this.onclose && this.onclose();
  }
}

/* ═══ المتصفح غير المكشوف: Patchright أولاً ثم Playwright ═══ */
let PWLIB = null;
async function pickLib() {
  if (PWLIB) return PWLIB;
  for (const name of ["patchright", "playwright", "playwright-core"]) {
    try { const m = await import(name); if (m && m.chromium) { PWLIB = m; return m; } } catch {}
  }
  return null;
}
const STEALTH_ARGS = [
  "--disable-blink-features=AutomationControlled",
  "--disable-infobars",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-features=IsolateOrigins,site-per-process",
  "--start-maximized",
];
async function launchBrowser(headless) {
  const lib = await pickLib();
  if (!lib) throw new Error("browser_lib_missing");
  return lib.chromium.launch({ headless: !!headless, ignoreDefaultArgs: ["--enable-automation"], args: STEALTH_ARGS });
}
const errUser = (e) => {
  const m = String(e && e.message || e);
  if (m.includes("browser_lib_missing")) return "سائق المتصفح غير مثبت على عقدة الربط — ثبّت patchright ثم أعد المحاولة";
  return "تعذر تشغيل نافذة الدخول — أعد المحاولة (" + m.slice(0, 80) + ")";
};

/* ═══ الجلسات الحية: توكن → نافذة متصفح + بث + مدخلات ═══ */
const logins = new Map();
function sendTo(entry, obj) { if (entry.conn && entry.conn.alive) { try { entry.conn.send(JSON.stringify(obj)); } catch {} } }
function cleanupLive(entry) {
  clearTimeout(entry.timer); clearInterval(entry.watch);
  if (entry.conn) { try { entry.conn.close(); } catch {} }
  if (entry.browser) { try { entry.browser.close().catch(() => {}); } catch {} }
  logins.delete(entry.tok);
}
function finishLive(entry, ok, msg) {
  if (entry.done) return;
  entry.done = true;
  clearTimeout(entry.timer); clearInterval(entry.watch);
  (async () => {
    try {
      if (ok && entry.ctx) {
        const st = await entry.ctx.storageState();
        await postSession(entry.tok, { driver: "flow", cookies: st.cookies, origins: st.origins });
        sendTo(entry, { type: "linked" });
      } else sendTo(entry, { type: "error", msg: msg || "لم يكتمل الربط — أعد المحاولة" });
    } catch (e) { sendTo(entry, { type: "error", msg: errUser(e) }); }
    setTimeout(() => cleanupLive(entry), ok ? 1200 : 50);
  })();
}

/* ─── الدخول التفاعلي الحي (سائق flow) ─── */
function startLiveLogin(tok, phone) {
  if (logins.has(tok)) return;
  const entry = { tok, conn: null, done: false, phone };
  logins.set(tok, entry);
  (async () => {
    try {
      entry.browser = await launchBrowser(process.env.HEADLESS === "1");
      entry.ctx = await entry.browser.newContext({
        viewport: phone ? { width: 390, height: 844 } : { width: 1180, height: 780 },
        deviceScaleFactor: phone ? 2 : 1,
        isMobile: phone,
        hasTouch: phone,
        locale: "en-US",
        extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
      });
      await entry.ctx.addInitScript("try{Object.defineProperty(navigator,'webdriver',{get:()=>undefined})}catch{}");
      entry.page = await entry.ctx.newPage();
      entry.cdp = await entry.ctx.newCDPSession(entry.page);
      entry.page.on("dialog", (d) => d.accept().catch(() => {}));
      entry.cdp.on("Page.screencastFrame", (f) => {
        if (!entry.conn || entry.done) return;
        sendTo(entry, { type: "frame", data: f.data });
        entry.cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
      });
      entry.timer = setTimeout(() => finishLive(entry, false, "انتهت مهلة الدخول (" + LOGIN_MIN + " دقائق) — أعد ربط الحساب من المنصة"), LOGIN_MIN * 60000);
      entry.watch = setInterval(async () => {
        if (entry.done) return;
        try {
          if (await reachedFlow(entry.page)) {
            const st = await entry.ctx.storageState();
            if (!st.cookies.some((c) => GOOGLE_AUTH_COOKIES.has(c.name))) return; /* وصل الصفحة دون حساب — يكمل دخوله */
            if (!entry.authNote) { entry.authNote = true; sendTo(entry, { type: "note", msg: "اكتُشف دخولك بحسابك — تُغلق النافذة خلال لحظات…" }); }
            finishLive(entry, true);
          } else if (!entry.sorryNote && /google\.[a-z.]+\/sorry|unusual traffic/i.test(entry.page.url())) {
            entry.sorryNote = true;
            sendTo(entry, { type: "note", msg: "جوجل تطلب تحققاً إضافياً — أكمله بنفسك الآن داخل النافذة (صورة أو نص) وسيكمل الربط تلقائياً" });
          }
        } catch {}
      }, 1500);
      await entry.cdp.send("Page.startScreencast", { format: "jpeg", quality: 55, maxWidth: phone ? 390 : 960, maxHeight: phone ? 844 : 700, everyNthFrame: 1 });
      await entry.page.goto("https://accounts.google.com/signin/v2/identifier?continue=" + encodeURIComponent(FLOW_URL) + "&flowName=GlifWebSignIn", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
    } catch (e) { sendTo(entry, { type: "error", msg: errUser(e) }); cleanupLive(entry); }
  })();
}

/* ─── مدخلات الزبون → CDP (بكسلات فقط — لا حقول كلمة سر لدينا) ─── */
function relayInput(entry, m) {
  const c = entry.cdp;
  if (!c || entry.done) return;
  const cl = (v) => Math.min(4000, Math.max(0, Math.round(Number(v) || 0)));
  let d;
  try { d = JSON.parse(m); } catch { return; }
  try {
    if (d.type === "mouse") {
      const t = d.kind === "move" ? "mouseMoved" : d.kind === "up" ? "mouseReleased" : "mousePressed";
      c.send("Input.dispatchMouseEvent", { type: t, x: cl(d.x), y: cl(d.y), button: d.kind === "move" ? "none" : (d.btn === "right" ? "right" : "left"), clickCount: d.kind === "move" ? 0 : (d.clicks || 1), pointerType: "mouse" }).catch(() => {});
    } else if (d.type === "wheel") {
      c.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: cl(d.x), y: cl(d.y), deltaX: Number(d.dx) || 0, deltaY: Number(d.dy) || 0, button: "none" }).catch(() => {});
    } else if (d.type === "key") {
      const down = d.kind !== "up";
      c.send("Input.dispatchKeyEvent", { type: down ? "keyDown" : "keyUp", key: String(d.key || "").slice(0, 16), code: String(d.code || "").slice(0, 24), windowsVirtualKeyCode: Number(d.vk) || 0, nativeVirtualKeyCode: Number(d.vk) || 0, text: down && d.text ? String(d.text).slice(0, 8) : undefined }).catch(() => {});
    } else if (d.type === "text") {
      c.send("Input.insertText", { text: String(d.text || "").slice(0, 200) }).catch(() => {});
    }
  } catch {}
}

/* ─── محاكاة تفاعلية للبوابات (سائق mock): إطارات حية + ربط فوري ─── */
function startMockLogin(tok, phone) {
  if (logins.has(tok)) return;
  const entry = { tok, conn: null, done: false, mock: true, n: 0 };
  logins.set(tok, entry);
  postSession(tok, { driver: "mock", cookies: [], ua: "vbs-mock" }).catch(() => {});
  entry.timer = setInterval(() => {
    if (entry.done || !entry.conn || !entry.conn.alive) return;
    entry.n++;
    const W = phone ? 390 : 800, H = phone ? 844 : 600;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#12101c"/><rect x="16" y="16" width="${W - 32}" height="${H - 32}" rx="18" fill="#171327" stroke="#2a2440"/><text x="50%" y="40%" fill="#cdbaff" font-size="${phone ? 22 : 26}" text-anchor="middle" font-family="sans-serif">نافذة دخول تجريبية — mock</text><text x="50%" y="50%" fill="#8fd8ff" font-size="${phone ? 16 : 19}" text-anchor="middle">الإطار ${entry.n} — البث التفاعلي يعمل</text><text x="50%" y="60%" fill="#939ab1" font-size="${phone ? 14 : 16}" text-anchor="middle">اكتب بنفسك — لا حقول كلمة سر لدينا</text></svg>`;
    sendTo(entry, { type: "frame", data: Buffer.from(svg).toString("base64"), mime: "svg" });
    if (entry.n >= 3) {
      entry.done = true;
      clearInterval(entry.timer);
      sendTo(entry, { type: "linked" });
      setTimeout(() => logins.delete(tok), 1000);
    }
  }, 900);
}

/* ─── صفحة النافذة التفاعلية (تعمل داخل iframe منصتنا أو مباشرة) ─── */
function loginPage(tok, phone, embed) {
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><title>نافذة دخول جوجل التفاعلية — VITO BYTE STUDIO</title><style>
body{background:#05060a;color:#eef0f6;font-family:system-ui,'IBM Plex Sans Arabic',sans-serif;margin:0;min-height:100vh}
${embed ? "" : ".bar{padding:10px 16px;text-align:center;font-weight:700;letter-spacing:.24em;font-size:11px;color:#cdbaff;border-bottom:1px solid #1c1930}"}
#box{position:relative;margin:${embed ? "0" : "14px"} auto;max-width:${phone ? "390px" : "860px"};width:calc(100% - 16px)}
#vbs-live{display:block;width:100%;height:auto;background:#12101c;border:1px solid #241f3a;border-radius:16px;touch-action:none;cursor:crosshair}
#st{position:absolute;inset:0;display:grid;place-items:center;text-align:center;color:#939ab1;font-size:14px;line-height:2;padding:20px}
#done{position:absolute;inset:0;display:grid;place-items:center;text-align:center;background:#0b1410;border-radius:16px;padding:20px}
#done b{color:#39d98a;font-size:19px}#done p{color:#939ab1;font-size:13.5px;line-height:2}
#kb{position:absolute;top:0;left:0;width:2px;height:2px;opacity:0;border:0;padding:0}
.hint{color:#8a90a6;font-size:12.5px;line-height:2;text-align:center;padding:10px 16px 22px}
</style></head><body>
${embed ? "" : '<div class="bar">VITO BYTE STUDIO</div>'}
<div id="box"><canvas id="vbs-live"></canvas><div id="st">جارٍ فتح نافذة دخول جوجل الرسمية التفاعلية…<br>سجّل دخولك أو أنشئ حساباً جديداً — بيديك أنت.</div><div id="done" hidden><div><b>تم الربط بنجاح ✓</b><p>أغلق هذه النافذة وعد إلى الاستوديو —<br>التوليد سيعمل على حسابك تلقائياً.</p></div></div><input id="kb" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="إدخال النافذة التفاعلية"></div>
<p class="hint">اكتب بريدك وكلمة السر بنفسك هنا في النافذة وأكّد التحقق بخطوتين بيديك — نحن لا نلمس كلمة السر إطلاقاً ولا نراها؛ ما يمر عبرنا بكسلات الصفحة ولمساتك فقط.</p>
<script>
(function(){
"use strict";
var tok=location.pathname.split("/").pop().replace(/\\/+$/,"");
var cv=document.getElementById("vbs-live"),cx=cv.getContext("2d"),st=document.getElementById("st"),done=document.getElementById("done"),kb=document.getElementById("kb");
var proto=location.protocol==="https:"?"wss://":"ws://";
var ws;try{ws=new WebSocket(proto+location.host+"/ws/"+tok)}catch(e){st.textContent="تعذر فتح القناة التفاعلية — أعد المحاولة";return}
ws.onopen=function(){st.textContent="النافذة التفاعلية حية — هذه صفحة جوجل الرسمية داخل عقدة الربط، تابع واكتب بنفسك"};
ws.onerror=function(){st.textContent="تعذر الوصول إلى نافذة الدخول — أغلق النافذة وأعد الضغط على زر الربط"};
ws.onmessage=function(ev){var d;try{d=JSON.parse(ev.data)}catch(e){return}
 if(d.type==="frame"){var im=new Image();im.onload=function(){cv.width=im.width;cv.height=im.height;cx.drawImage(im,0,0);st.hidden=true};im.src="data:image/"+(d.mime||"jpeg")+";base64,"+d.data}
 else if(d.type==="linked"){done.hidden=false;cv.hidden=true;st.hidden=true;kb.blur();setTimeout(function(){try{window.close()}catch(e){}},1500)}
 else if(d.type==="note"){st.hidden=false;st.textContent=d.msg}
 else if(d.type==="error"){st.hidden=false;st.textContent=d.msg||"تعذر إتمام الربط"}};
function pos(e){var r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*(cv.width/r.width),y:(e.clientY-r.top)*(cv.height/r.height)}}
cv.addEventListener("pointerdown",function(e){kb.focus();var p=pos(e);if(ws.readyState===1)ws.send(JSON.stringify({type:"mouse",kind:"down",x:p.x,y:p.y}))});
cv.addEventListener("pointerup",function(e){var p=pos(e);if(ws.readyState===1)ws.send(JSON.stringify({type:"mouse",kind:"up",x:p.x,y:p.y}))});
cv.addEventListener("pointermove",function(e){if((e.buttons||e.pointerType==="touch")&&ws.readyState===1){var p=pos(e);ws.send(JSON.stringify({type:"mouse",kind:"move",x:p.x,y:p.y}))}});
cv.addEventListener("wheel",function(e){var p=pos(e);if(ws.readyState===1)ws.send(JSON.stringify({type:"wheel",x:p.x,y:p.y,dx:e.deltaX,dy:e.deltaY}));e.preventDefault()},{passive:false});
var KM={Enter:[13,"\\r"],Backspace:[8,""],Tab:[9,"\\t"],Escape:[27,""],ArrowUp:[38,""],ArrowDown:[40,""],ArrowLeft:[37,""],ArrowRight:[39,""],Delete:[46,""],Home:[36,""],End:[35,""]};
kb.addEventListener("keydown",function(e){var km=KM[e.key];if(km&&ws.readyState===1){ws.send(JSON.stringify({type:"key",kind:"down",key:e.key,code:e.code,vk:km[0],text:km[1]}));ws.send(JSON.stringify({type:"key",kind:"up",key:e.key,code:e.code,vk:km[0]}));e.preventDefault()}});
kb.addEventListener("input",function(e){if(e.data&&ws.readyState===1)ws.send(JSON.stringify({type:"text",text:e.data}));kb.value=""});
document.addEventListener("pointerdown",function(){kb.focus()},{passive:true});
})();
<\/script></body></html>`;
}

/* ─── إرفاق المشاهد على الجلسة الحية ─── */
function handleWs(tok, conn) {
  const entry = logins.get(tok);
  if (!entry) {
    conn.send(JSON.stringify({ type: "error", msg: "انتهت صلاحية نافذة الربط — أعد الضغط على زر الربط في المنصة" }));
    conn.close();
    return;
  }
  if (entry.conn) { try { entry.conn.close(); } catch {} }
  entry.conn = conn;
  conn.onmessage = (m) => relayInput(entry, m);
  conn.onclose = () => { if (entry.conn === conn) entry.conn = null; };
}

/* ═══ طابور التوليد — السائق المجرّب المستقى من GTAI-1/flow-mcp (★715, ISC) ═══
   آلية القيادة الفعلية لواجهة Flow كما هي عندها، معدّلة لاحتياجنا:
   نحن لا ننزّل الملفات — نأخذ رابط الوسائط الحي من بلاط الشبكة نفسه ليعود لمشغل الزبون. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const IMAGE_TIMEOUT_MS = 3 * 60000;   /* مهلة الصورة المجرّبة */
const VIDEO_TIMEOUT_MS = 12 * 60000;  /* مهلة الفيديو المجرّبة */
const MEDIA_HOST = /googleusercontent\.com|storage\.googleapis\.com|lh3\.google\.com/;

/* خيار بالاسم — أسماء الخيارات تقرأ "<الاسم>" أو "<الاسم> Image|Video" فنطابق البادئة */
const rx = (t) => new RegExp("^" + String(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

async function pause(pg, ms) { await new Promise((r) => setTimeout(r, ms)); }

/* طمس الطبقات المفتوحة: Escape + زر إغلاق لوحة الحساب */
async function dismissOverlays(pg) {
  await pg.keyboard.press("Escape").catch(() => {});
  const cp = pg.getByRole("button", { name: "Close account panel" });
  if (await cp.isVisible().catch(() => false)) await cp.click({ timeout: 5000 }).catch(() => {});
  await pg.keyboard.press("Escape").catch(() => {});
  await pause(pg, 400);
}

/* هوية كل بلاطة: data-media-id أو عنوانها (الفيديو لا يحمل معرفاً فتُتعقب بعنوانه) */
const TILE_ID_JS = `(el) => { const m = el.querySelector("img[data-media-id], video[data-media-id], img[src], video[src]"); return m ? (m.getAttribute("data-media-id") || ("title:" + el.getAttribute("aria-label"))) : ("title:" + el.getAttribute("aria-label")); }`;
async function mediaIds(pg) {
  return pg.evaluate((js) => [...document.querySelectorAll("flow-grid-tile-container")].map((t) => eval(js)(t)).filter(Boolean), TILE_ID_JS).catch(() => []);
}

/* الإقلاع داخل مشروع فعلي — إن لسنا: الصفحة الرئيسة → زر New project → انتظار /project/<uuid> */
async function ensureProject(pg) {
  await dismissOverlays(pg);
  if (!/\/project\//.test(pg.url())) {
    await pg.goto("https://flow.google.com/", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
    const btn = pg.getByRole("button", { name: /new project/i }).first();
    await btn.waitFor({ state: "visible", timeout: 30000 }).catch(() => { throw new Error("صفحة Flow الرئيسة بلا زر مشروع جديد — الجلسة غير مسجلة"); });
    await btn.click();
    await pg.waitForURL(/\/project\/[0-9a-f-]{36}/, { timeout: 30000 }).catch(() => { throw new Error("ضُغط مشروع جديد ولم يُفتح مشروع خلال 30ث"); });
  }
  await pause(pg, 1500);
  await dismissOverlays(pg);
}

/* لوحة الإعدادات: زر Settings trigger مع إعادة المحاولة حتى يظهر راديو Image */
async function openSettings(pg) {
  const probe = pg.getByRole("radio", { name: "Image", exact: true });
  for (let a = 0; a < 3; a++) {
    if (await probe.isVisible().catch(() => false)) return;
    await pg.getByRole("button", { name: "Settings trigger" }).click({ timeout: 5000 }).catch(() => {});
    await probe.waitFor({ state: "visible", timeout: 3000 }).catch(() => {});
  }
  if (!(await probe.isVisible().catch(() => false))) throw new Error("لم تُفتح لوحة إعدادات Flow — تعذر ضبط النموذج");
}
async function pickRadio(pg, name) {
  const radio = pg.getByRole("radio", { name, exact: typeof name === "string" }).first();
  if (!(await radio.isVisible().catch(() => false))) await openSettings(pg).catch(() => {});
  if (!(await radio.isVisible().catch(() => false))) throw new Error("خيار Flow غير متاح: " + (typeof name === "string" ? name : String(name)));
  if (!(await radio.isChecked())) { await radio.click(); await pause(pg, 500); }
}
/* النموذج الأحدث للصور: أعلى رقم Nano Banana غير Lite — يُقرأ من قائمة Flow نفسها فلا يتقادم الكود */
function newestNanoBanana(names) {
  const v = (n) => /nano banana\s+(\d+(?:\.\d+)*)/i.exec(n)?.[1]?.split(".").map(Number);
  let best = -1;
  names.forEach((n, i) => { const x = v(n); if (!x || /\blite\b/i.test(n)) return; const b = best < 0 ? undefined : v(names[best]); if (!b || x > b || (x.length > b.length && x.slice(0, b.length).every((q, k) => q === b[k]))) best = i; });
  return best;
}
async function pickLatestImageModel(pg) {
  const btn = pg.getByRole("button", { name: "Select model family" });
  if (!(await btn.isVisible().catch(() => false))) return;
  await btn.click();
  const items = pg.getByRole("menuitem");
  const names = await items.allInnerTexts().catch(() => []);
  const idx = newestNanoBanana(names);
  if (idx >= 0) await items.nth(idx).click();
  else await pg.keyboard.press("Escape");
  await pause(pg, 500);
}
async function closeSettings(pg) { await pg.keyboard.press("Escape").catch(() => {}); await pause(pg, 500); }

/* رفع صورة مرجعية: Add media menu → filechooser → Upload → setFiles → انتظار معالجة بلاطتها (fm-...) */
async function uploadRef(pg, job, filePath, label) {
  const name = "fm-" + job.id + "-" + label + path.extname(filePath).toLowerCase();
  const staged = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "vbs-")), name);
  fs.copyFileSync(filePath, staged);
  await pg.getByRole("button", { name: "Add media menu" }).click();
  const chooserP = pg.waitForEvent("filechooser", { timeout: 10000 });
  await pg.getByRole("menuitem", { name: "Upload", exact: true }).click();
  const chooser = await chooserP;
  await chooser.setFiles(staged);
  const tile = pg.locator('flow-grid-tile-container[aria-label="' + name.replace(/"/g, '\\"') + '"]:has([data-media-id])');
  await tile.first().waitFor({ state: "attached", timeout: 90000 }).catch(() => { throw new Error("لم ينه Flow معالجة الصورة المرفوعة خلال 90ث"); });
  await pause(pg, 1000);
  return name;
}
/* إرفاق أصل على فتاحة (Start للإطارات أو Add ingredients) — ثلاث محاولات مع Escape بينها كما هو مجرّب */
async function attachAsset(pg, opener, assetName) {
  const list = pg.getByRole("listbox", { name: "Asset list" });
  const all = pg.getByRole("tab", { name: "All", exact: true });
  let opened = false;
  for (let a = 0; a < 3 && !opened; a++) {
    if (a) { await pg.keyboard.press("Escape"); await pause(pg, 800); }
    await opener.click();
    opened = await Promise.race([list.waitFor({ state: "visible", timeout: 5000 }).then(() => true, () => false), all.waitFor({ state: "visible", timeout: 5000 }).then(() => true, () => false)]);
  }
  if (!opened) throw new Error("لم يفتق منتقي وسائط Flow بعد ثلاث محاولات — لم يُولَّد شيء");
  if ((await all.isVisible().catch(() => false)) && (await all.getAttribute("aria-selected").catch(() => "")) !== "true") { await all.click(); await pause(pg, 1000); }
  await list.waitFor({ state: "visible", timeout: 10000 });
  let option = list.getByRole("option", { name: rx(assetName) }).first();
  if (!(await option.isVisible().catch(() => false))) {
    for (const tab of ["Uploads", "Characters", "Avatars", "Voices"]) {
      const t = pg.getByRole("tab", { name: tab, exact: true });
      if (!(await t.isVisible().catch(() => false))) continue;
      await t.click(); await pause(pg, 1200);
      option = list.getByRole("option", { name: rx(assetName) }).first();
      if (await option.isVisible().catch(() => false)) break;
    }
  }
  await option.waitFor({ state: "visible", timeout: 10000 });
  await option.click();
  const add = pg.getByRole("button", { name: "Add to prompt", exact: true });
  if (await add.waitFor({ state: "visible", timeout: 1500 }).then(() => true, () => false)) await add.click().catch(() => {});
  await list.waitFor({ state: "hidden", timeout: 10000 });
  await pause(pg, 500);
}

/* البرومبت: صندوق ProseMirror — سطر واحد (Enter يرسل في Flow فلا أسطر متعددة) */
async function typePrompt(pg, text) {
  const box = pg.locator(".ProseMirror");
  await box.click();
  await pg.keyboard.press("ControlOrMeta+a");
  await pg.keyboard.press("Delete");
  await pg.keyboard.type(String(text).replace(/\s*\n+\s*/g, " ").trim(), { delay: 8 });
  await pause(pg, 500);
}

/* انتظار نتيجة جديدة حقيقية: بلاطات غير مرفوعاتنا وغير مشغولة (NN% أو فيديو بلا مصغّرة) — مهل الصورة 3د والفيديو 12د */
async function waitForFresh(pg, before, kind, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let seen = "";
  while (Date.now() < deadline) {
    await pause(pg, 2000);
    const tiles = await pg.evaluate((js) => [...document.querySelectorAll("flow-grid-tile-container")].map((t) => ({
      id: (eval(js))(t),
      kind: t.querySelector("flow-video-tile") ? "video" : t.querySelector("flow-image-tile") ? "image" : "other",
      label: t.getAttribute("aria-label") ?? "",
      busy: /\d+%/.test(t.innerText) || (!!t.querySelector("flow-video-tile") && !t.querySelector('img[alt="Generated video thumbnail"], video')),
    })), TILE_ID_JS).catch(() => []);
    const fresh = tiles.filter((t) => t.id && !before.includes(t.id) && !t.label.startsWith("fm-") && !t.busy && (!kind || t.kind === kind)).map((t) => t.id);
    if (fresh.length >= 1) {
      if (!fresh[0].startsWith("title:") || fresh.join("|") === seen) return fresh;
      seen = fresh.join("|");
      continue;
    }
    const prog = await pg.evaluate(() => [...document.querySelectorAll("flow-grid-tile-container")].slice(0, 8).map((t) => (t.innerText.match(/\d+%/)?.[0])).filter(Boolean)).catch(() => []);
    if (!prog.length && await pg.evaluate(() => !!document.querySelector("flow-error-tile")).catch(() => false)) throw new Error("Flow أفشل التوليد (بلاطة خطأ) — لم تُخصم النتيجة");
  }
  throw new Error("انتهت مهلة انتظار نتيجة Flow");
}

/* رابط النتيجة الحي من بلاطها: src العنصر نفسه — ومعه احتياط شمّ روابط الشبكة */
async function grabMediaUrl(pg, id, sniffed, kind) {
  const probe = id.startsWith("title:")
    ? pg.locator('flow-grid-tile-container[aria-label="' + id.slice(6).replace(/"/g, '\\"') + '"]').first()
    : pg.locator('flow-grid-tile-container:has([data-media-id="' + id + '"])').first();
  const sel = kind === "video" ? "video[src]" : "img[src]";
  const src = await probe.evaluate((t, s) => { const m = t.querySelector(s) || t.querySelector("video[src], img[src]"); return m ? (m.src || m.getAttribute("src")) : null; }, sel).catch(() => null);
  if (src && MEDIA_HOST.test(src)) return src;
  const alive = [...sniffed].find((u) => MEDIA_HOST.test(u));
  if (alive) return alive;
  throw new Error("أُنجزت النتيجة وتعذر استخراج رابطها الحي من Flow");
}

/* ─── سائق mock: توليد فوري برابط عينة — للبوابات والتجارب (لا متصفح) ─── */
async function mockRun(job) {
  await new Promise((r) => setTimeout(r, 1800));
  return "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
}

/* ─── سائق flow: مهمة توليد كاملة على حساب الزبون (نفس الصورة المرجعية: edit/ref → Ingredients، i2v → Frames) ─── */
async function flowRun(job) {
  const sp = job.spec || {};
  const mode = sp.mode || "t2v";
  const isVideo = mode !== "t2i" && mode !== "edit";
  const browser = await launchBrowser(process.env.HEADLESS === "1");
  const sniffed = new Set();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1180, height: 780 }, locale: "en", storageState: job.session && job.session.cookies ? { cookies: job.session.cookies, origins: job.session.origins || [] } : undefined });
    await ctx.addInitScript("try{Object.defineProperty(navigator,'webdriver',{get:()=>undefined})}catch{}");
    const pg = await ctx.newPage();
    pg.on("response", async (res) => { try { const ct = res.headers()["content-type"] || ""; if (ct.includes("json") || ct.includes("text") || ct.includes("octet")) { const t = await res.text(); const m = t.match(/https:\/\/[\w.-]*(?:googleusercontent|googleapis)\.com[^\s"'\\]+/g); if (m) m.forEach((u) => sniffed.add(u.replace(/\\u0026/g, "&"))); } } catch {} });
    await ensureProject(pg);
    /* وضع الوكيل مغلق — القيادة الكلاسيكية بالأزرار المجرّبة حصراً */
    const agent = pg.getByRole("button", { name: "Agent", exact: true });
    if ((await agent.getAttribute("aria-pressed").catch(() => "")) === "true") await agent.click().catch(() => {});
    const clear = pg.getByRole("button", { name: "Clear prompt" });
    if (await clear.isVisible().catch(() => false)) await clear.click().catch(() => {});

    /* الإعدادات: نوع → Frames|Ingredients (ولا يجتمعان في Flow) → الأبعاد → المدة → x1 */
    await openSettings(pg);
    await pickRadio(pg, isVideo ? "Video" : "Image");
    if (isVideo) await pickRadio(pg, mode === "i2v" ? "Frames" : "Ingredients");
    await pickLatestImageModel(pg);
    if (isVideo) {
      if (sp.asp) await pickRadio(pg, String(sp.asp));
      if (sp.dur) await pickRadio(pg, sp.dur + "s");
      await pickRadio(pg, "x1").catch(() => {});
    }
    await closeSettings(pg);

    /* الصورة المرجعية: t2i بلا — edit كـIngredients — i2v كإطار بداية (Start) */
    if (sp.image_url && (mode === "edit" || mode === "i2v")) {
      const tmpImg = path.join(os.tmpdir(), "vbs-ref-" + job.id + ".img");
      const r = await fetch(sp.image_url);
      if (!r.ok) throw new Error("تعذر جلب الصورة المرجعية (" + r.status + ")");
      fs.writeFileSync(tmpImg, Buffer.from(await r.arrayBuffer()));
      if (mode === "edit") {
        const nm = await uploadRef(pg, job, tmpImg, "ref1");
        await attachAsset(pg, pg.getByRole("button", { name: "Add ingredients to the prompt box" }), nm);
        const attached = await pg.getByRole("button", { name: "Ingredient" }).count().catch(() => 0);
        if (attached < 1) throw new Error("لم تُرفق الصورة المرجعية في Flow — لم يُولَّد شيء");
      } else {
        const nm = await uploadRef(pg, job, tmpImg, "start");
        await attachAsset(pg, pg.getByRole("button", { name: "Start", exact: true }), nm);
      }
      try { fs.unlinkSync(tmpImg); } catch {}
    }

    await typePrompt(pg, sp.prompt || "");
    const start = pg.getByRole("button", { name: "Start generation" });
    if (!(await start.isEnabled().catch(() => false))) throw new Error("زر بدء التوليد معطل — البرومبت أو المدخلات لم تقبل");
    const before = await mediaIds(pg);
    await start.click();
    const fresh = await waitForFresh(pg, before, isVideo ? "video" : "image", isVideo ? VIDEO_TIMEOUT_MS : IMAGE_TIMEOUT_MS);
    return await grabMediaUrl(pg, fresh[0], sniffed, isVideo ? "video" : "image");
  } finally { await browser.close().catch(() => {}); }
}

let busy = false;
async function pump() {
  if (busy) return;
  busy = true;
  try {
    const r = await fetch(NEXUS + "/api/studio/relay/next", { method: "POST", headers: { "x-relay-token": TOKEN } });
    const d = await r.json().catch(() => null);
    if (d?.job) {
      console.log("[relay] job", d.job.id, d.job.spec.mode);
      let url = null, err = null;
      try { url = DRIVER === "flow" ? await flowRun(d) : await mockRun(d); }
      catch (e) { err = String(e && e.message || e); }
      await fetch(NEXUS + "/api/studio/relay/result", {
        method: "POST", headers: { "content-type": "application/json", "x-relay-token": TOKEN },
        body: JSON.stringify({ id: d.job.id, url, error: err })
      });
      console.log("[relay] job done", d.job.id, url || err);
    }
  } catch (e) { /* المنصة غير متاحة مؤقتاً — يعيد المحاولة */ }
  finally { busy = false; }
}
/* استطلاع الطابور: 30ث في الإنتاج (صفر أثر على كوتة KV) — وRELAY_POLL_MS يُقصَّر للبوابات محلياً */
const POLL_MS = Math.max(2000, Number(process.env.RELAY_POLL_MS || 30000));
setInterval(pump, POLL_MS);
pump();

const srv = http.createServer(async (req, res) => {
  const u = new URL(req.url || "/", "http://x");
  if (u.pathname.startsWith("/login/") && req.method === "GET") {
    const tok = u.pathname.slice(7).replace(/\/+$/, "");
    const phone = PHONE_UA.test(String(req.headers["user-agent"] || ""));
    const embed = u.searchParams.get("embed") === "1";
    try {
      if (DRIVER === "flow") startLiveLogin(tok, phone);
      else startMockLogin(tok, phone);
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      res.end(loginPage(tok, phone, embed));
    } catch (e) {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(page("خطأ", "<h1>تعذّر إتمام الربط</h1><p>" + String(e && e.message || e) + "</p>"));
    }
    return;
  }
  if (u.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, driver: DRIVER, ws: true, live: DRIVER === "flow" }));
    return;
  }
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("Not Found");
});
srv.on("upgrade", (req, sock) => {
  try {
    const u = new URL(req.url || "/", "http://x");
    const key = req.headers["sec-websocket-key"];
    if (!key || !u.pathname.startsWith("/ws/")) { sock.write("HTTP/1.1 400 Bad Request\r\n\r\n"); sock.destroy(); return; }
    sock.write("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + wsAccept(key) + "\r\n\r\n");
    const conn = new WSConn(sock);
    handleWs(u.pathname.slice(4), conn);
  } catch (e) { try { sock.destroy(); } catch {} }
});
srv.listen(PORT, () => console.log(`[relay] ${DRIVER} تفاعلي على :${PORT} → ${NEXUS}`));
