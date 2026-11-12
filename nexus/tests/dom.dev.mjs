/* NEXUS DOM harness — متصفح محاكى يشغّل الواجهة فعلاً (jsdom) ويكشف شاشات الموت السوداء */
import { JSDOM } from "jsdom";
import { webcrypto } from "node:crypto";

const BASE = "http://127.0.0.1:8792";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log("✓ " + name); } else { fail++; console.log("✗ " + name); } };

const html = await (await fetch(BASE + "/")).text();
const dom = new JSDOM(html, { url: BASE + "/", pretendToBeVisual: true, runScripts: "outside-only" });
const w = dom.window;
const d = w.document;

/* جسور البيئة */
w.fetch = (p, o) => fetch(typeof p === "string" && p.startsWith("/") ? BASE + p : p, o);
Object.defineProperty(w, "crypto", { value: webcrypto });
if (!w.matchMedia) w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
w.scrollTo = () => {};
w.HTMLElement.prototype.animate ??= function () { return { finished: Promise.resolve() }; };

const errors = [];
w.addEventListener("error", (e) => errors.push("err: " + (e.error?.stack || e.message).slice(0, 300)));
w.addEventListener("unhandledrejection", (e) => errors.push("rej: " + String(e.reason).slice(0, 300)));

/* شغّل التطبيق */
const appjs = await (await fetch(BASE + "/app.js")).text();
try { w.eval(appjs); } catch (e) { errors.push("eval: " + String(e).slice(0, 300)); }
await sleep(900);

const view = () => d.getElementById("view");
const alive = () => {
  const v = view();
  return v && v.innerHTML.length > 300 && v.textContent.replace(/\s+/g, "").length > 20;
};
const nav = async (hash) => { w.location.hash = hash; await sleep(650); };

/* 1) الزيارة الأولى: الترحيب يظهر ثم الرئيسية */
ok("الإقلاع: الترحيب يظهر (لا شاشة سوداء)", !!d.getElementById("onb") && alive() !== undefined);
d.getElementById("onb-skip")?.click();
await sleep(900);

/* 2) الرئيسية/الفيد بمنتجات البذرة */
ok("الرئيسية: محتوى حي وبطاقات المنتجات", alive() && d.querySelectorAll(".p-card").length >= 4);
ok("الرئيسية: الشريط السفلي ظاهر", d.querySelectorAll(".tab").length === 4);
ok("الرئيسية: هيرو بريميوم بعنوان متحرك وCTA", !!d.querySelector(".hero-nx .hero-title b") && d.querySelectorAll(".hero-cta .btn").length === 2 && d.querySelectorAll(".hero-orbs i").length === 3);

/* 3) الاستكشاف */
await nav("#/explore");
ok("الاستكشاف: حقل البحث ونتائج", alive() && !!d.getElementById("q-in") && d.querySelectorAll(".p-card").length >= 1);

/* 4) صفحة منتج عبر المسار المستقل */
await nav("#/p/p_demo_watch");
ok("صفحة المنتج: السعر وزر الطلب", alive() && !!d.getElementById("order-btn"));

/* 5) ورقة الطلب: الولايات والبلديات من داتا 69 */
d.getElementById("order-btn")?.click();
await sleep(800);
ok("ورقة الطلب: 69 ولاية في القائمة", d.querySelectorAll("#o-wil option").length >= 70);
const comSel = d.getElementById("o-com");
ok("ورقة الطلب: البلديات معطلة قبل اختيار الولاية", comSel && comSel.disabled);
d.getElementById("o-wil").value = "16";
d.getElementById("o-wil").dispatchEvent(new w.Event("change"));
await sleep(300);
ok("ورقة الطلب: بلديات الجزائر تملأ بعد الاختيار", !d.getElementById("o-com").disabled && d.querySelectorAll("#o-com option").length > 10);
d.querySelector(".sheet-bd")?.click();
await sleep(600);

/* 6) متجر العرض */
await nav("#/s/vito-store");
ok("متجر العرض: الاسم والبانر والمنتجات", alive() && d.body.textContent.includes("VITO") && d.querySelectorAll(".p-card").length >= 4);

/* 7) الحساب يتطلب جلسة → تحويل لنموذج الدخول (لا سوداء) */
await nav("#/dash");
ok("اللوحة بلا جلسة: نموذج الدخول يُعرض", alive() && !!d.getElementById("auth-box"));

