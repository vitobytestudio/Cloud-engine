// ——— محرك الاستدلال: الحلقة الفورية (Workers AI) + الوكيل الشفاف للمزودين (المفتاح يمرّ ولا يُخزَّن) ———
import type { Env, Session } from "../env";
import { rateLimit } from "../lib/rate";
import { planLimits, bumpUsage, getUsage, audit } from "../lib/usage";
import { runChain, faqKey, cacheGet, cachePut, isCooled, cool } from "../lib/pool";

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
  "hf": { base: "https://router.huggingface.co/v1", path: "/chat/completions", headers: (k) => ({ authorization: `Bearer ${k}` }) },
  "cerebras": { base: "https://api.cerebras.ai/v1", path: "/chat/completions", headers: (k) => ({ authorization: `Bearer ${k}` }) },
  "mistral": { base: "https://api.mistral.ai/v1", path: "/chat/completions", headers: (k) => ({ authorization: `Bearer ${k}` }) },
  "sambanova": { base: "https://api.sambanova.ai/v1", path: "/chat/completions", headers: (k) => ({ authorization: `Bearer ${k}` }) },
  "cohere": { base: "https://api.cohere.ai/compatibility/v1", path: "/chat/completions", headers: (k) => ({ authorization: `Bearer ${k}` }) },
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
  // ——— الحلقة الذكية: Workers AI أولاً، فإن تعثّر جرت الحلقة المجتمعية (Pollinations) — الباب لا يُغلق ———
  if (env.AI) {
    try {
      const r = await (env.AI as { run: (m: string, i: unknown) => Promise<unknown> }).run(
        "@cf/meta/llama-3.1-8b-instruct", { messages: msgs, max_tokens: 1024 }
      ) as { response?: string };
      if (r && typeof r.response === "string")
        return json({ ok: true, content: r.response, used, cap: lim.instant_daily, model: "llama-3.1-8b-instruct", via: "workers-ai" });
    } catch { /* ننتقل تلقائياً */ }
  }
  try {
    const r = await fetch("https://text.pollinations.ai/openai", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: "openai", messages: msgs, private: true }),
    });
    if (r.ok) {
      const d = await r.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = d.choices?.[0]?.message?.content ?? "";
      if (content) return json({ ok: true, content, used, cap: lim.instant_daily, model: "pollinations/free", via: "pollinations" });
    }
  } catch { /* تعذّرت الحلقتان معاً */ }
  return json({ error: "ai_unavailable", used, cap: lim.instant_daily }, 503);
}

