// ——— NEXUS Agent: أسطول المزودات المجانية بسلسلة التناوب ودفتر الصحة ———
import type { Env, Plan } from "./env";

export const PLAN_QUOTA: Record<Plan, number> = { free: 15, pro: 300, vip: 1000 };
export const PLAN_PRODUCTS: Record<Plan, number> = { free: 3, pro: 10, vip: 30 };

type Provider = "gemini" | "groq" | "openrouter";
type Cred = { name: string; key: string };
type Target = { p: Provider; acct: string; key: string; model: string };

/* سياسة المالك المقفلة: لا انتقال لمزود تالٍ إلا بعد استنفاد كل نماذجه المجانية
   (كل حساب × كل نموذج بالترتيب) — والتوسيع من الكتالوج الرسمي docs/ai-fleet.md */
const GEMINI_MODELS = [
  "gemma-3-27b-it", "gemini-2.0-flash-lite", "gemini-2.0-flash", "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite", "gemini-3-flash-preview", "gemini-3.6-flash", "gemini-3.8-flash",
];
const GROQ_MODELS = ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.8-27b"]; /* كل المجاني في غروق */
const OPENROUTER_MODELS = [
  "openrouter/free", "openai/gpt-oss-120b:free", "openai/gpt-oss-20b:free", "google/gemma-3-27b-it:free",
  "qwen/qwen3-235b-a22b:free", "meta-llama/llama-3.3-70b-instruct:free",
];

export function parseFleet(raw: string | undefined): Target[] {
  if (!raw) return [];
  const out: Target[] = [];
  const seen = new Set<string>();
  const push = (p: Provider, cred: Cred, models: string[]) => {
    const k = (cred?.key || "").trim();
    if (!k || seen.has(`${p}:${k}`)) return;
    seen.add(`${p}:${k}`);
    for (const m of models) out.push({ p, acct: cred.name || p, key: k, model: m });
  };
  /* الماسح الخام أولاً: مفاتيح عارية أو قوائم نصية بأي صيغة — بلا حاجة إلى JSON أصلاً */
  const grab = (re: RegExp, p: Provider, models: string[]) => {
    /* بصمة المفتاح اسم الحساب — مفتاح ميت لا يقتل أخوته أبداً */
    for (const m of raw.matchAll(new RegExp(re.source, "g"))) push(p, { name: "raw-" + m[0].slice(-6), key: m[0] }, models);
  };
  grab(/AIza[A-Za-z0-9_-]{30,}/, "gemini", GEMINI_MODELS);
  grab(/AQ[A-Za-z0-9._-]{30,}/, "gemini", GEMINI_MODELS);          /* صيغة جوجل الجديدة */
  grab(/gsk_[A-Za-z0-9]{20,}/, "groq", GROQ_MODELS);
  grab(/sk-or-[A-Za-z0-9_-]{20,}/, "openrouter", OPENROUTER_MODELS); /* كل صيغ sk-or */
  /* احتياط: مفتاح sk- عاري طويل بلا تصنيف أدق → أوبن راوتر (قرار المالك) */
  if (!out.some((t) => t.p === "openrouter")) {
    for (const m of raw.matchAll(/sk-[A-Za-z0-9_-]{30,}/g)) { push("openrouter", { name: "raw-" + m[0].slice(-6), key: m[0] }, OPENROUTER_MODELS); break; }
  }
  const creds = (v: unknown): Cred[] => {
    if (typeof v === "string") return [{ name: "acc", key: v }];
    if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? { name: "acc", key: x } : { name: String(x?.name ?? "acc"), key: String(x?.key ?? x?.api_token ?? x?.token ?? "") }));
    if (v && typeof v === "object") return [{ name: String((v as any).name ?? "acc"), key: String((v as any).key ?? (v as any).api_token ?? "") }];
    return [];
  };
  try {
    let j: any = JSON.parse(raw);
    if (typeof j === "string") j = { gemini: j };
    const flatKey = (base: string) => {
      for (const k of Object.keys(j)) {
        const kl = k.toLowerCase();
        if (kl.includes(base) && (kl.includes("key") || kl.includes("token")) && typeof j[k] === "string" && j[k].length > 10)
          return [{ name: k, key: j[k] }];
      }
      return [];
    };
    const all = (...cs: Cred[][]): Cred[] => cs.find((c) => c.length) ?? [];
    const gms = all(creds(j.gemini), creds(j.Gemini), creds(j.GEMINI), flatKey("gemini"), flatKey("google"));
    const gqs = all(creds(j.groq), creds(j.Groq), creds(j.GROQ), flatKey("groq"));
    const ors = all(creds(j.openrouter), creds(j.OpenRouter), creds(j.OPENROUTER), flatKey("openrouter"));
    for (const c of gms) push("gemini", c, GEMINI_MODELS);
    for (const c of gqs) push("groq", c, GROQ_MODELS);
    for (const c of ors) push("openrouter", c, OPENROUTER_MODELS);
    /* الماسح الشامل: تعرف بمسماك المفتاح أينما كان — AIza=gemini، gsk_=groq، sk-or-v1-=openrouter */
    const scan = (v: unknown) => {
      if (typeof v === "string") {
        const k = v.trim();
        if (k.startsWith("AIza") && !out.some((t) => t.p === "gemini")) push("gemini", { name: "scan", key: k }, GEMINI_MODELS);
        else if (k.startsWith("gsk_") && !out.some((t) => t.p === "groq")) push("groq", { name: "scan", key: k }, GROQ_MODELS);
        else if (k.startsWith("sk-or-v1-") && !out.some((t) => t.p === "openrouter")) push("openrouter", { name: "scan", key: k }, OPENROUTER_MODELS);
      } else if (Array.isArray(v)) v.forEach(scan);
      else if (v && typeof v === "object") Object.values(v as Record<string, unknown>).forEach(scan);
    };
    scan(j);
  } catch {}
  return out;
}

