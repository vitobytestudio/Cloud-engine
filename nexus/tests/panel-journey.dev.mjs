// ═══ رحلة لوحة المالك في نكسوس — على الواجهة الحية بjsdom: إعداد بنقر ← فتح الرابط السري ← اللوحة أو الدخول ═══
import { JSDOM, VirtualConsole } from "jsdom";
import { webcrypto } from "node:crypto";
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import { readdirSync, readFileSync } from "node:fs";

const PORT = 8795;
const BASE = `http://127.0.0.1:${PORT}`;
const CWD = new URL("..", import.meta.url).pathname;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { if (cond) { pass++; console.log("✓ " + name); } else { fail++; console.log("✗ " + name + (extra ? " — " + extra : "")); } };
const waitUntil = async (fn, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await fn()) return true; } catch {} await sleep(250); } return false; };

// شفاء ذاتي من زومبي المنفذ
{
  const killed = [];
  for (const pid of readdirSync("/proc")) {
    if (!/^\d+$/.test(pid)) continue;
    try {
      const cmd = readFileSync(`/proc/${pid}/cmdline`, "utf8").replace(/\0/g, " ");
      if (cmd.includes(String(PORT)) && (cmd.includes("wrangler") || cmd.includes("workerd"))) { process.kill(Number(pid), "SIGKILL"); killed.push(pid); }
    } catch {}
  }
  if (killed.length) console.log(`(شفاء ذاتي: قتلت ${killed.length} زومبي على ${PORT})`);
  await sleep(1200);
}

// بناء + إقامة + تصفير الإدارة وحد المعدل
try { execSync(`npm run build`, { cwd: CWD, stdio: "pipe" }); } catch (e) { console.error("✗ فشل البناء"); process.exit(2); }
for (const cmd of [
  `npx wrangler d1 execute DB --local -y --file schema.sql`,
  `npx wrangler d1 execute DB --local -y --file seed.sql`,
  `npx wrangler d1 execute DB --local -y --command "DELETE FROM admin_meta; DELETE FROM admin_devices; DELETE FROM admins; DELETE FROM pro_services"`,
]) try { execSync(cmd, { cwd: CWD, stdio: "pipe" }); } catch {}
try {
  const keys = execSync(`npx wrangler kv key list --binding CACHE_KV --local`, { cwd: CWD, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  for (const m of keys.matchAll(/"name"\s*:\s*"(rl:[^"]+)"/g)) execSync(`npx wrangler kv key delete --binding CACHE_KV --local "${m[1]}"`, { cwd: CWD, stdio: "pipe" });
} catch {}

const srv = spawn("npx", ["wrangler", "dev", "--port", String(PORT), "--local", "--ip", "0.0.0.0", "--var", "ADMIN_SETUP_TOKEN:win-tok", "--var", `ADMIN_SETUP_WINDOW_END:${Date.now() + 120000}`], { cwd: CWD, stdio: "pipe" });
let up = false;
for (let i = 0; i < 120 && !up; i++) { await sleep(500); up = await fetch(`${BASE}/api/health`).then((r) => r.ok).catch(() => false); }
if (!up) { console.error("✗ الخادم لم يقلع"); srv.kill("SIGKILL"); process.exit(2); }

const errors = [];
function mkSession(label) {
  const jar = { c: "" };
  const vc = new VirtualConsole();
  vc.on("error", (...a) => errors.push(`${label}: ${a.map((x) => String(x?.message || x).slice(0, 120)).join(" ")}`));
  return { label, jar, vc, dom: null, w: null, d: null };
}
async function open(s, path, hash) {
  const html = await (await fetch(BASE + path)).text();
  const dom = new JSDOM(html, { url: BASE + path, pretendToBeVisual: true, runScripts: "outside-only", virtualConsole: s.vc });
  const w = dom.window, d = w.document;
  w.fetch = async (p, o) => {
    const u = String(p); const abs = u.startsWith("/") ? BASE + u : u;
    const h = new Headers(o?.headers || {});
    if (s.jar.c && !h.has("cookie")) h.set("cookie", s.jar.c);
    const res = await fetch(abs, { ...o, headers: h });
    const sc = res.headers.getSetCookie?.() ?? [];
    for (const ck of sc) { const pair = ck.split(";")[0]; const rest = s.jar.c.split("; ").filter((x) => x && !x.startsWith(pair.split("=")[0] + "=")); rest.push(pair); s.jar.c = rest.join("; "); }
    return res;
  };
  Object.defineProperty(w, "crypto", { value: webcrypto });
  w.matchMedia ??= () => ({ matches: false, addListener() {}, removeListener() {} });
  w.scrollTo = () => {};
  w.HTMLElement.prototype.animate ??= function () { return { finished: Promise.resolve() }; };
  w.addEventListener("unhandledrejection", (e) => errors.push(`${s.label} رفض: ${String(e.reason).slice(0, 120)}`));
  if (path === "/setup") {
    const m = /<script>([\s\S]*?)<\/script>/.exec(html); /* صفحة الإعداد المستقلة — سكربتها داخلي، لا app.js بلا #view */
    try { w.eval(m ? m[1] : ""); } catch (e) { errors.push(`${s.label} سكربت الإعداد: ${String(e).slice(0, 120)}`); }
  } else {
    const appjs = await (await fetch(BASE + "/app.js")).text();
    w.eval(appjs);
  }
  if (hash) { w.location.hash = hash; }
  s.dom = dom; s.w = w; s.d = d;
  await sleep(1100);
  return s;
}
const setV = (s, sel, v) => { const el = s.d.querySelector(sel); if (!el) throw new Error(`${s.label}: مفقود ${sel}`); el.value = v; };
const click = async (s, sel) => { const el = s.d.querySelector(sel); if (!el) throw new Error(`${s.label}: مفقود ${sel}`); el.click(); await sleep(700); return el; };
const clickUntil = async (s, sel, fn, ms = 8000) => { const el = s.d.querySelector(sel); if (!el) throw new Error(`${s.label}: مفقود ${sel}`); el.click(); const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await fn()) return true; } catch {} await sleep(250); } return false; }; /* try داخل الحلقة يبتلع رفض الشرط أثناء الرسم */
process.on("unhandledRejection", (r) => console.log("(رفض مبتلع: " + String(r).slice(0, 60) + ")"));

