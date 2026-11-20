// ═══ رحلة الاستخدام الحقيقية — على الواجهة الحية بjsdom: زبون يسجّل وينشر بالنقر، مستقل يكتشف ويعرض، غرفة تكتمل ═══
// لا استدعاءات API يدوية — كل شيء عبر حزمة الواجهة المُقدَّمة: nav بالهاش، ملء الحقول، نقر الأزرار، قراءة الشاشة.
import { JSDOM, VirtualConsole } from "jsdom";
import { webcrypto } from "node:crypto";
import { execSync, spawn } from "node:child_process";
import { readdirSync, readFileSync as rfs } from "node:fs";

const PORT = 8794;
const BASE = `http://127.0.0.1:${PORT}`;
const CWD = new URL("..", import.meta.url).pathname;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { if (cond) { pass++; console.log("✓ " + name); } else { fail++; console.log("✗ " + name + (extra ? " — " + extra : "")); } };

// تحصين الزومبي ذاتي الشفاء: إن كان المنفذ محتجزاً من جولة سابقة نقتل الحامل (workerd ينجو من قتل الأب دائماً)
{
  const killed = [];
  for (const pid of readdirSync("/proc")) {
    if (!/^\d+$/.test(pid)) continue;
    try {
      const cmd = rfs(`/proc/${pid}/cmdline`, "utf8").replace(/\0/g, " ");
      if (cmd.includes(String(PORT)) && (cmd.includes("wrangler") || cmd.includes("workerd"))) {
        process.kill(Number(pid), "SIGKILL");
        killed.push(pid);
      }
    } catch {}
  }
  if (killed.length) { console.log(`(شفاء ذاتي: قتلت ${killed.length} عملية زومبي على ${PORT})`); await sleep(1200); }
}
if (await fetch(`${BASE}/api/health`).then((r) => r.ok).catch(() => false)) {
  console.error(`✗ منفذ ${PORT} ما زال مشغولاً بعد الشفاء — تدخل يدوي مطلوب`);
  process.exit(2);
}

// إقامة قاعدة نظيفة (كما يفعل CI) + بناء الواجهة (الحزمة المصغّرة هي التي تُختبر)
try { execSync(`npm run build`, { cwd: CWD, stdio: "pipe" }); } catch (e) { console.error("✗ فشل البناء:", String(e).slice(0, 120)); process.exit(2); }
// تصفير عدادات الحد (جولات متكررة تستنزف reg:15 يومياً على نفس IP المحلي)
try {
  const keys = execSync(`npx wrangler kv key list --binding CACHE_KV --local`, { cwd: CWD, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  for (const m of keys.matchAll(/"name"\s*:\s*"(rl:[^"]+)"/g)) {
    execSync(`npx wrangler kv key delete --binding CACHE_KV --local "${m[1]}"`, { cwd: CWD, stdio: "pipe" });
  }
  console.log("(عدادات rl مصفّرة)");
} catch { console.log("(لا عدادات للتصفير)"); }
for (const cmd of [
  `npx wrangler d1 execute naksab-db --local -y --file schema.sql`,
  `npx wrangler d1 execute naksab-db --local -y --file seed.sql`,
  `npx wrangler d1 execute naksab-db --local -y --command "ALTER TABLE users ADD COLUMN plan_id TEXT NOT NULL DEFAULT 'free'"`,
  `npx wrangler d1 execute naksab-db --local -y --command "ALTER TABLE users ADD COLUMN site_template TEXT NOT NULL DEFAULT 'aurora'"`,
  `npx wrangler d1 execute naksab-db --local -y --command "DELETE FROM admin_meta; DELETE FROM admin_devices; DELETE FROM users WHERE role='admin'"`,
]) { try { execSync(cmd, { cwd: CWD, stdio: "pipe" }); } catch { /* ALTER متسامح */ } }

// خادم الرحلة الذاتي
const srv = spawn("npx", ["wrangler", "dev", "--port", String(PORT), "--local", "--ip", "0.0.0.0", "--var", "ADMIN_SETUP_TOKEN:nk-drill-token"], { cwd: CWD, stdio: "pipe" });
let up = false;
for (let i = 0; i < 120 && !up; i++) { await sleep(500); up = await fetch(`${BASE}/api/health`).then((r) => r.ok).catch(() => false); }
if (!up) { console.error("✗ خادم الرحلة لم يقلع"); srv.kill("SIGKILL"); process.exit(2); }

const STAMP = Date.now().toString(36);
const waitUntil = async (fn, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await fn()) return true; } catch {} await sleep(250); } return false; }; /* await: تدعم الشروط async */
const errors = [];
function bridge(w, jar, label) {
  w.fetch = async (p, o) => {
    const url = String(p);
    const abs = url.startsWith("/") ? BASE + url : url;
    const h = new Headers(o?.headers || {});
    if (jar.cookie) h.set("cookie", jar.cookie);
    const res = await fetch(abs, { ...o, headers: h });
    const sc = res.headers.getSetCookie?.() ?? [];
    for (const c of sc) {
      const pair = c.split(";")[0];
      const name = pair.split("=")[0];
      const rest = jar.cookie.split("; ").filter((x) => x && !x.startsWith(name + "="));
      rest.push(pair);
      jar.cookie = rest.join("; ");
    }
    return res;
  };
  Object.defineProperty(w, "crypto", { value: webcrypto });
  if (!w.matchMedia) w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  if (!w.IntersectionObserver) w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  if (!w.MutationObserver) w.MutationObserver = class { observe() {} disconnect() {} };
  w.scrollTo = () => {};
  w.HTMLElement.prototype.animate ??= function () { return { finished: Promise.resolve() }; };
  w.addEventListener("error", (e) => errors.push(`${label}: ${String(e.error?.message || e.message).slice(0, 140)}`));
  w.addEventListener("unhandledrejection", (e) => errors.push(`${label} رفض: ${String(e.reason).slice(0, 140)}`));
}

