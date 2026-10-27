// ——— الإدماج الأول: ثلاث نقرات وأنت داخل الشبكة ———
import { api, state, toast } from "../api.js";
import { t, setLang, lang, DICTS } from "../i18n.js";

const SECTORS = [
  { id: "FOUNDER", cls: "#E5A93C", k: "who_founder", s: "who_founder_s" },
  { id: "MERCHANT", cls: "#10B981", k: "who_merchant", s: "who_merchant_s" },
  { id: "FREELANCER", cls: "#3B82F6", k: "who_freelancer", s: "who_freelancer_s" },
];

export function showOnboarding(onDone) {
  const root = document.getElementById("overlay-root");
  let step = 0;
  let sector = null;

  function render() {
    root.innerHTML = "";
    const el = document.createElement("div");
    el.className = "onb";
    if (step === 0) {
      el.innerHTML = `
        <div class="kicker">${t("onb_kicker")}</div>
        <h1>${t("onb_t1")}<br /><span>${t("onb_t2")}</span></h1>
        <p class="lead">${t("onb_lead")}</p>
        <div class="onb-cards">
          ${SECTORS.map((s) => `
            <button class="onb-card" data-sector="${s.id}">
              <span class="ic" style="background:${s.cls}">${{ FOUNDER: "N", MERCHANT: "M", FREELANCER: "F" }[s.id]}</span>
              <span><b>${t(s.k)}</b><small>${t(s.s)}</small></span>
            </button>`).join("")}
        </div>
        <div class="onb-actions">
          <button class="cta" id="onb-next" style="visibility:hidden">${t("next")}</button>
          <button class="cta ghost" id="onb-demo">${t("try_demo")}</button>
          <button class="linklike" id="onb-guest">${t("enter_guest")}</button>
        </div>`;
      el.querySelectorAll("[data-sector]").forEach((b) =>
        b.addEventListener("click", () => {
          el.querySelectorAll("[data-sector]").forEach((x) => x.classList.remove("sel"));
          b.classList.add("sel");
          sector = b.dataset.sector;
          el.querySelector("#onb-next").style.visibility = "visible";
        })
      );
      el.querySelector("#onb-next").addEventListener("click", () => {
        localStorage.setItem("nx_sector", sector);
        if (state.user) return finish();
        step = 1; render();
      });
      el.querySelector("#onb-guest").addEventListener("click", () => { localStorage.setItem("nx_seen", "1"); finish(); });
      el.querySelector("#onb-demo").addEventListener("click", demoLogin);
    } else if (step === 1) {
      el.innerHTML = `
        <div class="kicker">${t("onb_kicker")}</div>
        <h1>${lang === "ar" ? "لغتك؟" : lang === "en" ? "Your language?" : "Votre langue ?"}</h1>
        <div class="onb-cards">
          ${Object.keys(DICTS).map((l) => `
            <button class="onb-card ${l === lang ? "sel" : ""}" data-lang="${l}">
              <span class="ic" style="background:#1a1a22">A</span>
              <span><b>${DICTS[l].lang_name}</b></span>
            </button>`).join("")}
        </div>
        <div class="onb-actions">
          <button class="cta" id="onb-lang-next">${t("next")}</button>
        </div>`;
      el.querySelectorAll("[data-lang]").forEach((b) =>
        b.addEventListener("click", () => {
          el.querySelectorAll("[data-lang]").forEach((x) => x.classList.remove("sel"));
          b.classList.add("sel");
          setLang(b.dataset.lang);
        })
      );
      el.querySelector("#onb-lang-next").addEventListener("click", () => { step = 2; render(); });
    } else {
      el.innerHTML = `
        <div class="kicker">${t("onb_kicker")}</div>
        <h1>${t("create_account")}</h1>
        <div class="field"><label>${t("auth_name")}</label><input id="r-name" type="text" /></div>
        <div class="field"><label>${t("auth_email")}</label><input id="r-email" type="email" dir="ltr" /></div>
        <div class="field"><label>${t("auth_user")}</label><input id="r-user" type="text" dir="ltr" /></div>
        <div class="field"><label>${t("auth_pass")}</label><input id="r-pass" type="password" dir="ltr" /></div>
        <div class="onb-actions">
          <button class="cta" id="r-go">${t("register")}</button>
          <button class="cta ghost" id="r-demo">${t("try_demo")}</button>
        </div>`;
      el.querySelector("#r-go").addEventListener("click", async () => {
        const body = {
          full_name: el.querySelector("#r-name").value.trim(),
          email: el.querySelector("#r-email").value.trim(),
          username: el.querySelector("#r-user").value.trim(),
          password: el.querySelector("#r-pass").value,
          sector: localStorage.getItem("nx_sector") || "FREELANCER",
        };
        const r = await api.post("/api/auth/register", body);
        if (!r.ok) return toast(t("err_" + (r.data.error ?? "generic")) ?? t("err_generic"));
        localStorage.setItem("nx_seen", "1");
        await refreshMe();
        finish();
      });
      el.querySelector("#r-demo").addEventListener("click", demoLogin);
    }
    root.appendChild(el);
    const dots = document.createElement("div");
    dots.className = "onb-dots";
    dots.style.cssText = "position:absolute;bottom:26px;inset-inline:0";
    dots.innerHTML = [0, 1, 2].map((i) => `<i class="${i <= step ? "on" : ""}"></i>`).join("");
    el.appendChild(dots);
  }

  async function demoLogin() {
    const r = await api.post("/api/auth/demo-login");
    if (!r.ok) return toast(t("err_generic"));
    localStorage.setItem("nx_seen", "1");
    await refreshMe();
    toast(lang === "ar" ? "مرحباً أمين — أنت داخل الحساب التجريبي" : lang === "en" ? "Welcome Amin — demo account active" : "Bienvenue Amin — compte démo actif");
    finish();
  }

  async function refreshMe() {
    const r = await api.get("/api/me");
    state.user = r.data.user ?? null;
    state.csrf = r.data.csrf ?? null;
    state.balance = r.data.balance_cents ?? 0;
    document.dispatchEvent(new CustomEvent("state-changed"));
  }

  function finish() {
    root.innerHTML = "";
    onDone?.();
  }

  render();
}
