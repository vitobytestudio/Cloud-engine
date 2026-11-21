/* بوابة AS2 PORTAL — اختبارات الوكيل والـ API (تعمل بمحرك Node مباشرة على معالج العامل) */
import worker, { KB, CHIP_IDS, FREE_MODELS, matchIntent } from "../src/worker.js";

const env = { OPENROUTER_API_KEY: "" };
const ctx = { waitUntil() {}, passThroughOnException() {} };
const call = (path, init) => worker.fetch(new Request("https://portal.test" + path, init), env, ctx);

let pass = 0;
let fail = 0;
const G = (name, cond, extra) => {
  if (cond) {
    pass++;
    console.log("  ✓ " + name);
  } else {
    fail++;
    console.log("  ✗ " + name + (extra !== undefined ? " — " + JSON.stringify(extra).slice(0, 300) : ""));
  }
};

const j = async (r) => {
  try {
    return await r.json();
  } catch {
    return {};
  }
};

console.log("— الصحة —");
{
  const r = await call("/api/health");
  const d = await j(r);
  G("health 200", r.status === 200);
  G("ok:true", d.ok === true);
  G("app=as2-portal", d.app === "as2-portal");
  G("نمط الوكيل kb+llm", d.agent === "kb+llm");
}

console.log("— الوكيل (KB) عبر GET —");
{
  const d = await j(await call("/api/chat?q=" + encodeURIComponent("مرحبا") + "&lang=ar"));
  G("تحية: ok", d.ok === true && d.mode === "kb");
  G("تحية: نية greeting", d.intent === "greeting");
  G("تحية: عربية وفقيرة", typeof d.text === "string" && d.text.length > 100);
  G("تحية: شرائح صالحة", Array.isArray(d.chips) && d.chips.length > 0 && d.chips.every((c) => typeof c === "string"));
}
{
  const d = await j(await call("/api/chat?q=" + encodeURIComponent("ما هي Alignerr؟") + "&lang=ar"));
  G("نية alignerr_what", d.intent === "alignerr_what");
  G("ذكر Labelbox", d.text.includes("Labelbox"));
  G("ذكر الأجر", d.text.includes("15") && d.text.includes("150"));
}
{
  const d = await j(await call("/api/chat?q=" + encodeURIComponent("كيف اسجل في alignerr") + "&lang=ar"));
  G("نية alignerr_signup", d.intent === "alignerr_signup");
  G("خطوات التسجيل 7", d.text.includes("7 خطوات"));
  G("ذكر Persona وZara", d.text.includes("Persona") && d.text.includes("Zara"));
}
{
  const d = await j(await call("/api/chat?q=" + encodeURIComponent("كيف اسجل في الـOutlier بالخطوات") + "&lang=ar"));
  G("نية outlier_signup رغم «الـ»", d.intent === "outlier_signup");
  G("خطوات 5 + Veriff", d.text.includes("5 خطوات") && d.text.includes("Veriff"));
}
{
  const d = await j(await call("/api/chat?q=" + encodeURIComponent("how do i register on outlier") + "&lang=en"));
  G("نية outlier_signup بالإنكليزية", d.intent === "outlier_signup");
  G("مردود إنكليزي", d.text.includes("outlier.ai") && !d.text.includes("خارطة"));
}
{
  const d = await j(await call("/api/chat?q=" + encodeURIComponent("what is alignerr") + "&lang=en"));
  G("what-is بالإنكليزية", d.intent === "alignerr_what" && d.text.includes("Labelbox"));
}
{
  const d = await j(await call("/api/chat?q=" + encodeURIComponent("كيف ينجح قبول ملفي") + "&lang=ar"));
  G("نية acceptance", d.intent === "acceptance");
  G("قواعد القبول ذكرت الإنجليزية والجودة", d.text.includes("إنجليزية") && d.text.includes("80%"));
}
{
  const d = await j(await call("/api/chat?q=" + encodeURIComponent("كم الأجر في المهام") + "&lang=ar"));
  G("نية pay", d.intent === "pay");
  G("جدول الأجر", d.text.includes("150") && d.text.includes("STEM"));
}
{
  const d = await j(await call("/api/chat?q=" + encodeURIComponent("كيف استلم الدفع paypal") + "&lang=ar"));
  G("نية payout", d.intent === "payout");
  G("قنوات الدفع", d.text.includes("Stripe") && d.text.includes("AirTM"));
}
{
  const d = await j(await call("/api/chat?q=" + encodeURIComponent("المهام عالية القيمة والدفع") + "&lang=ar"));
  G("نية high_value", d.intent === "high_value");
  G("استراتيجية المهام", d.text.includes("80%") && d.text.includes("Connect"));
}
{
  const d = await j(await call("/api/chat?q=" + encodeURIComponent("مسابقات الحاسوب وCTF") + "&lang=ar"));
  G("نية competitions", d.intent === "competitions");
  G("ذكر ICPC وHackerOne", d.text.includes("ICPC") && d.text.includes("HackerOne"));
}
{
  const d = await j(await call("/api/chat?q=" + encodeURIComponent("دعم فريق AS2 واتساب") + "&lang=ar"));
  G("نية as2_support", d.intent === "as2_support");
  G("واتساب الاستوديو", d.text.includes("0777 84 56 35"));
}
{
  const d = await j(await call("/api/chat?q=" + encodeURIComponent("كم يستغرق القبول") + "&lang=ar"));
  G("نية timeline", d.intent === "timeline");
  G("توقيت واقعي", d.text.includes("أسابيع") || d.text.includes("weeks"));
}
{
  const d = await j(await call("/api/chat?q=" + encodeURIComponent("الوثائق المطلوبة والتحقق من الهوية") + "&lang=ar"));
  G("نية documents", d.intent === "documents");
  G("ذكر الهوية والسيرة", d.text.includes("هوية") && d.text.includes("سيرة"));
}
{
  const d = await j(await call("/api/chat?q=" + encodeURIComponent("كل مهامك قليلة والرفض حصل") + "&lang=ar"));
  G("نية problems", d.intent === "problems");
}
{
  const d = await j(await call("/api/chat?q=" + encodeURIComponent("qwzx blorptastic gibberish") ));
  G("سقوط آمن على fallback", d.ok === true && d.intent === "fallback" && d.chips.length > 0);
}

