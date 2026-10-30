// ——— الاستوديو: دردشة ببث حي + خزنة + لوحة استخدام ———
import { api, state } from "../api.js";
import { t, getLang } from "../i18n.js";
import { vaultState, encryptBlob, decryptBlob } from "../vault.js";

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const LOGO = `<svg viewBox="0 0 32 32" fill="none"><defs><linearGradient id="lg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c6cff"/><stop offset="1" stop-color="#00d4ff"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="#0a0d14" stroke="url(#lg2)" stroke-opacity=".4"/><path d="M9 22 16 9l7 13M12.2 17h7.6" stroke="url(#lg2)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const PROVIDERS = [
  { id: "instant", name: "Llama 3.1 (Instant)", sub: t("instant_sub"), color: "p-instant", free: true },
  { id: "nvidia", name: "NVIDIA NIM", sub: "DeepSeek-V4 · Nemotron · Llama 4 — free API", color: "p-nvidia", free: true },
  { id: "github-models", name: "GitHub Models", sub: "GPT-4o · Llama · Phi — free for devs", color: "p-github", free: true },
  { id: "groq", name: "Groq", sub: "Fastest inference — free tier", color: "p-groq", free: true },
  { id: "openrouter", name: "OpenRouter", sub: ":free models + everything", color: "p-openrouter", free: true },
  { id: "openai", name: "OpenAI", sub: "GPT-4o · o-series — your key", color: "p-openai", free: false },
  { id: "anthropic", name: "Anthropic", sub: "Claude 4 family — your key", color: "p-anthropic", free: false },
  { id: "gemini", name: "Google Gemini", sub: "2.5 Pro/Flash — your key (free tier)", color: "p-gemini", free: true },
];

let currentProvider = localStorage.getItem("ah_provider") || "instant";
let mode = localStorage.getItem("ah_mode") || "chat"; // دردشة | صورة (للفوري فقط)
let history = [];

export async function renderApp(root, sub) {
  if (!state.user) { location.hash = "#auth-login"; return; }
  const isUsage = sub === "usage";
  const isConn = sub === "connectors";
  root.innerHTML = `
  <div class="app-shell">
    <aside class="side" id="side">
      <a class="side-logo" href="#/">${LOGO} AIHub</a>
      <button class="side-item on" id="nav-chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M21 12a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 21l1.6-5.3A8.5 8.5 0 1 1 21 12Z"/></svg>${t("chat")}</button>
      <button class="side-item" id="nav-usage"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20V13M10 20V6.5M16 20v-9.5M21 20H3.5"/></svg>${t("usage")}</button>
      <button class="side-item" id="nav-conn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 7.5 5.5 11a3.5 3.5 0 0 0 5 5l1-1M15 16.5 18.5 13a3.5 3.5 0 0 0-5-5l-1 1"/><path d="M10.5 13.5 13.5 10.5"/></svg>${t("nav_conn")}</button>
      <div class="side-sep">${t("vault_t")}</div>
      <button class="side-item" id="nav-vault"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.8a4 4 0 1 1 8 0v2.7"/></svg>${vaultState.unlocked ? `${vaultState.keys.length} 🔑` : t("vault_unlock")}</button>
      <div class="side-foot">
        <div class="usage-pill" id="usage-pill">…</div>
        <button class="side-item" id="nav-lang">${getLang() === "ar" ? "ع" : getLang() === "fr" ? "FR" : "EN"}</button>
        <button class="side-item" id="nav-logout"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 21H5.5A1.5 1.5 0 0 1 4 19.5v-15A1.5 1.5 0 0 1 5.5 3H9M15 16l4-4-4-4M19 12H9"/></svg>${t("logout")} · ${esc(state.user.full_name.split(" ")[0])}</button>
      </div>
    </aside>
    <div class="main">
      <div class="topbar">
        <button class="btn btn-ghost btn-sm" id="burger" style="display:none">☰</button>
        <div class="model-pick" id="model-pick"></div>
        <span style="margin-inline-start:auto;font-size:12px;color:var(--faint)">${esc(state.user.email)}</span>
      </div>
      ${isUsage || isConn ? `<div class="chat-scroll" id="usage-view"></div>` : `
      <div class="chat-scroll" id="chat-scroll">
        <div class="chat-inner" id="chat-inner"></div>
      </div>
      <div class="composer"><div class="composer-in">
        <div class="mode-chips" id="mode-chips" hidden></div>
        <div class="composer-box">
          <textarea id="prompt" rows="1" placeholder="${t("placeholder")}"></textarea>
          <button class="send-btn" id="send" aria-label="${t("send")}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg></button>
        </div>
      </div></div>`}
    </div>
  </div>`;

  const burger = root.querySelector("#burger") ;
  const side = root.querySelector("#side") ;
  if (burger && side) {
    if (window.matchMedia("(max-width: 760px)").matches) burger.style.display = "inline-flex";
    burger.addEventListener("click", () => side.classList.toggle("open"));
    document.addEventListener("click", (e) => {
      if (side.classList.contains("open") && !side.contains(e.target) && e.target !== burger) side.classList.remove("open");
    }, { once: false });
  }
  root.querySelector("#nav-logout")?.addEventListener("click", async () => {
    await api.post("/api/auth/logout");
    state.user = null; state.csrf = null;
    vaultState.unlocked = false; vaultState.keys = [];
    location.hash = "#/";
  });
  root.querySelector("#nav-chat")?.addEventListener("click", () => { location.hash = "#/app"; });
  root.querySelector("#nav-usage")?.addEventListener("click", () => { location.hash = "#/app/usage"; });
  root.querySelector("#nav-conn")?.addEventListener("click", () => { location.hash = "#/app/connectors"; });
  root.querySelector("#nav-vault")?.addEventListener("click", () => openVaultSheet(root));
  root.querySelector("#nav-lang")?.addEventListener("click", async () => {
    const order = ["ar", "en", "fr"];
    const next = order[(order.indexOf(getLang()) + 1) % 3];
    localStorage.setItem("ah_lang", next); location.reload();
  });

  if (isConn) { await renderConnectors(root.querySelector("#usage-view")); return; }
  if (isUsage) { await renderUsage(root.querySelector("#usage-view") ); return; }
  renderModelPick(root);
  updateModeChips(root);
  wireChat(root);
  refreshUsagePill(root);
  welcome(root);
}

// ——— مختار النموذج ———
function renderModelPick(root) {
  const holder = root.querySelector("#model-pick") ;
  const cur = PROVIDERS.find((p) => p.id === currentProvider) || PROVIDERS[0];
  holder.innerHTML = `
    <button class="model-btn" id="mp-btn"><span class="dot ${cur.color}"></span>${cur.name} <span style="color:var(--faint)">▾</span></button>
    <div class="model-menu glass" id="mp-menu" hidden></div>`;
  const menu = holder.querySelector("#mp-menu") ;
  menu.innerHTML = PROVIDERS.map((p) => `
    <button data-p="${p.id}">
      <span class="mi-dot ${p.color}"></span>
      <span><div class="mi-name">${p.name}</div><div class="mi-sub">${p.sub}</div></span>
      ${p.id === currentProvider ? `<span class="mi-check">✓</span>` : ""}
    </button>`).join("");
  (holder.querySelector("#mp-btn") ).addEventListener("click", (e) => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
  });
  menu.querySelectorAll("button[data-p]").forEach((b) => b.addEventListener("click", () => {
    currentProvider = b.dataset.p;
    localStorage.setItem("ah_provider", currentProvider);
    if (currentProvider !== "instant") { mode = "chat"; localStorage.setItem("ah_mode", "chat"); }
    menu.hidden = true;
    renderModelPick(root);
    updateModeChips(root);
  }));
  document.addEventListener("click", () => { menu.hidden = true; }, { once: true });
}

function updateModeChips(root) {
  const holder = root.querySelector("#mode-chips");
  if (!holder) return;
  if (currentProvider !== "instant") { holder.hidden = true; return; }
  holder.hidden = false;
  holder.innerHTML = `
    <button class="chip ${mode === "chat" ? "on" : ""}" data-m="chat">${t("mode_chat")}</button>
    <button class="chip ${mode === "image" ? "on" : ""}" data-m="image">${t("mode_image")}</button>`;
  holder.querySelectorAll("button[data-m]").forEach((b) => b.addEventListener("click", () => {
    mode = b.dataset.m;
    localStorage.setItem("ah_mode", mode);
    updateModeChips(root);
  }));
  const ta = root.querySelector("#prompt");
  if (ta) ta.placeholder = mode === "image" ? t("img_placeholder") : t("placeholder");
}

// ——— الدردشة ———
function welcome(root) {
  if (history.length) { redraw(root); return; }
  const inner = root.querySelector("#chat-inner") ;
  inner.innerHTML = `
    <div class="msg msg-ai"><div class="msg-ava">AI</div><div class="msg-body">
      <div class="who">AIHub · ${t("tagline")}</div>
      <div class="txt">${t("hero_p")}</div>
    </div></div>`;
}

function addMsgEl(root, who) {
  const inner = root.querySelector("#chat-inner") ;
  const el = document.createElement("div");
  el.className = `msg msg-${who}`;
  el.innerHTML = `<div class="msg-ava">${who === "user" ? esc((state.user?.full_name?.[0] ?? "U")) : "AI"}</div><div class="msg-body"><div class="who">${who === "user" ? esc((state.user?.full_name ?? "You").split(" ")[0]) : "AIHub"}</div><div class="txt"></div></div>`;
  inner.appendChild(el);
  (root.querySelector("#chat-scroll") ).scrollTop = 1e9;
  return { el, txt: el.querySelector(".txt") };
}

function redraw(root) {
  const inner = root.querySelector("#chat-inner") ;
  inner.innerHTML = "";
  for (const m of history) {
    const { txt } = addMsgEl(root, m.role === "user" ? "user" : "ai");
    txt.textContent = m.content;
  }
}

function wireChat(root) {
  const ta = root.querySelector("#prompt") ;
  const send = root.querySelector("#send") ;
  ta?.addEventListener("input", () => { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 190) + "px"; });
  ta?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send.click(); }
  });
  send?.addEventListener("click", async () => {
    const q = ta.value.trim();
    if (!q) return;
    ta.value = ""; ta.style.height = "auto";
    history.push({ role: "user", content: q });
    const u = addMsgEl(root, "user"); u.txt.textContent = q;

    // فقاعة الرد + النقاط
    const a = addMsgEl(root, "ai");
    a.txt.innerHTML = `<span class="typing"><i></i><i></i><i></i></span>`;
    send.disabled = true;

    const finish = () => { send.disabled = false; (root.querySelector("#chat-scroll") ).scrollTop = 1e9; };

    // تجربة الصور الفورية — من حصتنا، بسقف عدل معلن
    if (currentProvider === "instant" && mode === "image") {
      a.txt.textContent = t("img_gen");
      const pr = await api.post("/api/infer/instant-image", { prompt: q });
      if (pr.ok && pr.data.image) {
        a.txt.textContent = "";
        const holder = document.createElement("div");
        holder.className = "img-holder";
        const img = document.createElement("img");
        img.alt = q;
        img.src = `data:${pr.data.mime || "image/jpeg"};base64,${pr.data.image}`;
        img.addEventListener("load", () => finish());
        holder.appendChild(img);
        const cap = document.createElement("div");
        cap.className = "img-cap";
        cap.textContent = `${t("img_note")} · ${pr.data.used}/${pr.data.cap}`;
        holder.appendChild(cap);
        a.txt.appendChild(holder);
        history.push({ role: "assistant", content: `[${t("img_note")}]` });
      } else {
        a.txt.textContent = errMsg(pr.data?.error);
        finish();
      }
      return;
    }

    if (currentProvider === "instant") {
      const r = await api.post("/api/infer/instant", { messages: history.slice(-12) });
      if (r.ok) { history.push({ role: "assistant", content: r.data.content }); a.txt.textContent = r.data.content; }
      else { a.txt.textContent = errMsg(r.data?.error); if (r.status === 401 && r.data?.error === "auth_required") location.hash = "#auth-login"; }
      finish(); return;
    }

    // BYOK: نحتاج المفتاح من الخزنة المفتوحة في الذاكرة
    const kd = vaultState.keys.find((k) => k.provider === currentProvider);
    if (!kd || !vaultState.unlocked) { a.txt.textContent = t("key_required"); openVaultSheet(root); finish(); return; }

    let acc = "";
    let first = true;
    await api.stream(currentProvider, kd.key, { model: defaultModel(currentProvider), messages: history.slice(-12), stream: true },
      (chunk) => {
        if (first) { a.txt.textContent = ""; first = false; }
        acc += chunk;
        a.txt.textContent = acc + "▍";
        (root.querySelector("#chat-scroll") ).scrollTop = 1e9;
      },
      () => {
        if (!acc && first) { a.txt.textContent = t("provider_unreachable"); finish(); return; }
        history.push({ role: "assistant", content: acc });
        a.txt.textContent = acc;
        finish();
      },
      (err) => { a.txt.textContent = errMsg(err); finish(); }
    );
  });
}

function defaultModel(p) {
  switch (p) {
    case "nvidia": return "deepseek-ai/deepseek-v4-flash";
    case "github-models": return "gpt-4o";
    case "groq": return "llama-3.3-70b-versatile";
    case "openrouter": return "meta-llama/llama-3.3-70b-instruct:free";
    case "openai": return "gpt-4o-mini";
    case "gemini": return "gemini-2.5-flash";
    default: return "";
  }
}

function errMsg(code) {
  switch (code) {
    case "daily_cap": return "⏳ " + t("daily_cap");
    case "provider_unreachable": return "⚠ " + t("provider_unreachable");
    case "ai_unavailable": return "✦ " + t("instant_down");
    case "key_required": return "🔑 " + t("key_required");
    case "auth_required": return "🔒 " + t("auth_required");
    default: return "⚠ " + t("err_generic");
  }
}

// ——— الخزنة (ورقة) ———
function openVaultSheet(root) {
  const overlay = document.getElementById("overlay-root");
  overlay.innerHTML = `<div class="backdrop"></div><div class="sheet">
    <div class="sh-head"><h3>${t("vault_t")}</h3><button class="sh-x" id="sh-close">✕</button></div>
    <div class="lock-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.8a4 4 0 1 1 8 0v2.7"/></svg>
      <span>${t("vault_hint")}</span></div>
    <div id="vault-body"></div>
  </div>`;
  const close = () => { overlay.innerHTML = ""; };
  overlay.querySelector(".backdrop")?.addEventListener("click", close);
  overlay.querySelector("#sh-close")?.addEventListener("click", close);

  const body = overlay.querySelector("#vault-body");
  if (!vaultState.unlocked) {
    body.innerHTML = `
      <div class="field"><label>${t("vault_pass")}</label><input id="vp" type="password" autocomplete="off" /></div>
      <div class="hint" style="margin:-6px 0 14px">${t("vault_hint")}</div>
      <button class="btn btn-grad" style="width:100%" id="vp-go">${t("vault_unlock")}</button>`;
    body.querySelector("#vp-go")?.addEventListener("click", async () => {
      const pass = (body.querySelector("#vp") ).value;
      if (!pass) return;
      const r = await api.get("/api/vault");
      if (!r.ok) { location.hash = "#auth-login"; return; }
      if (r.data.blob) {
        try {
          const data = await decryptBlob(pass, r.data.blob);
          vaultState.keys = data.keys ?? [];
        } catch {
          (body.querySelector("#vp") ).value = "";
          (body.querySelector("#vp") ).placeholder = t("wrong_pass");
          return;
        }
      }
      // كلمة السر في الذاكرة فقط لهذه الجلسة — لا localStorage إطلاقاً
      vaultState._pass = pass;
      vaultState.unlocked = true;
      close();
      renderApp(root, location.hash.startsWith("#/app/") ? location.hash.split("/")[2] : "");
    });
  } else {
    body.innerHTML = `
      ${vaultState.keys.length === 0 ? `<div class="hint" style="margin-bottom:12px">${t("vault_empty")}</div>` : `
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px" id="key-list">
        ${vaultState.keys.map((k, i) => `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:12px">
          <span class="mi-dot ${PROVIDERS.find((p) => p.id === k.provider)?.color ?? "p-openai"}" style="width:8px;height:8px;border-radius:50%"></span>
          <span style="font-size:13px;font-weight:600">${esc(k.label || k.provider)}</span>
          <span style="font-size:11px;color:var(--faint);margin-inline-start:auto">${k.provider}</span>
          <button data-del="${i}" style="color:var(--err);font-size:13px;padding:4px 8px">✕</button>
        </div>`).join("")}
      </div>`}
      <div class="field"><label>${t("provider")}</label><select id="nk-prov">
        ${PROVIDERS.filter((p) => p.id !== "instant").map((p) => `<option value="${p.id}">${p.name}</option>`).join("")}
      </select></div>
      <div class="field"><label>${t("label")}</label><input id="nk-label" type="text" placeholder="Pro · work" /></div>
      <div class="field"><label>${t("api_key")}</label><input id="nk-key" type="password" autocomplete="off" placeholder="sk-…" /></div>
      <button class="btn btn-grad" style="width:100%" id="nk-go">${t("add_key")}</button>`;
    body.querySelectorAll("button[data-del]").forEach((b) => b.addEventListener("click", async () => {
      vaultState.keys.splice(parseInt((b ).dataset.del, 10), 1);
      await persist(root);
      close(); openVaultSheet(root);
    }));
    body.querySelector("#nk-go")?.addEventListener("click", async () => {
      const provider = (body.querySelector("#nk-prov") ).value;
      const key = (body.querySelector("#nk-key") ).value.trim();
      const label = (body.querySelector("#nk-label") ).value.trim();
      if (!key) return;
      vaultState.keys.push({ id: `k-${Date.now().toString(36)}`, provider, label, key });
      const ok = await persist(root);
      if (ok) { close(); openVaultSheet(root); }
    });
  }

  async function persist(rootEl) {
    return persistVault();
  }
}

// ——— حفظ الخزنة المشترك: تشفير بالمتصفح ثم رفع الـblob ———
async function persistVault() {
  const pass = vaultState._pass;
  if (!pass) return false;
  const blob = await encryptBlob(pass, { keys: vaultState.keys });
  const r = await api.put("/api/vault", { blob });
  if (!r.ok) { alert(r.data?.error === "vault_full" ? "Vault full — upgrade" : t("err_generic")); return false; }
  return true;
}

// ——— الموصلات: كل نموذج بنقرة — حصتنا أولاً، ثم المفاتيح الرسمية المجانية، ثم المدفوعة ———
const CONN_META = [
  { sec: "keyless", id: "instant", nameKey: "instant_card", subKey: "instant_card_sub", color: "p-instant", url: "", prefix: null },
  { sec: "free", id: "nvidia", name: "NVIDIA NIM", subKey: "nvidia_sub2", color: "p-nvidia", url: "https://build.nvidia.com", prefix: "nvapi-" },
  { sec: "free", id: "github-models", name: "GitHub Models", subKey: "gh_sub2", color: "p-github", url: "https://github.com/settings/personal-access-tokens/new", prefix: ["ghp_", "github_pat_", "gho_"] },
  { sec: "free", id: "gemini", name: "Google AI Studio", subKey: "google_sub2", color: "p-gemini", url: "https://aistudio.google.com/apikey", prefix: "AIza" },
  { sec: "free", id: "groq", name: "Groq", subKey: "groq_sub2", color: "p-groq", url: "https://console.groq.com/keys", prefix: "gsk_" },
  { sec: "free", id: "openrouter", name: "OpenRouter", subKey: "or_sub2", color: "p-openrouter", url: "https://openrouter.ai/settings/keys", prefix: "sk-or-" },
  { sec: "paid", id: "openai", name: "OpenAI", sub: "GPT-4o · o-series", color: "p-openai", url: "https://platform.openai.com/api-keys", prefix: "sk-" },
  { sec: "paid", id: "anthropic", name: "Anthropic", sub: "Claude 4 family", color: "p-anthropic", url: "https://console.anthropic.com/settings/keys", prefix: "sk-ant-" },
];
const SECTIONS = [["keyless", "conn_keyless"], ["free", "conn_official_free"], ["paid", "conn_paid"]];

async function renderConnectors(view) {
  view.innerHTML = `<div class="conn-wrap">
    <h2 style="font-size:20px;font-weight:800;letter-spacing:-.3px">${t("conn_title")}</h2>
    <p style="color:var(--dim);font-size:13.5px;margin:8px 0 22px;max-width:640px;line-height:1.8">${t("conn_sub")}</p>
    <div id="conn-list"></div>
  </div>`;
  const list = view.querySelector("#conn-list");
  for (const [sec, secKey] of SECTIONS) {
    const head = document.createElement("div");
    head.className = "side-sep";
    head.style.margin = "18px 2px 10px";
    head.textContent = t(secKey);
    list.appendChild(head);
    for (const c of CONN_META.filter((x) => x.sec === sec)) {
      const connected = sec === "keyless" || (vaultState.unlocked && vaultState.keys.some((k) => k.provider === c.id));
      const card = document.createElement("div");
      card.className = "conn-card fade-up";
      card.innerHTML = `
        <div class="conn-head">
          <span class="mi-dot ${c.color}"></span>
          <div style="flex:1">
            <div style="font-weight:700;font-size:14px">${c.name ?? t(c.nameKey)}</div>
            <div style="font-size:12px;color:var(--dim);line-height:1.7;margin-top:2px">${c.subKey ? t(c.subKey) : c.sub}</div>
          </div>
          <span class="conn-status ${connected ? "ok" : ""}">${connected ? t("conn_connected") : t("conn_not")}</span>
        </div>
        <div class="conn-actions">
          ${sec !== "keyless" ? `<a class="btn btn-ghost btn-sm" href="${c.url}" target="_blank" rel="noopener noreferrer">${t("conn_get")} ↗</a>` : `<span class="conn-tag">${t("free_forever")}</span>`}
          ${sec !== "keyless" && !connected ? `<button class="btn btn-grad btn-sm" data-connect="${c.id}">${t("conn_connect")}</button>` : ""}
          ${sec !== "keyless" && connected ? `<button class="btn btn-ghost btn-sm" data-test="${c.id}">${t("conn_test")}</button>` : ""}
        </div>
        <div class="conn-form" id="cf-${c.id}" hidden></div>
        <div class="conn-msg" id="cm-${c.id}"></div>`;
      list.appendChild(card);
    }
  }

  // وصّل: نموذج لصق داخل البطاقة
  list.querySelectorAll("button[data-connect]").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.connect;
    const form = list.querySelector(`#cf-${CSS.escape(id)}`);
    if (!form.hidden) { form.hidden = true; return; }
    form.hidden = false;
    form.innerHTML = `
      <div class="conn-form-in">
        <input type="password" autocomplete="off" placeholder="${t("conn_paste")}" dir="ltr" data-keyinput />
        <button class="btn btn-grad btn-sm" data-save="${id}">${t("conn_save")}</button>
      </div>`;
    form.querySelector("[data-keyinput]").focus();
    form.querySelector(`button[data-save]`).addEventListener("click", async () => {
      const inp = form.querySelector("[data-keyinput]");
      const key = inp.value.trim();
      const msg = list.querySelector(`#cm-${CSS.escape(id)}`);
      if (!key) return;
      const meta = CONN_META.find((x) => x.id === id);
      const prefixes = Array.isArray(meta.prefix) ? meta.prefix : meta.prefix ? [meta.prefix] : [];
      if (prefixes.length && !prefixes.some((pf) => key.startsWith(pf)))
        msg.textContent = t("conn_format_warn");
      if (!vaultState.unlocked) {
        // اطلب فتح الخزنة أولاً ثم عد للموصلات
        openVaultSheet(document.getElementById("app"));
        return;
      }
      vaultState.keys.push({ id: `k-${Date.now().toString(36)}`, provider: id, label: CONN_META.find((x) => x.id === id).name, key });
      const okSave = await persistVault();
      if (okSave) { await renderConnectors(view); }
    });
  }));

  // اختبر: نداء حقيقي صغير عبر الوكيل الشفاف
  list.querySelectorAll("button[data-test]").forEach((b) => b.addEventListener("click", async () => {
    const id = b.dataset.test;
    const msg = list.querySelector(`#cm-${CSS.escape(id)}`);
    const kd = vaultState.keys.find((k) => k.provider === id);
    if (!kd) return;
    b.textContent = t("conn_testing"); b.disabled = true;
    const r = await api.post(`/api/infer/${id}`, { model: defaultModel(id), messages: [{ role: "user", content: "ping" }], max_tokens: 4, stream: false }, { "x-upstream-key": kd.key });
    b.textContent = t("conn_test"); b.disabled = false;
    msg.textContent = r.ok ? t("conn_test_ok") : t("conn_test_fail");
    msg.className = `conn-msg ${r.ok ? "ok" : "bad"}`;
  }));
}

