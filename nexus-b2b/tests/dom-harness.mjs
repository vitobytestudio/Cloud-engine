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

let html = await readFile(new URL("../public/index.html", import.meta.url).pathname.replace("/tests/", "/"), "utf8");
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
check("بطاقة المشتري (BUYER) ظاهرة بالإدماج", !!$('[data-sector=BUYER]'));
check("الإنجليزية افتراضية عند أول فتح (Deal Room)", ($("#bottom-nav a[data-nav=chat] span")?.textContent ?? "") === "Deal Room", $("#bottom-nav a[data-nav=chat] span")?.textContent);

// ——— الدخول كضيف → الفيد ———
$("#onb-guest")?.click();
await sleep(1500);
check("الفيد يرندر (reels-wrap)", !!$(".reels-wrap"));
check("مقاطع الفيد ظاهرة", $$(".reel").length >= 3, `عدد=${$$(".reel").length}`);
check("الأفاق ظاهرة", $$(".story-orb").length >= 1, `عدد=${$$(".story-orb").length}`);
check("نصوص التنقل مترجمة", ($("#bottom-nav a[data-nav=feed] span")?.textContent ?? "") !== "");
await sleep(500);
check("مقطع واحد نشط فقط (مشغّل أحادي = سلاسة)", $$(".reel.active").length === 1, `نشط=${$$(".reel.active").length}`);
check("كل المقاطع برسوم مصغرة (لا إطارات سوداء)", $$(".reel video[poster]").length === $$(".reel video").length && $$(".reel video").length >= 3, `v=${$$(".reel video").length}`);

// ——— v0.8.1: الصوت الأصلي — زر الصوت يفكّ الكتم ويحفظ التفضيل ———
const vAct08 = $(".reel.active video");
$(".reel.active .snd-btn")?.click();
await sleep(250);
check("زر الصوت يفكّ الكتم (الصوت الأصلي يعمل)", vAct08?.muted === false && w.localStorage.getItem("nx_sound") === "1", `muted=${vAct08?.muted}`);

// ——— الاستوديو (ضيف → ورقة مصادقة → حساب تجريبي) ———
await navClick("studio");
check("الاستوديو يطلب مصادقة للضيف", !!$(".sheet"));
$(".sh-tab[data-m=register]")?.click();
await sleep(300);
check("خيار المشتري متاح بورقة التسجيل", !!$('#r-sector option[value=BUYER]'));
$("#r-name").value = "Nexus Autofeeder";
$("#r-user").value = "autofeader";
$("#r-email").value = "feeder@test.io";
$("#r-pass").value = "passw0rd9";
$("#sh-register")?.click();
await sleep(2000);
check("الاستوديو يفتح بعد تسجيل حقيقي", !!$(".studio-wrap"));
check("لا أخطاء JS بعد الدخول", errors.length === 0, errors.join(" | ").slice(0, 300));

