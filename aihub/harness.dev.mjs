// ——— AIHub عدّة المرحلة A — أمن الخزنة أولاً ثم الواجهة ———
import { JSDOM } from "jsdom";
import { encryptBlob, decryptBlob } from "./public/js/vault.js";

const BASE = "http://127.0.0.1:8789";
const EMAIL = `vito-${Date.now().toString(36)}@aihub.test`;
const results = [];
const check = (name, ok, extra = "") => { results.push(ok); console.log(`${ok ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ——— 1) البنية ———
const health = await fetch(`${BASE}/health`).then((r) => r.json()).catch(() => null);
check("الخادم حي", !!health?.ok, health?.v);

const html = await fetch(BASE + "/").then((r) => r.text());
check("صفحة الهبوط تُخدم", html.includes("AIHub") && html.includes("app.css"));

// ——— 2) المصادقة ———
const reg = await fetch(`${BASE}/api/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: EMAIL, password: "StrongPass9", full_name: "Vito Owner" }) });
const regD = await reg.json();
check("التسجيل يعمل (201)", reg.status === 201, JSON.stringify(regD).slice(0, 60));
const dup = await fetch(`${BASE}/api/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: EMAIL, password: "StrongPass9", full_name: "Vito" }) });
check("البريد المكرر مرفوض (409)", dup.status === 409);
const weak = await fetch(`${BASE}/api/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "w@w.test", password: "123", full_name: "W" }) });
check("كلمة المرور الضعيفة مرفوضة (400)", weak.status === 400);

const login = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: EMAIL, password: "StrongPass9" }) });
const loginD = await login.json();
const cookie = (login.headers.get("set-cookie") ?? "").split(";")[0];
check("الدخول يعمل مع جلسة", login.status === 200 && cookie.startsWith("ah_s="));
const badLogin = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "vito@aihub.test", password: "WrongPass1" }) });
check("كلمة مرور خاطئة → 401", badLogin.status === 401);

const me = await fetch(`${BASE}/api/me`, { headers: { cookie } }).then((r) => r.json());
check("الجلسة تُرجع المستخدم", me?.user?.email === EMAIL, me?.user?.plan);
const csrf = me.csrf;
const meNoAuth = await fetch(`${BASE}/api/me`).then((r) => r.status);
check("بلا جلسة → 401", meNoAuth === 401);

// ——— 3) الخزنة الصفرية (القلب الأمني) ———
const SECRET = "sk-live-SUPER-SECRET-KEY-DO-NOT-LEAK-9f8e7d6c";
const blob = await encryptBlob("vault-pass-99", { keys: [{ id: "k1", provider: "openai", label: "work", key: SECRET }] });

const putNoCsrf = await fetch(`${BASE}/api/vault`, { method: "PUT", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ blob }) });
check("حفظ الخزنة بلا CSRF مرفوض (403)", putNoCsrf.status === 403);
const putBad = await fetch(`${BASE}/api/vault`, { method: "PUT", headers: { "content-type": "application/json", cookie, "x-csrf": "wrong" }, body: JSON.stringify({ blob }) });
check("CSRF خاطئ مرفوض (403)", putBad.status === 403);
const put = await fetch(`${BASE}/api/vault`, { method: "PUT", headers: { "content-type": "application/json", cookie, "x-csrf": csrf }, body: JSON.stringify({ blob }) });
check("حفظ الخزنة المشفرة يعمل", put.status === 200);
const getV = await fetch(`${BASE}/api/vault`, { headers: { cookie } }).then((r) => r.json());
check("استرجاع الخزنة يعيد نفس الـblob", getV.blob === blob);

const dec = await decryptBlob("vault-pass-99", getV.blob);
check("فك التشفير يعيد المفتاح حرفياً", dec.keys?.[0]?.key === SECRET);
const decBad = await decryptBlob("wrong-pass", getV.blob).then(() => true).catch(() => false);
check("كلمة سر خزنة خاطئة تفشل الفك", decBad === false);

const noLeak = getV.blob.includes(SECRET);
check("⚠ لا تسريب: الخادم لا يخزّن المفتاح نصاً صريحاً", !noLeak);

const garbage = await fetch(`${BASE}/api/vault`, { method: "PUT", headers: { "content-type": "application/json", cookie, "x-csrf": csrf }, body: JSON.stringify({ blob: "not-json" }) });
check("blob غير سليم مرفوض (400)", garbage.status === 400);

// ——— 4) محرك الاستدلال ———
const infNoKey = await fetch(`${BASE}/api/infer/openai`, { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ model: "gpt-4o-mini", messages: [] }) }).then((r) => r.status);
check("الوكيل بلا مفتاح upstream → 401", infNoKey === 401);
const infHf = await fetch(`${BASE}/api/infer/hf`, { method: "POST", headers: { "content-type": "application/json", cookie }, body: "{}" }).then((r) => r.status);
check("الموصل الجديد HF بلا مفتاح → 401", infHf === 401);
const infCerebras = await fetch(`${BASE}/api/infer/cerebras`, { method: "POST", headers: { "content-type": "application/json", cookie }, body: "{}" }).then((r) => r.status);
check("الموصل الجديد Cerebras بلا مفتاح → 401", infCerebras === 401);
const infUnknown = await fetch(`${BASE}/api/infer/nope`, { method: "POST", headers: { "content-type": "application/json", cookie, "x-upstream-key": "sk-x" }, body: "{}" }).then((r) => r.status);
check("مزود مجهول → 404", infUnknown === 404);
// في البيت المحلي: بلا شبكة → 502 منظم (البنية تُختبر لا المزود)
const infFake = await fetch(`${BASE}/api/infer/openai`, { method: "POST", headers: { "content-type": "application/json", cookie, "x-upstream-key": "sk-fake" }, body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: "hi" }] }) });
check("الوكيل يمرّر للمزود ويعيد خطأ منظماً (502 محلياً)", [502, 401].includes(infFake.status), String(infFake.status));

