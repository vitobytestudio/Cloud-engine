// ——— المصادقة: تسجيل، دخول، جلسات، حساب تجريبي فوري ———
import type { Env, Session } from "../env";
import { hashPassword, verifyPassword, createSession, sessionCookie, clearCookie, newId } from "../lib/auth";
import { rateLimit, clientIp } from "../lib/rate";
import { mailReady, sendMail, mailShell, htmlPage } from "../lib/mail";

const json = (obj: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } });

const SECTORS = new Set(["FOUNDER", "MERCHANT", "FREELANCER"]);

export async function me(env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ user: null });
  const u = await env.DB.prepare(
    "SELECT id,email,username,full_name,sector,badge_tier,country_code,locale,avatar_color,bio,reputation_score,company_name,created_at FROM users WHERE id=?"
  ).bind(s.userId).first();
  if (!u) return json({ user: null });
  const bal = await env.DB.prepare("SELECT COALESCE(SUM(amount_cents),0) AS b FROM transactions WHERE user_id=?")
    .bind(s.userId).first<{ b: number }>();
  return json({ user: u, csrf: s.csrf, balance_cents: bal?.b ?? 0 });
}

export async function register(req: Request, env: Env, s: Session): Promise<Response> {
  if (!(await rateLimit(env, `reg:${clientIp(req)}`, 5, 3600))) return json({ error: "too_many" }, 429);
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const email = (b.email ?? "").trim().toLowerCase();
  const username = (b.username ?? "").trim().toLowerCase();
  const password = b.password ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "invalid_email" }, 400);
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return json({ error: "invalid_username" }, 400);
  if (password.length < 8 || !/[\p{L}\d]/u.test(password) || !/\d/.test(password) || !/[\p{L}]/u.test(password))
    return json({ error: "weak_password" }, 400);
  if (!SECTORS.has(b.sector ?? "")) return json({ error: "invalid_sector" }, 400);
  const exists = await env.DB.prepare("SELECT id FROM users WHERE email=? OR username=?").bind(email, username).first();
  if (exists) return json({ error: "exists" }, 409);
  const id = newId("u");
  const hash = await hashPassword(password, env.AUTH_PEPPER ?? "");
  const needVerify = mailReady(env);
  await env.DB.prepare(
    "INSERT INTO users (id,email,password_hash,username,full_name,sector,country_code,avatar_color,bio,company_name,verified) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
  ).bind(id, email, hash, username, (b.full_name ?? username).slice(0, 80), b.sector,
    (b.country ?? "").slice(0, 2).toUpperCase(), "#3B82F6", "", "", needVerify ? 0 : 1).run();
  if (needVerify) {
    const vt = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    await env.CACHE_KV.put(`ev:${vt}`, id, { expirationTtl: 86400 });
    const origin = new URL(req.url).origin;
    await sendMail(env, email, "أكّد بريدك في NEXUS B2B",
      mailShell("خطوة واحدة تفصلك عن الشبكة", "اضغط الزر لتأكيد بريدك وتفعيل حسابك التجاري.", "أأكد بريدي الآن", `${origin}/api/auth/verify?token=${vt}`));
  }
  const { token, csrf } = await createSession(env, id);
  return json({ ok: true, csrf, verify_sent: needVerify }, 201, { "set-cookie": sessionCookie(token, env) });
}

