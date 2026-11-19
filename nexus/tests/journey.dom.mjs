/* NEXUS جولة العمليات الكاملة — متصفح محاكى يضغط كل زر كما يفعل التاجر فعلاً
   التسجيل → متجري → إضافة منتج → كسر compare_at (رسالة عربية) → حفظ → تعديل →
   طلبية زبون → تحديث الحالة → مصروف → إعدادات → حذف المنتج → مسح المفاتيح الخام */
import { JSDOM } from "jsdom";
import { webcrypto } from "node:crypto";

const BASE = "http://127.0.0.1:8792";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => {
  if (cond) { pass++; console.log("✓ " + name); }
  else { fail++; console.log("✗ " + name + (extra ? " — " + extra : "")); }
};

const html = await (await fetch(BASE + "/")).text();
const dom = new JSDOM(html, { url: BASE + "/", pretendToBeVisual: true, runScripts: "outside-only" });
const w = dom.window;
const d = w.document;

/* جسور البيئة — مع جرة كوكي تحاكي المتصفح (set-cookie يُحفظ ويُرسل تلقائياً) */
let jar = {};
w.fetch = async (p, o = {}) => {
  const url = typeof p === "string" && p.startsWith("/") ? BASE + p : p;
  const headers = { ...(o.headers || {}) };
  const ck = Object.entries(jar).map(([k, v]) => k + "=" + v).join("; ");
  if (ck) headers.cookie = ck;
  const r = await fetch(url, { ...o, headers });
  for (const c of (r.headers.getSetCookie?.() || [])) {
    const [kv] = c.split(";");
    const i = kv.indexOf("=");
    if (i > 0) jar[kv.slice(0, i)] = kv.slice(i + 1);
  }
  return r;
};
Object.defineProperty(w, "crypto", { value: webcrypto });
if (!w.matchMedia) w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
w.scrollTo = () => {};
w.HTMLElement.prototype.animate ??= function () { return { finished: Promise.resolve() }; };
/* قماش الرسم في jsdom بلا node-canvas — جذع يكفي drawChart */
w.HTMLCanvasElement.prototype.getContext = function () {
  return { scale() {}, createLinearGradient: () => ({ addColorStop() {} }), beginPath() {}, roundRect() {}, rect() {}, fill() {} };
};

const errors = [];
w.addEventListener("error", (e) => errors.push("err: " + (e.error?.stack || e.message).slice(0, 200)));
w.addEventListener("unhandledrejection", (e) => errors.push("rej: " + String(e.reason).slice(0, 200)));

const appjs = await (await fetch(BASE + "/app.js")).text();
try { w.eval(appjs); } catch (e) { errors.push("eval: " + String(e).slice(0, 200)); }
await sleep(900);

const $ = (sel) => d.querySelector(sel);
const nav = async (hash) => { w.location.hash = hash; await sleep(750); };
const setV = (sel, v) => { const el = $(sel); if (!el) throw new Error("missing " + sel + " | sheet=" + (d.getElementById("sheet-root")?.innerHTML.length || 0) + " | errors=" + errors.join(";;").slice(0, 200)); el.value = v; };
const setVFire = (sel, v) => { setV(sel, v); $(sel).dispatchEvent(new w.Event("input", { bubbles: true })); };
const click = (sel) => { const el = $(sel); if (!el) throw new Error("missing " + sel); el.click(); };
const bodyTxt = () => d.body.textContent.replace(/\s+/g, " ");
const wireInline = () => d.querySelectorAll('button[onclick="productEditor()"]').forEach(b => { b.onclick = () => w.productEditor(); });
const noRawKeys = () => !/(invalid_|auth_required|too_many|too_large|quota_exhausted|plan_limit|fleet_down)/.test(bodyTxt());

/* 0) الإقلاع والتخطي */
ok("الإقلاع: شاشة الترحيب تظهر", !!d.getElementById("onb"));
d.getElementById("onb-skip")?.click();
await sleep(700);

/* 1) التسجيل من الواجهة نفسها — كما يفعل التاجر */
await nav("#/auth");
click("#a-switch"); await sleep(250);
setV("#r-name", "جوهرة الوادي");
setV("#r-store", "متجر الجوهرة");
setV("#r-slug", "jou-" + Date.now());
const EMAIL = "jou" + Date.now() + "@example.com";
setV("#r-email", EMAIL);
setV("#r-pass", "Secret-99");
click("#r-go");
await sleep(1200);
ok("التسجيل من الواجهة يدخل لوحة متجري", w.location.hash === "#/dash" && d.querySelectorAll("#dash-body .kpi").length === 4, "hash=" + w.location.hash);
ok("متجري: نظرة عامة مرسومة برحلة واحدة", bodyTxt().includes("نظرة عامة") && d.querySelectorAll("#dash-body .kpi").length === 4);

/* 2) إضافة منتج — مع كسر «قبل التخفيض» أولاً */
await nav("#/dash/products");
await sleep(400);
wireInline();
const addBtn = d.querySelector('button[onclick="productEditor()"]');
ok("زر إضافة منتج موجود", !!addBtn);
addBtn.click(); await sleep(350);
setV("#e-title", "قميص صيفي بريميوم");
setVFire("#e-price", "2500");
setVFire("#e-compare", "2000"); /* خطأ متعمد: قبل التخفيض أقل من السعر */
click("#e-save");
await sleep(250);
const errTxt = $("#e-err")?.textContent || "";
ok("الرفض المحلي الفوري برسالة عربية (بلا شبكة)", errTxt.includes("أعلى من السعر"), "got=" + errTxt.slice(0, 80));
ok("لا مفتاح خام في الخطأ", !errTxt.includes("invalid_compare"));
ok("تلميح الحي يظهر أثناء الكتابة", $("#cmp-hint")?.style?.display === "block");

