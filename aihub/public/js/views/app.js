// ——— الاستوديو: دردشة ببث حي + خزنة + لوحة استخدام ———
import { api, state } from "../api.js";
import { t, getLang } from "../i18n.js";
import { vaultState, encryptBlob, decryptBlob } from "../vault.js";

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const LOGO = `<svg viewBox="0 0 32 32" fill="none"><defs><linearGradient id="lg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c6cff"/><stop offset="1" stop-color="#00d4ff"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="#0a0d14" stroke="url(#lg2)" stroke-opacity=".4"/><path d="M9.5 22.5v-13l13 13v-13" stroke="url(#lg2)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const PROVIDERS = [
  { id: "auto", name: "Nexus Open", sub: t("auto_sub"), color: "p-nexus", free: true },
  { id: "instant", name: "Llama 3.1 (Instant)", sub: t("instant_sub"), color: "p-instant", free: true },
  { id: "nvidia", name: "NVIDIA NIM", sub: "DeepSeek-V4 · Nemotron · Llama 4 — free API", color: "p-nvidia", free: true },
  { id: "github-models", name: "GitHub Models", sub: "GPT-4o · Llama · Phi — free for devs", color: "p-github", free: true },
  { id: "groq", name: "Groq", sub: "Fastest inference — free tier", color: "p-groq", free: true },
  { id: "openrouter", name: "OpenRouter", sub: ":free models + everything", color: "p-openrouter", free: true },
  { id: "hf", name: "Hugging Face", sub: "Llama · Qwen · hundreds — free official key", color: "p-hf", free: true },
  { id: "cerebras", name: "Cerebras", sub: "Fastest open-model inference — free key", color: "p-cerebras", free: true },
  { id: "mistral", name: "Mistral", sub: "La Plateforme free tier", color: "p-mistral", free: true },
  { id: "sambanova", name: "SambaNova", sub: "Fast open-model cloud — free key", color: "p-sambanova", free: true },
  { id: "cohere", name: "Cohere", sub: "Command family — trial key", color: "p-cohere", free: true },
  { id: "openai", name: "OpenAI", sub: "GPT-4o · o-series — your key", color: "p-openai", free: false },
  { id: "anthropic", name: "Anthropic", sub: "Claude 4 family — your key", color: "p-anthropic", free: false },
  { id: "gemini", name: "Google Gemini", sub: "2.5 Pro/Flash — your key (free tier)", color: "p-gemini", free: true },
  { id: "luma", name: "Luma Ray-2", sub: "Dream Machine video — your key", color: "p-luma", free: false, hidden: true },
];

let currentProvider = localStorage.getItem("ah_provider") || "instant";
let modelSel = {}; // { provider: modelId } — اختيار المستخدم لكل مزود
function keyFor(provider, model) {
  const ks = vaultState.keys.filter((k) => k.provider === provider);
  return ks.find((k) => k.model && k.model === model) || ks.find((k) => !k.model) || ks[0];
}
try { modelSel = JSON.parse(localStorage.getItem("ah_models") || "{}"); } catch { modelSel = {}; }
const MODEL_CATALOG = {
  "instant": [],
  "openai": [
    ["GPT-6 Astra", "gpt-6-astra", 1], ["GPT-5.6 Sol", "gpt-5.6-sol"],
    ["GPT-5.6 Terra", "gpt-5.6-terra"], ["GPT-5.6 Luna — الأسرع", "gpt-5.6-luna"],
    ["GPT-5", "gpt-5"], ["GPT-5 mini", "gpt-5-mini"], ["GPT-5 nano", "gpt-5-nano"],
    ["GPT-4.1", "gpt-4.1"], ["GPT-4.1 mini", "gpt-4.1-mini"], ["GPT-4o", "gpt-4o"], ["GPT-4o mini", "gpt-4o-mini"],
    ["o3 — استدلال", "o3"], ["o4-mini — استدلال", "o4-mini"],
  ],
  "anthropic": [
    ["Claude Fable 5.1", "claude-fable-5-1", 1], ["Claude Fable 5", "claude-fable-5"],
    ["Claude Opus 5.5", "claude-opus-5-5"], ["Claude Opus 4.8", "claude-opus-4-8"],
    ["Claude Sonnet 5", "claude-sonnet-5"], ["Claude Sonnet 4.5", "claude-sonnet-4-5"], ["Claude Haiku 4.5", "claude-haiku-4-5"],
  ],
  "gemini": [
    ["Gemini 4 Argon", "gemini-4-argon", 1], ["Gemini 3.8 Flash", "gemini-3.8-flash"],
    ["Gemini 3.5 Flash-Lite", "gemini-3.5-flash-lite"], ["Gemini 3 Flash (معاينة)", "gemini-3-flash-preview"],
    ["Gemini 2.5 Pro", "gemini-2.5-pro"],
    ["Gemini 2.5 Flash", "gemini-2.5-flash"], ["Gemini 2.5 Flash-Lite", "gemini-2.5-flash-lite"], ["Gemini 2.0 Flash", "gemini-2.0-flash"],
  ],
  "nvidia": [
    ["DeepSeek-V4 Pro · 1M ctx", "deepseek-ai/deepseek-v4-pro", 1], ["DeepSeek-V4 Flash · 1M ctx", "deepseek-ai/deepseek-v4-flash"],
    ["DeepSeek-R1", "deepseek-ai/deepseek-r1"], ["Llama 4 Maverick", "meta/llama-4-maverick-17b-128e-instruct"],
    ["Llama 4 Scout", "meta/llama-4-scout-17b-16e-instruct"], ["Qwen3 Coder 480B", "qwen/qwen3-coder-480b-a35b-instruct"],
    ["Kimi K2 Instruct", "moonshotai/kimi-k2-instruct"],
  ],
  "github-models": [
    ["GPT-4o", "gpt-4o"], ["GPT-4.1", "gpt-4.1"], ["DeepSeek-R1", "DeepSeek-R1"],
    ["Grok 3", "xai/grok-3"], ["Llama 3.3 70B", "Meta-Llama-3.3-70B-Instruct"], ["Phi-4", "Phi-4"],
  ],
  "groq": [
    ["Llama 3.3 70B", "llama-3.3-70b-versatile"], ["GPT-OSS 120B", "openai/gpt-oss-120b"],
    ["GPT-OSS 20B", "openai/gpt-oss-20b"], ["Kimi K2", "moonshotai/kimi-k2-instruct"],
    ["Qwen3 32B", "qwen/qwen3-32b"], ["DeepSeek-R1 Distill 70B", "deepseek-r1-distill-llama-70b"], ["Llama 3.1 8B Instant", "llama-3.1-8b-instant"],
  ],
  "openrouter": [
    ["Grok 4", "x-ai/grok-4", 1], ["DeepSeek V3 :free", "deepseek/deepseek-chat:free"],
    ["DeepSeek R1 :free", "deepseek/deepseek-r1:free"], ["Llama 3.3 70B :free", "meta-llama/llama-3.3-70b-instruct:free"],
    ["Kimi K2 :free", "moonshotai/kimi-k2:free"], ["Qwen3 Coder :free", "qwen/qwen3-coder:free"],
    ["Gemini 2.0 Flash :free", "google/gemini-2.0-flash-exp:free"], ["GPT-OSS 20B :free", "openai/gpt-oss-20b:free"],
    ["Mistral Small 3.2 :free", "mistralai/mistral-small-3.2-24b-instruct:free"],
  ],
  "hf": [
    ["Llama 3.3 70B", "meta-llama/Llama-3.3-70B-Instruct"], ["Qwen3 235B", "Qwen/Qwen3-235B-A22B"],
    ["DeepSeek-R1", "deepseek-ai/DeepSeek-R1"], ["Kimi K2", "moonshotai/Kimi-K2-Instruct"],
    ["Gemma 3 27B", "google/gemma-3-27b-it"], ["Mistral Small 3.2", "mistralai/Mistral-Small-3.2-24B-Instruct"],
    ["Phi-4", "microsoft/phi-4"], ["Qwen 2.5 72B", "Qwen/Qwen2.5-72B-Instruct"],
  ],
  "cerebras": [
    ["Llama 3.3 70B", "llama-3.3-70b"], ["GPT-OSS 120B", "gpt-oss-120b"],
    ["Qwen3 235B", "qwen-3-235b-a22b-instruct-2507"], ["DeepSeek-R1 Distill 70B", "deepseek-r1-distill-llama-70b"],
  ],
  "mistral": [
    ["Mistral Large", "mistral-large-latest", 1], ["Magistral — استدلال", "magistral-medium-latest"],
    ["Mistral Medium", "mistral-medium-latest"], ["Mistral Small", "mistral-small-latest"],
    ["Codestral — كود", "codestral-latest"], ["Pixtral — رؤية", "pixtral-large-latest"],
  ],
  "sambanova": [
    ["Llama 4 Maverick", "Llama-4-Maverick-17B-128E-Instruct"], ["Llama 4 Scout", "Llama-4-Scout-17B-16E-Instruct"],
    ["DeepSeek-R1", "DeepSeek-R1"], ["DeepSeek-R1 Distill 70B", "DeepSeek-R1-Distill-Llama-70B"],
    ["Llama 3.3 70B", "Meta-Llama-3.3-70B-Instruct"], ["Qwen3 235B", "Qwen3-235B-A22B"],
  ],
  "cohere": [
    ["Command A", "command-a-03-2025", 1], ["Command R+", "command-r-plus-08-2024"],
    ["Command R7B", "command-r7b-12-2024"], ["Aya Expanse 32B — عالمي", "aya-expanse-32b"],
  ],
};
// رابط الصفحة الرسمية لكل نموذج — منقوش على بوابات المزودين
const MODEL_LINKS = {
  "openai": (id) => `https://platform.openai.com/docs/models/${id}`,
  "anthropic": () => "https://docs.claude.com/en/docs/about-claude/models/overview",
  "gemini": () => "https://ai.google.dev/gemini-api/docs/models",
  "nvidia": (id) => `https://build.nvidia.com/${id}`,
  "github-models": () => "https://github.com/marketplace/models",
  "groq": () => "https://console.groq.com/docs/models",
  "openrouter": (id) => `https://openrouter.ai/${id.replace(/:free$/, "")}`,
  "hf": (id) => `https://huggingface.co/${id}`,
  "cerebras": () => "https://inference-docs.cerebras.ai/models/overview",
  "mistral": () => "https://docs.mistral.ai/getting-started/models",
  "sambanova": () => "https://docs.sambanova.ai/cloud/docs/get-started/models",
  "cohere": () => "https://docs.cohere.com/docs/models",
};
function modelLink(provider, id) {
  const f = MODEL_LINKS[provider];
  return f ? f(id) : "";
}
function currentModel() {
  return modelSel[currentProvider] || defaultModel(currentProvider);
}
let mode = localStorage.getItem("ah_mode") || "chat"; // دردشة | صورة (للفوري فقط)
let duelOn = localStorage.getItem("ah_duel") === "1";
const duelA = { provider: localStorage.getItem("ah_duel_pa") || "groq", model: "" };
const duelB = { provider: localStorage.getItem("ah_duel_pb") || "openai", model: "" };

