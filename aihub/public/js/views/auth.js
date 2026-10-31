// ——— صفحات المصادقة — بأسلوب عالمي: بطاقة زجاجية على توهج ———
import { api, state } from "../api.js";
import { t } from "../i18n.js";

const LOGO = `<svg viewBox="0 0 32 32" fill="none" style="width:44px;height:44px"><defs><linearGradient id="lg3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c6cff"/><stop offset="1" stop-color="#00d4ff"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="#0a0d14" stroke="url(#lg3)" stroke-opacity=".4"/><path d="M9.5 22.5v-13l13 13v-13" stroke="url(#lg3)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function renderAuth(root, mode) {
  const isLogin = mode === "login";
  document.title = `Nexus — ${isLogin ? t("login") : t("register")}`;
  root.innerHTML = `
  <div style="position:relative;min-height:100dvh;display:grid;place-items:center;padding:24px;overflow:hidden">
    <div class="blob blob-1"></div><div class="blob blob-2"></div>
    <div class="grid-bg" style="position:absolute;inset:0"></div>
    <div class="glass fade-up" style="position:relative;width:min(420px,100%);border-radius:22px;padding:34px 30px">
      <div style="position:absolute;top:14px;inset-inline-end:14px"><div class="lang-sw">${[["ar","ع"],["en","EN"],["fr","FR"]].map(([l,lb]) => `<button data-lang="${l}" class="${(localStorage.getItem("ah_lang")||"ar")===l?"on":""}">${lb}</button>`).join("")}</div></div>
      <div style="text-align:center;margin-bottom:26px">
        ${LOGO}
        <h1 style="font-size:22px;font-weight:800;letter-spacing:-.4px;margin-top:16px">${isLogin ? t("login") : t("register")}</h1>
        <p style="color:var(--dim);font-size:13px;margin-top:8px">${t("tagline")}</p>
      </div>
      <div class="field"><label>${t("email")}</label><input id="a-email" type="email" autocomplete="email" placeholder="you@company.com" dir="ltr" /></div>
      ${isLogin ? "" : `<div class="field"><label>${t("name")}</label><input id="a-name" type="text" autocomplete="name" /></div>`}
      <div class="field"><label>${t("password")}</label><input id="a-pass" type="password" autocomplete="${isLogin ? "current-password" : "new-password"}" dir="ltr" /></div>
      ${isLogin ? "" : `<div class="hint" style="margin:-4px 0 12px">${t("weak_pass")}</div>`}
      <button class="btn btn-grad" style="width:100%" id="a-go">${isLogin ? t("login") : t("cta_start")}</button>
      <div style="text-align:center;margin-top:18px;font-size:13px;color:var(--dim)">
        ${isLogin ? `${t("no_account")} <a href="#auth-register" style="color:var(--brand-2);font-weight:600">${t("register")}</a>`
                  : `${t("have_account")} <a href="#auth-login" style="color:var(--brand-2);font-weight:600">${t("login")}</a>`}
      </div>
      <div style="text-align:center;margin-top:16px"><a href="#/" style="font-size:12.5px;color:var(--faint)">← AIHub</a></div>
      <div id="a-err" style="margin-top:14px;color:var(--err);font-size:12.5px;text-align:center"></div>
    </div>
  </div>`;

  const go = root.querySelector("#a-go");
  const err = root.querySelector("#a-err");
  // تمطيط كلمة المرور في المتصفح: 200k دورة مجاناً — الخادم لا يرى كلمة المرور أبداً في الحسابات الجديدة
  const stretch = async (email, password) => {
    if (!window.crypto?.subtle) return null;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode("nexus-hub:c1:" + email.toLowerCase()), iterations: 200000 }, key, 256);
    return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
  };
  const submit = async () => {
    const email = root.querySelector("#a-email").value.trim();
    const password = root.querySelector("#a-pass").value;
    const name = (root.querySelector("#a-name") || {}).value?.trim() ?? "";
    err.textContent = "";
    if (!isLogin && (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password))) { err.textContent = t("weak_pass"); return; }
    go.disabled = true;
    const k0 = await stretch(email, password);
    if (!k0) { go.disabled = false; err.textContent = t("no_subtle"); return; }
    let r = isLogin
      ? await api.post("/api/auth/login", { email, k0 })
      : await api.post("/api/auth/register", { email, k0, full_name: name });
    if (isLogin && !r.ok && r.data?.error === "legacy")
      r = await api.post("/api/auth/login", { email, k0, password }); // ترقية صامتة لحساب قديم
    go.disabled = false;
    if (!r.ok) {
      const map = { weak_password: t("weak_pass"), email_taken: t("email_taken"), invalid_credentials: t("invalid_creds"), too_many: t("too_many"), invalid_input: t("err_generic"), legacy: t("err_generic") };
      err.textContent = map[r.data?.error] ?? t("err_generic");
      return;
    }
    state.user = r.data.user; state.csrf = r.data.csrf;
    location.hash = "#/app";
  };
  go.addEventListener("click", submit);
  root.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); }, { once: false });
  root.querySelectorAll(".lang-sw [data-lang]").forEach((b) => b.addEventListener("click", () => {
    import("../i18n.js").then((m) => { m.setLang(b.dataset.lang); location.reload(); });
  }));
}
