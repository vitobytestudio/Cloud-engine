/* مِرسال — الإنتاج: واجهة التطبيق (بلا إطارات عمل — أمان وأداء) */
"use strict";

const $ = (s, el) => (el || document).querySelector(s);
const app = $("#app");
const state = { user: null, summary: null, csrf: getCookie("mirsal_csrf"), view: "home" };

function getCookie(n) {
  const m = document.cookie.match(new RegExp("(^|;\\s*)" + n + "=([^;]*)"));
  return m ? decodeURIComponent(m[2]) : "";
}
async function api(path, opts = {}) {
  const headers = Object.assign({}, opts.headers);
  if (!["GET", "HEAD"].includes((opts.method || "GET").toUpperCase())) headers["X-CSRF"] = getCookie("mirsal_csrf");
  if (opts.body && !(opts.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const res = await fetch(path, Object.assign({}, opts, { headers, credentials: "same-origin" }));
  let data = null;
  try { data = await res.json(); } catch (e) { /* ملف ثنائي */ }
  if (!res.ok) throw Object.assign(new Error((data && data.error) || "خطأ " + res.status), { status: res.status, data });
  return data !== undefined && data !== null ? data : res;
}
function toast(msg, ok) {
  const t = document.createElement("div");
  t.className = "toast " + (ok === false ? "bad" : "ok");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dzd = (n) => Number(n).toLocaleString("en").replace(/,/g, ".") + " دج";
const relTime = (ts) => {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return "قبل " + m + " د";
  const h = Math.floor(m / 60);
  if (h < 24) return "قبل " + h + " سا";
  return "قبل " + Math.floor(h / 24) + " يوم";
};
const freshness = (ts) => {
  const m = (Date.now() - ts) / 60000;
  if (m < 60) return { label: "خلال الساعة الأخيرة", cls: "r" };
  if (m < 1440) return { label: "اليوم", cls: "a" };
  return { label: "هذا الأسبوع", cls: "g" };
};

/* ——— هيكل الصفحة ——— */
const LOGO_SVG = '<svg viewBox="0 0 24 24"><path d="M2.4 11.1 20.8 3.2c.8-.34 1.6.44 1.3 1.26l-6 16.9c-.3.86-1.5.9-1.9.06l-2.6-5.8a1.4 1.4 0 0 0-.6-.64l-5.9-3.2c-.8-.44-.7-1.62.2-1.7Zm7.9 5.4 1.8 3.9 2.6-7.2-4.4 3.3Zm5-4.5 2.4-6.8-10.5 4.6 4.5 2.4c.3.17.55.4.74.7l.36.5 2.5-1.4Z"/></svg>';

const NAV_ICONS = {
  clients: '<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>',
  billing: '<svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19"/><path d="M6 15h4"/></svg>',
  admin: '<svg viewBox="0 0 24 24"><path d="M12 2.5 20 6v6c0 5-3.4 8.2-8 9.5C7.4 20.2 4 17 4 12V6l8-3.5Z"/><path d="m9 11.5 2.2 2.2L15.5 9"/></svg>',
  out: '<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>'
};
function bottomNav(role, active) {
  const item = (key, href, icon, label, on) =>
    `<a href="${href}" class="${on === active ? "on" : ""}" ${key === "out" ? 'onclick="doLogout()"' : ""}>${NAV_ICONS[icon]}<span>${label}</span></a>`;
  let items = item("c", "#/dashboard", "clients", "زبائني", "dashboard") + item("b", "#/billing", "billing", "الباقات", "billing");
  if (role === "admin") items += item("a", "#/admin", "admin", "الإدارة", "admin");
  items += item("o", "#", "out", "خروج", "out");
  return `<nav class="bottomnav">${items}</nav>`;
}
function header(nav, opts = {}) {
  const bn = opts.bottom ? bottomNav(opts.role, opts.active) : "";
  const navHtml = opts.active
    ? nav.replace(/href="#\/([a-z]+)"/g, (m, r) => `href="#/${r}" data-active="${r}"`)
    : nav;
  const navFinal = opts.active ? navHtml.replace(/data-active="${opts.active}"/g, 'class="on" data-active="' + opts.active + '"') : navHtml;
  return `<header><div class="wrap hd">
    <a href="#/" class="logo"><span class="logo-mark">${LOGO_SVG}</span><span><b>مِرسال</b><small>توصيل زبائن جاهزين — الجزائر</small></span></a>
    <nav>${navFinal}</nav>
  </div></header>${bn}`;
}

/* ——— الصفحة الرئيسية ——— */
const FEED_POOL = [
  { kw: "تصميم جرافيك", t: "مطلوب مصمم هوية بصرية كاملة — مشروع مقهى مختص", s: "فيسبوك · مجموعة فريلانس الجزائر", p: "الجزائر العاصمة" },
  { kw: "تطوير ويب", t: "شركة استيراد تبحث مطوّر موقع تعريفي وكاتالوغ", s: "إنستغرام · تعليق منشور", p: "وهران" },
  { kw: "فيديو إعلاني", t: "علامة مستحضرات: فيديو إعلاني قصير لحملة رمضان", s: "تيليغرام · قناة عامة", p: "عن بُعد" },
  { kw: "مونتاج", t: "قناة تعليمية: مونتير ريلز — تعاقد شهري ثابت", s: "تيليغرام · قناة خدمات", p: "عن بُعد" },
  { kw: "تصوير", t: "افتتاح صالون تجميل: تغطية + جلسة كاتالوغ", s: "فيسبوك · مجموعة وهران", p: "وهران" },
  { kw: "شعارات", t: "من يصمم شعار لمشروع حلويات منزلية؟", s: "إنستغرام · تعليق", p: "سطيف" },
  { kw: "كتابة محتوى", t: "مدونة تقنية جزائرية: كاتب مقالات بالعربية", s: "RSS · منتدى المطورين", p: "عن بُعد" },
];
let feedIdx = 0;
function feedItems() {
  const items = [];
  for (let i = 0; i < 4; i++) {
    const it = FEED_POOL[(feedIdx + i) % FEED_POOL.length];
    items.push(`<div class="fitem ${i === 0 ? "hot" : ""}" style="${i ? "opacity:" + (1 - i * 0.16) : ""}">
      <span class="kw">${esc(it.kw)}</span><b>${esc(it.t)}</b><small>${esc(it.s)} · ${esc(it.p)}</small></div>`);
  }
  return items.join("");
}
function startFeed() {
  const el = $("#feed-body");
  if (!el) return;
  feedIdx++;
  el.innerHTML = feedItems();
}
function renderHome() {
  app.innerHTML = `
  ${header(`<a href="#/login">الدخول</a><a href="#/register" style="color:#fff">ابدأ مجاناً</a>`)}
  <section class="hero"><div class="aurora a1"></div><div class="aurora a2"></div><div class="grid-ov"></div>
    <div class="wrap hero-grid">
      <div>
        <span class="tag v">توصيل زبائن جاهزين — حصرياً للجزائر</span>
        <h1>زبائن جاهزون<br /><span>يصلونك كل يوم.</span></h1>
        <p class="lead">مِرسال يجلب لك طلبات العملاء الحقيقية — منشورهم، رابط الوصول إليهم، ورسالة أولى جاهزة للإرسال — مباشرة إلى لوحتك. أنت لا تبحث بعد اليوم؛ أنت تتواصل وتُغلق الصفقة.</p>
        <div class="cta">
          <a class="btn btn-w" href="#/register">ابدأ مجاناً — 3 زبائن أسبوعياً</a>
          <a class="btn btn-g" href="#plans">الباقات</a>
        </div>
        <div class="chips"><i>قنوات رسمية 100٪</i><i>بلا مخاطرة على حساباتك</i><i>دفع بالدينار</i></div>
      </div>
      <div>
        <div class="feed">
          <div class="feed-h"><span>لوحة الفرص</span><span class="live"><i></i> بث مباشر</span></div>
          <div class="feed-b" id="feed-body">${feedItems()}</div>
          <div class="feed-f"><span>مصادر عامة عبر واجهات رسمية</span><span dir="ltr">RT &lt; 60s</span></div>
        </div>
      </div>
    </div>
  </section>
  <section id="plans"><div class="wrap">
    <div class="sec-t"><span class="tag v">الباقات</span><h2>أنت تدفع مقابل زبائن جاهزين — لا مقابل أداة</h2>
    <p>دفع جزائري عبر تحويل بريدي CCP مع وصل مشفّر ورقم مرجعي فريد لكل طلب</p></div>
    <div class="plans" id="plans-grid">جارٍ التحميل…</div>
  </div></section>
  <section><div class="wrap">
    <div class="sec-t"><span class="tag v">الأمان والامتثال</span><h2>حماية بمستوى المؤسسات — بلا استثناءات</h2></div>
    <div class="grid3">
      <div class="feat"><b class="n">01</b><h3>تشفير كامل للوصولات</h3><p>كل وصل دفع يُشفَّر AES-256-GCM قبل تخزينه — لا يُقرأ إلا من الإدارة عبر فك تشفير مُوثّق في سجل التدقيق.</p></div>
      <div class="feat"><b class="n">02</b><h3>مرجع فريد لكل طلب</h3><p>كل طلب يحمل مرجعاً سرياً يُكتب في وحدة التحويل — لا يمكن ادّعاء تحويل دون المرجع المطابق.</p></div>
      <div class="feat"><b class="n">03</b><h3>وصل واحد — مرة واحدة</h3><p>بصمة SHA-256 لكل وصل: نفس الملف لا يُقبل في طلبين أبداً. التكرار يُرفض آلياً فوراً.</p></div>
      <div class="feat"><b class="n">04</b><h3>مراجعة بشرية موثّقة</h3><p>الاعتماد قرار إنسان مسؤول — بلا أنظمة إعفاء آلية. كل قرار مُسبَّب ومُسجَّل باسم مَن اتخذه.</p></div>
      <div class="feat"><b class="n">05</b><h3>قفل وحدود معدل</h3><p>8 محاولات دخول خاطئة = قفل 15 دقيقة. حدود صارمة على الرفع والتسجيل ضد السكربتات.</p></div>
      <div class="feat"><b class="n">06</b><h3>امتثال قانوني</h3><p>موافقات مسجلة، حذف تلقائي بعد 72 ساعة، توافق مع قانون 18-07 الجزائري وGDPR.</p></div>
    </div>
  </div></section>
  <footer><div class="wrap"><span>© 2026 مِرسال — الجزائر</span><span><a href="#/legal">الشروط والخصوصية</a></span></div></footer>`;
  loadPlansGrid();
  const timer = setInterval(() => (document.getElementById("feed-body") ? startFeed() : clearInterval(timer)), 3400);
}
async function loadPlansGrid() {
  try {
    const d = await api("/api/plans");
    $("#plans-grid").innerHTML = d.plans.map((p) => `
      <div class="plan ${p.id === "growth" ? "hot" : ""}">
        ${p.id === "growth" ? '<span class="hot-tag">الأنسب للفريلانسر</span>' : ""}
        <b style="font-size:14px">${esc(p.name)}</b>
        <small style="color:var(--dim);font-size:11.5px">${esc(p.tagline || "")}</small>
        <div class="pr" style="margin-top:14px">${p.priceDzd === 0 ? "0" : dzd(p.priceDzd).replace(" دج", "")}<small style="font-size:12px;color:var(--dim);font-weight:700"> دج${p.priceDzd ? " / شهرياً" : " — للأبد"}</small></div>
        <ul>${p.features.map((f) => "<li>" + esc(f) + "</li>").join("")}</ul>
        <a class="btn ${p.id === "growth" ? "btn-w" : "btn-g"}" href="#/register" style="width:100%">${p.priceDzd ? "اشترك الآن" : "ابدأ مجاناً"}</a>
      </div>`).join("");
  } catch (e) { $("#plans-grid").textContent = "تعذر تحميل الباقات"; }
}

/* ——— المصادقة ——— */
function renderLogin(err) {
  app.innerHTML = `${header(`<a href="#/">الرئيسية</a>`)}
  <div class="wrap auth"><div class="card">
    <h2>تسجيل الدخول</h2>
    <p class="muted">أدخل بياناتك للوصول إلى زبائنك</p>
    ${err ? `<div class="err">${esc(err)}</div>` : ""}
    <div class="field"><label>البريد الإلكتروني</label><input id="li-email" type="email" dir="ltr" autocomplete="email"/></div>
    <div class="field"><label>كلمة السر</label><input id="li-pass" type="password" autocomplete="current-password"/></div>
    <button class="btn btn-p" style="width:100%" onclick="doLogin()">دخول</button>
    <p style="text-align:center;margin-top:16px;font-size:12.5px;color:var(--sub)">لا حساب؟ <a href="#/register" style="color:var(--vio2);font-weight:800">أنشئ واحداً مجاناً</a></p>
  </div></div>`;
}
function renderRegister(err) {
  app.innerHTML = `${header(`<a href="#/">الرئيسية</a>`)}
  <div class="wrap auth"><div class="card">
    <h2>إنشاء حساب</h2>
    <p class="muted">دقيقة واحدة — ثم زبائنك الأول في طريقه إليك</p>
    ${err ? `<div class="err">${esc(err)}</div>` : ""}
    <div class="field"><label>الاسم الكامل</label><input id="rg-name"/></div>
    <div class="field"><label>البريد الإلكتروني</label><input id="rg-email" type="email" dir="ltr"/></div>
    <div class="field"><label>كلمة السر</label><input id="rg-pass" type="password"/><div class="hint">8 أحرف على الأقل</div></div>
    <label class="consent">
      <input type="checkbox" id="rg-consent"/>
      <span>أوافق على <a href="#/legal" style="color:var(--brand-2)">الشروط وسياسة الخصوصية</a> — بياناتي تُعالَج بأمان وتُحفظ للمدة اللازمة فقط.</span>
    </label>
    <button class="btn btn-p" style="width:100%" onclick="doRegister()">إنشاء الحساب</button>
    <p style="text-align:center;margin-top:16px;font-size:12.5px;color:var(--sub)">لديك حساب؟ <a href="#/login" style="color:var(--vio2);font-weight:800">دخول</a></p>
  </div></div>`;
}
async function doLogin() {
  try {
    await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: $("#li-email").value, password: $("#li-pass").value }) });
    location.hash = "#/dashboard";
  } catch (e) { renderLogin(e.message); }
}
async function doRegister() {
  try {
    await api("/api/auth/register", { method: "POST", body: JSON.stringify({ name: $("#rg-name").value, email: $("#rg-email").value, password: $("#rg-pass").value, consent: $("#rg-consent").checked }) });
    toast("تم إنشاء حسابك — أهلاً بك");
    location.hash = "#/onboarding";
  } catch (e) { renderRegister(e.message); }
}

