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
const sign = async (body, secret) => {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return [...new Uint8Array(sig)].map((x) => x.toString(16).padStart(2, "0")).join("");
};
const webhook = async (payload, sig, provider = "chargily") =>
  fetch(`${BASE}/api/payments/webhook/${provider}`, { method: "POST", headers: { "content-type": "application/json", ...(sig ? { "x-signature": sig } : {}) }, body: payload });

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
const wh0 = await webhook(JSON.stringify({ reference: "NK-X", amount_dzd: 1, status: "paid" }), "aa");
check("webhook والدفع معطل (503)", wh0.status === 503);

// ═══ 2) التفعيل من اللوحة + سر التوقيع ═══
const setOn = await call(own, "/api/admin/settings", "PUT", { payments_enabled: "1", webhook_secret_chargily: "advsecret123", credits_price_dzd_per_100: "300" });
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

// ═══ 6) Webhook: التوقيع أولاً ثم كل القواعد ═══
const ref1 = c4.data.reference, pid1 = c4.data.payment_id;
const wBad = await webhook(JSON.stringify({ reference: ref1, amount_dzd: 300, status: "paid" }), "deadbeef");
check("توقيع خاطئ → 401", wBad.status === 401);
const wNone = await webhook(JSON.stringify({ reference: ref1, amount_dzd: 300, status: "paid" }), "");
check("بلا توقيع → 401", wNone.status === 401);
const wUnk = await webhook(JSON.stringify({ reference: "NK-UNKNOWNREF1", amount_dzd: 300, status: "paid" }), await sign(JSON.stringify({ reference: "NK-UNKNOWNREF1", amount_dzd: 300, status: "paid" }), "advsecret123"));
check("مرجع مجهول بتوقيع صحيح → 404", wUnk.status === 404);
const bodyWrong = JSON.stringify({ reference: ref1, amount_dzd: 500, status: "paid" });
const wWrong = await webhook(bodyWrong, await sign(bodyWrong, "advsecret123"));
check("مبلغ غير مطابق تماماً → 409 وتبقى معلقة", wWrong.status === 409, JSON.stringify(await wWrong.json().catch(() => ({}))));
const bodyOk = JSON.stringify({ reference: ref1, amount_dzd: 300, status: "paid", provider_ref: "CHG-PR-1" });
const wOk = await webhook(bodyOk, await sign(bodyOk, "advsecret123"));
check("webhook صحيح → confirmed آلي", wOk.status === 200 && (await wOk.json()).status === "confirmed");
const meBal = await call(mallory, "/api/me");
check("رصيد العمليات = 100 بعد التأكيد", meBal.data.ai?.balance === 100, JSON.stringify(meBal.data.ai));
const wReplay = await webhook(bodyOk, await sign(bodyOk, "advsecret123"));
check("إعادة إرسال نفس الـwebhook → idempotent", wReplay.status === 200);
const meBal2 = await call(mallory, "/api/me");
check("الرصيد لم يتضاعف (100 ما زال)", meBal2.data.ai?.balance === 100);
const bodyDup = JSON.stringify({ reference: ref1, amount_dzd: 300, status: "paid", provider_ref: "CHG-PR-1", id: "second" });
// مرجع جديد لكن provider_ref مكرر: نصنع معلقة ثانية أولاً
const c6 = await call(mallory, "/api/payments/checkout", "POST", { kind: "credits", credits: 200 });
const bodyDup2 = JSON.stringify({ reference: c6.data.reference, amount_dzd: 600, status: "paid", provider_ref: "CHG-PR-1" });
const wDup = await webhook(bodyDup2, await sign(bodyDup2, "advsecret123"));
check("provider_ref مكرر (عملية مزدوجة) → 409", wDup.status === 409);
const bodyFail = JSON.stringify({ reference: c6.data.reference, amount_dzd: 600, status: "failed", provider_ref: "CHG-PR-2" });
const wFail = await webhook(bodyFail, await sign(bodyFail, "advsecret123"));
check("فشل الدفع → rejected", wFail.status === 200 && (await wFail.json()).status === "rejected");
const fa = await call(own, "/api/admin/audit-financial");
const actions = (fa.data.audit || []).map((a) => a.action);
check("التدقيق المالي يسجل كل الأحداث", actions.includes("webhook_rejected") && actions.includes("amount_mismatch") && actions.includes("confirmed") && actions.includes("rejected"), actions.join(","));

// ═══ 7) قواعد المخاطرة: حساب حديث ومبلغ كبير → تعليق للمراجعة ═══
const newbie = `fresh-${su}@nk.test`;
await atk(newbie, "FreshPass99", "Fresh", `fresh-${su}`, "client");
const cBig = await call(newbie, "/api/payments/checkout", "POST", { kind: "credits", credits: 5000 });
const bodyBig = JSON.stringify({ reference: cBig.data.reference, amount_dzd: 15000, status: "paid", provider_ref: "CHG-PR-BIG" });
const wBig = await webhook(bodyBig, await sign(bodyBig, "advsecret123"));
const wBigD = await wBig.json().catch(() => ({}));
check("حديث العهد + مبلغ كبير → held للمراجعة", wBig.status === 200 && wBigD.held === true && (wBigD.flags || []).length >= 1, JSON.stringify(wBigD));
const adminPays = await call(own, "/api/admin/payments");
const heldRow = (adminPays.data.payments || []).find((x) => x.reference === cBig.data.reference);
check("المعلقة المعلَّمة في طابور الإدارة", !!heldRow && heldRow.status === "pending" && String(heldRow.risk_flags).includes("account_fresh"));
// الإدارة تؤكدها يدوياً (مراجعة مبررة) → الرصيد يُضاف
const man = await call(own, `/api/admin/payments/${heldRow.id}/status`, "POST", { status: "confirmed" });
check("تأكيد يدوي بعد المراجعة يعمل", man.ok === true);
const meNew = await call(newbie, "/api/me");
check("رصيد الحديث العهد = 5000 بعد المراجعة", meNew.data.ai?.balance === 5000, JSON.stringify(meNew.data.ai));

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
