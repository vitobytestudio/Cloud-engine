// ——— افتتاحية Nexus السينمائية: الشعارات → أحدث النماذج → ساحة العمل — مرة كل جلسة، قابلة للتخطي ———
const NMARK = `<svg viewBox="0 0 32 32" fill="none" class="nx-draw"><defs><linearGradient id="nxg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c6cff"/><stop offset="1" stop-color="#00d4ff"/></linearGradient></defs><rect x="1.5" y="1.5" width="29" height="29" rx="8" fill="#0a0d14" stroke="url(#nxg)" stroke-opacity=".45"/><path d="M9.5 22.5v-13l13 13v-13" stroke="url(#nxg)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const COMPANIES = [
  ["OpenAI", "#10a37f"], ["Anthropic", "#d97757"], ["Google DeepMind", "#4e8cff"], ["Meta AI", "#0866ff"],
  ["NVIDIA", "#76b900"], ["Mistral AI", "#fa500f"], ["xAI", "#e5e7eb"], ["DeepSeek", "#4d6bfe"],
  ["Qwen · Alibaba", "#7b3fe4"], ["Moonshot AI", "#ff6cb5"], ["Cohere", "#a071ff"], ["Cerebras", "#ff8a3d"],
];
const FLAGSHIPS = [
  ["GPT-6 Astra", "gpt-6-astra", "OpenAI", "#10a37f"],
  ["Claude Fable 5.1", "claude-fable-5-1", "Anthropic", "#d97757"],
  ["Gemini 4 Argon", "gemini-4-argon", "Google", "#4e8cff"],
  ["DeepSeek-V4", "1M context", "NVIDIA", "#76b900"],
  ["Llama 4 Maverick", "meta/llama-4", "Meta AI", "#0866ff"],
  ["Grok 4", "x-ai/grok-4", "xAI", "#e5e7eb"],
];

function chipHTML([name, color]) {
  return `<span class="nx-logo"><i style="background:${color}"></i>${name}</span>`;
}
function cardHTML([name, id, org, color]) {
  return `<div class="nx-card"><div class="nx-card-top" style="background:${color}"></div>
    <div class="nx-card-org">${org}</div><div class="nx-card-name">${name}</div><div class="nx-card-id" dir="ltr">${id}</div></div>`;
}

export function maybePlayIntro(onDone) {
  let reduced = false;
  try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch {}
  if (reduced || sessionStorage.getItem("nx_intro")) { onDone(); return; }
  sessionStorage.setItem("nx_intro", "1");

  const lang = (localStorage.getItem("ah_lang") || "ar");
  const T = lang === "en"
    ? { skip: "Skip intro", powered: "Powered by the world's latest models", flag: "Today's flagships", enter: "Enter the workspace" }
    : lang === "fr"
      ? { skip: "Passer l'intro", powered: "Propulsé par les derniers modèles du monde", flag: "Les fleurons du jour", enter: "Entrer dans l'atelier" }
      : { skip: "تخطّي المقدمة", powered: "مدعوم بأحدث نماذج العالم", flag: "رائدات اليوم", enter: "ادخل ساحة العمل" };

  const el = document.createElement("div");
  el.className = "nx-intro";
  el.innerHTML = `
    <button class="nx-skip">${T.skip}</button>
    <div class="nx-stage">
      <div class="nx-mark">${NMARK}<div class="nx-word">NEXUS</div><div class="nx-sub">كل نماذج الذكاء · منصة واحدة</div></div>
      <div class="nx-row-wrap nx-hide">
        <div class="nx-caption">${T.powered}</div>
        <div class="nx-logos"><div class="nx-logos-track a">${COMPANIES.map(chipHTML).join("")}</div></div>
        <div class="nx-logos rev"><div class="nx-logos-track b">${[...COMPANIES].reverse().map(chipHTML).join("")}</div></div>
      </div>
      <div class="nx-flag nx-hide">
        <div class="nx-caption">${T.flag}</div>
        <div class="nx-grid">${FLAGSHIPS.map(cardHTML).join("")}</div>
      </div>
      <button class="nx-enter nx-hide">${T.enter} <span class="nx-arrow">←</span></button>
    </div>`;
  document.body.appendChild(el);

  const q = (s) => el.querySelector(s);
  const show = (sel) => q(sel).classList.remove("nx-hide");
  const finish = () => {
    if (!el.parentNode) return;
    el.classList.add("nx-out");
    setTimeout(() => { el.remove(); onDone(); }, 650);
  };
  q(".nx-skip").addEventListener("click", finish);
  q(".nx-enter").addEventListener("click", finish);

  requestAnimationFrame(() => {
    el.classList.add("nx-in");                 // الشعار يُرسم
    setTimeout(() => show(".nx-row-wrap"), 1500);   // الشعارات
    setTimeout(() => show(".nx-flag"), 3600);       // الرائدات
    setTimeout(() => show(".nx-enter"), 5300);      // الدعوة
    setTimeout(finish, 9500);                        // خاتمة تلقائية مهيبة
  });
}
