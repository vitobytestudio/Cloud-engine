// ——— NEXUS v1.0 — واجهة أنستغرامية — عربي RTL ———
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const S = { user: null, csrf: null, counts: null, cats: ["ملابس", "جمال", "إلكترونيات", "منزل", "أطعمة", "خدمات", "أطفال", "رياضة"] };

async function api(path, method = "GET", body) {
  const res = await fetch(path, {
    method,
    headers: { "content-type": "application/json", ...(S.csrf ? { "x-csrf": S.csrf } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data };
}
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(t._h); t._h = setTimeout(() => (t.hidden = true), 2200); }
const ago = (t) => { const d = (Date.now() - t) / 1000; if (d < 3600) return `${Math.max(1, d / 60 | 0)}د`; if (d < 86400) return `${d / 3600 | 0}س`; return `${d / 86400 | 0}ي`; };
const av = (u, cls = "pav") => u.avatar_url ? `<img class="${cls}" src="${esc(u.avatar_url)}" alt=""/>` : `<div class="${cls}">${esc((u.name || "?").charAt(0))}</div>`;

// ─── المصادقة ───
async function k0Of(email, pass) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode("nexus:a1:" + email.toLowerCase()), iterations: 200000 }, key, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function authModal(mode) {
  const m = $("#modal");
  m.hidden = false;
  m.innerHTML = `<div class="modal"><h3>${mode === "login" ? "مرحباً بعودتك" : "انضم إلى NEXUS"}</h3>
  <div class="field"><label>البريد الإلكتروني</label><input id="a-email" type="email" autocomplete="email"/></div>
  <div class="field"><label>كلمة المرور</label><input id="a-pass" type="password" placeholder="8+ أحرف مع رقم"/></div>
  ${mode === "register" ? `<div class="field"><label>الاسم</label><input id="a-name"/></div>
  <div class="field"><label>اسم المستخدم</label><input id="a-user" placeholder="lowercase" dir="ltr"/></div>` : ""}
  <button class="btn primary" id="a-go" style="width:100%">${mode === "login" ? "دخول" : "إنشاء الحساب"}</button>
  <div class="msg" id="a-msg"></div>
  <div class="mrow">${mode === "login" ? `جديد هنا؟ <a id="m-swap">أنشئ حساباً</a>` : `لديك حساب؟ <a id="m-swap">دخول</a>`}</div></div>`;
  $("#m-swap").onclick = () => authModal(mode === "login" ? "register" : "login");
  $("#a-go").onclick = async () => {
    const btn = $("#a-go"), msg = $("#a-msg");
    const email = $("#a-email").value.trim(), pass = $("#a-pass").value;
    btn.disabled = true; btn.textContent = "لحظات...";
    try {
      if (!pass || pass.length < 8 || !/\d/.test(pass)) throw "كلمة المرور: 8+ أحرف مع رقم";
      const k0 = await k0Of(email, pass);
      const r = mode === "login" ? await api("/api/auth/login", "POST", { email, k0 })
        : await api("/api/auth/register", "POST", { email, k0, name: $("#a-name").value.trim(), username: $("#a-user").value.trim().toLowerCase() });
      if (!r.ok) throw ({ email_taken: "البريد مستعمل", username_taken: "اسم المستخدم محجوز", invalid_credentials: "بريد أو كلمة مرور خاطئة" })[r.data.error] || "تحقق من البيانات";
      S.user = r.data.user; S.csrf = r.data.csrf;
      m.hidden = true;
      toast("أهلاً بك في NEXUS");
      route();
    } catch (e) { msg.textContent = String(e); msg.classList.add("show"); btn.disabled = false; btn.textContent = mode === "login" ? "دخول" : "إنشاء الحساب"; }
  };
}

// ─── الشريط ───
function shell(inner, tab) {
  $("#app").innerHTML = `
  <div class="topbar"><div class="bar">
    <span class="logo">NEXUS</span>
    <button class="icon-btn" id="n-new" title="منشور جديد">+</button>
    <button class="icon-btn" id="n-profile" title="ملفي">${S.user ? esc(S.user.name.charAt(0)) : "دخول"}</button>
  </div></div>
  <div class="wrap page" id="page">${inner}</div>
  <div class="tabbar">
    <button class="tab-btn ${tab === "feed" ? "on" : ""}" data-go="#/"><span class="ic">◉</span>الرئيسية</button>
    <button class="tab-btn ${tab === "explore" ? "on" : ""}" data-go="#/explore"><span class="ic">⌕</span>استكشف</button>
    <button class="tab-btn" id="t-new"><span class="ic">＋</span>انشر</button>
    <button class="tab-btn ${tab === "profile" ? "on" : ""}" data-go="${S.user ? "#/u/" + S.user.username : "#"}" id="t-profile"><span class="ic">◍</span>ملفي</button>
  </div>`;
  $("#n-new").onclick = () => (S.user ? newPost() : authModal("register"));
  $("#t-new").onclick = () => (S.user ? newPost() : authModal("register"));
  $("#n-profile").onclick = () => (S.user ? (location.hash = "#/u/" + S.user.username) : authModal("login"));
  $("#t-profile").onclick = () => (S.user ? (location.hash = "#/u/" + S.user.username) : authModal("login"));
  $$("[data-go]").forEach((b) => (b.onclick = () => (location.hash = b.dataset.go)));
}

// ─── بطاقة منشور ───
function postCard(p) {
  return `<article class="post" data-pid="${p.id}">
    <div class="post-h"><a href="#/u/${esc(p.username)}">${av(p)}</a>
      <a href="#/u/${esc(p.username)}" style="flex:1"><div class="pnm"><b>${esc(p.name)} ${p.verified ? '<span class="vb">✓</span>' : ""}</b><small>@${esc(p.username)} · ${ago(p.created_at)}</small></div></a></div>
    <img class="pimg" src="${esc(p.image_url)}" alt="" loading="lazy"/>
    <div class="pacts">
      <button class="act like-btn ${p.liked_by_me ? "liked" : ""}">${p.liked_by_me ? "♥" : "♡"}</button>
      <button class="act c-btn">💬</button>
      <button class="act save-btn ${p.saved_by_me ? "saved" : ""}">${p.saved_by_me ? "★" : "☆"}</button>
    </div>
    <div class="plikes"><span class="lk-n">${p.likes ?? 0}</span> إعجاب</div>
    <div class="pcap"><b><a href="#/u/${esc(p.username)}">@${esc(p.username)}</a></b>${p.category ? `<span class="cat">${esc(p.category)}</span>` : ""} ${esc(p.caption || "")}</div>
    <div class="cwrap" hidden><div class="clist"><div class="tiny muted" style="color:var(--dim);font-size:12px">جارٍ التحميل...</div></div>
      ${S.user ? `<div class="cform"><input placeholder="أضف تعليقاً..." maxlength="300"/><button class="send-btn">إرسال</button></div>` : ""}</div>
  </article>`;
}
function wireCard(card) {
  const pid = card.dataset.pid;
  $(".like-btn", card).onclick = async (e) => {
    if (!S.user) return authModal("login");
    const btn = e.currentTarget, on = btn.classList.contains("liked");
    const r = await api(`/api/posts/${pid}/like`, on ? "DELETE" : "POST", {});
    if (r.ok) { btn.classList.toggle("liked", !on); btn.textContent = !on ? "♥" : "♡"; $(".lk-n", card).textContent = r.data.likes ?? 0; }
  };
  $(".save-btn", card).onclick = async (e) => {
    if (!S.user) return authModal("login");
    const btn = e.currentTarget, on = btn.classList.contains("saved");
    const r = await api(`/api/posts/${pid}/save`, on ? "DELETE" : "POST", {});
    if (r.ok) { btn.classList.toggle("saved", !on); btn.textContent = !on ? "★" : "☆"; }
  };
  $(".c-btn", card).onclick = async () => {
    const w = $(".cwrap", card);
    w.hidden = !w.hidden;
    if (!w.hidden && !w.dataset.loaded) {
      const r = await api(`/api/posts/${pid}/comments`);
      $(".clist", w).innerHTML = (r.data.comments || []).map((c) => `<div class="crow">${av(c, "pav")}<div><b>${esc(c.name)}</b><span class="tiny">@${esc(c.username)}</span><br>${esc(c.body)}</div></div>`).join("") || `<div style="color:var(--dim);font-size:12.5px">لا تعليقات بعد — كن أول من يعلّق.</div>`;
      w.dataset.loaded = "1";
      if (S.user) {
        $(".send-btn", w).onclick = async () => {
          const inp = $(".cform input", w), body = inp.value.trim();
          if (!body) return;
          const rr = await api(`/api/posts/${pid}/comments`, "POST", { body });
          if (rr.ok) { inp.value = ""; $(".clist", w).insertAdjacentHTML("beforeend", `<div class="crow">${av(S.user, "pav")}<div><b>${esc(S.user.name)}</b><span class="tiny">@${esc(S.user.username)}</span><br>${esc(body)}</div></div>`); }
        };
      }
    }
  };
}

// ─── الصفحات ───
async function viewFeed() {
  if (!S.user) {
    shell(`<div class="empty" style="padding-top:80px"><h2 style="font-size:22px;margin-bottom:10px">NEXUS</h2>
      <p style="max-width:300px;margin:0 auto 18px">سوق الحرفة الجزائرية — انشر منتجك، تابع الصنّاع، واستكشف الجديد.</p>
      <button class="btn primary" id="join">انضم الآن</button></div>`, "feed");
    $("#join").onclick = () => authModal("register");
    return;
  }
  shell(`<div class="stories" id="stories"><div class="skel" style="width:100%;height:90px;margin:0"></div></div><div id="feed"><div class="skel"></div><div class="skel"></div></div>`, "feed");
  loadStories();
  const r = await api("/api/feed");
  const feed = $("#feed");
  feed.innerHTML = (r.data.posts || []).map(postCard).join("") || `<div class="empty">تابع صنّاعاً لتمتلئ صفحتك — جرّب «استكشف».</div>`;
  $$(".post", feed).forEach(wireCard);
}
async function loadStories() {
  const r = await api("/api/stories");
  const groups = r.data.stories || [];
  $("#stories").innerHTML = groups.map((g) => `<div class="story-ring" data-u="${esc(g.username)}"><div class="ring">${g.avatar_url ? `<img src="${esc(g.avatar_url)}" alt=""/>` : `<div>${esc(g.name.charAt(0))}</div>`}</div><small>${esc(g.name)}</small></div>`).join("") || "";
  $$(".story-ring").forEach((el) => (el.onclick = () => openStory(el.dataset.u)));
}
function openStory(username) {
  const g = (window._sg || []).find((x) => x.username === username);
}
async function viewExplore() {
  shell(`<div style="margin-bottom:14px"><input id="x-q" placeholder="ابحث عن منتج أو صانع..." /></div>
  <div class="stories" id="x-cats"><button class="chip-c on" data-c="">الكل</button>${S.cats.map((c) => `<button class="chip-c" data-c="${c}">${c}</button>`).join("")}</div>
  <div class="grid9" id="x-grid"><div class="skel" style="grid-column:1/-1;height:200px"></div></div>`, "explore");
  let cur = "";
  const load = async () => {
    const q = $("#x-q").value.trim();
    const r = await api(`/api/explore?cat=${encodeURIComponent(cur)}&q=${encodeURIComponent(q)}`);
    $("#x-grid").innerHTML = (r.data.posts || []).map((p) => `<a href="#/p/${p.id}"><img src="${esc(p.image_url)}" alt="" loading="lazy"/><span class="lk">♥ ${p.likes ?? 0}</span></a>`).join("") || `<div class="empty" style="grid-column:1/-1">لا نتائج بعد.</div>`;
  };
  $$("#x-cats .chip-c").forEach((b) => (b.onclick = () => { $$("#x-cats .chip-c").forEach((x) => x.classList.remove("on")); b.classList.add("on"); cur = b.dataset.c; load(); }));
  let h; $("#x-q").addEventListener("input", () => { clearTimeout(h); h = setTimeout(load, 300); });
  await load();
}
async function viewProfile(username) {
  shell(`<div class="skel" style="height:180px"></div>`, "profile");
  const r = await api(`/api/users/${encodeURIComponent(username)}`);
  if (!r.ok) { $("#page").innerHTML = `<div class="empty">الحساب غير موجود.</div>`; return; }
  const u = r.data.user, c = r.data.counts;
  shell(`<div class="phead">${av(u, "bigav")}
    <div style="flex:1"><div class="pnm"><b style="font-size:17px">${esc(u.name)} ${u.verified ? '<span class="vb">✓</span>' : ""}</b><small style="color:var(--dim);font-size:12px">@${esc(u.username)}</small></div>
    <div class="pstats" style="margin-top:8px"><div><b>${c.posts}</b><span>منشور</span></div><div><b>${c.followers}</b><span>متابع</span></div><div><b>${c.following}</b><span>يتابع</span></div></div></div></div>
  <div class="pbio">${esc(u.bio || "")}</div>
  ${u.category ? `<div style="margin:2px 0 8px"><span class="cat" style="color:var(--b2);font-size:11.5px;border:1px solid var(--line);border-radius:99px;padding:2px 12px">${esc(u.category)}</span></div>` : ""}
  ${u.store_url ? `<a class="pstore" href="${esc(u.store_url)}" target="_blank" rel="noopener">زيارة المتجر ↗</a>` : ""}
  <div style="display:flex;gap:8px;margin-bottom:18px" id="pacts"></div>
  <div class="grid9">${(r.data.posts || []).map((p) => `<a href="#/p/${p.id}"><img src="${esc(p.image_url)}" alt="" loading="lazy"/><span class="lk">♥ ${p.likes ?? 0}</span></a>`).join("") || `<div class="empty" style="grid-column:1/-1">لا منشورات بعد.</div>`}</div>`, "profile");
  const acts = $("#pacts");
  if (!S.user) acts.innerHTML = `<button class="btn primary" id="pf-auth">تابع</button>`, $("#pf-auth").onclick = () => authModal("login");
  else if (r.data.me) acts.innerHTML = `<button class="btn" id="pf-edit">تعديل الملف</button><button class="btn primary" id="pf-new">+ منشور جديد</button>`;
  else acts.innerHTML = `<button class="btn ${r.data.following_me ? "following" : "primary"}" id="pf-follow">${r.data.following_me ? "إلغاء المتابعة" : "متابعة"}</button>`;
  $("#pf-edit") && ($("#pf-edit").onclick = editProfile);
  $("#pf-new") && ($("#pf-new").onclick = newPost);
  $("#pf-follow") && ($("#pf-follow").onclick = async (e) => {
    const on = r.data.following_me;
    const rr = await api(`/api/users/${encodeURIComponent(username)}/follow`, on ? "DELETE" : "POST", {});
    if (rr.ok) { r.data.following_me = !on; e.target.textContent = on ? "متابعة" : "إلغاء المتابعة"; e.target.classList.toggle("primary", on); e.target.classList.toggle("following", !on); }
  });
}
async function viewPost(id) {
  shell(`<div class="skel"></div>`, "feed");
  const r = await api(`/api/posts/${id}`);
  if (!r.ok) { $("#page").innerHTML = `<div class="empty">المنشور غير موجود.</div>`; return; }
  $("#page").innerHTML = postCard(r.data.post);
  wireCard($(".post"));
  $(".c-btn").click();
}

// ─── نافذات ───
function newPost() {
  const m = $("#modal");
  m.hidden = false;
  m.innerHTML = `<div class="modal"><h3>منشور جديد</h3>
  <div class="field"><label>رابط الصورة (https)</label><input id="np-img" dir="ltr" placeholder="https://..."/></div>
  <div class="field"><label>الوصف</label><textarea id="np-cap" rows="3" maxlength="500" placeholder="اكتب عن منتجك..."></textarea></div>
  <div class="field"><label>التصنيف</label><select id="np-cat"><option value="">بدون</option>${S.cats.map((c) => `<option>${c}</option>`).join("")}</select></div>
  <button class="btn primary" id="np-go" style="width:100%">انشر</button>
  <div class="msg" id="np-msg"></div></div>`;
  $("#np-go").onclick = async () => {
    const r = await api("/api/posts", "POST", { image_url: $("#np-img").value.trim(), caption: $("#np-cap").value.trim(), category: $("#np-cat").value });
    if (r.ok) { m.hidden = true; toast("نُشر ✓"); route(); }
    else { $("#np-msg").textContent = "رابط صورة غير صالح (https مطلوب)"; $("#np-msg").classList.add("show"); }
  };
}
function editProfile() {
  const m = $("#modal");
  m.hidden = false;
  const u = S.user;
  m.innerHTML = `<div class="modal"><h3>تعديل الملف</h3>
  <div class="field"><label>الاسم</label><input id="ep-name" value="${esc(u.name)}"/></div>
  <div class="field"><label>نبذة</label><textarea id="ep-bio" rows="2" maxlength="300">${esc(u.bio || "")}</textarea></div>
  <div class="field"><label>رابط الصورة (https)</label><input id="ep-av" dir="ltr" value="${esc(u.avatar_url || "")}"/></div>
  <div class="field"><label>رابط المتجر/واتساب (https)</label><input id="ep-store" dir="ltr" value="${esc(u.store_url || "")}"/></div>
  <div class="field"><label>تخصصك</label><select id="ep-cat"><option value="">بدون</option>${S.cats.map((c) => `<option ${u.category === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
  <button class="btn primary" id="ep-go" style="width:100%">حفظ</button></div>`;
  $("#ep-go").onclick = async () => {
    const r = await api("/api/profile", "PUT", { name: $("#ep-name").value.trim(), bio: $("#ep-bio").value.trim(), avatar_url: $("#ep-av").value.trim(), store_url: $("#ep-store").value.trim(), category: $("#ep-cat").value });
    if (r.ok) { m.hidden = true; toast("حُفظ ✓"); route(); }
  };
}

// ─── التوجيه ───
async function boot() {
  const me = await api("/api/me");
  if (me.data.user) { S.user = me.data.user; S.csrf = me.data.csrf; S.counts = me.data.counts; }
  route();
  if ("serviceWorker" in navigator) {} // لاحقاً (PWA)
}
function route() {
  const h = location.hash || "#/";
  if (h === "#/" || h === "") viewFeed();
  else if (h === "#/explore") viewExplore();
  else if (h.startsWith("#/u/")) viewProfile(decodeURIComponent(h.slice(4)));
  else if (h.startsWith("#/p/")) viewPost(h.slice(4));
  else viewFeed();
}
window.addEventListener("hashchange", route);
$("#modal").addEventListener("click", (e) => { if (e.target === e.currentTarget) e.currentTarget.hidden = true; });
boot();
