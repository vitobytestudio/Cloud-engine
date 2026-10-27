// ——— البحث العالمي: المبدعون والمقاطع — المميزون أولاً ———
import { api } from "../api.js";
import { t } from "../i18n.js";

export async function renderSearch(view) {
  view.innerHTML = `
    <div class="page search-page">
      <div class="page-head">
        <button class="back-btn" data-back aria-label="${t("back")}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg></button>
        <div class="search-box">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5" stroke-linecap="round"/></svg>
          <input id="search-in" type="search" placeholder="${t("search_ph")}" autocomplete="off" />
        </div>
      </div>
      <div id="search-out"><div class="empty">${t("search_hint")}</div></div>
    </div>`;
  view.querySelector("[data-back]").addEventListener("click", () => (location.hash = "#/feed"));
  const input = view.querySelector("#search-in");
  const out = view.querySelector("#search-out");
  let timer = null;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) { out.innerHTML = `<div class="empty">${t("search_hint")}</div>`; return; }
    timer = setTimeout(async () => {
      const r = await api.get(`/api/search?q=${encodeURIComponent(q)}`);
      if (!r.ok) return;
      const us = r.data.users ?? [], ps = r.data.posts ?? [];
      if (!us.length && !ps.length) { out.innerHTML = `<div class="empty">${t("no_results")}</div>`; return; }
      out.innerHTML = `
        ${us.length ? `<h4 class="sec-h">${t("search_users")}</h4>` : ""}
        ${us.map((u) => `
          <a class="user-row" href="#/profile/${u.username}">
            <span class="who-avatar" style="background:${u.avatar_color}">${(u.full_name ?? "?").trim()[0]}</span>
            <span class="minw0"><b>${u.full_name}</b><small>@${u.username}${u.company_name ? " · " + u.company_name : ""}</small></span>
            <span class="badge ${u.badge_tier}">${u.badge_tier.replace("_", " ")}</span>
          </a>`).join("")}
        ${ps.length ? `<h4 class="sec-h">${t("search_posts")}</h4><div class="grid3">
          ${ps.map((p) => `
            <a href="#/profile/${p.username}">
              <img src="${p.thumbnail_url || "/media/poster1.jpg"}" loading="lazy" alt="" />
              <span class="pv">${p.full_name}</span>
            </a>`).join("")}
        </div>` : ""}`;
    }, 260);
  });
  setTimeout(() => input.focus(), 80);
}
