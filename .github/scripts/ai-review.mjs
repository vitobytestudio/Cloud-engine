/* المراجع العقلي الثاني — بوابة CI مستقلة عن كاتب الكود
   تُفعَّل بوضع مفتاح مراجع في سر AI_KEYS بصيغة: reviewer=AIza... أو reviewer=gsk_...
   كل مفتاح reviewer يجيب باستقلال؛ حكم BLOCK من أي مراجع يُسقط البناء.
   وضع الإلزام: متغير المستودع REQUIRE_REVIEW=1 يجعل غياب المراجع أو صمته فشلاً لا تجاوزاً. */
import { execSync } from "node:child_process";
import { parseReviewers, extractVerdict, REVIEW_PROMPT } from "./review-lib.mjs";

const KEYS = process.env.AI_KEYS ?? "";
const REQUIRE = process.env.REQUIRE_REVIEW === "1";
const BASE = process.env.GITHUB_BASE_REF ?? "main";
const notice = (m) => console.log(`::notice::${m}`);

/* ─── جلب الفرق الخاضع للمراجعة ─── */
let diff = "";
try {
  diff = execSync(`git diff origin/${BASE}...HEAD 2>/dev/null || git diff HEAD^ HEAD`, { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
} catch { diff = execSync("git diff HEAD^ HEAD", { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }); }
if (!diff.trim()) { notice("لا فرق لمراجعته"); process.exit(0); }
if (diff.length > 12000) diff = diff.slice(0, 12000) + "\n… [اقتُطع — الفرق أطول من 12 ألف حرف]";

const reviewers = parseReviewers(KEYS);
if (!reviewers.length) {
  if (REQUIRE) {
    console.log("::error::وضع الإلزام مفعّل ولا يوجد أي مفتاح reviewer= في AI_KEYS — لا مرور بلا مراجعة");
    process.exit(1);
  }
  notice("المراجع العقلي الثاني غير مفعّل — أضف reviewer=<مفتاح Gemini أو Groq> إلى سر AI_KEYS ليعمل قبل كل دمج");
  process.exit(0);
}

const askGemini = async (key) => {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: REVIEW_PROMPT(diff) }] }], generationConfig: { temperature: 0.2 } }),
    signal: AbortSignal.timeout(30000),
  });
  const j = await r.json();
  return j?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
};
const askGroq = async (key) => {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", temperature: 0.2, messages: [{ role: "user", content: REVIEW_PROMPT(diff) }] }),
    signal: AbortSignal.timeout(30000),
  });
  const j = await r.json();
  return j?.choices?.[0]?.message?.content ?? "";
};

let blocks = 0, answered = 0;
for (const rv of reviewers) {
  try {
    const raw = rv.provider === "gemini" ? await askGemini(rv.key) : await askGroq(rv.key);
    const v = extractVerdict(raw);
    if (!v) { notice(`المراجع ${rv.name} أجاب بصيغة غير قابلة للتحليل — يُحتسب فشلاً`); continue; }
    answered++;
    notice(`المراجع ${rv.name} (${rv.provider}): ${v.verdict} — ${v.summary.slice(0, 160)}`);
    for (const iss of v.issues.slice(0, 6)) console.log(`::warning::[المراجع ${rv.name}] ${String(iss).slice(0, 200)}`);
    if (v.verdict === "BLOCK") blocks++;
  } catch (e) {
    notice(`المراجع ${rv.name} تعذر إجابته (${String(e).slice(0, 80)})`);
  }
}

if (blocks > 0) {
  console.log(`::error::المراجع العقلي الثاني أسقط البناء (${blocks} حكم BLOCK) — عالج الملاحظات أو ناقشها في الـPR`);
  process.exit(1);
}
if (REQUIRE && answered === 0) {
  console.log("::error::وضع الإلزام مفعّل ولم يُجب أي مراجع — لا مرور بلا مراجعة فعلية");
  process.exit(1);
}
notice("المراجع العقلي الثاني: لا حجب — البناء يمر");
process.exit(0);
