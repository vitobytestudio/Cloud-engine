// ——— بيئة الفريق: مصنع نكسس التنفيذي — الوكيل يبني في لينكس حقيقي ويعاين حياً ———
import type { Env, Session } from "../env";
import { rateLimit } from "../lib/rate";
import { audit } from "../lib/usage";
import { runChain } from "../lib/pool";
import { sbxCreate, sbxExec, sbxKill, previewHost } from "../lib/sandbox";

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });

const TTL = 3600; // ساعة أثر محلي — البيئة نفسها تقتل نفسها عند E2B بعد مهلة الإنشاء
const key = (uid: string, sid: string) => `envh:${uid}:${sid}`;

async function activeEnvs(env: Env, uid: string): Promise<string[]> {
  const l = await env.CACHE_KV.list({ prefix: `envh:${uid}:` });
  return l.keys.map((k) => k.name.split(":")[2] ?? "");
}

async function owns(env: Env, uid: string, sid: string): Promise<boolean> {
  return (await env.CACHE_KV.get(key(uid, sid))) !== null;
}

function clip(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// ═══ 1) الحالة ═══
export async function envStatus(_req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const active = await activeEnvs(env, s.userId);
  return json({ ok: true, engine: !!env.E2B_API_KEY, active, concurrency: 1, daily: 5 });
}

// ═══ 2) إنشاء بيئة ═══
export async function envCreate(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return json({ error: "csrf" }, 403);
  if (!env.E2B_API_KEY) return json({ error: "engine_off" }, 503);
  const active = await activeEnvs(env, s.userId);
  if (active.length >= 1) return json({ error: "env_busy", active }, 409);
  if (!(await rateLimit(env, `envday:${s.userId}`, 5, 86400))) return json({ error: "too_many" }, 429);
  const r = await sbxCreate(env, { nexus_user: s.userId.slice(0, 12) }, 15);
  if (!r.ok) {
    await audit(env, s.userId, "env_create_fail", `${r.status}:${r.err}`);
    return json({ error: "create_failed", detail: r.err }, 502);
  }
  await env.CACHE_KV.put(key(s.userId, r.sid), String(Date.now()), { expirationTtl: TTL });
  await audit(env, s.userId, "env_create", r.sid.slice(0, 16));
  return json({ ok: true, sid: r.sid, ttl: 15 });
}

// ═══ 3) طرفية يدوية ═══
export async function envExec(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return json({ error: "csrf" }, 403);
  if (!env.E2B_API_KEY) return json({ error: "engine_off" }, 503);
  const b = (await req.json().catch(() => ({}))) as { sid?: string; script?: string };
  const sid = (b.sid ?? "").slice(0, 64);
  const script = (b.script ?? "").slice(0, 4000).trim();
  if (!sid || !script) return json({ error: "invalid_input" }, 400);
  if (/rm\s+-rf\s+\/(\s|$)/.test(script) || /:\(\)\{/.test(script) || /shutdown|reboot|mkfs/.test(script)) return json({ error: "forbidden_cmd" }, 400);
  if (!(await owns(env, s.userId, sid))) return json({ error: "env_unknown" }, 404);
  if (!(await rateLimit(env, `envexec:${s.userId}`, 120, 3600))) return json({ error: "too_many" }, 429);
  const r = await sbxExec(env, sid, script);
  await audit(env, s.userId, "env_exec", `exit=${r.exit} len=${script.length}`);
  return json({ ok: r.ok, stdout: clip(r.stdout, 8000), stderr: clip(r.stderr, 4000), exit: r.exit });
}

// ═══ 4) المصنع: الوكيل يخطط وينفّذ فعلياً خطوة بخطوة ═══
export async function envAgent(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return json({ error: "csrf" }, 403);
  if (!env.E2B_API_KEY) return json({ error: "engine_off" }, 503);
  const b = (await req.json().catch(() => ({}))) as { goal?: string };
  const goal = (b.goal ?? "").slice(0, 1200).trim();
  if (goal.length < 5) return json({ error: "invalid_input" }, 400);
  if (!(await rateLimit(env, `envbuild:${s.userId}`, 3, 86400))) return json({ error: "too_many" }, 429);

  // بيئة لحظية لهذه المهمة فقط
  const active = await activeEnvs(env, s.userId);
  if (active.length >= 1) return json({ error: "env_busy", active }, 409);
  const created = await sbxCreate(env, { nexus_user: s.userId.slice(0, 12) }, 20);
  if (!created.ok) {
    await audit(env, s.userId, "env_create_fail", `${created.status}:${created.err}`);
    return json({ error: "create_failed", detail: created.err }, 502);
  }
  const sid = created.sid;
  await env.CACHE_KV.put(key(s.userId, sid), String(Date.now()), { expirationTtl: TTL });

  const plan = await runChain(env, [
    { role: "system", content: `أنت قائد فريق البناء في مصنع Nexus. المستخدم يصف ما يريد. أنت داخل لينكس حقيقي (Node.js وPython مثبتان، إنترنت متاح). أعد خطة من 2 إلى 5 أوامر bash حقيقية متتالية تبني المطلوب فعلياً داخل /home/user. قواعد: JSON فقط بلا أي نص إضافي بالصيغة {"steps":[{"explain":"شرح عربي موجز","cmd":"أمر واحد"}],"port":<منفذ الخادم إن بدأته وإلا null>}. لتشغيل خادم: nohup مع إعادة توجيه السجلات، ولا تنتظر اكتماله. ابدأ بإنشاء الملفات عبر heredoc ثم ثبت وابنِ ثم شغّل.` },
    { role: "user", content: goal },
  ], 1800);
  if (!plan.ok) {
    await audit(env, s.userId, "env_plan_fail", (plan.trace ?? "").slice(0, 200));
    return json({ error: "plan_failed", sid, trace: plan.trace ?? "" }, 502);
  }
  const planText = plan.content ?? "";
  const m = planText.match(/\{[\s\S]*\}/);
  let steps: Array<{ explain: string; cmd: string }> = [];
  let port: number | null = null;
  try {
    const pj = JSON.parse(m ? m[0] : "");
    steps = (pj.steps ?? []).slice(0, 5).map((x: any) => ({ explain: String(x.explain ?? "").slice(0, 300), cmd: String(x.cmd ?? "").slice(0, 1200) })).filter((x: any) => x.cmd);
    port = typeof pj.port === "number" && pj.port > 0 && pj.port < 65536 ? pj.port : null;
  } catch {}
  if (!steps.length) {
    await audit(env, s.userId, "env_plan_invalid", planText.slice(0, 150));
    return json({ error: "plan_invalid", sid }, 502);
  }

  const results: Array<{ explain: string; cmd: string; exit: number; stdout: string; stderr: string; ms: number }> = [];
  for (const st of steps) {
    const t0 = Date.now();
    const r = await sbxExec(env, sid, st.cmd, 120000);
    results.push({ explain: st.explain, cmd: st.cmd, exit: r.exit, stdout: clip(r.stdout, 1500), stderr: clip(r.stderr, 900), ms: Date.now() - t0 });
    if (r.exit !== 0 && !r.stdout && r.stderr) break; // فشل قاطع مبكر
  }

  const summary = await runChain(env, [
    { role: "system", content: "أنت قائد فريق Nexus. لخّص نتيجة البناء في 3 أسطر عربية: ما بُني، هل نجح، وما الخطوة التالية المقترحة. بلا مبالغة." },
    { role: "user", content: `الهدف: ${goal}\nالنتائج: ${JSON.stringify(results).slice(0, 5000)}` },
  ], 600);

  const done = results.length > 0 && results[results.length - 1].exit === 0;
  await audit(env, s.userId, "env_agent", `${sid.slice(0, 12)} steps=${results.length} done=${done}`);
  return json({
    ok: true,
    sid,
    steps: results,
    port,
    preview: port ? previewHost(sid, port) : null,
    summary: summary.ok ? summary.content : "",
    via: plan.via,
  });
}

// ═══ 5) إنهاء البيئة ═══
export async function envStop(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  if ((req.headers.get("x-csrf") ?? "") !== s.csrf) return json({ error: "csrf" }, 403);
  const b = (await req.json().catch(() => ({}))) as { sid?: string };
  const sid = (b.sid ?? "").slice(0, 64);
  if (!sid) return json({ error: "invalid_input" }, 400);
  if (!(await owns(env, s.userId, sid))) return json({ error: "env_unknown" }, 404);
  if (env.E2B_API_KEY) await sbxKill(env, sid);
  await env.CACHE_KV.delete(key(s.userId, sid));
  await audit(env, s.userId, "env_stop", sid.slice(0, 16));
  return json({ ok: true });
}
