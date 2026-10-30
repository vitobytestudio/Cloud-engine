// ——— صفحة الهبوط: مستوى Vercel — شبكة، توهجات، بينتو، نبض ———
import { t } from "../i18n.js";
import { state } from "../api.js";

const LOGO = `<svg viewBox="0 0 32 32" fill="none"><defs><linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c6cff"/><stop offset="1" stop-color="#00d4ff"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="#0a0d14" stroke="url(#lg1)" stroke-opacity=".4"/><path d="M9 22 16 9l7 13M12.2 17h7.6" stroke="url(#lg1)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.5 5 5 10-11"/></svg>`;

const MODELS = [
  ["GPT-4o", "#10a37f"], ["Claude 4", "#d97757"], ["Gemini 2.5", "#4e8cff"], ["Llama 4", "#0866ff"],
  ["DeepSeek-V4", "#4d6bfe"], ["Nemotron 3", "#76b900"], ["Qwen 3.5", "#7b3fe4"], ["Kimi K2.5", "#ff6cb5"],
  ["Mistral", "#f55036"], ["Groq LPU", "#fb7185"], ["FLUX.2", "#8b5cf6"], ["Phi-4", "#00a4ef"],
];

function bentoCard(cls, icSvg, title, body, glow) {
  return `<div class="b-card fade-up ${cls}">
    <div class="b-glow" style="background:${glow}"></div>
    <div class="b-ic">${icSvg}</div><h3>${title}</h3><p>${body}</p></div>`;
}

export function renderLanding(root) {
  root.innerHTML = `
  <div class="nav glass">
    <div class="nav-in">
      <a class="nav-logo" href="#/">${LOGO} AIHub</a>
      <nav class="nav-links">
        <a href="#features">${t("sec_title")}</a>
        <a href="#rings">${t("rings_title").split("—")[0]}</a>
        <a href="#pricing">${t("popular")}</a>
      </nav>
      <div class="nav-cta">
        ${state.user ? `<a class="btn btn-grad btn-sm" href="#/app">${t("cta_app")}</a>` : `
          <a class="btn btn-ghost btn-sm" href="#auth-login">${t("login")}</a>
          <a class="btn btn-primary btn-sm" href="#auth-register">${t("cta_start")}</a>`}
      </div>
    </div>
  </div>

  <header class="hero">
    <div class="blob blob-1"></div><div class="blob blob-2"></div><div class="blob blob-3"></div>
    <div class="grid-bg" style="position:absolute;inset:0"></div>
    <div class="hero-kicker fade-up"><span class="dot"></span>${t("live")} · ${t("privacy_first")}</div>
    <h1 class="fade-up d1">${t("hero_1")}<br><span class="grad-text">${t("hero_2")}</span></h1>
    <p class="lead fade-up d2">${t("hero_p")}</p>
    <div class="hero-actions fade-up d3">
      <a class="btn btn-primary btn-lg" href="#auth-register">${t("cta_start")}</a>
      <a class="btn btn-ghost btn-lg" href="#/app">${t("cta_app")} →</a>
    </div>
    <div class="hero-proof fade-up d4">
      <span>${t("zero_cost")}</span><span>·</span><span>${t("no_lock")}</span><span>·</span><span>${t("cancel_anytime")}</span>
    </div>
    <div class="marquee fade-up d5"><div class="marquee-track" id="marq"></div></div>
  </header>

  <section class="section" id="features">
    <div class="sec-head fade-up"><h2>${t("sec_title")}</h2><p>${t("sec_p")}</p></div>
    <div class="bento">
      ${bentoCard("span4", ic_lock(), t("b1_t"), t("b1_p"), "rgba(124,108,255,.25)")}
      ${bentoCard("span2", ic_chart(), t("b2_t"), t("b2_p"), "rgba(0,212,255,.2)")}
      ${bentoCard("span2", ic_agent(), t("b3_t"), t("b3_p"), "rgba(255,108,181,.18)")}
      ${bentoCard("span2", ic_lang(), t("b4_t"), t("b4_p"), "rgba(52,211,153,.15)")}
      ${bentoCard("span2", ic_compare(), t("b5_t"), t("b5_p"), "rgba(124,108,255,.2)")}
      ${bentoCard("span6", ic_globe(), t("b6_t"), t("b6_p"), "rgba(0,212,255,.14)")}
    </div>
  </section>

  <section class="section" id="rings">
    <div class="sec-head fade-up"><h2>${t("rings_title")}</h2></div>
    <div class="rings">
      <div class="ring-card fade-up d1"><div class="ring-num">1</div><h3>${t("ring1_t")}</h3><p>${t("ring1_p")}</p><span class="ring-tag">${t("free_forever")}</span></div>
      <div class="ring-card fade-up d2"><div class="ring-num">2</div><h3>${t("ring2_t")}</h3><p>${t("ring2_p")}</p><span class="ring-tag">NVIDIA · GitHub · Google</span></div>
      <div class="ring-card fade-up d3"><div class="ring-num">3</div><h3>${t("ring3_t")}</h3><p>${t("ring3_p")}</p><span class="ring-tag">GPT · Claude · Gemini</span></div>
    </div>
  </section>

  <section class="section" id="pricing">
    <div class="sec-head fade-up"><h2>${t("tagline")}</h2></div>
    <div class="plans">
      <div class="plan-card fade-up d1">
        <div class="plan-name">Free</div>
        <div class="plan-price">0€</div><div class="plan-sub">${t("plan_f_p")}</div>
        <ul class="plan-feats">
          <li>${CHECK} ${t("ring1_t")}</li><li>${CHECK} ${t("ring2_t")}</li><li>${CHECK} ${t("feat_instant20")}</li><li>${CHECK} ${t("vault_t")}</li>
        </ul>
        <a class="btn btn-ghost" href="#auth-register">${t("cta_start")}</a>
      </div>
      <div class="plan-card featured fade-up d2">
        <div class="plan-badge">${t("popular")}</div>
        <div class="plan-name">Pro</div>
        <div class="plan-price">14€<small>${t("month")}</small></div>
        <div class="plan-sub">134€${t("year")} (−20%)</div>
        <ul class="plan-feats">
          <li>${CHECK} ${t("b1_t")}</li><li>${CHECK} ${t("b2_t")}</li><li>${CHECK} ${t("b5_t")}</li><li>${CHECK} 10 ${t("b3_t")}</li><li>${CHECK} ${t("b6_t")}</li>
        </ul>
        <a class="btn btn-grad" href="#auth-register">14€${t("month")}</a>
      </div>
      <div class="plan-card fade-up d3">
        <div class="plan-name">Team</div>
        <div class="plan-price">39€<small>${t("month")}</small></div>
        <div class="plan-sub">374€${t("year")} · 5 ${t("seats")}</div>
        <ul class="plan-feats">
          <li>${CHECK} Pro ×5</li><li>${CHECK} ${t("b3_t")}</li><li>${CHECK} ${t("b2_t")}</li><li>${CHECK} +8€ / ${t("seats")}</li>
        </ul>
        <a class="btn btn-ghost" href="#auth-register">39€${t("month")}</a>
      </div>
    </div>
  </section>

  <footer class="footer">
    <div>${LOGO.replace('width="30"','width="22"')} </div>
    <div style="margin-top:8px">${t("footer_rights")} · © 2026 AIHub</div>
    <div class="fl"><a href="#/">${t("terms")}</a><a href="#/">${t("privacy")}</a><a href="#/">${t("docs")}</a></div>
  </footer>`;

  // شريط النماذج ×2 للانسياب اللانهائي
  const marq = root.querySelector("#marq");
  const chips = MODELS.map(([n, c]) => `<span class="model-chip"><span class="dot" style="background:${c}"></span>${n}</span>`).join("");
  marq.innerHTML = chips + chips;
}

