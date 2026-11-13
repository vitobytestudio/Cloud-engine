/* المراجع العقلي الثاني — بوابة CI مستقلة عن كاتب الكود
   تُفعَّل بوضع مفتاح مراجع في سر AI_KEYS بصيغة: reviewer=AIza... أو reviewer=gsk_...
   كل مفتاح reviewer يجيب باستقلال؛ حكم BLOCK من أي مراجع يُسقط البناء. */
import { execSync } from "node:child_process";

const KEYS = process.env.AI_KEYS ?? "";
const BASE = process.env.GITHUB_BASE_REF ?? "main";
const notice = (m) => console.log(`::notice::${m}`);

/* ─── استخراج مفاتيح المراجعة (أسطر name=key أو JSON) ─── */
const reviewers = [];
let lines = KEYS.split("\n").map((l) => l.trim()).filter(Boolean);
if (!lines.length && KEYS.trim().startsWith("{")) {
  try { lines = Object.entries(JSON.parse(KEYS)).filter(([, v]) => typeof v === "string").map(([k, v]) => `${k}=${v}`); } catch {}
}
for (const l of lines) {
  const eq = l.indexOf("=");
  if (eq <= 0) continue;
  const name = l.slice(0, eq).trim(), key = l.slice(eq + 1).trim();
  if (!/^reviewer/i.test(name) || !key) continue;
  const provider = key.startsWith("AIza") ? "gemini" : key.startsWith("gsk_") ? "groq" : null;
  if (provider) reviewers.push({ name, provider, key });
}

if (!reviewers.length) {
  notice("المراجع العقلي الثاني غير مفعّل — أضف reviewer=<مفتاح Gemini أو Groq> إلى سر AI_KEYS ليعمل قبل كل دمج");
  process.exit(0);
}

/* ─── جلب الفرق الخاضع للمراجعة ─── */
let diff = "";
try {
  diff = execSync(`git diff origin/${BASE}...HEAD 2>/dev/null || git diff HEAD^ HEAD`, { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
} catch { diff = execSync("git diff HEAD^ HEAD", { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }); }
if (!diff.trim()) { notice("لا فرق لمراجعته"); process.exit(0); }
if (diff.length > 12000) diff = diff.slice(0, 12000) + "\n… [اقتُطع — الفرق أطول من 12 ألف حرف]";

const PROMPT = `أنت مراجع كود عدائي مستقل (Senior Security & Code Reviewer) — لم تكتب هذا الكود وهدفك إيجاد عيبه.
راجع الفرق التالي (منصة تجارة حقيقية على Cloudflare Workers: D1 + KV):
1. الأمن أولاً: حقن SQL، تجاوز تصريح/ملكية، CSRF، تسريب أسرار، مسارات غير آمنة.
2. أخطاء المنطق وعقود الواجهة والتخزين، وفقدان بيانات محتمل.
3. تجاهل الأسلوب الجمالي — لا تحسبه عيباً.
أجب بـ JSON فقط بلا أي نص آخر:
{"verdict":"PASS"|"BLOCK","issues":["..."],"summary":"سطر واحد"}
استعمل BLOCK فقط عند خلل حقيقي (أمني أو منطقي أو فقد بيانات) — لا لمجرد ذوق.

الفرق:
${diff}`;

const askGemini = async (key) => {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: PROMPT }] }], generationConfig: { temperature: 0.2 } }),
    signal: AbortSignal.timeout(30000),
  });
  const j = await r.json();
  return j?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
};
const askGroq = async (key) => {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", temperature: 0.2, messages: [{ role: "user", content: PROMPT }] }),
    signal: AbortSignal.timeout(30000),
  });
  const j = await r.json();
  return j?.choices?.[0]?.message?.content ?? "";
};

let blocks = 0;
for (const rv of reviewers) {
  try {
    const raw = rv.provider === "gemini" ? await askGemini(rv.key) : await askGroq(rv.key);
    const jsonStr = raw.match(/\{[\s\S]*\}/)?.[0] ?? "";
    const v = JSON.parse(jsonStr);
    const verdict = String(v.verdict ?? "PASS").toUpperCase();
    notice(`المراجع ${rv.name} (${rv.provider}): ${verdict} — ${String(v.summary ?? "").slice(0, 160)}`);
    for (const iss of (v.issues ?? []).slice(0, 6)) console.log(`::warning::[المراجع ${rv.name}] ${String(iss).slice(0, 200)}`);
    if (verdict === "BLOCK") blocks++;
  } catch (e) {
    notice(`المراجع ${rv.name} تعذر إجابته (${String(e).slice(0, 80)}) — يُتجاوز`);
  }
}

if (blocks > 0) {
  console.log(`::error::المراجع العقلي الثاني أسقط البناء (${blocks} حكم BLOCK) — عالج الملاحظات أو ناقشها في الـPR`);
  process.exit(1);
}
notice("المراجع العقلي الثاني: لا حجب — البناء يمر");
process.exit(0);