// ——— لوحة الاستخدام ———
async function renderUsage(view) {
  view.innerHTML = `<div class="chat-inner"><div class="msg msg-ai"><div class="msg-ava">AI</div><div class="msg-body"><div class="who">${t("usage")}</div><div class="txt" id="u-body">…</div></div></div></div>`;
  const r = await api.get("/api/usage");
  const body = view.querySelector("#u-body");
  if (!r.ok) { body.textContent = t("err_generic"); return; }
  const { plan, limits, usage } = r.data;
  const pct = Math.min(100, Math.round((usage.instant / limits.instant_daily) * 100));
  const pctImg = Math.min(100, Math.round((usage.instant_img / limits.instant_img_daily) * 100));
  body.innerHTML = `
    <b>Plan: ${plan}</b>
    <div style="margin:10px 0 4px">${t("mode_chat")}: <b>${usage.instant}</b> / ${limits.instant_daily} (${pct}%)</div>
    <div class="usage-bar"><i style="width:${pct}%"></i></div>
    <div style="margin:12px 0 4px">${t("mode_image")} (${t("img_note")}): <b>${usage.instant_img}</b> / ${limits.instant_img_daily} (${pctImg}%)</div>
    <div class="usage-bar"><i style="width:${pctImg}%"></i></div>
    <div style="margin-top:12px">proxy: <b>${usage.proxy}</b> / ${limits.proxy_rpm} rpm</div>
    <div style="margin-top:10px;color:var(--faint);font-size:12.5px">${usage.day} · UTC reset 00:00</div>`;
}

async function refreshUsagePill(root) {
  const pill = root.querySelector("#usage-pill") ;
  if (!pill) return;
  const r = await api.get("/api/usage");
  if (!r.ok) { pill.textContent = "—"; return; }
  const { usage, limits } = r.data;
  const pct = Math.min(100, Math.round((usage.instant / limits.instant_daily) * 100));
  const pctImg = Math.min(100, Math.round((usage.instant_img / limits.instant_img_daily) * 100));
  pill.innerHTML = `<div><b>${usage.instant}/${limits.instant_daily}</b> ${t("mode_chat")} · <b>${usage.instant_img}/${limits.instant_img_daily}</b> ${t("mode_image")}</div><div class="usage-bar"><i style="width:${Math.max(pct, pctImg)}%"></i></div>`;
}
