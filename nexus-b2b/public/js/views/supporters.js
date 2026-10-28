// ——— v0.10-B: داعمو NEXUS — جمهور معلن ينمو تلقائياً + خبراء الأمن — صفحة مستقلة ———
import { api } from "../api.js";
import { t } from "../i18n.js";
import { supporterEmblem, shieldSvg } from "../lib/badges.js";

export async function renderSupporters(view) {
  view.innerHTML = `<div class="spin"></div>`;
  const r = await api.get("/api/supporters");
  const d = r.data ?? {};
  view.innerHTML = `
    <div class="page sup-page">
      <div class="page-head">
        <button class="back-btn" data-back aria-label="${t("back")}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg></button>
        <div><h2>${t("supporters_title")}</h2><div class="sub">${t("supporters_sub")}</div></div>
      </div>
      ${d.owner_username ? `
      <a class="sup-owner" href="#/profile/${d.owner_username}">
        <span class="b-ic owner-crown">★</span>
        <span class="minw0"><b>${t("owner_first_lbl")}</b><small>@${d.owner_username}</small></span>
        <span class="go">→</span>
      </a>` : ""}
      <div class="sup-count"><b>${d.count ?? 0}</b><span>${t("supporters_count")}</span></div>
      <div class="sup-grid">
        ${(d.items ?? []).map((s) => `
          <div class="sup-card">
            <span class="who-avatar" style="background:url(/api/avatar/${s.username}) center/cover, ${s.avatar_color}">${(s.full_name ?? "?")[0]}</span>
            <span class="minw0"><b>${s.full_name}</b><small>${s.headline}${s.country_code ? " · " + s.country_code : ""}</small></span>
            <span class="sup-em">${supporterEmblem}</span>
          </div>`).join("")}
      </div>
      <h3 class="sup-exp-t">${shieldSvg} ${t("experts_title")}</h3>
      <div class="sup-grid">
        ${(d.experts ?? []).map((x) => `
          <a class="sup-card expert" href="#/profile/${x.username}">
            <span class="who-avatar" style="background:url(/api/avatar/${x.username}) center/cover, ${x.avatar_color}">${(x.full_name ?? "?")[0]}</span>
            <span class="minw0"><b>${x.full_name}</b><small>${(x.bio ?? "").slice(0, 60)}</small></span>
            <span class="sup-em">${shieldSvg}</span>
          </a>`).join("")}
      </div>
      <div class="pay-note">${t("transparency")}</div>
    </div>`;
  view.querySelector("[data-back]")?.addEventListener("click", () => (location.hash = "#/feed"));
}