async function mkSession(label) {
  const html = await (await fetch(BASE + "/")).text();
  const vc = new VirtualConsole();
  vc.on("error", (...a) => errors.push(`${label} console.error: ${a.map((x) => String(x?.message || x).slice(0, 120)).join(" ")}`));
  const dom = new JSDOM(html, { url: BASE + "/", pretendToBeVisual: true, runScripts: "outside-only", virtualConsole: vc });
  const w = dom.window, d = w.document;
  const jar = { cookie: "" };
  bridge(w, jar, label);
  const appjs = await (await fetch(BASE + "/app.js")).text();
  w.eval(appjs);
  await sleep(1100);
  return { w, d, jar, label };
}
const nav = async (s, hash) => {
  if (s.w.location.hash === hash) { s.w.location.hash = "#/__tmp"; await sleep(220); } /* نفس الهاش لا يُطلق hashchange — نخرج ثم نعود لنجبر الرسم */
  s.w.location.hash = hash;
  await sleep(800);
};
const click = async (s, sel) => { const el = s.d.querySelector(sel); if (!el) throw new Error(`${s.label}: مفقود ${sel}`); el.click(); await sleep(800); return el; };
const clickUntil = async (s, sel, fn, ms = 8000) => { const el = s.d.querySelector(sel); if (!el) throw new Error(`${s.label}: مفقود ${sel}`); el.click(); const got = await waitUntil(fn, ms); return got; };
const setV = (s, sel, v) => { const el = s.d.querySelector(sel); if (!el) throw new Error(`${s.label}: مفقود ${sel}`); el.value = v; };