// ——— لوحة الحقيقة: أسعار رسمية موثقة فقط ($ لكل مليون توكن: [دخل، خرج]) ———
const PRICES = {
  "gpt-6-astra": [10, 50], "gpt-5.6-sol": [5, 30],
  "claude-fable-5-1": [10, 50], "claude-fable-5": [10, 50],
  "gemini-4-argon": [4, 20], "gemini-2.5-pro": [1.25, 10],
  "gemini-2.5-flash": [0.30, 2.50], "gpt-4o": [2.50, 10], "gpt-4o-mini": [0.15, 0.60],
  "claude-sonnet-4-5": [3, 15], "claude-haiku-4-5": [1, 5], "o3": [2, 8],
};
const tokEst = (chars) => Math.max(1, Math.round(chars / 4));
function costChip(modelId, charsIn, charsOut) {
  const pr = PRICES[modelId];
  const tk = `~${tokEst(charsIn) + tokEst(charsOut)} ${t("cost_tokens")}`;
  if (!pr) return `<span class="cost-chip">${tk}</span>`;
  const usd = (tokEst(charsIn) / 1e6) * pr[0] + (tokEst(charsOut) / 1e6) * pr[1];
  return `<span class="cost-chip">${tk} · ${t("cost_est")}: $${usd < 0.01 ? usd.toFixed(5) : usd.toFixed(4)}</span>`;
}
let history = [];

