// ——— NEXUS Agent: أسطول المزودات المجانية بسلسلة التناوب ودفتر الصحة ———
import type { Env, Plan } from "./env";

export const PLAN_QUOTA: Record<Plan, number> = { free: 15, pro: 300, vip: 1000 };
export const PLAN_PRODUCTS: Record<Plan, number> = { free: 3, pro: 10, vip: 30 };

type Provider = "gemini" | "groq" | "openrouter";
type Cred = { name: string; key: string };
type Target = { p: Provider; acct: string; key: string; model: string };

const GEMINI_MODELS = ["gemma-3-27b-it", "gemini-2.0-flash-lite", "gemini-2.0-flash", "gemini-3.5-flash-lite"];
const GROQ_MODELS = ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.8-27b"];
const OPENROUTER_MODELS = ["openrouter/free"];

export function parseFleet(raw: string | undefined): Target[] {
  if (!raw) return [];
  const out: Target[] = [];
  try {
    const j = JSON.parse(raw) as Record<string, Cred[]>;
    for (const c of j.gemini ?? []) for (const m of GEMINI_MODELS) out.push({ p: "gemini", acct: c.name, key: c.key, model: m });
    for (const c of j.groq ?? []) for (const m of GROQ_MODELS) out.push({ p: "groq", acct: c.name, key: c.key, model: m });
    for (const c of j.openrouter ?? []) for (const m of OPENROUTER_MODELS) out.push({ p: "openrouter", acct: c.name, key: c.key, model: m });
  } catch {}
  return out;
}

const DAY_S = 86400;
const COOLDOWN_MS = 10 * 60_000;

async function healthy(env: Env, t: Target): Promise<boolean> {
  const cd = await env.CACHE_KV.get(`ai:cd:${t.p}:${t.acct}:${t.model}`);
  return !(cd && Number(cd) > Date.now());
}
async function markFail(env: Env, t: Target): Promise<void> {
  const k = `ai:cd:${t.p}:${t.acct}:${t.model}`;
  const n = Number((await env.CACHE_KV.get(k)) ?? "0") + 1;
  await env.CACHE_KV.put(k, String(Date.now() + COOLDOWN_MS), { expirationTtl: DAY_S });
}

export type Msg = { role: "user" | "assistant"; content: string };

async function callGemini(t: Target, sys: string, msgs: Msg[]): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${t.model}:generateContent?key=${t.key}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sys }] },
        contents: msgs.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
      }),
    }
  );
  if (!res.ok) throw new Error(`gemini:${res.status}`);
  const j = (await res.json()) as any;
  const text = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
  if (!text) throw new Error("gemini:empty");
  return text;
}

async function callOpenAIish(url: string, t: Target, sys: string, msgs: Msg[]): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${t.key}` },
    body: JSON.stringify({
      model: t.model,
      messages: [{ role: "system", content: sys }, ...msgs],
      max_tokens: 400,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`${t.p}:${res.status}`);
  const j = (await res.json()) as any;
  const text = j?.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error(`${t.p}:empty`);
  return text;
}

/** يجرّب السلسلة بالترتيب: صحي أولاً (gemma ثم الفلاشات) ثم غروق ثم أوبنروتر — وأي 429 يبرّد نموذجه */
export async function fleetChat(env: Env, sys: string, msgs: Msg[]): Promise<string | null> {
  for (const t of parseFleet(env.AI_KEYS)) {
    if (!(await healthy(env, t))) continue;
    try {
      if (t.p === "gemini") return await callGemini(t, sys, msgs);
      if (t.p === "groq") return await callOpenAIish("https://api.groq.com/openai/v1/chat/completions", t, sys, msgs);
      return await callOpenAIish("https://openrouter.ai/api/v1/chat/completions", t, sys, msgs);
    } catch (e) {
      await markFail(env, t);
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