/* ——— لوحة الزبائن الجاهزين ——— */
let myClients = [];
async function renderDashboard() {
  let s;
  try { s = await api("/api/me/summary"); } catch (e) { location.hash = "#/login"; return; }
  state.summary = s;
  const nav = `<a href="#/dashboard">زبائني</a><a href="#/billing">الباقات</a>${s.user.role === "admin" ? '<a href="#/admin">الإدارة</a>' : ""}<a href="#" onclick="doLogout()">خروج</a>`;
  const profileBanner = !s.profile.setup_done
    ? `<div class="card" style="border-color:rgba(139,92,246,.35);margin-bottom:16px;display:flex;gap:14px;align-items:center;flex-wrap:wrap">
        <div style="flex:1;min-width:220px"><b style="font-size:14px">فعّل ملف التخصص</b><p style="font-size:12px;color:var(--sub)">دقيقة واحدة — ثم يبدأ توصيل زبائن تخصصك تلقائياً</p></div>
        <button class="btn btn-p btn-sm" onclick="location.hash='#/onboarding'">تفعيل الآن</button></div>`
    : "";
  const orderBanner = s.pending_order && s.pending_order.status === "submitted"
    ? `<div class="card" style="border-color:rgba(245,158,11,.3);margin-bottom:16px"><b style="font-size:13px;color:#fbbf24">طلب الاشتراك (${esc(s.pending_order.plan_id)}) قيد المراجعة</b><p style="font-size:12px;color:var(--sub)">المرجع: <b dir="ltr">${esc(s.pending_order.reference)}</b> — سيُفعَّل حسابك فور اعتماد الوصل</p></div>`
    : "";

  app.innerHTML = `${header(nav, { bottom: true, role: s.user.role, active: "dashboard" })}
  <div class="wrap app">
    <div class="app-hd">
      <div><h1>زبائنك الجاهزون</h1><div class="sub">${s.profile.setup_done ? "وصلوا إليك بمنشوراتهم وروابطهم — انسخ الرسالة وتواصل" : "فعّل ملفك لبدء التوصيل"}</div></div>
      <div style="display:flex;gap:8px;align-items:center">
        <span class="tag v">باقة ${esc(s.subscription?.plan_name ?? "—")}</span>
        <span class="tag g">${s.usage.week} زبون هذا الأسبوع</span>
      </div>
    </div>
    ${profileBanner}${orderBanner}
    <div class="card" style="margin-bottom:16px;display:flex;gap:14px;align-items:center;flex-wrap:wrap;border-color:rgba(124,108,255,.4)">
      <div style="flex:1;min-width:230px">
        <b style="font-size:15px">الرادار الفوري</b>
        <p style="font-size:12.5px;color:var(--sub)">بحث حقيقي الآن في القنوات العامة (أخبار + مجتمعات) عن طلبات تخصصك — النتائج تصل للجميع فوراً</p>
      </div>
      <button class="btn btn-p" id="radar-btn" onclick="runRadar()">ابدأ البحث الآن</button>
    </div>
    <div id="radar-result"></div>
    <div id="clients-area">${s.profile.setup_done ? '<div class="skel" style="min-height:128px"></div><div class="skel" style="min-height:196px"></div><div class="skel" style="min-height:196px"></div>' : ""}</div>
  </div>`;
  if (s.profile.setup_done) await loadClients();
}
async function loadClients() {
  const area = $("#clients-area");
  try {
    const d = await api("/api/clients?limit=30");
    myClients = d.clients;
    if (!myClients.length) {
      area.innerHTML = `<div class="card" style="text-align:center;padding:44px"><b style="font-size:14px">لا زبائن جدد في هذه اللحظة</b><p style="color:var(--sub);font-size:12.5px;margin-top:6px">الرادار يعمل — سيصلك ما يطابق تخصصك تلقائياً. حدّث الصفحة بعد قليل.</p><button class="btn btn-g btn-sm" style="margin-top:14px" onclick="loadClients()">تحديث الآن</button></div>`;
      return;
    }
    area.innerHTML = myClients.map((cl, i) => {
      const fr = freshness(cl.published_at);
      return `<div class="cli">
        <div class="cli-top">
          <div class="score" dir="ltr"><svg width="46" height="46" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="3"/>
            <circle cx="18" cy="18" r="15" fill="none" stroke="${cl.match.score >= 85 ? "#10b981" : "#8b5cf6"}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${(cl.match.score / 100) * 94.2} 94.2"/>
          </svg><b style="color:${cl.match.score >= 85 ? "#34d399" : "#a78bfa"}">${cl.match.score}</b></div>
          <div class="cli-t">
            <div class="tags"><span class="tag ${fr.cls}">${fr.label}</span><span class="tag v">${esc(cl.keyword || cl.platform)}</span></div>
            <h3>${esc(cl.title)}</h3>
            <div class="meta"><span>${esc(cl.author_public)}</span>${cl.location_hint ? "<span>" + esc(cl.location_hint) + "</span>" : ""}<span>${relTime(cl.published_at)}</span></div>
            ${cl.match.matched ? '<div class="reasons">' + cl.match.reasons.slice(0, 3).map((r) => "<span>" + esc(r) + "</span>").join("") + "</div>" : ""}
          </div>
        </div>
        <p class="cli-x">${esc(cl.excerpt)}</p>
        <div class="opening"><div class="oh"><b>رسالة افتتاحية جاهزة — انسخها وأرسلها</b><button class="copy" onclick="copyText(this, ${i})">نسخ</button></div><p>${esc(cl.opening)}</p></div>
        <div class="cli-foot">
          <div class="stats"><span>${cl.likes} إعجاب</span><span>${cl.comments} تعليق</span></div>
          <div class="acts">
            <button class="icobtn" title="تجاهل" onclick="clientAct('${cl.id}','skipped')">✕</button>
            <button class="icobtn" title="أغلقت الصفقة" onclick="clientAct('${cl.id}','won')">✓</button>
            <a class="btn btn-p btn-sm" href="${esc(cl.source_url)}" target="_blank" rel="noopener">تواصل الآن — منشور العميل</a>
          </div>
        </div>
      </div>`;
    }).join("");
  } catch (e) {
    area.innerHTML = `<div class="err">${esc(e.message)}</div>`;
  }
}
async function runRadar() {
  const btn = $("#radar-btn");
  const area = $("#radar-result");
  btn.disabled = true; btn.textContent = "جارٍ البحث في القنوات…";
  area.innerHTML = "";
  try {
    const d = await api("/api/radar/scan", { method: "POST", body: "{}" });
    if (d.inserted > 0) {
      area.innerHTML = `<div class="ok">وجد ${d.matched} طلباً مطابقاً — أُضيف ${d.inserted} جديداً إلى اللوحة</div>`;
      loadClients();
    } else if (d.matched > 0) {
      area.innerHTML = `<div class="ok">وجد ${d.matched} طلباً — لكنها موجودة في لوحتك بالفعل</div>`;
    } else {
      area.innerHTML = `<div class="ok">لم يُعثر على جديد في هذه اللحظة — المصادر تعمل وتُفحص دورياً كل 15 دقيقة</div>`;
    }
  } catch (e) {
    area.innerHTML = `<div class="err">${esc(e.message)}</div>`;
  }
  btn.disabled = false; btn.textContent = "ابدأ البحث الآن";
}
function copyText(btn, i) {
  navigator.clipboard.writeText(myClients[i].opening).then(() => { btn.textContent = "تم النسخ"; setTimeout(() => (btn.textContent = "نسخ"), 1500); });
}
async function clientAct(id, status) {
  try { await api("/api/clients/" + id + "/action", { method: "POST", body: JSON.stringify({ status }) }); loadClients(); } catch (e) { toast(e.message, false); }
}

