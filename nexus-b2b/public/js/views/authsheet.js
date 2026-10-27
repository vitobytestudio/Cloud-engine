// ——— ورقة المصادقة: تظهر عند أول تفاعل للحساب الضيف ———
import { api, state } from "../api.js";
import { t, toast } from "../i18n-bridge.js";

let pendingResolve = null;

export function requireAuth() {
  if (state.user) return Promise.resolve(true);
  return new Promise((res) => {
    pendingResolve = res;
    render();
  });
}

function close(result) {
  document.getElementById("overlay-root").innerHTML = "";
  pendingResolve?.(result);
  pendingResolve = null;
}

function render() {
  const root = document.getElementById("overlay-root");
  root.innerHTML = `
    <div class="backdrop" id="bk"></div>
    <div class="sheet">
      <h3>${t("need_auth")}</h3>
      <p class="sub">${t("onb_lead")}</p>
      <div style="display:flex;flex-direction:column;gap:10px">
        <button class="cta" id="sh-demo">${t("try_demo")}</button>
        <button class="cta ghost" id="sh-close">${t("enter_guest")}</button>
      </div>
    </div>`;
  root.querySelector("#bk").addEventListener("click", () => close(false));
  root.querySelector("#sh-close").addEventListener("click", () => close(false));
  root.querySelector("#sh-demo").addEventListener("click", async () => {
    const r = await api.post("/api/auth/demo-login");
    if (!r.ok) return toast(t("err_generic"));
    const me = await api.get("/api/me");
    state.user = me.data.user ?? null;
    state.csrf = me.data.csrf ?? null;
    state.balance = me.data.balance_cents ?? 0;
    document.dispatchEvent(new CustomEvent("state-changed"));
    close(true);
  });
}
