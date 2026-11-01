// ——— NAKSAB App — SPA — English-first (بنية i18n جاهزة) ———
const T = {
  tagline: "Hire the right talent, with confidence",
  lead: "Describe your project in plain words. NAKSAB structures it, matches you with the right professionals, and keeps the whole engagement — proposals, milestones, deliverables, reviews — in one honest workspace.",
  built_on: "Built on production-grade technology",
  how_eyebrow: "How it works",
  how_title: "From idea to delivery, in three steps",
  explore: "Explore talent",
  post_project: "Post a project",
  get_started: "Get started",
  sign_in: "Sign in",
  sign_out: "Sign out",
  browse_talent: "Browse Talent",
  services: "Services",
  discover: "Discover",
  dashboard: "Dashboard",
  admin: "Admin",
  notifications: "Notifications",
  // auth
  create_account: "Create your account", welcome_back: "Welcome back",
  email: "Email", password: "Password", full_name: "Full name", username: "Username", role: "I am a",
  freelancer: "Freelancer", client: "Client",
  // generic
  save: "Save", cancel: "Cancel", send: "Send", loading: "Loading…", search: "Search…",
  all_categories: "All categories", no_results: "Nothing here yet.",
};

// ─── حالة ───
const S = { user: null, csrf: null, cats: [] };
const $app = document.getElementById("app");
const enc = new TextEncoder();

// ─── أدوات ───
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const money = (n, c = "USD") => `$${Number(n || 0).toLocaleString("en-US")}`;
const ago = (ts) => { const d = Date.now() - ts; const m = 6e4, h = 36e5, day = 864e5; if (d < m) return "just now"; if (d < h) return `${Math.floor(d / m)}m ago`; if (d < day) return `${Math.floor(d / h)}h ago`; return `${Math.floor(d / day)}d ago`; };
const stars = (r) => "★".repeat(Math.round(r || 0)) + "☆".repeat(5 - Math.round(r || 0));

function toast(msg) {
  let t = $(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  requestAnimationFrame(() => t.classList.add("show"));
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 2600);
}

