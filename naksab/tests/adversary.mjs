// ——— NAKSAB Adversary Suite: محاولات اختراق حقيقية + مسار الدفع المؤتمت كاملاً ———
const BASE = process.env.BASE || "http://127.0.0.1:8791";
const { execSync } = await import("node:child_process");
const CWD = new URL("..", import.meta.url).pathname;
const results = [];
const check = (name, cond, extra = "") => { results.push(!!cond); console.log(`${cond ? "✓" : "❌"} ${name}${!cond && extra ? ` — ${extra}` : ""}`); };

const k0Of = async (email, pass) => {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode("naksab:a1:" + email.toLowerCase()), iterations: 200000 }, key, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
};
const jar = {};
const eatCookies = (as, res) => {
  const list = res.headers.getSetCookie ? res.headers.getSetCookie() : (res.headers.get("set-cookie") ? [res.headers.get("set-cookie")] : []);
  for (const c of list) { if (c.startsWith("nk_s=")) jar[as] = c.split(";")[0]; if (c.startsWith("nk_ad=")) jar[as + ":ad"] = c.split(";")[0]; }
};
const cookieOf = (as) => [jar[as], jar[as + ":ad"]].filter(Boolean).join("; ");
async function call(as, path, method = "GET", body, extra = {}) {
  const res = await fetch(`${BASE}${path}`, { method, headers: { "content-type": "application/json", ...(cookieOf(as) ? { cookie: cookieOf(as) } : {}), ...(body && jar[as] ? { "x-csrf": jar[as + ":csrf"] } : {}), ...(jar.panel ? { "x-panel": jar.panel } : {}), ...extra }, body: body === undefined ? undefined : JSON.stringify(body) });
  eatCookies(as, res);
  let data = {}; try { data = await res.json(); } catch {}
  if (data.csrf) jar[as + ":csrf"] = data.csrf;
  return { ok: res.ok, status: res.status, data };
}
const su = Date.now().toString(36);
// ═══ 0) تصفير عدادات المعدل (KV تبقى بين الجولات) + إعادة تهيئة الإدارة + مالك جديد ═══
let rkeys = []; try { rkeys = JSON.parse(execSync("./node_modules/.bin/wrangler kv key list --binding CACHE_KV --local", { cwd: CWD, stdio: ["ignore", "pipe", "ignore"] }).toString()); } catch {}
for (const k of rkeys.filter((x) => x.name.startsWith("rl:"))) try { execSync(`./node_modules/.bin/wrangler kv key delete --binding CACHE_KV --local "${k.name}"`, { cwd: CWD, stdio: ["ignore", "ignore", "ignore"] }); } catch {}
execSync(`./node_modules/.bin/wrangler d1 execute naksab-db --local --command "DELETE FROM admin_meta; DELETE FROM admin_devices; DELETE FROM users WHERE role='admin'; DELETE FROM payments; DELETE FROM credit_ledger; DELETE FROM financial_audit; DELETE FROM settings WHERE k='payments_enabled'"`, { cwd: CWD, stdio: "pipe" });
const ownerEmail = `adv-owner-${su}@nk.test`;
const k0o = await k0Of(ownerEmail, "AdvOwnerSecret1");
const setup = await fetch(`${BASE}/api/admin/setup`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: ownerEmail, k0: k0o, name: "Adv Owner" }) });
const setupD = await setup.json().catch(() => ({}));
check("setup المالك يعمل", setup.status === 201 && setupD.panel_url);
jar["own"] = null; eatCookies("own", setup); jar["own:csrf"] = setupD.csrf; jar.panel = (setupD.panel_url || "").replace("/panel/", "");
const own = "own";

