/* ═══════════ NEXUS — تطبيق التجار (SPA موبايل أولاً) ═══════════ */
"use strict";

/* ───────── i18n ───────── */
const T = {
  ar: {
    tagline: "سوق التجار", home: "الرئيسية", explore: "استكشاف", mystore: "متجري", account: "حسابي",
    search_ph: "ابحث عن منتج أو متجر…", all: "الكل", order_now: "اطلب الآن", cod: "الدفع عند الاستلام",
    currency: "دج", add_cart_hint: "اطلب الآن — التوصيل لكل الولايات", view_store: "زيارة المتجر",
    share: "مشاركة", open_store: "فتح المتجر", quantity: "الكمية", full_name: "الاسم الكامل",
    phone: "رقم الهاتف", wilaya: "الولاية", commune: "البلدية", address: "العنوان الكامل",
    delivery: "طريقة التوصيل", home_delivery: "للمنزل", desk_delivery: "مكتب التوصيل", note: "ملاحظة (اختياري)",
    confirm_order: "تأكيد الطلب", order_success: "تم استلام طلبك!", order_success_sub: "سيتصل بك التاجر لتأكيد الطلبية قريباً.",
    order_id: "رقم الطلب", close: "إغلاق", done: "تم",
    login: "دخول", register: "حساب جديد", email: "البريد الإلكتروني", password: "كلمة السر",
    your_name: "اسمك", store_slug: "رابط متجرك", store_name: "اسم المتجر", create_account: "إنشاء الحساب",
    have_account: "لدي حساب", no_account: "ليس لدي حساب", slug_hint: "أحرف إنجليزية صغيرة وأرقام و- فقط",
    wrong_creds: "بيانات غير صحيحة", exists: "البريد أو الرابط مستعمل مسبقاً", logged_in: "مرحباً بك في NEXUS",
    logged_out: "تم الخروج", saved: "تم الحفظ", copied: "تم النسخ",
    dash: "لوحة متجري", overview: "نظرة عامة", products: "المنتجات", orders: "الطلبيات", finance: "المالية", settings: "الإعدادات",
    new_orders: "طلبيات جديدة", revenue: "إيرادات مؤكدة", net: "الصافي", pending: "قيد التنفيذ", expenses: "المصاريف",
    add_product: "إضافة منتج", edit_product: "تعديل المنتج", product_title: "اسم المنتج", description: "الوصف",
    price: "السعر", compare_at: "السعر قبل التخفيض", image_url: "رابط الصورة (https)", category: "الصنف",
    featured: "منتج مميز", save: "حفظ", delete: "حذف", confirm_delete: "حذف نهائي؟", cancel: "إلغاء",
    no_products: "لا منتجات بعد", no_products_sub: "أضف أول منتج ليظهر في متجرك وفي سوق NEXUS.",
    st_new: "جديد", st_confirmed: "مؤكد", st_shipped: "قيد التوصيل", st_delivered: "مسلّم", st_cancelled: "ملغى",
    customer: "الزبون", order_details: "تفاصيل الطلبية", call: "اتصال", whatsapp: "واتساب", mark: "تحديث الحالة",
    income_note: "الإيرادات تُحسب من الطلبيات المسلَّمة", add_expense: "إضافة مصروف", expense_label: "بيان المصروف",
    amount: "المبلغ", my_store_link: "رابط متجري", language: "اللغة", logout: "تسجيل الخروج",
    onb1_t: "سوق يجلب لك الزبائن", onb1_d: "منتجاتك تظهر أمام آلاف المشترين في فيد NEXUS — حركة زوار مشتركة لكل تاجر.",
    onb2_t: "متجرك برابط مستقل", onb2_d: "رابط سريع أنيق توجه إليه زبائن إعلاناتك، مع استمارة طلب سهلة والدفع عند الاستلام.",
    onb3_t: "طلبياتك وأرباحك في مكان", onb3_d: "تابع طلبياتك خطوة بخطوة وراقب أرباحك ومصاريفك بلوحة حية.",
    start_now: "ابدأ الآن", skip: "تخطي", welcome: "أهلاً بك", empty_feed_t: "السوق ينبض قريباً",
    empty_feed_d: "كن أول تاجر يعرض منتجاته هنا — سوقك بانتظارك.", load_more: "المزيد", loading: "جارٍ التحميل…",
    no_results: "لا نتائج", no_results_sub: "جرّب كلمة أخرى أو صنفاً مختلفاً.", categories: "الأصناف",
    cat_mode: "أزياء", cat_beauty: "تجميل", cat_electronics: "إلكترونيات", cat_home: "منزل", cat_kids: "أطفال",
    cat_food: "طعام", cat_sport: "رياضة", cat_other: "أخرى", stock_left: "المتوفر", out_stock: "نفدت الكمية",
    req_field: "أكمل الحقول المطلوبة", bad_phone: "رقم هاتف غير صحيح", sending: "جارٍ الإرسال…",
    place_order_title: "إتمام الطلب", total: "الإجمالي", qty: "الكمية",
    demo: "عرض", share_store: "شارك رابط متجرك", copied_link: "نُسخ رابط متجرك",
    ask_agent: "اسأل مساعد المتجر", agent_welcome: "أهلاً! أنا المساعد الذكي للمتجر — اسألني عن أي منتج أو سعر أو توصيل.",
    agent_send_ph: "اكتب سؤالك…", agent_off: "المساعد الذكي متوقف حالياً — تواصل مع التاجر عبر الطلبية.",
    agent_handoff: "سؤالك وصل للتاجر وسيرد عليك بنفسه.", plan: "الباقة", credits: "أرصدة منتجات إضافية",
    quota_today: "محادثات اليوم", plan_free: "مجانية", plan_pro: "احترافية", plan_vip: "نخبة VIP",
    verified_badge: "موثّق", agent_tab: "الوكيل", agent_sessions: "جلسات الزبائن", no_sessions: "لا جلسات بعد",
    session_close: "إغلاق الجلسة", closed_s: "مغلقة", open_s: "مفتوحة", upgrade_note: "الترقية من لوحة المالك",
    limit_reached: "وصلت حد باقتك — أضف رصيداً أو رقِّ باقتك",
    ai_desc: "صياغة الوصف بالوكيل", ai_descing: "الوكيل يصيغ…", ai_desc_fail: "الوكيل غير متاح الآن", ai_desc_ok: "الوصف جاهز",
    notif: "الإشعارات", notif_empty: "لا إشعارات بعد", notif_mark: "تعليم الكل كمقروء",
    n_order: "طلبية جديدة", n_agent: "جلسة وكيل جديدة", n_grant: "تحديث باقتك", need_keys: "الوكيل ينتظر مفاتيح المالك",
    ads_tab: "الفيديوهات", ads_hero_t: "فيديوهات إعلانية تبيع عنك", ads_hero_s: "من استوديو VITO BYTE — لقطات سينمائية لمنتجاتك جاهزة لفيسبوك وإنستغرام وتيك توك.",
    your_disc: "خصم باقتك", order_vid: "اطلب الفيديو", vid_note: "ملاحظات للاستوديو (اختياري)", vid_product: "المنتج المميز (اختياري)",
    send_order: "إرسال عبر واتساب", my_vids: "طلباتي", no_vids: "لا طلبات بعد", order_ok: "طلبك سجل — أكمل المحادثة في واتساب",
    wa_ask: "استفسر عن الفيديوهات على واتساب", wa_open_fail: "افتح واتساب ومراسلة: 0777 84 56 35",
    st_new: "جديد", st_wip: "قيد التنفيذ", st_done: "جاهز", watch_vid: "شاهد الفيديو", pick_product: "بلا منتج — عام",
    s_quick: "عرض منتج سريع", d_quick: "دوران المنتج مع نص متحرك وسعر لافت", s_lifestyle: "لايف ستايل", d_lifestyle: "المنتج في يوميات حقيقية يبيع إحساساً لا شيئاً",
    s_sale: "عرض وتخفيضات", d_sale: "نداء بيع حاد بالسعر القديم والجديد والمؤقت", s_lux: "فخامة سينمائية", d_lux: "إضاءة وظلال ذهبية للمنتجات الغالية",
    s_intro: "افتتاح المتجر", d_intro: "تعريف بمتجرك كامل ومنتجاتك الأقوى في فيديو واحد",
    recep: "مساعد المنصة", recep_hello: "أهلاً! أنا استقبال نيكسوس — اسألني: كيف تفتح متجراً؟ إيش الباقات؟ كيف يوصل الطلب؟",
    org_btn: "رتّب منتجي بالوكيل", orging: "الوكيل يرتب…", org_ok: "اقتراحات الوكيل طُبقت", org_tips: "نصائح الوكيل",
    ready: "جاهزية النشر", pro_tab: "المحترفون", pro_hero: "محترفو ناكساب في خدمة متجرك",
    pro_sub: "كتالوج موثّق من ناكساب: هويات ومواقع ومونتاج — الطلب والدفع عبر محفظة ناكساب المؤتمتة.",
    pro_open: "اطلب من ناكساب", pro_empty: "الكتالوج ينبض قريباً — موثقو ناكساب أول من يظهر",
    nk_field: "اسمك في ناكساب (لخصم العضوية)", nk_check: "تحقق", nk_ok: "خصم العضوية مطبق", nk_no: "لا عضوية نشطة بهذا الاسم", apply_org: "طبّق الاقتراحات",
  },
  en: {
    tagline: "Merchant Market", home: "Home", explore: "Explore", mystore: "My Store", account: "Account",
    search_ph: "Search products or stores…", all: "All", order_now: "Order now", cod: "Cash on delivery",
    currency: "DZD", add_cart_hint: "Order now — delivered nationwide", view_store: "Visit store",
    share: "Share", open_store: "Open store", quantity: "Quantity", full_name: "Full name",
    phone: "Phone number", wilaya: "Wilaya", commune: "Commune", address: "Full address",
    delivery: "Delivery method", home_delivery: "Home delivery", desk_delivery: "Pick-up desk", note: "Note (optional)",
    confirm_order: "Confirm order", order_success: "Order received!", order_success_sub: "The merchant will call you shortly to confirm.",
    order_id: "Order ID", close: "Close", done: "Done",
    login: "Log in", register: "Sign up", email: "Email", password: "Password",
    your_name: "Your name", store_slug: "Store link", store_name: "Store name", create_account: "Create account",
    have_account: "I have an account", no_account: "Create one", slug_hint: "lowercase letters, numbers and - only",
    wrong_creds: "Invalid credentials", exists: "Email or link already used", logged_in: "Welcome to NEXUS",
    logged_out: "Signed out", saved: "Saved", copied: "Copied",
    dash: "My store", overview: "Overview", products: "Products", orders: "Orders", finance: "Finance", settings: "Settings",
    new_orders: "New orders", revenue: "Confirmed revenue", net: "Net", pending: "In progress", expenses: "Expenses",
    add_product: "Add product", edit_product: "Edit product", product_title: "Product title", description: "Description",
    price: "Price", compare_at: "Price before discount", image_url: "Image URL (https)", category: "Category",
    featured: "Featured", save: "Save", delete: "Delete", confirm_delete: "Delete permanently?", cancel: "Cancel",
    no_products: "No products yet", no_products_sub: "Add your first product to appear in your store and the NEXUS market.",
    st_new: "New", st_confirmed: "Confirmed", st_shipped: "Shipping", st_delivered: "Delivered", st_cancelled: "Cancelled",
    customer: "Customer", order_details: "Order details", call: "Call", whatsapp: "WhatsApp", mark: "Update status",
    income_note: "Revenue counts delivered orders", add_expense: "Add expense", expense_label: "Expense label",
    amount: "Amount", my_store_link: "My store link", language: "Language", logout: "Log out",
    onb1_t: "A market that brings buyers", onb1_d: "Your products appear to thousands of shoppers in the NEXUS feed — shared traffic for every merchant.",
    onb2_t: "Your own store link", onb2_d: "A fast elegant link for your ad traffic, with an easy order form and cash on delivery.",
    onb3_t: "Orders & profit in one place", onb3_d: "Track every order step by step and watch profit and expenses live.",
    start_now: "Start now", skip: "Skip", welcome: "Welcome", empty_feed_t: "The market awakens soon",
    empty_feed_d: "Be the first merchant to showcase here — your market awaits.", load_more: "More", loading: "Loading…",
    no_results: "No results", no_results_sub: "Try another word or category.", categories: "Categories",
    cat_mode: "Fashion", cat_beauty: "Beauty", cat_electronics: "Electronics", cat_home: "Home", cat_kids: "Kids",
    cat_food: "Food", cat_sport: "Sport", cat_other: "Other", stock_left: "In stock", out_stock: "Out of stock",
    req_field: "Fill the required fields", bad_phone: "Invalid phone number", sending: "Sending…",
    place_order_title: "Complete order", total: "Total", qty: "Qty",
    demo: "Demo", share_store: "Share your store link", copied_link: "Store link copied",
    ask_agent: "Ask the store assistant", agent_welcome: "Hi! I'm the store's smart assistant — ask me about any product, price or delivery.",
    agent_send_ph: "Type your question…", agent_off: "Assistant is offline — reach the merchant via an order.",
    agent_handoff: "Your question reached the merchant — they'll reply themselves.", plan: "Plan", credits: "Extra product credits",
    quota_today: "Today's chats", plan_free: "Free", plan_pro: "Pro", plan_vip: "VIP",
    verified_badge: "Verified", agent_tab: "Agent", agent_sessions: "Customer sessions", no_sessions: "No sessions yet",
    session_close: "Close session", closed_s: "Closed", open_s: "Open", upgrade_note: "Upgrade via owner console",
    limit_reached: "Plan limit reached — add credits or upgrade",
    ai_desc: "AI write description", ai_descing: "Agent writing…", ai_desc_fail: "Agent unavailable", ai_desc_ok: "Description ready",
    notif: "Notifications", notif_empty: "No notifications yet", notif_mark: "Mark all read",
    n_order: "New order", n_agent: "New agent session", n_grant: "Plan updated", need_keys: "Agent awaits owner keys",
    ads_tab: "Video ads", ads_hero_t: "Ad videos that sell for you", ads_hero_s: "By VITO BYTE studio — cinematic product cuts ready for Facebook, Instagram & TikTok.",
    your_disc: "Your plan discount", order_vid: "Order this video", vid_note: "Notes for the studio (optional)", vid_product: "Featured product (optional)",
    send_order: "Send via WhatsApp", my_vids: "My orders", no_vids: "No orders yet", order_ok: "Order saved — continue the chat on WhatsApp",
    wa_ask: "Ask about video ads on WhatsApp", wa_open_fail: "Open WhatsApp and message: 0777 84 56 35",
    st_new: "New", st_wip: "In progress", st_done: "Ready", watch_vid: "Watch video", pick_product: "No product — generic",
    s_quick: "Quick product spot", d_quick: "Rotating product with animated text and price", s_lifestyle: "Lifestyle", d_lifestyle: "Your product in real daily life — selling a feeling",
    s_sale: "Sale blast", d_sale: "Hard-selling call with old/new limited price", s_lux: "Cinematic luxury", d_lux: "Golden lighting and shadows for premium items",
    s_intro: "Store intro", d_intro: "Introduce your whole store and top products in one video",
    recep: "Platform assistant", recep_hello: "Hi! I'm NEXUS reception — ask me: how to open a store? What are the plans? How does delivery work?",
    org_btn: "Organize my product with AI", orging: "Agent organizing…", org_ok: "Agent suggestions applied", org_tips: "Agent tips",
    ready: "Publish readiness", pro_tab: "Pros", pro_hero: "NAKSAB pros for your store",
    pro_sub: "Verified catalog from NAKSAB: branding, websites, video editing — order & pay via the automated NAKSAB wallet.",
    pro_open: "Order on NAKSAB", pro_empty: "Catalog awakens soon — verified NAKSAB pros appear first",
    nk_field: "Your NAKSAB username (member discount)", nk_check: "Check", nk_ok: "Member discount applied", nk_no: "No active membership for this name", apply_org: "Apply suggestions",
  },
};