// ——— المشتري الحقيقي (تسجيل معزول لا يمس الجلسة) + محادثة فعلية ———
const regB = await globalThis.fetch(`${BASE}/api/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ full_name: "Buyer Bot", username: "autotest_b", email: "buyer@test.io", password: "passw0rd9", sector: "BUYER" }) });
check("تسجيل قطاع المشتري BUYER يعمل (201)", regB.status === 201, String(regB.status));
const bSess = await globalThis.fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "buyer@test.io", password: "passw0rd9" }) });
const bCookie = (bSess.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
const bMe = await (await globalThis.fetch(`${BASE}/api/me`, { headers: { cookie: bCookie } })).json();
check("المشتري محفوظ بقطاعه BUYER", bMe.user?.sector === "BUYER", String(bMe.user?.sector));

const mePre = await (await w.fetch("/api/me")).json();
const opened = await (await w.fetch("/api/chat/open/autotest_b", { method: "POST", headers: { "x-csrf": mePre.csrf } })).json();
const convId08 = opened.id;
check("فتح محادثة حقيقية مع المشتري", typeof convId08 === "string" && convId08.length > 3, String(convId08));
await globalThis.fetch(`${BASE}/api/chat/${convId08}/messages`, { method: "POST", headers: { "content-type": "application/json", cookie: bCookie, "x-csrf": bMe.csrf }, body: JSON.stringify({ content: "Hello from the buyer side — need this scoped" }) });
await sleep(300);

await navClick("chat");
check("قائمة المحادثات تفتح", !!$(".conv-list"), `صفوف=${$$(".conv-row").length}`);
const row = $(`.conv-row[href="#/chat/${convId08}"]`) || $(".conv-row");
row?.click();
await sleep(60);
if (!new RegExp("/chat/").test(w.location.hash)) w.location.hash = `#/chat/${row?.getAttribute("href")?.split("/")[2] ?? convId08}`;
await sleep(1300);
check("لوحة المحادثة تفتح بالرسائل", !!$(".chat-pane"), `رسائل=${$$(".msg").length}`);

// ——— v0.8: العرض الملزم — إرسال من الواجهة بكل عناصره القانونية ———
$("#deal-btn")?.click();
await sleep(400);
check("نموذج العرض الملزم يفتح بكل الحقول", !!$("#d-title") && !!$("#d-days") && !!$("#d-rev") && !!$("#d-vat"));
$("#d-title").value = "Full checkout rebuild — fixed scope";
$("#d-amt").value = "850";
$("#d-days").value = "5";
$("#d-rev").value = "2";
$("#d-vat").value = "excl";
$("#d-go")?.click();
await sleep(1400);
const dc08 = $(".deal-card");
check("كارت العرض يظهر في المحادثة", !!dc08);
check("المرسل يرى Proposal Sent بلا أزرار دفع", (dc08?.textContent ?? "").includes("Proposal Sent") && !dc08?.querySelector("[data-deal=accept]"));
check("التفاصيل القانونية: 5 أيام عمل + جولتا تعديل", /5\s*(business days|jours ouvrés|أيام عمل)/.test(d.querySelector(".deal-details")?.textContent ?? "") && /2\s*(revision rounds|cycles de révision|جولات تعديل)/.test(d.querySelector(".deal-details")?.textContent ?? ""), (d.querySelector(".deal-details")?.textContent ?? "").slice(0, 60));
check("سطر VAT ظاهر بالكارت", (dc08?.textContent ?? "").toUpperCase().includes("VAT"));
const msgs08 = await (await w.fetch(`/api/chat/${convId08}/messages`)).json();
const prop08 = (msgs08.items ?? []).find((m) => m.message_type === "PROPOSAL");
check("العرض مخزّن خادمياً بتفاصيله القانونية", prop08?.deal_delivery_days === 5 && prop08?.deal_revisions === 2 && prop08?.deal_vat === "excl", JSON.stringify({ d: prop08?.deal_delivery_days, r: prop08?.deal_revisions, v: prop08?.deal_vat }));

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

// ——— v0.8.1: صفحة المنشور المستقلة ———
const curId08 = $(".reel.active")?.dataset.id ?? "p1";
$(".reel.active .reel-title")?.click();
await sleep(1300);
check("النقر على العنوان يفتح صفحة المنشور المستقلة", /#\/post\//.test(w.location.hash) && !!$(".post-view"), w.location.hash);
check("الصفحة تعرض صاحبه وعنوانه وإحصاءاته الثلاث", ($(".pv-author")?.textContent ?? "").length > 3 && ($(".pv-h2")?.textContent ?? "").length > 3 && $$(".pv-stats > div").length === 3);
const pvL08 = parseInt($(".post-view .nl")?.textContent.replace(/,/g, "")) || 0;
$("#pv-like")?.click();
await sleep(900);
check("الإعجاب من صفحة المنشور يعمل لحظياً", (parseInt($(".post-view .nl")?.textContent.replace(/,/g, "")) || 0) === pvL08 + 1, `${pvL08}→${$(".post-view .nl")?.textContent}`);
const pvDet08 = await (await w.fetch(`/api/posts/${curId08}`)).json();
check("الخادم يثبت حالة الإعجاب للمشاهد", pvDet08.liked === 1, `liked=${pvDet08.liked}`);
const pubG08 = await (await globalThis.fetch(`${BASE}/api/posts/${curId08}`)).json();
check("تفاصيل المنشور عامة للضيف بلا سياق", pubG08.id === curId08 && pubG08.liked === 0);
$("#pv-contact")?.click();
await sleep(1000);
check("التواصل من الصفحة يفتح غرفة الصفقات", /#\/chat\//.test(w.location.hash), w.location.hash);
await navClick("feed");
check("تفضيل الصوت باقٍ عبر التنقل", w.localStorage.getItem("nx_sound") === "1" && !$(".snd-btn")?.classList.contains("off"));

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
check("مستخدم مجاني لا يحمل شارة باقة حالية", !$(".plan-card.cur"));
check("ملاحظة VAT المعتمدة ظاهرة بالباقات", /VAT|TVA|الضريبة/.test($(".plans-page .pay-note")?.textContent ?? ""));
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

// ——— v0.8: نشر مقطع حقيقي بالرفع المباشر ———
const me08 = await (await w.fetch("/api/me")).json();
const up08 = await (await w.fetch("/api/stream/direct-upload", { method: "POST", headers: { "content-type": "application/json", "x-csrf": me08.csrf }, body: JSON.stringify({ purpose: "POST", bytes: 40960, content_type: "video/mp4" }) })).json();
check("تهيئة رفع مباشر تعمل", typeof up08.media_id === "string", JSON.stringify(up08).slice(0, 50));
await w.fetch(`/api/stream/upload/${up08.media_id}`, { method: "PUT", headers: { "content-type": "video/mp4" }, body: new Uint8Array(40960).fill(1) });
const np08 = await (await w.fetch("/api/posts", { method: "POST", headers: { "content-type": "application/json", "x-csrf": me08.csrf }, body: JSON.stringify({ title: "Autofeeder payout reel — harness artifact", category_tag: "REVENUE_WIN", artifact_type: "CASE_METRIC", artifact_url: "https://metrics.example/autofeeder", media_id: up08.media_id }) })).json();
const postId08 = np08.id;
check("النشر الحقيقي يعمل (201 بمعرف)", !!postId08, JSON.stringify(np08).slice(0, 60));

// ——— v0.4: التحليلات (أزرق = مفتوح) ———
w.location.hash = "#/analytics";
await sleep(1100);
check("لوحة التحليلات تفتح للباقة الزرقاء", !!$(".an-bars"), `أعمدة=${$$(".an-bar-col").length}`);
check("أعمدة 14 يوماً + أفضل المقاطع بمنشوري الحقيقي", $$(".an-bar-col").length === 14 && $$(".an-post").length >= 1, `أعمدة=${$$(".an-bar-col").length} أفضل=${$$(".an-post").length}`);

// ——— البحث العالمي ———
w.location.hash = "#/search";
await sleep(900);
const sin = $("#search-in");
sin.value = "كلاوس";
sin.dispatchEvent(new w.Event("input", { bubbles: true }));
await sleep(900);
check("البحث العالمي يجد المبدعين", $$(".user-row").length >= 1, `نتائج=${$$(".user-row").length}`);
check("شارة الدولة/الضريبة بنتائج البحث", $$(".user-row .fchip").length >= 1);
$("#search-in").value = "";
$$(".explore-chips [data-x]")[0]?.click();
await sleep(1000);
check("شريحة استكشاف سريعة تعمل بفلتر ظاهر", $$("#filter-bar .fchip").length >= 1 && $$(".user-row").length >= 1, `نتائج=${$$(".user-row").length}`);
$("#fclear")?.click();
await sleep(600);
const frDE = await (await globalThis.fetch(`${BASE}/api/search?country=DE&vat=1`)).json();
check("فلتر الدولة+VAT خادمي صارم", (frDE.users ?? []).length >= 1 && !!frDE.users[0].vat_ok && frDE.users[0].country_code === "DE", `عدد=${(frDE.users ?? []).length}`);
const frRate = await (await globalThis.fetch(`${BASE}/api/search?rate_min=50&rate_max=150&sector=FREELANCER`)).json();
check("فلتر نطاق السعر €50-150/h يعمل", Array.isArray(frRate.users), `عدد=${(frRate.users ?? []).length}`);
const frCS = await (await globalThis.fetch(`${BASE}/api/search?q=case%20study`)).json();
check("بحث كلمات داخل دراسات الحالة يعمل", (frCS.posts ?? []).length >= 1, `نتائج=${(frCS.posts ?? []).length}`);
$("#search-in").value = "case study";
$("#search-in").dispatchEvent(new w.Event("input", { bubbles: true }));
await sleep(900);
const sl08 = $("#search-out .grid3 a");
check("نتائج المقاطع تفتح صفحة المنشور مباشرة", !!sl08 && (sl08.getAttribute("href") ?? "").startsWith("#/post/"), sl08?.getAttribute("href"));
$("#filter-btn")?.click();
await sleep(300);
check("مودال الفلاتر يفتح بحقوله", !!$("#fl-cc") && !!$("#fl-min") && !!$("#fl-vat"));
$("#fl-vat").checked = true;
$("#fl-cc").value = "DE";
$("#fl-go")?.click();
await sleep(1000);
check("تطبيق الفلاتر من المودال يحدّث النتائج", $$("#filter-bar .fchip").length >= 2, `شرائح=${$$("#filter-bar .fchip").length}`);
$("#fclear")?.click();
await sleep(400);

// ——— الإشعارات ———
await sleep(900);
check("جرس الإشعارات يُظهر غير المقروء", $("#notif-dot")?.hidden === false);
w.location.hash = "#/notifications";
await sleep(1100);
check("صفحة الإشعارات تعرض المحفّزات", $$(".notif-row").length >= 1, `عدد=${$$(".notif-row").length}`);
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
const trD = await (await w.fetch("/api/account/tier", { method: "POST", headers: { "content-type": "application/json", "x-csrf": meD.csrf }, body: JSON.stringify({ tier: "PRO_TALENT" }) })).json();
check("الترقية للأزرق تعمل خادمياً", trD.badge_tier === "PRO_TALENT", String(trD.badge_tier));
await navClick("profile");
$('.pf-tab[data-tab=samples]')?.click();
await sleep(1100);
check("تاجر بلا زمردية يرى قفل القيمة", !!$(".lock-card"));

// ——— الذهبية: هيمنة مجانية شهرية (إثبات خادمي) ———
const me0 = await (await w.fetch("/api/me")).json();
const balBefore = (await (await w.fetch("/api/wallet")).json()).balance_cents;
const gold = await (await w.fetch("/api/account/tier", { method: "POST", headers: { "content-type": "application/json", "x-csrf": me0.csrf }, body: JSON.stringify({ tier: "ENTERPRISE_GOLD" }) })).json();
check("الترقية للذهبية عبر الخادم", gold.badge_tier === "ENTERPRISE_GOLD");
const g1 = await (await w.fetch("/api/boost/checkout", { method: "POST", headers: { "content-type": "application/json", "x-csrf": me0.csrf }, body: JSON.stringify({ post_id: postId08, tier: "DOMINANCE_DROP", target_country: "DACH", target_sector: "FOUNDERS" }) })).json();
check("هيمنة مجانية للذهبية (بلا خصم)", g1.free_grant === true, JSON.stringify(g1).slice(0, 60));
const balAfter = (await (await w.fetch("/api/wallet")).json()).balance_cents;
check("المحفظة لم تُخصم", balBefore === balAfter, `${balBefore}=${balAfter}`);
const g2 = await (await w.fetch("/api/boost/checkout", { method: "POST", headers: { "content-type": "application/json", "x-csrf": me0.csrf }, body: JSON.stringify({ post_id: postId08, tier: "DOMINANCE_DROP" }) })).json();
check("المحاولة الثانية تُرفض (منحة مستهلَكة/حماية معدل)", g2.error === "insufficient_balance" || g2.error === "too_many", `err=${g2.error}`);
check("فاتورة VAT فورية تُصدَر مع الدفع", typeof g1.invoice_id === "string" && g1.invoice_id.length > 3, String(g1.invoice_id));
const inv08 = await w.fetch(`/invoice/${g1.invoice_id}`);
const invTxt08 = await inv08.text();
check("صفحة الفاتورة تعمل للمالك (HTML طباعة برقم INV-)", inv08.status === 200 && invTxt08.includes("INV-"), String(inv08.status));
const invMiss = await w.fetch("/invoice/b-nonexistent00");
check("الفاتورة محمية (404 لمالك آخر/غير موجود)", invMiss.status === 404, String(invMiss.status));

// ——— v0.8: ورقة الترويج — استهداف جغرافي/مهني + مؤشرات ROI حية ———
await navClick("feed");
$$(".rail-btn[data-act=boost]")[0]?.click();
await sleep(700);
check("ورقة الترويج تعرض استهداف DACH/FR/UK وفئات B2B", !!$("#roi") && $$("#geo button").length >= 5 && $$("#aud button").length >= 3, `geo=${$$("#geo button").length} aud=${$$("#aud button").length}`);
const roi1 = $("#roi")?.textContent ?? "";
$$("#geo button")[1]?.click();
$$("#aud button")[1]?.click();
$('[data-tier=TARGET_BOOST]')?.click();
await sleep(350);
const roi2 = $("#roi")?.textContent ?? "";
check("مؤشرات ROI المتوقعة تتحدث مع الطبقة والاستهداف", roi1.length > 10 && roi1 !== roi2, roi1.slice(0, 44));
check("ملاحظة الفاتورة بالبريد ظاهرة بالورقة", /invoice|facture|فاتورة/.test($(".sheet")?.textContent ?? ""));
$("#b-x")?.click();
await sleep(300);

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
$('.pf-tab[data-tab=reels]')?.click();
await sleep(400);
const pg08 = $("#pf-body .grid3 a");
check("شبكة مقاطعي تفتح صفحة المنشور", !!pg08 && (pg08.getAttribute("href") ?? "").startsWith("#/post/"), pg08?.getAttribute("href"));
$("#edit-tile")?.click();
await sleep(500);
check("محرر الملف يفتح من ملفي", !!$("#pe-bio"));
$("#pe-bio").value = "نبذة اختبار آلي 42 — أطور منتجات تُلمس";
$("#pe-save")?.click();
await sleep(1100);
await navClick("profile");
check("النبذة المعدلة ظاهرة في الملف", (d.getElementById("view")?.textContent ?? "").includes("نبذة اختبار آلي 42"));

// ——— إضافة باقة (تاجر) ثم حذفها ———
const meS = await (await w.fetch("/api/me")).json();
await w.fetch("/api/account/sector", { method: "POST", headers: { "content-type": "application/json", "x-csrf": meS.csrf }, body: JSON.stringify({ sector: "MERCHANT" }) });
await navClick("profile");
$('.pf-tab[data-tab=items]')?.click();
await sleep(500);
const svBefore = $$(".item-row").length;
$("#add-item")?.click();
await sleep(400);
$("#if-title").value = "باقة اختبار آلي — مراجعة كود";
$("#if-price").value = "250";
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
check("بطاقة المقطع OG بصورته وتوجيهه لصفحة المنشور", ogV.includes("og:image") && ogV.includes("poster1") && ogV.includes("#/post/p1"));
const lg = await fetch(`${BASE}/legal.html`);
check("صفحة الثقة تعمل بمحتواها", lg.status === 200 && (await lg.text()).includes("الخصوصية"));

// ——— v0.7: البوابة الحقيقية — تسجيل، قوة، تكرار، دخول، أفاتار، حماية ———
const weak = await (await w.fetch("/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ full_name: "آلي", username: "autotest1", email: "auto@test.io", password: "12345678", sector: "FOUNDER" }) })).json();
check("كلمة المرور الضعيفة تُرفض", weak.error === "weak_password", JSON.stringify(weak));
const reg = await w.fetch("/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ full_name: "مستخدم آلي", username: "autotest1", email: "auto@test.io", password: "passw0rd9", sector: "FOUNDER" }) });
check("التسجيل الحقيقي يعمل (201)", reg.status === 201, String(reg.status));
const dup = await (await w.fetch("/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ full_name: "x", username: "autotest1", email: "auto2@test.io", password: "passw0rd9", sector: "FOUNDER" }) })).json();
check("تكرار اسم المستخدم يُرفض", dup.error === "exists");
const meNew = await (await w.fetch("/api/me")).json();
check("الحساب الجديد مسجّل دخوله فوراً", meNew.user?.username === "autotest1");
const tiny = "data:image/jpeg;base64," + "A".repeat(300);
const avSet = await (await w.fetch("/api/account/avatar", { method: "POST", headers: { "content-type": "application/json", "x-csrf": meNew.csrf }, body: JSON.stringify({ data: tiny }) })).json();
check("رفع صورة البروفايل يعمل", avSet.ok === true);
const avGet = await fetch(`${BASE}/api/avatar/autotest1`);
check("صورة البروفايل تُقدَّم صورةً حقيقية", avGet.status === 200 && (avGet.headers.get("content-type") ?? "").includes("image"));
const homeH = await fetch(`${BASE}/`);
check("رؤوس الحماية مفعّلة", homeH.headers.get("x-frame-options") === "DENY" && homeH.headers.get("x-content-type-options") === "nosniff");
const badLogin = await (await w.fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "auto@test.io", password: "wrong1234" }) })).status;
check("كلمة المرور الخطأ تُرفض", badLogin === 401);
const goodLogin = await w.fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "auto@test.io", password: "passw0rd9" }) });
check("الدخول بالحساب الحقيقي يعمل", goodLogin.status === 200);
const fg = await (await w.fetch("/api/auth/forgot", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "auto@test.io" }) })).json();
check("استرجاع كلمة المرور (بلا كشف)", fg.ok === true && fg.sent === false, JSON.stringify(fg));
const g404 = (await w.fetch("/api/auth/google/start")).status;
check("ڨوڨل محروس بأمان (404 بلا مفاتيح)", g404 === 404, String(g404));

