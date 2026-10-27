// ——— الإعدادات: حساب، تفضيلات، تشغيل، إجراءات، حول — صفحة مستقلة ———
import { api, state, toast } from "../api.js";
import { t, setLang, lang, DICTS } from "../i18n.js";
import { showOnboarding } from "./onboarding.js";

export async function renderSettings(view) {
  let version = "—";
  try { version = (await (await fetch("/version.json")).json()).version ?? "—"; } catch {}

  const u = state.user;
  view.innerHTML = `
    <div class="page settings-page">
      <div class="page-head">
        <button class="back-btn" data-back aria-label="${t("back")}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg></button>
        <div><h2>${t("settings_title")}</h2></div>
      </div>

      <div class="set-group">
        <h4>${t("set_account")}</h4>
        <div class="set-row"><div class="lbl2"><b>${u ? u.full_name : t("enter_guest")}</b><small>${u ? "@" + u.username : "—"}</small></div>
          ${u ? `<span class="badge ${u.badge_tier}">${tierName(u.badge_tier)}</span>` : ""}</div>
        ${u ? `<a class="set-row link" href="#/plans"><div class="lbl2">${t("plans_title")}<small>${t("plans_sub")}</small></div><span class="chev">‹</span></a>` : ""}
      </div>

      <div class="set-group">
        <h4>${t("set_prefs")}</h4>
        <div class="set-row col">
          <div class="lbl2">${t("set_lang")}</div>
          <div class="seg" data-key="lang">
            ${Object.keys(DICTS).map((l) => `<button data-v="${l}" class="${l === lang ? "on" : ""}">${DICTS[l].lang_name}</button>`).join("")}
          </div>
        </div>
        ${u ? `
        <div class="set-row col">
          <div class="lbl2">${t("set_sector")}<small>${t("set_sector_s")}</small></div>
          <div class="seg" data-key="sector">
            ${["FOUNDER", "MERCHANT", "FREELANCER"].map((sc) => `<button data-v="${sc}" class="${u.sector === sc ? "on" : ""}">${t("who_" + sc.toLowerCase())}</button>`).join("")}
          </div>
        </div>` : ""}
        <div class="set-row">
          <div class="lbl2">${t("set_autoplay")}<small>${t("set_autoplay_s")}</small></div>
          <button class="switch ${(localStorage.getItem("nx_autoplay") ?? "on") === "on" ? "on" : ""}" id="sw-auto" aria-label="${t("set_autoplay")}"><i></i></button>
        </div>
      </div>

      <div class="set-group">
        <h4>${t("set_actions")}</h4>
        <div class="set-row"><div class="lbl2">${t("clear_cache")}<small>${t("clear_cache_s")}</small></div>
          <button class="mini-btn" id="clear-btn">${t("do_clear")}</button></div>
        ${u ? `<div class="set-row"><div class="lbl2">${t("logout")}</div>
          <button class="mini-btn danger" id="logout-btn">${t("logout")}</button></div>` : ""}
      </div>

      <div class="set-group">
        <h4>${t("about")}</h4>
        <div class="set-row"><div class="lbl2">NEXUS B2B<small>${t("about_s")}</small></div><span class="ver">${t("ver_label")} ${version}</span></div>
        <div class="set-row"><div class="lbl2"><small>${t("demo_disclosure")}</small></div></div>
      </div>
    </div>`;

  view.querySelector("[data-back]")?.addEventListener("click", () => (location.hash = "#/profile"));

  view.querySelectorAll(".seg[data-key=lang] button").forEach((b) =>
    b.addEventListener("click", () => {
      setLang(b.dataset.v);
      toast(t("set_saved"));
      renderSettings(view);
    })
  );

  view.querySelectorAll(".seg[data-key=sector] button").forEach((b) =>
    b.addEventListener("click", async () => {
      const r = await api.post("/api/account/sector", { sector: b.dataset.v });
      if (r.ok) {
        if (state.user) state.user.sector = r.data.sector;
        view.querySelectorAll(".seg[data-key=sector] button").forEach((x) => x.classList.toggle("on", x === b));
        toast(t("set_saved"));
      } else toast(t("err_generic"));
    })
  );

  view.querySelector("#sw-auto")?.addEventListener("click", (e) => {
    const sw = e.currentTarget;
    const on = !sw.classList.contains("on");
    sw.classList.toggle("on", on);
    localStorage.setItem("nx_autoplay", on ? "on" : "off");
  });

  view.querySelector("#clear-btn")?.addEventListener("click", () => { localStorage.clear(); location.reload(); });

  view.querySelector("#logout-btn")?.addEventListener("click", async () => {
    await api.post("/api/auth/logout");
    state.user = null; state.csrf = null; state.balance = 0;
    localStorage.removeItem("nx_me");
    document.dispatchEvent(new CustomEvent("state-changed"));
    showOnboarding(() => (location.hash = "#/feed"));
  });
}

function tierName(tier) {
  const map = { ENTERPRISE_GOLD: "plan_gold", MERCHANT_EMERALD: "plan_emerald", PRO_TALENT: "plan_blue", FREE: "tier_free" };
  return t(map[tier] ?? "tier_free");
}