// ═══ 1) الحالة المعطلة: كل بوابات الدفع مغلقة ═══
const atk = async (email, pass, name, username, role) => {
  const k0 = await k0Of(email, pass);
  const r = await fetch(`${BASE}/api/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, k0, name, username, role }) });
  eatCookies(email, r); const d = await r.json().catch(() => ({})); if (d.csrf) jar[email + ":csrf"] = d.csrf;
  return { status: r.status, d };
};
const mallory = `mallory-${su}@nk.test`;
const malloryReg = await atk(mallory, "MalloryPass9", "Mallory", `mallory-${su}`, "admin");
check("تسجيل role=admin يُقص إلى غير مدير", malloryReg.status === 201 && malloryReg.d.user?.role === "freelancer", JSON.stringify(malloryReg.d.user));
const malloryMe = await call(mallory, "/api/me");
check("جلسة مالوري بلا صلاحيات إدارية", malloryMe.data.user?.role !== "admin");
const co0 = await call(mallory, "/api/payments/checkout", "POST", { kind: "credits", credits: 100 });
check("checkout والدفع معطل (503)", co0.status === 503, JSON.stringify(co0.data));
const wh0 = await fetch(`${BASE}/api/payments/webhook/chargily`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reference: "NK-X", amount_dzd: 1, status: "paid" }) });
check("باب الـwebhook ملحوم حتى مع تعطيل الدفع (404)", wh0.status === 404);

// ═══ 2) التفعيل من اللوحة + سر التوقيع ═══
const setOn = await call(own, "/api/admin/settings", "PUT", { payments_enabled: "1", credits_price_dzd_per_100: "300" });
check("تفعيل الدفع من اللوحة", setOn.ok === true);

// ═══ 3) بوابة الإدارة: لا جلسة/جلسة غير مدير/رابط خاطئ ═══
const g1 = await fetch(`${BASE}/api/admin/stats`, { headers: { "x-panel": jar.panel } });
check("API إداري بلا جلسة → 404", g1.status === 404);
const g2 = await call(mallory, "/api/admin/stats");
check("API إداري بجلسة غير مدير → 404", g2.status === 404);
const g3 = await fetch(`${BASE}/panel/GuessToken999999`);
check("تخمين رابط اللوحة → 404", g3.status === 404);
const g4 = await fetch(`${BASE}/api/admin/setup`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
check("إعادة setup → 404 للأبد", g4.status === 404);

// ═══ 4) حقن الكتلة (Mass Assignment) ═══
const mass = await call(mallory, "/api/profile", "PUT", { headline: "hello", plan_id: "vip", role: "admin", verified: 1, reputation: 99, banned: 0 });
check("profile PUT يقبل التحديث", mass.ok === true);
const meAfter = await call(mallory, "/api/me");
check("plan_id/role/verified لم تُمس بالحقن", meAfter.data.user?.role === "freelancer" && meAfter.data.plan?.id === "free" && meAfter.data.user?.verified === 0, JSON.stringify({ r: meAfter.data.user?.role, p: meAfter.data.plan?.id, v: meAfter.data.user?.verified }));

// ═══ 5) تحقق checkout: سقوف + idempotency ═══
const c1 = await call(mallory, "/api/payments/checkout", "POST", { kind: "credits", credits: 50 });
check("رصيد أقل من 100 مرفوض", c1.status === 400);
const c2 = await call(mallory, "/api/payments/checkout", "POST", { kind: "credits", credits: 999999 });
check("رصيد فوق السقف (5000) مرفوض", c2.status === 400);
const c3 = await call(mallory, "/api/payments/checkout", "POST", { kind: "credits", credits: -500 });
check("رصيد سالب مرفوض", c3.status === 400);
const c4 = await call(mallory, "/api/payments/checkout", "POST", { kind: "credits", credits: 100 });
check("شحن 100 رصيد = 300 دج + مرجع NK-*", c4.ok === true && c4.data.amount_dzd === 300 && /^NK-/.test(c4.data.reference || ""), JSON.stringify(c4.data));
const c5 = await call(mallory, "/api/payments/checkout", "POST", { kind: "credits", credits: 100 });
check("idempotency: نفس اليوم = نفس العملية", c5.data.payment_id === c4.data.payment_id, JSON.stringify({ a: c4.data.payment_id, b: c5.data.payment_id }));

// ═══ 6) البوابات الخارجية مغلقة بالكامل — بريدي موب حصراً (قرار مؤسس) ═══
const ref1 = c4.data.reference;
for (const prov of ["chargily", "sofizpay", "unknown-provider"]) {
  const w = await fetch(`${BASE}/api/payments/webhook/${prov}`, { method: "POST", headers: { "content-type": "application/json", "x-signature": "deadbeef" }, body: JSON.stringify({ reference: ref1, amount_dzd: 300, status: "paid" }) });
  check(`باب ${prov} ملحوم → 404 لا تأكيد مطلقاً`, w.status === 404);
}
const stK = await call(own, "/api/admin/settings", "PUT", { webhook_secret_chargily: "injected" });
const stR = await call(own, "/api/admin/settings");
check("حقن سر webhook عبر الإعدادات مرفوض", stK.ok === true && !(stR.data.settings || []).some((x) => String(x.k).includes("webhook_secret")));
const paySt = await call(own, "/api/admin/payments?status=pending");
const stillPend = (paySt.data.payments || []).find((x) => x.reference === ref1);
check("محاولة التزوير لم تغير حالة العملية (معلقة كما هي)", !!stillPend && stillPend.status === "pending");
const fa = await call(own, "/api/admin/audit-financial");
check("التدقيق المالي يسجل الإنشاء بلا أي تأكيد خارجي", (fa.data.audit || []).some((a) => a.action === "checkout_created"));

// ═══ 7) قناة التأكيد الوحيدة: مراجعة المالك يدوياً (بريدي موب حصراً) ═══
const newbie = `fresh-${su}@nk.test`;
await atk(newbie, "FreshPass99", "Fresh", `fresh-${su}`, "client");
const cBig = await call(newbie, "/api/payments/checkout", "POST", { kind: "credits", credits: 5000 });
check("شحن كبير يُنشأ معلقاً للمراجعة", cBig.ok === true && cBig.data.amount_dzd === 15000 && /^NK-/.test(cBig.data.reference || ""));
const forge = await fetch(`${BASE}/api/payments/webhook/chargily`, { method: "POST", headers: { "content-type": "application/json", "x-signature": "forged" }, body: JSON.stringify({ reference: cBig.data.reference, amount_dzd: 15000, status: "paid", provider_ref: "FAKE-1" }) });
check("تزوير تأكيد العملية الكبيرة عبر باب ملحوم → 404", forge.status === 404);
const meForged = await call(newbie, "/api/me");
check("الرصيد صفر بعد محاولة التزوير", Number(meForged.data.ai?.balance ?? 0) === 0, JSON.stringify(meForged.data.ai));
const adminPays = await call(own, "/api/admin/payments");
const pendRow = (adminPays.data.payments || []).find((x) => x.reference === cBig.data.reference);
check("العملية الكبيرة في طابور مراجعة المالك", !!pendRow && pendRow.status === "pending");
const man = await call(own, `/api/admin/payments/${pendRow.id}/status`, "POST", { status: "confirmed" });
check("تأكيد المالك يدوياً بعد مراجعته يعمل", man.ok === true);
const meNew = await call(newbie, "/api/me");
check("رصيد الحديث العهد = 5000 بعد مراجعة المالك", meNew.data.ai?.balance === 5000, JSON.stringify(meNew.data.ai));

// ═══ 8) IDOR: عبور الحدود بين المستخدمين ═══
const victim = `victim-${su}@nk.test`;
await atk(victim, "VictimPass9", "Victim", `victim-${su}`, "freelancer");
const svc = await call(victim, "/api/services", "POST", { title: "Victim service", description: "Original description of the service here", category: "design", currency: "DZD", price_min: 100, price_max: 200, delivery_days: 3, revisions: 1, skills: ["x"], requirements: "y" });
check("الضحية تنشئ خدمة", svc.status === 201);
const svcId = svc.data.id;
const edit = await call(mallory, `/api/services/${svcId}`, "PUT", { title: "HACKED" });
check("تعديل خدمة الغير → 403", edit.status === 403);
// مشروع: عميل يطلب + مستقل يعرض + قبول ثم غريب يحاول الدخول
const rq = await call(newbie, "/api/requests", "POST", { title: "Victim request", description: "A real description long enough here", category: "design", skills: ["x"] });
const prop = await call(victim, "/api/proposals", "POST", { request_id: rq.data.id, amount: 500, days: 3, cover: "I am the right fit for this project indeed." });
const acc = await call(newbie, `/api/proposals/${prop.data.id}/accept`, "POST", {});
check("قبول العرض يفتح مشروعاً", acc.ok === true);
const projId = acc.data.project_id;
const strangerRoom = await call(mallory, `/api/projects/${projId}`);
check("غريب في غرفة مشروع → 404", strangerRoom.status === 404);
const strangerMsg = await call(mallory, `/api/projects/${projId}/messages`, "POST", { body: "intruding" });
check("رسالة غريب في مشروع → 404", strangerMsg.status === 404);
const noCsrf = await fetch(`${BASE}/api/proposals/${prop.data.id}/accept`, { method: "POST", headers: { "content-type": "application/json", cookie: cookieOf(newbie) }, body: "{}" });
check("قبول بلا CSRF → 403", noCsrf.status === 403);
// ═══ 8-ب) عروضي /mine: المستقل يرى عروضه فقط وبمحتوى صحيح ═══
const mine = await call(victim, "/api/proposals/mine");
const mineRows = mine.data.proposals || [];
check("عروضي تعرض العرض المرسل", mine.ok === true && mineRows.length >= 1 && mineRows[0].request_title === "Victim request", JSON.stringify(mineRows).slice(0, 120));
const mineAtk = await call(mallory, "/api/proposals/mine");
check("آخر مستقل لا يرى عروض الضحية", (mineAtk.data.proposals || []).length === 0);
const mineNoAuth = await fetch(`${BASE}/api/proposals/mine`);
check("عروضي بلا جلسة → 401", mineNoAuth.status === 401);
const xss = await call(victim, "/api/services", "POST", { title: `<img src=x onerror=alert(1)>`, description: "<script>pwn()</script> design work", category: "design", currency: "DZD", price_min: 50, price_max: 60, delivery_days: 2, revisions: 0, skills: [], requirements: "" });
const xssGet = await call(victim, `/api/services/${xss.data.id}`);
check("XSS يُخزن نصاً فقط (لا تنفيذ خادمي)", xss.status === 201 && xssGet.data.service?.title.includes("<img"), JSON.stringify(xssGet.data).slice(0, 80));
const fs2 = await import("node:fs");
const uiSrc = fs2.readFileSync(new URL("../ui/app.js", import.meta.url), "utf8");
check("الواجهة تُهرِّب عنوان الخدمة (esc)", uiSrc.includes("esc(sv.title)") || uiSrc.includes("${esc(sv.title)}"));

// ═══ 9) حدود المعدل: آخر شيء (تستنزف عدادات IP) ═══
let reg429 = 0;
for (let i = 0; i < 25; i++) {
  const r = await fetch(`${BASE}/api/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: `spam${i}-${su}@nk.test`, k0: "a".repeat(64), name: "S", username: `spam${i}${su}` }) });
  if (r.status === 429) { reg429++; break; }
}
check("تسجيل متجاوز للحد → 429", reg429 > 0);
let log429 = 0;
for (let i = 0; i < 35; i++) {
  const r = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: `nobody${i}@nk.test`, k0: "b".repeat(64) }) });
  if (r.status === 429) { log429++; break; }
}
check("دخول متجاوز للحد → 429", log429 > 0);

const total = results.length, passed = results.filter(Boolean).length;
console.log(`\n═══ NAKSAB adversary: ${passed}/${total} ═══`);
process.exit(passed === total ? 0 : 1);
