// ——— NAKSAB AI Router: المزودون الرسميون + fallback + كاش + سجل استخدام ———
// الوظائف الأساسية تعمل بلا ذكاء اصطناعي (قرار هـ) — هذه طبقة تعزيز فقط.
import type { Env } from "./env";
import { clip, id, now } from "./lib";

type Task = { kind: string; system: string; user: string; maxTokens?: number; json?: boolean };
type Res = { ok: true; text: string; via: string } | { ok: false; trace: string };

async function callGemini(env: Env, t: Task): Promise<string | null> {
  if (!env.GEMINI_API_KEY) return null;
  const body = {
    systemInstruction: { parts: [{ text: t.system }] },
    contents: [{ role: "user", parts: [{ text: t.user }] }],
    generationConfig: { maxOutputTokens: t.maxTokens ?? 1200, ...(t.json ? { responseMimeType: "application/json" } : {}) },
  };
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  }).catch(() => null);
  if (!r?.ok) return null;
  const j: any = await r.json().catch(() => null);
  return j?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

async function callGroq(env: Env, t: Task): Promise<string | null> {
  if (!env.GROQ_API_KEY) return null;
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "system", content: t.system }, { role: "user", content: t.user }],
      max_tokens: t.maxTokens ?? 1200,
      ...(t.json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(20000),
  }).catch(() => null);
  if (!r?.ok) return null;
  const j: any = await r.json().catch(() => null);
  const raw = j?.choices?.[0]?.message?.content;
  return raw ? raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim() : null;
}

async function callOpenRouter(env: Env, t: Task): Promise<string | null> {
  if (!env.OPENROUTER_API_KEY) return null;
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${env.OPENROUTER_API_KEY}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: t.system }, { role: "user", content: t.user }],
      max_tokens: t.maxTokens ?? 1200,
      ...(t.json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(25000),
  }).catch(() => null);
  if (!r?.ok) return null;
  const j: any = await r.json().catch(() => null);
  return j?.choices?.[0]?.message?.content ?? null;
}

const CHAIN: Array<[string, (env: Env, t: Task) => Promise<string | null>]> = [
  ["gemini", callGemini],
  ["groq", callGroq],
  ["openrouter", callOpenRouter],
];

export async function runTask(env: Env, userId: string, t: Task): Promise<Res> {
  const t0 = now();
  // كاش بالبصمة — deduplication
  const cacheKey = `ai:${await sha(t.kind + ":" + t.user)}`;
  const cached = await env.CACHE_KV.get(cacheKey);
  if (cached) {
    await logUse(env, userId, t.kind, "cache", "", 1, 0);
    return { ok: true, text: cached, via: "cache" };
  }
  const trace: string[] = [];
  for (const [name, fn] of CHAIN) {
    const text = await fn(env, t);
    if (text && text.trim()) {
      await env.CACHE_KV.put(cacheKey, text, { expirationTtl: 3600 });
      await logUse(env, userId, t.kind, name, "", 1, now() - t0);
      return { ok: true, text: text.trim(), via: name };
    }
    trace.push(`${name}:fail`);
  }
  await logUse(env, userId, t.kind, "none", "", 0, now() - t0);
  return { ok: false, trace: trace.join(" → ") };
}

async function logUse(env: Env, userId: string, kind: string, provider: string, model: string, ok: number, ms: number) {
  await env.DB.prepare("INSERT INTO ai_usage (id, user_id, kind, provider, model, ok, ms, created_at) VALUES (?,?,?,?,?,?,?,?)")
    .bind(id("aiu"), clip(userId, 40), clip(kind, 30), provider, clip(model, 40), ok, ms, now()).run().catch(() => {});
}

async function sha(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

// هيكلة طلب المشروع — مخرجات JSON صارمة، بلا اختراع أسعار
export const STRUCTURE_SYSTEM = `You are NAKSAB's project request analyzer. Extract structured data from the client's project description.
Return ONLY JSON: {"title": string (short, professional), "category": one of [programming, design, video, marketing, writing, ai, business, audio], "skills": string[] (2-6 lowercase skill slugs), "budget_min": number (USD, 0 if unknown), "budget_max": number (USD, 0 if unknown), "questions": string[] (1-3 clarifying questions ONLY if critical info is missing, else [])}.
Never invent prices, deadlines, or requirements not stated by the client. If the budget is not mentioned, use 0.`;
