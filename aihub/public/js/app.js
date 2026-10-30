// ——— AIHub — نقطة انطلاق الواجهة — توجيه بسيط وأنيق ———
import { state, api } from "./api.js";
import { onLang, getLang } from "./i18n.js";
import { renderLanding } from "./views/landing.js";
import { renderAuth } from "./views/auth.js";
import { renderApp } from "./views/app.js";

const root = document.getElementById("app");

function applyDir() {
  document.documentElement.lang = getLang();
  document.documentElement.dir = getLang() === "ar" ? "rtl" : "ltr";
}

async function route() {
  const h = location.hash || "#/";
  applyDir();
  if (h === "#/" || h === "") { document.title = "AIHub — " + (getLang() === "ar" ? "كل نماذج الذكاء الاصطناعي في منصة واحدة" : getLang() === "fr" ? "Tous les modèles d'IA en une plateforme" : "Every AI model, one platform"); renderLanding(root); return; }
  if (h === "#auth-login") { renderAuth(root, "login"); return; }
  if (h === "#auth-register") { renderAuth(root, "register"); return; }
  if (h.startsWith("#/app")) {
    const sub = h.split("/")[2] ?? "";
    await renderApp(root, sub);
    return;
  }
  renderLanding(root);
}

// استرجاع الجلسة إن وُجدت ثم أول مسار
(async () => {
  const me = await api.get("/api/me");
  if (me.ok && me.data.user) { state.user = me.data.user; state.csrf = me.data.csrf; }
  window.addEventListener("hashchange", route);
  onLang(() => route());
  await route();
})();