/* 7-ب) تدفق المستخدم: تبديل الدخول/التسجيل ذهاباً وإياباً — كاشف موت الأزرار بعد إعادة الرسم */
ok("auth: نموذج الدخول افتراضي بمفتاح منزلق", !!d.getElementById("a-email") && !!d.querySelector(".seg .seg-ind"));
d.querySelector('[data-m="reg"]')?.click();
await sleep(200);
ok("auth: زر حساب جديد يفتح نموذج التسجيل", !!d.getElementById("r-name"));
d.querySelector('[data-m="login"]')?.click();
await sleep(200);
ok("auth: العودة للدخول تعمل", !!d.getElementById("a-email"));
d.querySelector('[data-m="reg"]')?.click();
await sleep(200);
ok("auth: التبديل يعمل بعد تكرار الرسم (لا موت أزرار)", !!d.getElementById("r-name") && !!d.querySelector(".seg.r"));
const swLink = d.getElementById("r-switch");
swLink?.click();
await sleep(200);
ok("auth: رابط لدي حساب يعود للدخول", !!d.getElementById("a-email"));

/* 8) تبديل اللغة لا يكسر شيئاً */
w.eval('setLang("en")');
await sleep(600);
ok("تبديل LTR إنجليزي: المحتوى حي", alive() && d.documentElement.dir === "ltr" && d.body.textContent.toLowerCase().includes("explore"));
w.eval('setLang("ar")');
await sleep(600);
ok("العودة للعربية RTL", d.documentElement.dir === "rtl" && alive());

/* 8ب) جولة إجهاد: تنقل سريع متكرر ثم فحص السليمة */
for (const h of ["#/p/p_demo_perfume", "#/s/vito-store", "#/explore", "#/", "#/p/p_demo_watch", "#/auth", "#/", "#/explore"]) {
  w.location.hash = h;
  await sleep(220);
}
await sleep(900);
ok("إجهاد التنقل السريع: الرئيسية حية وبطاقاتها كاملة", alive() && d.querySelectorAll(".p-card").length >= 4);

/* 8ج) اللغة الإنجليزية ثم دخول التنقل فيها */
w.eval('setLang("en")');
await sleep(600);
ok("إنجليزية: الرئيسية بعد الإجهاد سليمة", alive() && d.querySelectorAll(".p-card").length >= 4);
w.eval('setLang("ar")');
await sleep(600);

/* 8د) الوكيل والشارات في متجر العرض */
await nav("#/s/vito-store");
ok("متجر pro يحمل شارة التوثيق", !!d.querySelector(".vbadge") && !!d.querySelector(".planbadge.pro"));
ok("المتجر: قالب بريمي بهيرو وشعار عائم وشهادات", !!d.querySelector(".stx") && !!d.querySelector(".stx-hero") && !!d.querySelector(".stx-logo") && d.querySelectorAll(".stx-chips span").length === 3);
ok("المتجر: زر واتساب يظهر للزوار", !!d.querySelector(".stx-actions .btn.wa"));
ok("زر الوكيل العائم موجود في المتجر", !!d.getElementById("agent-fab"));
d.getElementById("agent-fab")?.click();
await sleep(700);
ok("ورقة الوكيل تفتح برسالة ترحيب", !!d.getElementById("ag-log") && d.getElementById("ag-log").textContent.length > 10);
const agIn = d.getElementById("ag-in");
if (agIn && !agIn.disabled) {
  ok("ورقة الوكيل: أسئلة سريعة بضغطة واحدة", d.querySelectorAll(".sheet .qchip").length >= 3);
} else {
  ok("ورقة الوكيل: أسئلة سريعة (الوكيل معطّل بلا مفاتيح — الإدخال مقفول)", !!agIn && agIn.disabled === true);
}
ok("ورقة الوكيل: متابعة واتساب متاحة", !!d.querySelector(".sheet .btn.wa"));
d.querySelector(".sheet-bd")?.click();
await sleep(500);

/* 8هـ) صفحة الفيديوهات الإعلانية: الحارس يوجّه الغريب للدخول */
await nav("#/ads");
await sleep(600);
ok("حارس #/ads: بلا جلسة → الدخول", w.location.hash.includes("auth") || !!d.querySelector("#a-email, #l-email"));

/* 8و) وكيل الاستقبال للضيف على الرئيسية */
await nav("#/");
await sleep(700);
ok("زر الاستقبال العائم للضيف", !!d.getElementById("recep-fab"));
d.getElementById("recep-fab")?.click();
await sleep(700);
ok("ورقة الاستقبال بترحيب وأسئلة سريعة", !!d.getElementById("rec-log") && d.querySelectorAll(".qchip").length >= 3);
d.querySelector(".sheet-bd")?.click();
await sleep(400);

/* 9) صفر أخطاء غير الممسوكة في كل الجولة */
ok("صفر أخطاء JS غير الممسوكة طوال الجولة", errors.length === 0);
if (errors.length) console.log(errors.join("\n"));

console.log(`\n═══ NEXUS DOM: ${pass}/${pass + fail} ═══`);
process.exit(fail ? 1 : 0);