/* ───────── حالة ───────── */
const S = {
  lang: localStorage.getItem("nx_lang") || "ar",
  csrf: sessionStorage.getItem("nx_csrf") || "",
  user: null,
  dz: null,
  route: { name: "home" },
  feedDone: false,
};
const t = (k) => T[S.lang][k] ?? T.ar[k] ?? k;
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => new Intl.NumberFormat(S.lang === "ar" ? "ar-DZ" : "en-US").format(Math.round(n || 0)) + " " + t("currency");
const fdate = (ts) => new Date(ts).toLocaleDateString(S.lang === "ar" ? "ar-DZ" : "en-GB", { day: "numeric", month: "short" });
const CATS = ["mode", "beauty", "electronics", "home", "kids", "food", "sport", "other"];
const catName = (c) => t("cat_" + (CATS.includes(c) ? c : "other"));
const vibrate = (p = 8) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

/* ───────── API ───────── */
async function api(path, opts = {}) {
  const headers = { "content-type": "application/json", ...(opts.headers || {}) };
  if (S.csrf) headers["x-csrf"] = S.csrf;
  const res = await fetch(path, { method: opts.method || "GET", headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  let data = {};
  try { data = await res.json(); } catch {}
  if (res.status === 401) throw { status: res.status, ...data };
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

/* k0 = PBKDF2-SHA256(كلمة السر، الملح=البريد) — 200k جولة في المتصفح */
async function k0of(email, password) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: enc.encode("nexus:c1:" + email.toLowerCase()), iterations: 200000 }, key, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ضغط الصورة في المتصفح ثم رفعها للمنصة (KV) — رابط جاهز فوراً */
async function compressImage(file, maxDim = 1280, quality = 0.82) {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    if (typeof OffscreenCanvas === "function") {
      const c = new OffscreenCanvas(w, h);
      c.getContext("2d").drawImage(bmp, 0, 0, w, h);
      return c.convertToBlob({ type: "image/jpeg", quality });
    }
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d").drawImage(bmp, 0, 0, w, h);
    return await new Promise((res) => c.toBlob((b) => res(b || file), "image/jpeg", quality));
  } catch {
    return file; /* يرفضه الخادم إن تجاوز السقف — بلا انهيار */
  }
}
async function uploadImage(file) {
  const blob = await compressImage(file);
  const res = await fetch("/api/media", {
    method: "POST", credentials: "same-origin",
    headers: { "content-type": "image/jpeg", ...(S.csrf ? { "x-csrf": S.csrf } : {}) },
    body: blob,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, ...data };
  return data.url;
}

/* ───────── أدوات UI ───────── */
function toast(msg, kind = "ok") {
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.innerHTML = `${kind === "ok"
    ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
    : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9.2"/><path d="M12 7.5v5.5M12 16.6v.2"/></svg>'}${esc(msg)}`;
  $("#toast-root").appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 400); }, 2400);
}

function ripple(ev) {
  const b = ev.currentTarget;
  const r = document.createElement("span");
  const rect = b.getBoundingClientRect();
  const d = Math.max(rect.width, rect.height);
  r.className = "ripple";
  r.style.cssText = `width:${d}px;height:${d}px;left:${(ev.clientX || rect.width / 2) - rect.left - d / 2}px;top:${(ev.clientY || rect.height / 2) - rect.top - d / 2}px`;
  b.appendChild(r);
  setTimeout(() => r.remove(), 650);
}
document.addEventListener("click", (e) => { const b = e.target.closest(".btn, .icon-btn, .chip, .tab"); if (b) ripple({ currentTarget: b, clientX: e.clientX, clientY: e.clientY }); });

function countUp(el, target, dur = 900) {
  const start = performance.now();
  const fmt = (v) => new Intl.NumberFormat(S.lang === "ar" ? "ar-DZ" : "en-US").format(Math.round(v));
  const step = (now) => {
    const p = Math.min(1, (now - start) / dur);
    el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function confetti(host) {
  const colors = ["#7a5cff", "#2ad4f6", "#3ddc97", "#ffb454", "#ff6b6b"];
  for (let i = 0; i < 26; i++) {
    const c = document.createElement("i");
    c.className = "confetti";
    c.style.cssText = `background:${colors[i % 5]};--dx:${(Math.random() - 0.5) * 190}px;--dy:${-40 - Math.random() * 130}px;animation-delay:${Math.random() * 0.18}s`;
    host.appendChild(c);
  }
  setTimeout(() => $$(".confetti", host).forEach((c) => c.remove()), 1600);
}

function sheet(html, { onOpen } = {}) {
  const root = $("#sheet-root");
  const wrap = document.createElement("div");
  wrap.className = "sheet-wrap";
  wrap.innerHTML = `<div class="sheet-bd"></div><div class="sheet"><div class="grabber"></div><div class="sheet-body">${html}</div></div>`;
  root.appendChild(wrap);
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add("open")));
  const close = () => {
    wrap.classList.remove("open");
    const sh = $(".sheet", wrap);
    sh.style.transform = `translateY(${Math.min(80, sh.getBoundingClientRect().height / 3)}px)`;
    setTimeout(() => wrap.remove(), 420);
  };
  $(".sheet-bd", wrap).onclick = close;
  /* سحب لأسفل للإغلاق */
  const sh = $(".sheet", wrap);
  const gr = $(".grabber", wrap);
  let y0 = null, dy = 0;
  gr.addEventListener("pointerdown", (e) => { y0 = e.clientY; sh.classList.add("grab"); gr.setPointerCapture(e.pointerId); });
  gr.addEventListener("pointermove", (e) => {
    if (y0 === null) return;
    dy = Math.max(0, e.clientY - y0);
    sh.style.transform = `translateY(${dy}px)`;
  });
  gr.addEventListener("pointerup", () => {
    sh.classList.remove("grab");
    if (dy > 90) close(); else { sh.style.transform = ""; }
    y0 = null; dy = 0;
  });
  onOpen && onOpen(wrap, close);
  vibrate(6);
  return { wrap, close };
}

const imgTag = (src, cls = "", alt = "") =>
  `<img ${cls} src="${esc(src)}" alt="${esc(alt)}" loading="lazy" onload="this.classList.add('ld')" onerror="this.src='/icon.png'">`;

/* ───────── الراوتر ───────── */
const routes = [];
const rr = (pat, fn) => routes.push({ pat: pat.split("/").filter(Boolean), fn });
function go(hash) { if (location.hash === hash) render(true); else location.hash = hash; }

