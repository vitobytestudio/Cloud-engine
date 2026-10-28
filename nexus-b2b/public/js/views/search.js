// ——— البحث العالمي: المبدعون والمقاطع — المميزون أولاً ———
import { api } from "../api.js";
import { badgeFor } from "../lib/badges.js";
import { t } from "../i18n.js";

export async function renderSearch(view) {
  view.innerHTML = `
    <div class="page search-page">
      <div class="page-head">
        <button class="back-btn" data-back aria-label="${t("back")}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg></button>
        <div class="search-box">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5" stroke-linecap="round"/></svg>
          <input id="search-in" type="search" placeholder="${t("search_ph")}" autocomplete="off" />
          <button id="filter-btn" class="mini-btn" aria-label="${t("filters")}">⚙</button>
        </div>
      </div>
      <div class="explore-chips">
        <button data-x="sector:FREELANCER">${t("xp_dev_agencies")}</button>
        <button data-x="sector:FOUNDER">${t("xp_saas_founders")}</button>
        <button data-x="sector:MERCHANT">${t("xp_brands")}</button>
        <button data-x="cases">${t("xp_case_studies")}</button>
      </div>
      <div id="filter-bar"></div>
      <div id="search-out"><div class="empty">${t("search_hint")}</div></div>
    </div>`;
  view.querySelector("[data-back]").addEventListener("click", () => (location.hash = "#/feed"));
  const input = view.querySelector("#search-in");
  const out = view.querySelector("#search-out");
  const filters = { country: "", rate_min: "", rate_max: "", vat: false, sector: "" };
  let timer = null;

  const qs = (q) => {
    const sp = new URLSearchParams();
    if (q.length >= 2) sp.set("q", q);
    if (filters.country) sp.set("country", filters.country);
    if (filters.rate_min) sp.set("rate_min", filters.rate_min);
    if (filters.rate_max) sp.set("rate_max", filters.rate_max);
    if (filters.vat) sp.set("vat", "1");
    if (filters.sector) sp.set("sector", filters.sector);
    return sp.toString();
  };
  const drawFilterBar = () => {
    const chips = [];
    if (filters.sector) chips.push(t("who_" + filters.sector.toLowerCase()));
    if (filters.country) chips.push(filters.country);
    if (filters.rate_min || filters.rate_max) chips.push(`€${filters.rate_min || 0}–${filters.rate_max || "∞"}/h`);
    if (filters.vat) chips.push(t("vat_verified"));
    view.querySelector("#filter-bar").innerHTML = chips.length ? `<div class="explore-chips">${chips.map((c) => `<span class="fchip">${c}</span>`).join("")}<button class="fchip x" id="fclear">✕</button></div>` : "";
    view.querySelector("#fclear")?.addEventListener("click", () => {
      Object.assign(filters, { country: "", rate_min: "", rate_max: "", vat: false, sector: "" });
      drawFilterBar(); run(input.value.trim());
    });
  };
  const run = (q) => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (q.length < 2 && !filters.sector && !filters.country && !filters.rate_min && !filters.rate_max && !filters.vat) {
        out.innerHTML = `<div class="empty">${t("search_hint")}</div>`; return;
      }
      const r = await api.get(`/api/search?${qs(q)}`);
      if (!r.ok) return;
      const us = r.data.users ?? [], ps = r.data.posts ?? [];
      if (!us.length && !ps.length) { out.innerHTML = `<div class="empty">${t("no_results")}</div>`; return; }
      out.innerHTML = `
        ${us.length ? `<h4 class="sec-h">${t("search_users")}</h4>` : ""}
        ${us.map((u) => `
          <a class="user-row" href="#/profile/${u.username}">
            <span class="who-avatar" style="background:url(/api/avatar/${u.username}) center/cover, ${u.avatar_color}">${(u.full_name ?? "?").trim()[0]}</span>
            <span class="minw0"><b>${u.full_name}</b>${badgeFor(u)}<small>@${u.username}${u.company_name ? " · " + u.company_name : ""}</small></span>
            <span class="badge ${u.badge_tier}">${u.badge_tier.replace("_", " ")}</span>
            ${u.country_code ? `<span class="fchip">${u.country_code}${Number(u.vat_ok) ? " · VAT" : ""}</span>` : ""}
          </a>`).join("")}
        ${ps.length ? `<h4 class="sec-h">${t("search_posts")}</h4><div class="grid3">
          ${ps.map((p) => `
            <a href="#/post/${p.id}">
              <img src="${p.thumbnail_url || "/media/poster1.jpg"}" loading="lazy" alt="" />
              <span class="pv">${p.full_name}</span>
            </a>`).join("")}
        </div>` : ""}`;
    }, 260);
  };
  input.addEventListener("input", () => run(input.value.trim()));
  view.querySelectorAll(".explore-chips [data-x]").forEach((b) =>
    b.addEventListener("click", () => {
      const v = b.dataset.x;
      if (v === "cases") { filters.sector = ""; input.value = "case study"; run(input.value); return; }
      filters.sector = v.split(":")[1];
      drawFilterBar(); run(input.value.trim());
    }));
  view.querySelector("#filter-btn")?.addEventListener("click", () => {
    const root = document.getElementById("overlay-root");
    root.innerHTML = `
      <div class="backdrop" id="fbk"></div>
      <div class="sheet">
        <h3>${t("filters")}</h3>
        <label class="pe-f"><span>${t("f_country")}</span><input id="fl-cc" maxlength="2" dir="ltr" placeholder="DE, FR, NL…" value="${filters.country}" /></label>
        <div style="display:flex;gap:10px">
          <label class="pe-f" style="flex:1"><span>${t("rate_min_lbl")}</span><input id="fl-min" type="number" min="0" value="${filters.rate_min}" /></label>
          <label class="pe-f" style="flex:1"><span>${t("rate_max_lbl")}</span><input id="fl-max" type="number" min="0" value="${filters.rate_max}" /></label>
        </div>
        <label class="pe-f" style="flex-direction:row;align-items:center;gap:9px"><input type="checkbox" id="fl-vat" ${filters.vat ? "checked" : ""} style="width:18px;height:18px" /><span>${t("vat_verified")}</span></label>
        <div style="display:flex;gap:9px;margin-top:6px">
          <button class="cta" id="fl-go">${t("apply_filters")}</button>
          <button class="cta ghost" id="fl-x">${t("decline")}</button>
        </div>
      </div>`;
    root.querySelector("#fbk").addEventListener("click", () => (root.innerHTML = ""));
    root.querySelector("#fl-x").addEventListener("click", () => (root.innerHTML = ""));
    root.querySelector("#fl-go").addEventListener("click", () => {
      filters.country = root.querySelector("#fl-cc").value.trim().toUpperCase();
      filters.rate_min = root.querySelector("#fl-min").value;
      filters.rate_max = root.querySelector("#fl-max").value;
      filters.vat = root.querySelector("#fl-vat").checked;
      root.innerHTML = "";
      drawFilterBar(); run(input.value.trim());
    });
  });
  setTimeout(() => input.focus(), 80);
}
