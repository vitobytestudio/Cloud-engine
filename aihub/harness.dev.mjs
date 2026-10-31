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
const hRes = await fetch(`${BASE}/health`);
check("رؤوس الأمان: CSP", (hRes.headers.get("content-security-policy") ?? "").includes("default-src"));
check("رؤوس الأمان: DENY + nosniff", hRes.headers.get("x-frame-options") === "DENY" && hRes.headers.get("x-content-type-options") === "nosniff");
check("CORS البري أُسقط", hRes.headers.get("access-control-allow-origin") === null);
check("الخادم حي", !!health?.ok, health?.v);

const html = await fetch(BASE + "/").then((r) => r.text());
check("صفحة الهبوط تُخدم", html.includes("Nexus") && html.includes("app.css"));

// ——— 2) المصادقة (عقد k0: تمطيط المتصفح 200k ثم تجزئة الخادم) ———
const enc = new TextEncoder();
const k0Of = async (email, password) => {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode("nexus-hub:c1:" + email.toLowerCase()), iterations: 200000 }, key, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
};
const K0 = await k0Of(EMAIL, "StrongPass9");
const reg = await fetch(`${BASE}/api/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: EMAIL, k0: K0, full_name: "Vito Owner" }) });
const regD = await reg.json();
check("التسجيل يعمل (201)", reg.status === 201, JSON.stringify(regD).slice(0, 60));
const dup = await fetch(`${BASE}/api/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: EMAIL, k0: K0, full_name: "Vito" }) });
check("البريد المكرر مرفوض (409)", dup.status === 409);
const weak = await fetch(`${BASE}/api/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "w@w.test", k0: "123", full_name: "W" }) });
check("k0 تالف مرفوض (400)", weak.status === 400);
const rawPw = await fetch(`${BASE}/api/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "rp@rp.test", password: "Whatever123", full_name: "RP" }) });
check("تسجيل بكلمة مرور خام مرفوض (400)", rawPw.status === 400);

const rlEmail = `rl-${Date.now().toString(36)}@rl.test`;
let rlLast = 0;
for (let i = 0; i < 6; i++) {
  const rlK0 = await k0Of(rlEmail, "StrongPass9");
  const r = await fetch(`${BASE}/api/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: rlEmail, k0: rlK0, full_name: "RL" }) });
  rlLast = r.status;
}
check("الحد على التسجيل المتكرر (429)", rlLast === 429, `last=${rlLast}`);
const regHdr = (reg.headers.get("set-cookie") ?? "");
check("كوكي الجلسة محصّن (__Host- + HttpOnly)", regHdr.includes("__Host-ah_s=") && regHdr.includes("HttpOnly") && regHdr.includes("SameSite=Lax"));


const login = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: EMAIL, k0: K0 }) });
const badK0 = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: EMAIL, k0: "f".repeat(64) }) });
check("k0 خاطئ مرفوض (401)", badK0.status === 401);
const loginD = await login.json();
const cookie = (login.headers.get("set-cookie") ?? "").split(";")[0];
check("الدخول يعمل مع جلسة", login.status === 200 && cookie.startsWith("__Host-ah_s="));

// ——— v0.10.0-a: راوترات الوكلاء والصور والفيديو ———
const anonImg = await fetch(`${BASE}/api/infer/image`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
check("الصور المتقدمة تتطلب جلسة (401)", anonImg.status === 401);
const anonAgent = await fetch(`${BASE}/api/agent/run`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
check("الوكلاء تتطلب جلسة (401)", anonAgent.status === 401);
const lumaBad = await fetch(`${BASE}/api/video/luma`, { method: "POST", headers: { "content-type": "application/json", cookie, "x-csrf": loginD.csrf }, body: JSON.stringify({ key: "bad", prompt: "test" }) });
check("مفتاح Luma تالف مرفوض (400)", lumaBad.status === 400);
const csrfImg = await fetch(`${BASE}/api/infer/image`, { method: "POST", headers: { "content-type": "application/json", cookie }, body: "{}" });
check("الصور تتطلب CSRF (403)", csrfImg.status === 403);
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

const big = await fetch(`${BASE}/api/infer/openai`, { method: "POST", headers: { "content-type": "application/json", cookie, "x-upstream-key": "sk-x" }, body: JSON.stringify({ messages: [{ role: "user", content: "x".repeat(250_000) }] }) });
check("جسم الوكيل العملاق → 413", big.status === 413, String(big.status));

const garbage = await fetch(`${BASE}/api/vault`, { method: "PUT", headers: { "content-type": "application/json", cookie, "x-csrf": csrf }, body: JSON.stringify({ blob: "not-json" }) });
check("blob غير سليم مرفوض (400)", garbage.status === 400);

// ——— 4) محرك الاستدلال ———
// Nexus Open: القواعد ثم السلوك (بلا مفاتيح محلياً → مسار مجتمعي/غير متاح)
const autoNoAuth = await fetch(`${BASE}/api/infer/auto`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }).then((r) => r.status);
check("Nexus Open بلا جلسة → 401", autoNoAuth === 401);
const autoNoCsrf = await fetch(`${BASE}/api/infer/auto`, { method: "POST", headers: { "content-type": "application/json", cookie }, body: "{}" }).then((r) => r.status);
check("Nexus Open بلا CSRF → 403", autoNoCsrf === 403);
const autoEmpty = await fetch(`${BASE}/api/infer/auto`, { method: "POST", headers: { "content-type": "application/json", cookie, "x-csrf": csrf }, body: JSON.stringify({ messages: [] }) }).then((r) => r.status);
check("Nexus Open برسائل فارغة → 400", autoEmpty === 400);
const autoRes = await fetch(`${BASE}/api/infer/auto`, { method: "POST", headers: { "content-type": "application/json", cookie, "x-csrf": csrf }, body: JSON.stringify({ messages: [{ role: "user", content: "ما هو الذكاء الاصطناعي؟" }] }) }).then((r) => r.json());
check("Nexus Open: سلوك منظم بلا مفاتيح محلياً (سلسلة→مجتمع→غير متاح)", ["ok", "ai_unavailable"].includes(autoRes?.error ?? "ok"), autoRes?.via ?? autoRes?.error);
const usage2 = await fetch(`${BASE}/api/usage`, { headers: { cookie } }).then((r) => r.json());
check("عداد Nexus Open يزداد", usage2?.usage?.auto >= 1, `auto=${usage2?.usage?.auto}`);
check("سقف Nexus Open معلن (بيتا 300)", usage2?.limits?.auto_daily === 300, `auto_daily=${usage2?.limits?.auto_daily}`);

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
check("سقوف البيتا السخية حية", usage?.limits?.instant_daily === 500, `free=${usage?.limits?.instant_daily}`);
check("عدّاد الصور يزداد فعلاً", usage?.usage?.instant_img >= 1, `img=${usage?.usage?.instant_img}`);
check("سقف الصور البيتا معلن", usage?.limits?.instant_img_daily === 60, `free_img=${usage?.limits?.instant_img_daily}`);

// ——— 5) الواجهة (jsdom): الهبوط والمصادقة ———
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable", url: BASE });
await sleep(600);
const d = dom.window.document;
check("HTML يحمل جذر التطبيق", !!d.getElementById("app"));
check("i18n: العنوان العربي في meta", html.includes("كل نماذج الذكاء في منصة واحدة"));

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