console.log("— سلامة قاعدة المعرفة كاملة —");
{
  for (const it of KB) {
    G("[" + it.id + "] مردود عربي فقير", typeof it.ar === "string" && it.ar.length >= 150, it.ar?.length);
    G("[" + it.id + "] مردود إنكليزي فقير", typeof it.en === "string" && it.en.length >= 150, it.en?.length);
    G(
      "[" + it.id + "] شرائح صالحة",
      Array.isArray(it.chips) && it.chips.every((c) => CHIP_IDS.has(c) && KB.some((x) => x.id === c)),
      it.chips
    );
    if (it.kw.length > 0) {
      const probe = it.kw[0] + (it.boost && it.boost.length ? " " + it.boost[0] : "");
      const hit = matchIntent(probe);
      G("[" + it.id + "] يُلتقط بعيّنة («" + probe.slice(0, 40) + "»)", hit && hit.id === it.id, hit?.id);
    }
  }
}

console.log("— POST —");
{
  const r = await call("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q: "كيف اسجل في alignerr", lang: "ar" }) });
  const d = await j(r);
  G("POST KB يعمل", r.status === 200 && d.ok === true && d.mode === "kb" && d.intent === "alignerr_signup");
}
{
  const r = await call("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q: "hi", lang: "en", key: "sk-or-user-tried-key-drill" }) });
  const d = await j(r);
  G("سياسة النماذج: مفتاح المستخدم يُتجاهل → KB", r.status === 200 && d.ok === true && d.mode === "kb");
  G("لا تسرّب مفتاح المستخدم أبداً", !JSON.stringify(d).includes("sk-or-user"));
}
{
  G("سياسة النماذج: قائمة مجانية ≥ 3", Array.isArray(FREE_MODELS) && FREE_MODELS.length >= 3, FREE_MODELS?.length);
  G("سياسة النماذج: كلها :free بلا استثناء", FREE_MODELS.every((m) => m.endsWith(":free")), FREE_MODELS);
  G("سياسة النماذج: لا تكرار", new Set(FREE_MODELS).size === FREE_MODELS.length);
}
{
  const r = await call("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({}) });
  G("POST بلا سؤال → 400", r.status === 400);
}
{
  const r = await call("/api/chat", { method: "DELETE" });
  G("طريقة غير مسموحة → 405", r.status === 405);
}
{
  const r = await call("/api/unknown");
  G("مسار مجهول → 404", r.status === 404);
}
{
  const r = await call("/api/chat?q=" + encodeURIComponent("a".repeat(2500)), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q: "b".repeat(2500) }) });
  G("سؤال مفرط الطول → 413", r.status === 413);
}

console.log("— تاريخ المحادثة في وضع الحي (يُبنى بدون أخطاء) —");
{
  const r = await call("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ q: "وماذا عن الدفع؟", lang: "ar", history: [{ role: "user", content: "مرحبا" }, { role: "assistant", content: "أهلاً" }, { role: "hacker", content: "bad" }] }),
  });
  const d = await j(r);
  G("تاريخ مشوّه لا يكسر الرد", r.status === 200 && d.ok === true && d.text.length > 50);
}

console.log("— حد المعدل —");
{
  let got429 = false;
  for (let i = 0; i < 70; i++) {
    const r = await call("/api/chat?q=t" + i);
    if (r.status === 429) {
      got429 = true;
      break;
    }
  }
  G("تجاوز الحد → 429", got429);
}

console.log("\nالبوابة: نجح " + pass + " — فشل " + fail);
process.exit(fail ? 1 : 0);