const DAY_S = 86400;
const COOLDOWN_MS = 10 * 60_000;
const MODEL_DEAD_MS = 60 * 60_000;
const KEY_DEAD_MS = 24 * 60 * 60_000;
const CALL_TIMEOUT_MS = 15_000;
const timeoutOf = (env: unknown) => { const v = Number((env as { AI_TIMEOUT_MS?: number })?.AI_TIMEOUT_MS); return Number.isFinite(v) && v > 0 ? v : CALL_TIMEOUT_MS; };

export const cooldownCount = async (env: Env): Promise<number> => {
  const { keys } = await env.CACHE_KV.list({ prefix: "ai:cd:" });
  const now = Date.now();
  let n = 0;
  for (const k of keys) {
    const v = await env.CACHE_KV.get(k.name);
    if (v && Number(v) > now) n++;
  }
  return n;
};

async function healthy(env: Env, t: Target): Promise<boolean> {
  const cd = await env.CACHE_KV.get(`ai:cd:${t.p}:${t.acct}:${t.model}`);
  if (cd && Number(cd) > Date.now()) return false;
  const kd = await env.CACHE_KV.get(`ai:kd:${t.p}:${t.acct}`);
  if (kd && Number(kd) > Date.now()) return false;
  return true;
}
async function markFail(env: Env, t: Target, err: string): Promise<void> {
  /* التصنيف: مفتاح مرفوض (401/403) يبرّد الحساب كله 24 ساعة — لا حرق باقي نماذجه بلا فائدة.
     نموذج غير موجود (404) ساعة. ضغط أو خادم مزود عشر دقائق. */
  if (/:(401|403)$/.test(err)) {
    await env.CACHE_KV.put(`ai:kd:${t.p}:${t.acct}`, String(Date.now() + KEY_DEAD_MS), { expirationTtl: DAY_S });
    return;
  }
  const ttl = /:404$/.test(err) ? MODEL_DEAD_MS : COOLDOWN_MS;
  const k = `ai:cd:${t.p}:${t.acct}:${t.model}`;
  await env.CACHE_KV.put(k, String(Date.now() + ttl), { expirationTtl: DAY_S });
}