/* ——— الإعداد (Onboarding) ——— */
async function renderOnboarding(step) {
  step = step || 1;
  let meta;
  try { meta = await api("/api/meta"); } catch (e) { return; }
  if (step === 1) {
    app.innerHTML = `${header(`<a href="#/dashboard">لوحتي</a>`)}
    <div class="wrap" style="max-width:760px;padding-top:90px">
      <div class="app-hd"><div><h1>ما تخصصك؟</h1><div class="sub">اختر مجالك — سيُوصَل إليك طلب تخصصك حصراً</div></div></div>
      <div class="grid3">
        ${meta.professions.map((p) => `<button class="feat" style="text-align:start;cursor:pointer" onclick="setProf('${p.id}')"><h3 style="margin:0">${esc(p.label)}</h3></button>`).join("")}
      </div>
    </div>`;
  }
}
async function setProf(id) {
  try {
    await api("/api/profile", { method: "PUT", body: JSON.stringify({ profession_id: id }) });
    toast("تم تفعيل التخصص — التوصيل بدأ");
    location.hash = "#/dashboard";
  } catch (e) { toast(e.message, false); }
}

/* ——— الباقات والدفع ——— */
let plansCache = null;
async function renderBilling(section) {
  let s;
  try { s = await api("/api/me/summary"); } catch (e) { location.hash = "#/login"; return; }
  if (!plansCache) plansCache = await api("/api/plans");
  const nav = `<a href="#/dashboard">زبائني</a><a href="#/billing" style="color:#fff">الباقات</a>${s.user.role === "admin" ? '<a href="#/admin">الإدارة</a>' : ""}<a href="#" onclick="doLogout()">خروج</a>`;
  const currentPlan = s.subscription?.plan_id;

  app.innerHTML = `${header(nav, { bottom: true, role: s.user.role, active: "billing" })}
  <div class="wrap app">
    <div class="app-hd"><div><h1>الباقات والتسليم</h1><div class="sub">أنت تدفع مقابل زبائن جاهزين يُسلَّمون إليك</div></div>
    <div style="display:flex;gap:8px"><span class="tag v">باقتك: ${esc(s.subscription?.plan_name ?? "—")}</span><span class="tag g">${s.usage.week} هذا الأسبوع · ${s.usage.total} إجمالاً</span></div></div>
    ${section === "checkout" && s.pending_order ? renderCheckout(s) : `
    <div class="plans">
      ${plansCache.plans.map((p) => `
      <div class="plan ${p.id === "growth" ? "hot" : ""}">
        ${p.id === "growth" ? '<span class="hot-tag">الأنسب للفريلانسر</span>' : ""}
        <b style="font-size:14px">${esc(p.name)}</b>
        <div class="pr" style="margin-top:12px">${p.priceDzd === 0 ? "0" : dzd(p.priceDzd).replace(" دج", "")}<small style="font-size:12px;color:var(--dim);font-weight:700"> دج${p.priceDzd ? " / شهرياً" : " — للأبد"}</small></div>
        <ul>${p.features.map((f) => "<li>" + esc(f) + "</li>").join("")}</ul>
        ${p.id === currentPlan
          ? '<button class="btn btn-g" disabled style="width:100%">باقتك الحالية</button>'
          : p.priceDzd === 0
            ? '<button class="btn btn-g" style="width:100%" disabled>الباقة الافتراضية</button>'
            : `<button class="btn ${p.id === "growth" ? "btn-w" : "btn-p"}" style="width:100%" onclick="createOrder('${p.id}')">اشترك — ${dzd(p.priceDzd)}</button>`}
      </div>`).join("")}
    </div>
    <div class="card" style="margin-top:20px;font-size:12px;color:var(--sub)">
      <b style="font-size:12.5px;color:#34d399">كيف يعمل الدفع بأمان</b>
      <p style="margin-top:8px;line-height:2">تحوّل المبلغ من حسابك البريدي (CCP) إلى حساب المنصة ← ترفع صورة الوصل هنا ← الإدارة تعتمده خلال ساعات العمل ← يُفعَّل اشتراكك 30 يوماً. كل وصل مُشفَّر، ومرجعك الفريد يمنع أي استعمال خاطئ له.</p>
    </div>`}
  </div>`;
}
async function createOrder(planId) {
  try {
    await api("/api/payments/order", { method: "POST", body: JSON.stringify({ plan_id: planId }) });
    renderBilling("checkout");
  } catch (e) { toast(e.message, false); }
}
function renderCheckout(s) {
  const o = s.pending_order;
  return `<div class="pay-box">
    <h2 style="font-size:18px">إتمام الاشتراك — باقة ${esc(o.plan_id === "growth" ? "نمو" : o.plan_id === "pro" ? "محترف" : o.plan_id)}</h2>
    <ol class="steps-pay">
      <li>حوّل المبلغ التالي من أي مكتب بريد (حساب بريدي جاري CCP) إلى الحساب أدناه.</li>
      <li>اكتب <b style="color:var(--vio2)">المرجع</b> في خانة «إشارة المرسل» أو على ظاهر الوصل — إلزامي.</li>
      <li>صوّر الوصل وارفعه هنا — سيُشفَّر ويُراجع من الإدارة.</li>
    </ol>
    <div class="rip">
      <div><small>رقم الحساب البريدي CCP</small><b>${esc(o ? plansCache.payment.account : "")}</b></div>
      <div><small>المفتاح (clé)</small><b>${esc(plansCache.payment.key)}</b></div>
      <div><small>RIP</small><b style="font-size:12.5px">${esc(plansCache.payment.rip)}</b></div>
      <div><small>المبلغ بالضبط</small><b style="color:#34d399">${dzd(o.amount_dzd)}</b></div>
    </div>
    <div class="ref"><span style="font-size:12px;font-weight:800;color:var(--sub)">المرجع الفريد لطلبك — انسخه واكتبه في الوصل</span><b>${esc(o.reference)}</b><button class="copy" onclick="copyRef(this)">نسخ</button></div>
    <div class="field"><label>اسم المحوّل كما هو مكتوب في الوصل</label><input id="rc-name" placeholder="الاسم واللقب"/></div>
    <div class="field"><label>تاريخ التحويل</label><input id="rc-date" type="date"/></div>
    <div class="field"><label>صورة الوصل (JPG / PNG / PDF — حتى 5 ميغا)</label><input id="rc-file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"/></div>
    <div id="rc-msg"></div>
    <button class="btn btn-p" style="width:100%" onclick="uploadReceipt()">رفع الوصل — مشفّر وآمن</button>
    <p style="text-align:center;margin-top:12px"><a href="#/billing" style="font-size:12px;color:var(--dim)">رجوع للباقات</a></p>
  </div>`;
}
function copyRef(btn) { navigator.clipboard.writeText(state.summary.pending_order.reference).then(() => { btn.textContent = "تم"; setTimeout(() => (btn.textContent = "نسخ"), 1400); }); }
async function uploadReceipt() {
  const msg = $("#rc-msg");
  const file = $("#rc-file").files[0];
  if (!file) { msg.innerHTML = '<div class="err">اختر ملف الوصل أولاً</div>'; return; }
  const fd = new FormData();
  fd.append("file", file);
  fd.append("transfer_name", $("#rc-name").value);
  fd.append("transfer_date", $("#rc-date").value);
  msg.innerHTML = '<div class="ok">جارٍ التشفير والرفع…</div>';
  try {
    await api("/api/payments/orders/" + state.summary.pending_order.id + "/receipt", { method: "POST", body: fd });
    toast("وصلك مُرفع ومشفّر — قيد المراجعة");
    location.hash = "#/dashboard";
  } catch (e) {
    msg.innerHTML = `<div class="err">${esc(e.message)}</div>`;
  }
}

