#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   VITO BYTE FLOW RELAY — عقدة الأتمتة (الجلسة السحابية المعزولة)
   ─────────────────────────────────────────────────────────────────
   دورانها حصراً:
   1) /login/:token — نافذة الربط: تسجيل دخول جوجل الرسمي داخل متصفح
      العقدة (دخول أو إنشاء حساب) → الجلسة تعود للمنصة مشفرة هناك.
   2) سحب مهام التوليد من طابور المنصة وتنفيذها بجلسة الزبون على حسابه
      في Google Flow → رابط النتيجة يعود للمشغل — صفر تخزين هنا.

   السائقان:
   - mock (افتراضي): للبوابات والتجارب — ربط فوري وتوليد فوري برابط عينة.
   - flow (إنتاج): Playwright Chromium — تسجيل الدخول الحقيقي وتشغيل Flow.
     يتطلب: npm i playwright && npx playwright install chromium (على جهاز العقدة).

   متغيرات: PORT(8801) NEXUS_ORIGIN VBS_RELAY_TOKEN DRIVER(mock|flow)
   ═══════════════════════════════════════════════════════════════════ */
"use strict";
import http from "node:http";

const PORT = Number(process.env.PORT || 8801);
const NEXUS = String(process.env.NEXUS_ORIGIN || "").replace(/\/+$/, "");
const TOKEN = String(process.env.VBS_RELAY_TOKEN || "");
const DRIVER = String(process.env.DRIVER || "mock");
if (!NEXUS || !TOKEN) { console.error("[relay] NEXUS_ORIGIN و VBS_RELAY_TOKEN إلزاميان"); process.exit(1); }

const page = (title, body, autoClose = false) => `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{background:#05060a;color:#eef0f6;font-family:system-ui,'IBM Plex Sans Arabic',sans-serif;display:grid;place-items:center;min-height:100vh;margin:0}.c{max-width:460px;padding:28px;text-align:center}.m{font-weight:700;letter-spacing:.26em;font-size:12px;color:#cdbaff}h1{font-size:19px}p{color:#939ab1;line-height:1.9;font-size:14px}button,a.btn{margin-top:14px;background:linear-gradient(135deg,#7a5cff,#2ad4f6);color:#05060a;font-weight:700;border:0;border-radius:14px;padding:12px 22px;font-size:15px;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-block}</style></head><body><div class="c"><div class="m">VITO BYTE STUDIO</div>${body}${autoClose ? '<script>setTimeout(()=>{try{window.close()}catch{}},1200)</script>' : ""}</div></body></html>`;

async function postSession(token, session) {
  const r = await fetch(NEXUS + "/api/studio/session", {
    method: "POST",
    headers: { "content-type": "application/json", "x-relay-token": TOKEN },
    body: JSON.stringify({ token, session })
  });
  if (!r.ok) throw new Error("session_post_" + r.status);
}

/* ─── سائق mock: ربط فوري وتوليد فوري — للبوابات ─── */
async function mockLogin(token) {
  await postSession(token, { driver: "mock", cookies: [], ua: "vbs-mock" });
  return page("تم الربط", '<h1>تم الربط بنجاح ✓</h1><p>حسابك في Google Flow أصبح مرتبطاً بمنصتك — يمكنك إغلاق هذه النافذة والعودة إلى الاستوديو.</p>', true);
}
async function mockRun(job) {
  await new Promise((r) => setTimeout(r, 1800));
  return "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
}

