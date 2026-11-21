/* AS2 GATE — منطق الواجهة: اللغة، التمييز النشط، التبويبات، الساحة العالمية، الوكيل الذكي
   سياسة النماذج: نماذج الاستوديو المجانية حصراً عبر الخادم — لا نماذج مستخدمين ولا مفاتيح زوار */
"use strict";

/* ————— الساحة العالمية — بيانات ————— */
const FREQ = {
  always: { ar: "دائمة", en: "Always-on" },
  annual: { ar: "سنوية", en: "Annual" },
  weekly: { ar: "أسبوعية", en: "Weekly" },
  monthly: { ar: "شهرية", en: "Monthly" },
};

const ARENA = {
  dev: [
    { n: "ICPC", u: "https://icpc.global", f: "annual", ar: "أعرق مسابقة برمجة جامعية فريقياً — طريق البطولة العالمية للجامعات.", en: "The most prestigious collegiate team programming contest — the road to the world finals." },
    { n: "Meta Hacker Cup", u: "https://www.facebook.com/codingcompetitions/hacker-cup", f: "annual", ar: "مسابقة ميتا العالمية للخوارزميات — جولات تأهيل حتى النهائيات.", en: "Meta's global algorithms contest — qualifying rounds through to the finals." },
    { n: "Codeforces", u: "https://codeforces.com", f: "always", ar: "أقوى أجندة مسابقات خوارزمية منتظمة — جولات شبه أسبوعية بمستويات Div.", en: "The strongest regular competitive-programming agenda — near-weekly rounds across Div tiers." },
    { n: "AtCoder", u: "https://atcoder.jp", f: "always", ar: "مسابقات أسبوعية عالية الجودة من اليابان — ABC وARC وAGC.", en: "High-quality weekly contests from Japan — ABC, ARC and AGC." },
    { n: "Topcoder", u: "https://www.topcoder.com", f: "always", ar: "تحديات وجولات كلاسيكية مستمرة + بطولة TCO السنوية.", en: "Continuous classic challenges and rounds plus the annual TCO tournament." },
    { n: "LeetCode Contests", u: "https://leetcode.com/contest/", f: "weekly", ar: "Weekly وBiweekly للهيكل والسرعة — المعيار العالمي لمقابلات الشركات.", en: "Weekly and Biweekly contests — the global benchmark for company interviews." },
    { n: "CodeChef", u: "https://www.codechef.com", f: "monthly", ar: "مسابقات شهرية ومعسكرات تدريب من أكبر منصات الهند.", en: "Monthly contests and training camps from one of India's biggest platforms." },
    { n: "Kaggle", u: "https://www.kaggle.com/competitions", f: "always", ar: "مسابقات ذكاء اصطناعي وتعلّم آلي بجوائز ضخمة — متاحة دائماً.", en: "AI/ML competitions with major prizes — always available." },
    { n: "Google Summer of Code", u: "https://summerofcode.withgoogle.com", f: "annual", ar: "تُدفع لك للعمل على المصدر المفتوح مع مرشدين — بوابة Google للمساهمين.", en: "Get paid to work on open source with mentors — Google's contributor gateway." },
    { n: "Devpost × MLH", u: "https://devpost.com/hackathons", f: "always", ar: "أجندة هاكاثونات عالمية مستمرة — أونلاين وبجوائز على مدار السنة.", en: "A continuous global hackathon agenda — online and prize-backed all year." },
  ],
  cyber: [
    { n: "Hack The Box", u: "https://www.hackthebox.com", f: "always", ar: "مختبرات اختراق واقعية ومسارات — وCTF سنوي للأعمال.", en: "Realistic offensive-security labs and paths — plus the annual Business CTF." },
    { n: "TryHackMe", u: "https://tryhackme.com", f: "always", ar: "تعلّم الأمن عملياً بمسارات موجّهة من الصفر إلى الاحتراف.", en: "Hands-on security learning with guided paths from zero to pro." },
    { n: "picoCTF", u: "https://picoctf.org", f: "annual", ar: "أكبر مسابقة CTF تعليمية — من Carnegie Mellon.", en: "The largest educational CTF — by Carnegie Mellon." },
    { n: "Google CTF", u: "https://capturetheflag.withgoogle.com", f: "annual", ar: "من Google — شوط مبتدئ ونهائيات نخبوية.", en: "By Google — a beginners' round and elite finals." },
    { n: "DEF CON CTF", u: "https://defcon.org", f: "annual", ar: "أعرق بطولة اختراق — تأهيل صعب ونهائيات لاس فيغاس.", en: "The most iconic hacking contest — tough quals, Las Vegas finals." },
    { n: "CSAW", u: "https://csaw.io", f: "annual", ar: "أكبر CTF جامعي — من NYU بمراكز متعددة حول العالم.", en: "The largest student CTF — by NYU with global hubs." },
    { n: "CTFtime", u: "https://ctftime.org", f: "always", ar: "الأجندة العالمية لكل مسابقات CTF — لا تفوّت شيئاً.", en: "The global calendar of every CTF — miss nothing." },
    { n: "HackerOne", u: "https://www.hackerone.com", f: "always", ar: "أكبر سوق بَغي (Bug Bounty) وبرامج ثغرات الشركات.", en: "The biggest bug-bounty marketplace and corporate programs." },
    { n: "Bugcrowd", u: "https://www.bugcrowd.com", f: "always", ar: "بَغي وبرامج كشف للشركات الكبرى — دائمة التوفر.", en: "Bounties and disclosure programs for major companies — always on." },
    { n: "Intigriti × YesWeHack", u: "https://www.intigriti.com", f: "always", ar: "منصتا بَغي أوروبيتان — ثغرات مدفوعة بأسعار ممتازة.", en: "Two European bounty platforms — premium-paid vulnerabilities." },
  ],
};

