// ——— NEXUS B2B: الحالة + التوجيه + الهيكل ———
import { api, state } from "./api.js";
import { setLang, t, lang } from "./i18n.js";
import { showOnboarding } from "./views/onboarding.js";
import { renderFeed } from "./views/feed.js";
import { renderChat } from "./views/chat.js";
import { renderProfile } from "./views/profile.js";
import { renderStudio } from "./views/studio.js";
import { renderSettings } from "./views/settings.js";
import { renderPlans } from "./views/plans.js";
import { renderSearch } from "./views/search.js";
import { renderNotifications } from "./views/notifications.js";
import { renderAnalytics } from "./views/analytics.js";

const view = document.getElementById("view");

function setActive(nav) {
  document.querySelectorAll("#bottom-nav a").forEach((a) => a.classList.toggle("active", a.dataset.nav === nav));
}

async function route() {
  const h = location.hash || "#/feed";
  const [_, page, param] = h.split("/");
  document.getElementById("overlay-root").innerHTML = "";
  if (page === "feed" || !page) { setActive("feed"); await renderFeed(view); }
  else if (page === "studio") { setActive("studio"); await renderStudio(view); }
  else if (page === "chat") { setActive("chat"); await renderChat(view, param); }
  else if (page === "profile") { setActive("profile"); await renderProfile(view, param); }
  else if (page === "settings") { setActive(""); await renderSettings(view); }
  else if (page === "plans") { setActive(""); await renderPlans(view); }
  else if (page === "search") { setActive(""); await renderSearch(view); }
  else if (page === "notifications") { setActive(""); await renderNotifications(view); }
  else if (page === "analytics") { setActive(""); await renderAnalytics(view); }
  else if (page === "post") { setActive(""); await renderPost(view, param); }
  else if (page === "posts") { setActive("posts"); await renderPostsPage(view); }
  else { setActive("feed"); await renderFeed(view); }
}

function drawMe() {
  const btn = document.getElementById("me-btn");
  if (state.user) {
    btn.textContent = (state.user.full_name ?? "?").trim()[0];
    btn.style.background = state.user.avatar_color;
    btn.style.color = "#fff";
    btn.style.borderColor = "transparent";
    btn.onclick = () => (location.hash = `#/profile/${state.user.username}`);
  } else {
    btn.textContent = "?";
    btn.style.background = "var(--surface-strong)";
    btn.style.color = "var(--text-dim)";
    btn.onclick = () => showOnboarding(() => route());
  }
  refreshNotifDot();
}

document.addEventListener("state-changed", drawMe);
setInterval(refreshNotifDot, 60000);

document.getElementById("search-btn")?.addEventListener("click", () => (location.hash = "#/search"));
document.getElementById("create-btn")?.addEventListener("click", () => openCreateSheet());
document.getElementById("notif-btn")?.addEventListener("click", () => (location.hash = "#/notifications"));

async function refreshNotifDot() {
  if (!state.user) return;
  const r = await api.get("/api/notifications");
  const dot = document.getElementById("notif-dot");
  if (dot) dot.hidden = !r.data?.unread;
}

document.getElementById("lang-btn").addEventListener("click", () => {
  setLang(lang === "ar" ? "en" : lang === "en" ? "fr" : "ar");
  route();
});

window.addEventListener("hashchange", route);

(async function init() {
  setLang(localStorage.getItem("nx_lang") || "en");
  // إقلاع فوري من الذاكرة المؤقتة — الشبكة تلحق في الخلفية
  try {
    const cached = JSON.parse(localStorage.getItem("nx_me") || "null");
    if (cached?.user) { state.user = cached.user; state.csrf = cached.csrf; state.balance = cached.balance ?? 0; drawMe(); }
  } catch {}
  const r = await api.get("/api/me");
  state.user = r.data.user ?? null;
  state.csrf = r.data.csrf ?? null;
  state.balance = r.data.balance_cents ?? 0;
  try { localStorage.setItem("nx_me", JSON.stringify({ user: state.user, csrf: state.csrf, balance: state.balance })); } catch {}
  drawMe();
  if (!localStorage.getItem("nx_seen")) {
    showOnboarding(() => route());
  } else if (!document.querySelector("#view > *")) {
    await route();
  }
  // نبضة الحضور
  setInterval(() => { api.post("/api/presence"); api.get("/api/presence").then((x) => {
    const el = document.getElementById("online-n");
    if (el) el.textContent = x.data.online ?? "—";
  }); }, 60000);
})();

import { renderPost } from "./views/post.js";

import { renderPostsPage } from "./views/photos.js";
import { openCreateSheet } from "./views/create.js";
