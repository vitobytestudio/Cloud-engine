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
        ${u ? `<button class="set-row link" id="edit-profile-row"><div class="lbl2">${t("profile_edit")}<small>${t("profile_edit_s")}</small></div><span class="chev">‹</span></button>` : ""}
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
        <a class="set-row link" href="/legal.html" target="_blank" rel="noopener"><div class="lbl2">${t("legal_link")}</div><span class="chev">‹</span></a>
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

  view.querySelector("#edit-profile-row")?.addEventListener("click", () => openProfileEditor(() => renderSettings(view)));

  // ——— v0.10-B: قيادة الوكيل الآلي بسقوف (الذهبية فقط) ———
  if (state.user?.badge_tier === "ENTERPRISE_GOLD") {
    const rs = await api.get("/api/bot/settings");
    const stt = rs.data.settings ?? {};
    view.insertAdjacentHTML("beforeend", `
      <section class="set-card" id="ap-card">
        <h3>${t("ap_title")}</h3>
        <p class="sub">${t("ap_sub")} · ${t("ap_used")}: ${rs.data.used_today ?? 0}/150</p>
        <div class="set-row"><span>${t("ap_toggle")}</span><button class="sw ${stt.autopilot ? "on" : ""}" id="ap-on"></button></div>
        <div class="ap-fields">
          <label>${t("ap_price")}<input id="ap-price" type="number" min="0" step="10" value="${Math.round((stt.max_price_cents ?? 0) / 100)}" /></label>
          <label>${t("ap_days")}<input id="ap-days" type="number" min="0" max="180" value="${stt.max_days ?? 0}" /></label>
          <label>${t("ap_revs")}<input id="ap-revs" type="number" min="0" max="10" value="${stt.max_revisions ?? 0}" /></label>
        </div>
        <button class="cta ghost" id="ap-save">${t("ap_save")}</button>
      </section>`);
    view.querySelector("#ap-on")?.addEventListener("click", (e) => e.currentTarget.classList.toggle("on"));
    view.querySelector("#ap-save")?.addEventListener("click", async () => {
      const rr = await api.put("/api/bot/settings", {
        autopilot: view.querySelector("#ap-on").classList.contains("on"),
        max_price_cents: Math.round((parseFloat(view.querySelector("#ap-price").value) || 0) * 100),
        max_days: parseInt(view.querySelector("#ap-days").value) || 0,
        max_revisions: parseInt(view.querySelector("#ap-revs").value) || 0,
      });
      if (rr.ok) toast(t("set_saved")); else toast(t("err_generic"));
    });
  }

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


// ——— محرر الملف الشخصي: قائمة بيضاء من الخادم — يستورد من settings لملفه ———
export function openProfileEditor(onDone) {
  const u = state.user;
  if (!u) return;
  const root = document.getElementById("overlay-root");
  const COLORS = ["#E5A93C", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#14B8A6"];
  let color = u.avatar_color || "#3B82F6";
  root.innerHTML = `
    <div class="backdrop" id="pe-bk"></div>
    <div class="sheet">
      <h3>${t("profile_edit")}</h3>
      <div class="pe-ava-row">
        <span class="pe-ava" id="pe-ava" style="background:${color}">${(u.full_name ?? "?").trim()[0]}</span>
        <label class="mini-btn" for="pe-file">${t("change_photo")}</label>
        <input type="file" id="pe-file" accept="image/*" hidden />
      </div>
      <label class="pe-f"><span>${t("name_lbl")}</span><input id="pe-name" maxlength="60" value="${(u.full_name ?? "").replace(/"/g, "&quot;")}" /></label>
      <label class="pe-f"><span>${t("bio_lbl")}</span><textarea id="pe-bio" maxlength="300" rows="3">${u.bio ?? ""}</textarea></label>
      <label class="pe-f"><span>${t("company_lbl")}</span><input id="pe-co" maxlength="60" value="${(u.company_name ?? "").replace(/"/g, "&quot;")}" /></label>
      <div style="display:flex;gap:10px">
        <label class="pe-f" style="flex:1"><span>${t("country_lbl")}</span><input id="pe-cc" maxlength="2" value="${u.country_code ?? ""}" /></label>
        <label class="pe-f" style="flex:2"><span>${t("website_lbl")}</span><input id="pe-site" maxlength="200" value="${(u.portfolio_website ?? "").replace(/"/g, "&quot;")}" /></label>
      </div>
      <div class="pe-f"><span>${t("color_lbl")}</span>
        <div class="pe-colors">${COLORS.map((c) => `<button data-c="${c}" class="${c === color ? "on" : ""}" style="background:${c}"></button>`).join("")}</div>
      </div>
      <div style="display:flex;gap:9px;margin-top:6px">
        <button class="cta" id="pe-save">${t("save_profile")}</button>
        <button class="cta ghost" id="pe-x">${t("decline")}</button>
      </div>
    </div>`;
  root.querySelectorAll(".pe-colors button").forEach((b) =>
    b.addEventListener("click", () => {
      color = b.dataset.c;
      root.querySelectorAll(".pe-colors button").forEach((x) => x.classList.toggle("on", x === b));
    })
  );
  const close = () => (root.innerHTML = "");
  root.querySelector("#pe-bk").addEventListener("click", close);
  root.querySelector("#pe-x").addEventListener("click", close);
  root.querySelector("#pe-file")?.addEventListener("change", async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const img = new Image();
    img.onload = async () => {
      const c = document.createElement("canvas");
      c.width = 256; c.height = 256;
      const x = c.getContext("2d");
      const s = Math.min(img.width, img.height);
      x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 256, 256);
      const data = c.toDataURL("image/jpeg", 0.82);
      const r2 = await api.post("/api/account/avatar", { data });
      if (r2.ok) {
        root.querySelector("#pe-ava").style.background = `url(${data}) center/cover`;
        if (state.user) state.user.avatar_data = "1";
        toast(t("photo_set"));
      } else toast(t(r2.data?.error === "too_large" ? "photo_big" : "err_generic"));
    };
    img.src = URL.createObjectURL(f);
  });
  root.querySelector("#pe-save").addEventListener("click", async () => {
    const r = await api.post("/api/account/profile", {
      full_name: root.querySelector("#pe-name").value,
      bio: root.querySelector("#pe-bio").value,
      company_name: root.querySelector("#pe-co").value,
      country_code: root.querySelector("#pe-cc").value,
      portfolio_website: root.querySelector("#pe-site").value,
      avatar_color: color,
    });
    if (r.ok) {
      Object.assign(state.user, r.data.user ?? {});
      document.dispatchEvent(new CustomEvent("state-changed"));
      close();
      toast(t("saved_ok"));
      onDone?.();
    } else toast(t("err_generic"));
  });
}
