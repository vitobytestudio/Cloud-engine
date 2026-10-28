// ——— بوابة المصادقة الحقيقية: دخول، حساب جديد، ڨوڨل، استرجاع، تأكيد بريد ———
import { api, state, toast } from "../api.js";
import { t } from "../i18n-bridge.js";

let pendingResolve = null;

export function requireAuth() {
  if (state.user) return Promise.resolve(true);
  return new Promise((res) => {
    pendingResolve = res;
    render("choice");
  });
}

function close(result) {
  document.getElementById("overlay-root").innerHTML = "";
  pendingResolve?.(result);
  pendingResolve = null;
}

async function afterAuth() {
  const me = await api.get("/api/me");
  state.user = me.data.user ?? null;
  state.csrf = me.data.csrf ?? null;
  state.balance = me.data.balance_cents ?? 0;
  try { localStorage.setItem("nx_me", JSON.stringify({ user: state.user, csrf: state.csrf, balance: state.balance })); } catch {}
  document.dispatchEvent(new CustomEvent("state-changed"));
  close(true);
}

function head(title) {
  return `<div class="sh-head"><button class="sh-back" data-back>‹</button><h3>${title}</h3></div>`;
}

async function render(mode) {
  const root = document.getElementById("overlay-root");
  const googleOn = await fetch("/api/auth/google/start", { method: "GET", redirect: "manual" }).then((r) => r.status !== 404).catch(() => false);
  const sector = localStorage.getItem("nx_sector") ?? "FOUNDER";

  let html = "";
  if (mode === "choice") {
    html = `
      <div class="backdrop" id="bk"></div>
      <div class="sheet">
        <h3>${t("auth_join")}</h3>
        <p class="sub">${t("onb_lead")}</p>
        <div class="sh-tabs">
          <button class="sh-tab on" data-m="login">${t("login_title")}</button>
          <button class="sh-tab" data-m="register">${t("create_account")}</button>
        </div>
        ${googleOn ? `<button class="cta google" id="sh-google"><svg viewBox="0 0 24 24" width="17" height="17"><path fill="#4285F4" d="M23 12.2c0-.8-.1-1.6-.2-2.3H12v4.4h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.5Z"/><path fill="#34A853" d="M12 23c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A11.5 11.5 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.6 13.7a6.9 6.9 0 0 1 0-4.4v-3H1.8a11.5 11.5 0 0 0 0 10.4l3.8-3Z"/><path fill="#EA4335" d="M12 5.4c1.7 0 3.2.6 4.4 1.7L19.7 4A11.5 11.5 0 0 0 1.8 6.3l3.8 3c.9-2.7 3.4-4.7 6.4-4.7Z"/></svg>${t("google_login")}</button>` : ""}
        <div class="sh-sep">— ${t("or_email")} —</div>
        <div class="sh-form">
          <input id="l-email" type="email" placeholder="${t("auth_email")}" dir="ltr" />
          <input id="l-pass" type="password" placeholder="${t("auth_pass")}" />
          <button class="cta" id="sh-login">${t("login")}</button>
          <button class="linklike" id="sh-forgot">${t("forgot_pass")}</button>
        </div>
      </div>`;
  } else if (mode === "register") {
    html = `
      <div class="backdrop" id="bk"></div>
      <div class="sheet">
        ${head(t("create_account"))}
        <div class="sh-form">
          <input id="r-name" placeholder="${t("auth_name")}" maxlength="60" />
          <input id="r-user" placeholder="${t("auth_user")}" dir="ltr" maxlength="20" />
          <input id="r-email" type="email" placeholder="${t("auth_email")}" dir="ltr" />
          <input id="r-pass" type="password" placeholder="${t("auth_pass")}" />
          <div class="pw-meter"><i id="pw-bar"></i></div>
          <select id="r-sector">
            <option value="FOUNDER" ${sector === "FOUNDER" ? "selected" : ""}>${t("who_founder")}</option>
            <option value="MERCHANT" ${sector === "MERCHANT" ? "selected" : ""}>${t("who_merchant")}</option>
            <option value="FREELANCER" ${sector === "FREELANCER" ? "selected" : ""}>${t("who_freelancer")}</option>
            <option value="BUYER" ${sector === "BUYER" ? "selected" : ""}>${t("who_buyer")}</option>
          </select>
          <button class="cta" id="sh-register">${t("register")}</button>
          <p class="hint">${t("terms_note")} <a href="/legal.html" target="_blank" rel="noopener">${t("legal_link")}</a></p>
        </div>
      </div>`;
  } else if (mode === "forgot") {
    html = `
      <div class="backdrop" id="bk"></div>
      <div class="sheet">
        ${head(t("forgot_pass"))}
        <p class="sub">${t("forgot_note")}</p>
        <div class="sh-form">
          <input id="f-email" type="email" placeholder="${t("auth_email")}" dir="ltr" />
          <button class="cta" id="sh-fsend">${t("send_reset")}</button>
        </div>
      </div>`;
  } else if (mode === "verify_wait") {
    html = `
      <div class="backdrop" id="bk"></div>
      <div class="sheet">
        <h3>📬 ${t("verify_sent")}</h3>
        <p class="sub">${t("verify_note")}</p>
        <div style="display:flex;flex-direction:column;gap:9px">
          <button class="cta ghost" id="sh-resend">${t("resend_mail")}</button>
          <button class="cta" id="sh-continue">${t("continue")}</button>
        </div>
      </div>`;
  }
  root.innerHTML = html;

  root.querySelector("#bk")?.addEventListener("click", () => close(false));
  root.querySelectorAll("[data-back]").forEach((b) => b.addEventListener("click", () => render("choice")));
  root.querySelectorAll(".sh-tab").forEach((b) => b.addEventListener("click", () => render(b.dataset.m === "login" ? "choice" : b.dataset.m)));

  // مؤشر قوة كلمة المرور
  root.querySelector("#r-pass")?.addEventListener("input", (e) => {
    const v = e.target.value;
    let sc = 0;
    if (v.length >= 8) sc++;
    if (/\d/.test(v)) sc++;
    if (/[a-zA-Z\u0600-\u06FF]/.test(v)) sc++;
    if (v.length >= 12) sc++;
    const bar = root.querySelector("#pw-bar");
    bar.style.width = `${sc * 25}%`;
    bar.className = sc >= 3 ? "ok" : sc >= 2 ? "mid" : "weak";
  });

  root.querySelector("#sh-login")?.addEventListener("click", async () => {
    const r = await api.post("/api/auth/login", {
      email: root.querySelector("#l-email").value.trim(),
      password: root.querySelector("#l-pass").value,
    });
    if (!r.ok) {
      if (r.data.error === "verify_email") return render("verify_wait");
      return toast(t(r.data.error === "locked" ? "err_locked" : "err_invalid_credentials"));
    }
    await afterAuth();
  });
  root.querySelector("#sh-forgot")?.addEventListener("click", () => render("forgot"));
  root.querySelector("#sh-fsend")?.addEventListener("click", async () => {
    const r = await api.post("/api/auth/forgot", { email: root.querySelector("#f-email").value.trim() });
    if (r.ok) {
      toast(r.data.sent ? t("reset_sent") : t("reset_off"));
      close(false);
    }
  });
  root.querySelector("#sh-google")?.addEventListener("click", () => (location.href = "/api/auth/google/start"));
  root.querySelector("#sh-register")?.addEventListener("click", async () => {
    const r = await api.post("/api/auth/register", {
      full_name: root.querySelector("#r-name").value.trim(),
      username: root.querySelector("#r-user").value.trim(),
      email: root.querySelector("#r-email").value.trim(),
      password: root.querySelector("#r-pass").value,
      sector: root.querySelector("#r-sector").value,
    });
    if (!r.ok) {
      const map = { exists: "err_exists", weak_password: "err_weak", invalid_email: "err_invalid_credentials", invalid_username: "err_invalid_credentials", too_many: "err_locked" };
      return toast(t(map[r.data.error] ?? "err_generic"));
    }
    localStorage.setItem("nx_sector", root.querySelector("#r-sector").value);
    if (r.data.verify_sent) return render("verify_wait");
    await afterAuth();
  });
  root.querySelector("#sh-resend")?.addEventListener("click", async () => {
    const r = await api.post("/api/auth/resend");
    toast(r.ok ? t("reset_sent") : t("err_generic"));
  });
  root.querySelector("#sh-continue")?.addEventListener("click", () => afterAuth());
}