/* ——— الإدارة ——— */
async function renderAdmin(tab) {
  tab = tab || "payments";
  let s;
  try { s = await api("/api/me/summary"); } catch (e) { location.hash = "#/login"; return; }
  if (s.user.role !== "admin") { location.hash = "#/dashboard"; return; }
  const nav = `<a href="#/dashboard">زبائني</a><a href="#/billing">الباقات</a><a href="#/admin" style="color:#fff">الإدارة</a><a href="#" onclick="doLogout()">خروج</a>`;

  app.innerHTML = `${header(nav, { bottom: true, role: s.user.role, active: "admin" })}
  <div class="wrap app">
    <div class="app-hd"><div><h1>لوحة الإدارة</h1><div class="sub">مراجعة الدفعات وإدارة النظام — كل فعل مُوثّق</div></div>
    <div class="tabs"><button class="${tab === "payments" ? "on" : ""}" onclick="renderAdmin('payments')">المدفوعات</button><button class="${tab === "stats" ? "on" : ""}" onclick="renderAdmin('stats')">إحصاءات</button><button class="${tab === "users" ? "on" : ""}" onclick="renderAdmin('users')">المستخدمون</button></div></div>
    <div id="admin-area">جارٍ التحميل…</div>
  </div>`;

  const area = $("#admin-area");
  if (tab === "payments") {
    const d = await api("/api/admin/payments?status=submitted");
    area.innerHTML = d.payments.length
      ? `<div class="tbl-wrap card" style="padding:8px"><table class="tbl">
          <tr><th>المستخدم</th><th>الباقة</th><th>المبلغ</th><th>المرجع</th><th>المحوّل / التاريخ</th><th>الوصل</th><th>قرار</th></tr>
          ${d.payments.map((p) => `<tr>
            <td data-label="المستخدم"><b>${esc(p.name)}</b><br/><small style="color:var(--dim)">${esc(p.email)}</small>${p.risk_flag ? '<br/><span class="tag r" style="margin-top:4px">نمط مكرر — تحقّق</span>' : ""}</td>
            <td data-label="الباقة">${esc(planName(p.plan_id))}</td><td data-label="المبلغ">${dzd(p.amount_dzd)}</td><td dir="ltr"><b>${esc(p.reference)}</b></td>
            <td data-label="المرجع">${esc(p.transfer_name ?? "—")}<br/><small style="color:var(--dim)" dir="ltr">${esc(p.transfer_date ?? "")}</small></td>
            <td data-label="المحوّل / التاريخ">${p.filename ? `<a class="btn btn-g btn-sm" href="/api/admin/payments/${p.id}/receipt" target="_blank">عرض الوصل</a>` : "—"}</td>
            <td style="white-space:nowrap">
              <button class="btn btn-p btn-sm" onclick="decide('${p.id}','approve')">اعتماد</button>
              <button class="btn btn-d btn-sm" onclick="decideReject('${p.id}')">رفض</button>
            </td></tr>`).join("")}
        </table></div>`
      : `<div class="card" style="text-align:center;padding:40px;color:var(--sub)">لا مدفوعات قيد المراجعة</div>`;
  } else if (tab === "stats") {
    const d = await api("/api/admin/stats");
    area.innerHTML = `<div class="stat-grid">
      <div class="stat"><b>${d.users}</b><small>مستخدم مسجّل</small></div>
      <div class="stat"><b>${d.active_paid_subscriptions}</b><small>اشتراكات مدفوعة نشطة</small></div>
      <div class="stat"><b>${d.payments_pending_review}</b><small>مدفوعات قيد المراجعة</small></div>
      <div class="stat"><b>${d.clients_last_72h}</b><small>زبائن آخر 72 ساعة</small></div>
      <div class="stat"><b>${d.total_deliveries}</b><small>إجمالي التسليمات</small></div>
    </div>
    <div class="card" style="font-size:12px;color:var(--sub);line-height:2">
      <b style="color:#fff">استقبال الزبائن من الموصلات الرسمية</b><br/>
      POST /api/ingest — ترويسة <b dir="ltr">X-Ingest-Token</b> — كل عنصر: title, excerpt, author_public, platform, source_url, keyword, published_at.
      القاعدة: الجديد فقط (72 ساعة) والرابط فريد إلزامي.
    </div>`;
  } else {
    const d = await api("/api/admin/users");
    area.innerHTML = `<div class="tbl-wrap card" style="padding:8px"><table class="tbl">
      <tr><th>المستخدم</th><th>الباقة</th><th>الحالة</th><th>التجديد</th><th>منذ</th></tr>
      ${d.users.map((u) => `<tr><td data-label="المستخدم"><b>${esc(u.name)}</b><br/><small style="color:var(--dim)">${esc(u.email)}</small>${u.role === "admin" ? ' <span class="tag v">إدارة</span>' : ""}</td>
      <td data-label="الباقة">${esc(planName(u.plan_id))}</td><td data-label="الحالة">${u.sub_status === "active" ? '<span class="tag g">نشط</span>' : '<span class="tag gr">—</span>'}</td>
      <td data-label="التجديد">${u.renews_at ? new Date(u.renews_at).toLocaleDateString("ar-DZ") : "—"}</td><td data-label="منذ">${relTime(u.created_at)}</td></tr>`).join("")}
    </table></div>`;
  }
}
function planName(id) { return { free: "انطلاقة", growth: "نمو", pro: "محترف" }[id] || id || "—"; }
async function decide(orderId, decision, reason) {
  try {
    await api("/api/admin/payments/" + orderId + "/decision", { method: "POST", body: JSON.stringify({ decision, reason }) });
    toast(decision === "approve" ? "تم الاعتماد وتفعيل الاشتراك" : "تم الرفض");
    renderAdmin("payments");
  } catch (e) { toast(e.message, false); }
}
function decideReject(orderId) {
  const reason = prompt("سبب الرفض (إلزامي، يُسجَّل في التدقيق):");
  if (reason && reason.trim().length >= 4) decide(orderId, "reject", reason.trim());
}

