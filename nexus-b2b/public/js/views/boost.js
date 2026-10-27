// ——— نافذة التعزيز: ثلاث طبقات وصول — أسعار من الخادم ———
import { api, state, fmtEur, toast } from "../api.js";
import { t } from "../i18n.js";
import { requireAuth } from "./authsheet.js";

const TIERS = [
  { id: "FLASH_DROP", k: "tier_flash", s: "tier_flash_s", price: 1900 },
  { id: "TARGET_BOOST", k: "tier_target", s: "tier_target_s", price: 4900 },
  { id: "DOMINANCE_DROP", k: "tier_dominance", s: "tier_dominance_s", price: 12900 },
];

export function openBoost(post, onDone) {
  (async () => {
    if (!(await requireAuth())) return;
    const root = document.getElementById("overlay-root");
    let sel = "FLASH_DROP";
    root.innerHTML = `
      <div class="backdrop" id="bk"></div>
      <div class="sheet">
        <h3>${t("boost_title")}</h3>
        <p class="sub">${t("boost_sub")}</p>
        <div class="balance-line"><span>${t("balance")}</span><b style="color:var(--emerald)">${fmtEur(state.balance)}</b></div>
        <div class="tiers">
          ${TIERS.map((tr) => `
            <button class="tier ${tr.id === sel ? "sel" : ""}" data-tier="${tr.id}">
              <span class="row"><b>${t(tr.k)}</b><span class="p">${fmtEur(tr.price)}</span></span>
              <small>${t(tr.s)}</small>
            </button>`).join("")}
        </div>
        ${state.user?.badge_tier === "ENTERPRISE_GOLD" ? `<div class="pay-note">${t("boost_gold_note")}</div>` : ""}
        <div style="display:flex;gap:9px;margin-top:14px">
          <button class="cta" id="b-go">${t("buy_boost")}</button>
          <button class="cta ghost" id="b-x">${t("decline")}</button>
        </div>
      </div>`;
    root.querySelectorAll("[data-tier]").forEach((b) =>
      b.addEventListener("click", () => {
        sel = b.dataset.tier;
        root.querySelectorAll("[data-tier]").forEach((x) => x.classList.toggle("sel", x === b));
      })
    );
    root.querySelector("#bk").addEventListener("click", () => (root.innerHTML = ""));
    root.querySelector("#b-x").addEventListener("click", () => (root.innerHTML = ""));
    root.querySelector("#b-go").addEventListener("click", async () => {
      const r = await api.post("/api/boost/checkout", { post_id: post.id, tier: sel });
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
