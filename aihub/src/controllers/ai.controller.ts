// ——— محرك الاستدلال: الحلقة الفورية (Workers AI) + الوكيل الشفاف للمزودين (المفتاح يمرّ ولا يُخزَّن) ———
import type { Env, Session } from "../env";
import { rateLimit } from "../lib/rate";
import { planLimits, bumpUsage, getUsage, audit } from "../lib/usage";

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });

type ProviderDef = { base: string; headers: (k: string) => Record<string, string>; path: string };
// موصلات رسمية فقط — الوكيل يمرّر، لا يرى، لا يخزّن
const PROVIDERS: Record<string, ProviderDef> = {
  "openai": { base: "https://api.openai.com/v1", path: "/chat/completions", headers: (k) => ({ authorization: `Bearer ${k}` }) },
  "anthropic": { base: "https://api.anthropic.com/v1", path: "/messages", headers: (k) => ({ "x-api-key": k, "anthropic-version": "2023-06-01" }) },
  "gemini": { base: "https://generativelanguage.googleapis.com/v1beta/openai", path: "/chat/completions", headers: (k) => ({ authorization: `Bearer ${k}` }) },
  "nvidia": { base: "https://integrate.api.nvidia.com/v1", path: "/chat/completions", headers: (k) => ({ authorization: `Bearer ${k}` }) },
  "github-models": { base: "https://models.inference.ai.azure.com", path: "/chat/completions", headers: (k) => ({ authorization: `Bearer ${k}` }) },
  "groq": { base: "https://api.groq.com/openai/v1", path: "/chat/completions", headers: (k) => ({ authorization: `Bearer ${k}` }) },
  "openrouter": { base: "https://openrouter.ai/api/v1", path: "/chat/completions", headers: (k) => ({ authorization: `Bearer ${k}` }) },
};

export function isKnownProvider(p: string): boolean {
  return Object.prototype.hasOwnProperty.call(PROVIDERS, p);
}

// ——— الحلقة الفورية: Workers AI — سقف يومي عدل قبل أي شيء ———
export async function instant(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId || !s.csrf) return json({ error: "auth_required" }, 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return json({ error: "csrf" }, 403);
  const plan = (await env.DB.prepare("SELECT plan FROM users WHERE id=?").bind(s.userId).first<{ plan: string }>())?.plan ?? "FREE";
  const lim = await planLimits(env, plan);
  if (!(await rateLimit(env, `inst:${s.userId}`, lim.instant_daily, 86400))) {
    return json({ error: "daily_cap", cap: lim.instant_daily, reset: "00:00 UTC" }, 429);
  }
  const b = (await req.json().catch(() => ({}))) as { messages?: Array<{ role: string; content: string }> };
  const msgs = Array.isArray(b.messages) ? b.messages.slice(-12) : [];
  if (!msgs.length || msgs.some((m) => typeof m.content !== "string" || m.content.length > 8000))
    return json({ error: "invalid_input" }, 400);
  const used = await bumpUsage(env, s.userId, "instant");
  if (!env.AI) return json({ error: "ai_unavailable", hint: "dev-local-no-network", used, cap: lim.instant_daily }, 503);
  try {
    const r = await (env.AI as { run: (m: string, i: unknown) => Promise<unknown> }).run(
      "@cf/meta/llama-3.1-8b-instruct", { messages: msgs, max_tokens: 1024 }
    ) as { response?: string };
    return json({ ok: true, content: r.response ?? "", used, cap: lim.instant_daily, model: "llama-3.1-8b-instruct" });
  } catch (e) {
    return json({ error: "ai_unavailable", used, cap: lim.instant_daily }, 503);
  }
}

// ——— تجربة الصور الفورية: Workers AI من حصتنا المجانية — بسقف عدل معلن ———
export async function instantImage(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId || !s.csrf) return json({ error: "auth_required" }, 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return json({ error: "csrf" }, 403);
  const plan = (await env.DB.prepare("SELECT plan FROM users WHERE id=?").bind(s.userId).first<{ plan: string }>())?.plan ?? "FREE";
  const lim = await planLimits(env, plan);
  if (!(await rateLimit(env, `img:${s.userId}`, lim.instant_img_daily, 86400))) {
    return json({ error: "daily_cap", cap: lim.instant_img_daily, reset: "00:00 UTC" }, 429);
  }
  const b = (await req.json().catch(() => ({}))) as { prompt?: string };
  const prompt = typeof b.prompt === "string" ? b.prompt.trim().slice(0, 900) : "";
  if (!prompt) return json({ error: "invalid_input" }, 400);
  const used = await bumpUsage(env, s.userId, "instant_img");
  if (!env.AI) return json({ error: "ai_unavailable", hint: "dev-local-no-network", used, cap: lim.instant_img_daily }, 503);
  try {
    const r = await (env.AI as { run: (m: string, i: unknown) => Promise<unknown> }).run(
      "@cf/black-forest-labs/flux-1-schnell", { prompt, steps: 4 }
    ) as { image?: string };
    if (!r?.image) return json({ error: "ai_unavailable", used, cap: lim.instant_img_daily }, 503);
    return json({ ok: true, image: r.image, mime: "image/jpeg", used, cap: lim.instant_img_daily, model: "flux-1-schnell" });
  } catch {
    return json({ error: "ai_unavailable", used, cap: lim.instant_img_daily }, 503);
  }
}

// ——— الوكيل الشفاف: Authorization يمرّ من الطلب إلى المزود مباشرة، لا يُسجَّل ولا يُخزَّن ———
export async function proxyInfer(req: Request, env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const def = PROVIDERS[p.provider];
  if (!def) return json({ error: "unknown_provider" }, 404);
  const auth = req.headers.get("x-upstream-key") ?? "";
  if (!auth) return json({ error: "key_required" }, 401); // المفتاح يمرّ فقط — لا يلمس القرص ولا السجل
  const plan = (await env.DB.prepare("SELECT plan FROM users WHERE id=?").bind(s.userId).first<{ plan: string }>())?.plan ?? "FREE";
  const lim = await planLimits(env, plan);
  if (!(await rateLimit(env, `inf:${s.userId}`, lim.proxy_rpm, 60))) return json({ error: "rate_limited", rpm: lim.proxy_rpm }, 429);
  await bumpUsage(env, s.userId, "proxy");
  const url = `${def.base}${def.path}`;
  const upstream = new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...def.headers(auth) },
    body: req.body,
    // @ts-expect-error duplex مطلوب لتمرير الجسم في الخدمة
    duplex: "half",
  });
  try {
    const res = await fetch(upstream);
    await audit(env, s.userId, "infer", p.provider);
    const headers = new Headers(res.headers);
    headers.set("x-aihub-provider", p.provider);
    headers.delete("set-cookie");
    return new Response(res.body, { status: res.status, headers });
  } catch {
    return json({ error: "provider_unreachable", provider: p.provider }, 502);
  }
}

export async function usageReport(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const plan = (await env.DB.prepare("SELECT plan FROM users WHERE id=?").bind(s.userId).first<{ plan: string }>())?.plan ?? "FREE";
  const lim = await planLimits(env, plan);
  const u = await getUsage(env, s.userId);
  return json({ ok: true, plan, limits: lim, usage: u });
}