try {
  // ═══ 1) المالك يعمل الإعداد بنقرة من صفحة النافذة ═══
  const O = mkSession("المالك");
  await open(O, "/setup");
  ok("صفحة الإعداد تُخدم بنموذجها", !!O.d.getElementById("go") && !!O.d.getElementById("e"));
  setV(O, "#e", "owner-nexus@vito.test");
  setV(O, "#p", "VitoOwner2026x");
  setV(O, "#n", "VITO Owner");
  await click(O, "#go");
  const aEl = await waitUntil(() => O.d.querySelector("#ok a"), 6000);
  const panelPath = aEl ? O.d.querySelector("#ok a").getAttribute("href") : "";
  ok("الإنشاء بنقرة نجح ورابط اللوحة اشتُق", /^\/panel\/[A-Za-z0-9]{10,}$/.test(panelPath || ""), String(panelPath));
  ok("الصفحة ماتت بعد الإنشاء (ذاتياً)", (await fetch(`${BASE}/setup`)).status === 404);
  // المالك ينقر الرابط من نفس المتصفح (الكوكي موجود)
  await open(O, panelPath);
  ok("الرابط السري يفتح لوحة الإدارة مباشرة (لا الرئيسية)", O.w.location.hash === "#/adm", O.w.location.hash);
  const panelShown = await waitUntil(() => !!O.d.querySelector(".kpis") && O.d.body.textContent.length > 200, 9000);
  ok("لوحة المالك تظهر كاملة: مؤشرات وإعدادات", panelShown && !!O.d.querySelector(".kpis"), O.d.body.textContent.slice(0, 120).replace(/\s+/g, " "));
  const demoListed = await waitUntil(() => O.d.getElementById("ad-list")?.textContent.includes("vito-store"), 8000);
  ok("قائمة التجار تعرض المتجر التجريبي فعلاً", demoListed);
  ok("زر تدوير الرابط السري موجود في اللوحة", !!O.d.getElementById("ad-rotate"));
  ok("قسم الكتالوج/الخدمات موجود (إعدادات المالك)", !!O.d.getElementById("ad-cat") && !!O.d.getElementById("ad-addsvc"));
  ok("سجل التدقيق موجود", !!O.d.getElementById("ad-aud"));

  // ═══ 2) نفس الرابط من متصفح غريب (بلا كوكي المالك) — الرابط هو المفتاح: يدير كاملاً ═══
  const X = mkSession("جهاز جديد");
  await open(X, panelPath);
  ok("الرابط السري من متصفح آخر: اللوحة تُفتح (الرابط هو المفتاح — قرار المالك)", X.w.location.hash === "#/adm");
  const xPanel0 = await waitUntil(() => !!X.d.querySelector(".kpis"), 9000);
  ok("الجهاز الجديد يرى المؤشرات والإعدادات بلا كوكي سابق", xPanel0 && !!X.d.querySelector(".kpis"));
  const xPanel = xPanel0;
  /* علة «كل زر error» — الجهاز الجديد يدير فعلياً بالتوكن السري بلا كوكي مالك سابق */
  const addBtn = await waitUntil(() => !!X.d.getElementById("ad-addsvc"), 8000);
  if (addBtn) {
    await click(X, "#ad-addsvc");
    const sheetUp = await waitUntil(() => !!X.d.getElementById("sv-t"), 6000);
    ok("زر إضافة خدمة يفتح الورقة (بلا كوكي مالك)", sheetUp);
    if (sheetUp) {
      setV(X, "#sv-t", "استشارة تقنية متقدمة");
      setV(X, "#sv-d", "جلسة استشارة معمقة لخدمات المنصة.");
      setV(X, "#sv-mn", "500");
      setV(X, "#sv-mx", "2000");
      const errEl = await waitUntil(() => X.d.getElementById("sv-err"), 400);
      const saved = await clickUntil(X, "#sv-save", () => X.d.body.textContent.includes("استشارة تقنية متقدمة"), 8000);
      ok("إضافة خدمة حقيقية من جهاز جديد تنجح", saved, X.d.getElementById("sv-err")?.textContent || X.d.body.textContent.slice(0, 100).replace(/\s+/g, " "));
    }
    /* بلاغ المالك: التوثيق والباقات كانت ميتة من جهاز جديد — نضغطها فعلاً قبل تدوير الرابط */
    const vf = await waitUntil(() => !!X.d.querySelector('[data-vf]'), 8000);
    if (vf) {
      /* البذرة تجعل التاجر التجريبي موثقاً أصلاً — النقرة تقلب الحالة (توثيق↔إلغاء) والصحيح أن تنعكس */
      const before = X.d.querySelector('[data-vf]')?.dataset.v;
      await click(X, '[data-vf]');
      const flipped = await waitUntil(() => X.d.querySelector('[data-vf]')?.dataset.v === (before === "0" ? "1" : "0"), 8000);
      const after = X.d.querySelector('[data-vf]')?.dataset.v;
      ok("توثيق/إلغاء التوثيق بالنقر يعمل من الجهاز الجديد", flipped, `قبل=${before} بعد=${after}`);
      if (before === "1") { await click(X, '[data-vf]'); await sleep(600); } /* أعد الحالة الجميلة للعرض */
      const pro = await waitUntil(() => !!X.d.querySelector('[data-plan="pro"]'), 4000);
      if (pro) {
        await click(X, '[data-plan="pro"]');
        const granted = await waitUntil(() => !!X.d.querySelector('[data-plan="pro"].on'), 8000);
        ok("تفعيل باقة PRO بالنقر يعمل من الجهاز الجديد", granted);
        await click(X, '[data-plan="vip"]');
        const vip = await waitUntil(() => !!X.d.querySelector('[data-plan="vip"].on'), 8000);
        const onAfter = X.d.querySelector('[data-plan].on')?.dataset.plan;
        ok("تفعيل باقة VIP بالنقر يعمل من الجهاز الجديد", vip, `الحالة بعد النقر: ${onAfter}`);
      }
    }
    /* التدوير آخر الخطوات — يقتل التوكن المستعمل في هذه الجلسة */
    const rot = await waitUntil(() => !!X.d.getElementById("ad-rotate"), 4000);
    if (rot) {
      await click(X, "#ad-rotate");
      const newUrl = await clickUntil(X, "#rp-copy", () => X.d.body.textContent.includes("/panel/"), 8000);
      ok("تدوير الرابط السري يعمل من الجهاز الجديد", newUrl, X.d.body.textContent.slice(0, 80).replace(/\s+/g, " "));
    }
  }

  // ═══ 3) زبون عادي لا يرى أي أثر ═══
  const U = mkSession("زائر");
  await open(U, "/");
  ok("المنصة الرسمية بلا أي أثر للإعداد أو اللوحة", !U.d.body.textContent.includes("إعداد لوحة") && (await fetch(`${BASE}/setup`)).status === 404 && (await fetch(`${BASE}/api/adm/setup`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })).status === 404);
} catch (e) {
  fail++;
  console.error("✗ انقطاع الرحلة:", e.message);
}
ok("صفر أخطاء واجهة في كل الرحلة", errors.length === 0, errors.slice(0, 3).join(" | "));
console.log(`═══ PANEL JOURNEY: ${pass}/${pass + fail} ═══`);
srv.kill("SIGTERM");
await sleep(800);
try { srv.kill("SIGKILL"); } catch {}
process.exit(fail ? 1 : 0);