const instNoAuth = await fetch(`${BASE}/api/infer/instant`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }).then((r) => r.status);
check("الفوري بلا جلسة → 401", instNoAuth === 401);
const inst = await fetch(`${BASE}/api/infer/instant`, { method: "POST", headers: { "content-type": "application/json", cookie, "x-csrf": csrf }, body: JSON.stringify({ messages: [{ role: "user", content: "مرحبا" }] }) }).then((r) => r.json());
check("الفوري داخل الحصة يعيد بنية سليمة (محلياً ai_unavailable بلا شبكة)", ["ok", "ai_unavailable"].includes(inst?.error ?? "ok") || inst?.ok === true, inst?.error ?? "ok");
// تجربة الصور الفورية: قواعد الوصول ثم العدّ
const imgNoAuth = await fetch(`${BASE}/api/infer/instant-image`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }).then((r) => r.status);
check("الصورة الفورية بلا جلسة → 401", imgNoAuth === 401);
const imgEmpty = await fetch(`${BASE}/api/infer/instant-image`, { method: "POST", headers: { "content-type": "application/json", cookie, "x-csrf": csrf }, body: JSON.stringify({ prompt: "" }) }).then((r) => r.status);
check("برومبت فارغ → 400", imgEmpty === 400);
const img = await fetch(`${BASE}/api/infer/instant-image`, { method: "POST", headers: { "content-type": "application/json", cookie, "x-csrf": csrf }, body: JSON.stringify({ prompt: "قطة فضائية" }) }).then((r) => r.json());
check("الصورة داخل الحصة (محلياً ai_unavailable بلا AI)", ["ok", "ai_unavailable"].includes(img?.error ?? "ok"), img?.error ?? "ok");

const usage = await fetch(`${BASE}/api/usage`, { headers: { cookie } }).then((r) => r.json());
check("لوحة الاستخدام تعدّ فعلاً", usage?.usage?.instant >= 1, `instant=${usage?.usage?.instant}`);
check("سقوف الخطة حية من جدول", usage?.limits?.instant_daily === 20, `free=${usage?.limits?.instant_daily}`);
check("عدّاد الصور يزداد فعلاً", usage?.usage?.instant_img >= 1, `img=${usage?.usage?.instant_img}`);
check("سقف الصور معلن من الجدول", usage?.limits?.instant_img_daily === 5, `free_img=${usage?.limits?.instant_img_daily}`);

// ——— 5) الواجهة (jsdom): الهبوط والمصادقة ———
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable", url: BASE });
await sleep(600);
const d = dom.window.document;
check("HTML يحمل جذر التطبيق", !!d.getElementById("app"));
check("i18n: العنوان العربي في meta", html.includes("كل نماذج الذكاء الاصطناعي في منصة واحدة"));

// فحص وحدات العرض مباشرة (استيراد ديناميكي مع DOM وهمي)
const dom2 = new JSDOM(`<!doctype html><html><body><div id="x"></div></body></html>`, { url: BASE });
const g = dom2.window;
Object.defineProperty(g, "localStorage", { value: (() => { let m = {}; return { getItem: (k) => m[k] ?? null, setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; } }; })(), configurable: true });
globalThis.localStorage = g.localStorage;
globalThis.document = g.document;
globalThis.location = g.location;
const { renderLanding } = await import("./public/js/views/landing.js");
const { renderAuth } = await import("./public/js/views/auth.js");
const landRoot = g.document.createElement("div");
g.document.body.appendChild(landRoot);
renderLanding(landRoot);
check("الهبوط: البطل يرسم", !!landRoot.querySelector(".hero h1"));
check("الهبوط: شبكة بينتو كاملة", landRoot.querySelectorAll(".b-card").length === 6);
check("الهبوط: الحلقات الثلاث", landRoot.querySelectorAll(".ring-card").length === 3);
check("الهبوط: ثلاث باقات", landRoot.querySelectorAll(".plan-card").length === 3);
check("الهبوط: شريط النماذج يتحرك", (landRoot.querySelector("#marq")?.innerHTML ?? "").includes("GPT-4o"));
const authRoot = g.document.createElement("div");
g.document.body.appendChild(authRoot);
renderAuth(authRoot, "register");
check("المصادقة: نموذج التسجيل مكتمل", !!authRoot.querySelector("#a-email") && !!authRoot.querySelector("#a-pass") && !!authRoot.querySelector("#a-name"));

const fails = results.filter((r) => !r).length;
console.log(`\n═══ النتيجة: ${results.length - fails}/${results.length} نجح ═══`);
process.exit(fails ? 1 : 0);