export async function renderApp(root, sub) {
  if (!state.user) { location.hash = "#auth-login"; return; }
  const isUsage = sub === "usage";
  const isConn = sub === "connectors";
  root.innerHTML = `
  <div class="app-shell">
    <aside class="side" id="side">
      <a class="side-logo" href="#/">${LOGO} Nexus</a>
      <button class="side-item on" id="nav-chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M21 12a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 21l1.6-5.3A8.5 8.5 0 1 1 21 12Z"/></svg>${t("chat")}</button>
      <button class="side-item" id="nav-agents"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="11" rx="3"/><circle cx="9" cy="13" r="1.4"/><circle cx="15" cy="13" r="1.4"/><path d="M12 8V4.5M8.5 4.5h7"/></svg>${t("nav_agents")}</button>
      <button class="side-item" id="nav-lab"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6.5L4.8 18a2.2 2.2 0 0 0 2 3h10.4a2.2 2.2 0 0 0 2-3L14 9.5V3"/></svg>${t("nav_lab")}</button>
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
        <button class="icon-btn" id="export-chat" title="${t("export")}">⤓</button>
      </div>
      ${isUsage || isConn || sub === "agents" || sub === "lab" ? `<div class="chat-scroll" id="usage-view"></div>` : `
      <div class="chat-scroll" id="chat-scroll">
        <div class="chat-inner" id="chat-inner"></div>
      </div>
      <div class="composer"><div class="composer-in">
        <div class="mode-chips" id="mode-chips" hidden></div>
        <div class="duel-bar" id="duel-bar" hidden>
          ${["A", "B"].map((side) => `
          <div class="duel-side">
            <span class="duel-tag">${side === "A" ? t("duel_a") : t("duel_b")}</span>
            <select id="duel-p${side}" dir="ltr"></select>
            <select id="duel-m${side}" dir="ltr"></select>
          </div>`).join("")}
        </div>
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
  root.querySelector("#export-chat")?.addEventListener("click", () => {
    if (!history.length) return;
    const md = [`# Nexus — ${t("export")}`, `_${new Date().toISOString().slice(0, 16).replace("T", " ")}_`, ""]
      .concat(history.map((m) => `**${m.role === "user" ? (state.user?.full_name ?? "You") : "Nexus"}:**\n${m.content}\n`)).join("\n");
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const aEl = document.createElement("a");
    aEl.href = URL.createObjectURL(blob);
    aEl.download = `nexus-chat-${new Date().toISOString().slice(0, 10)}.md`;
    aEl.click();
    setTimeout(() => URL.revokeObjectURL(aEl.href), 4000);
  });
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
  root.querySelector("#nav-agents")?.addEventListener("click", () => { location.hash = "#/app/agents"; });
  root.querySelector("#nav-lab")?.addEventListener("click", () => { location.hash = "#/app/lab"; });
  root.querySelector("#nav-lang")?.addEventListener("click", async () => {
    const order = ["ar", "en", "fr"];
    const next = order[(order.indexOf(getLang()) + 1) % 3];
    localStorage.setItem("ah_lang", next); location.reload();
  });

  renderModelPick(root);
  if (isConn) { await renderConnectors(root.querySelector("#usage-view")); return; }
  if (isUsage) { await renderUsage(root.querySelector("#usage-view") ); return; }
  if (sub === "agents") { renderAgents(root.querySelector("#usage-view")); return; }
  if (sub === "lab") { renderLab(root.querySelector("#usage-view")); return; }
  updateModeChips(root);
  wireChat(root);
  refreshUsagePill(root);
  welcome(root);
}

// ——— مختار النموذج ———
// — التوفر العابر: نفس النموذج قد يُخدم من عدة بوابات — نطبعها ونفتحها بنقرة —
function normModel(id) {
  return String(id || "").toLowerCase().split("/").pop()
    .replace(/:free$/, "").replace(/^meta-/, "").replace(/-instruct|-versatile|-latest$/g, "");
}
function otherProviders(provider, modelId) {
  const nid = normModel(modelId);
  const out = [];
  for (const p of PROVIDERS) {
    if (p.id === provider || p.id === "instant") continue;
    for (const entry of MODEL_CATALOG[p.id] || []) {
      if (normModel(entry[1]) === nid) { out.push([p, entry[1]]); break; }
    }
  }
  return out;
}

