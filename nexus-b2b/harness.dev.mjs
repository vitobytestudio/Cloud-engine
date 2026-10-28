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
if (!w.URL.createObjectURL) w.URL.createObjectURL = () => "blob:jsdom";
w.URL.revokeObjectURL = w.URL.revokeObjectURL || (() => {});
w.XMLHttpRequest = class {
  open(m, u) { this._m = m; this._u = String(u); this._h = {}; this.upload = {}; }
  setRequestHeader(k, v) { this._h[k] = v; }
  send(body) {
    (async () => {
      try {
        const buf = body && typeof body.arrayBuffer === "function" ? await body.arrayBuffer() : body;
        const total = buf?.byteLength ?? buf?.size ?? 0;
        this.upload?.onprogress?.({ lengthComputable: true, loaded: total, total: total || 1 });
        const res = await w.fetch(this._u, { method: this._m, headers: this._h, body: buf });
        this.status = res.status;
        this.onload?.();
      } catch { this.status = 0; this.onerror?.(); }
    })();
  }
};

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
let storiesFetches = 0;
const origFetchA = w.fetch;
w.fetch = function (u, o) { if (String(u).includes("/api/stories")) storiesFetches++; return origFetchA.call(this, u, o); };
check("الإنجليزية افتراضية عند أول فتح (Deal Room)", ($("#bottom-nav a[data-nav=chat] span")?.textContent ?? "") === "Deal Room", $("#bottom-nav a[data-nav=chat] span")?.textContent);
check("زر + موجود بالأعلى والاستوديو خارج شريط التنقل", !!$("#create-btn") && !$('#bottom-nav a[data-nav=studio]') && !!$('#bottom-nav a[data-nav=posts]'));

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
$("#create-btn")?.click();
await sleep(400);
check("قائمة + تعرض خياراتها الثلاثة", $$(".create-row").length === 3, `خيارات=${$$(".create-row").length}`);
check("صفوف الإنشاء سليمة البنية (عنوان+وصف+سهم)", [...$$(".create-row")].every((r) => r.querySelector(".minw0 b") && r.querySelector(".minw0 small") && r.querySelector("svg:last-child")));
$$(".create-row")[1]?.click();
await sleep(700);
check("خيار الريلز يمر ببوابة المصادقة للضيف", !!$(".sheet") && !/#\/studio/.test(w.location.hash), w.location.hash);
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

// ——— v0.9.0: صفحة المنشورات الساكنة والصور + إنشاء منشور صورة كامل ———
w.location.hash = "#/posts";
await sleep(1400);
check("صفحة المنشورات تفتح بستوريات أعلاها", !!$(".photos-page") && $$("#ph-stories .story-orb").length >= 1, `ستوريات=${$$("#ph-stories .story-orb").length}`);
check("كاش الستوريات: تنقلات كثيرة بطلبات قليلة", storiesFetches <= 2, `طلبات=${storiesFetches}`);
check("المعرض يبدأ فارغاً برسالة أنيقة", !!$("#ph-empty-add"));
const im08 = await (await w.fetch("/api/stream/direct-upload", { method: "POST", headers: { "content-type": "application/json", "x-csrf": (await (await w.fetch("/api/me")).json()).csrf }, body: JSON.stringify({ purpose: "POST", bytes: 20480, content_type: "video/mp4" }) })).json();
await w.fetch(`/api/stream/upload/${im08.media_id}`, { method: "PUT", headers: { "content-type": "video/mp4" }, body: new Uint8Array(20480).fill(7) });
const phBad = await (await w.fetch("/api/posts", { method: "POST", headers: { "content-type": "application/json", "x-csrf": (await (await w.fetch("/api/me")).json()).csrf }, body: JSON.stringify({ title: "Imposter video post", category_tag: "SHOWCASE", media_id: im08.media_id, media_kind: "IMAGE" }) })).json();
check("وسيط فيديو مقنّع كصورة يُرفض (حماية نوع الوسيط)", phBad.error === "not_an_image", JSON.stringify(phBad).slice(0, 50));
const im2 = await (await w.fetch("/api/stream/direct-upload", { method: "POST", headers: { "content-type": "application/json", "x-csrf": (await (await w.fetch("/api/me")).json()).csrf }, body: JSON.stringify({ purpose: "POST", bytes: 20480, content_type: "image/png" }) })).json();
await w.fetch(`/api/stream/upload/${im2.media_id}`, { method: "PUT", headers: { "content-type": "image/png" }, body: new Uint8Array(20480).fill(7) });
const phPost = await (await w.fetch("/api/posts", { method: "POST", headers: { "content-type": "application/json", "x-csrf": (await (await w.fetch("/api/me")).json()).csrf }, body: JSON.stringify({ title: "Spring collection — wholesale drop", category_tag: "SHOWCASE", media_id: im2.media_id, media_kind: "IMAGE" }) })).json();
check("نشر منشور صورة يعمل (201)", !!phPost.id, JSON.stringify(phPost).slice(0, 50));
await sleep(400);
w.location.hash = "#/feed";
await sleep(500);
w.location.hash = "#/posts";
await sleep(1200);
check("المنشور الساكن ظهر في المعرض", $$("#ph-grid .grid3 a").length === 1, `صور=${$$("#ph-grid .grid3 a").length}`);
$("#ph-grid .grid3 a")?.click();
await sleep(1300);
check("صفحة المنشور الساكن تعرض صورة بلا مشغل/زر صوت", !!$(".post-hero img") && !$(".post-hero video") && !$("#pv-snd"), w.location.hash);
await navClick("feed");
check("الفيد يقصي الصور (مقاطع فقط)", $$(".reel").length >= 1 && $$(".reel img").length === 0);

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
check("صفحة الباقات تفتح بأربع بطاقات (مجانية + ثلاث فاخرة)", $$(".plan-card").length === 4, `عدد=${$$(".plan-card").length}`);
check("المجانية تُعلَّم كباقة حالية للمجاني", !!$(".plan-card.f.cur"));
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

// ——— v0.10-A: الحذف النهائي + is_self ———
const meA0 = await (await w.fetch("/api/me")).json();
const upA0 = await (await w.fetch("/api/stream/direct-upload", { method: "POST", headers: { "content-type": "application/json", "x-csrf": meA0.csrf }, body: JSON.stringify({ purpose: "POST", bytes: 20480, content_type: "video/mp4" }) })).json();
await w.fetch(`/api/stream/upload/${upA0.media_id}`, { method: "PUT", headers: { "content-type": "video/mp4" }, body: new Uint8Array(20480).fill(2) });
const npA0 = await (await w.fetch("/api/posts", { method: "POST", headers: { "content-type": "application/json", "x-csrf": meA0.csrf }, body: JSON.stringify({ title: "is_self harness probe", category_tag: "SHOWCASE", artifact_type: "CASE_METRIC", artifact_url: "https://metrics.example/probe", media_id: upA0.media_id }) })).json();
const ownA = npA0.id;
const pgA1 = (await (await w.fetch("/api/feed?limit=10&offset=0")).json()).items ?? [];
const pgA2 = (await (await w.fetch("/api/feed?limit=10&offset=10")).json()).items ?? [];
const mineA = [...pgA1, ...pgA2].find((x) => x.id === ownA);
check("الفيد يعلّم منشوري is_self", !!mineA && mineA.is_self === true, String(mineA?.is_self));
const csrfA = (await (await w.fetch("/api/me")).json()).csrf;
const foeA = await w.fetch("/api/posts/p1", { method: "DELETE", headers: { "x-csrf": csrfA } });
check("حذف منشور غيرك محجوب (404)", foeA.status === 404, String(foeA.status));
w.location.hash = `#/post/${ownA}`;
await sleep(1300);
check("مالك المنشور يرى زر الحذف", !!$("#pv-del"));
$("#pv-del")?.click();
await sleep(400);
check("ورقة تأكيد الحذف تظهر بالتحذير", !!$("#c-ok") && ($(".sheet")?.textContent ?? "").length > 10);
$("#c-x")?.click();
await sleep(300);
check("إلغاء الحذف يبقي المنشور", !!$(".post-view"));
$("#pv-del")?.click();
await sleep(400);
$("#c-ok")?.click();
await sleep(1100);
const goneA = await w.fetch(`/api/posts/${ownA}`);
check("الحذف النهائي: المنشور لم يعد موجوداً (404)", goneA.status === 404, String(goneA.status));
const goneQA = await (await w.fetch(`/api/posts/${ownA}`)).json();
check("المعرض/الفيد يفقدانه تلقائياً", goneQA.error === "not_found");

// ——— v0.10-A: نشر ستوري عبر الاستوديو (ضغط→تقدم→رفع) ثم حذفه ———
w.location.hash = "#/studio";
await sleep(1300);
const stFileA = new w.File([new Uint8Array(20480).fill(4)], "clip.mp4", { type: "video/mp4" });
Object.defineProperty($("#vid-file"), "files", { value: [stFileA], configurable: true });
$("#vid-file").dispatchEvent(new w.Event("change", { bubbles: true }));
await sleep(700);
check("لوحة النشر تظهر بعد اختيار الملف", !!$("#s-go") && !!$("#mode"));
[...$$("#mode button")].find((b) => b.dataset.m === "story")?.click();
$("#s-cap").value = "لقطة آلية";
$("#s-go")?.click();
await sleep(3000);
const stGA0 = await (await w.fetch("/api/stories")).json();
check("إنشاء ستوري حقيقي عبر الاستوديو يعمل", (stGA0.groups ?? []).some((g) => g.user.username === "autofeader"), `مجموعات=${(stGA0.groups ?? []).length}`);
const mineOrbA = [...$$("#ph-stories .story-orb")].find((b) => b.innerHTML.includes("avatar/autofeader"));
check("كرة الستوري ظهرت لصاحبها بعد النشر", !!mineOrbA);
mineOrbA?.click();
await sleep(900);
check("العارض يعرض زر حذف لستوري المالك", !!$("#st-del"));
$("#st-del")?.click();
await sleep(500);
$("#c-ok")?.click();
await sleep(1100);
const stGA = await (await w.fetch("/api/stories")).json();
check("الستوري حُذف نهائياً من الخادم", !(stGA.groups ?? []).some((g) => g.user.username === "autofeader"), `مجموعات=${(stGA.groups ?? []).length}`);


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
check("المحاولة الثانية يدفعها رصيد الهدية (بلا فاتورة — العقد)", g2.ok === true && g2.invoice_id === null, JSON.stringify(g2).slice(0, 70));
check("لا فاتورة على المنحة المجانية (المال الحقيقي فقط)", g1.invoice_id === null, String(g1.invoice_id));
const inv08 = await w.fetch(`/invoice/${g1.boost_id}`);
const invJ08 = await inv08.json().catch(() => ({}));
check("فاتورة منحة/رصيد داخلي مرفوضة (404 no_invoice)", inv08.status === 404 && invJ08.error === "no_invoice", String(inv08.status));
const invMiss = await w.fetch("/invoice/b-nonexistent00");
check("الفاتورة محمية (404 لمالك آخر/غير موجود)", invMiss.status === 404, String(invMiss.status));

// ——— v0.10-B: النمو والسيادة (اشتراكات، هدية، بوتات، داعمون، أولوية، أمن) ———
const mkUserB = async (email, uname, sector) => {
  await globalThis.fetch(`${BASE}/api/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ full_name: uname, username: uname, email, password: "passw0rd9", sector }) });
  const lg = await globalThis.fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: "passw0rd9" }) });
  const ck = (lg.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  const me = await (await globalThis.fetch(`${BASE}/api/me`, { headers: { cookie: ck } })).json();
  return { ck, csrf: me.csrf };
};
const apiAsB = (ck, path, opts = {}) => globalThis.fetch(`${BASE}${path}`, { ...opts, headers: { "content-type": "application/json", cookie: ck, ...(opts.headers ?? {}) } });
const jB = async (r) => r.clone().json().catch(() => ({}));
const upMediaB = async (ck, csrf, purpose, ct) => {
  const u = await jB(await apiAsB(ck, "/api/stream/direct-upload", { method: "POST", headers: { "x-csrf": csrf }, body: JSON.stringify({ purpose, bytes: 20480, content_type: ct }) }));
  await apiAsB(ck, `/api/stream/upload/${u.media_id}`, { method: "PUT", headers: { "content-type": ct }, body: new Uint8Array(20480).fill(5) });
  return u.media_id;
};

// 1) صفحة الباقات: أربع بطاقات بأسعار العقد
w.location.hash = "#/plans";
await sleep(1300);
check("الباقات تعرض أربع بطاقات (مجانية + ثلاث)", $$(".plan-card").length === 4, `cards=${$$(".plan-card").length}`);
const plansTxtB = () => ($(".plans-page")?.textContent ?? "");
check("أسعار العقد 14/39/119 ظاهرة", plansTxtB().includes("14€") && plansTxtB().includes("39€") && plansTxtB().includes("119€"));
$$(".billing-seg [data-b]")[1]?.click();
await sleep(500);
check("السنوي يخفض 20% (134€ للزرقاء)", plansTxtB().includes("134€"));
$$(".billing-seg [data-b]")[0]?.click();
await sleep(400);

// 2) اشتراك معزول: أزرق شهري → زمردي سنوي (تبديل) → إلغاء
const subB = await mkUserB("sub@test.io", "subone", "FREELANCER");
const sb1 = await jB(await apiAsB(subB.ck, "/api/subscribe", { method: "POST", headers: { "x-csrf": subB.csrf }, body: JSON.stringify({ plan: "PRO_TALENT", cycle: "MONTHLY" }) }));
check("اشتراك الأزرق الشهري يعمل (1400 سنت)", sb1.ok === true && sb1.amount_cents === 1400, JSON.stringify(sb1).slice(0, 70));
const subMe1 = await jB(await apiAsB(subB.ck, "/api/me"));
check("شارة الأزرق فعلة على الحساب", subMe1.user?.badge_tier === "PRO_TALENT", String(subMe1.user?.badge_tier));
const sb2 = await jB(await apiAsB(subB.ck, "/api/subscribe", { method: "POST", headers: { "x-csrf": subB.csrf }, body: JSON.stringify({ plan: "MERCHANT_EMERALD", cycle: "YEARLY" }) }));
check("التبديل للزمردي السنوي (37440 = −20%)", sb2.ok === true && sb2.amount_cents === 37440, JSON.stringify(sb2).slice(0, 70));
const sbC = await jB(await apiAsB(subB.ck, "/api/subscription"));
check("حالة الاشتراك نشطة بدورة سنوية", sbC.subscription?.cycle === "YEARLY" && sbC.subscription?.status === "ACTIVE", JSON.stringify(sbC).slice(0, 80));
await apiAsB(subB.ck, "/api/subscribe/cancel", { method: "POST", headers: { "x-csrf": subB.csrf }, body: "{}" });
const sbD = await jB(await apiAsB(subB.ck, "/api/subscription"));
check("الإلغاء يوقف التجديد (CANCELED)", sbD.subscription?.status === "CANCELED", String(sbD.subscription?.status));

// 3) الهدية: 150€ بعد المنشرين — تصرف أولاً وبلا فاتورة
const gifB = await mkUserB("gifter@test.io", "gifterone", "MERCHANT");
await apiAsB(gifB.ck, "/api/posts", { method: "POST", headers: { "x-csrf": gifB.csrf }, body: JSON.stringify({ title: "أول منشر — عرض المصنع", category_tag: "SHOWCASE", media_id: await upMediaB(gifB.ck, gifB.csrf, "POST", "video/mp4") }) });
const gp1 = await jB(await apiAsB(gifB.ck, "/api/posts", { method: "POST", headers: { "x-csrf": gifB.csrf }, body: JSON.stringify({ title: "ثاني منشر — خط التغليف", category_tag: "PRODUCT_DEMO", media_id: await upMediaB(gifB.ck, gifB.csrf, "POST", "video/mp4") }) }));
check("الهدية تُمنح بالمنشور الثاني بالضبط", gp1.gift_granted === true, JSON.stringify(gp1).slice(0, 60));
const gw1 = await jB(await apiAsB(gifB.ck, "/api/wallet"));
check("رصيد الهدية 150€ في المحفظة مع انتهاء", gw1.gift_cents === 15000 && !!gw1.gift_expires_at, `${gw1.gift_cents}`);
const gb1 = await jB(await apiAsB(gifB.ck, "/api/boost/checkout", { method: "POST", headers: { "x-csrf": gifB.csrf }, body: JSON.stringify({ post_id: gp1.id, tier: "FLASH_DROP" }) }));
check("الترويج يصرف من الهدية أولاً (1900 سنت)", gb1.ok === true && gb1.gift_used === 1900 && gb1.invoice_id === null, JSON.stringify(gb1).slice(0, 80));
const ginvB = await apiAsB(gifB.ck, `/invoice/${gb1.boost_id}`);
check("صرف الهدية بلا أي فاتورة (404)", ginvB.status === 404, String(ginvB.status));
const gw2 = await jB(await apiAsB(gifB.ck, "/api/wallet"));
check("باقي الهدية 131€ بعد الصرف", gw2.gift_cents === 13100, String(gw2.gift_cents));
await apiAsB(gifB.ck, "/api/stories", { method: "POST", headers: { "x-csrf": gifB.csrf }, body: JSON.stringify({ media_id: await upMediaB(gifB.ck, gifB.csrf, "STORY", "video/mp4"), media_type: "VIDEO", caption: "ستوري الحكّامة" }) });

// 4) البوت — الأزرق: وكيل استقبال بحصة 10 يومياً
const botB = await mkUserB("blueown@test.io", "blueown", "FREELANCER");
const visB = await mkUserB("vis1@test.io", "vis1one", "BUYER");
await apiAsB(botB.ck, "/api/subscribe", { method: "POST", headers: { "x-csrf": botB.csrf }, body: JSON.stringify({ plan: "PRO_TALENT", cycle: "MONTHLY" }) });
const convB = await jB(await apiAsB(visB.ck, "/api/chat/open/blueown", { method: "POST", headers: { "x-csrf": visB.csrf }, body: "{}" }));
for (let i = 0; i < 12; i++) await apiAsB(visB.ck, `/api/chat/${convB.id}/messages`, { method: "POST", headers: { "x-csrf": visB.csrf }, body: JSON.stringify({ content: "مرحبا" }) });
await sleep(400);
const msgsB = await jB(await apiAsB(botB.ck, `/api/chat/${convB.id}/messages`));
const botRepliesB = (msgsB.items ?? []).filter((m) => m.via_bot).length;
check("وكيل الاستقبال يرد تلقائياً بحد 10/يوم للأزرق", botRepliesB === 10, `ردود=${botRepliesB}`);
const visMeB = await jB(await apiAsB(visB.ck, "/api/me"));
check("رسائل الوكيل موسومة بشفافية (تُرسل بحساب المالك)", (msgsB.items ?? []).some((m) => m.via_bot && m.sender_id !== visMeB.user.id));

// 5) الزمردية: مساعد مبيعات يجهز عرضاً بانتظار موافقة المالك
await apiAsB(botB.ck, "/api/subscribe", { method: "POST", headers: { "x-csrf": botB.csrf }, body: JSON.stringify({ plan: "MERCHANT_EMERALD", cycle: "MONTHLY" }) });
await apiAsB(visB.ck, `/api/chat/${convB.id}/messages`, { method: "POST", headers: { "x-csrf": visB.csrf }, body: JSON.stringify({ content: "أرسل لي عرض سعر" }) });
await sleep(400);
const offB = await jB(await apiAsB(botB.ck, "/api/bot/offers"));
const pendB = (offB.items ?? []).find((o) => o.status === "PENDING_OWNER");
check("العرض يُجهز وينتظر موافقة المالك بضغطة", !!pendB && pendB.amount_cents === 4900, JSON.stringify(offB).slice(0, 90));
const apB = await jB(await apiAsB(botB.ck, `/api/bot/offers/${pendB.id}/approve`, { method: "POST", headers: { "x-csrf": botB.csrf }, body: "{}" }));
check("اعتماد المالك يرسل العرض بصفقة ضمان حقيقية", apB.ok === true && apB.message?.message_type === "PROPOSAL" && apB.message?.deal_status === "PENDING", JSON.stringify(apB).slice(0, 80));

// 6) الذهبية: قيادة آلية داخل السقوف + تعليق فوق السقف
await apiAsB(botB.ck, "/api/subscribe", { method: "POST", headers: { "x-csrf": botB.csrf }, body: JSON.stringify({ plan: "ENTERPRISE_GOLD", cycle: "MONTHLY" }) });
await apiAsB(botB.ck, "/api/bot/settings", { method: "PUT", headers: { "x-csrf": botB.csrf }, body: JSON.stringify({ autopilot: true, max_price_cents: 20000, max_days: 30, max_revisions: 5 }) });
await apiAsB(visB.ck, `/api/chat/${convB.id}/messages`, { method: "POST", headers: { "x-csrf": visB.csrf }, body: JSON.stringify({ content: "ما عرضكم للتعاون؟" }) });
await sleep(400);
const msgsB2 = await jB(await apiAsB(visB.ck, `/api/chat/${convB.id}/messages`));
const autos = (msgsB2.items ?? []).filter((m) => m.message_type === "PROPOSAL");
check("القيادة الآلية ترسل العرض تلقائياً ضمن السقف", autos.length >= 2, `عروض=${autos.length}`);
await apiAsB(visB.ck, `/api/chat/${convB.id}/messages`, { method: "POST", headers: { "x-csrf": visB.csrf }, body: JSON.stringify({ content: "عندي مشروع ضخم بميزانية 900000 يورو" }) });
await sleep(400);
const offB2 = await jB(await apiAsB(botB.ck, "/api/bot/offers"));
check("العند فوق السقف يُعلق لمراجعة المالك", (offB2.items ?? []).some((o) => o.status === "PENDING_OWNER"), `معلق=${(offB2.items ?? []).filter((o) => o.status === "PENDING_OWNER").length}`);

// 7) الأولوية العالمية: المالك أولاً في الفيد والبحث والستوريات
const fdB = await jB(await w.fetch("/api/feed?limit=10"));
check("الفيد يفتتح بمنشور المالك (أول عالمياً)", fdB.items?.[0]?.username === "vitobyte" && fdB.items?.[0]?.reason === "owner", `${fdB.items?.[0]?.username}/${fdB.items?.[0]?.reason}`);
const seB = await jB(await w.fetch("/api/search?q=vito"));
check("البحث يضع المالك أولاً", seB.users?.[0]?.username === "vitobyte", String(seB.users?.[0]?.username));
const stB = await jB(await w.fetch("/api/stories"));
check("شريط الستوريات يفتتح بالمالك", stB.groups?.[0]?.user?.username === "vitobyte", String(stB.groups?.[0]?.user?.username));

// 8) الداعمون + الملف الملكي + قيادة الوكيل (DOM)
const supB = await jB(await w.fetch("/api/supporters"));
check("داعمو NEXUS: 40+ معلنين مع اسم المالك", (supB.count ?? 0) >= 40 && supB.owner_username === "vitobyte", `count=${supB.count}`);
w.location.hash = "#/supporters";
await sleep(1300);
check("صفحة الداعمين تعرض الشبكة كاملة بشفافية", $$(".sup-card").length >= 40 && ($(".sup-page")?.textContent ?? "").length > 200, `cards=${$$(".sup-card").length}`);
w.location.hash = "#/profile/vitobyte";
await sleep(1400);
check("ملف المالك: تاج وحيد + تحول ملكي كامل", w.document.getElementById("view").classList.contains("royal") && w.document.getElementById("view").classList.contains("is-owner") && !!$(".b-ic.owner-crown"));
w.location.hash = "#/profile/blueown";
await sleep(1400);
check("ملف الذهبية يتحول ملكياً (تاج + رقاقة الوكيل)", w.document.getElementById("view").classList.contains("royal") && !!$(".agent-chip") && !!$(".b-ic.crown"));
w.location.hash = "#/settings";
await sleep(1200);
check("قيادة الوكيل الآلي ظاهرة للذهبية بسقوفها", !!$("#ap-card") && !!$("#ap-price"));

// 9) الأمن الحقيقي: تباطؤ تصاعدي ثم حجب ثم فك
const wrongB = JSON.stringify({ email: "flood@test.io", password: "wrongpass1" });
const tryLoginB = () => globalThis.fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: wrongB });
for (let i = 0; i < 4; i++) await tryLoginB();
const t0B = Date.now();
await tryLoginB();
const dtBV = Date.now() - t0B;
check("التباطؤ التصاعدي يعمل (≥250ms عند التكرار)", dtBV >= 250, `${dtBV}ms`);
for (let i = 0; i < 3; i++) await tryLoginB();
const floodB = await tryLoginB();
check("الحجب يمنع القوى الغاشمة بعد 8 مخالفات (429)", floodB.status === 429, String(floodB.status));
for (let i = 0; i < 8; i++) await apiAsB(subB.ck, "/api/notifications/read", { method: "POST", body: "{}" });
const blkB = await apiAsB(subB.ck, "/api/me");
check("حجب طويل للمخرب (403 على مساراته)", blkB.status === 403, String(blkB.status));
const meMainB = await jB(await w.fetch("/api/me"));
await w.fetch("/api/security/lock", { method: "POST", headers: { "content-type": "application/json", "x-csrf": meMainB.csrf }, body: JSON.stringify({ username: "subone", locked: false }) });
const unblkB = await apiAsB(subB.ck, "/api/me");
check("فك الحجب يعيد الحساب فوراً", unblkB.status === 200, String(unblkB.status));

// 10) الحكّامة اليومية: قص الستوريات + إطفاء الأرصدة + انتهاء الاشتراكات + الملخص الأسبوعي
const crB = await jB(await w.fetch("/api/security/cron", { method: "POST", headers: { "content-type": "application/json", "x-csrf": meMainB.csrf }, body: JSON.stringify({ dev_backdate_story_hours: 25, dev_backdate_grants_days: 95, dev_backdate_subs_days: 400, force_weekly: true }) }));
check("الحكّامة تعمل وتنتقل خلاصتها", crB.ok === true && (crB.summary?.stories_trimmed ?? 0) >= 3 && (crB.summary?.grants_expired ?? 0) >= 1, JSON.stringify(crB.summary ?? {}).slice(0, 110));
check("الملخص الأسبوعي وصل لحاملي الذهبية", (crB.summary?.weekly_summaries ?? 0) >= 1, String(crB.summary?.weekly_summaries));
const gstB = await jB(await apiAsB(gifB.ck, "/api/stories"));
check("الستورية المنتهية قُطعت نهائياً", !(gstB.groups ?? []).some((g) => g.user.username === "gifterone"), `مجموعات=${(gstB.groups ?? []).length}`);
const gw3 = await jB(await apiAsB(gifB.ck, "/api/wallet"));
check("الرصيد المنتهي (90 يوماً) أُطفئ", gw3.gift_cents === 0, String(gw3.gift_cents));
const subMe2 = await jB(await apiAsB(subB.ck, "/api/me"));
check("الاشتراك المنتهي يخفض الحساب للمجانية", subMe2.user?.badge_tier === "FREE", String(subMe2.user?.badge_tier));

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
let pbShown = false;
for (let i = 0; i < 18 && !pbShown; i++) {
  await sleep(400);
  pbShown = !!$("#pulse-bar")?.classList.contains("show");
}
const pb = $("#pulse-bar");
check("شريط النبض الحي يعمل بمحتوى عالمي", pbShown && (pb.textContent ?? "").length > 8, (pb?.textContent ?? "").slice(0, 60));

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
const jsH08 = await fetch(`${BASE}/js/app.js?v=0.9.0`);
check("كاش الجافاسكربت محكوم (تحديثات تصل فوراً)", (jsH08.headers.get("cache-control") ?? "").includes("max-age=300"), jsH08.headers.get("cache-control"));
check("الصفحة الرئيسية بلا كاش (لا تحديثات عالقة)", (homeH.headers.get("cache-control") ?? "") === "no-cache", homeH.headers.get("cache-control"));
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