function ic_lock() { return `<svg viewBox="0 0 24 24" fill="none" stroke="url(#lg1)" stroke-width="1.8"><defs><linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c6cff"/><stop offset="1" stop-color="#00d4ff"/></linearGradient></defs><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.8a4 4 0 1 1 8 0v2.7" stroke-linecap="round"/></svg>`; }
function ic_chart() { return `<svg viewBox="0 0 24 24" fill="none" stroke="#00d4ff" stroke-width="1.9" stroke-linecap="round"><path d="M4 20V13M10 20V6.5M16 20v-9.5M21 20H3.5"/></svg>`; }
function ic_agent() { return `<svg viewBox="0 0 24 24" fill="none" stroke="#ff6cb5" stroke-width="1.8" stroke-linecap="round"><rect x="5" y="8" width="14" height="10" rx="3"/><path d="M12 8V4.5M9.5 13h.01M14.5 13h.01M2.8 12.5v3M21.2 12.5v3"/></svg>`; }
function ic_lang() { return `<svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3.5 12h17M12 3.2c2.6 2.3 3.9 5.3 3.9 8.8s-1.3 6.5-3.9 8.8c-2.6-2.3-3.9-5.3-3.9-8.8s1.3-6.5 3.9-8.8Z"/></svg>`; }
function ic_compare() { return `<svg viewBox="0 0 24 24" fill="none" stroke="#7c6cff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3.5v17M16 3.5v17M3.5 8 8 3.5 12.5 8M12 16l4 4.5 4-4.5" transform="translate(0 0) scale(.98)"/></svg>`; }
function ic_globe() { return `<svg viewBox="0 0 24 24" fill="none" stroke="#00d4ff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3.5 12h17M12 3.2c2.6 2.3 3.9 5.3 3.9 8.8s-1.3 6.5-3.9 8.8c-2.6-2.3-3.9-5.3-3.9-8.8s1.3-6.5 3.9-8.8Z"/></svg>`; }
