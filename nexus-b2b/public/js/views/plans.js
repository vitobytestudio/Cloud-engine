// ——— v0.10-B: الباقات — مجاني 0€ · أزرق 14€ · زمردي 39€ · ذهبي 119€ (سنوي −20%) + اشتراك حقيقي ———
import { api, state, toast } from "../api.js";
import { t } from "../i18n.js";
import { requireAuth } from "./authsheet.js";

const PLANS = [
  {
    id: "ENTERPRISE_GOLD", cls: "g", price: 119, name: "plan_gold", tag: "plan_gold_s",
    feats: "gold_f", ic: "crown",
  },
  {
    id: "MERCHANT_EMERALD", cls: "e", price: 39, name: "plan_emerald", tag: "plan_emerald_s",
    feats: "emerald_f", ic: "gem",
  },
  {
    id: "PRO_TALENT", cls: "b", price: 14, name: "plan_blue", tag: "plan_blue_s",
    feats: "blue_f", ic: "bolt",
  },
];
const ICONS = {
  crown: `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 8.2 7.6 12 12 5.4 16.4 12 21 8.2l-1.7 9.3H4.7L3 8.2Z" fill="currentColor" stroke="currentColor" stroke-width=".6" stroke-linejoin="round"/></svg>`,
  gem: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3h10l4 6-9 12L3 9z" stroke-linejoin="round"/></svg>`,
  bolt: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" stroke-linejoin="round"/></svg>`,
};
const checkSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m4.5 12.5 5 5 10-11" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export async function renderPlans(view) {
  view.innerHTML = `<div class="spin"></div>`;
  const cur = state.user?.badge_tier ?? "FREE";
  let annual = localStorage.getItem("nx_annual") === "1";
  const cycle = () => (annual ? "YEARLY" : "MONTHLY");
  const perLbl = () => (annual ? t("per_year") : t("per_month"));

  view.innerHTML = `
    <div class="page plans-page">
      <div class="page-head">
        <button class="back-btn" data-back aria-label="${t("back")}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg></button>
        <div><h2>${t("plans_title")}</h2><div class="sub">${t("plans_sub")}</div></div>
      </div>
      <div class="billing-seg">
        <button class="${annual ? "" : "on"}" data-b="m">${t("billed_monthly")}</button>
        <button class="${annual ? "on" : ""}" data-b="a">${t("billed_annual")}</button>
        <span class="save-pill">${t("save_20")}</span>
      </div>
      <section class="plan-card f ${cur === "FREE" ? "cur" : ""}">
        ${cur === "FREE" ? `<span class="plan-ribbon">${t("current_tier")}</span>` : ""}
        <div class="plan-top">
          <div class="minw0">
            <div class="plan-name"><span class="plan-gem">${ICONS.gem}</span>${t("plan_free_name")}</div>
            <div class="plan-tag">${t("plan_free_s")}</div>
          </div>
          <div class="plan-price"><b>0€</b></div>
        </div>
        <div class="plan-feats">
          ${t("free_f").split("·").map((f) => `<div>${checkSvg}<span>${f.trim()}</span></div>`).join("")}
        </div>
        ${cur === "FREE" ? `<button class="cta ghost" disabled style="opacity:.55">${t("current_tier")}</button>`
          : `<button class="cta ghost" data-down>${t("downgrade_lbl")}</button>`}
      </section>
      ${PLANS.map((p, i) => `
        <section class="plan-card ${p.cls} ${cur === p.id ? "cur" : ""}" style="animation-delay:${i * 0.07}s">
          ${cur === p.id ? `<span class="plan-ribbon">${t("current_tier")}</span>` : ""}
          <div class="plan-top">
            <div class="minw0">
              <div class="plan-name"><span class="plan-gem">${ICONS[p.ic]}</span>${t(p.name)}</div>
              <div class="plan-tag">${t(p.tag)}</div>
            </div>
            <div class="plan-price"><b>${annual ? Math.round(p.price * 12 * 0.8) : p.price}€</b><small>/${perLbl()}</small>${annual ? `<small class="was">${p.price * 12}€</small>` : ""}</div>
          </div>
          <div class="plan-feats">
            ${t(p.feats).split("·").map((f) => `<div>${checkSvg}<span>${f.trim()}</span></div>`).join("")}
          </div>
          ${cur === p.id
            ? `<div style="display:flex;gap:8px">
                <button class="cta ghost" data-cancel style="flex:1">${t("cancel_sub")}</button>
              </div>`
            : `<button class="cta" data-act="${p.id}">${t("subscribe_btn")} — ${p.price}€/${t("per_month")}</button>`}
        </section>`).join("")}
      <a class="sup-link" href="#/supporters">${t("supporters_title")} →</a>
      <div class="pay-note">${t("vat_excl_note")}<br />${t("gift_no_invoice")}</div>
    </div>`;

  view.querySelectorAll(".billing-seg [data-b]").forEach((b) =>
    b.addEventListener("click", () => {
      annual = b.dataset.b === "a";
      localStorage.setItem("nx_annual", annual ? "1" : "0");
      renderPlans(view);
    }));
  view.querySelector("[data-back]")?.addEventListener("click", () => (location.hash = "#/profile"));
  view.querySelector("[data-down]")?.addEventListener("click", async () => {
    if (state.user) state.user.badge_tier = "FREE";
    document.dispatchEvent(new CustomEvent("state-changed"));
    toast(t("set_saved"));
    renderPlans(view);
  });
  view.querySelectorAll("[data-act]").forEach((b) =>
    b.addEventListener("click", async () => {
      const ok = await requireAuth();
      if (!ok) return;
      b.disabled = true;
      const r = await api.post("/api/subscribe", { plan: b.dataset.act, cycle: cycle() });
      if (r.ok) {
        if (state.user) state.user.badge_tier = r.data.badge_tier;
        document.dispatchEvent(new CustomEvent("state-changed"));
        toast(t("subscribe_ok"));
        renderPlans(view);
      } else { b.disabled = false; toast(t("err_generic")); }
    }));
  view.querySelector("[data-cancel]")?.addEventListener("click", async () => {
    const r = await api.post("/api/subscribe/cancel", {});
    if (r.ok) toast(t("canceled_ok"));
    else toast(t("err_generic"));
  });
}
