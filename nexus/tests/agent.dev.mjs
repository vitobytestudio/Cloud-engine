/* NEXUS AGENT GATE — أسطول الذكاء بمزودات مزيّفة: الدوران، البرود المصنَّف، المهلة، والتوثيق بالترويسة */
import { parseFleet, fleetChat, buildSystemPrompt, cooldownCount } from "./_agent.mjs";

let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => {
  if (cond) { pass++; console.log("✓ " + name); }
  else { fail++; console.log("✗ " + name + (extra ? " — " + extra : "")); }
};

const envKV = () => {
  const m = new Map();
  return {
    get: async (k) => m.get(k) ?? null,
    put: async (k, v) => { m.set(k, v); },
    delete: async (k) => { m.delete(k); },
    list: async (o) => ({ keys: [...m.keys()].filter((k) => k.startsWith(o.prefix)).map((name) => ({ name })) }),
    _m: m,
  };
};

const GEM = "AIza" + "A".repeat(35);
const GEM2 = "AQ" + "B".repeat(40);
const GRO = "gsk_" + "c".repeat(25);
const OR = "sk-or-v1-" + "d".repeat(30);

const AI_KEYS = JSON.stringify({ gemini: [{ name: "g1", key: GEM }, { name: "g2", key: GEM2 }], groq: [{ name: "q1", key: GRO }], openrouter: [{ name: "o1", key: OR }] });

/* ─── 1) المحلل ─── */
{
  const f = parseFleet(AI_KEYS);
  ok("المحلل: 4 حسابات × كتالوجاتها", f.length === 8 + 8 + 3 + 6, `got=${f.length}`);
  ok("المحلل: صيغة AQ تُعرف gemini", f.filter((t) => t.p === "gemini").some((t) => t.key === GEM2));
  const raw = parseFleet(`${GEM} ${GRO} ${OR}`);
  ok("المحلل: الماسح الخام بلا JSON", raw.length === 8 + 3 + 6, `got=${raw.length}`);
  ok("المحلل: كتالوج أوبنراوتر كله ببادئة المصنّع أو الموجّه الرسمي", parseFleet("sk-or-v1-" + "x".repeat(30)).filter((t) => t.p === "openrouter").every((t) => /^[a-z0-9-]+\/[a-z0-9.+-]+(:free)?$|^openrouter\/free$/.test(t.model)), parseFleet("sk-or-v1-" + "x".repeat(30)).map((t) => t.model).join(","));
}

/* ─── 2) الدوران والتوثيق بالترويسة ─── */
{
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), headers: init.headers });
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "جواب الأسطول" }] } }] }), { status: 200 });
  };
  const env = { AI_KEYS, CACHE_KV: envKV() };
  const reply = await fleetChat(env, "نظام", [{ role: "user", content: "سلام" }]);
  ok("الأسطول يجيب من أول هدف حي", reply === "جواب الأسطول");
  ok("جوجل بترويسة x-goog-api-key لا بالرابط", calls[0].headers["x-goog-api-key"] === GEM && !calls[0].url.includes("key="));
  globalThis.fetch = realFetch;
}

/* ─── 3) البرود المصنَّف: مفتاح مرفوض 401 يبرّد حسابه كله ─── */
{
  const kv = envKV();
  const realFetch = globalThis.fetch;
  let n = 0;
  globalThis.fetch = async () => {
    n++;
    return new Response(JSON.stringify({ error: { message: "bad key" } }), { status: 401 });
  };
  const env = { AI_KEYS, CACHE_KV: kv };
  const r = await fleetChat(env, "نظام", [{ role: "user", content: "سلام" }]);
  ok("سلسلة مفاتيح ميتة تعيد null (التسليم للتاجر)", r === null);
  ok("مفتاح 401 يحترق بنداء واحد لا بكل نماذجه", n === 4, `calls=${n} (الحساب الواحد نداء واحد)`); /* 2 gemini + 1 groq + 1 openrouter */
  ok("برود المفتاح الميت 24 ساعة مسجّل", [...kv._m.keys()].filter((k) => k.startsWith("ai:kd:")).length === 4);
  globalThis.fetch = realFetch;
}

/* ─── 4) 429 يبرّد النموذج وحده وينتقل للتالي ─── */
{
  const kv = envKV();
  const realFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls++;
    if (String(url).includes("gemma-3-27b-it")) return new Response("{}", { status: 429 });
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "من الثاني" }] } }] }), { status: 200 });
  };
  const env = { AI_KEYS: JSON.stringify({ gemini: [{ name: "g1", key: GEM }] }), CACHE_KV: kv };
  const r = await fleetChat(env, "نظام", [{ role: "user", content: "سلام" }]);
  ok("الضغط 429 ينقل للنموذج التالي فيجيب", r === "من الثاني" && calls === 2, `calls=${calls}`);
  ok("النموذج المضغوط مبرَّد عشر دقائق", [...kv._m.keys()].some((k) => k.startsWith("ai:cd:")));
  globalThis.fetch = realFetch;
}

/* ─── 5) المهلة: مزود معلّق لا يخنق الزبون ─── */
{
  const kv = envKV();
  const realFetch = globalThis.fetch;
  globalThis.fetch = (_url, init) => new Promise((_res, rej) => {
    init.signal.addEventListener("abort", () => rej(new Error("TimeoutError")));
  });
  const env = { AI_KEYS: JSON.stringify({ gemini: [{ name: "g1", key: GEM }] }), CACHE_KV: kv, AI_TIMEOUT_MS: 120 };
  const keep = setTimeout(() => {}, 3000); /* يحبب الحلقة حتى تنطلق مهلة الإجهاض في بيئة الاختبار */
  const t0 = Date.now();
  const r = await fleetChat(env, "نظام", [{ role: "user", content: "سلام" }]);
  const dt = Date.now() - t0;
  clearTimeout(keep);
  ok("المعلّق يُقطع بالمهلة ويعيد null", r === null && dt < 2000, `dt=${dt}ms`);
  globalThis.fetch = realFetch;
}

/* ─── 6) الصحة ─── */
{
  const kv = envKV();
  await kv.put("ai:cd:gemini:g1:m", String(Date.now() + 60000));
  await kv.put("ai:kd:groq:q1", String(Date.now() + 60000));
  const n = await cooldownCount({ CACHE_KV: kv });
  ok("عداد الصحة يحسب المبرَّد", n === 1, `got=${n}`);
  ok("نظام البذرة يُبنى بالعربية والمنتجات", buildSystemPrompt("متجر", [{ title: "حذاء", price: 8900, descr: "" }], "ar").includes("حذاء"));
}

console.log(fail === 0 ? `═══ NEXUS AGENT GATE: ${pass}/${pass + fail} ═══` : `═══ NEXUS AGENT GATE: ${pass}/${pass + fail} — فشل! ═══`);
process.exit(fail === 0 ? 0 : 1);