function shortModel(id) {
  if (!id) return "—";
  return id.replace(/^.*\//, "").replace(/:free$/, " ·free");
}

function renderModelPick(root) {
  const holder = root.querySelector("#model-pick") ;
  const cur = PROVIDERS.find((p) => p.id === currentProvider) || PROVIDERS[0];
  const mdl = currentModel();
  const keyless = currentProvider === "instant" || currentProvider === "auto";
  holder.innerHTML = `
    <button class="model-btn" id="mp-btn"><span class="dot ${cur.color}"></span>${cur.name} <span style="color:var(--faint)">▾</span></button>
    ${!keyless ? `<button class="model-btn model-btn2" id="mp-model" title="${t("pick_model")}"><span class="mi-name">${esc(shortModel(mdl))}</span> <span style="color:var(--faint)">▾</span></button>
    <div class="model-menu glass" id="mm-menu" hidden></div>` : ""}
    <div class="model-menu glass" id="mp-menu" hidden></div>`;
  const menu = holder.querySelector("#mp-menu");
  // قائمة العائلات (المستوى الثاني)
  const mmenu = holder.querySelector("#mm-menu") ;
  if (mmenu) {
    const items = (MODEL_CATALOG[currentProvider] || []).map(([label, id, top]) => `
      <button data-m="${esc(id)}">
        <span><div class="mi-name">${esc(label)}${top ? `<i class="mm-pro">PRO</i>` : ""}</div><div class="mi-sub" dir="ltr">${esc(id)}</div>${(() => { const o = otherProviders(currentProvider, id); return o.length ? `<div class="mm-cross">${o.map(([pp, pid]) => `<span role="button" tabindex="0" data-pp="${pp.id}" data-pid="${esc(pid)}" title="${t("also_on")}">${t("also_on_short")} ${pp.name}</span>`).join("")}</div>` : ""; })()}</span>
        ${id === mdl ? `<span class="mi-check">✓</span>` : ""}
        ${modelLink(currentProvider, id) ? `<span class="mm-link" data-url="${esc(modelLink(currentProvider, id))}" title="${t("model_official")}">↗</span>` : ""}
      </button>`).join("");
    mmenu.innerHTML = items + `
      <div class="mm-custom">
        <input id="mm-custom-in" type="text" dir="ltr" placeholder="${t("custom_model")}" />
      </div>`;
    mmenu.querySelectorAll("button[data-m]").forEach((b) => b.addEventListener("click", (e) => {
      const lnk = e.target.closest("[data-url]");
      if (lnk) { window.open(lnk.dataset.url, "_blank", "noopener,noreferrer"); return; }
      const cross = e.target.closest("[data-pp]");
      if (cross) {
        currentProvider = cross.dataset.pp;
        modelSel[currentProvider] = cross.dataset.pid;
        localStorage.setItem("ah_provider", currentProvider);
        localStorage.setItem("ah_models", JSON.stringify(modelSel));
        mmenu.hidden = true;
        renderModelPick(root);
        return;
      }
      modelSel[currentProvider] = b.dataset.m;
      localStorage.setItem("ah_models", JSON.stringify(modelSel));
      mmenu.hidden = true;
      renderModelPick(root);
    }));
    mmenu.querySelector("#mm-custom-in").addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const v = e.target.value.trim();
      if (!v) return;
      modelSel[currentProvider] = v;
      localStorage.setItem("ah_models", JSON.stringify(modelSel));
      mmenu.hidden = true;
      renderModelPick(root);
    });
    (holder.querySelector("#mp-model") ).addEventListener("click", (e) => {
      e.stopPropagation();
      mmenu.hidden = !mmenu.hidden;
      menu.hidden = true;
    });
    document.addEventListener("click", () => { mmenu.hidden = true; }, { once: true });
  }
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

// ——— المقارنة الجنب إلى جنب: نفس السؤال لنموذجين متوازيين مع التوقيت والتكلفة ———
async function sendDuel(root, q) {
  const send = root.querySelector("#send");
  const inner = root.querySelector("#chat-inner");
  const scroller = root.querySelector("#chat-scroll");
  if (duelA.provider === "instant" && duelB.provider === "instant") {
    const a = addMsgEl(root, "ai");
    a.txt.textContent = t("duel_need2");
    return;
  }
  send.disabled = true;
  const el = document.createElement("div");
  el.className = "msg msg-ai";
  el.innerHTML = `<div class="msg-ava">AI</div><div class="msg-body"><div class="who">Nexus · ⚖ ${t("duel")}</div>
    <div class="duel-grid">
      ${["A", "B"].map((side) => {
        const st = side === "A" ? duelA : duelB;
        return `<div class="duel-col" data-side="${side}">
          <div class="duel-head"><span class="dot ${PROVIDERS.find((p) => p.id === st.provider)?.color ?? "p-openai"}"></span>
          <b dir="ltr">${esc(shortModel(st.model || defaultModel(st.provider)))}</b>
          <span class="duel-time" dir="ltr"></span><span class="duel-badge" hidden>${t("duel_fast")}</span></div>
          <div class="duel-txt"><span class="typing"><i></i><i></i><i></i></span></div>
        </div>`;
      }).join("")}
    </div></div>`;
  inner.appendChild(el);
  scroller.scrollTop = 1e9;

  const runSide = async (side) => {
    const st = side === "A" ? duelA : duelB;
    const col = el.querySelector(`.duel-col[data-side="${side}"]`);
    const txt = col.querySelector(".duel-txt");
    const timeEl = col.querySelector(".duel-time");
    const t0 = performance.now();
    let acc = "", ok = false;
    const done = () => {
      timeEl.textContent = ((performance.now() - t0) / 1000).toFixed(1) + "s";
      if (ok) txt.insertAdjacentHTML("beforeend", costChip(st.model || defaultModel(st.provider), q.length, acc.length));
      scroller.scrollTop = 1e9;
    };
    if (st.provider === "instant") {
      const r = await api.post("/api/infer/instant", { messages: [...history.slice(-12)] });
      if (r.ok) { ok = true; acc = r.data.content; txt.textContent = acc; }
      else txt.textContent = errMsg(r.data?.error);
      done(); return { ok, acc };
    }
    const kd = vaultState.keys.find((k) => k.provider === st.provider);
    if (!kd || !vaultState.unlocked) { txt.textContent = t("key_required"); done(); return { ok: false, acc: "" }; }
    await api.stream(st.provider, kd.key, { model: st.model || defaultModel(st.provider), messages: history.slice(-12), stream: true },
      (chunk) => { acc += chunk; txt.textContent = acc + "▍"; scroller.scrollTop = 1e9; },
      () => { ok = acc.length > 0; if (!ok) txt.textContent = t("provider_unreachable"); else txt.textContent = acc; done(); },
      (err) => { txt.textContent = errMsg(err); done(); });
    return { ok, acc };
  };

  const [ra, rb] = await Promise.all([runSide("A"), runSide("B")]);
  if (ra.ok && rb.ok) {
    const fastSide = parseFloat(el.querySelector('.duel-col[data-side="A"] .duel-time').textContent) <= parseFloat(el.querySelector('.duel-col[data-side="B"] .duel-time').textContent) ? "A" : "B";
    el.querySelector(`.duel-col[data-side="${fastSide}"] .duel-badge`).hidden = false;
  }
  const dump = (side, r) => `[⚖ ${side} · ${side === "A" ? duelA : duelB}.provider}/${(side === "A" ? duelA : duelB).model || ""}] ${r.acc || "—"}`;
  history.push({ role: "assistant", content: `${dump("A", ra)}\n${dump("B", rb)}` });
  send.disabled = false;
  scroller.scrollTop = 1e9;
}