export type Msg = { role: "user" | "assistant"; content: string };

async function callGemini(env: unknown, t: Target, sys: string, msgs: Msg[]): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${t.model}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": t.key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sys }] },
        contents: msgs.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
      }),
      signal: AbortSignal.timeout(timeoutOf(env)),
    }
  );
  if (!res.ok) throw new Error(`gemini:${res.status}`);
  const j = (await res.json()) as any;
  const text = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
  if (!text) throw new Error("gemini:empty");
  return text;
}

async function callOpenAIish(env: unknown, url: string, t: Target, sys: string, msgs: Msg[]): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${t.key}` },
    body: JSON.stringify({
      model: t.model,
      messages: [{ role: "system", content: sys }, ...msgs],
      max_tokens: 400,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(timeoutOf(env)),
  });
  if (!res.ok) throw new Error(`${t.p}:${res.status}`);
  const j = (await res.json()) as any;
  const text = j?.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error(`${t.p}:empty`);
  return text;
}

/** يجرّب السلسلة بالترتيب: صحي أولاً (gemma ثم الفلاشات) ثم غروق ثم أوبنروتر — وأي 429 يبرّد نموذجه */
export async function fleetChat(env: Env, sys: string, msgs: Msg[]): Promise<string | null> {
  /* الاستنفاد الشامل: الأهداف مرتبة بكتل المزودات (gemini كاملاً ثم groq كاملاً ثم openrouter كاملاً)،
     وكل فشل يبرّد هدفه وحده وينتقل للتالي — فلا يُقصد المزود التالي إلا بعد موت كل سابقه. */
  for (const t of parseFleet(env.AI_KEYS)) {
    if (!(await healthy(env, t))) continue;
    try {
      if (t.p === "gemini") return await callGemini(env, t, sys, msgs);
      if (t.p === "groq") return await callOpenAIish(env, "https://api.groq.com/openai/v1/chat/completions", t, sys, msgs);
      return await callOpenAIish(env, "https://openrouter.ai/api/v1/chat/completions", t, sys, msgs);
    } catch (e) {
      const msg = String((e as Error)?.message || e);
      await markFail(env, t, /:(\d{3})$/.test(msg) ? msg : `${t.p}:599`); /* 599 = مهلة/شبكة */
    }
  }
  return null;
}

export function buildSystemPrompt(storeName: string, products: { title: string; price: number; descr: string }[], lang: string): string {
  const lines = products.map((p) => `- ${p.title} | ${p.price} DZD | ${(p.descr || "").slice(0, 140)}`).join("\n");
  const ar = `أنت وكيل الرد الذكي لمتجر "${storeName}" على منصة NEXUS الجزائرية. تجيب بالدارجة الجزائرية اللطيفة والقصيرة (سطرين إلى أربعة).
قواعدك الصارمة:
1. تعتمد حصراً على معلومات المنتجات التالية — لا تخترع منتجات أو أسعاراً غير موجودة.
2. لا تجمع أبداً اسم الزبون أو رقم هاتفه أو عنوانه في المحادثة — إذا أراد الشراء وجّهه بلطف لزر "اطلب الآن" واستمارة الطلب.
3. إن سُئلت عن توصيل أو دفع: الدفع عند الاستلام لكل ولايات الجزائر، والتوصيل منزلي أو مكتب.
4. إن لم تعرف الجواب قل بصدق إنك ستنقل السؤال للتاجر.
5. لا تقدم أي معلومة خارج موضوع المتجر.

المنتجات المتوفرة:
${lines || "(لا منتجات حالياً)"}`;
  const en = `You are the AI sales assistant for the store "${storeName}" on NEXUS (Algeria). Reply briefly and warmly in the customer's language (Algerian Darija by default). Rules: use ONLY the products below, never invent products/prices; never ask for or collect personal data (name/phone/address) — direct buyers to the order form; delivery is cash-on-delivery nationwide with home or desk options; if unsure, say the merchant will follow up. Keep replies to 2-4 lines.

Products:
${lines || "(none yet)"}`;
  return lang === "en" ? en : ar;
}