/* ——— القانوني ——— */
function renderLegal() {
  app.innerHTML = `${header(`<a href="#/">الرئيسية</a>`)}
  <div class="wrap" style="max-width:760px;padding-top:90px;padding-bottom:60px">
    <h1 style="font-size:24px;margin-bottom:18px">الشروط وسياسة الخصوصية</h1>
    <div class="card" style="font-size:13px;color:var(--sub);line-height:2.1">
      <b style="color:#fff">1. الخدمة</b><br/>
      مِرسال خدمة توصيل فرص عمل (زبائن جاهزين) للفريلانسر والتجار الجزائريين، من محتوى عام عبر واجهات رسمية. نتائج الخدمة تعتمد على السوق؛ لا نضمن عقوداً محددة.<br/><br/>
      <b style="color:#fff">2. الدفع والفوترة</b><br/>
      الدفع بالتحويل البريدي (CCP) إلى الحساب المعروض في صفحة الاشتراك. كل طلب يحمل مرجعاً فريداً يجب كتابته في التحويل. يُرفع الوصل عبر المنصة (مشفّراً)، ويُعتمد من الإدارة خلال مدة معقولة. الاشتراك شهري قابل للإلغاء — لا تجديد إجباري آلي.<br/><br/>
      <b style="color:#fff">3. منع الاحتيال</b><br/>
      كل وصل يُقبل مرة واحدة فقط (بصمة رقمية فريدة). أي محاولة استعمال وصل مرتين أو ادّعاء تحويل بلا مرجع مطابق تُرفض، وقد يؤدي إلى إغلاق الحساب. القرارات النهائية بشرية مُوثَّقة ومُسبَّبة.<br/><br/>
      <b style="color:#fff">4. الخصوصية والاحتفاظ بالبيانات</b><br/>
      نجمع: بريدك، اسمك، ملف تخصصك، سجلات الاستعمال، وصور الوصولات (مشفرة). الزبائن الموصَّلون بيانات عامة منشورة طوعاً مع مصدرهم، وتُحذف آلياً بعد 72 ساعة. لا نبيع بياناتك ولاأي طرف ثالث تسويقياً. توافق مع قانون 18-07 الجزائري المتعلق بحماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي.<br/><br/>
      <b style="color:#fff">5. الاستعمال المقبول</b><br/>
      يُمنع التواصل المزعج أو التكرار المضايق مع العملاء الموصَّلين. الحساب المخالف يُعلَّق دون استرجاع.<br/><br/>
      <b style="color:#fff">6. المسؤولية</b><br/>
      الخدمة مقدمة «كما هي». مسؤوليتنا محدودة بقيمة الاشتراك المدفوع.
    </div>
  </div>
  <footer><div class="wrap"><span>© 2026 مِرسال</span><span><a href="#/register">إنشاء حساب</a></span></div></footer>`;
}