let renderChain = Promise.resolve(), lastRendered = null;
function render(force = false) {
  renderChain = renderChain
    .then(async () => {
      const hash = location.hash.replace(/^#/, "") || "/onb-check";
      if (!force && hash === lastRendered) return;
      lastRendered = hash;
      const parts = hash.split("/").filter(Boolean);
      let matched = null, params = {};
      for (const r of routes) {
        if (r.pat.length !== parts.length) continue;
        let ok = true; params = {};
        for (let i = 0; i < r.pat.length; i++) {
          if (r.pat[i].startsWith(":")) params[r.pat[i].slice(1)] = decodeURIComponent(parts[i]);
          else if (r.pat[i] !== parts[i]) { ok = false; break; }
        }
        if (ok) { matched = r; break; }
      }
      const view = $("#view");
      const vt = typeof document.startViewTransition === "function" && !(typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
      const doRender = async () => {
        window.scrollTo?.(0, 0); view.scrollTop = 0;
        view.innerHTML = "";
        view.className = "view-in";
        if (matched) await matched.fn(view, params);
        else { lastRendered = null; location.hash = "#/"; }
      };
      if (vt) await Promise.resolve(document.startViewTransition(doRender).finished).catch(() => {});
      else await doRender();
      updateTabbar(parts[0] || "");
    })
    .catch((e) => { console.error("render:", e); });
  return renderChain;
}

/* ───────── الشريط السفلي ───────── */
const TABS = [
  { id: "home", icon: '<path d="M3 10.5 12 3l9 7.5V21h-6v-6h-6v6H3z"/>', route: "#/" },
  { id: "explore", icon: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', route: "#/explore" },
  { id: "mystore", icon: '<path d="M4 7h16l-1.2 13H5.2zM8 7a4 4 0 0 1 8 0"/>', route: "#/dash" },
  { id: "account", icon: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-5.5 8-5.5s6.5 1.5 8 5.5"/>', route: "#/account" },
];
function buildTabbar(visible = true) {
  const nav = $("#tabbar");
  if (!nav) return;
  if (!nav.innerHTML) {
    nav.innerHTML = TABS.map((tb) => `
      <button class="tab" data-tab="${tb.id}" data-route="${tb.route}">
        <span class="pill"></span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${tb.icon}</svg>
        <span>${esc(t(tb.id))}</span>
      </button>`).join("");
    $$(".tab", nav).forEach((b) => (b.onclick = () => { vibrate(5); go(b.dataset.route); }));
  }
  nav.classList.toggle("hidden", !visible);
}
function updateTabbar(section) {
  const map = { "": "home", explore: "explore", s: "home", p: "home", dash: "mystore", account: "account", auth: "account", adm: "account" };
  const active = map[section] ?? "home";
  $$(".tab").forEach((b) => b.classList.toggle("on", b.dataset.tab === active));
}

/* ───────── القاعدة المشتركة ───────── */
function topbar(title, right = "") {
  return `<header class="top">
    <span class="brand" onclick="go('#/')">NEXUS</span>
    <span class="sp"></span>${title ? `<span class="title">${esc(title)}</span><span class="sp"></span>` : ""}${right}
  </header>`;
}
function productCard(p, i = 0) {
  const off = p.compare_at > p.price ? Math.round((1 - p.price / p.compare_at) * 100) : 0;
  return `<a class="p-card" href="#/p/${esc(p.id)}" style="animation-delay:${Math.min(i * 55, 500)}ms">
    ${off ? `<span class="badge-off">-${off}%</span>` : ""}
    ${p.featured ? '<span class="badge-feat"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z"/></svg></span>' : ""}
    <div class="ph">${imgTag(p.image, "", p.title)}</div>
    <div class="meta">
      <div class="ttl">${esc(p.title)}</div>
      <div class="row"><span class="price">${money(p.price)}</span>${p.compare_at > p.price ? `<span class="compare">${money(p.compare_at)}</span>` : ""}</div>
      ${p.store_slug ? `<div class="store-line">${p.store_logo ? imgTag(p.store_logo) : ""}<span>${esc(p.store_name || "")}</span></div>` : ""}
    </div>
  </a>`;
}
const skeletons = (n = 6) => `<div class="grid">${Array.from({ length: n }, () => '<div class="skel"><div class="ph"></div><div class="ln" style="width:80%"></div><div class="ln" style="width:45%"></div></div>').join("")}</div>`;

/* ═══════════ الشاشات ═══════════ */

/* الترحيب */
rr("/onb-check", async (v) => {
  buildTabbar(false);
  if (localStorage.getItem("nx_seen") || $("#onb")) { location.hash = "#/"; return; }
  const art = (inner) => `<div class="onb-art">${inner}</div>`;
  v.parentElement.insertAdjacentHTML("beforeend", `
  <div class="onb" id="onb">
    <div class="onb-track" id="onb-track">
      <div class="onb-slide">${art('<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#x1)" stroke-width="1.6"><defs><linearGradient id="x1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a5cff"/><stop offset="1" stop-color="#2ad4f6"/></linearGradient></defs><path d="M4 5h2l2.2 11.2A2 2 0 0 0 10.2 18h7.9a2 2 0 0 0 2-1.6L21.6 9H6.2M10 21.5h.01M17 21.5h.01"/></svg>')}
        <h2>${esc(t("onb1_t"))}</h2><p>${esc(t("onb1_d"))}</p></div>
      <div class="onb-slide">${art('<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#x2)" stroke-width="1.6"><defs><linearGradient id="x2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a5cff"/><stop offset="1" stop-color="#2ad4f6"/></linearGradient></defs><path d="M3 9 5 3h14l2 6M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9M3 9h18M9 21v-6h6v6"/></svg>')}
        <h2>${esc(t("onb2_t"))}</h2><p>${esc(t("onb2_d"))}</p></div>
      <div class="onb-slide">${art('<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#x3)" stroke-width="1.6"><defs><linearGradient id="x3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a5cff"/><stop offset="1" stop-color="#2ad4f6"/></linearGradient></defs><path d="M3 3v18h18M7 15l4-4 3 3 5-6"/></svg>')}
        <h2>${esc(t("onb3_t"))}</h2><p>${esc(t("onb3_d"))}</p></div>
    </div>
    <div class="onb-foot">
      <div class="onb-dots" id="onb-dots"><i class="on"></i><i></i><i></i></div>
      <div style="display:flex;gap:10px">
        <button class="btn ghost" id="onb-skip" style="flex:1">${esc(t("skip"))}</button>
        <button class="btn primary" id="onb-next" style="flex:2">${esc(t("start_now"))}</button>
      </div>
    </div>
  </div>`);
  const onbEl = $("#onb");
  const track = onbEl.querySelector("#onb-track"), dots = [...onbEl.querySelectorAll("#onb-dots i")], next = onbEl.querySelector("#onb-next");
  const idx = () => Math.round(track.scrollLeft / track.clientWidth);
  track.onscroll = () => { const i = idx(); dots.forEach((d, j) => d.classList.toggle("on", j === i)); next.textContent = i === 2 ? t("start_now") : t("start_now"); };
  onbEl.querySelector("#onb-skip").onclick = () => finishOnb();
  next.onclick = () => { if (idx() < 2) track.scrollTo({ left: track.clientWidth * (idx() + 1), behavior: "smooth" }); else finishOnb(); };
  function finishOnb() {
    localStorage.setItem("nx_seen", "1");
    const el = $("#onb");
    el.style.transition = "opacity .45s, transform .45s";
    el.style.opacity = "0"; el.style.transform = "scale(1.04)";
    setTimeout(() => { el.remove(); location.hash = "#/"; }, 440);
  }
});

/* الرئيسية / الفيد */
let feedCursor = null, feedCat = "", feedQ = "", feedBusy = false;
const resetFeed = () => { feedCursor = null; feedCat = ""; feedQ = ""; feedBusy = false; };
let recHist = [];
function recepChat() {
  const sh = sheet(`<b style="font-size:15px;display:block;margin-bottom:6px">${esc(t("recep"))}</b>
    <div id="rec-log" style="display:flex;flex-direction:column;gap:6px;max-height:50vh;overflow-y:auto;margin-bottom:8px"></div>
    <div class="qrow">
      ${["كيف نفتح متجراً؟", "إيش الباقات؟", "كيف يوصل الطلب؟"].map((q) => `<button class="qchip" data-q="${esc(q)}">${esc(q)}</button>`).join("")}
    </div>
    <div style="display:flex;gap:6px;margin-top:6px">
      <input class="input" id="rec-in" placeholder="${esc(S.lang === "ar" ? "اكتب سؤالك…" : "Ask…")}"/>
      <button class="btn primary" id="rec-go" style="padding:0 16px">→</button>
    </div>`);
  const log = $("#rec-log", sh.wrap);
  const push = (txt, me) => { const d = document.createElement("div"); d.className = "ag-msg " + (me ? "me" : "bot"); d.textContent = txt; log.appendChild(d); log.scrollTop = 1e6; };
  push(t("recep_hello"), false);
  const send = async (q) => {
    if (!q.trim()) return;
    push(q, true); recHist.push({ role: "user", content: q });
    const d = document.createElement("div"); d.className = "ag-msg bot typing"; d.innerHTML = "<span></span><span></span><span></span>"; log.appendChild(d); log.scrollTop = 1e6;
    try {
      const r = await api("/api/reception/chat", { method: "POST", body: { messages: recHist.slice(-4), lang: S.lang } });
      d.remove(); push(r.reply || t("ai_desc_fail"), false); recHist.push({ role: "assistant", content: r.reply || "" });
    } catch { d.remove(); push(t("ai_desc_fail"), false); }
  };
  $("#rec-go", sh.wrap).onclick = () => { const i = $("#rec-in", sh.wrap); send(i.value); i.value = ""; };
  $("#rec-in", sh.wrap).onkeydown = (e) => { if (e.key === "Enter") { const i = $("#rec-in", sh.wrap); send(i.value); i.value = ""; } };
  $$(".qchip", sh.wrap).forEach((c) => (c.onclick = () => send(c.dataset.q)));
}
rr("/", async (v) => {
  buildTabbar(true);
  resetFeed();
  v.innerHTML = `${topbar()}
    <div class="chips-row" id="feed-cats" style="padding-top:12px"></div>
    <div id="feed-list"></div>`;
  renderCats();
  loadFeed(true);
  if (!S.user && !$("#recep-fab")) {
    const b = document.createElement("button");
    b.className = "recep-fab"; b.id = "recep-fab"; b.setAttribute("aria-label", t("recep"));
    b.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.7 1.4 5.1 3.6 6.7L5 22l4.1-2c.9.2 1.9.4 2.9.4 5.5 0 10-3.9 10-8.7S17.5 3 12 3z"/></svg>`;
    b.onclick = () => recepChat();
    v.appendChild(b);
  }
});

function renderCats() {
  const row = $("#feed-cats");
  if (!row) return;
  row.innerHTML = [`<button class="chip ${!feedCat ? "on" : ""}" data-c="">${esc(t("all"))}</button>`,
    ...CATS.map((c) => `<button class="chip ${feedCat === c ? "on" : ""}" data-c="${c}">${esc(catName(c))}</button>`)].join("");
  $$(".chip", row).forEach((ch) => (ch.onclick = () => { feedCat = ch.dataset.c; renderCats(); loadFeed(true); }));
}

async function loadFeed(reset = false) {
  if (feedBusy) return;
  const list = $("#feed-list");
  if (!list) return;
  feedBusy = true;
  if (reset) {
    feedCursor = null; S.feedDone = false;
    list.innerHTML = skeletons();
  }
  try {
    const q = new URLSearchParams();
    if (feedCursor) q.set("before", feedCursor);
    if (feedCat) q.set("cat", feedCat);
    if (feedQ) q.set("q", feedQ);
    const data = await api("/api/feed?" + q);
    if (reset) list.innerHTML = "";
    const posts = data.posts || [];
    if (reset && !posts.length) {
      list.innerHTML = `<div class="empty"><div class="orb"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="url(#xg)" stroke-width="1.6"><defs><linearGradient id="xg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a5cff"/><stop offset="1" stop-color="#2ad4f6"/></linearGradient></defs><path d="M4 5h2l2.2 11.2A2 2 0 0 0 10.2 18h7.9a2 2 0 0 0 2-1.6L21.6 9H6.2M10 21.5h.01M17 21.5h.01"/></svg></div><h3>${esc(t("empty_feed_t"))}</h3><p>${esc(t("empty_feed_d"))}</p></div>`;
    } else {
      const keep = $(".load-more-row", list);
      if (keep) keep.remove();
      list.insertAdjacentHTML("beforeend", `<div class="grid">${posts.map((p, i) => productCard(p, i)).join("")}</div>`);
      if (posts.length === 24 && !S.feedDone) {
        feedCursor = posts[posts.length - 1].created_at;
        list.insertAdjacentHTML("beforeend", `<div class="load-more-row" style="padding:4px 16px 18px"><button class="btn wide ghost" id="feed-more">${esc(t("load_more"))}</button></div>`);
        $("#feed-more").onclick = () => loadFeed(false);
      }
    }
  } catch {
    if (reset) list.innerHTML = `<div class="empty"><h3>…</h3><p>${esc(t("loading"))}</p></div>`;
  }
  feedBusy = false;
}

/* الاستكشاف */
rr("/explore", async (v) => {
  buildTabbar(true);
  v.innerHTML = `${topbar()}
    <div class="page" style="padding-top:8px">
      <input class="input" id="q-in" placeholder="${esc(t("search_ph"))}" autocomplete="off"/>
    </div>
    <div class="chips-row" id="ex-cats"></div>
    <div id="ex-res"></div>`;
  const input = $("#q-in");
  let deb = null;
  input.oninput = () => {
    clearTimeout(deb);
    deb = setTimeout(() => runSearch(input.value.trim()), 350);
  };
  runSearch("");
});

async function runSearch(q) {
  const res = $("#ex-res");
  if (!res) return;
  res.innerHTML = skeletons(4);
  const cats = await api("/api/categories").catch(() => ({ categories: [] }));
  const row = $("#ex-cats");
  if (row && !row.dataset.done) {
    row.innerHTML = `<button class="chip on" data-c="">${esc(t("all"))}</button>` +
      (cats.categories || []).map((c) => `<button class="chip" data-c="${esc(c.category)}">${esc(catName(c.category))} · ${c.n}</button>`).join("");
    $$(".chip", row).forEach((ch) => (ch.onclick = () => {
      $$(".chip", row).forEach((x) => x.classList.remove("on"));
      ch.classList.add("on");
      runSearch($("#q-in").value.trim(), ch.dataset.c);
    }));
    row.dataset.done = "1";
  }
  const catSel = $(".chip.on", row)?.dataset.c || "";
  const qp = new URLSearchParams();
  if (q) qp.set("q", q);
  if (catSel) qp.set("cat", catSel);
  const data = await api("/api/feed?" + qp);
  res.innerHTML = data.posts?.length
    ? `<div class="grid">${data.posts.map((p, i) => productCard(p, i)).join("")}</div>`
    : `<div class="empty"><h3>${esc(t("no_results"))}</h3><p>${esc(t("no_results_sub"))}</p></div>`;
}

/* المتجر */
rr("/s/:slug", async (v, p) => {
  buildTabbar(true);
  v.innerHTML = `${topbar()}<div id="store-body">${skeletons(2)}</div>`;
  let data;
  try { data = await api("/api/store/" + encodeURIComponent(p.slug)); }
  catch { $("#store-body").innerHTML = `<div class="empty"><h3>404</h3><p>${esc(t("no_results"))}</p></div>`; return; }
  const st = data.store;
  const link = location.origin + "/#/s/" + st.slug;
  $("#store-body").innerHTML = `
    <div class="store-hero">
      <div class="store-banner">${st.banner ? imgTag(st.banner) : ""}</div>
      <div class="store-id">
        ${st.logo ? imgTag(st.logo, "store-logo") : `<div class="store-logo empty-logo">${esc((st.store_name || "N")[0])}</div>`}
        <div><div class="n">${esc(st.store_name)}
          ${st.verified ? `<span class="vbadge ${st.plan === "vip" ? "gold" : ""}" title="${esc(t("verified_badge"))}"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg></span>` : ""}
          ${st.plan === "vip" ? `<span class="planbadge">VIP</span>` : st.plan === "pro" ? `<span class="planbadge pro">PRO</span>` : ""}
        </div><div class="s">@${esc(st.slug)}</div></div>
      </div>
      <button class="agent-fab ${data.agent_enabled ? "" : "off"}" id="agent-fab" title="${esc(t("ask_agent"))}">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a7 7 0 0 1 7 7c0 1.2-.3 2.3-.9 3.3L19 17l-3-.6A7 7 0 1 1 12 3z"/><circle cx="9.5" cy="10.5" r=".8" fill="currentColor"/><circle cx="12.5" cy="10.5" r=".8" fill="currentColor"/><circle cx="15.5" cy="10.5" r=".8" fill="currentColor"/></svg>
      </button>
      ${st.bio ? `<div class="store-bio">${esc(st.bio)}</div>` : ""}
      <div class="store-actions">
        <button class="btn primary" id="share-store" style="flex:1">${esc(t("share_store"))}</button>
        ${st.whatsapp ? `<a class="btn" href="https://wa.me/${esc(st.whatsapp.replace(/\D/g, ""))}" target="_blank" rel="noopener" style="min-width:50px;padding:0 16px"><svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5 13.9c-.2.6-1.2 1.1-1.7 1.2-.4 0-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4l.9 2.2c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.9 1.4 1.9 2.3 1.3 1.2 2.4 1.5 2.7 1.7.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2.2 1c.3.2.5.3.6.4.1.2.1.7-.1 1.2z"/></svg></a>` : ""}
      </div>
      <div style="padding:12px 16px 0"><span class="link-pill" id="link-pill" dir="ltr">${esc(link.replace(/^https?:\/\//, ""))}</span></div>
    </div>
    <div class="section-title" style="margin:8px 18px 8px">${esc(t("products"))}</div>
    ${data.products.length ? `<div class="grid">${data.products.map((x, i) => productCard({ ...x, store_slug: null }, i)).join("")}</div>`
      : `<div class="empty"><h3>${esc(t("no_products"))}</h3></div>`}`;
  $("#share-store").onclick = async () => {
    vibrate(10);
    try { await navigator.clipboard.writeText(link); toast(t("copied_link")); }
    catch { toast(link); }
  };
  $("#agent-fab").onclick = () => agentChat(st, data.agent_enabled);
});

/* محادثة الوكيل الذكي (الزبون ↔ الوكيل) */
async function agentChat(st, enabled) {
  vibrate(8);
  const bxKey = "nx_bx_" + st.slug;
  let buyer = localStorage.getItem(bxKey) || "";
  if (!buyer) { buyer = Math.random().toString(16).slice(2, 14); localStorage.setItem(bxKey, buyer); }
  const sessKey = "nx_sess_" + st.slug;
  let sessionId = sessionStorage.getItem(sessKey) || "";
  const sh = sheet(`
    <h3 style="display:flex;align-items:center;gap:8px">
      <span style="width:34px;height:34px;border-radius:12px;background:var(--grad);display:grid;place-items:center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M12 3a7 7 0 0 1 7 7c0 1.2-.3 2.3-.9 3.3L19 17l-3-.6A7 7 0 1 1 12 3z"/></svg>
      </span>
      ${esc(t("ask_agent"))}</h3>
    <div id="ag-log" style="display:flex;flex-direction:column;gap:8px;min-height:180px;max-height:46dvh;overflow-y:auto;padding:4px 2px"></div>
    <div id="ag-err" style="min-height:18px"></div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <input class="input" id="ag-in" placeholder="${esc(t("agent_send_ph"))}" style="flex:1"/>
      <button class="btn primary" id="ag-send" style="min-width:52px;padding:0 14px">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>
      </button>
    </div>`);
  const log = $("#ag-log", sh.wrap);
  const bubble = (text, me = false, typing = false) => {
    const el = document.createElement("div");
    el.className = "ag-msg " + (me ? "me" : "bot") + (typing ? " typing" : "");
    el.innerHTML = typing
      ? '<span></span><span></span><span></span>'
      : esc(text).replace(/\n/g, "<br>");
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  };
  if (!enabled) { bubble(t("agent_off")); $("#ag-in", sh.wrap).disabled = true; $("#ag-send", sh.wrap).disabled = true; return; }
  bubble(t("agent_welcome"));
  const send = async () => {
    const input = $("#ag-in", sh.wrap);
    const msg = input.value.trim();
    if (!msg) return;
    input.value = "";
    bubble(msg, true);
    const tEl = bubble("", false, true);
    vibrate(5);
    try {
      const r = await fetch(`/api/agent/chat`, { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ store_slug: st.slug, message: msg, lang: S.lang, buyer, session_id: sessionId }) });
      const d = await r.json();
      tEl.remove();
      if (d.session_id) { sessionId = d.session_id; sessionStorage.setItem(sessKey, sessionId); }
      if (d.reply) bubble(d.reply);
      else if (d.handoff) bubble(t("agent_handoff"));
      else bubble(t("agent_off"));
    } catch { tEl.remove(); bubble(t("agent_off")); }
  };
  $("#ag-send", sh.wrap).onclick = send;
  $("#ag-in", sh.wrap).onkeydown = (e) => { if (e.key === "Enter") send(); };
}

/* صفحة المنتج */
rr("/p/:id", async (v, p) => {
  buildTabbar(true);
  v.innerHTML = `${topbar()}<div class="page" style="padding-top:8px">${skeletons(1)}</div>`;
  let prod = null;
  try {
    const r = await api("/api/product/" + encodeURIComponent(p.id));
    prod = { ...r.product, store_slug: r.store.slug, store_name: r.store.store_name, store_logo: r.store.logo };
  } catch {}
  if (!prod) {
    v.innerHTML = `${topbar()}<div class="empty"><h3>404</h3><p>${esc(t("no_results"))}</p></div>`;
    return;
  }
  const off = prod.compare_at > prod.price ? Math.round((1 - prod.price / prod.compare_at) * 100) : 0;
  v.innerHTML = `
    ${topbar()}
    <div style="position:relative">
      ${off ? `<span class="badge-off" style="top:14px">-${off}%</span>` : ""}
      ${imgTag(prod.image, "pd-img", prod.title)}
    </div>
    <div class="pd-head"><h1>${esc(prod.title)}</h1></div>
    <div class="pd-price"><span class="now">${money(prod.price)}</span>${prod.compare_at > prod.price ? `<span class="was">${money(prod.compare_at)}</span>` : ""}</div>
    <a class="store-line" href="#/s/${esc(prod.store_slug)}" style="padding:0 16px 8px">${prod.store_logo ? imgTag(prod.store_logo) : ""}<span>${esc(prod.store_name || "")}</span> <span style="color:var(--cyan)">›</span></a>
    <div class="pd-desc">${esc(prod.descr || "")}</div>
    <div class="cta-dock">
      <div class="price-mini">${esc(t("cod"))}<b>${money(prod.price)}</b></div>
      <span style="flex:1"></span>
      <button class="btn primary" id="order-btn" style="min-width:160px">${esc(t("order_now"))}</button>
    </div>`;
  $("#order-btn").onclick = () => orderSheet(prod);
});

/* ورقة الطلب */
async function orderSheet(prod) {
  if (!S.dz) {
    S.dz = await fetch("/data/dz.json").then((r) => r.json());
  }
  const wilayas = S.dz.w;
  const sheetHtml = `
    <h3>${esc(t("place_order_title"))}</h3>
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px">
      ${imgTag(prod.image, "", prod.title).replace("<img ", '<img style="width:56px;height:56px;border-radius:14px;object-fit:cover" ')}
      <div style="flex:1"><div style="font-size:13.5px;font-weight:600">${esc(prod.title)}</div>
      <div class="price" style="margin-top:3px">${money(prod.price)}</div></div>
      <div style="display:flex;align-items:center;gap:8px;background:var(--card);border:1px solid var(--line);border-radius:99px;padding:5px 8px">
        <button id="q-minus" class="icon-btn" style="width:30px;height:30px;border-radius:99px">−</button>
        <b id="q-val" style="min-width:20px;text-align:center">1</b>
        <button id="q-plus" class="icon-btn" style="width:30px;height:30px;border-radius:99px">+</button>
      </div>
    </div>
    <div class="field"><label>${esc(t("full_name"))}</label><input class="input" id="o-name" autocomplete="name"/></div>
    <div class="field"><label>${esc(t("phone"))}</label><input class="input" id="o-phone" dir="ltr" inputmode="tel" placeholder="06 XX XX XX XX"/></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="field"><label>${esc(t("wilaya"))}</label>
        <select class="input" id="o-wil"><option value="">—</option>${wilayas.map((w) => `<option value="${w[0]}">${w[0]} · ${esc(S.lang === "ar" ? w[1] : w[2])}</option>`).join("")}</select></div>
      <div class="field"><label>${esc(t("commune"))}</label>
        <select class="input" id="o-com" disabled><option value="">—</option></select></div>
    </div>
    <div class="field"><label>${esc(t("delivery"))}</label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <button class="btn del-opt on" data-d="home" id="d-home" style="min-height:46px;font-size:13.5px">${esc(t("home_delivery"))}</button>
        <button class="btn del-opt" data-d="desk" id="d-desk" style="min-height:46px;font-size:13.5px">${esc(t("desk_delivery"))}</button>
      </div></div>
    <div class="field" id="addr-field"><label>${esc(t("address"))}</label><input class="input" id="o-addr"/></div>
    <div class="field"><label>${esc(t("note"))}</label><input class="input" id="o-note"/></div>
    <div id="o-err" style="min-height:20px;margin:-4px 0 6px"></div>
    <button class="btn primary wide" id="o-send" style="font-size:16px">${esc(t("confirm_order"))} · <span id="o-total">${money(prod.price)}</span></button>`;
  const { wrap, close } = sheet(sheetHtml);
  let qty = 1, delivery = "home";
  const qv = $("#q-val", wrap), totalEl = $("#o-total", wrap);
  const setQty = (n) => { qty = Math.max(1, Math.min(20, n)); qv.textContent = qty; totalEl.textContent = money(prod.price * qty); vibrate(4); };
  $("#q-plus", wrap).onclick = () => setQty(qty + 1);
  $("#q-minus", wrap).onclick = () => setQty(qty - 1);
  $$(".del-opt", wrap).forEach((b) => (b.onclick = () => {
    delivery = b.dataset.d;
    $$(".del-opt", wrap).forEach((x) => x.classList.toggle("on", x === b));
    $("#addr-field", wrap).style.display = delivery === "home" ? "" : "none";
    vibrate(4);
  }));
  $("#o-wil", wrap).onchange = () => {
    const w = Number($("#o-wil", wrap).value);
    const comSel = $("#o-com", wrap);
    const list = (S.dz.c[w] || []).map((c) => `<option value="${esc(c[0])}">${esc(S.lang === "ar" ? c[0] : c[1])}</option>`).join("");
    comSel.innerHTML = `<option value="">—</option>` + list;
    comSel.disabled = !w;
  };
  $("#o-send", wrap).onclick = async (e) => {
    const err = $("#o-err", wrap);
    err.innerHTML = "";
    const cname = $("#o-name", wrap).value.trim();
    const phone = $("#o-phone", wrap).value.replace(/\s+/g, "");
    const wilaya = Number($("#o-wil", wrap).value);
    const commune = $("#o-com", wrap).value;
    const address = $("#o-addr", wrap).value.trim();
    const note = $("#o-note", wrap).value.trim();
    if (cname.length < 3 || !wilaya || !commune) { err.innerHTML = `<span class="err-text">${esc(t("req_field"))}</span>`; return shake(err); }
    if (!/^0[5-7]\d{8}$/.test(phone) && !/^0[2-4]\d{7}$/.test(phone)) { err.innerHTML = `<span class="err-text">${esc(t("bad_phone"))}</span>`; return shake(err); }
    if (delivery === "home" && address.length < 5) { err.innerHTML = `<span class="err-text">${esc(t("req_field"))}</span>`; return shake(err); }
    const btn = e.currentTarget;
    btn.disabled = true; btn.textContent = t("sending");
    try {
      const r = await api(`/api/store/${prod.store_slug}/order`, { method: "POST", body: { product_id: prod.id, cname, phone, wilaya, commune, delivery, address, note, qty } });
      vibrate([12, 40, 12]);
      confetti($(".sheet-body", wrap));
      $(".sheet-body", wrap).innerHTML = `
        <div class="success-wrap">
          <div class="success-ring"><svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
          <h3 style="margin-bottom:6px">${esc(t("order_success"))}</h3>
          <p style="color:var(--muted);font-size:13.5px;line-height:1.9">${esc(t("order_success_sub"))}</p>
          <div class="hint" style="margin:12px 0 20px" dir="ltr">${esc(t("order_id"))}: ${esc(r.id)}</div>
          <button class="btn primary wide" id="o-close">${esc(t("done"))}</button>
        </div>`;
      $("#o-close", wrap).onclick = close;
    } catch (ex) {
      btn.disabled = false; btn.textContent = t("confirm_order");
      err.innerHTML = `<span class="err-text">${esc(ex.error === "out_of_stock" ? t("out_stock") : t("req_field"))}</span>`;
    }
  };
  function shake(el) { vibrate([8, 30, 8]); el.animate?.([{ transform: "translateX(5px)" }, { transform: "translateX(-5px)" }, { transform: "translateX(3px)" }, { transform: "none" }], { duration: 320 }); }
}

/* ═══ المصادقة ═══ */
rr("/auth", async (v) => {
  buildTabbar(false);
  let mode = "login";
  v.innerHTML = `${topbar("")}<div class="page" id="auth-box" style="padding-top:20px"></div>`;
  const box = v.querySelector("#auth-box");
  const draw = () => {
    box.innerHTML = `
      <div style="text-align:center;margin-bottom:22px">
        <div class="boot-logo" style="animation:none"><svg viewBox="0 0 64 64" width="58" height="58" fill="none"><defs><linearGradient id="bg2" x1="0" y1="0" x2="64" y2="64"><stop offset="0" stop-color="#7a5cff"/><stop offset="1" stop-color="#2ad4f6"/></linearGradient></defs><path d="M14 50V14l18 22V14h18v36h-9V28L23 50z" fill="url(#bg2)"/></svg></div>
        <h2 style="margin-top:10px">${esc(mode === "login" ? t("welcome") : t("create_account"))}</h2>
      </div>
      <div style="display:flex;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:4px;margin-bottom:18px">
        <button class="btn ${mode === "login" ? "primary" : "ghost"}" id="m-login" style="flex:1;min-height:42px;font-size:13.5px">${esc(t("login"))}</button>
        <button class="btn ${mode === "reg" ? "primary" : "ghost"}" id="m-reg" style="flex:1;min-height:42px;font-size:13.5px">${esc(t("register"))}</button>
      </div>
      <div id="auth-form"></div>`;
    const form = box.querySelector("#auth-form");
    if (mode === "login") {
      form.innerHTML = `
        <div class="field"><label>${esc(t("email"))}</label><input class="input" id="a-email" type="email" dir="ltr" autocomplete="email"/></div>
        <div class="field"><label>${esc(t("password"))}</label><input class="input" id="a-pass" type="password" autocomplete="current-password"/></div>
        <div id="a-err" style="min-height:20px"></div>
        <button class="btn primary wide" id="a-go">${esc(t("login"))}</button>
        <p class="hint" style="text-align:center;margin-top:14px">${esc(t("no_account"))} — <a href="#/auth" id="a-switch" style="color:var(--cyan)">${esc(t("register"))}</a></p>`;
      $("#a-switch", form).onclick = (e) => { e.preventDefault(); mode = "reg"; draw(); };
      $("#a-go", form).onclick = async () => {
        const email = $("#a-email", form).value.trim(), pass = $("#a-pass", form).value;
        if (!email || pass.length < 6) return aerr(t("req_field"));
        busy($("#a-go", form), true);
        try {
          const k0 = await k0of(email, pass);
          const r = await api("/api/auth/login", { method: "POST", body: { email, k0 } });
          S.csrf = r.csrf; sessionStorage.setItem("nx_csrf", r.csrf);
          toast(t("logged_in")); vibrate([10, 30, 10]);
          await me(); location.hash = "#/dash";
        } catch { aerr(t("wrong_creds")); busy($("#a-go", form), false); }
      };
    } else {
      form.innerHTML = `
        <div class="field"><label>${esc(t("your_name"))}</label><input class="input" id="r-name" autocomplete="name"/></div>
        <div class="field"><label>${esc(t("store_name"))}</label><input class="input" id="r-store"/></div>
        <div class="field"><label>${esc(t("store_slug"))}</label><input class="input" id="r-slug" dir="ltr" placeholder="my-store"/><span class="hint">${esc(t("slug_hint"))}</span></div>
        <div class="field"><label>${esc(t("email"))}</label><input class="input" id="r-email" type="email" dir="ltr" autocomplete="email"/></div>
        <div class="field"><label>${esc(t("password"))}</label><input class="input" id="r-pass" type="password" autocomplete="new-password"/></div>
        <div id="a-err" style="min-height:20px"></div>
        <button class="btn primary wide" id="r-go">${esc(t("create_account"))}</button>
        <p class="hint" style="text-align:center;margin-top:14px">${esc(t("have_account"))} — <a href="#/auth" id="r-switch" style="color:var(--cyan)">${esc(t("login"))}</a></p>`;
      $("#r-switch", form).onclick = (e) => { e.preventDefault(); mode = "login"; draw(); };
      $("#r-go", form).onclick = async () => {
        const name = $("#r-name", form).value.trim(), store_name = $("#r-store", form).value.trim();
        const slug = $("#r-slug", form).value.trim().toLowerCase(), email = $("#r-email", form).value.trim();
        const pass = $("#r-pass", form).value;
        if (name.length < 2 || !slug || !email || pass.length < 6) return aerr(t("req_field"));
        busy($("#r-go", form), true);
        try {
          const k0 = await k0of(email, pass);
          const r = await api("/api/auth/register", { method: "POST", body: { name, slug, store_name, email, k0 } });
          S.csrf = r.csrf; sessionStorage.setItem("nx_csrf", r.csrf);
          toast(t("logged_in")); vibrate([10, 30, 10]);
          await me(); location.hash = "#/dash";
        } catch (ex) { aerr(ex.error === "exists" ? t("exists") : t("req_field")); busy($("#r-go", form), false); }
      };
    }
  };
  const aerr = (m) => { $("#a-err", box).innerHTML = `<span class="err-text">${esc(m)}</span>`; vibrate([8, 30, 8]); };
  const busy = (b, on) => { b.disabled = on; if (on) b.style.opacity = ".6"; };
  draw(); /* الرسم أولاً — الأزرار تُنشأ هنا ثم تُربط */
  $("#m-login", box).onclick = () => { mode = "login"; draw(); };
  $("#m-reg", box).onclick = () => { mode = "reg"; draw(); };
});

/* ═══ لوحة المتجر ═══ */
async function me() {
  try {
    const r = await api("/api/me");
    S.user = { ...r.user, plan: r.plan, credits: r.credits, agent_today: r.agent_today, agent_quota: r.agent_quota };
    if (r.csrf) { S.csrf = r.csrf; sessionStorage.setItem("nx_csrf", r.csrf); }
    return r;
  } catch { S.user = null; return null; }
}

const DASH_TABS = [
  { id: "overview", r: "#/dash" }, { id: "products", r: "#/dash/products" },
  { id: "orders", r: "#/dash/orders" }, { id: "finance", r: "#/dash/finance" },
  { id: "agent_tab", r: "#/dash/agent" }, { id: "ads_tab", r: "#/ads" }, { id: "pro_tab", r: "#/dash/pro" }, { id: "settings", r: "#/dash/settings" },
];
async function openAdsOrder(style, price) {
  let prods = [];
  try { prods = (await api("/api/products")).products || []; } catch {}
  const sh = sheet(`<b style="font-size:16px;display:block;margin-bottom:4px">${esc(t("s_" + style))}</b>
    <span class="price-now" style="font-size:15px">${new Intl.NumberFormat(S.lang === "ar" ? "ar-DZ" : "en-US").format(price)} ${esc(S.lang === "ar" ? "دج" : "DZD")}</span>
    <div class="field" style="margin-top:10px"><label>${esc(t("nk_field"))}</label>
      <div style="display:flex;gap:6px"><input class="input" id="ao-nk" dir="ltr" value="${esc(nkUser)}" placeholder="vito-studio"/>
      <button class="btn ghost" id="ao-nkc" type="button">${esc(t("nk_check"))}</button></div>
      <div class="hint" id="ao-nkmsg" style="min-height:16px">${nkExtra > 0 ? "−" + Math.round(nkExtra * 100) + "%" : ""}</div></div>
    <div class="field" style="margin-top:10px"><label>${esc(t("vid_product"))}</label>
      <select class="input" id="ao-prod"><option value="">${esc(t("pick_product"))}</option>
        ${prods.map((p) => `<option value="${esc(p.id)}">${esc(p.title)}</option>`).join("")}</select></div>
    <div class="field"><label>${esc(t("vid_note"))}</label><textarea class="input" id="ao-note" rows="2"></textarea></div>
    <div id="ao-err" style="min-height:18px"></div>
    <button class="btn wa wide" id="ao-send">${esc(t("send_order"))}</button>`);
  $("#ao-nkc", sh.wrap).onclick = async () => {
    const u = $("#ao-nk", sh.wrap).value.trim();
    const rr2 = await api(`/api/pro/member?u=${encodeURIComponent(u)}`);
    nkUser = u; nkExtra = rr2.extra_pct || 0;
    $("#ao-nkmsg", sh.wrap).textContent = nkExtra > 0 ? `−${Math.round(nkExtra * 100)}%` : "";
    $("#ao-nkmsg", sh.wrap).style.color = nkExtra > 0 ? "var(--cyan)" : "var(--muted)";
    toast(nkExtra > 0 ? t("nk_ok") : t("nk_no"));
  };

  $("#ao-send", sh.wrap).onclick = async () => {
    try {
      const stTitle = t("s_" + style), prodSel = $("#ao-prod", sh.wrap);
      const prodName = prodSel.selectedOptions[0]?.textContent || "";
      const note = $("#ao-note", sh.wrap).value.trim();
      const u = S.user || {};
      const msg = [
        "السلام عليكم استوديو VITO، أريد طلب فيديو إعلاني من NEXUS:",
        `- النمط: ${stTitle}`,
        `- السعر: ${new Intl.NumberFormat("fr-DZ").format(price)} دج (بعد خصم باقتي)`,
        u.store_name ? `- المتجر: ${u.store_name}${u.slug ? ` — nexus.vitobytestudio.workers.dev/#/s/${u.slug}` : ""}` : "",
        prodName && prodName !== t("pick_product") ? `- المنتج المميز: ${prodName}` : "",
        note ? `- ملاحظات: ${note}` : "",
      ].filter(Boolean).join("\n");
      await api("/api/ads/order", { method: "POST", body: { style, product_id: prodSel.value, note, nk_user: $("#ao-nk", sh.wrap).value.trim() } });
      sh.close(); toast(t("order_ok")); vibrate([10, 40, 10]);
      const wa = window.open(`https://wa.me/213777845635?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
      if (!wa) toast(t("wa_open_fail"));
      go("#/ads");
    } catch (ex) {
      $("#ao-err", sh.wrap).innerHTML = `<span class="err-text">${esc(ex.error === "too_many" ? t("limit_reached") : ex.error || "error")}</span>`;
    }
  };
}
rr("/ads", async (v) => {
  buildTabbar(true);
  if (!S.user) { const m = await me(); if (!m) { location.hash = "#/auth"; return; } }
  v.innerHTML = `${topbar(t("ads_tab"))}<div class="page" style="padding-top:6px" id="ads-body">${skeletons(3)}</div>`;
  let d;
  try { d = await api("/api/ads"); } catch { $("#ads-body").innerHTML = `<p class="hint">error</p>`; return; }
  const fmt = new Intl.NumberFormat(S.lang === "ar" ? "ar-DZ" : "en-US");
  const stName = { quick: "adp-quick", lifestyle: "adp-life", sale: "adp-sale", lux: "adp-lux", intro: "adp-intro" };
  const stOrders = (d.orders || []).map((o) => `
    <div style="display:flex;align-items:center;gap:8px;padding:10px 2px;border-bottom:1px solid var(--line)">
      <span class="st st-${esc(o.status)}">${esc(t("st_" + o.status))}</span>
      <b style="font-size:13px">${esc(t("s_" + o.style))}</b>
      <span class="sp"></span>
      <span class="price-now">${fmt.format(o.price)}</span>
      ${o.video_url ? `<a class="chip on" href="${esc(o.video_url)}" target="_blank" rel="noopener">${esc(t("watch_vid"))}</a>` : ""}
    </div>`).join("");
  $("#ads-body").innerHTML = `
    <div class="ad-hero">
      <b style="font-size:16px;display:block">${esc(t("ads_hero_t"))}</b>
      <p style="font-size:12.5px;margin:4px 0 8px;opacity:.92;line-height:1.8">${esc(t("ads_hero_s"))}</p>
      <span class="disc-chip">${esc(t("your_disc"))}: ${Math.round((d.discount || 0) * 100)}%</span>
      <a class="wa-ask" href="https://wa.me/213777845635?text=${encodeURIComponent("السلام عليكم، عندي استفسار حول الفيديوهات الإعلانية NEXUS")}" target="_blank" rel="noopener">${esc(t("wa_ask"))}</a>
    </div>
    <div class="ad-grid">${(d.styles || []).map((st) => `
      <div class="ad-card">
        <div class="adp ${stName[st.id] || ""}"><span class="dur">${esc(st.dur)}</span>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>
        <div class="ad-meta"><div class="ad-name">${esc(t("s_" + st.id))}</div>
          <p class="hint" style="margin:2px 0 4px;line-height:1.6">${esc(t("d_" + st.id))}</p>
          <div class="ad-price"><s class="price-old">${fmt.format(st.base)}</s>
            <span class="price-now">${fmt.format(st.price)} ${esc(S.lang === "ar" ? "دج" : "DZD")}</span></div>
          <button class="btn primary wide" style="margin-top:8px;padding:9px 0" data-adstyle="${esc(st.id)}" data-adprice="${st.price}">${esc(t("order_vid"))}</button>
        </div>
      </div>`).join("")}</div>
    <h3 style="margin:16px 0 4px;font-size:14px">${esc(t("my_vids"))}</h3>
    ${stOrders || `<p class="hint">${esc(t("no_vids"))}</p>`}`;
  $$("#ads-body [data-adstyle]").forEach((b) => (b.onclick = () => openAdsOrder(b.dataset.adstyle, Number(b.dataset.adprice))));
});

let nkUser = "", nkExtra = 0;
async function loadPro() {
  const el = $("#pro-body");
  el.innerHTML = `<div class="skel"></div>`;
  const r = await api("/api/pro/services");
  const list = r.services || [];
  el.innerHTML = list.length ? `<div class="ad-grid">${list.map((sv) => `
    <div class="ad-card">
      <div class="adp adp-intro" style="height:64px"><span class="dur">${sv.delivery_days || 7} ${S.lang === "ar" ? "يوم" : "days"}</span>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2-6.4-4.8L5.6 21.2 8 14 2 9.2h7.6z"/></svg></div>
      <div class="ad-meta"><div class="ad-name">${esc(sv.title)}</div>
        <p class="hint" style="margin:2px 0 4px;line-height:1.6">${esc((sv.description || "").slice(0, 90))}</p>
        <div class="chips" style="gap:4px"><span class="chip brand">${esc(sv.category || "general")}</span></div>
        <div class="ad-price"><span class="price-now">${new Intl.NumberFormat(S.lang === "ar" ? "ar-DZ" : "en-US").format(sv.price_min)} ${S.lang === "ar" ? "دج" : "DZD"}</span></div>
        <a class="btn primary wide" style="margin-top:8px;padding:9px 0" href="https://naksab.vitobytestudio.workers.dev/#/service/${esc(sv.id)}" target="_blank" rel="noopener">${t("pro_open")} →</a>
      </div></div>`).join("")}</div>` : `<p class="hint">${t("pro_empty")}</p>`;
}
rr("/dash/pro", async (v) => {
  buildTabbar(true);
  if (!S.user) { const m = await me(); if (!m) { location.hash = "#/auth"; return; } }
  v.innerHTML = `${topbar(t("pro_tab"))}<div class="page" style="padding-top:6px" id="pro-body">
    <div class="ad-hero"><b style="font-size:16px;display:block">${t("pro_hero")}</b>
      <p style="font-size:12.5px;margin:4px 0 8px;opacity:.92;line-height:1.8">${t("pro_sub")}</p></div></div>`;
  loadPro();
});

async function openBell() {
  let data;
  try { data = await api("/api/notifications"); } catch { return; }
  const rows = (data.notifications || []).map((n) => `
    <div style="display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:11px 2px;border-bottom:1px solid var(--line)">
      <b style="font-size:13px">${esc(t("n_" + n.type) || n.type)}</b>
      <span style="font-size:12.5px;color:var(--muted);line-height:1.7">${esc(n.title)} — ${esc(n.body)}</span>
    </div>`).join("");
  const sh = sheet(`<b style="font-size:16px;display:block;margin-bottom:6px">${esc(t("notif"))}</b>
    ${rows || `<p class="hint">${esc(t("notif_empty"))}</p>`}
    <button class="btn ghost wide" id="n-mark" style="margin-top:10px">${esc(t("notif_mark"))}</button>`);
  $("#n-mark", sh.wrap).onclick = async () => {
    try { await api("/api/notifications/read", { method: "POST" }); } catch {}
    const b = $("#bell-n"); if (b) b.classList.add("hidden");
  };
}
async function refreshBell() {
  try {
    const r = await api("/api/notifications");
    const b = $("#bell-n"); if (!b) return;
    const n = r.unread | 0;
    b.textContent = n > 9 ? "9+" : String(n);
    b.classList.toggle("hidden", n === 0);
  } catch {}
}
function dashShell(v, active, contentHtml) {
  const u = S.user;
  v.innerHTML = `${topbar(u?.store_name || t("dash"), `<button class="icon-btn" id="bell-btn" style="position:relative" aria-label="${t("notif")}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg><span id="bell-n" class="nbadge hidden"></span></button><a class="icon-btn accent" href="#/dash/products" title="+"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></a>`)}
    <div class="chips-row" style="padding-top:12px" id="dash-tabs">
      ${DASH_TABS.map((d) => `<button class="chip ${d.id === active ? "on" : ""}" data-r="${d.r}">${esc(t(d.id))}</button>`).join("")}
    </div>
    <div class="page" style="padding-top:6px" id="dash-body">${contentHtml}</div>`;
  $$("#dash-tabs .chip").forEach((c) => (c.onclick = () => go(c.dataset.r)));
  $("#bell-btn")?.addEventListener("click", openBell);
  refreshBell();
}

rr("/dash", async (v) => {
  buildTabbar(true);
  if (!S.user) { const m = await me(); if (!m) { location.hash = "#/auth"; return; } }
  dashShell(v, "overview", skeletons(3));
  const [counts, fin] = await Promise.all([api("/api/me"), api("/api/finance")]);
  const nb = Object.fromEntries((fin.by_status || []).map((x) => [x.status, x.n]));
  $("#dash-body").innerHTML = `
    <div class="kpis">
      <div class="kpi accent"><div class="v" data-c="${nb.new || 0}">0</div><div class="l">${esc(t("new_orders"))}</div></div>
      <div class="kpi"><div class="v" data-c="${fin.pending}">0</div><div class="l">${esc(t("pending"))}</div></div>
      <div class="kpi"><div class="v" data-c="${fin.revenue}">0</div><div class="l">${esc(t("revenue"))}</div></div>
      <div class="kpi accent"><div class="v" data-c="${fin.net}">0</div><div class="l">${esc(t("net"))}</div></div>
    </div>
    <div class="section-title">${esc(t("overview"))}</div>
    <div class="card" style="padding:12px"><canvas class="chart" id="ov-chart"></canvas>
      <div style="display:flex;gap:14px;justify-content:center;font-size:11px;color:var(--muted);padding-top:8px">
        <span><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:var(--violet)"></i> ${esc(t("revenue"))}</span>
        <span><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:var(--danger)"></i> ${esc(t("expenses"))}</span>
      </div></div>
    <div style="display:flex;gap:10px;margin-top:16px">
      <a class="btn" style="flex:1" href="#/s/${esc(S.user.slug)}">${esc(t("open_store"))}</a>
      <a class="btn primary" style="flex:1" href="#/dash/products">${esc(t("add_product"))}</a>
    </div>`;
  $$("#dash-body .v[data-c]").forEach((el) => countUp(el, Number(el.dataset.c)));
  drawChart("ov-chart", fin.rev_series, fin.exp_series);
});

function drawChart(cid, rev, exp) {
  const c = document.getElementById(cid);
  if (!c) return;
  const dpr = devicePixelRatio || 1;
  const W = c.clientWidth, H = c.clientHeight;
  c.width = W * dpr; c.height = H * dpr;
  const g = c.getContext("2d");
  g.scale(dpr, dpr);
  const days = 14, today = Math.floor(Date.now() / 86400000);
  const map = (arr) => Object.fromEntries((arr || []).map((x) => [Number(x.d), Number(x.v)]));
  const R = map(rev), E = map(exp);
  const vals = [];
  for (let i = days - 1; i >= 0; i--) { const d = today - i; vals.push({ r: R[d] || 0, e: E[d] || 0 }); }
  const max = Math.max(1, ...vals.map((x) => Math.max(x.r, x.e)));
  const bw = W / days, pad = 4;
  vals.forEach((x, i) => {
    const hr = (x.r / max) * (H - 12), he = (x.e / max) * (H - 12);
    const x0 = i * bw + pad / 2, w = bw - pad;
    const gr = g.createLinearGradient(0, H - hr, 0, H);
    gr.addColorStop(0, "#7a5cff"); gr.addColorStop(1, "#7a5cff22");
    g.fillStyle = gr;
    g.beginPath();
    if (typeof g.roundRect === "function") g.roundRect(x0, H - hr, w, hr, 3); else g.rect(x0, H - hr, w, hr);
    g.fill();
    if (he > 0) { g.fillStyle = "#ff6b6b88"; g.beginPath(); if (typeof g.roundRect === "function") g.roundRect(x0, H - he, w, Math.min(he, 4), 2); else g.rect(x0, H - he, w, Math.min(he, 4)); g.fill(); }
  });
}

/* المنتجات */
rr("/dash/products", async (v) => {
  buildTabbar(true);
  if (!S.user) { const m = await me(); if (!m) { location.hash = "#/auth"; return; } }
  dashShell(v, "products", skeletons(2));
  const data = await api("/api/products");
  const list = data.products || [];
  $("#dash-body").innerHTML = list.length
    ? `<div class="card" style="padding:6px 16px">${list.map((p) => `
      <div class="list-item">
        ${imgTag(p.image, "th", p.title)}
        <div class="bd"><div class="t">${esc(p.title)}</div>
          <div class="s">${money(p.price)} · ${esc(catName(p.category))} ${p.featured ? "· ★" : ""} ${p.active ? "" : "· ↩"}</div></div>
        <button class="icon-btn" data-edit="${esc(p.id)}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button>
      </div>`).join("")}</div>`
    : `<div class="empty"><div class="orb"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="url(#xg)" stroke-width="1.6"><defs><linearGradient id="xg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a5cff"/><stop offset="1" stop-color="#2ad4f6"/></linearGradient></defs><path d="M3 9 5 3h14l2 6M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9M3 9h18"/></svg></div><h3>${esc(t("no_products"))}</h3><p>${esc(t("no_products_sub"))}</p>
      <button class="btn primary" style="margin-top:18px" onclick="productEditor()">${esc(t("add_product"))}</button></div>`;
  $$("[data-edit]", v).forEach((b) => (b.onclick = () => productEditor(list.find((x) => x.id === b.dataset.edit))));
  if (list.length) {
    v.insertAdjacentHTML("beforeend", `<div style="padding:6px 16px 20px"><button class="btn wide ghost" onclick="productEditor()">+ ${esc(t("add_product"))}</button></div>`);
  }
});

function productEditor(p = null) {
  const isEdit = !!p;
  const sh = sheet(`
    <h3>${esc(isEdit ? t("edit_product") : t("add_product"))}</h3>
    <div class="field"><label>${esc(t("product_title"))}</label><input class="input" id="e-title" value="${esc(p?.title || "")}"/></div>
    <div class="field"><label>${esc(t("description"))}</label><textarea class="input" id="e-desc">${esc(p?.descr || "")}</textarea>
      <button class="btn ghost wide" id="e-ai" type="button" style="margin-top:6px">${esc(t("ai_desc"))}</button></div>
    <button class="btn ghost wide" id="e-org" type="button">${esc(t("org_btn"))}</button>
    <div class="ready-wrap"><span id="ready-lbl">${esc(t("ready"))}</span>
      <div class="ready-bar"><i id="ready-fill"></i></div><span id="ready-pct" style="font-weight:800;font-size:12px">0%</span></div>
    <div id="org-tips" class="tips-box" style="display:none"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="field"><label>${esc(t("price"))}</label><input class="input" id="e-price" type="number" inputmode="numeric" dir="ltr" value="${p?.price ?? ""}"/></div>
      <div class="field"><label>${esc(t("compare_at"))}</label><input class="input" id="e-compare" type="number" inputmode="numeric" dir="ltr" value="${p?.compare_at || ""}"/></div>
    </div>
    <div class="field"><label>${esc(t("image_url"))}</label>
      <button class="btn wide" id="e-pick" type="button">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.5-3.5a2 2 0 0 0-2.8 0L7 19"/></svg>
        ${esc(S.lang === "ar" ? "اختر صورة من هاتفك" : "Pick from phone")}
      </button>
      <input type="file" id="e-file" accept="image/*" class="hidden"/>
      <div id="e-preview" style="margin-top:6px"></div>
      <details style="margin-top:6px"><summary class="hint" style="cursor:pointer">${esc(S.lang === "ar" ? "أو ألصق رابط صورة" : "or paste image URL")}</summary>
      <input class="input" id="e-image" dir="ltr" placeholder="https://…" style="margin-top:6px" value="${esc(p?.image || "")}"/></details></div>
    <div class="field"><label>${esc(t("category"))}</label>
      <select class="input" id="e-cat">${CATS.map((c) => `<option value="${c}" ${p?.category === c ? "selected" : ""}>${esc(catName(c))}</option>`).join("")}</select></div>
    <div class="field" style="flex-direction:row;align-items:center;justify-content:space-between">
      <label style="margin:0">${esc(t("featured"))}</label><button class="switch ${p?.featured ? "on" : ""}" id="e-feat"></button></div>
    <div id="e-err" style="min-height:18px"></div>
    ${isEdit ? `<button class="btn danger wide" id="e-del" style="margin-bottom:10px">${esc(t("delete"))}</button>` : ""}
    <button class="btn primary wide" id="e-save">${esc(t("save"))}</button>`);
  const imgIn = $("#e-image", sh.wrap);
  $("#e-ai", sh.wrap).onclick = async () => {
    const btn = $("#e-ai", sh.wrap), dIn = $("#e-desc", sh.wrap);
    btn.disabled = true; btn.textContent = t("ai_descing");
    try {
      const r = await api("/api/agent/describe", { method: "POST", body: { title: $("#e-title", sh.wrap).value.trim(), hints: dIn.value.trim() } });
      dIn.value = r.descr || ""; toast(t("ai_desc_ok")); vibrate([10, 40, 10]);
    } catch (ex) {
      const msg = ex.error === "agent_disabled" ? t("need_keys") : ex.error === "quota_exhausted" ? t("limit_reached") : t("ai_desc_fail");
      $("#e-err", sh.wrap).innerHTML = `<span class="err-text">${esc(msg)}</span>`; vibrate([8, 30, 8]);
    }
    btn.disabled = false; btn.textContent = t("ai_desc");
  };
  /* جاهزية النشر: تحليل حي لكل حقل */
  const readyCalc = () => {
    const tt = $("#e-title", sh.wrap).value.trim(), dd = $("#e-desc", sh.wrap).value.trim();
    const im = ($("#e-image", sh.wrap).value.trim() || $("#e-preview img", sh.wrap)) ? 1 : 0;
    const ca = $("#e-compare", sh.wrap) ? ($("#e-compare", sh.wrap).value.trim() ? 1 : 0) : 0;
    const pts = (tt.length >= 10 ? 30 : tt.length >= 4 ? 15 : 0) + (dd.length >= 40 ? 40 : dd.length >= 15 ? 20 : 0) + im * 20 + ca * 10;
    $("#ready-fill", sh.wrap).style.width = pts + "%";
    $("#ready-pct", sh.wrap).textContent = pts + "%";
    $("#ready-fill", sh.wrap).style.background = pts >= 80 ? "linear-gradient(90deg,#34d399,#2ad4f6)" : pts >= 50 ? "linear-gradient(90deg,#ffd166,#ff9f43)" : "linear-gradient(90deg,#ff5d73,#ff9f43)";
  };
  ["#e-title", "#e-desc", "#e-image", "#e-compare"].forEach((id) => { const el = $(id, sh.wrap); if (el) el.addEventListener("input", readyCalc); });
  readyCalc();
  /* منظّم المنتج: الوكيل يرتب الباقة ويقترح */
  $("#e-org", sh.wrap).onclick = async () => {
    const btn = $("#e-org", sh.wrap);
    btn.disabled = true; btn.textContent = t("orging");
    try {
      const r = await api("/api/agent/organize", { method: "POST", body: { title: $("#e-title", sh.wrap).value.trim(), descr: $("#e-desc", sh.wrap).value.trim(), price: Number($("#e-price", sh.wrap)?.value || 0) } });
      $("#e-title", sh.wrap).value = r.title || $("#e-title", sh.wrap).value;
      $("#e-desc", sh.wrap).value = r.descr || $("#e-desc", sh.wrap).value;
      if (r.category) { const c = $("#e-cat", sh.wrap); if (c && [...c.options].some((o) => o.value === r.category)) c.value = r.category; }
      const tb = $("#org-tips", sh.wrap);
      if ((r.tips || []).length) { tb.style.display = "block"; tb.innerHTML = `<b>${esc(t("org_tips"))}</b><ul>${r.tips.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`; }
      readyCalc(); toast(t("org_ok")); vibrate([10, 40, 10]);
    } catch (ex) {
      const msg = ex.error === "agent_disabled" ? t("need_keys") : ex.error === "quota_exhausted" ? t("limit_reached") : t("ai_desc_fail");
      $("#e-err", sh.wrap).innerHTML = `<span class="err-text">${esc(msg)}</span>`; vibrate([8, 30, 8]);
    }
    btn.disabled = false; btn.textContent = t("org_btn");
  };
  const prev = $("#e-preview", sh.wrap);
  let curUrl = p?.image || "";
  const showPrev = () => { prev.innerHTML = curUrl ? imgTag(curUrl, "", "preview").replace("<img ", '<img style="width:96px;height:96px;border-radius:16px;object-fit:cover" ') : '<div class="hint">' + esc(S.lang === "ar" ? "لا صورة بعد" : "No image yet") + "</div>"; };
  showPrev();
  imgIn.oninput = () => { curUrl = imgIn.value.trim(); showPrev(); };
  const fileIn = $("#e-file", sh.wrap), pick = $("#e-pick", sh.wrap);
  pick.onclick = () => fileIn.click();
  fileIn.onchange = async () => {
    const f = fileIn.files?.[0];
    if (!f) return;
    pick.disabled = true;
    pick.innerHTML = '<span class="hint">' + esc(S.lang === "ar" ? "جارٍ الضغط والرفع…" : "Compressing & uploading…") + "</span>";
    try {
      curUrl = await uploadImage(f);
      imgIn.value = "";
      showPrev();
      toast(S.lang === "ar" ? "رُفعت الصورة" : "Uploaded");
      vibrate(10);
    } catch (ex) { toast(ex.error || "error", "err"); }
    pick.disabled = false;
    pick.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.5-3.5a2 2 0 0 0-2.8 0L7 19"/></svg> ' + esc(S.lang === "ar" ? "اختر صورة من هاتفك" : "Pick from phone");
  };
  $("#e-feat", sh.wrap).onclick = (e) => e.currentTarget.classList.toggle("on");
  $("#e-save", sh.wrap).onclick = async (e) => {
    const bbody = {
      title: $("#e-title", sh.wrap).value.trim(), descr: $("#e-desc", sh.wrap).value.trim(),
      price: Number($("#e-price", sh.wrap).value), compare_at: Number($("#e-compare", sh.wrap).value) || 0,
      image: (curUrl || imgIn.value.trim()), category: $("#e-cat", sh.wrap).value, featured: $("#e-feat", sh.wrap).classList.contains("on"),
    };
    try {
      if (isEdit) await api("/api/products/" + p.id, { method: "PUT", body: bbody });
      else await api("/api/products", { method: "POST", body: bbody });
      toast(t("saved")); vibrate(10); sh.close(); render();
    } catch (ex) {
      $("#e-err", sh.wrap).innerHTML = `<span class="err-text">${esc(ex.error === "plan_limit" ? t("limit_reached") : ex.error || "error")}</span>`;
      vibrate([8, 30, 8]);
    }
  };
  if (isEdit) $("#e-del", sh.wrap).onclick = (e) => {
    const b = e.currentTarget;
    if (b.dataset.armed) {
      api("/api/products/" + p.id, { method: "DELETE" }).then(() => { toast(t("done")); sh.close(); render(); });
    } else { b.dataset.armed = "1"; b.textContent = t("confirm_delete"); vibrate([8, 30, 8]); }
  };
}

/* الطلبيات */
let ordersFilter = "";
rr("/dash/orders", async (v) => {
  buildTabbar(true);
  if (!S.user) { const m = await me(); if (!m) { location.hash = "#/auth"; return; } }
  dashShell(v, "orders", skeletons(3));
  const [all, fin] = await Promise.all([
    api("/api/orders"), api("/api/finance"),
  ]);
  const nb = Object.fromEntries((fin.by_status || []).map((x) => [x.status, x.n]));
  const statuses = ["", "new", "confirmed", "shipped", "delivered", "cancelled"];
  const body = $("#dash-body");
  body.innerHTML = `<div class="chips-row" style="padding:0 0 12px;margin:0 -16px" id="ord-filters">
      ${statuses.map((st) => `<button class="chip ${ordersFilter === st ? "on" : ""}" data-s="${st}">${esc(st ? t("st_" + st) : t("all"))}${st && nb[st] ? ` · ${nb[st]}` : ""}</button>`).join("")}
    </div><div id="ord-list"></div>`;
  const drawList = () => {
    const rows = ordersFilter ? (all.orders || []).filter((o) => o.status === ordersFilter) : all.orders || [];
    $("#ord-list", body).innerHTML = rows.length
      ? `<div class="card" style="padding:4px 16px">${rows.map((o, i) => `
        <button class="list-item" data-oid="${esc(o.id)}" style="width:100%;text-align:start" style="animation-delay:${i * 40}ms">
          <div class="bd"><div class="t">${esc(o.ptitle)} × ${o.qty}</div>
            <div class="s">${esc(o.cname)} · ${esc(o.commune)} (${o.wilaya}) · ${fdate(o.created_at)}</div></div>
          <span class="st-tag st-${esc(o.status)}">${esc(t("st_" + o.status))}</span>
        </button>`).join("")}</div>`
      : `<div class="empty"><h3>${esc(t("no_results"))}</h3></div>`;
    $$("[data-oid]", body).forEach((b) => (b.onclick = () => orderDetail(rows.find((o) => o.id === b.dataset.oid))));
  };
  $$("#ord-filters .chip", body).forEach((c) => (c.onclick = () => { ordersFilter = c.dataset.s; $$("#ord-filters .chip", body).forEach((x) => x.classList.toggle("on", x === c)); drawList(); }));
  drawList();
});

function orderDetail(o) {
  const steps = ["new", "confirmed", "shipped", "delivered"];
  const pipe = `<div class="pipe">${steps.map((st) => `<span class="st ${o.status === st ? "now" : steps.indexOf(o.status) > steps.indexOf(st) ? "done" : ""}">${esc(t("st_" + st))}</span>`).join("")}</div>`;
  sheet(`
    <h3>${esc(t("order_details"))}</h3>
    ${pipe}
    <div class="card" style="margin:12px 0">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span class="hint">${esc(t("customer"))}</span><b style="font-size:14px">${esc(o.cname)}</b></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span class="hint" dir="ltr">${esc(o.phone)}</span>
        <span style="display:flex;gap:8px">
          <a class="icon-btn" href="tel:${esc(o.phone)}" style="width:36px;height:36px"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 2z"/></svg></a>
          <a class="icon-btn" href="https://wa.me/${esc(o.phone.replace(/^0/, "213").replace(/\D/g, ""))}" target="_blank" rel="noopener" style="width:36px;height:36px;color:#3ddc97"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/></svg></a>
        </span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span class="hint">${esc(t("wilaya"))} / ${esc(t("commune"))}</span><b style="font-size:13px">${o.wilaya} · ${esc(o.commune)}</b></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span class="hint">${esc(t("delivery"))}</span><b style="font-size:13px">${esc(t(o.delivery === "home" ? "home_delivery" : "desk_delivery"))}</b></div>
      ${o.address ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span class="hint">${esc(t("address"))}</span><b style="font-size:13px">${esc(o.address)}</b></div>` : ""}
      ${o.note ? `<div style="display:flex;justify-content:space-between"><span class="hint">${esc(t("note"))}</span><b style="font-size:13px">${esc(o.note)}</b></div>` : ""}
    </div>
    <div class="card" style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center">
      <span class="hint">${esc(o.ptitle)} × ${o.qty}</span><span class="price" style="font-size:16px">${money(o.total)}</span></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px" id="st-btns">
      ${o.status !== "cancelled" && o.status !== "delivered"
        ? `<button class="btn danger" data-st="cancelled">${esc(t("st_cancelled"))}</button>
           <button class="btn primary" data-st="${steps[Math.min(steps.indexOf(o.status) + 1, 3)]}">${esc(t("mark"))} → ${esc(t("st_" + steps[Math.min(steps.indexOf(o.status) + 1, 3)]))}</button>`
        : `<span class="hint" style="grid-column:1/-1;text-align:center">${esc(t("st_" + o.status))} ✓</span>`}
    </div>`);
  $$("#st-btns [data-st]").forEach((b) => (b.onclick = async () => {
    try {
      await api("/api/orders/" + o.id, { method: "PATCH", body: { status: b.dataset.st } });
      toast(t("saved")); vibrate(10); render();
    } catch { toast("error", "err"); }
  }));
}

/* الوكيل الذكي: الحصة والجلسات */
rr("/dash/agent", async (v) => {
  buildTabbar(true);
  if (!S.user) { const m = await me(); if (!m) { location.hash = "#/auth"; return; } }
  dashShell(v, "agent_tab", skeletons(3));
  const data = await api("/api/agent/sessions");
  const pct = Math.min(100, Math.round((data.today / Math.max(1, data.quota)) * 100));
  $("#dash-body").innerHTML = `
    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <b style="font-size:14px">${esc(t("quota_today"))}</b>
        <span class="price">${data.today} / ${data.quota}</span></div>
      <div style="height:10px;border-radius:99px;background:var(--card2);overflow:hidden">
        <div style="height:100%;width:${pct}%;border-radius:99px;background:var(--grad);transition:width 1s var(--spring)"></div></div>
      <p class="hint" style="margin-top:8px">${esc(t("plan"))}: ${esc(t("plan_" + (S.user.plan || "free")))} · ${esc(t("credits"))}: <b>${S.user.credits ?? 0}</b></p>
    </div>
    <div class="section-title" style="margin-top:4px">${esc(t("agent_sessions"))}</div>
    <div class="card" style="padding:4px 16px" id="sess-list">
      ${(data.sessions || []).map((x) => `
        <button class="list-item" data-s="${esc(x.id)}" style="width:100%;text-align:start">
          <span class="bd"><span class="t">${esc(t("customer"))} · ${x.msgs} رسالة</span>
          <span class="s">${fdate(x.updated_at)}</span></span>
          <span class="st-tag ${x.status === "open" ? "st-new" : "st-cancelled"}">${esc(x.status === "open" ? t("open_s") : t("closed_s"))}</span>
        </button>`).join("") || `<div class="empty" style="padding:24px"><p>${esc(t("no_sessions"))}</p></div>`}
    </div>`;
  $$("[data-s]", v).forEach((b) => (b.onclick = async () => {
    const det = await api("/api/agent/sessions/" + b.dataset.s);
    const sh = sheet(`
      <h3>${esc(t("agent_sessions"))}</h3>
      <div id="ag-hist" style="display:flex;flex-direction:column;gap:8px;max-height:44dvh;overflow-y:auto;padding:4px 2px">
        ${det.messages.map((m) => `<div class="ag-msg ${m.role === "user" ? "me" : "bot"}">${esc(m.content).replace(/\n/g, "<br>")}</div>`).join("")}
      </div>
      ${det.session.status === "open" ? `<button class="btn wide danger" id="ag-close" style="margin-top:12px">${esc(t("session_close"))}</button>` : ""}`);
    const cb = $("#ag-close", sh.wrap);
    if (cb) cb.onclick = async () => {
      await api("/api/agent/sessions/" + b.dataset.s, { method: "PATCH", body: { status: "closed" } });
      toast(t("done")); sh.close(); render(true);
    };
  }));
});

/* المالية */
rr("/dash/finance", async (v) => {
  buildTabbar(true);
  if (!S.user) { const m = await me(); if (!m) { location.hash = "#/auth"; return; } }
  dashShell(v, "finance", skeletons(3));
  const [fin, exps] = await Promise.all([api("/api/finance"), api("/api/expenses")]);
  $("#dash-body").innerHTML = `
    <div class="kpis">
      <div class="kpi accent"><div class="v" data-c="${fin.revenue}">0</div><div class="l">${esc(t("revenue"))}</div></div>
      <div class="kpi"><div class="v" data-c="${fin.pending}">0</div><div class="l">${esc(t("pending"))}</div></div>
      <div class="kpi"><div class="v" data-c="${fin.expenses}" style="color:var(--danger)">0</div><div class="l">${esc(t("expenses"))}</div></div>
      <div class="kpi accent"><div class="v" data-c="${fin.net}">0</div><div class="l">${esc(t("net"))}</div></div>
    </div>
    <p class="hint" style="margin:10px 2px">${esc(t("income_note"))}</p>
    <div class="card" style="padding:12px"><canvas class="chart" id="fin-chart"></canvas></div>
    <div class="section-title">${esc(t("expenses"))}
      <button class="more" id="add-exp">+ ${esc(t("add_expense"))}</button></div>
    <div class="card" style="padding:4px 16px" id="exp-list">
      ${(exps.expenses || []).map((x) => `
        <div class="list-item">
          <div class="bd"><div class="t">${esc(x.label)}</div><div class="s">${fdate(x.created_at)}</div></div>
          <b style="color:var(--danger);font-size:13px">-${money(x.amount)}</b>
          <button class="icon-btn" data-ex="${esc(x.id)}" style="width:34px;height:34px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg></button>
        </div>`).join("") || `<div class="empty" style="padding:26px"><p>—</p></div>`}
    </div>`;
  drawChart("fin-chart", fin.rev_series, fin.exp_series);
  $$("#dash-body .v[data-c]").forEach((el) => countUp(el, Number(el.dataset.c)));
  $("#add-exp", v).onclick = () => {
    const sh = sheet(`
      <h3>${esc(t("add_expense"))}</h3>
      <div class="field"><label>${esc(t("expense_label"))}</label><input class="input" id="x-label"/></div>
      <div class="field"><label>${esc(t("amount"))}</label><input class="input" id="x-amount" type="number" inputmode="numeric" dir="ltr"/></div>
      <div id="x-err" style="min-height:18px"></div>
      <button class="btn primary wide" id="x-save">${esc(t("save"))}</button>`);
    $("#x-save", sh.wrap).onclick = async () => {
      try {
        await api("/api/expenses", { method: "POST", body: { label: $("#x-label", sh.wrap).value.trim(), amount: Number($("#x-amount", sh.wrap).value) } });
        toast(t("saved")); sh.close(); render();
      } catch (ex) { $("#x-err", sh.wrap).innerHTML = `<span class="err-text">${esc(ex.error || "error")}</span>`; }
    };
  };
  $$("[data-ex]", v).forEach((b) => (b.onclick = async () => {
    await api("/api/expenses/" + b.dataset.ex, { method: "DELETE" });
    toast(t("done")); render();
  }));
});

/* الإعدادات */
rr("/dash/settings", async (v) => {
  buildTabbar(true);
  if (!S.user) { const m = await me(); if (!m) { location.hash = "#/auth"; return; } }
  const u = S.user;
  dashShell(v, "settings", `
    <div class="field"><label>${esc(t("store_name"))}</label><input class="input" id="s-name" value="${esc(u.store_name)}"/></div>
    <div class="field"><label>Bio</label><textarea class="input" id="s-bio">${esc(u.bio)}</textarea></div>
    <div class="field"><label>Logo URL</label><input class="input" id="s-logo" dir="ltr" value="${esc(u.logo)}"/></div>
    <div class="field"><label>Banner URL</label><input class="input" id="s-banner" dir="ltr" value="${esc(u.banner)}"/></div>
    <div class="field"><label>WhatsApp</label><input class="input" id="s-wa" dir="ltr" placeholder="213XXXXXXXXX" value="${esc(u.whatsapp)}"/></div>
    <div class="field"><label>${esc(t("category"))}</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap" id="s-colors">
        ${["", "#7a5cff", "#2ad4f6", "#3ddc97", "#ff6b6b", "#ffb454"].map((c) => `<button class="chip col-pick ${u.color === c ? "on" : ""}" data-c="${c}" style="${c ? `background:${c}22;border-color:${c}"` : ""}">${c ? `<i style="width:12px;height:12px;border-radius:50%;background:${c}"></i>` : esc(t("all"))}</button>`).join("")}
      </div></div>
    <div id="s-err" style="min-height:18px"></div>
    <button class="btn primary wide" id="s-save">${esc(t("save"))}</button>`);
  let color = u.color || "";
  $$("#s-colors .col-pick").forEach((b) => (b.onclick = () => { color = b.dataset.c; $$("#s-colors .col-pick").forEach((x) => x.classList.toggle("on", x === b)); }));
  $("#s-save", v).onclick = async (e) => {
    try {
      await api("/api/me", { method: "PUT", body: {
        store_name: $("#s-name", v).value.trim(), bio: $("#s-bio", v).value.trim(),
        logo: $("#s-logo", v).value.trim(), banner: $("#s-banner", v).value.trim(),
        whatsapp: $("#s-wa", v).value.trim(), color,
      } });
      await me(); toast(t("saved")); vibrate(10);
    } catch (ex) { $("#s-err", v).innerHTML = `<span class="err-text">${esc(ex.error || "error")}</span>`; }
  };
});

/* الحساب */
rr("/account", async (v) => {
  buildTabbar(true);
  if (!S.user) { const m = await me(); if (!m) { location.hash = "#/auth"; return; } }
  const u = S.user;
  const link = location.origin + "/#/s/" + u.slug;
  v.innerHTML = `${topbar()}
    <div class="page" style="padding-top:16px">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
        ${u.logo ? imgTag(u.logo, "store-logo", "") : `<div class="store-logo empty-logo">${esc((u.store_name || "N")[0])}</div>`}
        <div><div style="font-size:18px;font-weight:700">${esc(u.store_name || u.name)}
          ${u.verified ? `<span class="vbadge ${u.plan === "vip" ? "gold" : ""}"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg></span>` : ""}
          ${u.plan === "vip" ? '<span class="planbadge">VIP</span>' : u.plan === "pro" ? '<span class="planbadge pro">PRO</span>' : ""}
        </div>
          <div class="s" style="color:var(--muted);font-size:12px;direction:ltr">@${esc(u.slug)}</div></div>
      </div>
      <div class="card" style="margin-bottom:14px;padding:14px 16px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="hint">${esc(t("plan"))}</span>
          <b style="color:${u.plan === "vip" ? "#ffd166" : u.plan === "pro" ? "var(--cyan)" : "var(--muted)"}">${esc(t("plan_" + (u.plan || "free")))}</b>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:8px">
          <span class="hint">${esc(t("credits"))}</span><b>${u.credits ?? 0}</b></div>
        <div style="display:flex;justify-content:space-between;margin-top:8px">
          <span class="hint">${esc(t("quota_today"))}</span><b>${u.agent_today ?? 0} / ${u.agent_quota ?? 15}</b></div>
        <p class="hint" style="margin-top:10px">${esc(t("upgrade_note"))}</p>
      </div>
      <div class="card" style="padding:4px 16px;margin-bottom:14px">
        <button class="list-item" id="acc-link" style="width:100%;text-align:start">
          <span class="bd"><span class="t">${esc(t("my_store_link"))}</span><span class="s" dir="ltr">${esc(link.replace(/^https?:\/\//, ""))}</span></span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
        </button>
        <div class="list-item">
          <span class="bd"><span class="t">${esc(t("language"))}</span></span>
          <div style="display:flex;background:var(--card2);border-radius:12px;padding:3px;gap:2px">
            <button class="btn ${S.lang === "ar" ? "primary" : "ghost"}" id="lang-ar" style="min-height:34px;padding:0 16px;font-size:12.5px">عربي</button>
            <button class="btn ${S.lang === "en" ? "primary" : "ghost"}" id="lang-en" style="min-height:34px;padding:0 16px;font-size:12.5px">EN</button>
          </div>
        </div>
        <button class="list-item" id="acc-out" style="width:100%;text-align:start;color:var(--danger)">
          <span class="bd"><span class="t">${esc(t("logout"))}</span></span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
        </button>
      </div>
      <p class="hint" style="text-align:center">NEXUS · v2.0 · VITO BYTE STUDIO</p>
    </div>`;
  $("#acc-link", v).onclick = async () => { try { await navigator.clipboard.writeText(link); toast(t("copied_link")); } catch { toast(link); } };
  $("#lang-ar", v).onclick = () => setLang("ar");
  $("#lang-en", v).onclick = () => setLang("en");
  $("#acc-out", v).onclick = async () => { await api("/api/auth/logout", { method: "POST" }); S.csrf = ""; sessionStorage.clear(); S.user = null; toast(t("logged_out")); location.hash = "#/auth"; };
});

function setLang(lang) {
  S.lang = lang;
  localStorage.setItem("nx_lang", lang);
  $("#tabbar").innerHTML = "";
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  render(true);
  vibrate(8);
}

/* ═══ الإقلاع ═══ */
document.documentElement.lang = S.lang;
document.documentElement.dir = S.lang === "ar" ? "rtl" : "ltr";
window.addEventListener("hashchange", render);
(async () => {
  if (!location.hash) location.hash = localStorage.getItem("nx_seen") ? "#/" : "#/onb-check";
  render();
  setTimeout(() => $("#boot")?.classList.add("off"), 650);
  await me();
})();
window.go = go; window.productEditor = productEditor; window.setLang = setLang;
