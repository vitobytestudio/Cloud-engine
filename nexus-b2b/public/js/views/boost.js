// ——— نافذة التعزيز: ثلاث طبقات وصول — أسعار من الخادم ———
import { api, state, fmtEur, toast } from "../api.js";
import { t } from "../i18n.js";
import { requireAuth } from "./authsheet.js";

import { fmtN } from "../api.js";

const TIERS = [
  { id: "FLASH_DROP", k: "tier_flash", s: "tier_flash_s", price: 1900, views: [4, 6], clicks: [95, 190], leads: [4, 12] },
  { id: "TARGET_BOOST", k: "tier_target", s: "tier_target_s", price: 4900, views: [10, 14], clicks: [260, 500], leads: [12, 32] },
  { id: "DOMINANCE_DROP", k: "tier_dominance", s: "tier_dominance_s", price: 12900, views: [13, 18], clicks: [700, 1200], leads: [35, 85] },
];
const GEO = [
  { id: "", k: "geo_all" }, { id: "DACH", k: "geo_dach" }, { id: "FR", k: "geo_fr" },
  { id: "UK", k: "geo_uk" }, { id: "BENELUX", k: "geo_benelux" }, { id: "NORDICS", k: "geo_nordics" },
];
const AUD = [
  { id: "", k: "aud_all" }, { id: "FOUNDERS", k: "aud_founders" }, { id: "ECOM_BRANDS", k: "aud_ecom" }, { id: "DEV_AGENCIES", k: "aud_dev" },
];

export function openBoost(post, onDone) {
  (async () => {
    if (!(await requireAuth())) return;
    const root = document.getElementById("overlay-root");
    let sel = "FLASH_DROP";
    let geo = "", aud = "";
    const estimate = (id) => TIERS.find((x) => x.id === id);
    root.innerHTML = `
      <div class="backdrop" id="bk"></div>
      <div class="sheet">
        <h3>${t("boost_title")}</h3>
        <p class="sub">${t("boost_sub")}</p>
        <div class="balance-line"><span>${t("balance")}</span><b style="color:var(--emerald)">${fmtEur(state.balance)}</b></div>
        <div class="set-row col" style="padding:0;background:none;border:none">
          <div class="lbl2">${t("target_geo")}</div>
          <div class="seg" id="geo">${GEO.map((g) => `<button data-g="${g.id}" class="${g.id === "" ? "on" : ""}">${t(g.k)}</button>`).join("")}</div>
          <div class="lbl2">${t("target_aud")}</div>
          <div class="seg" id="aud">${AUD.map((g) => `<button data-a="${g.id}" class="${g.id === "" ? "on" : ""}">${t(g.k)}</button>`).join("")}</div>
        </div>
        <div class="tiers">
          ${TIERS.map((tr) => `
            <button class="tier ${tr.id === sel ? "sel" : ""}" data-tier="${tr.id}">
              <span class="row"><b>${t(tr.k)}</b><span class="p">${fmtEur(tr.price)}</span></span>
              <small>${t(tr.s)}</small>
            </button>`).join("")}
        </div>
        <div class="roi-line" id="roi"></div>
        <div class="pay-note">${t("vat_excl_note")} ${t("invoice_note")}<br />${t("gift_no_invoice")}</div>
        ${state.user?.badge_tier === "ENTERPRISE_GOLD" ? `<div class="pay-note">${t("boost_gold_note")}</div>` : ""}
        <div style="display:flex;gap:9px;margin-top:14px">
          <button class="cta" id="b-go">${t("buy_boost")}</button>
          <button class="cta ghost" id="b-x">${t("decline")}</button>
        </div>
      </div>`;
    const roi = root.querySelector("#roi");
    const drawRoi = () => {
      const e = estimate(sel);
      roi.innerHTML = `<b>${t("est_outcomes")}</b> ${fmtN(e.views[0] * 1000)}–${fmtN(e.views[1] * 1000)} ${t("an_views")} · ~${e.clicks[0]}–${e.clicks[1]} ${t("profile_clicks")} · ~${e.leads[0]}–${e.leads[1]} ${t("direct_leads")}`;
    };
    drawRoi();
    root.querySelectorAll("#geo button").forEach((b) => b.addEventListener("click", () => { geo = b.dataset.g; root.querySelectorAll("#geo button").forEach((x) => x.classList.toggle("on", x === b)); }));
    root.querySelectorAll("#aud button").forEach((b) => b.addEventListener("click", () => { aud = b.dataset.a; root.querySelectorAll("#aud button").forEach((x) => x.classList.toggle("on", x === b)); }));
    root.querySelectorAll("[data-tier]").forEach((b) =>
      b.addEventListener("click", () => {
        sel = b.dataset.tier;
        root.querySelectorAll("[data-tier]").forEach((x) => x.classList.toggle("sel", x === b));
        drawRoi();
      })
    );
    root.querySelector("#bk").addEventListener("click", () => (root.innerHTML = ""));
    root.querySelector("#b-x").addEventListener("click", () => (root.innerHTML = ""));
    root.querySelector("#b-go").addEventListener("click", async () => {
      const r = await api.post("/api/boost/checkout", { post_id: post.id, tier: sel, target_country: geo, target_sector: aud });
      if (r.ok) {
        const me = await api.get("/api/me");
        state.balance = me.data.balance_cents ?? 0;
        root.innerHTML = "";
        toast(r.data.free_grant ? t("boost_free_ok") : t("boosted_ok"));
        onDone?.();
      } else if (r.data.error === "insufficient_balance") {
        toast((t("balance") + ": " + fmtEur(r.data.balance_cents)));
      } else toast(t("err_generic"));
    });
  })();
}