/* ————— شرائح الوكيل — نص السؤال لكل نية ————— */
const CHIPS = {
  alignerr_what: { ar: "ما هي Alignerr؟", en: "What is Alignerr?" },
  outlier_what: { ar: "ما هي Outlier؟", en: "What is Outlier?" },
  alignerr_signup: { ar: "كيف أسجل في Alignerr؟", en: "How do I register on Alignerr?" },
  outlier_signup: { ar: "كيف أسجل في Outlier؟", en: "How do I register on Outlier?" },
  acceptance: { ar: "كيف أنجح قبول ملفي؟", en: "How do I get accepted?" },
  assessments: { ar: "التقييمات وكيف أنجحها؟", en: "How do I pass the assessments?" },
  pay: { ar: "ما هي الأجور؟", en: "What are the pay rates?" },
  payout: { ar: "كيف يستلم الدفع؟", en: "How do payouts work?" },
  high_value: { ar: "المهام عالية القيمة؟", en: "High-value tasks?" },
  as2_support: { ar: "دعم فريق AS2؟", en: "AS2 team support?" },
  competitions: { ar: "المسابقات العالمية؟", en: "Global competitions?" },
  documents: { ar: "الوثائق المطلوبة؟", en: "Required documents?" },
  timeline: { ar: "كم يستغرق القبول؟", en: "How long does acceptance take?" },
  problems: { ar: "قلّت المهام أو رفض؟", en: "Few tasks or rejected?" },
};

const UI = {
  typing: { ar: "الوكيل يجهز الجواب…", en: "The agent is preparing…" },
  sendError: { ar: "تعذر الوصول للوكيل — حاول مجدداً.", en: "Couldn't reach the agent — try again." },
  welcome: {
    ar: "أهلاً بك في بوابة AS2 👋\nأنا وكيلك الذكي — اسألني عن **Alignerr** و**Outlier**: التسجيل، قبول الملف، التقييمات، الأجر، والمهام عالية القيمة.\nاختر سؤالاً من الشرائح أو اكتب سؤالك بحرية.",
    en: "Welcome to the AS2 gate 👋\nI'm your AI agent — ask me about **Alignerr** and **Outlier**: registration, acceptance, assessments, pay, and high-value tasks.\nPick a question below or type freely.",
  },
  modeKB: { ar: "قاعدة معرفة", en: "Knowledge base" },
  modeLLM: { ar: "وكيل حي", en: "Live agent" },
};

/* ————— اللغة ————— */
let lang = "ar";
try {
  lang = localStorage.getItem("as2_lang") === "en" ? "en" : "ar";
} catch {}

function applyLang() {
  const html = document.documentElement;
  html.dataset.lang = lang;
  html.lang = lang;
  html.dir = lang === "ar" ? "rtl" : "ltr";
  document.getElementById("langBtn").textContent = lang === "ar" ? "EN" : "ع";
  const input = document.getElementById("chatInput");
  if (input) input.placeholder = lang === "ar" ? input.dataset.phAr : input.dataset.phEn;
  if (document.getElementById("grid-dev")) renderArena();
  if (!chatBusy && chatLog && chatLog.children.length <= 1) renderChips(DEFAULT_CHIPS);
  updateModeBadge(chatModeState);
}

document.getElementById("langBtn").addEventListener("click", () => {
  lang = lang === "ar" ? "en" : "ar";
  try {
    localStorage.setItem("as2_lang", lang);
  } catch {}
  applyLang();
});

/* ————— التمييز النشط في الترويسة ————— */
(function markActive() {
  const here = (location.pathname.replace(/\/+$/, "") || "/") + "";
  document.querySelectorAll(".links a").forEach((a) => {
    const t = (a.getAttribute("href") || "").replace(/\/+$/, "") || "/";
    if (t === here || (t !== "/" && here.startsWith(t))) a.classList.add("active");
  });
})();

