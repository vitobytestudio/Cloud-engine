// ——— الباقات الاحترافية: ثلاث طبقات عضوية بتصميم فاخر — صفحة مستقلة ———
import { api, state, toast } from "../api.js";
import { t } from "../i18n.js";

const PLANS = [
  {
    id: "ENTERPRISE_GOLD", cls: "g", price: 149, name: "plan_gold", tag: "plan_gold_s",
    feats: "gold_f", icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8l4 4 5-6 5 6 4-4v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke-linejoin="round"/></svg>`,
  },
  {
    id: "MERCHANT_EMERALD", cls: "e", price: 49, name: "plan_emerald", tag: "plan_emerald_s",
    feats: "emerald_f", icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3h10l4 6-9 12L3 9z" stroke-linejoin="round"/></svg>`,
  },
  {
    id: "PRO_TALENT", cls: "b", price: 19, name: "plan_blue", tag: "plan_blue_s",
    feats: "blue_f", icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" stroke-linejoin="round"/></svg>`,
  },
];
const ANNUAL = Object.fromEntries(PLANS.map((p) => [p.id, p.price * 12]));

const checkSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m4.5 12.5 5 5 10-11" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export async function renderPlans(view) {
  view.innerHTML = `<div class="spin"></div>`;
  const cur = state.user?.badge_tier ?? "FREE";
  let annual = localStorage.getItem("nx_annual") === "1";
  const priceOf = (p) => (annual ? Math.round(p.price * 12 * 0.8) : p.price);
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
      ${PLANS.map((p, i) => `
        <section class="plan-card ${p.cls} ${cur === p.id ? "cur" : ""}" style="animation-delay:${i * 0.07}s">
          ${cur === p.id ? `<span class="plan-ribbon">${t("current_tier")}</span>` : ""}
          <div class="plan-top">
            <div class="minw0">
              <div class="plan-name"><span class="plan-gem">${p.icon}</span>${t(p.name)}</div>
              <div class="plan-tag">${t(p.tag)}</div>
            </div>
            <div class="plan-price"><b>${priceOf(p)}€</b><small>/${perLbl()}</small>${annual ? `<small class="was">${p.price * 12}€</small>` : ""}</div>
          </div>
          <div class="plan-feats">
            ${t(p.feats).split("·").map((f) => `<div>${checkSvg}<span>${f.trim()}</span></div>`).join("")}
          </div>
          ${cur === p.id
            ? `<button class="cta ghost" disabled style="opacity:.55">${t("current_tier")}</button>`
            : `<button class="cta" data-act="${p.id}">${t("activate_demo")}</button>`}
        </section>`).join("")}
      <div class="pay-note">${t("vat_excl_note")}<br />${t("payments_soon")}</div>
    </div>`;

  view.querySelectorAll(".billing-seg [data-b]").forEach((b) =>
    b.addEventListener("click", () => {
      annual = b.dataset.b === "a";
      localStorage.setItem("nx_annual", annual ? "1" : "0");
      renderPlans(view);
    }));
  view.querySelector("[data-back]")?.addEventListener("click", () => (location.hash = "#/profile"));
  view.querySelectorAll("[data-act]").forEach((b) =>
    b.addEventListener("click", async () => {
      b.disabled = true;
      const r = await api.post("/api/account/tier", { tier: b.dataset.act });
      if (r.ok) {
        if (state.user) state.user.badge_tier = r.data.badge_tier;
        document.dispatchEvent(new CustomEvent("state-changed"));
        toast(t("activated_ok"));
        renderPlans(view);
      } else { b.disabled = false; toast(t("err_generic")); }
    })
  );
}
