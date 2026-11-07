/* بوابة سلوك الأسطول: سياسة الاستنفاد الشامل لكل مزود قبل الانتقال — تُحاكى بالكامل */
import { execSync } from "node:child_process";
import { unlinkSync } from "node:fs";
const hasLocal = (() => { try { execSync("test -x ./node_modules/.bin/esbuild", { stdio: "pipe" }); return true; } catch { return false; } })();
execSync(`${hasLocal ? "./node_modules/.bin/esbuild" : "npx --no-install esbuild"} src/agent.ts --bundle --format=esm --outfile=tests/.fleet.mjs --log-level=silent`, { stdio: "pipe" });
const { fleetChat } = await import("./.fleet.mjs");

let fails = 0;
const t = (n, c) => { console.log((c ? "✓" : "✗") + " " + n); if (!c) fails++; };

function mkEnv(keys, mode) {
  const store = new Map();
  const order = [];
  let groqCalls = 0;
  globalThis.fetch = async (url, opts) => {
    const g = /models\/([^:]+):generateContent/.exec(url);
    const model = g ? g[1] : JSON.parse(opts.body).model;
    const prov = url.includes("googleapis") ? "gemini" : url.includes("groq") ? "groq" : "openrouter";
    order.push(`${prov}:${model}`);
    const ok200 = (model) => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: `رد من ${model}` } }] }) });
    const dead = () => ({ ok: false, status: 429, json: async () => ({}) });
    if (mode === "gemini_dead_groq2") {
      if (prov === "gemini") return dead();
      if (model === "openai/gpt-oss-20b") return dead();       /* أول نموذج غروق ميت */
      return ok200(model);                                      /* ما بعده حي */
    }
    return dead(); /* all_dead */
  };
  return { env: { CACHE_KV: { get: async (k) => store.get(k), put: async (k, v) => store.set(k, v) }, AI_KEYS: keys }, order, store };
}
const KEYS = JSON.stringify({ gemini: [{ name: "a", key: "G1" }], groq: [{ name: "b", key: "Q1" }], openrouter: [{ name: "c", key: "O1" }] });
const TOTAL = 8 + 3 + 6; // 17 هدفاً

/* 1) جيمينا ميتة كلها → أول نموذج غروق ميت → الرد من الثاني — بلا قفز لأوبن راوتر */
const A = mkEnv(KEYS, "gemini_dead_groq2");
const r1 = await fleetChat(A.env, "sys", [{ role: "user", content: "مرحبا" }]);
t("الرد جاء من gpt-oss-120b (الثاني في غروق)", r1 === "رد من openai/gpt-oss-120b");
t("الاستنفاد: 8 جيمينا بالترتيب ثم 20b ميت ثم 120b حي", JSON.stringify(A.order) === JSON.stringify([
  "gemini:gemma-3-27b-it", "gemini:gemini-2.0-flash-lite", "gemini:gemini-2.0-flash", "gemini:gemini-3.5-flash-lite",
  "gemini:gemini-3.1-flash-lite", "gemini:gemini-3-flash-preview", "gemini:gemini-3.6-flash", "gemini:gemini-3.8-flash",
  "groq:openai/gpt-oss-20b", "groq:openai/gpt-oss-120b"]));

/* 2) موت كلي → handoff null بعد كل الـ17 بلا استثناء */
const B = mkEnv(KEYS, "all_dead");
const r2 = await fleetChat(B.env, "sys", [{ role: "user", content: "س" }]);
t("الموت الكلي يرجع null (handoff) بعد 17 هدفاً", r2 === null && B.order.length === TOTAL);

/* 3) النداء التالي على نفس البيئة يتخطى كل المبرَّد — صفر نداءات شبكة جديدة */
const r3 = await fleetChat(B.env, "sys", [{ role: "user", content: "س" }]);
t("التبريد يمنع كل نداءات الشبكة", r3 === null && B.order.length === TOTAL);

/* 4) انتهاء تبريد الهدف الأول فقط → يُعاد تجريبه وحده (يفشل ويبرَد من جديد) */
B.store.set("ai:cd:gemini:a:gemma-3-27b-it", String(Date.now() - 1));
const r4 = await fleetChat(B.env, "sys", [{ role: "user", content: "س" }]);
t("انتهاء التبريد يعيد الهدف وحده إلى الواجهة", r4 === null && B.order.length === TOTAL + 1 && B.order[TOTAL] === "gemini:gemma-3-27b-it");

/* 5) عزل المزود: مفاتيح غروق فقط → 3 نماذج بالترتيب ثم null */
const E = mkEnv(JSON.stringify({ groq: [{ name: "b", key: "Q1" }] }), "all_dead");
const r5 = await fleetChat(E.env, "sys", [{ role: "user", content: "س" }]);
t("عزل غروق: 3 نماذج بالترتيب ثم handoff", r5 === null && E.order.join() === "groq:openai/gpt-oss-20b,groq:openai/gpt-oss-120b,groq:qwen/qwen3.8-27b");

try { unlinkSync("tests/.fleet.mjs"); } catch {}
if (fails) { console.error(`فشل ${fails}`); process.exit(1); }
console.log("FLEET: سياسة الاستنفاد الشامل مطموعة");