/* ————— الساحة — عرض ————— */
function renderArena() {
  for (const key of ["dev", "cyber"]) {
    const host = document.getElementById("grid-" + key);
    host.innerHTML = ARENA[key]
      .map(
        (x) => `<a class="acard reveal in" href="${x.u}" target="_blank" rel="noopener">
          <div class="acard-head"><b>${x.n}</b><span class="freq ${x.f}">${FREQ[x.f][lang]}</span></div>
          <p>${lang === "ar" ? x.ar : x.en}</p>
          <span class="go">${x.u.replace("https://", "")} ↗</span>
        </a>`
      )
      .join("");
  }
}

/* ————— التبويبات ————— */
function bindTabs(containerId, attr, map) {
  const host = document.getElementById(containerId);
  if (!host) return;
  host.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-" + attr + "]");
    if (!btn) return;
    host.querySelectorAll(".tab").forEach((t) => t.classList.remove("on"));
    btn.classList.add("on");
    for (const [id, el] of Object.entries(map)) el.hidden = id !== btn.dataset[attr];
    if (attr === "track") observeReveals();
  });
}
bindTabs("trackTabs", "track", {
  alignerr: document.getElementById("track-alignerr"),
  outlier: document.getElementById("track-outlier"),
});
bindTabs("arenaTabs", "tab", {
  dev: document.getElementById("grid-dev"),
  cyber: document.getElementById("grid-cyber"),
});
const outlierTip = document.getElementById("tip-outlier");
if (outlierTip) {
  document.getElementById("trackTabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-track]");
    if (b) outlierTip.hidden = b.dataset.track !== "outlier";
  });
}

/* ————— الظهور التدريجي ————— */
const io = new IntersectionObserver(
  (entries) => entries.forEach((en) => en.isIntersecting && en.target.classList.add("in")),
  { threshold: 0.12 }
);
function observeReveals() {
  document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
}

/* ————— الوكيل الذكي (صفحة /agent حصراً) ————— */
const chatLog = document.getElementById("chatLog");
const chatChips = document.getElementById("chatChips");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");
const chatMode = document.getElementById("chatMode");
const DEFAULT_CHIPS = ["alignerr_what", "outlier_what", "alignerr_signup", "outlier_signup", "acceptance", "pay"];
let chatBusy = false;
let chatModeState = "kb";
let history = [];

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function fmt(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
}

function addMsg(kind, text) {
  const div = document.createElement("div");
  div.className = "msg " + kind;
  div.innerHTML = fmt(text);
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
  return div;
}

function renderChips(ids) {
  if (!chatChips) return;
  chatChips.innerHTML = ids
    .filter((id) => CHIPS[id])
    .map((id) => `<button class="chip" data-qid="${id}">${esc(CHIPS[id][lang])}</button>`)
    .join("");
}

if (chatChips) {
  chatChips.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-qid]");
    if (btn && !chatBusy) ask(CHIPS[btn.dataset.qid][lang]);
  });
}

function updateModeBadge(state) {
  if (!chatMode) return;
  chatModeState = state || chatModeState;
  chatMode.textContent = chatModeState === "llm" ? UI.modeLLM[lang] : UI.modeKB[lang];
  chatMode.classList.toggle("live", chatModeState === "llm");
}

if (chatForm) {
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = chatInput.value.trim();
    if (!q || chatBusy) return;
    chatInput.value = "";
    ask(q);
  });
}

async function ask(q) {
  chatBusy = true;
  chatSend.disabled = true;
  addMsg("user", q);
  const typing = addMsg("bot", "");
  typing.innerHTML = `<span class="typing"><i></i><i></i><i></i></span>`;
  chatLog.scrollTop = chatLog.scrollHeight;
  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ q, lang, history: history.slice(-8) }),
    });
    const d = await r.json();
    typing.remove();
    if (d && d.ok && d.text) {
      addMsg("bot", d.text);
      history.push({ role: "user", content: q }, { role: "assistant", content: d.text });
      updateModeBadge(d.mode === "llm" ? "llm" : "kb");
      if (Array.isArray(d.chips) && d.chips.length) renderChips(d.chips);
    } else {
      addMsg("bot", UI.sendError[lang]);
    }
  } catch {
    typing.remove();
    addMsg("bot", UI.sendError[lang]);
  } finally {
    chatBusy = false;
    chatSend.disabled = false;
    chatInput.focus();
  }
}

/* ————— إقلاع ————— */
if (chatLog) {
  addMsg("bot", UI.welcome[lang]);
  renderChips(DEFAULT_CHIPS);
}
applyLang();
observeReveals();