/* ——— الراوتر ——— */
async function doLogout() { try { await api("/api/auth/logout", { method: "POST" }); } catch (e) {} location.hash = "#/"; }
async function boot() {
  const hash = location.hash || "#/";
  const route = hash.replace("#/", "").split("?")[0];
  state.csrf = getCookie("mirsal_csrf");

  const publicRoutes = ["", "login", "register", "legal"];
  if (publicRoutes.includes(route)) {
    if (route === "login") return renderLogin();
    if (route === "register") return renderRegister();
    if (route === "legal") return renderLegal();
    // زائر على الرئيسية: إن كان مسجلاً وجّهه للوحة
    try { await api("/api/me/summary"); location.hash = "#/dashboard"; return; } catch (e) { renderHome(); return; }
  }
  if (route === "dashboard") return renderDashboard();
  if (route === "onboarding") return renderOnboarding();
  if (route === "billing") return renderBilling();
  if (route === "admin") return renderAdmin();
  renderHome();
}
window.addEventListener("hashchange", boot);
window.addEventListener("DOMContentLoaded", boot);
window.doLogin = doLogin; window.doRegister = doRegister; window.doLogout = doLogout;
window.copyText = copyText; window.copyRef = copyRef; window.clientAct = clientAct; window.loadClients = loadClients;
window.createOrder = createOrder; window.uploadReceipt = uploadReceipt;
window.renderAdmin = renderAdmin; window.decide = decide; window.decideReject = decideReject;
window.setProf = setProf; window.runRadar = runRadar;
