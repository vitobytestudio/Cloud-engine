// ——— لوحة تحليلات المؤلف: باقة زرقاء فأعلى — بيانات حقيقية يومية ———
import { api, state, fmtN } from "../api.js";
import { t } from "../i18n.js";

export async function renderAnalytics(view) {
  if (!state.user) { location.hash = "#/feed"; return; }
  view.innerHTML = `<div class="page"><div class="spin"></div></div>`;
  const r = await api.get("/api/analytics");
  if (r.status === 403) {
    view.innerHTML = `
      <div class="page">
        <div class="page-head">
          <button class="back-btn" data-back aria-label="${t("back")}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg></button>
          <div><h2>${t("analytics_title")}</h2></div>
        </div>
        <div class="lock-card">
          <span class="lock-ic"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="10.5" width="14" height="10" rx="3"/><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10"/></svg></span>
          <h3>${t("an_locked")}</h3>
          <p>${t("an_locked_s")}</p>
          <a class="cta" href="#/plans">${t("see_plans")}</a>
        </div>
      </div>`;
    view.querySelector("[data-back]").addEventListener("click", () => (location.hash = "#/profile"));
    return;
  }
  if (!r.ok) { view.innerHTML = `<div class="page"><div class="empty">${t("err_generic")}</div></div>`; return; }
  const d = r.data;
  const series = d.series ?? [];
  const maxV = Math.max(1, ...series.map((x) => x.v ?? 0));
  // تعبئة الأيام الفارغة حتى 14 يوماً
  const byDay = new Map(series.map((x) => [x.day, x]));
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const dt = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    days.push(byDay.get(dt) ?? { day: dt, v: 0, l: 0 });
  }
  view.innerHTML = `
    <div class="page analytics-page">
      <div class="page-head">
        <button class="back-btn" data-back aria-label="${t("back")}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg></button>
        <div><h2>${t("analytics_title")}</h2><div class="sub">${t("analytics_sub")}</div></div>
      </div>
      <div class="an-cards">
        <div class="an-card"><b>${fmtN(d.totals.views)}</b><span>${t("an_views")}</span></div>
        <div class="an-card"><b>${fmtN(d.totals.likes)}</b><span>${t("an_likes")}</span></div>
        <div class="an-card"><b>${fmtN(d.totals.saves)}</b><span>${t("an_saves")}</span></div>
        <div class="an-card"><b>${d.totals.engagement}%</b><span>${t("an_engagement")}</span></div>
      </div>
      <div class="an-chart-card">
        <h4>${t("an_chart")} <small>${t("an_chart_s")}</small></h4>
        <div class="an-bars">${days.map((x, i) => `
          <div class="an-bar-col" title="${x.day}: ${fmtN(x.v)}">
            <i style="height:${Math.max(4, Math.round(((x.v ?? 0) / maxV) * 100))}%" class="${i === days.length - 1 ? "today" : ""}"></i>
          </div>`).join("")}</div>
      </div>
      <h4 class="sec-h">${t("an_top")}</h4>
      ${(d.top ?? []).map((p) => `
        <div class="an-post">
          <img src="${p.thumbnail_url || "/media/poster1.jpg"}" loading="lazy" alt="" />
          <div class="minw0"><b>${p.title}</b><small>${fmtN(p.views_count)} ${t("views")} · ${fmtN(p.likes_count)} ♥ · ${fmtN(p.saves_count)} ${t("save")}</small></div>
        </div>`).join("")}
    </div>`;
  view.querySelector("[data-back]").addEventListener("click", () => (location.hash = "#/profile"));
}