/* ─── سائق flow: الإنتاج الحقيقي (يتطلب playwright على جهاز العقدة) ─── */
async function pw() {
  let mod;
  try { mod = await import("playwright"); }
  catch { try { mod = await import("playwright-core"); } catch { return null; } }
  return mod;
}
async function flowLogin(token, go) {
  if (!go) return page("ربط حساب Google Flow", '<h1>ربط حسابك بضغطة واحدة</h1><p>اضغط للمتابعة إلى تسجيل الدخول الرسمي من جوجل — سجّل دخولك أو أنشئ حساباً جديداً. لا نرى ولا نحفظ كلمة السر — الجلسة تُخزَّن مشفرة وتُستخدم لتنفيذ توليدك فقط.</p><a class="btn" href="?go=1">المتابعة إلى جوجل ←</a>');
  const lib = await pw();
  if (!lib) return page("تعذّر التشغيل", '<h1>سائق المتصفح غير مثبت</h1><p>ثبّت Playwright على جهاز العقدة: npm i playwright && npx playwright install chromium</p>');
  const browser = await lib.chromium.launch({ headless: false });
  const ctx = await browser.newContext({ viewport: { width: 480, height: 800 } });
  const pg = await ctx.newPage();
  await pg.goto("https://accounts.google.com/signin/v2/identifier?continue=" + encodeURIComponent("https://labs.google/fx/tools/flow") + "&service=accountsettings&flowName=GlifWebSignIn");
  const t0 = Date.now();
  let okFlag = false;
  while (Date.now() - t0 < 10 * 60000) {
    const u = pg.url();
    if (u.includes("labs.google") && u.includes("/flow")) { okFlag = true; break; }
    if (pg.isClosed()) break;
    await new Promise((r) => setTimeout(r, 1500));
  }
  if (!okFlag) { await browser.close().catch(() => {}); return page("لم يكتمل الدخول", "<h1>انتهت المهلة</h1><p>أعد ربط الحساب من المنصة.</p>"); }
  await new Promise((r) => setTimeout(r, 2500));
  const state = await ctx.storageState();
  await browser.close().catch(() => {});
  await postSession(token, { driver: "flow", cookies: state.cookies, origins: state.origins });
  return page("تم الربط", '<h1>تم الربط بنجاح ✓</h1><p>أغلق هذه النافذة وعد إلى الاستوديو — التوليد سيجري على حسابك تلقائياً.</p>', true);
}
const FLOW_URL = "https://labs.google/fx/tools/flow";
const A = {
  prompt: ['textarea[data-test-id*="prompt"]', "textarea[placeholder]", 'div[contenteditable="true"][role="textbox"]'],
  gen: ['button[data-test-id*="create"]', 'button[data-test-id*="generate"]', 'button[aria-label*="Create"]', 'button[aria-label*="Generate"]'],
  video: /(googleusercontent|storage\.googleapis)\.com\/[^\s"']+/,
};
async function flowRun(job) {
  const lib = await pw();
  if (!lib) throw new Error("playwright_missing");
  const browser = await lib.chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: job.session.cookies ? { cookies: job.session.cookies, origins: job.session.origins || [] } : undefined });
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
  while (Date.now() - t0 < 10 * 60000) { if (found.size) break; await new Promise((r) => setTimeout(r, 2000)); }
  await browser.close().catch(() => {});
  if (!found.size) throw new Error("result_timeout");
  return [...found][0];
}

/* ─── طابور السحب والتنفيذ ─── */
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

http.createServer(async (req, res) => {
  const u = new URL(req.url || "/", "http://x");
  if (req.headers.get && u.pathname.startsWith("/login/")) { /* Node fetch polyfill not needed here */ }
  if (u.pathname.startsWith("/login/") && req.method === "GET") {
    const token = u.pathname.slice(7).replace(/\/+$/, "");
    const go = u.searchParams.get("go") === "1";
    try {
      const html = DRIVER === "flow" ? await flowLogin(token, go) : await mockLogin(token);
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      res.end(html);
    } catch (e) {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(page("خطأ", "<h1>تعذّر إتمام الربط</h1><p>" + String(e && e.message || e) + "</p>"));
    }
    return;
  }
  if (u.pathname === "/health") { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ ok: true, driver: DRIVER })); return; }
  res.writeHead(404, { "content-type": "text/plain" }); res.end("Not Found");
}).listen(PORT, () => console.log(`[relay] ${DRIVER} على :${PORT} → ${NEXUS}`));