try {
  // ═══════════ الرحلة 1 — الزبون: تسجيل ثم نشر مشروع بالنقر ═══════════
  const C = await mkSession("زبون");
  await nav(C, "#/request/new");
  ok("زبون بلا جلسة ينقر نشر مشروع → نموذج التسجيل يفتح تلقائياً", !!C.d.getElementById("a-go"));
  const clientEmail = `client-${STAMP}@nk.test`;
  setV(C, "#a-email", clientEmail);
  setV(C, "#a-pass", "ClientJourney1");
  setV(C, "#a-name", "Vito Client");
  setV(C, "#a-user", `vito-client-${STAMP}`);
  setV(C, "#a-role", "client");
  const regC = await clickUntil(C, "#a-go", () => C.d.getElementById("modal").hidden === true);
  ok("التسجيل عبر الواجهة: الجلسة حية ونموذج النشر أمام الزبون", regC && !!C.d.getElementById("r-title"));
  setV(C, "#r-title", "متجر إلكتروني للحرف اليدوية");
  setV(C, "#r-desc", "أريد متجراً إلكترونياً لبيع الحرف اليدوية الجزائرية مع الدفع عند الاستلام وتوصيل لكل الولايات.");
  setV(C, "#r-cat", "design");
  setV(C, "#r-skills", "متجر, تصميم");
  await click(C, "#r-go");
  ok("النشر بالنقر نجح: التحويل لصفحة الطلب", /#\/request\/rq/.test(C.w.location.hash), C.w.location.hash);
  const RID = C.w.location.hash.split("/").pop();
  ok("صفحة الطلب تعرض عنوان مشروع الزبون", C.d.body.textContent.includes("متجر إلكتروني للحرف اليدوية"));
  ok("الزبون المالك يرى زر إغلاق الطلب", !!C.d.getElementById("rq-close"));

  // ═══════════ الرحلة 2 — المستقل: تسجيل ثم اكتشاف ثم عرض ═══════════
  const F = await mkSession("مستقل");
  await nav(F, "#/dashboard");
  ok("مستقل زائر يفتح اللوحة → نموذج التسجيل يفتح تلقائياً", !!F.d.getElementById("a-go"));
  const freEmail = `fre-${STAMP}@nk.test`;
  setV(F, "#a-email", freEmail);
  setV(F, "#a-pass", "FreelancerJ1");
  setV(F, "#a-name", "Amine Studio");
  setV(F, "#a-user", `journey-fre-${STAMP}`);
  setV(F, "#a-role", "freelancer");
  const regF = await clickUntil(F, "#a-go", () => F.d.getElementById("modal").hidden === true);
  ok("تسجيل المستقل عبر الواجهة نجح: لوحته تُعرض", regF && !!F.d.querySelector('[data-t="open"]'));
  await click(F, '[data-t="open"]');
  ok("المستقل يكتشف طلب الزبون من تبويب الطلبات المفتوحة", F.d.body.textContent.includes("متجر إلكتروني للحرف اليدوية"));
  const linkToF = F.d.querySelector(`a[href*="${RID}"]`);
  ok("رابط الطلب موجود في قائمة المستقل", !!linkToF);
  await click(F, `a[href*="${RID}"]`);
  ok("صفحة الطلب عند المستقل: زر إرسال عرض ظاهر", !!F.d.getElementById("pp-new"));
  await click(F, "#pp-new");
  ok("نافذة العرض كاملة الحقول (المبلغ والمدد والرسالة)", !!F.d.getElementById("pp-amt") && !!F.d.getElementById("pp-days") && !!F.d.getElementById("pp-cover"));
  setV(F, "#pp-amt", "15000");
  setV(F, "#pp-days", "5");
  setV(F, "#pp-cover", "سأبني المتجر كاملاً مع لوحة تحكم وتصميم عصري ودفع عند الاستلام خلال 5 أيام عمل.");
  const sentP = await clickUntil(F, "#pp-go", () => F.d.getElementById("modal").hidden === true);
  ok("العرض أُرسل بالنقر: حالته pending ظاهرة للمستقل", sentP && F.d.body.textContent.includes("pending"));

  // ═══════════ الرحلة 3 — الزبون يقبل فتُفتح الغرفة ويراسل ═══════════
  await nav(C, "#/request/" + RID);
  ok("الزبون يرى عرض المستقل في صفحة طلبه", C.d.body.textContent.includes("Amine Studio") && !!C.d.querySelector("[data-accept]"));
  const accC = await clickUntil(C, "[data-accept]", () => C.w.location.hash.startsWith("#/project/pj"));
  ok("القبول بالنقر فتح غرفة المشروع", accC, C.w.location.hash);
  const PID = C.w.location.hash.split("/").pop();
  const roomC = await waitUntil(() => !!C.d.getElementById("msg-in"), 8000);
  ok("الغرفة تعرض عنوان المشروع وصندوق الرسائل جاهزاً", roomC && C.d.body.textContent.includes("متجر إلكتروني للحرف اليدوية"));
  setV(C, "#msg-in", "مرحباً، متى يمكن أن تبدأ؟");
  await clickUntil(C, "#msg-go", () => C.d.body.textContent.includes("متى يمكن أن تبدأ"));
  ok("رسالة الزبون ظاهرة في الغرفة", C.d.body.textContent.includes("متى يمكن أن تبدأ"));

  // ═══════════ الرحلة 4 — المستقل يرد ويؤدي ثم يؤكد، والزبون يختم ═══════════
  await nav(F, "#/project/" + PID);
  const roomF = await waitUntil(() => !!F.d.getElementById("msg-in"), 8000);
  ok("المستقل في الغرفة يرى رسالة الزبون", roomF && F.d.body.textContent.includes("متى يمكن أن تبدأ"));
  setV(F, "#msg-in", "أبدأ غداً ويسلم أول نسخة خلال يومين.");
  await clickUntil(F, "#msg-go", () => F.d.body.textContent.includes("أبدأ غداً"));
  ok("رد المستقل ظاهر في الغرفة", F.d.body.textContent.includes("أبدأ غداً"));
  await clickUntil(F, "#pj-confirm", () => { return true; }, 400);
  let ps = null;
  await waitUntil(async () => { ps = await fetch(`${BASE}/api/projects/${PID}`, { headers: { cookie: F.jar.cookie } }).then((r) => r.json()).catch(() => null); return Number(ps?.project?.freelancer_confirmed) === 1; }, 8000);
  ok("تأكيد المستقل سُجل (بالجلسة نفسها)", Number(ps?.project?.freelancer_confirmed) === 1, `fc=${JSON.stringify(ps?.project?.freelancer_confirmed)} cc=${JSON.stringify(ps?.data?.project?.client_confirmed)} st=${JSON.stringify(ps?.data?.project?.status)}`);
  await nav(C, "#/project/" + PID);
  const confReady = await waitUntil(() => !!C.d.getElementById("pj-confirm"), 8000);
  ok("الزبون يرى تأكيد المستقل وزر تأكيده جاهزاً", confReady);
  await clickUntil(C, "#pj-confirm", () => { return true; }, 400);
  let ps2 = null;
  await waitUntil(async () => { ps2 = await fetch(`${BASE}/api/projects/${PID}`, { headers: { cookie: C.jar.cookie } }).then((r) => r.json()).catch(() => null); return ps2?.project?.status === "completed"; }, 8000);
  ok("تأكيد الزبون أكمل المشروع (الحالة completed)", ps2?.project?.status === "completed", `st=${JSON.stringify(ps2?.project?.status)} fc=${JSON.stringify(ps2?.project?.freelancer_confirmed)} cc=${JSON.stringify(ps2?.project?.client_confirmed)}`);
  const doneShown = await waitUntil(() => C.d.body.textContent.includes("اكتمل") || C.d.body.textContent.toLowerCase().includes("completed"), 6000);
  ok("الغرفة تعرض شارة الاكتمال", doneShown);

  // ═══ استوديو VITO BYTE — أربعة أوضاع وصفر إضافات والشريط ═══
  await nav(C, "#/studio");
  await sleep(700);
  ok("صفحة الاستوديو الرسمية بأربعة أوضاع وخطواتها", C.d.querySelectorAll(".st-tab").length === 4 && C.d.querySelectorAll(".st-steps .stp").length === 3, "tabs=" + C.d.querySelectorAll(".st-tab").length);
  ok("صفر ذكر للإضافات في الاستوديو", !C.d.body.textContent.includes("chrome://extensions") && !C.d.body.textContent.includes("وضع المطوّر"));
  const t2vP = (C.w.VBS || {}).compose ? C.w.VBS.compose("t2v", { name: "هوية بصرية", price: 15000, idea: "", style: "lux", dur: 8, asp: "16:9" }) : "";
  ok("المركّب يصوغ برومبت Veo 3.1 بالهوية", t2vP.includes("Veo 3.1") && t2vP.includes("VITO BYTE STUDIO"), t2vP.slice(0, 60));
  const capV = (C.w.VBS || {}).capture ? C.w.VBS.capture("https://storage.googleapis.com/x/y.mp4") : null;
  ok("التقاط النتيجة يبني المعرض محلياً", capV && capV.kind === "video" && !!C.d.querySelector("#vbs-gal .st-gi video"), "gal=" + ((C.w.VBS.gal || []).length));
  await nav(C, "#/");
  await sleep(600);
  ok("شريط الاستوديو على الواجهة الرسمية بجانب هيرو السوق", !!C.d.querySelector(".st-band") && (C.d.body.textContent.includes("استوديو الصور والفيديو") || C.d.body.textContent.includes("AI image & video studio")));

  // ═══════════ الحكم الأخير: صفر أخطاء في كل الجلسات ═══════════
  // ═══════════ الحكم الأخير: صفر أخطاء في كل الجلسات ═══════════
  ok("صفر أخطاء واجهة عبر كل الرحلة (لا استثناء ولا رفض غير معالج)", errors.length === 0, errors.slice(0, 3).join(" | "));
} catch (e) {
  fail++;
  console.error("✗ انقطاع الرحلة:", e.message);
}

console.log(`═══ JOURNEY: ${pass}/${pass + fail} ═══`);
srv.kill("SIGTERM");
await sleep(800);
try { srv.kill("SIGKILL"); } catch {}
process.exit(fail ? 1 : 0);