// ——— تأكيد البريد (رابط الرسالة) ———
export async function verify(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const t = url.searchParams.get("token") ?? "";
  const uid = await env.CACHE_KV.get(`ev:${t}`);
  if (!uid) return new Response(htmlPage("رابط غير صالح", "الرابط منتهي أو مستخدم مسبقاً — سجّل الدخول واطلب رسالة جديدة.", false),
    { headers: { "content-type": "text/html; charset=utf-8" } });
  await env.DB.prepare("UPDATE users SET verified=1 WHERE id=?").bind(uid).run();
  await env.CACHE_KV.delete(`ev:${t}`);
  return new Response(htmlPage("تم تأكيد بريدك", "حسابك التجاري مفعّل بالكامل — إلى الشبكة.", true),
    { headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function resendVerification(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  if (!mailReady(env)) return json({ error: "mail_off" }, 400);
  const u = await env.DB.prepare("SELECT email, verified FROM users WHERE id=?").bind(s.userId).first<{ email: string; verified: number }>();
  if (!u || u.verified) return json({ ok: true });
  const vt = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  await env.CACHE_KV.put(`ev:${vt}`, s.userId, { expirationTtl: 86400 });
  const origin = new URL(req.url).origin;
  await sendMail(env, u.email, "تأكيد البريد — NEXUS B2B",
    mailShell("تأكيد جديد", "رابطك الجديد صالح 24 ساعة.", "أأكد بريدي", `${origin}/api/auth/verify?token=${vt}`));
  return json({ ok: true });
}

// ——— استرجاع كلمة المرور: بلا كشف وجود الحساب (مضاد التعداد) ———
export async function forgot(req: Request, env: Env): Promise<Response> {
  if (!(await rateLimit(env, `fg:${clientIp(req)}`, 5, 3600))) return json({ error: "too_many" }, 429);
  const b = (await req.json().catch(() => ({}))) as { email?: string };
  const email = (b.email ?? "").trim().toLowerCase();
  if (mailReady(env) && /@/.test(email)) {
    const u = await env.DB.prepare("SELECT id FROM users WHERE email=? AND password_hash != '!disabled'").bind(email).first<{ id: string }>();
    if (u) {
      const rt = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
      await env.CACHE_KV.put(`pw:${rt}`, u.id, { expirationTtl: 1800 });
      const origin = new URL(req.url).origin;
      await sendMail(env, email, "استرجاع كلمة المرور — NEXUS B2B",
        mailShell("طلب استرجاع", "اضغط الزر لتعيين كلمة مرور جديدة. الرابط صالح 30 دقيقة.", "تعيين كلمة مرور جديدة", `${origin}/api/auth/reset?token=${rt}`));
    }
  }
  return json({ ok: true, sent: mailReady(env) });
}

export async function resetPage(req: Request, env: Env): Promise<Response> {
  const t = new URL(req.url).searchParams.get("token") ?? "";
  return new Response(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>كلمة مرور جديدة</title><style>body{background:#070709;color:#e9e9ee;font-family:sans-serif;display:grid;place-items:center;min-height:100dvh;margin:0}form{background:#101016;border:1px solid #23232e;padding:28px;border-radius:16px;width:min(92vw,380px)}h1{font-size:18px}input{width:100%;padding:12px;margin:8px 0;background:#0b0b10;border:1px solid #2a2a36;color:#fff;border-radius:10px;font-size:15px}button{width:100%;padding:12px;background:#10b981;border:0;color:#04110b;font-weight:800;border-radius:10px;font-size:15px}p{color:#9a9aa6;font-size:13px}</style></head><body><form id="f"><h1>🔑 كلمة مرور جديدة — NEXUS B2B</h1><input id="p1" type="password" placeholder="كلمة المرور (8+ أحرف ورقم)" required /><input id="p2" type="password" placeholder="تأكيد كلمة المرور" required /><button>تعيين</button><p id="m"></p></form><script>document.getElementById("f").addEventListener("submit",async(e)=>{e.preventDefault();const p1=p1v(),p2=document.getElementById("p2").value;function p1v(){return document.getElementById("p1").value}const m=document.getElementById("m");if(p1!==p2){m.textContent="كلمتا المرور غير متطابقتين";return}const r=await fetch("/api/auth/reset",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token:${JSON.stringify("@T@")},password:p1})});const d=await r.json();if(r.ok){m.textContent="✅ تم — يمكنك الدخول بكلمتك الجديدة";setTimeout(()=>location.href="/#/feed",1200)}else{m.textContent=d.error==="weak_password"?"كلمة المرور ضعيفة (8+ أحرف ورقم)":"الرابط منتهي — اطلب رسالة جديدة"}});</script></body></html>`.replace("@T@", t),
    { headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function reset(req: Request, env: Env): Promise<Response> {
  if (!(await rateLimit(env, `rs:${clientIp(req)}`, 8, 3600))) return json({ error: "too_many" }, 429);
  const b = (await req.json().catch(() => ({}))) as { token?: string; password?: string };
  const pw = b.password ?? "";
  if (pw.length < 8 || !/\d/.test(pw) || !/[\p{L}]/u.test(pw)) return json({ error: "weak_password" }, 400);
  const uid = await env.CACHE_KV.get(`pw:${b.token ?? ""}`);
  if (!uid) return json({ error: "invalid_token" }, 400);
  const hash = await hashPassword(pw, env.AUTH_PEPPER ?? "");
  await env.DB.prepare("UPDATE users SET password_hash=? WHERE id=?").bind(hash, uid).run();
  await env.CACHE_KV.delete(`pw:${b.token}`);
  return json({ ok: true });
}

// ——— الدخول بڨوڨل (OAuth): يعمل لحظة إضافة المفتاحين ———
export async function googleStart(req: Request, env: Env): Promise<Response> {
  if (!env.GOOGLE_CLIENT_ID) return json({ error: "not_configured" }, 404);
  const origin = new URL(req.url).origin;
  const state = crypto.randomUUID();
  await env.CACHE_KV.put(`gst:${state}`, "1", { expirationTtl: 600 });
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  u.searchParams.set("redirect_uri", `${origin}/api/auth/google/callback`);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("state", state);
  return new Response(null, { status: 302, headers: { location: u.href } });
}

export async function googleCallback(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const ok = await env.CACHE_KV.get(`gst:${state}`);
  if (!code || !ok || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET)
    return new Response(htmlPage("فشل الدخول بڨوڨل", "انتهت الجلسة — أعد المحاولة.", false), { headers: { "content-type": "text/html; charset=utf-8" } });
  await env.CACHE_KV.delete(`gst:${state}`);
  const tok = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${url.origin}/api/auth/google/callback`, grant_type: "authorization_code",
    }),
  });
  const tj = (await tok.json().catch(() => ({}))) as { access_token?: string };
  if (!tj.access_token) return new Response(htmlPage("فشل الدخول بڨوڨل", "تعذر التحقق — أعد المحاولة.", false), { headers: { "content-type": "text/html; charset=utf-8" } });
  const ui = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${tj.access_token}` } });
  const gj = (await ui.json().catch(() => ({}))) as { email?: string; name?: string; email_verified?: boolean };
  const email = (gj.email ?? "").toLowerCase();
  if (!email || !gj.email_verified) return new Response(htmlPage("البريد غير موثّق", "حساب ڨوڨل يجب أن يكون ببريد موثّق.", false), { headers: { "content-type": "text/html; charset=utf-8" } });
  let uid = (await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first<{ id: string }>())?.id;
  if (!uid) {
    uid = newId("u");
    let base = email.split("@")[0].replace(/[^a-z0-9_]/g, "").slice(0, 16) || "member";
    let uname = base, i = 1;
    while (await env.DB.prepare("SELECT 1 AS x FROM users WHERE username=?").bind(uname).first()) uname = `${base}${i++}`;
    const colors = ["#E5A93C", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#14B8A6"];
    await env.DB.prepare(
      "INSERT INTO users (id,email,password_hash,username,full_name,sector,country_code,avatar_color,bio,company_name,verified) VALUES (?,?,?,?,?,?,?,?,?,?,1)"
    ).bind(uid, email, "!oauth", uname, (gj.name ?? uname).slice(0, 80), "FOUNDER", "", colors[Math.floor(Math.random() * colors.length)], "", "").run();
    await env.DB.prepare("INSERT OR IGNORE INTO transactions (id,user_id,kind,amount_cents,ref_type,ref_id,provider_event_id) VALUES (?,?,?,?,?,?,?)")
      .bind(`tx-${crypto.randomUUID().slice(0, 10)}`, uid, "DEPOSIT", 2000, "WELCOME", uid, `welcome_${uid}`).run();
  }
  const { token } = await createSession(env, uid);
  return new Response(null, { status: 302, headers: { location: "/#/feed", "set-cookie": sessionCookie(token, env) } });
}

export async function login(req: Request, env: Env, s: Session): Promise<Response> {
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const email = (b.email ?? "").trim().toLowerCase();
  if (!(await rateLimit(env, `login:${clientIp(req)}:${email}`, 5, 900))) return json({ error: "locked" }, 429);
  const u = await env.DB.prepare("SELECT id,password_hash FROM users WHERE email=?").bind(email).first<{ id: string; password_hash: string }>();
  if (!u || u.password_hash === "!disabled" || u.password_hash === "!oauth" || !(await verifyPassword(b.password ?? "", u.password_hash, env.AUTH_PEPPER ?? "")))
    return json({ error: "invalid_credentials" }, 401);
  if (mailReady(env)) {
    const verified = await env.DB.prepare("SELECT verified FROM users WHERE id=?").bind(u.id).first<{ verified: number }>();
    if (verified && !verified.verified) return json({ error: "verify_email" }, 403);
  }
  const { token, csrf } = await createSession(env, u.id);
  return json({ ok: true, csrf }, 200, { "set-cookie": sessionCookie(token, env) });
}

export async function demoLogin(req: Request, env: Env, s: Session): Promise<Response> {
  if (!(await rateLimit(env, `demo:${clientIp(req)}`, 20, 3600))) return json({ error: "too_many" }, 429);
  const u = await env.DB.prepare("SELECT id FROM users WHERE id='u-demo-amin'").first<{ id: string }>();
  if (!u) return json({ error: "no_demo" }, 500);
  const { token, csrf } = await createSession(env, u.id);
  return json({ ok: true, csrf, user_id: u.id }, 200, { "set-cookie": sessionCookie(token, env) });
}

export async function logout(_req: Request, env: Env, s: Session): Promise<Response> {
  const { destroySession } = await import("../lib/auth");
  await destroySession(env, s.token);
  return json({ ok: true }, 200, { "set-cookie": clearCookie() });
}