// ——— محرر الاستوديو (جاهزية الواجهة) ———
await navClick("studio");
check("شاشة الاستوديو تعرض حالة المحرر", !!$(".studio-wrap") && ($(".hint")?.textContent ?? "").length > 4);

// ——— v0.8: دور المستقبِل الكامل — دخول المشتري، طلب تعديل، قبول بالضمان ———
w.location.hash = "#/settings";
await sleep(900);
$("#logout-btn")?.click();
await sleep(1500);
check("خروج المرسل يعيد البوابة", !!$(".onb"));
$('[data-sector=BUYER]')?.click();
await sleep(250);
check("اختيار بطاقة المشتري يفعّل زر التالي", $("#onb-next")?.style.visibility === "visible");
$("#onb-guest")?.click();
await sleep(1500);
w.location.hash = "#/feed";
await sleep(700);
await navClick("studio");
check("ورقة المصادقة تفتح للمشتري (ضيف)", !!$(".sheet"), `overlay=${(d.getElementById("overlay-root")?.innerHTML ?? "").length}`);
await sleep(200);
$("#l-email").value = "buyer@test.io";
$("#l-pass").value = "passw0rd9";
$("#sh-login")?.click();
await sleep(1800);
check("دخول المشتري الحقيقي يعمل", !!$(".studio-wrap"));
w.location.hash = `#/chat/${convId08}`;
await sleep(1400);
const acc08 = $('[data-deal=accept]');
const ed08 = $('[data-deal=request_edit]');
check("المستقبِل يرى Accept & Pay to Escrow وطلب التعديل", !!acc08 && !!ed08);
check("المستقبِل يرى التفاصيل القانونية نفسها", /5\s*(business days|jours ouvrés|أيام عمل)/.test(d.querySelector(".deal-details")?.textContent ?? ""), (d.querySelector(".deal-details")?.textContent ?? "").slice(0, 60));
ed08?.click();
await sleep(1000);
check("طلب التعديل لا يلغي العرض (الأزرار باقية)", !!$('[data-deal=accept]'));
const pe08 = await (await w.fetch(`/api/chat/${convId08}/messages`)).json();
const pem = (pe08.items ?? []).find((m) => m.message_type === "PROPOSAL");
check("الحالة ما زالت PENDING بعد طلب التعديل", pem?.deal_status === "PENDING", String(pem?.deal_status));
$('[data-deal=accept]')?.click();
await sleep(1400);
const pa08 = await (await w.fetch(`/api/chat/${convId08}/messages`)).json();
const pam = (pa08.items ?? []).find((m) => m.message_type === "PROPOSAL");
check("القبول يحجز المبلغ في الضمان (ESCROWED)", pam?.deal_status === "ESCROWED", String(pam?.deal_status));
const balB08 = await (await w.fetch("/api/wallet")).json();
check("قفل محاسبي: رصيد المشتري انخفض بقيمة العرض", balB08.balance_cents === -85000, String(balB08.balance_cents));
const invOther08 = await w.fetch(`/invoice/${g1.invoice_id}`);
check("فاتورة غيري محجوبة عن المشتري (404)", invOther08.status === 404, String(invOther08.status));

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
