/* NEXUS reviewer-drill — حفر المراجع العقلي الثاني: هل يرفض فعلاً؟
   المرحلة 1 (حتمية بلا شبكة): اختبار أنابيب التحليل نفسها (المكتبة المشتركة مع بوابة CI).
   المرحلة 2 (حية عند توفر مفتاح reviewer): فرق يحوي ثغرات مزروعة عمداً — والمراجع يجب أن يحكم BLOCK.
   أي مراجع يمرّ على الثغرة المزروعة = فشل الحفر (بطلان دليل الرفض لهذا المزود). */
import { parseReviewers, extractVerdict, REVIEW_PROMPT } from "../../.github/scripts/review-lib.mjs";

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => { if (cond) { pass++; console.log("✓ " + name); } else { fail++; console.log("✗ " + name + (detail ? " — " + detail : "")); } };

/* ─── المرحلة 1: أنابيب التحليل (نفس ما تشغله بوابة CI) ─── */
{
  const rs = parseReviewers("gemini1=AIzaAAA\ngrok=gsk_BBB\nreviewer=AIzaCCC\nreviewer-groq=gsk_DDD\nopenrouter1=sk-or-v1-EEE");
  ok("استخراج المراجع: اثنان فقط من الخمسة (تجاهل الأسطول غير المراجع)", rs.length === 2 && rs[0].provider === "gemini" && rs[1].provider === "groq", JSON.stringify(rs.map((r) => r.name)));
  const rsJson = parseReviewers(JSON.stringify({ reviewer: "AIzaZZZ", "reviewer-2": "gsk_YYY", gemini: "AIzaQQQ" }));
  ok("استخراج المراجع من صيغة JSON", rsJson.length === 2 && rsJson.every((r) => r.key.startsWith(("AIza" + "gsk_").slice(0, 4)) || r.key.startsWith("gsk_")));
  ok("بلا مفاتيح → قائمة فارغة لا انهيار", parseReviewers("").length === 0 && parseReviewers("bogus").length === 0);

  ok("استخراج الحكم: JSON عارٍ → BLOCK", extractVerdict('{"verdict":"BLOCK","issues":["x"],"summary":"s"}')?.verdict === "BLOCK");
  ok("استخراج الحكم: JSON مدفون داخل كلام → BLOCK", extractVerdict('هذا تقييمي:\n```json\n{"verdict":"BLOCK","issues":[],"summary":"تسريب مفتاح"}\n```')?.verdict === "BLOCK");
  ok("استخراج الحكم: إجابة خربشة → null (تُحتسب فشلاً لا تجاوزاً)", extractVerdict("لا أعرف ماذا أفعل") === null);
  ok("استخراج الحكم: PASS صريح", extractVerdict('{"verdict":"pass","issues":[],"summary":""}')?.verdict === "PASS");
}

/* ─── المرحلة 2: الثغرات المزروعة والرفض المطلوب ─── */
const GUILTY_DIFF = `diff --git a/nexus/src/temp-feature.ts b/nexus/src/temp-feature.ts
new file mode 100644
--- /dev/null
+++ b/nexus/src/temp-feature.ts
@@ -0,0 +1,9 @@
+// خاصية سريعة لتحسين التسجيل (مراجعة مطلوبة)
+const GEMINI_KEY = "AIzaSyC-DrillFake-Key-0123456789abcdefGHI";
+const ADMIN_PASS = "Owner-P@ss-Drill-2026";
+
+export async function findUser(env, email) {
+  const rows = await env.DB.prepare("SELECT * FROM users WHERE email = '" + email + "'").all();
+  console.log("login attempt:", email, "password:", ADMIN_PASS);
+  return rows[0];
+}
`;

const askGemini = async (key) => {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: REVIEW_PROMPT(GUILTY_DIFF) }] }], generationConfig: { temperature: 0.2 } }),
    signal: AbortSignal.timeout(30000),
  });
  return (await r.json())?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
};
const askGroq = async (key) => {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", temperature: 0.2, messages: [{ role: "user", content: REVIEW_PROMPT(GUILTY_DIFF) }] }),
    signal: AbortSignal.timeout(30000),
  });
  return (await r.json())?.choices?.[0]?.message?.content ?? "";
};

const reviewers = parseReviewers(process.env.AI_KEYS ?? "");
if (!reviewers.length) {
  console.log("— المرحلة 2 متخطاة: لا مفتاح reviewer في البيئة (على CI عند توفر المفتاح تعمل حية وتثبت الرفض) —");
} else {
  for (const rv of reviewers) {
    try {
      const raw = rv.provider === "gemini" ? await askGemini(rv.key) : await askGroq(rv.key);
      const v = extractVerdict(raw);
      const refused = v?.verdict === "BLOCK";
      ok(`حفر الرفض [${rv.name}/${rv.provider}]: رفض الثغرة المزروعة`, refused, refused ? v.summary.slice(0, 140) : "أجاب: " + (v?.verdict ?? "غير قابل للتحليل"));
      if (refused) console.log(`   ↳ ذكر الملاحظة المفتاحية: ${(v.issues.join(" | ") || v.summary).slice(0, 200)}`);
    } catch (e) {
      ok(`حفر الرفض [${rv.name}/${rv.provider}]`, false, "تعذر الاتصال: " + String(e).slice(0, 80));
    }
  }
}

console.log(`\n═══ NEXUS reviewer-drill: ${pass}/${pass + fail} ═══`);
process.exit(fail ? 1 : 0);