async function api(path, method = "GET", body) {
  const res = await fetch(path, {
    method,
    headers: { "content-type": "application/json", ...(S.csrf && method !== "GET" ? { "x-csrf": S.csrf } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data };
}

// k0 — عقد التمطيط: 200k في المتصفح
async function k0Of(email, password) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode("naksab:a1:" + email.toLowerCase()), iterations: 200000 }, key, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const errText = (e) => ({
  invalid_email: "Enter a valid email.", invalid_k0: "Password must be 8+ chars with a digit.",
  email_taken: "This email is already registered.", username_taken: "This username is taken.",
  invalid_username: "Username: 3-24 lowercase letters, numbers or dashes.",
  invalid_credentials: "Wrong email or password.", csrf: "Session expired — try again.",
  auth_required: "Please sign in first.", freelancer_only: "Only freelancer accounts can do this.",
  too_many: "Too many attempts — wait a moment.", ai_unavailable: "AI is busy — use the manual form below.",
  project_not_completed: "You can review after both sides confirm completion.",
  already_reviewed: "You already reviewed this project.", already_proposed: "You already sent a proposal here.",
  invalid_url: "Enter a valid https:// link.", forbidden: "Not allowed.",
}[e] || e || "Something went wrong.");

// ─── Reveal on scroll ───
const io = new IntersectionObserver((es) => es.forEach((x) => x.isIntersecting && x.target.classList.add("in")), { threshold: 0.12 });
function observeReveals(root = document) { $$(".reveal", root).forEach((el) => io.observe(el)); }

// ─── Avatar ───
function avatarHtml(name, url, cls = "") {
  const initial = esc((name || "?").trim()[0].toUpperCase());
  return `<span class="avatar ${cls}">${url ? `<img src="${esc(url)}" alt="" loading="lazy" onerror="this.remove()">` : initial}</span>`;
}

// ═══════════ الصدفة: nav + footer ═══════════
function shell(content, active = "") {
  const navLinks = [
    ["#/talent", T.browse_talent, "talent"],
    ["#/services", T.services, "services"],
    ["#/discover", T.discover, "discover"],
  ];
  $app.innerHTML = `
  <nav class="nav"><div class="wrap nav-in">
    <a class="logo" href="#/"><span class="logo-mark">N</span>NAKSAB</a>
    <div class="nav-links ${active === "home" ? "" : ""}" id="navlinks">
      ${navLinks.map(([h, l, k]) => `<a href="${h}" class="${active === k ? "on" : ""}">${l}</a>`).join("")}
      ${S.user ? `<a href="#/dashboard" class="${active === "dashboard" ? "on" : ""}">${T.dashboard}</a>` : ""}
      ${S.user?.role === "admin" ? `<a href="#/admin" class="${active === "admin" ? "on" : ""}">${T.admin}</a>` : ""}
    </div>
    <div class="nav-cta">
      ${S.user ? `
        <button class="btn ghost sm" id="n-notif" title="${T.notifications}">◦<span id="notif-dot" hidden></span></button>
        <a class="btn ghost sm" href="#/dashboard">${esc(S.user.name.split(" ")[0])}</a>
        <button class="btn sm" id="n-out">${T.sign_out}</button>` : `
        <button class="btn ghost sm" id="n-in">${T.sign_in}</button>
        <button class="btn primary sm" id="n-up">${T.get_started}</button>`}
      <button class="burger" id="n-burger" aria-label="Menu">≡</button>
    </div>
  </div></nav>
  <main id="view">${content}</main>
  ${footerHtml()}
  <div class="modal-bg" id="modal" hidden></div>`;
  $("#n-out")?.addEventListener("click", async () => { await api("/api/auth/logout", "POST", {}); S.user = null; S.csrf = null; location.hash = "#/"; route(); });
  $("#n-in")?.addEventListener("click", () => authModal("login"));
  $("#n-up")?.addEventListener("click", () => authModal("register"));
  $("#n-burger")?.addEventListener("click", () => $("#navlinks").classList.toggle("open"));
  $("#n-notif")?.addEventListener("click", showNotifications);
  observeReveals();
}

function footerHtml() {
  return `<footer><div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand">
        <a class="logo" href="#/"><span class="logo-mark">N</span>NAKSAB</a>
        <p>The professional marketplace where talent meets opportunity — matching, project management and reputation in one honest workspace.</p>
        <div class="studio">
          <span class="s-mark">V</span>
          <span class="s-name">A product by<b>VITO BYTE STUDIO</b></span>
        </div>
      </div>
      <div class="foot-col"><h4>Marketplace</h4>
        <a href="#/talent">Browse talent</a><a href="#/services">Services</a><a href="#/discover">Discover</a><a href="#/request/new">Post a project</a>
      </div>
      <div class="foot-col"><h4>Account</h4>
        <a href="#/dashboard">Dashboard</a><a href="#" data-auth="register">Join as freelancer</a><a href="#" data-auth="register">Hire talent</a>
      </div>
      <div class="foot-col"><h4>Platform</h4>
        <a href="#/ads">Advertise</a><a href="#/about">About</a><a href="#/about">Trust &amp; Safety</a>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© ${new Date().getFullYear()} NAKSAB — Vito Byte Studio. All rights reserved.</span>
      <span>English · العربية قريباً · Français bientôt</span>
    </div>
  </div></footer>`;
}

// ═══════════ المصادقة ═══════════
function authModal(mode) {
  const m = $("#modal");
  m.hidden = false;
  m.innerHTML = `<div class="modal">
    <div class="spread" style="margin-bottom:18px"><b style="font-size:17px">${mode === "login" ? T.welcome_back : T.create_account}</b><button class="btn ghost sm" id="m-x">✕</button></div>
    <div class="field"><label>${T.email}</label><input id="a-email" type="email" autocomplete="email" /></div>
    <div class="field"><label>${T.password}</label><input id="a-pass" type="password" placeholder="8+ characters incl. a digit" /></div>
    ${mode === "register" ? `
    <div class="form-2">
      <div class="field"><label>${T.full_name}</label><input id="a-name" /></div>
      <div class="field"><label>${T.username}</label><input id="a-user" placeholder="lowercase-username" dir="ltr" /></div>
    </div>
    <div class="field"><label>${T.role}</label><select id="a-role"><option value="freelancer">${T.freelancer}</option><option value="client">${T.client}</option></select></div>` : ""}
    <button class="btn primary" id="a-go" style="width:100%;justify-content:center;margin-top:6px">${mode === "login" ? T.sign_in : T.get_started}</button>
    <div class="msg" id="a-msg" hidden></div>
    <p class="tiny muted center" style="margin-top:14px">${mode === "login" ? `New to NAKSAB? <a href="#" id="m-swap" style="color:var(--brand2)">Create an account</a>` : `Already a member? <a href="#" id="m-swap" style="color:var(--brand2)">Sign in</a>`}</p>
  </div>`;
  $("#m-x").onclick = () => (m.hidden = true);
  m.onclick = (e) => { if (e.target === m) m.hidden = true; };
  $("#m-swap").onclick = (e) => { e.preventDefault(); authModal(mode === "login" ? "register" : "login"); };
  $("#a-go").onclick = async () => {
    const btn = $("#a-go"), msg = $("#a-msg");
    const email = $("#a-email").value.trim(), pass = $("#a-pass").value;
    btn.disabled = true; btn.textContent = "Securing…"; msg.hidden = true;
    try {
      if (!pass || pass.length < 8 || !/\d/.test(pass)) throw "invalid_k0";
      const k0 = await k0Of(email, pass);
      let r;
      if (mode === "login") r = await api("/api/auth/login", "POST", { email, k0 });
      else {
        const name = $("#a-name").value.trim(), username = $("#a-user").value.trim().toLowerCase(), role = $("#a-role").value;
        if (name.length < 2) throw "invalid_name";
        r = await api("/api/auth/register", "POST", { email, k0, name, username, role });
      }
      if (!r.ok) throw r.data.error || "error";
      if (r.data.error === "legacy") throw "Please re-register — security upgrade in progress.";
      S.user = r.data.user; S.csrf = r.data.csrf;
      m.hidden = true;
      toast(`Welcome, ${S.user.name.split(" ")[0]}`);
      route();
    } catch (e2) {
      msg.className = "msg bad"; msg.hidden = false; msg.textContent = errText(String(e2));
      btn.disabled = false; btn.textContent = mode === "login" ? T.sign_in : T.get_started;
    }
  };
}

async function showNotifications() {
  const r = await api("/api/notifications");
  const m = $("#modal");
  m.hidden = false;
  m.innerHTML = `<div class="modal"><div class="spread" style="margin-bottom:14px"><b>Notifications</b><button class="btn ghost sm" onclick="document.getElementById('modal').hidden=true">✕</button></div>
    ${(r.data.notifications || []).map((n) => `<div style="padding:10px 0;border-bottom:1px solid var(--line)"><div class="tiny muted">${ago(n.created_at)}</div><div style="font-size:13.5px">${esc(n.body)}</div></div>`).join("") || `<div class="empty">All caught up.</div>`}
  </div>`;
}

// ═══════════ الصفحة الرئيسية ═══════════
const TECHS = [
  ["Cloudflare Workers", "#f38020", "W"], ["Cloudflare D1", "#f38020", "D"], ["Cloudflare KV", "#f38020", "KV"],
  ["Workers AI", "#f38020", "AI"], ["Gemini", "#4285f4", "✦"], ["Groq", "#f55036", "Gq"], ["OpenRouter", "#8b5cf6", "O/R"], ["GitHub Actions", "#e6edf3", "GH"],
];

async function viewHome() {
  shell(`
  <section class="hero">
    <div class="hero-bg"><div class="grid-lines"></div><div class="orb orb-1"></div><div class="orb orb-2"></div><div class="orb orb-3"></div></div>
    <div class="wrap hero-in">
      <div class="hero-badge reveal"><span class="dot"></span> Stage 1 live — early access</div>
      <h1 class="reveal">${T.tagline.split(",")[0]},<br><span class="grad">with confidence.</span></h1>
      <p class="lead reveal">${T.lead}</p>
      <div class="hero-cta reveal">
        <a class="btn primary" href="#/request/new">${T.post_project} →</a>
        <a class="btn" href="#/talent">${T.explore}</a>
      </div>
      <div class="hero-stats reveal">
        <div class="stat"><b data-count="${Math.max(6, (S._stats?.freelancers ?? 6))}">0</b><span>Freelancers</span></div>
        <div class="stat"><b data-count="${Math.max(4, (S._stats?.services ?? 4))}">0</b><span>Live services</span></div>
        <div class="stat"><b data-count="${Math.max(2, (S._stats?.categories ?? 8))}">0</b><span>Categories</span></div>
        <div class="stat"><b>100%</b><span>Real engagements</span></div>
      </div>
    </div>
  </section>

  <section class="marquee-sec">
    <div class="wrap"><div class="marquee-label">${T.built_on}</div>
      <div class="marquee"><div class="marquee-track">
        ${[...TECHS, ...TECHS].map(([name, color, mark]) => `<span class="tech"><span class="mark" style="background:${color}22;border:1px solid ${color}55;color:${color}">${mark}</span>${name}</span>`).join("")}
      </div></div>
    </div>
  </section>

  <section class="sec">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">${T.how_eyebrow}</span><h2>${T.how_title}</h2></div>
      <div class="steps stagger reveal">
        <div class="card step reveal" style="--i:0"><span class="num">01</span><div class="ic">✎</div><h3>Describe your project</h3><p>Plain language is enough. Our AI structures it into a clear, professional request — budgets and requirements stay yours.</p></div>
        <div class="card step reveal" style="--i:1"><span class="num">02</span><div class="ic">◎</div><h3>Get matched, not spammed</h3><p>A weighted matching engine ranks the right professionals by skills, availability and reputation. You choose who sees your project.</p></div>
        <div class="card step reveal" style="--i:2"><span class="num">03</span><div class="ic">✓</div><h3>Ship with proof</h3><p>Milestones, messages and deliverables in one room. Completion needs mutual confirmation — reviews stay honest.</p></div>
      </div>
    </div>
  </section>

  <section class="sec" style="padding-top:0">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Categories</span><h2>Every craft, one marketplace</h2></div>
      <div class="t-grid stagger" id="home-cats"><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>
    </div>
  </section>

  <section class="sec" style="padding-top:0">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Featured professionals</span><h2>Talent that ships</h2></div>
      <div class="t-grid" id="home-talent"><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>
      <div class="center" style="margin-top:26px"><a class="btn" href="#/talent">Browse all talent →</a></div>
    </div>
  </section>

  <section class="sec">
    <div class="wrap"><div class="panel reveal center" style="padding:52px 30px;position:relative;overflow:hidden">
      <div class="orb orb-1" style="opacity:.25"></div>
      <h2 style="font-size:clamp(24px,4vw,34px);font-weight:800;letter-spacing:-.8px;position:relative">Ready when you are.</h2>
      <p class="muted" style="margin:12px auto 26px;max-width:460px;position:relative">Join the first wave of professionals and clients building on NAKSAB.</p>
      <div class="row" style="justify-content:center;position:relative">
        <button class="btn primary" id="cta-up" style="padding:12px 24px">Create your profile</button>
        <a class="btn" href="#/about" style="padding:12px 24px">About NAKSAB</a>
      </div>
    </div></div>
  </section>`, "home");

  // البيانات
  api("/api/categories").then((r) => {
    S.cats = r.data.categories || [];
    $("#home-cats").innerHTML = S.cats.map((c) => `<a class="card hover card-pad reveal in" href="#/talent?category=${c.slug}" style="display:flex;gap:14px;align-items:center">
      <span style="font-size:20px;color:var(--brand2)">${esc(c.icon || "◆")}</span><span><b style="font-size:14px">${esc(c.name)}</b><span class="tiny muted" style="display:block">${c.slug}</span></span></a>`).join("");
  });
  api("/api/freelancers").then((r) => {
    S._stats = S._stats || {};
    S._stats.freelancers = (r.data.freelancers || []).length;
    $("#home-talent").innerHTML = (r.data.freelancers || []).slice(0, 6).map(talentCard).join("") || `<div class="empty">${T.no_results}</div>`;
  });
  api("/api/services").then((r) => { S._stats = S._stats || {}; S._stats.services = (r.data.services || []).length; });
  $("#cta-up")?.addEventListener("click", () => S.user ? (location.hash = "#/dashboard") : authModal("register"));
  animateCounts();
}

function animateCounts() {
  $$("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count || 0);
    if (!target) { el.textContent = "—"; return; }
    const t0 = performance.now(), dur = 1100;
    const tick = (t) => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(target * (0.2 + 0.8 * p * p)); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
}

function talentCard(u) {
  return `<a class="card hover t-card reveal" href="#/u/${esc(u.username)}">
    <div class="t-top">${avatarHtml(u.name, u.avatar_url)}
      <div><div class="t-name">${esc(u.name)} ${u.verified ? '<span class="verified">✓</span>' : ""}</div>
      <div class="t-sub">@${esc(u.username)}${u.country ? " · " + esc(u.country) : ""}</div></div>
      <span class="chip ${u.available ? "ok" : ""}" style="margin-inline-start:auto">${u.available ? "Available" : "Busy"}</span>
    </div>
    <div style="font-size:13px;color:var(--dim);min-height:34px">${esc(u.headline || "")}</div>
    <div class="chips">${jsonChips(u.skills, 4)}</div>
    <div class="svc-price"><span class="stars">${stars(u.reputation)} <span class="tiny muted">${u.reviews_count || 0}</span></span><span class="tiny muted">${u.completed || 0} projects</span></div>
  </a>`;
}
const jsonChips = (s, n) => { try { return (JSON.parse(s || "[]") || []).slice(0, n).map((x) => `<span class="chip">${esc(x)}</span>`).join(""); } catch { return ""; } };

// ═══════════ استكشاف المواهب ═══════════
async function viewTalent(params) {
  shell(`<div class="wrap page-head"><h1>${T.browse_talent}</h1><p>Professionals building their reputation with real projects.</p></div>
  <div class="wrap"><div class="toolbar">
    <input id="q" placeholder="${T.search}" value="${esc(params.get("q") || "")}" />
    <select id="cat"><option value="">${T.all_categories}</option>${S.cats.map((c) => `<option value="${c.slug}" ${params.get("category") === c.slug ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
  </div><div class="t-grid" id="list"><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div></div></div>`, "talent");
  const load = async () => {
    const q = $("#q").value.trim(), cat = $("#cat").value;
    const r = await api(`/api/freelancers?q=${encodeURIComponent(q)}&category=${encodeURIComponent(cat)}`);
    $("#list").innerHTML = (r.data.freelancers || []).map(talentCard).join("") || `<div class="empty">${T.no_results}</div>`;
  };
  let h; $("#q").addEventListener("input", () => { clearTimeout(h); h = setTimeout(load, 300); });
  $("#cat").addEventListener("change", load);
  await load();
}

// ═══════════ الخدمات ═══════════
async function viewServices(params) {
  shell(`<div class="wrap page-head"><h1>${T.services}</h1><p>Fixed-scope offerings with clear prices and delivery times.</p></div>
  <div class="wrap"><div class="toolbar">
    <input id="q" placeholder="${T.search}" value="${esc(params.get("q") || "")}" />
    <select id="cat"><option value="">${T.all_categories}</option>${S.cats.map((c) => `<option value="${c.slug}" ${params.get("category") === c.slug ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
  </div><div class="t-grid" id="list"><div class="skel"></div><div class="skel"></div><div class="skel"></div></div></div>`, "services");
  const load = async () => {
    const q = $("#q").value.trim(), cat = $("#cat").value;
    const r = await api(`/api/services?q=${encodeURIComponent(q)}&category=${encodeURIComponent(cat)}`);
    $("#list").innerHTML = (r.data.services || []).map((sv) => `
      <a class="card hover t-card" href="#/service/${sv.id}">
        <div class="t-top">${avatarHtml(sv.name, sv.avatar_url)}
          <div><div class="t-name">${esc(sv.title)}</div><div class="t-sub">by ${esc(sv.name)} ${sv.verified ? '✓' : ""}</div></div>
        </div>
        <div style="font-size:13px;color:var(--dim);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(sv.description)}</div>
        <div class="chips"><span class="chip brand">${esc(sv.category || "general")}</span><span class="chip">${sv.delivery_days}d delivery</span></div>
        <div class="svc-price"><span class="price">${money(sv.price_min, sv.currency)}${sv.price_max > sv.price_min ? `–${money(sv.price_max, sv.currency)}` : ""}</span><span class="stars">${stars(sv.reputation)}</span></div>
      </a>`).join("") || `<div class="empty">${T.no_results}</div>`;
  };
  let h; $("#q").addEventListener("input", () => { clearTimeout(h); h = setTimeout(load, 300); });
  $("#cat").addEventListener("change", load);
  await load();
}

async function viewService(id) {
  const r = await api(`/api/services/${id}`);
  if (!r.ok) return shell(`<div class="empty"><div class="big">404</div>Service not found.</div>`);
  const sv = r.data.service;
  shell(`<div class="wrap page-head"><a href="#/services" class="tiny muted">← ${T.services}</a>
    <h1 style="margin-top:8px">${esc(sv.title)}</h1></div>
  <div class="wrap grid" style="grid-template-columns:2fr 1fr;align-items:start">
    <div class="panel">
      <p style="white-space:pre-wrap;color:var(--dim);font-size:14.5px">${esc(sv.description)}</p>
      ${sv.requirements ? `<h3 style="margin:22px 0 8px;font-size:15px">Requirements</h3><p class="muted" style="font-size:13.5px;white-space:pre-wrap">${esc(sv.requirements)}</p>` : ""}
    </div>
    <div class="panel">
      <div class="price" style="font-size:26px">${money(sv.price_min, sv.currency)}${sv.price_max > sv.price_min ? ` – ${money(sv.price_max, sv.currency)}` : ""}</div>
      <div class="chips" style="margin:14px 0"><span class="chip">${sv.delivery_days}-day delivery</span><span class="chip">${sv.revisions} revision${sv.revisions == 1 ? "" : "s"}</span></div>
      <a class="btn primary" style="width:100%;justify-content:center" href="#/u/${esc(sv.username)}">View profile & contact</a>
    </div>
  </div>`, "services");
}

// ═══════════ صفحة المستقل ═══════════
async function viewProfile(username) {
  const r = await api(`/api/u/${encodeURIComponent(username)}`);
  if (!r.ok) return shell(`<div class="empty"><div class="big">404</div>Profile not found.</div>`);
  const { profile: u, services, works, reviews } = r.data;
  shell(`<div class="wrap page-head">
    <div class="card" style="padding:26px;display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap">
      ${avatarHtml(u.name, u.avatar_url, "lg")}
      <div style="flex:1;min-width:220px">
        <div class="t-name" style="font-size:19px">${esc(u.name)} ${u.verified ? '<span class="verified">✓</span>' : ""}</div>
        <div class="t-sub">@${esc(u.username)}${u.country ? " · " + esc(u.country) : ""} · joined ${new Date(u.created_at).toLocaleDateString("en", { month: "short", year: "numeric" })}</div>
        <div style="margin:10px 0 4px;font-size:14.5px">${esc(u.headline || "")}</div>
        <div class="chips">${jsonChips(u.skills, 8)}</div>
      </div>
      <div style="text-align:right">
        <div class="stars" style="font-size:16px">${stars(u.reputation)} <span class="tiny muted">${u.reputation || 0} (${u.reviews_count || 0})</span></div>
        <div class="tiny muted" style="margin:6px 0 14px">${u.completed || 0} completed projects</div>
        <div class="row">
          ${S.user && S.user.username !== u.username ? `<button class="btn sm" id="follow-btn">Follow</button>` : ""}
          <a class="btn primary sm" href="#/request/new">Hire me</a>
        </div>
      </div>
    </div>
  </div>
  <div class="wrap grid" style="grid-template-columns:2fr 1fr;align-items:start">
    <div>
      <div class="panel" style="margin-bottom:14px"><h3 style="font-size:15px;margin-bottom:10px">About</h3><p class="muted" style="font-size:13.5px;white-space:pre-wrap">${esc(u.bio || "No bio yet.")}</p></div>
      <h3 style="font-size:16px;margin:18px 0 12px">Services</h3>
      <div class="t-grid">${services.map((sv) => `<a class="card hover t-card" href="#/service/${sv.id}">
        <b style="font-size:14px">${esc(sv.title)}</b>
        <div style="font-size:12.5px;color:var(--dim);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(sv.description)}</div>
        <div class="svc-price"><span class="price">${money(sv.price_min, sv.currency)}</span><span class="chip">${sv.delivery_days}d</span></div></a>`).join("") || `<div class="empty">No services yet.</div>`}</div>
      <h3 style="font-size:16px;margin:26px 0 12px">Portfolio</h3>
      <div class="feed">${works.map(workCard).join("") || `<div class="empty">No work samples yet.</div>`}</div>
    </div>
    <div>
      <div class="panel"><h3 style="font-size:15px;margin-bottom:12px">Reviews</h3>
        ${reviews.map((rv) => `<div style="padding:10px 0;border-bottom:1px solid var(--line)">
          <div class="row" style="gap:8px">${avatarHtml(rv.author_name, rv.author_avatar)}<span class="tiny"><b>${esc(rv.author_name)}</b> <span class="muted">· ${ago(rv.created_at)}</span></span></div>
          <div class="stars" style="margin:6px 0">${stars(rv.rating)}</div>
          <div style="font-size:13px;color:var(--dim)">${esc(rv.body)}</div></div>`).join("") || `<div class="empty">No reviews yet.</div>`}
      </div>
    </div>
  </div>`, "talent");
  $("#follow-btn")?.addEventListener("click", async (e) => {
    const r2 = await api(`/api/users/${encodeURIComponent(username)}/follow`, "POST", {});
    if (r2.ok) e.target.textContent = r2.data.following ? "Following" : "Follow";
  });
}

const workCard = (w) => `<div class="card post reveal">
  ${w.media_url ? `<div class="media">${w.media_type === "video" ? videoEmbed(w.media_url, `<span class="play">▶</span>`) : `<img src="${esc(w.thumb_url || w.media_url)}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'">`}</div>` : ""}
  <div class="body"><b style="font-size:14px">${esc(w.title)}</b><div class="tiny muted" style="margin:4px 0 8px">${esc(w.kind)} · ${ago(w.created_at)}</div>
  <div style="font-size:13px;color:var(--dim)">${esc(w.description)}</div></div>
  <div class="post-actions"><button class="like-btn ${w.liked ? "liked" : ""}" data-id="${w.id}">♥ ${w.likes || 0}</button></div>
</div>`;

// روابط فيديو خارجية فقط (لا رفع مباشر — قرار المواصفة)
function videoEmbed(url, fallback = "") {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (yt) return `<iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" loading="lazy" allowfullscreen title="video"></iframe>`;
  if (vimeo) return `<iframe src="https://player.vimeo.com/video/${vimeo[1]}" loading="lazy" allowfullscreen title="video"></iframe>`;
  return fallback || `<video src="${esc(url)}" controls preload="none" playsinline></video>`;
}

// ═══════════ Discover ═══════════
async function viewDiscover() {
  shell(`<div class="wrap page-head"><h1>${T.discover}</h1><p>A professional feed — real work, real milestones, no noise.</p>
    <div class="toolbar" style="margin-top:14px"><select id="kind"><option value="">All</option><option value="work">Work</option><option value="achievement">Achievements</option><option value="post">Posts</option></select>
    ${S.user ? `<button class="btn primary sm" id="pf-new">+ Share work</button>` : `<a class="btn sm" href="#/discover">Sign in to interact</a>`}</div></div>
  <div class="wrap"><div class="feed" id="feed"><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div></div></div>`, "discover");
  const load = async () => {
    const kind = $("#kind").value;
    const r = await api(`/api/discover${kind ? `?kind=${kind}` : ""}`);
    $("#feed").innerHTML = (r.data.posts || []).map(workCard).join("") || `<div class="empty">${T.no_results}</div>`;
    $$(".like-btn", $("#feed")).forEach((b) => b.addEventListener("click", async () => {
      if (!S.user) return authModal("login");
      const r2 = await api(`/api/portfolio/${b.dataset.id}/like`, "POST", {});
      if (r2.ok) { b.classList.toggle("liked", r2.data.liked); b.innerHTML = `♥ ${Number(b.textContent.replace(/\D/g, "")) + (r2.data.liked ? 1 : -1)}`; }
    }));
  };
  $("#kind").addEventListener("change", load);
  $("#pf-new")?.addEventListener("click", () => portfolioModal());
  await load();
}

function portfolioModal() {
  const m = $("#modal"); m.hidden = false;
  m.innerHTML = `<div class="modal"><div class="spread" style="margin-bottom:16px"><b>Share your work</b><button class="btn ghost sm" onclick="document.getElementById('modal').hidden=true">✕</button></div>
    <div class="field"><label>Title</label><input id="w-title" /></div>
    <div class="field"><label>Description</label><textarea id="w-desc"></textarea></div>
    <div class="form-2">
      <div class="field"><label>Type</label><select id="w-kind"><option value="work">Work</option><option value="achievement">Achievement</option><option value="post">Post</option></select></div>
      <div class="field"><label>Media type</label><select id="w-mt"><option value="image">Image link</option><option value="video">Video link (YouTube/Vimeo/direct)</option></select></div>
    </div>
    <div class="field"><label>Media URL (https://)</label><input id="w-url" dir="ltr" placeholder="https://…" /></div>
    <div class="field"><label>Thumbnail URL (optional)</label><input id="w-thumb" dir="ltr" placeholder="https://…" /></div>
    <button class="btn primary" id="w-go" style="width:100%;justify-content:center">Publish</button>
    <div class="msg" id="w-msg" hidden></div></div>`;
  $("#w-go").onclick = async () => {
    const r = await api("/api/portfolio", "POST", {
      title: $("#w-title").value, description: $("#w-desc").value, kind: $("#w-kind").value,
      media_type: $("#w-mt").value, media_url: $("#w-url").value.trim(), thumb_url: $("#w-thumb").value.trim(),
    });
    const msg = $("#w-msg");
    if (!r.ok) { msg.className = "msg bad"; msg.hidden = false; msg.textContent = errText(r.data.error); return; }
    m.hidden = true; toast("Published"); viewDiscover();
  };
}

// ═══════════ لوحة التحكم ═══════════
async function viewDashboard() {
  if (!S.user) return authModal("register");
  const isFreelancer = S.user.role === "freelancer";
  shell(`<div class="wrap page-head"><h1>${T.dashboard}</h1><p>${S.user.role === "admin" ? "Platform control." : isFreelancer ? "Your professional presence and pipeline." : "Your projects and requests."}</p></div>
  <div class="wrap">
    <div class="tabs" id="d-tabs">
      <button data-t="profile" class="on">Profile</button>
      ${isFreelancer ? `<button data-t="services">My services</button><button data-t="open">Open requests</button><button data-t="proposals">My proposals</button>` : `<button data-t="requests">My requests</button>`}
      <button data-t="portfolio">Portfolio</button><button data-t="projects">Projects</button>
    </div>
    <div id="d-body"><div class="skel"></div></div>
  </div>`, "dashboard");
  const body = $("#d-body");
  const tabs = $$("#d-tabs button");
  tabs.forEach((b) => b.addEventListener("click", () => {
    tabs.forEach((x) => x.classList.remove("on")); b.classList.add("on"); renderTab(b.dataset.t);
  }));
  async function renderTab(tab) {
    body.innerHTML = `<div class="skel"></div>`;
    if (tab === "profile") {
      const me = await api("/api/me");
      const u = me.data.user || {};
      body.innerHTML = `<div class="panel" style="max-width:720px">
        <div class="form-2">
          <div class="field"><label>Headline</label><input id="p-headline" value="${esc(u.headline || "")}" placeholder="Senior Full-stack Developer · React & Node" /></div>
          <div class="field"><label>Country</label><input id="p-country" value="${esc(u.country || "")}" /></div>
        </div>
        <div class="field"><label>Bio</label><textarea id="p-bio" rows="4">${esc(u.bio || "")}</textarea></div>
        <div class="form-2">
          <div class="field"><label>Categories (comma-separated slugs)</label><input id="p-cats" dir="ltr" value="${esc((JSON.parse(u.categories || "[]") || []).join(", "))}" placeholder="programming, ai" /></div>
          <div class="field"><label>Skills (comma-separated)</label><input id="p-skills" dir="ltr" value="${esc((JSON.parse(u.skills || "[]") || []).join(", "))}" placeholder="react, nodejs, ui-design" /></div>
        </div>
        <div class="form-2">
          <div class="field"><label>Avatar URL (https://)</label><input id="p-avatar" dir="ltr" value="${esc(u.avatar_url || "")}" /></div>
          <div class="field"><label>Status</label><select id="p-avail"><option value="1" ${u.available ? "selected" : ""}>Available for work</option><option value="0" ${!u.available ? "selected" : ""}>Busy</option></select></div>
        </div>
        <button class="btn primary" id="p-save">${T.save}</button><div class="msg" id="p-msg" hidden></div>
      </div>`;
      $("#p-save").onclick = async () => {
        const r = await api("/api/profile", "PUT", {
          headline: $("#p-headline").value, bio: $("#p-bio").value, country: $("#p-country").value,
          avatar_url: $("#p-avatar").value.trim(),
          categories: $("#p-cats").value.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
          skills: $("#p-skills").value.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
          available: $("#p-avail").value === "1",
        });
        const msg = $("#p-msg"); msg.hidden = false;
        msg.className = `msg ${r.ok ? "ok" : "bad"}`; msg.textContent = r.ok ? "Profile saved." : errText(r.data.error);
        if (r.ok) toast("Saved");
      };
    }
    if (tab === "services") {
      const mine = await api(`/api/services`);
      const mineOwn = (await Promise.all([(api(`/api/u/${S.user.username}`))]))[0];
      const list = (mineOwn.data.services || []);
      body.innerHTML = `<div class="spread" style="margin-bottom:14px"><span class="muted tiny">${list.length} service(s)</span><button class="btn primary sm" id="sv-new">+ New service</button></div>
        <div class="t-grid">${list.map((sv) => `<div class="card t-card"><b style="font-size:14px">${esc(sv.title)}</b>
          <div style="font-size:12.5px;color:var(--dim);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(sv.description)}</div>
          <div class="svc-price"><span class="price">${money(sv.price_min, sv.currency)}</span><span class="chip">${sv.delivery_days}d</span></div></div>`).join("") || `<div class="empty">No services yet — create your first offering.</div>`}</div>`;
      $("#sv-new").addEventListener("click", serviceModal);
    }
    if (tab === "portfolio") {
      const mine = await api(`/api/u/${S.user.username}`);
      body.innerHTML = `<div class="spread" style="margin-bottom:14px"><span></span><button class="btn primary sm" id="pf-new2">+ Share work</button></div>
        <div class="feed">${(mine.data.works || []).map(workCard).join("") || `<div class="empty">Nothing shared yet.</div>`}</div>`;
      $("#pf-new2").addEventListener("click", portfolioModal);
      bindLikes(body, renderTab, tab);
    }
    if (tab === "requests") {
      const r = await api("/api/requests");
      body.innerHTML = `<div class="spread" style="margin-bottom:14px"><span class="muted tiny">${(r.data.requests || []).length} request(s)</span><a class="btn primary sm" href="#/request/new">+ New request</a></div>
        ${(r.data.requests || []).map((rq) => `<a class="card hover card-pad" href="#/request/${rq.id}" style="display:block;margin-bottom:10px">
          <div class="spread"><b style="font-size:14.5px">${esc(rq.title)}</b><span class="chip ${rq.status === "open" ? "ok" : ""}">${rq.status}</span></div>
          <div class="tiny muted" style="margin-top:6px">${rq.proposals_count} proposal(s) · budget ${rq.budget_min ? money(rq.budget_min, rq.currency) + (rq.budget_max > rq.budget_min ? "–" + money(rq.budget_max, rq.currency) : "") : "—"} · ${ago(rq.created_at)}</div></a>`).join("") || `<div class="empty">No requests yet.</div>`}`;
    }
    if (tab === "open") {
      const r = await api("/api/requests/open");
      body.innerHTML = `<p class="tiny muted" style="margin-bottom:14px">Ranked for your profile — send a proposal only where you truly fit.</p>
        ${(r.data.requests || []).map((rq) => `<div class="card card-pad" style="margin-bottom:10px">
          <div class="spread"><a href="#/request/${rq.id}" style="flex:1"><b style="font-size:14.5px">${esc(rq.title)}</b>
          <div class="tiny muted" style="margin-top:4px">${esc(rq.category || "general")} · budget ${rq.budget_min ? money(rq.budget_min, rq.currency) : "open"} · ${rq.proposals_count} proposal(s)</div></a>
          <button class="btn primary sm" data-propose="${rq.id}">Propose</button></div></div>`).join("") || `<div class="empty">No open requests right now — check back soon.</div>`}`;
      $$("[data-propose]", body).forEach((b) => b.addEventListener("click", () => proposalModal(b.dataset.propose)));
    }
    if (tab === "proposals") {
      body.innerHTML = `<div class="empty">Open requests you respond to will appear with their status here.</div>`;
    }
    if (tab === "projects") {
      const r = await api("/api/projects");
      body.innerHTML = (r.data.projects || []).map((p) => `<a class="card hover card-pad" href="#/project/${p.id}" style="display:block;margin-bottom:10px">
        <div class="spread"><b style="font-size:14.5px">${esc(p.title)}</b><span class="chip ${p.status === "completed" ? "ok" : p.status === "active" ? "" : "warn"}">${p.status}${p.client_confirmed && p.freelancer_confirmed ? " ✓" : ""}</span></div>
        <div class="tiny muted" style="margin-top:6px">${money(p.amount)} · with ${esc(p.client_id === S.user.id ? p.freelancer_name : p.client_name)} · ${ago(p.created_at)}</div></a>`).join("") || `<div class="empty">No projects yet.</div>`;
    }
  }
  await renderTab("profile");
}

function bindLikes(root, rerender, arg) {
  $$(".like-btn", root).forEach((b) => b.addEventListener("click", async () => {
    const r = await api(`/api/portfolio/${b.dataset.id}/like`, "POST", {});
    if (r.ok) rerender(arg);
  }));
}

function serviceModal() {
  const m = $("#modal"); m.hidden = false;
  m.innerHTML = `<div class="modal" style="max-width:520px"><div class="spread" style="margin-bottom:16px"><b>New service</b><button class="btn ghost sm" onclick="document.getElementById('modal').hidden=true">✕</button></div>
    <div class="field"><label>Title</label><input id="sv-title" placeholder="I will build a responsive landing page" /></div>
    <div class="field"><label>Description</label><textarea id="sv-desc" placeholder="What's included, your process, what the buyer receives…"></textarea></div>
    <div class="form-2">
      <div class="field"><label>Category</label><select id="sv-cat">${S.cats.map((c) => `<option value="${c.slug}">${esc(c.name)}</option>`).join("")}</select></div>
      <div class="field"><label>Currency</label><select id="sv-cur"><option>USD</option><option>EUR</option><option>DZD</option></select></div>
    </div>
    <div class="form-2">
      <div class="field"><label>Price from</label><input id="sv-min" type="number" min="0" /></div>
      <div class="field"><label>Price to</label><input id="sv-max" type="number" min="0" /></div>
    </div>
    <div class="form-2">
      <div class="field"><label>Delivery (days)</label><input id="sv-days" type="number" value="7" min="1" /></div>
      <div class="field"><label>Revisions</label><input id="sv-rev" type="number" value="1" min="0" /></div>
    </div>
    <div class="field"><label>Skills (comma-separated)</label><input id="sv-skills" dir="ltr" placeholder="react, landing-page" /></div>
    <div class="field"><label>Requirements from the buyer</label><input id="sv-req" /></div>
    <button class="btn primary" id="sv-go" style="width:100%;justify-content:center">Publish service</button>
    <div class="msg" id="sv-msg" hidden></div></div>`;
  $("#sv-go").onclick = async () => {
    const r = await api("/api/services", "POST", {
      title: $("#sv-title").value, description: $("#sv-desc").value, category: $("#sv-cat").value,
      currency: $("#sv-cur").value, price_min: Number($("#sv-min").value) || 0, price_max: Number($("#sv-max").value) || 0,
      delivery_days: Number($("#sv-days").value) || 7, revisions: Number($("#sv-rev").value) || 0,
      skills: $("#sv-skills").value.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
      requirements: $("#sv-req").value,
    });
    const msg = $("#sv-msg");
    if (!r.ok) { msg.className = "msg bad"; msg.hidden = false; msg.textContent = errText(r.data.error); return; }
    m.hidden = true; toast("Service published"); route();
  };
}

// ═══════════ طلب جديد (هيكلة ذكية + يدوي) ═══════════
async function viewRequestNew() {
  if (!S.user) return authModal("register");
  shell(`<div class="wrap page-head"><h1>Post a project</h1><p>Describe it in plain words — our AI turns it into a structured request. Manual form always available.</p></div>
  <div class="wrap" style="max-width:760px">
    <div class="panel" style="margin-bottom:14px">
      <div class="field"><label>Describe your project</label><textarea id="r-raw" rows="5" placeholder="I need a landing page for my SaaS with pricing section and contact form. Budget around $300, need it in 2 weeks…"></textarea></div>
      <button class="btn primary" id="r-analyze">✦ Structure it with AI</button>
      <div class="msg info" id="r-ai-msg" hidden></div>
    </div>
    <div class="panel">
      <div class="field"><label>Title</label><input id="r-title" /></div>
      <div class="field"><label>Full description</label><textarea id="r-desc" rows="5"></textarea></div>
      <div class="form-2">
        <div class="field"><label>Category</label><select id="r-cat"><option value="">—</option>${S.cats.map((c) => `<option value="${c.slug}">${esc(c.name)}</option>`).join("")}</select></div>
        <div class="field"><label>Currency</label><select id="r-cur"><option>USD</option><option>EUR</option><option>DZD</option></select></div>
      </div>
      <div class="form-2">
        <div class="field"><label>Budget from</label><input id="r-min" type="number" min="0" /></div>
        <div class="field"><label>Budget to</label><input id="r-max" type="number" min="0" /></div>
      </div>
      <div class="field"><label>Skills needed (comma-separated)</label><input id="r-skills" dir="ltr" placeholder="react, seo" /></div>
      <button class="btn primary" id="r-go" style="width:100%;justify-content:center">Publish request</button>
      <div class="msg" id="r-msg" hidden></div>
    </div>
  </div>`, "dashboard");
  $("#r-analyze").addEventListener("click", async () => {
    const btn = $("#r-analyze"), msg = $("#r-ai-msg");
    const text = $("#r-raw").value.trim();
    if (text.length < 15) { msg.hidden = false; msg.className = "msg info"; msg.textContent = "Write at least a sentence first."; return; }
    btn.disabled = true; btn.textContent = "Analyzing…"; msg.hidden = true;
    const r = await api("/api/requests/structure", "POST", { text });
    btn.disabled = false; btn.textContent = "✦ Structure it with AI";
    if (!r.ok) {
      msg.hidden = false; msg.className = "msg info";
      msg.textContent = "AI is unavailable right now — fill the form manually below, everything works.";
      return;
    }
    const d = r.data.data;
    $("#r-title").value = d.title; $("#r-desc").value = text; $("#r-cat").value = d.category || "";
    $("#r-min").value = d.budget_min || ""; $("#r-max").value = d.budget_max || "";
    $("#r-skills").value = (d.skills || []).join(", ");
    msg.hidden = false; msg.className = "msg ok";
    msg.textContent = `Structured via ${r.data.via}.` + ((d.questions || []).length ? ` Clarify: ${d.questions.join(" ")}` : " Review and publish.");
  });
  $("#r-go").addEventListener("click", async () => {
    const r = await api("/api/requests", "POST", {
      title: $("#r-title").value, description: $("#r-desc").value, category: $("#r-cat").value,
      currency: $("#r-cur").value, budget_min: Number($("#r-min").value) || 0, budget_max: Number($("#r-max").value) || 0,
      skills: $("#r-skills").value.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
      structured: $("#r-raw").value.trim() ? "1" : "",
    });
    const msg = $("#r-msg");
    if (!r.ok) { msg.hidden = false; msg.className = "msg bad"; msg.textContent = errText(r.data.error); return; }
    toast("Request published — matching begins"); location.hash = `#/request/${r.data.id}`;
  });
}

// ═══════════ تفاصيل الطلب ═══════════
async function viewRequest(id) {
  if (!S.user) return authModal("register");
  const mine = await api("/api/requests");
  const rq = (mine.data.requests || []).find((x) => x.id === id);
  const isOwner = !!rq;
  shell(`<div class="wrap page-head"><a href="#/dashboard" class="tiny muted">← ${T.dashboard}</a>
    <h1 style="margin-top:8px">${esc(rq ? rq.title : "Project request")}</h1>
    ${rq ? `<p>${esc(rq.description)}</p><div class="chips" style="margin-top:10px"><span class="chip brand">${esc(rq.category || "general")}</span><span class="chip">${rq.status}</span>${rq.budget_min ? `<span class="chip ok">Budget ${money(rq.budget_min, rq.currency)}${rq.budget_max > rq.budget_min ? "–" + money(rq.budget_max, rq.currency) : ""}</span>` : ""}</div>` : ""}
  </div>
  <div class="wrap"><div id="req-body"><div class="skel"></div></div></div>`, "dashboard");
  const body = $("#req-body");
  if (isOwner) {
    const [m, pr] = await Promise.all([api(`/api/requests/${id}/matches`), api(`/api/requests/${id}/proposals`)]);
    const propCards = (await Promise.all((pr.data.proposals || []).map(async (pp) => `<div class="card card-pad" style="margin-bottom:10px">
        <div class="t-top">${avatarHtml(pp.name, pp.avatar_url)}
          <div style="flex:1"><a class="t-name" href="#/u/${esc(pp.username)}">${esc(pp.name)}</a>
          <div class="t-sub">${stars(pp.reputation)} ${pp.completed || 0} projects ${pp.verified ? "· ✓" : ""}</div></div>
          <div style="text-align:right"><div class="price">${money(pp.amount)}</div><div class="tiny muted">${pp.days} days</div></div>
        </div>
        <p style="font-size:13.5px;color:var(--dim);margin:10px 0;white-space:pre-wrap">${esc(pp.cover)}</p>
        <div class="spread">${pp.status !== "pending" ? `<span class="chip ${pp.status === "accepted" ? "ok" : ""}">${pp.status}</span>` : `<span></span>`}
        ${pp.status === "pending" ? `<button class="btn primary sm" data-accept="${pp.id}">Accept & open project</button>` : pp.status === "accepted" ? `<a class="btn sm" href="#/project/${await projectIdFor(pp.id)}">Open project room →</a>` : ""}</div>
      </div>`))).join("") || `<div class="empty">No proposals yet — matches were notified implicitly by rank.</div>`;
    body.innerHTML = `
      <h3 style="font-size:15px;margin-bottom:10px">Top matches <span class="tiny muted">— weighted by skills, availability & reputation</span></h3>
      <div class="t-grid" style="margin-bottom:26px">${(m.data.matches || []).filter((x) => x.score > 0).slice(0, 6).map((u) => talentCard(u)).join("") || `<div class="empty">No scored matches yet — widen your request.</div>`}</div>
      <h3 style="font-size:15px;margin-bottom:10px">Proposals <span class="tiny muted">(${(pr.data.proposals || []).length})</span></h3>
      ${propCards}
      ${rq.status === "open" ? `<button class="btn danger sm" id="rq-close" style="margin-top:8px">Close this request</button>` : ""}`;
    $$("[data-accept]", body).forEach((b) => b.addEventListener("click", async () => {
      const r = await api(`/api/proposals/${b.dataset.accept}/accept`, "POST", {});
      if (r.ok) { toast("Project created"); location.hash = `#/project/${r.data.project_id}`; }
      else toast(errText(r.data.error));
    }));
    $("#rq-close")?.addEventListener("click", async () => { await api(`/api/requests/${id}/close`, "POST", {}); route(); });
  } else {
    const pr = await api(`/api/requests/${id}/proposals`);
    body.innerHTML = S.user.role === "freelancer" || S.user.role === "admin" ? `
      ${(pr.data.proposals || []).length ? `<div class="panel">Your proposal is <span class="chip ${pr.data.proposals[0].status === "accepted" ? "ok" : ""}">${pr.data.proposals[0].status}</span></div>` : `
      <button class="btn primary" id="pp-new">Send a proposal</button>`}</div>` : `<div class="empty">Sign in as the owner to manage this request.</div>`;
    $("#pp-new")?.addEventListener("click", () => proposalModal(id));
  }
  async function projectIdFor(pid) {
    const r = await api("/api/projects");
    const p = (r.data.projects || []).find((x) => x.proposal_id === pid);
    return p ? p.id : "";
  }
}

function proposalModal(requestId) {
  const m = $("#modal"); m.hidden = false;
  m.innerHTML = `<div class="modal"><div class="spread" style="margin-bottom:16px"><b>Your proposal</b><button class="btn ghost sm" onclick="document.getElementById('modal').hidden=true">✕</button></div>
    <div class="form-2">
      <div class="field"><label>Amount (USD)</label><input id="pp-amt" type="number" min="1" /></div>
      <div class="field"><label>Delivery (days)</label><input id="pp-days" type="number" value="7" min="1" /></div>
    </div>
    <div class="field"><label>Cover letter — why you, specifically</label><textarea id="pp-cover" rows="5" placeholder="30+ characters of substance…"></textarea></div>
    <button class="btn primary" id="pp-go" style="width:100%;justify-content:center">Send proposal</button>
    <div class="msg" id="pp-msg" hidden></div></div>`;
  $("#pp-go").onclick = async () => {
    const r = await api("/api/proposals", "POST", { request_id: requestId, amount: Number($("#pp-amt").value) || 0, days: Number($("#pp-days").value) || 7, cover: $("#pp-cover").value });
    const msg = $("#pp-msg");
    if (!r.ok) { msg.className = "msg bad"; msg.hidden = false; msg.textContent = errText(r.data.error); return; }
    m.hidden = true; toast("Proposal sent"); route();
  };
}

// ═══════════ غرفة المشروع ═══════════
async function viewProject(id) {
  if (!S.user) return authModal("register");
  const r = await api(`/api/projects/${id}`);
  if (!r.ok) return shell(`<div class="empty">Project not found or not yours.</div>`);
  const { project: p, messages, milestones, deliverables, reviewed } = r.data;
  const iAmClient = p.client_id === S.user.id;
  const other = iAmClient ? p.freelancer_name : p.client_name;
  const iReviewed = (reviewed || []).includes(S.user.id);
  const bothConfirmed = p.client_confirmed && p.freelancer_confirmed;
  shell(`<div class="wrap page-head"><a href="#/dashboard" class="tiny muted">← Projects</a>
    <div class="spread" style="margin-top:8px;flex-wrap:wrap;gap:10px">
      <div><h1>${esc(p.title)}</h1><p>${money(p.amount)} · with ${esc(other)} · <span class="chip ${p.status === "completed" ? "ok" : "warn"}">${p.status}</span></p></div>
      <div class="row">
        ${p.status !== "completed" ? `<button class="btn ${iAmClient ? "" : "primary"} sm" id="pj-confirm">${p[iAmClient ? "client_confirmed" : "freelancer_confirmed"] ? "✓ You confirmed — waiting other side" : "Confirm completion"}</button>` : `<span class="chip ok">Completed ✓</span>`}
        ${p.status === "completed" && !iReviewed ? `<button class="btn primary sm" id="pj-review">Leave a review</button>` : ""}
      </div>
    </div></div>
  <div class="wrap grid" style="grid-template-columns:1.6fr 1fr;align-items:start">
    <div>
      <div class="panel" style="margin-bottom:14px"><h3 style="font-size:14px;margin-bottom:12px">Messages</h3>
        <div class="chat" id="chat">${messages.map((m) => `<div class="bubble ${m.sender_id === S.user.id ? "mine" : ""}"><div class="who">${esc(m.sender_name)} · ${ago(m.created_at)}</div>${esc(m.body)}</div>`).join("") || `<div class="empty tiny">Start the conversation — scope, links, questions.</div>`}</div>
        ${p.status !== "completed" ? `<div class="row" style="margin-top:12px"><input id="msg-in" placeholder="Write a message…" /><button class="btn primary" id="msg-go">${T.send}</button></div>` : ""}
      </div>
      <div class="panel"><h3 style="font-size:14px;margin-bottom:12px">Deliverables</h3>
        ${deliverables.map((d) => `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><a class="tiny" style="color:var(--brand2);word-break:break-all" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.url)}</a><div class="tiny muted">${esc(d.note)} · ${esc(d.added_by_name)} · ${ago(d.created_at)}</div></div>`).join("") || `<div class="tiny muted">No deliverables yet.</div>`}
        <div class="row" style="margin-top:12px"><input id="dv-url" dir="ltr" placeholder="https://link-to-delivery…" /><button class="btn sm" id="dv-go">Attach</button></div>
      </div>
    </div>
    <div>
      <div class="panel" style="margin-bottom:14px"><div class="spread"><h3 style="font-size:14px">Milestones</h3>${p.status !== "completed" ? `<button class="btn ghost sm" id="ms-new">+ Add</button>` : ""}</div>
        ${milestones.map((ms) => `<div class="spread" style="padding:9px 0;border-bottom:1px solid var(--line)">
          <span style="font-size:13px">${esc(ms.title)}</span>
          <span class="chip ${ms.status === "approved" ? "ok" : ms.status === "delivered" ? "warn" : ""}">${ms.status}</span>
          <span class="row">${!iAmClient && ms.status === "pending" ? `<button class="btn ghost sm" data-ms="${ms.id}" data-st="delivered">Deliver</button>` : ""}
          ${iAmClient && ms.status === "delivered" ? `<button class="btn ghost sm" data-ms="${ms.id}" data-st="approved">Approve</button>` : ""}</span></div>`).join("") || `<div class="tiny muted">Break the work into milestones.</div>`}
      </div>
      <div class="panel"><h3 style="font-size:14px;margin-bottom:10px">Trust flow</h3>
        <div class="tiny muted" style="line-height:2">
        ${iAmClient ? "✓" : p.client_confirmed ? "✓" : "◦"} Client confirmation<br>
        ${!iAmClient ? "✓" : p.freelancer_confirmed ? "✓" : "◦"} Freelancer confirmation<br>
        ${bothConfirmed ? `<span style="color:var(--ok)">✓ Project completed — reviews unlocked</span>` : `<span>◦ Completion needs both confirmations</span>`}
        </div></div>
    </div>
  </div>`, "dashboard");
  const scrollChat = () => { const c = $("#chat"); if (c) c.scrollTop = c.scrollHeight; };
  scrollChat();
  $("#msg-go")?.addEventListener("click", sendMsg);
  $("#msg-in")?.addEventListener("keydown", (e) => e.key === "Enter" && sendMsg());
  async function sendMsg() {
    const inp = $("#msg-in"); const v = inp.value.trim(); if (!v) return;
    inp.value = "";
    await api(`/api/projects/${id}/messages`, "POST", { body: v });
    viewProject(id);
  }
  $("#dv-go")?.addEventListener("click", async () => {
    const url = $("#dv-url").value.trim();
    const r2 = await api(`/api/projects/${id}/deliverables`, "POST", { url });
    if (r2.ok) viewProject(id); else toast(errText(r2.data.error));
  });
  $("#ms-new")?.addEventListener("click", () => {
    const title = prompt("Milestone title:"); if (!title) return;
    api(`/api/projects/${id}/milestones`, "POST", { title }).then(() => viewProject(id));
  });
  $$("[data-ms]").forEach((b) => b.addEventListener("click", async () => {
    await api(`/api/milestones/${b.dataset.ms}/status`, "POST", { status: b.dataset.st });
    viewProject(id);
  }));
  $("#pj-confirm")?.addEventListener("click", async () => {
    const r2 = await api(`/api/projects/${id}/confirm`, "POST", {});
    if (r2.ok) { toast(bothConfirmed ? "Completed" : "Confirmed — waiting the other side"); viewProject(id); }
  });
  $("#pj-review")?.addEventListener("click", () => {
    const m = $("#modal"); m.hidden = false;
    m.innerHTML = `<div class="modal"><div class="spread" style="margin-bottom:16px"><b>Review ${esc(other)}</b><button class="btn ghost sm" onclick="document.getElementById('modal').hidden=true">✕</button></div>
      <div class="field"><label>Rating</label><div class="rate-input" id="rate">${[1,2,3,4,5].map((i) => `<span data-r="${i}">★</span>`).join("")}</div></div>
      <div class="field"><label>Your review</label><textarea id="rv-body" rows="4" placeholder="How was the collaboration? Substance helps everyone."></textarea></div>
      <button class="btn primary" id="rv-go" style="width:100%;justify-content:center">Publish review</button>
      <div class="msg" id="rv-msg" hidden></div></div>`;
    let rating = 5;
    const paint = () => $$("#rate span").forEach((sp) => sp.classList.toggle("on", Number(sp.dataset.r) <= rating));
    paint();
    $$("#rate span").forEach((sp) => sp.addEventListener("click", () => { rating = Number(sp.dataset.r); paint(); }));
    $("#rv-go").onclick = async () => {
      const r2 = await api("/api/reviews", "POST", { project_id: id, rating, body: $("#rv-body").value });
      const msg = $("#rv-msg");
      if (!r2.ok) { msg.className = "msg bad"; msg.hidden = false; msg.textContent = errText(r2.data.error); return; }
      m.hidden = true; toast("Review published"); viewProject(id);
    };
  });
}

// ═══════════ ADS ═══════════
async function viewAds() {
  const r = await api("/api/ads/approved");
  shell(`<div class="wrap page-head"><h1>Advertise on NAKSAB</h1><p>Reach professionals and clients. Every campaign is human-reviewed; sponsored content is always labeled. (Payments open in a later stage.)</p></div>
  <div class="wrap" style="max-width:760px">
    ${S.user ? `<div class="panel" style="margin-bottom:16px"><h3 style="font-size:15px;margin-bottom:12px">Submit a campaign for review</h3>
      <div class="field"><label>Title</label><input id="ad-title" /></div>
      <div class="field"><label>Body</label><input id="ad-body" /></div>
      <div class="field"><label>Target link (https://)</label><input id="ad-url" dir="ltr" /></div>
      <div class="field"><label>Media link (optional, https://)</label><input id="ad-media" dir="ltr" /></div>
      <button class="btn primary" id="ad-go">Submit for review</button><div class="msg" id="ad-msg" hidden></div></div>` : `<div class="msg info" style="margin-bottom:16px">Sign in to submit a campaign.</div>`}
    <h3 style="font-size:15px;margin:10px 0 12px">Live sponsored</h3>
    ${(r.data.ads || []).map((a) => `<div class="ad-slot" style="margin-bottom:10px"><span class="ad-tag">Sponsored</span>
      <div style="flex:1"><b style="font-size:14px">${esc(a.title)}</b><div class="tiny muted">${esc(a.body)}</div></div>
      <a class="btn sm" href="${esc(a.target_url)}" target="_blank" rel="noopener noreferrer nofollow" onclick="fetch('/api/ads/${a.id}/click',{method:'POST'})">Visit</a></div>`).join("") || `<div class="empty">No approved campaigns yet.</div>`}
  </div>`);
  $("#ad-go")?.addEventListener("click", async () => {
    const r2 = await api("/api/ads", "POST", { title: $("#ad-title").value, body: $("#ad-body").value, target_url: $("#ad-url").value.trim(), media_url: $("#ad-media").value.trim() });
    const msg = $("#ad-msg");
    if (!r2.ok) { msg.className = "msg bad"; msg.hidden = false; msg.textContent = errText(r2.data.error); return; }
    msg.className = "msg ok"; msg.hidden = false; msg.textContent = "Submitted — pending review.";
  });
}

// ═══════════ About ═══════════
function viewAbout() {
  shell(`<div class="wrap page-head"><h1>About NAKSAB</h1></div>
  <div class="wrap grid" style="max-width:800px">
    <div class="panel"><h3 style="margin-bottom:10px">The product</h3><p class="muted" style="font-size:14px;line-height:1.9">NAKSAB is a professional freelance marketplace: structured project requests, weighted matching, proposals, a real project room (messages, milestones, deliverables), and a reputation system anchored in mutually-confirmed completions. Free to join. No escrow, no payments — those arrive only with the right legal and payment rails, clearly announced.</p></div>
    <div class="panel"><h3 style="margin-bottom:10px">Trust & Safety</h3><p class="muted" style="font-size:14px;line-height:1.9">Completion requires confirmation from both sides. Reviews can carry delivery evidence, suspicious patterns get flagged for human moderation, and everyone can appeal. Sponsored content is always labeled. Your private conversations never leave the platform.</p></div>
    <div class="panel"><h3 style="margin-bottom:10px">Technology</h3><p class="muted" style="font-size:14px;line-height:1.9">Runs on Cloudflare Workers with D1 as the source of truth and KV for caching. AI features (request structuring) use official provider APIs with graceful fallback — the marketplace works even when AI is down.</p></div>
    <div class="panel center"><div class="studio" style="margin:0 auto"><span class="s-mark">V</span><span class="s-name">Designed, built and operated by<b>VITO BYTE STUDIO</b></span></div></div>
  </div>`, "");
}

// ═══════════ Admin ═══════════
async function viewAdmin() {
  if (!S.user || S.user.role !== "admin") return shell(`<div class="empty">Admins only.</div>`);
  const st = await api("/api/admin/stats");
  const d = st.data;
  shell(`<div class="wrap page-head"><h1>${T.admin}</h1><p>Platform health and moderation.</p></div>
  <div class="wrap">
    <div class="stat-grid" style="margin-bottom:20px">
      <div class="card stat-card"><b>${d.users ?? "—"}</b><span>Users</span></div>
      <div class="card stat-card"><b>${d.freelancers ?? "—"}</b><span>Freelancers</span></div>
      <div class="card stat-card"><b>${d.services ?? "—"}</b><span>Services</span></div>
      <div class="card stat-card"><b>${d.requests ?? "—"}</b><span>Requests</span></div>
      <div class="card stat-card"><b>${d.projects ?? "—"}</b><span>Projects</span></div>
      <div class="card stat-card"><b>${d.completed ?? "—"}</b><span>Completed</span></div>
      <div class="card stat-card"><b>${d.flagged_reviews ?? "—"}</b><span>Flagged reviews</span></div>
    </div>
    <div class="tabs"><button class="on" data-t="reviews">Flagged reviews</button><button data-t="ads">Campaigns</button><button data-t="users">Users</button><button data-t="audit">Audit</button></div>
    <div id="a-body"><div class="skel"></div></div>
  </div>`, "admin");
  const body = $("#a-body");
  $$(".tabs button").forEach((b) => b.addEventListener("click", async () => {
    $$(".tabs button").forEach((x) => x.classList.remove("on")); b.classList.add("on"); render(b.dataset.t);
  }));
  async function render(t) {
    body.innerHTML = `<div class="skel"></div>`;
    if (t === "reviews") {
      const r = await api("/api/admin/reviews/flagged");
      body.innerHTML = (r.data.reviews || []).map((rv) => `<div class="card card-pad" style="margin-bottom:10px"><div class="spread">
        <span><b class="tiny">@${esc(rv.author_username)}</b> → <span class="tiny">@${esc(rv.target_username)}</span> <span class="stars">${stars(rv.rating)}</span></span>
        <span class="row"><button class="btn sm" data-rv="${rv.id}" data-s="published">Keep</button><button class="btn danger sm" data-rv="${rv.id}" data-s="hidden">Hide</button></span></div>
        <p class="tiny muted" style="margin-top:6px">${esc(rv.body)}</p></div>`).join("") || `<div class="empty">No flagged reviews.</div>`;
      $$("[data-rv]", body).forEach((b) => b.addEventListener("click", async () => { await api(`/api/admin/reviews/${b.dataset.rv}/moderate`, "POST", { status: b.dataset.s }); render("reviews"); }));
    }
    if (t === "ads") {
      const r = await api("/api/admin/ads");
      body.innerHTML = (r.data.ads || []).map((a) => `<div class="card card-pad" style="margin-bottom:10px"><div class="spread">
        <span><b class="tiny">@${esc(a.advertiser_username)}</b> — ${esc(a.title)} <span class="chip ${a.status === "approved" ? "ok" : a.status === "rejected" ? "bad" : "warn"}">${a.status}</span></span>
        <span class="row">${a.status !== "approved" ? `<button class="btn sm" data-ad="${a.id}" data-s="approved">Approve</button>` : ""}
        ${a.status !== "rejected" ? `<button class="btn danger sm" data-ad="${a.id}" data-s="rejected">Reject</button>` : ""}</span></div></div>`).join("") || `<div class="empty">No campaigns.</div>`;
      $$("[data-ad]", body).forEach((b) => b.addEventListener("click", async () => { await api(`/api/admin/ads/${b.dataset.ad}/moderate`, "POST", { status: b.dataset.s }); render("ads"); }));
    }
    if (t === "users") {
      const r = await api("/api/admin/users");
      body.innerHTML = `<div class="card" style="overflow-x:auto"><table style="width:100%;font-size:13px;border-collapse:collapse">
        ${(r.data.users || []).map((u) => `<tr style="border-bottom:1px solid var(--line)">
          <td style="padding:10px">@${esc(u.username)}</td><td class="muted">${esc(u.email)}</td><td><span class="chip">${u.role}</span></td>
          <td><button class="btn ghost sm" data-uv="${u.id}" data-v="${u.verified ? 0 : 1}">${u.verified ? "✓ verified" : "verify"}</button></td>
          <td><button class="btn ghost sm ${u.banned ? "danger" : ""}" data-ub="${u.id}" data-b="${u.banned ? 0 : 1}">${u.banned ? "unban" : "ban"}</button></td></tr>`).join("")}</table></div>`;
      $$("[data-uv]", body).forEach((b) => b.addEventListener("click", async () => { await api(`/api/admin/users/${b.dataset.uv}/flags`, "POST", { verified: b.dataset.v === "1" }); render("users"); }));
      $$("[data-ub]", body).forEach((b) => b.addEventListener("click", async () => { await api(`/api/admin/users/${b.dataset.ub}/flags`, "POST", { banned: b.dataset.b === "1" }); render("users"); }));
    }
    if (t === "audit") {
      const r = await api("/api/admin/audit");
      body.innerHTML = (r.data.audit || []).map((a) => `<div class="tiny muted" style="padding:6px 0;border-bottom:1px solid var(--line)">${new Date(a.created_at).toLocaleString("en")} — <b style="color:var(--fg)">${esc(a.action)}</b> ${esc(a.detail)}</div>`).join("") || `<div class="empty">No admin actions yet.</div>`;
    }
  }
  await render("reviews");
}

// ═══════════ الموجّه ═══════════
async function boot() {
  const me = await api("/api/me");
  S.user = me.data.user; S.csrf = me.data.csrf || null;
  const cats = await api("/api/categories");
  S.cats = cats.data.categories || [];
  route();
  window.addEventListener("hashchange", route);
}

async function route() {
  const hash = location.hash || "#/";
  const [path, qs] = hash.split("?");
  const params = new URLSearchParams(qs || "");
  const parts = path.replace(/^#\//, "").split("/");
  window.scrollTo({ top: 0 });
  try {
    if (parts[0] === "" || path === "#/") return viewHome();
    if (parts[0] === "talent") return viewTalent(params);
    if (parts[0] === "services") return parts[1] ? viewService(parts[1]) : viewServices(params);
    if (parts[0] === "u" && parts[1]) return viewProfile(parts[1]);
    if (parts[0] === "discover") return viewDiscover();
    if (parts[0] === "dashboard") return viewDashboard();
    if (parts[0] === "request") return parts[1] === "new" ? viewRequestNew() : viewRequest(parts[1]);
    if (parts[0] === "projects") return parts[1] ? viewProject(parts[1]) : viewDashboard();
    if (parts[0] === "ads") return viewAds();
    if (parts[0] === "about") return viewAbout();
    if (parts[0] === "admin") return viewAdmin();
    return viewHome();
  } catch (e) {
    console.error(e);
    shell(`<div class="empty"><div class="big">⚠</div>Something broke — try again.</div>`);
  }
}

boot();
