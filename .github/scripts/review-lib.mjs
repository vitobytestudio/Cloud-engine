/* مكتبة المراجع المشتركة — يستعملها بوابة المراجعة وحفر الرفض معاً (مصدر واحد للحقيقة) */
export function parseReviewers(keysEnv) {
  const out = [];
  const src = String(keysEnv ?? "");
  const t = src.trim();
  let pairs = [];
  if (t.startsWith("{")) {
    try {
      pairs = Object.entries(JSON.parse(t)).filter(([, v]) => typeof v === "string");
    } catch { pairs = []; }
  } else {
    pairs = src
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => { const eq = l.indexOf("="); return eq > 0 ? [l.slice(0, eq).trim(), l.slice(eq + 1).trim()] : null; })
      .filter(Boolean);
  }
  for (const [name, key] of pairs) {
    if (!/^reviewer/i.test(name) || !key) continue;
    const provider = key.startsWith("AIza") ? "gemini" : key.startsWith("gsk_") ? "groq" : null;
    if (provider) out.push({ name, provider, key });
  }
  return out;
}

export function extractVerdict(raw) {
  const jsonStr = String(raw ?? "").match(/\{[\s\S]*\}/)?.[0] ?? "";
  if (!jsonStr) return null;
  try {
    const v = JSON.parse(jsonStr);
    return {
      verdict: String(v.verdict ?? "PASS").toUpperCase(),
      issues: Array.isArray(v.issues) ? v.issues : [],
      summary: String(v.summary ?? ""),
    };
  } catch {
    return null;
  }
}

export const REVIEW_PROMPT = (diff) => `أنت مراجع كود عدائي مستقل (Senior Security & Code Reviewer) — لم تكتب هذا الكود وهدفك إيجاد عيبه.
راجع الفرق التالي (منصة تجارة حقيقية على Cloudflare Workers: D1 + KV):
1. الأمن أولاً: حقن SQL، تجاوز تصريح/ملكية، CSRF، تسريب أسرار، مسارات غير آمنة.
2. أخطاء المنطق وعقود الواجهة والتخزين، وفقدان بيانات محتمل.
3. تجاهل الأسلوب الجمالي — لا تحسبه عيباً.
أجب بـ JSON فقط بلا أي نص آخر:
{"verdict":"PASS"|"BLOCK","issues":["..."],"summary":"سطر واحد"}
استعمل BLOCK فقط عند خلل حقيقي (أمني أو منطقي أو فقد بيانات) — لا لمجرد ذوق.

الفرق:
${diff}`;
