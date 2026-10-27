// ——— عدّة اختبار NEXUS: متصفح افتراضي ينقر المنصة كما يفعل المستخدم بالضبط ———
import { readFile } from "node:fs/promises";
import { JSDOM, VirtualConsole } from "jsdom";

const BASE = "http://127.0.0.1:8788";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];
const results = [];

function check(name, cond, extra = "") {
  results.push({ name, ok: !!cond, extra });
  console.log(`${cond ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}`);
}

const vc = new VirtualConsole();
vc.on("jsdomError", (e) => { const m = String(e?.detail?.message ?? e.message ?? e); if (!m.includes("Could not load img")) errors.push(m.slice(0, 300)); });
vc.on("error", (m) => errors.push(String(m).slice(0, 300)));

let html = await readFile(new URL("./public/index.html", import.meta.url).pathname.replace("/tests/", "/"), "utf8");
html = html.replace(/<script[\s\S]*?<\/script>/g, ""); // نُشغّل الحزمة يدوياً
const bundle = await readFile("/tmp/nexus-bundle.js", "utf8");

const dom = new JSDOM(html, { url: BASE + "/", runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: vc });
const w = dom.window, d = w.document;

// ——— بوليلات بيئة المتصفح ———
const jar = new Map();
w.fetch = async (url, opts = {}) => {
  const headers = new w.Headers ? undefined : undefined; // noop
  const h = new globalThis.Headers(opts.headers ?? {});
  if (jar.size) h.set("cookie", [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; "));
  const res = await globalThis.fetch(new URL(url, BASE).href, { method: opts.method ?? "GET", headers: h, body: opts.body });
  for (const sc of (res.headers.getSetCookie?.() ?? [])) { const kv = sc.split(";")[0]; const i = kv.indexOf("="); jar.set(kv.slice(0, i), kv.slice(i + 1)); }
  return res;
};
w.IntersectionObserver = class { constructor(cb) { this.cb = cb; } observe(t) { setTimeout(() => this.cb([{ target: t, intersectionRatio: 1, isIntersecting: true }], this), 60); } unobserve() {} disconnect() {} };
w.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
w.HTMLMediaElement.prototype.pause = function () {};
w.matchMedia = w.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
w.WebSocket = class { constructor() { this.readyState = 1; setTimeout(() => this.onopen?.(), 20); } send() {} close() {} addEventListener(t, fn) { if (t === "open") setTimeout(fn, 25); } removeEventListener() {} };
w.navigator.vibrate = () => true;
w.localStorage.clear();
w.scrollTo = () => {};

const $ = (s) => d.querySelector(s);
const $$ = (s) => [...d.querySelectorAll(s)];
const navClick = async (name) => {
  const a = $(`#bottom-nav a[data-nav=${name}]`);
  a?.click();
  await sleep(60);
  if (!w.location.hash.includes(name)) w.location.hash = `#/${name}`;
  await sleep(1000);
};

// ——— الإقلاع ———
w.eval(bundle);
await sleep(900);
check("الإدماج يظهر لأول زيارة", $(".onb"));
check("الإفصاح المؤسسي ظاهر في الإدماج", !!$(".demo-note"));
check("لا أخطاء JS عند الإقلاع", errors.length === 0, errors.join(" | ").slice(0, 200));

// ——— الدخول كضيف → الفيد ———
$("#onb-guest")?.click();
await sleep(1500);
check("الفيد يرندر (reels-wrap)", !!$(".reels-wrap"));
check("مقاطع الفيد ظاهرة", $$(".reel").length >= 3, `عدد=${$$(".reel").length}`);
check("الأفاق ظاهرة", $$(".story-orb").length >= 1, `عدد=${$$(".story-orb").length}`);
check("نصوص التنقل مترجمة", ($("#bottom-nav a[data-nav=feed] span")?.textContent ?? "") !== "");

// ——— الاستوديو (ضيف → ورقة مصادقة → حساب تجريبي) ———
await navClick("studio");
check("الاستوديو يطلب مصادقة للضيف", !!$(".sheet"));
$("#sh-demo")?.click();
await sleep(1600);
check("الاستوديو يفتح بعد الحساب التجريبي", !!$(".studio-wrap"));
check("لا أخطاء JS بعد الدخول", errors.length === 0, errors.join(" | ").slice(0, 300));

// ——— المحادثات ———
await navClick("chat");
check("قائمة المحادثات تفتح", !!$(".conv-list"), `صفوف=${$$(".conv-row").length}`);
const row = $(".conv-row");
row?.click();
await sleep(60);
if (!/\/chat\//.test(w.location.hash)) w.location.hash = `#/chat/${row?.getAttribute("href")?.split("/")[2] ?? "c-demo-1"}`;
await sleep(1200);
check("لوحة المحادثة تفتح بالرسائل", !!$(".chat-pane"), `رسائل=${$$(".msg").length}`);

// ——— الملف الشخصي ———
await navClick("profile");
check("الملف الشخصي يفتح", !!$(".pf-head"), `تبويبات=${$$(".pf-tab").length}`);

// ——— العودة للفيد + ازدواج النقر = قلب ———
await navClick("feed");
check("العودة للفيد تعمل", !!$(".reels-wrap") && $$(".reel").length >= 3);
const reel = $(".reel");
const likesBefore = parseInt($(".n-likes")?.textContent.replace(/,/g, "")) || 0;
reel?.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
await sleep(120);
reel?.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
await sleep(350);
const likesAfter = parseInt($(".n-likes")?.textContent.replace(/,/g, "")) || 0;
check("ازدواج النقر يُعجب فوراً (قلب)", likesAfter === likesBefore + 1 && $(".heart-burst"), `${likesBefore}→${likesAfter}`);

// ——— تبديل اللغة ———
const before = $("#bottom-nav a[data-nav=feed] span")?.textContent;
$("#lang-btn")?.click();
await sleep(400);
const after = $("#bottom-nav a[data-nav=feed] span")?.textContent;
check("تبديل اللغة يعمل فوراً", before !== after, `${before} → ${after}`);

// ——— الباقات الاحترافية (صفحة مستقلة) ———
w.location.hash = "#/plans";
await sleep(1100);
check("صفحة الباقات تفتح بثلاث بطاقات فاخرة", $$(".plan-card").length === 3, `عدد=${$$(".plan-card").length}`);
check("الباقة الزرقاء معلَّمة كباقتك الحالية", !!$(".plan-card.b.cur"));
$('.plan-card.g [data-act]')?.click();
await sleep(1100);
check("تفعيل الذهبية تجريبياً يعمل", !!$(".plan-card.g.cur"));

// ——— أزرار ملفي المستقلة ———
await navClick("profile");
check("ملفي يعرض الباقات والتحليلات والتحرير والإعدادات", $$(".icon-tile").length === 4, `عدد=${$$(".icon-tile").length}`);

// ——— الإعدادات (صفحة مستقلة) ———
w.location.hash = "#/settings";
await sleep(1000);
check("صفحة الإعدادات تفتح بمجموعاتها", $$(".set-group").length >= 3, `مجموعات=${$$(".set-group").length}`);
const secBtn = $('.seg[data-key=sector] button[data-v=MERCHANT]');
secBtn?.click();
await sleep(800);
check("تغيير القطاع من الإعدادات يعمل", !!secBtn?.classList.contains("on"));
const autoBefore = $("#sw-auto")?.classList.contains("on");
$("#sw-auto")?.click();
await sleep(200);
check("مفتاح التشغيل التلقائي ينقلب", $("#sw-auto")?.classList.contains("on") === !autoBefore);

// ——— v0.4: التحليلات (أزرق = مفتوح) ———
w.location.hash = "#/analytics";
await sleep(1100);
check("لوحة التحليلات تفتح للباقة الزرقاء", !!$(".an-bars"), `أعمدة=${$$(".an-bar-col").length}`);
check("أعمدة 14 يوماً ببيانات حقيقية + أفضل المقاطع", $$(".an-bar-col i").length === 14 && $$(".an-post").length >= 1);

// ——— البحث العالمي ———
w.location.hash = "#/search";
await sleep(900);
const sin = $("#search-in");
sin.value = "كلاوس";
sin.dispatchEvent(new w.Event("input", { bubbles: true }));
await sleep(900);
check("البحث العالمي يجد المبدعين", $$(".user-row").length >= 1, `نتائج=${$$(".user-row").length}`);

// ——— الإشعارات ———
await sleep(900);
check("جرس الإشعارات يُظهر غير المقروء", $("#notif-dot")?.hidden === false);
w.location.hash = "#/notifications";
await sleep(1100);
check("صفحة الإشعارات تعرض المحفّزات", $$(".notif-row").length >= 3, `عدد=${$$(".notif-row").length}`);
check("القراءة تُخفي نقطة الجرس", $("#notif-dot")?.hidden === true);

// ——— المتابعة ———
w.location.hash = "#/profile/klaus";
await sleep(1100);
const fbtn = $("#follow-btn");
check("زر المتابعة ظاهر على ملف الآخرين", !!fbtn);
const t0 = fbtn?.textContent ?? "";
fbtn?.click();
await sleep(700);
check("المتابعة تتبدل فوراً (أي اتجاه/لغة)", !!fbtn && fbtn.textContent !== t0, `${t0}→${fbtn?.textContent}`);

// ——— طلب عينة (المشتري) ———
w.location.hash = "#/profile/salma";
await sleep(1100);
$('.pf-tab[data-tab=items]')?.click();
await sleep(300);
$("[data-sample]")?.click();
await sleep(700);
check("طلب العينة يُرسل ويُثبَّت", $("[data-sample]")?.disabled === true);

// ——— قفل العينات لغير الزمردي ———
const meD = await (await w.fetch("/api/me")).json();
await w.fetch("/api/account/tier", { method: "POST", headers: { "content-type": "application/json", "x-csrf": meD.csrf }, body: JSON.stringify({ tier: "PRO_TALENT" }) });
w.location.hash = "#/profile/amin";
await sleep(1100);
$('.pf-tab[data-tab=samples]')?.click();
await sleep(700);
check("تاجر بلا زمردية يرى قفل القيمة", !!$(".lock-card"));

// ——— الذهبية: هيمنة مجانية شهرية (إثبات خادمي) ———
const me0 = await (await w.fetch("/api/me")).json();
const balBefore = (await (await w.fetch("/api/wallet")).json()).balance_cents;
const gold = await (await w.fetch("/api/account/tier", { method: "POST", headers: { "content-type": "application/json", "x-csrf": me0.csrf }, body: JSON.stringify({ tier: "ENTERPRISE_GOLD" }) })).json();
check("الترقية للذهبية عبر الخادم", gold.badge_tier === "ENTERPRISE_GOLD");
const g1 = await (await w.fetch("/api/boost/checkout", { method: "POST", headers: { "content-type": "application/json", "x-csrf": me0.csrf }, body: JSON.stringify({ post_id: "p3", tier: "DOMINANCE_DROP" }) })).json();
check("هيمنة مجانية للذهبية (بلا خصم)", g1.free_grant === true, JSON.stringify(g1).slice(0, 60));
const balAfter = (await (await w.fetch("/api/wallet")).json()).balance_cents;
check("المحفظة لم تُخصم", balBefore === balAfter, `${balBefore}=${balAfter}`);
const g2 = await (await w.fetch("/api/boost/checkout", { method: "POST", headers: { "content-type": "application/json", "x-csrf": me0.csrf }, body: JSON.stringify({ post_id: "p3", tier: "DOMINANCE_DROP" }) })).json();
check("المحاولة الثانية تُرفض (منحة مستهلَكة/حماية معدل)", g2.error === "insufficient_balance" || g2.error === "too_many", `err=${g2.error}`);

// ——— v0.5: نبض الشبكة الحي ———
await navClick("feed");
await sleep(4600);
const pb = $("#pulse-bar");
check("شريط النبض الحي يعمل بمحتوى عالمي", !!pb && pb.classList.contains("show") && (pb.textContent ?? "").length > 8, (pb?.textContent ?? "").slice(0, 60));

// ——— شارة المؤسِّس ———
await navClick("profile");
check("شارة مؤسِّس على ملفي (أول 100)", !!$(".chip.founding"));

// ——— v0.6: محرر الملف الشخصي ———
await navClick("profile");
$("#edit-tile")?.click();
await sleep(500);
check("محرر الملف يفتح من ملفي", !!$("#pe-bio"));
$("#pe-bio").value = "نبذة اختبار آلي 42 — أطور منتجات تُلمس";
$("#pe-save")?.click();
await sleep(1100);
await navClick("profile");
check("النبذة المعدلة ظاهرة في الملف", (d.getElementById("view")?.textContent ?? "").includes("نبذة اختبار آلي 42"));

// ——— إضافة باقة (مستقل) ثم حذفها ———
const meS = await (await w.fetch("/api/me")).json();
await w.fetch("/api/account/sector", { method: "POST", headers: { "content-type": "application/json", "x-csrf": meS.csrf }, body: JSON.stringify({ sector: "FREELANCER" }) });
w.location.hash = "#/feed";
await sleep(500);
w.location.hash = "#/profile/amin";
await sleep(1200);
$('.pf-tab[data-tab=items]')?.click();
await sleep(400);
const svBefore = $$(".item-row").length;
$("#add-item")?.click();
await sleep(400);
$("#if-title").value = "باقة اختبار آلي — مراجعة كود";
$("#if-price").value = "250";
$("#if-days").value = "5";
$("#if-go")?.click();
await sleep(1300);
$('.pf-tab[data-tab=items]')?.click();
await sleep(400);
check("الباقة الجديدة ظهرت في الملف", $$(".item-row").length === svBefore + 1, `${svBefore}→${$$(".item-row").length}`);
const delBtn = $$("[data-del]").pop();
delBtn?.click();
await sleep(1300);
$('.pf-tab[data-tab=items]')?.click();
await sleep(400);
check("حذف الباقة يعمل", $$(".item-row").length === svBefore, `${$$(".item-row").length}`);

// ——— رسالة → إشعار الطرف الآخر (إثبات خادمي) ———
const meM = await (await w.fetch("/api/me")).json();
await w.fetch("/api/chat/c-demo-1/messages", { method: "POST", headers: { "content-type": "application/json", "x-csrf": meM.csrf }, body: JSON.stringify({ content: "رسالة اختبار إشعار" }) });
await sleep(400);

// ——— زر المشاركة في الفيد ———
await navClick("feed");
await sleep(800);
$(".rail-btn[data-act=share]")?.click();
await sleep(400);
check("المشاركة تعمل (نسخ احتياطي + توست)", !!$(".toast"));

// ——— روابط المشاركة الغنية OG ———
const ogP = await (await fetch(`${BASE}/p/salma`)).text();
check("بطاقة الملف OG بلقب صاحبها", ogP.includes("og:title") && ogP.includes("سلمى"));
const ogV = await (await fetch(`${BASE}/post/p1`)).text();
check("بطاقة المقطع OG بصورته المصغرة", ogV.includes("og:image") && ogV.includes("poster1"));
const lg = await fetch(`${BASE}/legal.html`);
check("صفحة الثقة تعمل بمحتواها", lg.status === 200 && (await lg.text()).includes("الخصوصية"));

// ——— تسجيل الخروج (الأخير — ينهي الجلسة) ———
w.location.hash = "#/settings";
await sleep(900);
$("#logout-btn")?.click();
await sleep(1400);
check("تسجيل الخروج يعيد الإدماج", !!$(".onb"));

// ——— الخلاصة ———
const fails = results.filter((r) => !r.ok).length;
console.log(`\n═══ النتيجة: ${results.length - fails}/${results.length} نجح — أخطاء JS الملتقطة: ${errors.length} ═══`);
errors.slice(0, 6).forEach((e) => console.log("🩸 خطأ:", e));
process.exit(fails || errors.length ? 1 : 0);
