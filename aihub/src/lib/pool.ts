// ——— Nexus Open: نظام التدوير والوسيط — سلسلة تحويل ذكية + كاش الأسئلة الشائعة ———
// المفاتيح من أسرار Worker (أصلها أسرار GitHub) — لا تُسجَّل ولا تُطبع ولا تعود للمستخدم أبداً
import type { Env } from "../env";

export type ChainLink = { id: string; envKey: keyof Env; base: string; model: string; cool401: number; cool429: number };

// ترتيب السلسلة كما أراد المالك: Groq → Cerebras → Gemini → OpenRouter، ثم احتياط أعمق
export const CHAIN: ChainLink[] = [
  { id: "groq",       envKey: "GROQ_API_KEY",       base: "https://api.groq.com/openai/v1",                        model: "openai/gpt-oss-120b",            cool401: 3600, cool429: 60 },
  { id: "cerebras",   envKey: "CEREBRAS_API_KEY",   base: "https://api.cerebras.ai/v1",                            model: "llama-3.3-70b",                      cool401: 3600, cool429: 60 },
  { id: "gemini",     envKey: "GEMINI_API_KEY",     base: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-2.5-flash",                 cool401: 3600, cool429: 45 },
  { id: "openrouter", envKey: "OPENROUTER_API_KEY", base: "https://openrouter.ai/api/v1",                          model: "openai/gpt-oss-120b:free", cool401: 3600, cool429: 30 },
  { id: "huggingface", envKey: "HUGGINGFACE_API_KEY", base: "https://router.huggingface.co/v1",                 model: "openai/gpt-oss-120b:fastest",        cool401: 3600, cool429: 120 },
  { id: "nvidia",     envKey: "NVIDIA_API_KEY",     base: "https://integrate.api.nvidia.com/v1",                   model: "deepseek-ai/deepseek-v4-flash",      cool401: 3600, cool429: 60 },
  { id: "mistral",    envKey: "MISTRAL_API_KEY",    base: "https://api.mistral.ai/v1",                             model: "mistral-small-latest",               cool401: 3600, cool429: 60 },
  { id: "sambanova",  envKey: "SAMBANOVA_API_KEY",  base: "https://api.sambanova.ai/v1",                           model: "Meta-Llama-3.3-70B-Instruct",        cool401: 3600, cool429: 60 },
  { id: "cohere",     envKey: "COHERE_API_KEY",     base: "https://api.cohere.ai/compatibility/v1",                model: "command-r7b-12-2024",                cool401: 3600, cool429: 60 },
];

// ——— تبريد المفتاح: عند 401/403 (مفتاح سيء) أو 429 (حصة) — نتجاوزه مؤقتاً ———
export async function isCooled(env: Env, id: string): Promise<boolean> {
  return (await env.CACHE_KV.get(`cool:${id}`)) !== null;
}
export async function cool(env: Env, id: string, sec: number): Promise<void> {
  await env.CACHE_KV.put(`cool:${id}`, "1", { expirationTtl: Math.max(60, sec) });
}

// ——— كاش الأسئلة الشائعة: تطبيع صارم + تجزئة — يوفر استدعاءات حقيقية ———
export function normFaq(text: string): string {
  return String(text || "")
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")   // تشكيل وتطويل عربي
    .replace(/[^\p{L}\p{N}\s]/gu, " ")              // ترقيم ورموز
    .replace(/\s+/g, " ")
    .trim();
}
export async function faqKey(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("faq1:" + normFaq(text)));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 40);
}
export async function cacheGet(env: Env, k: string): Promise<string | null> {
  return env.CACHE_KV.get(`faq:${k}`);
}
export async function cachePut(env: Env, k: string, content: string, ttlSec = 21600): Promise<void> {
  if (!content || content.length < 2) return;
  await env.CACHE_KV.put(`faq:${k}`, content, { expirationTtl: ttlSec });
}

export type AutoResult = { ok: boolean; content?: string; via?: string; model?: string; cached?: boolean; ms?: number; trace?: string };

// ——— محرك التدوير: يجرّب السلسلة كاملة ويعدّ التحويلات ———
export async function runChain(env: Env, messages: Array<{ role: string; content: string }>, maxTokens = 1024): Promise<AutoResult> {
  const t0 = Date.now();
  const body = JSON.stringify({ messages, max_tokens: maxTokens })   // بلا temperature: نماذج الاستدلال (gpt-oss) ترفض غير 1 عند بعض المزودين;
  const trace: string[] = [];   // أرقام حالات فقط — لا أسرار ولا مفاتيح
  for (const link of CHAIN) {
    const key = env[link.envKey] as string | undefined;
    if (!key) { trace.push(`${link.id}:skip`); continue; }        // مفتاح غير مثبّت
    if (await isCooled(env, link.id)) { trace.push(`${link.id}:cool`); continue; }
    try {
      const res = await fetch(`${link.base}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body,
      });
      if (res.status === 400) {
        // تشخيص: أول 100 حرف من رسالة المزود (لا تحوي أسراراً)
        const et = (await res.text()).replace(/\s+/g, " ").slice(0, 100);
        trace.push(`${link.id}:400:${et}`);
      } else trace.push(`${link.id}:${res.status}`);
      if (res.status === 401 || res.status === 403) { await cool(env, link.id, link.cool401); continue; }
      if (res.status === 429 || res.status >= 500) { await cool(env, link.id, link.cool429); continue; }
      if (!res.ok) { continue; }
      const d = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = d.choices?.[0]?.message?.content ?? "";
      if (!content) { trace.push(`${link.id}:empty`); continue; }
      return { ok: true, content, via: link.id, model: link.model, ms: Date.now() - t0, trace: trace.join(",") };
    } catch { trace.push(`${link.id}:net`); continue; }
  }
  return { ok: false, ms: Date.now() - t0, trace: trace.join(",") };
}
