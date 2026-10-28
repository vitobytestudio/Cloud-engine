// ——— lib/gift.js: ورقة هدية NEXUS — رصيد 150€ ملك المستخدم داخل المنصة ———
import { t } from "../i18n.js";

export function giftSheet() {
  const root = document.getElementById("overlay-root");
  root.innerHTML = `
    <div class="backdrop" id="g-bk"></div>
    <div class="sheet gift-sheet">
      <div class="gift-crown"><svg viewBox="0 0 24 24" width="30" height="30"><path d="M3 8.2 7.6 12 12 5.4 16.4 12 21 8.2l-1.7 9.3H4.7L3 8.2Z" fill="#E5A93C" stroke="#B78420" stroke-width=".8" stroke-linejoin="round"/><circle cx="12" cy="4.6" r="1.3" fill="#E5A93C"/></svg></div>
      <h3>${t("gift_title")}</h3>
      <p class="sub">${t("gift_body")}</p>
      <button class="cta" id="g-ok" style="justify-content:center;margin-top:6px">${t("gift_ok")}</button>
    </div>`;
  const close = () => { root.innerHTML = ""; };
  root.querySelector("#g-bk").addEventListener("click", close);
  root.querySelector("#g-ok").addEventListener("click", close);
}