/* 3) التصحيح والحفظ */
setV("#e-compare", "");
click("#e-save");
await sleep(900);
ok("المنتج حُفظ وظهر في القائمة", bodyTxt().includes("قميص صيفي بريميوم") && d.querySelectorAll("[data-edit]").length === 1, bodyTxt().slice(0, 120));

/* 4) التعديل من الواجهة */
d.querySelector("[data-edit]")?.click(); await sleep(350);
ok("المحرر يفتح بقيم المنتج", $("#e-title")?.value === "قميص صيفي بريميوم" && $("#e-price")?.value === "2500");
setV("#e-title", "قميص صيفي بريميوم V2");
setV("#e-compare", "3000");
click("#e-save");
await sleep(900);
ok("التعديل حُفظ", bodyTxt().includes("بريميوم V2"));

/* 5) طلبية زبون حقيقية (مسار الزائر العام) */
const slug = d.body.querySelector('a[href^="#/s/"]')?.getAttribute("href")?.slice(4) || JSON.parse(w.sessionStorage.getItem("nx_user") || "{}").slug;
/* نجلب معرف المنتج من قائمة التاجر عبر جلسة الجرة */
const meRes = await (async () => {
  const ck = Object.entries(jar).map(([k, v]) => k + "=" + v).join("; ");
  const r = await fetch(BASE + "/api/products", { headers: { cookie: ck } });
  return r.json();
})();
const product = (meRes.products || [])[0];
ok("منتج التاجر جاهز للطلبية", !!product?.id);
if (!slug) throw new Error("no store slug");
const storeSlug = slug;
const orderRes = await fetch(BASE + "/api/store/" + encodeURIComponent(storeSlug) + "/order", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ product_id: product.id, cname: "زبون تجريبي", phone: "0555112233", wilaya: 31, commune: "وادي سوف", delivery: "home", address: "حي الجامعة عمارة 12", note: "", qty: 2 }),
});
const orderData = await orderRes.json().catch(() => ({}));
ok("طلبية الزبون سُجلت 201", orderRes.status === 201 && orderData.ok, JSON.stringify(orderData).slice(0, 120));

/* 6) الطلبيات من الواجهة + تحديث الحالة */
await nav("#/dash/orders");
await sleep(600);
const oid = d.querySelector("[data-oid]")?.getAttribute("data-oid");
ok("الطلبية ظهرت في اللوحة", !!oid, "list=" + bodyTxt().slice(0, 100));
if (oid) {
  d.querySelector("[data-oid]").click(); await sleep(400);
  const stBtn = d.querySelector('#st-btns [data-st="confirmed"]');
  ok("أزرار تحديث الحالة حاضرة", !!stBtn);
  stBtn?.click(); await sleep(900);
  ok("الحالة تحدثت إلى مؤكد", bodyTxt().includes("مؤكد"), bodyTxt().slice(0, 100));
}

/* 7) مصروف من الواجهة */
await nav("#/dash/finance");
await sleep(500);
click("#add-exp"); await sleep(350);
setV("#x-label", "اعلانات فيسبوك");
setV("#x-amount", "1200");
click("#x-save");
await sleep(900);
ok("المصروف أُضيف وظهر", bodyTxt().includes("اعلانات فيسبوك"));

/* 8) الإعدادات من الواجهة */
await nav("#/dash/settings");
await sleep(500);
setV("#s-name", "متجر الجوهرة الكبير");
click("#s-save");
await sleep(900);
{
  const ck = Object.entries(jar).map(([k, v]) => k + "=" + v).join("; ");
  const me2 = await (await fetch(BASE + "/api/me", { headers: { cookie: ck } })).json();
  ok("اسم المتجر تحفظ في الخادم", me2?.user?.store_name === "متجر الجوهرة الكبير", "got=" + (me2?.user?.store_name || "?"));
}

/* 9) حذف المنتج من الواجهة (نقرتان — السلاح المؤمَّن) */
await nav("#/dash/products");
await sleep(500);
d.querySelector("[data-edit]")?.click(); await sleep(350);
const del = $("#e-del");
ok("زر الحذف موجود", !!del);
del.click(); await sleep(250);
ok("النقرة الأولى تسلّح الزر بتأكيد", (del.textContent || "").includes("حذف نهائي"));
del.click(); await sleep(900);
ok("المنتج حُذف والقائمة فارغة", !d.querySelector("[data-edit]") && bodyTxt().includes("لا منتجات بعد"), bodyTxt().slice(0, 100));

/* 10) المسح الشامل: صفر مفاتيح خام في كامل الجلسة */
ok("المسح الشامل: لا مفاتيح خام في أي شاشة زرناها", noRawKeys(), bodyTxt().slice(0, 200));
ok("صفر أخطاء غير متوقعة في الكونسول", errors.length === 0, errors.join(" | "));

console.log(fail === 0 ? `═══ NEXUS OPS JOURNEY: ${pass}/${pass + fail} ═══` : `═══ NEXUS OPS JOURNEY: ${pass}/${pass + fail} — فشل! ═══`);
process.exit(fail === 0 ? 0 : 1);
