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
   5) سحب مهام التوليد من طابور المنصة وتنفيذها بجلسة الزبون على حسابه
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
const REACHED_FLOW = /labs\.google\/(fx\/|tools\/)?flow|labs\.google\/fx/;

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
        locale: "ar",
        extraHTTPHeaders: { "Accept-Language": "ar,en;q=0.8" },
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
        try { if (REACHED_FLOW.test(entry.page.url())) finishLive(entry, true); } catch {}
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

/* ─── طابور التوليد (سائق flow بنفس المتصفح غير المكشوف) ─── */
const A = {
  prompt: ['textarea[data-test-id*="prompt"]', "textarea[placeholder]", 'div[contenteditable="true"][role="textbox"]'],
  gen: ['button[data-test-id*="create"]', 'button[data-test-id*="generate"]', 'button[aria-label*="Create"]', 'button[aria-label*="Generate"]'],
  video: /(googleusercontent|storage\.googleapis)\.com\/[^\s"']+/,
};
async function mockRun(job) {
  await new Promise((r) => setTimeout(r, 1800));
  return "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
}
async function flowRun(job) {
  const browser = await launchBrowser(process.env.HEADLESS === "1");
  try {
    const ctx = await browser.newContext({ viewport: { width: 1180, height: 780 }, locale: "ar", storageState: job.session && job.session.cookies ? { cookies: job.session.cookies, origins: job.session.origins || [] } : undefined });
    await ctx.addInitScript("try{Object.defineProperty(navigator,'webdriver',{get:()=>undefined})}catch{}");
    const pg = await ctx.newPage();
    const found = new Set();
    pg.on("response", async (res) => {
      try { const ct = res.headers()["content-type"] || ""; if (ct.includes("json") || ct.includes("text")) { const t = await res.text(); const m = t.match(new RegExp(A.video.source, "g")); if (m) m.forEach((u) => found.add(u.replace(/\\u0026/g, "&"))); } } catch {}
    });
    await pg.goto(FLOW_URL, { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 4000));
    const inp = await Promise.all(A.prompt.map((s) => pg.$(s))).then((els) => els.find(Boolean));
    if (!inp) throw new Error("prompt_input_not_found");
    await inp.fill(job.spec.prompt).catch(async () => { await inp.evaluate((el, v) => { el.textContent = v; el.dispatchEvent(new Event("input", { bubbles: true })); }, job.spec.prompt); });
    const btn = await Promise.all(A.gen.map((s) => pg.$(s))).then((els) => els.find(Boolean));
    if (!btn) throw new Error("generate_button_not_found");
    await btn.click();
    const t0 = Date.now();
    while (Date.now() - t0 < LOGIN_MIN * 60000) { if (found.size) break; await new Promise((r) => setTimeout(r, 2000)); }
    if (!found.size) throw new Error("result_timeout");
    return [...found][0];
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
setInterval(pump, 2500);
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