// ——— Nexus Open: تدوير ذكي عبر مفاتيح المنصة + كاش الأسئلة الشائعة — بلا مفتاح من المستخدم ———
export async function autoInfer(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId || !s.csrf) return json({ error: "auth_required" }, 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return json({ error: "csrf" }, 403);
  const plan = (await env.DB.prepare("SELECT plan FROM users WHERE id=?").bind(s.userId).first<{ plan: string }>())?.plan ?? "FREE";
  const lim = await planLimits(env, plan);
  if (!(await rateLimit(env, `auto:${s.userId}`, lim.auto_daily, 86400))) {
    return json({ error: "daily_cap", cap: lim.auto_daily, reset: "00:00 UTC" }, 429);
  }
  // صمام عالمي يحمي مفاتيح المنصة من التدفق (90 طلباً/دقيقة للجميع)
  if (!(await rateLimit(env, "auto:global", 90, 60))) return json({ error: "busy", hint: "try_instant" }, 429);

  const b = (await req.json().catch(() => ({}))) as { messages?: Array<{ role: string; content: string }> };
  const msgs = Array.isArray(b.messages) ? b.messages.slice(-12) : [];
  if (!msgs.length || msgs.some((m) => typeof m.content !== "string" || m.content.length > 8000))
    return json({ error: "invalid_input" }, 400);

  // 1) كاش الأسئلة الشائعة: آخر رسالة مستخدم مطبَّعة — إصابة واحدة توفر استدعاءً كاملاً
  const lastUser = [...msgs].reverse().find((m) => m.role === "user")?.content ?? "";
  if (lastUser.trim().length >= 6) {
    const k = await faqKey(lastUser);
    const hit = await cacheGet(env, k);
    if (hit) {
      const used = await bumpUsage(env, s.userId, "auto");
      return json({ ok: true, content: hit, via: "cache", model: "faq-cache", cached: true, used, cap: lim.auto_daily });
    }
  }

  // 2) سلسلة التدوير: Groq → Cerebras → Gemini → OpenRouter → احتياط أعمق
  const r = await runChain(env, msgs);
  if (r.ok && r.content) {
    if (lastUser.trim().length >= 6) await cachePut(env, await faqKey(lastUser), r.content);
    const used = await bumpUsage(env, s.userId, "auto");
    await audit(env, s.userId, "auto", r.via ?? "");
    return json({ ok: true, content: r.content, via: r.via, model: r.model, used, cap: lim.auto_daily });
  }

  // 3) الحلقة المجتمعية كصمام أخير
  try {
    const res = await fetch("https://text.pollinations.ai/openai", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: "openai", messages: msgs, private: true }),
    });
    if (res.ok) {
      const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = d.choices?.[0]?.message?.content ?? "";
      if (content) {
        const used = await bumpUsage(env, s.userId, "auto");
        return json({ ok: true, content, via: "pollinations", model: "community", used, cap: lim.auto_daily });
      }
    }
  } catch { /* كل الحلقات تعثّرت */ }
  return json({ error: "ai_unavailable", used: (await bumpUsage(env, s.userId, "auto")), cap: lim.auto_daily }, 503);
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
  if (env.AI) {
    try {
      const r = await (env.AI as { run: (m: string, i: unknown) => Promise<unknown> }).run(
        "@cf/black-forest-labs/flux-1-schnell", { prompt, steps: 4 }
      ) as { image?: string };
      if (r?.image) return json({ ok: true, image: r.image, mime: "image/jpeg", used, cap: lim.instant_img_daily, model: "flux-1-schnell", via: "workers-ai" });
    } catch { /* ننتقل تلقائياً */ }
  }
  // الحلقة المجتمعية: Pollinations — بلا مفتاح، فلُكس
  try {
    const seed = Math.floor(Math.random() * 1e6);
    const r = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&model=flux&nologo=true&seed=${seed}`);
    if (r.ok) {
      const buf = await r.arrayBuffer();
      if (buf.byteLength > 1000) {
        let bin = ""; const u = new Uint8Array(buf);
        for (let i = 0; i < u.length; i++) bin += String.fromCharCode(u[i]);
        return json({ ok: true, image: btoa(bin), mime: r.headers.get("content-type") ?? "image/jpeg", used, cap: lim.instant_img_daily, model: "pollinations-flux", via: "pollinations" });
      }
    }
  } catch { /* تعذّرت الحلقتان */ }
  return json({ error: "ai_unavailable", used, cap: lim.instant_img_daily }, 503);
}

// ——— الوكيل الشفاف: Authorization يمرّ من الطلب إلى المزود مباشرة، لا يُسجَّل ولا يُخزَّن ———
export async function proxyInfer(req: Request, env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const def = PROVIDERS[p.provider];
  if (!def) return json({ error: "unknown_provider" }, 404);
  const auth = req.headers.get("x-upstream-key") ?? "";
  if (!auth) return json({ error: "key_required" }, 401); // المفتاح يمرّ فقط — لا يلمس القرص ولا السجل
  const clen = parseInt(req.headers.get("content-length") ?? "0", 10);
  if (clen > 200_000) return json({ error: "payload_too_large" }, 413); // سقف حماية للبنية والمزود
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

// ═══ v0.10.0-a: صور متقدمة — Gemini nano-banana ثم HF FLUX.1-schnell ثم Pollinations ═══
const stripTags = (h: string): string => h.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export async function imageAuto(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return json({ error: "csrf" }, 403);
  const b = (await req.json().catch(() => ({}))) as { prompt?: string };
  const prompt = (b.prompt ?? "").slice(0, 1200).trim();
  if (prompt.length < 3) return json({ error: "invalid_input" }, 400);
  if (!(await rateLimit(env, `img:${s.userId}`, 60, 86400))) return json({ error: "too_many" }, 429);
  const used = await bumpUsage(env, s.userId, "instant_img");
  const lim = await planLimits(env, (await env.DB.prepare("SELECT plan FROM users WHERE id=?").bind(s.userId).first<{ plan: string }>())?.plan ?? "FREE");
  // 1) Gemini (nano-banana) بمفتاح المنصة — واجهة generateContent الرسمية
  const gk = env.GEMINI_API_KEY;
  if (gk && !(await isCooled(env, "gemini-img"))) {
    try {
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent", {
        method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": gk },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      if (r.ok) {
        const d = await r.json() as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> } }> };
        const part = d.candidates?.[0]?.content?.parts?.find((x) => x.inlineData?.data);
        if (part?.inlineData?.data) {
          await audit(env, s.userId, "img_ok", "gemini-image");
          return json({ ok: true, image: part.inlineData.data, mime: part.inlineData.mimeType ?? "image/png", via: "gemini", model: "gemini-2.5-flash-image", used, cap: lim.instant_img_daily });
        }
      } else if (r.status === 401 || r.status === 403 || r.status === 429) {
        await cool(env, "gemini-img", 300);
      }
    } catch { /* التالي */ }
  }
  // 2) Hugging Face FLUX.1-schnell بمفتاح المنصة — واجهة الاستدلال الرسمية
  const hk = env.HUGGINGFACE_API_KEY;
  if (hk && !(await isCooled(env, "hf-img"))) {
    try {
      const r = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell", {
        method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${hk}` },
        body: JSON.stringify({ inputs: prompt })
      });
      if (r.ok) {
        const buf = new Uint8Array(await r.arrayBuffer());
        let bin = ""; for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        await audit(env, s.userId, "img_ok", "flux-schnell");
        return json({ ok: true, image: btoa(bin), mime: r.headers.get("content-type") ?? "image/jpeg", via: "huggingface", model: "FLUX.1-schnell", used, cap: lim.instant_img_daily });
      } else if (r.status === 401 || r.status === 403 || r.status === 429 || r.status === 503) {
        await cool(env, "hf-img", 300);
      }
    } catch { /* التالي */ }
  }
  // 3) Pollinations (مجتمعي، بلا مفتاح)
  try {
    const seed = Math.floor(Math.random() * 1e9);
    const r = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}`);
    if (r.ok) {
      const buf = new Uint8Array(await r.arrayBuffer());
      let bin = ""; for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
      await audit(env, s.userId, "img_ok", "pollinations");
      return json({ ok: true, image: btoa(bin), mime: r.headers.get("content-type") ?? "image/jpeg", via: "pollinations", model: "flux", used, cap: lim.instant_img_daily });
    }
  } catch { /* الأخير */ }
  await audit(env, s.userId, "img_unavailable");
  return json({ error: "img_unavailable", used, cap: lim.instant_img_daily }, 503);
}

// ═══ الوكلاء — ثلاثة: الباحث (يقرأ رابطاً عاماً) والمحلل والكاتب ═══
export async function agentRun(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return json({ error: "csrf" }, 403);
  const b = (await req.json().catch(() => ({}))) as { agent?: string; task?: string; url?: string };
  const task = (b.task ?? "").slice(0, 2000).trim();
  const agent = b.agent ?? "writer";
  const url = (b.url ?? "").trim();
  if (task.length < 3) return json({ error: "invalid_input" }, 400);
  if (!["researcher", "analyst", "writer"].includes(agent)) return json({ error: "invalid_input" }, 400);
  if (url && !/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(url)) return json({ error: "invalid_input" }, 400);
  if (!(await rateLimit(env, `agent:${s.userId}`, 30, 86400))) return json({ error: "too_many" }, 429);
  const t0 = Date.now();
  const msgs: Array<{ role: string; content: string }> = [];
  let toolNote = "";
  if (agent === "researcher" && url) {
    try {
      const page = await fetch(url, { headers: { "user-agent": "NexusHub-Researcher/1.0" } });
      const raw = stripTags(await page.text()).slice(0, 4000);
      toolNote = raw ? `\\n\\n[مقتطف من ${url}]\\n${raw}` : "";
      await audit(env, s.userId, "agent_fetch", url.slice(0, 100));
    } catch { toolNote = "\\n\\n[تعذر قراءة الرابط — اعتمد على معرفتك مع التنويه]"; }
  }
  const personas: Record<string, string> = {
    researcher: "أنت «الباحث» في منصة Nexus — تجيب بدقة وتستشهد بالمصدر إن توفر، وتنوّه عند نقص الأدلة.",
    analyst: "أنت «المحلل» في منصة Nexus — تحلل بنيوياً: نقاط القوة، المخاطر، التوصيات مرقمة، وخطوات عملية.",
    writer: "أنت «الكاتب التنفيذي» في منصة Nexus — صياغة احترافية واضحة بلا حشو، بعناوين وبنود.",
  };
  msgs.push({ role: "system", content: personas[agent] });
  msgs.push({ role: "user", content: task + toolNote });
  const r = await runChain(env, msgs, 2048);
  const used = await bumpUsage(env, s.userId, "auto");
  if (r.ok) {
    await audit(env, s.userId, "agent_ok", agent);
    return json({ ok: true, agent, content: r.content, via: r.via, ms: Date.now() - t0, used });
  }
  return json({ error: "agent_unavailable", used }, 503);
}

// ═══ فيديو Luma Ray-2 — الواجهة الرسمية، المفتاح يمرّ ولا يُخزَّن (علم صفر المعرفة) ═══
export async function lumaCreate(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return json({ error: "csrf" }, 403);
  const b = (await req.json().catch(() => ({}))) as { key?: string; prompt?: string; resolution?: string; duration?: string };
  const key = (b.key ?? "").trim();
  const prompt = (b.prompt ?? "").slice(0, 1500).trim();
  if (!/^luma-[A-Za-z0-9-]{8,}$/.test(key)) return json({ error: "key_required" }, 400);
  if (prompt.length < 3) return json({ error: "invalid_input" }, 400);
  if (!(await rateLimit(env, `luma:${s.userId}`, 10, 3600))) return json({ error: "too_many" }, 429);
  try {
    const r = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ prompt, model: "ray-2", resolution: b.resolution === "1080p" ? "1080p" : "720p", duration: b.duration === "9s" ? "9s" : "5s" })
    });
    const d = await r.json().catch(() => ({})) as { id?: string; error?: unknown };
    await audit(env, s.userId, "luma_create", String(r.status));
    if (r.ok && d.id) return json({ ok: true, id: d.id, state: "queued" });
    return json({ error: "luma_error", status: r.status }, r.status === 401 ? 401 : 502);
  } catch { return json({ error: "luma_error" }, 502); }
}

export async function lumaStatus(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return json({ error: "csrf" }, 403);
  const b = (await req.json().catch(() => ({}))) as { key?: string; id?: string };
  const key = (b.key ?? "").trim(), id = (b.id ?? "").trim();
  if (!/^luma-[A-Za-z0-9-]{8,}$/.test(key) || !/^[A-Za-z0-9-]{6,}$/.test(id)) return json({ error: "invalid_input" }, 400);
  try {
    const r = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${encodeURIComponent(id)}`, {
      headers: { accept: "application/json", authorization: `Bearer ${key}` }
    });
    const d = await r.json().catch(() => ({})) as { state?: string; assets?: { video?: string }; failure_reason?: string };
    return json({ ok: true, state: d.state ?? "unknown", video: d.assets?.video ?? null, failure: d.failure_reason ?? null });
  } catch { return json({ error: "luma_error" }, 502); }
}