function updateModeChips(root) {
  const holder = root.querySelector("#mode-chips");
  if (!holder) return;
  holder.hidden = false;
  const isInstant = currentProvider === "instant";
  holder.innerHTML = `
    <button class="chip ${mode === "chat" ? "on" : ""}" data-m="chat">${t("mode_chat")}</button>
    <button class="chip ${mode === "image" ? "on" : ""}" data-m="image">${t("mode_image")}</button>
    <button class="chip ${mode === "video" ? "on" : ""}" data-m="video">${t("mode_video")}</button>
    <button class="chip ${duelOn ? "on" : ""}" data-m="duel">⚖ ${t("duel")}</button>`;
  holder.querySelectorAll("button[data-m]").forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.m === "duel") { duelOn = !duelOn; localStorage.setItem("ah_duel", duelOn ? "1" : "0"); }
    else { mode = b.dataset.m; localStorage.setItem("ah_mode", mode); duelOn = false; localStorage.setItem("ah_duel", "0"); }
    updateModeChips(root);
  }));
  const ta = root.querySelector("#prompt");
  if (ta) ta.placeholder = mode === "image" ? t("img_placeholder") : mode === "video" ? t("video_placeholder") : t("placeholder");
  updateDuelBar(root);
}

// ——— شريط اختيار النموذجين للمقارنة ———
function updateDuelBar(root) {
  const bar = root.querySelector("#duel-bar");
  if (!bar) return;
  bar.hidden = !duelOn;
  if (!duelOn) return;
  const providers = PROVIDERS.filter((p) => p.id !== "instant" && p.id !== "auto");
  for (const side of ["A", "B"]) {
    const st = side === "A" ? duelA : duelB;
    const pSel = bar.querySelector(`#duel-p${side}`);
    const mSel = bar.querySelector(`#duel-m${side}`);
    if (!providers.some((p) => p.id === st.provider)) {
      const stored = localStorage.getItem(side === "A" ? "ah_duel_pa" : "ah_duel_pb");
      st.provider = stored && providers.some((p) => p.id === stored) ? stored : "groq";
    }
    pSel.innerHTML = providers.map((p) => `<option value="${p.id}" ${p.id === st.provider ? "selected" : ""}>${p.name}</option>`).join("");
    const fillModels = () => {
      const cat = MODEL_CATALOG[st.provider] || [];
      const cur = modelSel[st.provider] || (cat[0] ? cat[0][1] : "");
      st.model = cur;
      mSel.innerHTML = cat.map(([label, id]) => `<option value="${esc(id)}" ${id === cur ? "selected" : ""}>${esc(shortModel(id))}</option>`).join("") || "";
    };
    fillModels();
    pSel.addEventListener("change", () => { st.provider = pSel.value; localStorage.setItem(side === "A" ? "ah_duel_pa" : "ah_duel_pb", st.provider); fillModels(); });
    mSel.addEventListener("change", () => { st.model = mSel.value; modelSel[st.provider] = st.model; localStorage.setItem("ah_models", JSON.stringify(modelSel)); });
  }
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
  const whoLabel = who === "user" ? esc((state.user?.full_name ?? "You").split(" ")[0]) : `AIHub · <span dir="ltr">${esc(currentProvider === "instant" ? "llama-3.1-8b" : currentModel())}</span>`;
  el.innerHTML = `<div class="msg-ava">${who === "user" ? esc((state.user?.full_name?.[0] ?? "U")) : "AI"}</div><div class="msg-body"><div class="who">${whoLabel}</div><div class="txt"></div></div>`;
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

    // ——— وضع المقارنة: نفس السؤال لنموذجين في وقت واحد ———
    if (duelOn) { await sendDuel(root, q, ta); return; }

    // فقاعة الرد + النقاط
    const a = addMsgEl(root, "ai");
    a.txt.innerHTML = `<span class="typing"><i></i><i></i><i></i></span>`;
    send.disabled = true;

    const finish = () => { send.disabled = false; (root.querySelector("#chat-scroll") ).scrollTop = 1e9; };

    // Nexus Open: التدوير الذكي عبر مفاتيح المنصة
    if (currentProvider === "auto") {
      const r = await api.post("/api/infer/auto", { messages: history.slice(-12) });
      if (r.ok) {
        history.push({ role: "assistant", content: r.data.content });
        a.txt.textContent = r.data.content;
        const chips = [];
        if (r.data.cached) chips.push(`<span class="cost-chip via">⚡ ${t("cached_hit")}</span>`);
        chips.push(`<span class="cost-chip">↻ ${esc(r.data.via ?? "")} · ${esc(r.data.model ?? "")}</span>`);
        a.txt.insertAdjacentHTML("beforeend", chips.join(""));
      } else {
        a.txt.textContent = errMsg(r.data?.error);
        if (r.status === 401 && r.data?.error === "auth_required") location.hash = "#auth-login";
      }
      finish(); return;
    }

    // فيديو Luma Ray-2 — المفتاح من الخزنة يمرّ ولا يُخزَّن
    if (mode === "video") {
      const lk = keyFor("luma", "");
      if (!lk || !vaultState.unlocked) { a.txt.textContent = t("luma_key_needed"); openVaultSheet(root); finish(); return; }
      a.txt.textContent = t("luma_pending");
      const cr = await api.post("/api/video/luma", { key: lk.key, prompt: q });
      if (!cr.ok || !cr.data.id) { a.txt.textContent = cr.data?.error === "key_required" ? t("luma_key_needed") : errMsg(cr.data?.error); finish(); return; }
      for (let i = 0; i < 40; i++) {
        await new Promise((res) => setTimeout(res, 6000));
        const st = await api.post("/api/video/luma-status", { key: lk.key, id: cr.data.id });
        if (st.ok && st.data.state === "completed" && st.data.video) {
          a.txt.textContent = "";
          const v = document.createElement("video");
          v.controls = true; v.src = st.data.video; v.style.maxWidth = "100%"; v.style.borderRadius = "14px";
          a.txt.appendChild(v);
          const cap = document.createElement("div"); cap.className = "img-cap"; cap.textContent = "Luma Ray-2";
          a.txt.appendChild(cap);
          history.push({ role: "assistant", content: "[Luma Ray-2 video]" });
          finish(); return;
        }
        if (st.ok && (st.data.state === "failed")) { a.txt.textContent = t("video_failed") + (st.data.failure ? " — " + st.data.failure : ""); finish(); return; }
        a.txt.textContent = t("luma_pending") + " · " + (st.data?.state ?? "queued") + " (" + (i + 1) + ")";
      }
      a.txt.textContent = t("video_timeout"); finish(); return;
    }
    // الصور المتقدمة — Gemini ثم HF FLUX ثم Pollinations
    if (mode === "image") {
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
      if (r.ok) {
        history.push({ role: "assistant", content: r.data.content });
        a.txt.textContent = r.data.content;
        a.txt.insertAdjacentHTML("beforeend", costChip("llama-3.1-8b", q.length, r.data.content.length) + (r.data.via === "pollinations" ? `<span class="cost-chip via">✦ ${t("comm_via")}</span>` : ""));
      }
      else { a.txt.textContent = errMsg(r.data?.error); if (r.status === 401 && r.data?.error === "auth_required") location.hash = "#auth-login"; }
      finish(); return;
    }

    // BYOK: نحتاج المفتاح من الخزنة المفتوحة في الذاكرة
    const kd = vaultState.keys.find((k) => k.provider === currentProvider);
    if (!kd || !vaultState.unlocked) { a.txt.textContent = t("key_required"); openVaultSheet(root); finish(); return; }

    let acc = "";
    let first = true;
    await api.stream(currentProvider, kd.key, { model: currentModel(), messages: history.slice(-12), stream: true },
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
        a.txt.insertAdjacentHTML("beforeend", costChip(currentModel(), q.length, acc.length));
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
    case "hf": return "meta-llama/Llama-3.3-70B-Instruct";
    case "cerebras": return "llama-3.3-70b";
    case "mistral": return "mistral-small-latest";
    case "sambanova": return "Meta-Llama-3.3-70B-Instruct";
    case "cohere": return "command-r7b-12-2024";
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

// ——— معالج جلب المفتاح الموجّه: خطوات ثلاث، يومض حقل اللصق عند العودة ———
function openWizard(c, onDone) {
  const overlay = document.getElementById("overlay-root");
  const name = c.name ?? t(c.nameKey);
  overlay.innerHTML = `<div class="backdrop"></div><div class="sheet">
    <div class="sh-head"><h3>${esc(name)}</h3><button class="sh-x" id="wz-x">✕</button></div>
    <ol class="wz-steps">
      <li><div><b>${t("wz_s1")}</b>${c.url ? `<a class="btn btn-grad btn-sm" href="${c.url}" target="_blank" rel="noopener noreferrer">${t("wz_open")} ↗</a>` : ""}</div></li>
      <li><b>${t("wz_s2")}</b></li>
      <li><b>${t("wz_s3")}</b></li>
    </ol>
    <div class="wz-return">${t("wz_return")}</div>
    <div id="wz-lock"></div>
    <div id="wz-paste" ${vaultState.unlocked ? "" : "hidden"}>
      <div class="conn-form-in">
        <input id="wz-key" type="password" autocomplete="off" placeholder="${t("conn_paste")}" dir="ltr" />
        <button class="btn btn-grad btn-sm" id="wz-save">${t("conn_save")}</button>
      </div>
      <div class="conn-msg" id="wz-msg"></div>
    </div>
  </div>`;
  const close = () => { overlay.innerHTML = ""; document.removeEventListener("visibilitychange", onVis); };
  overlay.querySelector(".backdrop").addEventListener("click", close);
  overlay.querySelector("#wz-x").addEventListener("click", close);
  function onVis() {
    if (document.hidden) return;
    const k = overlay.querySelector("#wz-key");
    if (k && !overlay.querySelector("#wz-paste").hidden) {
      k.classList.add("flash");
      setTimeout(() => k.classList.remove("flash"), 1400);
      try { k.focus(); } catch {}
    }
  }
  document.addEventListener("visibilitychange", onVis);

  // الخزنة مقفلة؟ افتحها داخل المعالج نفسه — بلا خروج
  const lockEl = overlay.querySelector("#wz-lock");
  if (!vaultState.unlocked) {
    lockEl.innerHTML = `<div class="field"><label>${t("vault_pass")}</label><div class="conn-form-in"><input id="wz-vp" type="password" autocomplete="off" /><button class="btn btn-ghost btn-sm" id="wz-vunlock">${t("wz_vunlock")}</button></div></div><div class="hint" style="margin:6px 0 10px">${t("wz_vault_needed")}</div>`;
    lockEl.querySelector("#wz-vunlock").addEventListener("click", async () => {
      const pass = lockEl.querySelector("#wz-vp").value;
      if (!pass) return;
      const r = await api.get("/api/vault");
      if (!r.ok) { location.hash = "#auth-login"; return; }
      if (r.data.blob) {
        try { const data = await decryptBlob(pass, r.data.blob); vaultState.keys = data.keys ?? []; }
        catch { lockEl.querySelector("#wz-vp").value = ""; lockEl.querySelector("#wz-vp").placeholder = t("wrong_pass"); return; }
      }
      vaultState._pass = pass;
      vaultState.unlocked = true;
      lockEl.innerHTML = "";
      overlay.querySelector("#wz-paste").hidden = false;
      overlay.querySelector("#wz-key").focus();
    });
  }

  const inp = overlay.querySelector("#wz-key");
  const msg = overlay.querySelector("#wz-msg");
  const prefixes = Array.isArray(c.prefix) ? c.prefix : c.prefix ? [c.prefix] : [];
  inp?.addEventListener("input", () => {
    const v = inp.value.trim();
    const good = prefixes.length && prefixes.some((pf) => v.startsWith(pf));
    if (!prefixes.length || v.length < 5) { msg.textContent = ""; return; }
    msg.textContent = good ? t("wz_fmt_ok") : t("conn_format_warn");
    msg.className = "conn-msg " + (good ? "ok" : "bad");
  });
  overlay.querySelector("#wz-save")?.addEventListener("click", async () => {
    const key = inp.value.trim();
    if (!key || key.length < 8) return;
    vaultState.keys.push({ id: `k-${Date.now().toString(36)}`, provider: c.id, label: name, key });
    const ok = await persistVault();
    if (ok) { close(); onDone && onDone(); }
  });
  try { inp && vaultState.unlocked && inp.focus(); } catch {}
}

// ——— الموصلات: كل نموذج بنقرة — حصتنا أولاً، ثم المفاتيح الرسمية المجانية، ثم المدفوعة ———
const CONN_META = [
  { sec: "keyless", id: "instant", nameKey: "instant_card", subKey: "instant_card_sub", color: "p-instant", url: "", prefix: null },
  { sec: "free", id: "nvidia", name: "NVIDIA NIM", subKey: "nvidia_sub2", color: "p-nvidia", url: "https://build.nvidia.com", prefix: "nvapi-" },
  { sec: "free", id: "github-models", name: "GitHub Models", subKey: "gh_sub2", color: "p-github", url: "https://github.com/settings/personal-access-tokens/new", prefix: ["ghp_", "github_pat_", "gho_"] },
  { sec: "free", id: "gemini", name: "Google AI Studio", subKey: "google_sub2", color: "p-gemini", url: "https://aistudio.google.com/apikey", prefix: "AIza" },
  { sec: "free", id: "groq", name: "Groq", subKey: "groq_sub2", color: "p-groq", url: "https://console.groq.com/keys", prefix: "gsk_" },
  { sec: "free", id: "openrouter", name: "OpenRouter", subKey: "or_sub2", color: "p-openrouter", url: "https://openrouter.ai/settings/keys", prefix: "sk-or-" },
  { sec: "free", id: "hf", name: "Hugging Face", subKey: "hf_sub", color: "p-hf", url: "https://huggingface.co/settings/tokens", prefix: "hf_" },
  { sec: "free", id: "cerebras", name: "Cerebras", subKey: "cerebras_sub", color: "p-cerebras", url: "https://cloud.cerebras.ai", prefix: "csk-" },
  { sec: "free", id: "mistral", name: "Mistral", subKey: "mistral_sub", color: "p-mistral", url: "https://console.mistral.ai/api-keys", prefix: null },
  { sec: "free", id: "sambanova", name: "SambaNova", subKey: "sambanova_sub", color: "p-sambanova", url: "https://cloud.sambanova.ai/apikeys", prefix: null },
  { sec: "free", id: "cohere", name: "Cohere", subKey: "cohere_sub", color: "p-cohere", url: "https://dashboard.cohere.com/api-keys", prefix: null },
  { sec: "paid", id: "openai", name: "OpenAI", sub: "GPT-4o · o-series", color: "p-openai", url: "https://platform.openai.com/api-keys", prefix: "sk-" },
  { sec: "paid", id: "anthropic", name: "Anthropic", sub: "Claude 4 family", color: "p-anthropic", url: "https://console.anthropic.com/settings/keys", prefix: "sk-ant-" },
];
const SECTIONS = [["keyless", "conn_keyless"], ["free", "conn_official_free"], ["paid", "conn_paid"]];

function renderAgents(view) {
  if (!view) return;
  const agents = [
    { id: "researcher", name: t("ag_r_name"), desc: t("ag_r_desc"), icon: "M10.5 3.5a7 7 0 1 0 4.9 12l4.1 4.1M10.5 3.5a7 7 0 0 1 4.9 12" },
    { id: "analyst", name: t("ag_a_name"), desc: t("ag_a_desc"), icon: "M4 20V13M10 20V6.5M16 20v-9.5M21 20H3.5" },
    { id: "writer", name: t("ag_w_name"), desc: t("ag_w_desc"), icon: "M4 20l4-1L19.5 7.5a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" },
  ];
  view.innerHTML = `
    <div class="page-head"><h2>${t("nav_agents")}</h2><p class="page-sub">${t("agents_sub")}</p></div>
    <div class="agent-grid">
      ${agents.map((a) => `
      <button class="agent-card glass" data-agent="${a.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${a.icon}"/></svg>
        <strong>${a.name}</strong><span>${a.desc}</span>
      </button>`).join("")}
    </div>
    <div class="field" id="ag-url-wrap" hidden><label>${t("agent_url")}</label><input id="ag-url" dir="ltr" placeholder="https://example.com/article" /></div>
    <div class="field"><label>${t("agent_task")}</label><textarea id="ag-task" rows="3" placeholder="${t("agent_task_ph")}"></textarea></div>
    <button class="btn btn-grad" id="ag-go">${t("agent_run")}</button>
    <div class="lab-out glass" id="ag-out" hidden></div>`;
  let cur = "writer";
  view.querySelectorAll(".agent-card").forEach((c) => c.addEventListener("click", () => {
    cur = c.dataset.agent;
    view.querySelectorAll(".agent-card").forEach((x) => x.classList.toggle("on", x === c));
    view.querySelector("#ag-url-wrap").hidden = cur !== "researcher";
  }));
  view.querySelector('.agent-card[data-agent="writer"]').classList.add("on");
  view.querySelector("#ag-go").addEventListener("click", async () => {
    const task = view.querySelector("#ag-task").value.trim();
    const url = view.querySelector("#ag-url").value.trim();
    const out = view.querySelector("#ag-out");
    if (task.length < 3) return;
    out.hidden = false; out.textContent = t("agent_working");
    const r = await api.post("/api/agent/run", { agent: cur, task, url });
    out.hidden = false;
    out.textContent = r.ok ? (r.data.content ?? "") : errMsg(r.data?.error);
  });
}

function renderLab(view) {
  if (!view) return;
  view.innerHTML = `
    <div class="page-head"><h2>${t("nav_lab")}</h2><p class="page-sub">${t("lab_sub")}</p></div>
    <div class="mode-chips" style="position:static">
      <button class="chip on" data-l="js">JavaScript</button>
      <button class="chip" data-l="py">Python</button>
    </div>
    <div class="field"><textarea id="lab-code" rows="10" dir="ltr" spellcheck="false"></textarea></div>
    <button class="btn btn-grad" id="lab-go">${t("lab_run")}</button>
    <div class="lab-out glass" id="lab-out"><span style="color:var(--faint)">stdout…</span></div>
    <p class="hint" style="margin-top:10px">${t("lab_hint")}</p>`;
  let lang = "js";
  const setDefault = () => {
    view.querySelector("#lab-code").value = lang === "js"
      ? 'console.log("مرحباً من المعمل");\n[1,2,3].map(n => n ** 2).forEach(n => console.log(n));'
      : 'print("مرحباً من بايثون")\nprint(sum(n**2 for n in range(10)))';
  };
  view.querySelectorAll("[data-l]").forEach((b) => b.addEventListener("click", () => {
    lang = b.dataset.l;
    view.querySelectorAll("[data-l]").forEach((x) => x.classList.toggle("on", x === b));
    setDefault();
  }));
  setDefault();
  const out = view.querySelector("#lab-out");
  const onMsg = (e) => { if (e.data && e.data.__lab) { out.textContent = e.data.__lab; } };
  window.addEventListener("message", onMsg);
  view.querySelector("#lab-go").addEventListener("click", () => {
    const code = view.querySelector("#lab-code").value;
    out.textContent = "…";
    const f = document.createElement("iframe");
    f.style.display = "none";
    f.setAttribute("sandbox", "allow-scripts");
    const esc2 = (x) => x.replace(/<\/+/g, "<\\\\/");
    if (lang === "js") {
      f.srcdoc = '<!doctype html><script>(function(){const B=[];const P=(m)=>B.push(String(m));' +
        'console.log=(...a)=>P(a.join(" "));console.error=P;console.warn=P;' +
        'window.onerror=(m)=>P("خطأ: "+m);' +
        'try{(function(){' + esc2(code) + '})();}catch(e){P("خطأ: "+e.message)}' +
        'parent.postMessage({__lab:B.join("\\n")||"(بلا مخرجات)"},"*");})();</script>';
    } else {
      f.srcdoc = '<!doctype html><html><head><meta charset="utf-8">' +
        '<script src="https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js"></script></head><body><script>' +
        '(async function(){const B=[];const P=(m)=>B.push(String(m));' +
        'try{const py=await loadPyodide({stdout:(t)=>P(t),stderr:(t)=>P(t)});' +
        'await py.runPythonAsync(window.__nexus_code);}' +
        'catch(e){P("خطأ: "+e.message)}' +
        'parent.postMessage({__lab:B.join("\\n")||"(بلا مخرجات)"},"*");})();</script></body></html>';
      f.addEventListener("load", () => { try { f.contentWindow.__nexus_code = code; } catch {} }, { once: true });
    }
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 180000);
  });
}

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

  // وصّل: معالج موجّه — افتح اللوحة، انسخ، ألصق
  list.querySelectorAll("button[data-connect]").forEach((b) => b.addEventListener("click", () => {
    const meta = CONN_META.find((x) => x.id === b.dataset.connect);
    if (meta) openWizard(meta, () => renderConnectors(view));
  }));

  // اختبر: نداء حقيقي صغير عبر الوكيل الشفاف
  list.querySelectorAll("button[data-test]").forEach((b) => b.addEventListener("click", async () => {
    const id = b.dataset.test;
    const msg = list.querySelector(`#cm-${CSS.escape(id)}`);
    const kd = vaultState.keys.find((k) => k.provider === id);
    if (!kd) return;
    b.textContent = t("conn_testing"); b.disabled = true;
    const r = await api.post(`/api/infer/${id}`, { model: (modelSel[id] || defaultModel(id)), messages: [{ role: "user", content: "ping" }], max_tokens: 4, stream: false }, { "x-upstream-key": kd.key });
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
