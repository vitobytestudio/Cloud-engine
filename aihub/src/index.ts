// ——— AIHub — مركز الذكاء الموحّد — نقطة الدخول ———
import type { Env, Session } from "./env";
import { getSessionData } from "./lib/auth";
import * as auth from "./controllers/auth.controller";
import * as vault from "./controllers/vault.controller";
import * as ai from "./controllers/ai.controller";

type Route = { m: string; pat: string; h: (req: Request, env: Env, s: Session, p: Record<string, string>) => Promise<Response>; auth?: boolean; csrf?: boolean };

function match(pat: string, path: string): Record<string, string> | null {
  const pp = pat.split("/"), aa = path.split("/");
  if (pp.length !== aa.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(":")) params[pp[i].slice(1)] = decodeURIComponent(aa[i]);
    else if (pp[i] !== aa[i]) return null;
  }
  return params;
}

function parseCookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (req.headers.get("cookie") ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

const routes: Route[] = [
  { m: "POST", pat: "/api/auth/register", h: (r, e) => auth.register(r, e) },
  { m: "POST", pat: "/api/auth/login",    h: (r, e) => auth.login(r, e) },
  { m: "POST", pat: "/api/auth/logout",   h: (r, e, s) => auth.logout(r, e, s) },
  { m: "GET",  pat: "/api/me",            h: (r, e, s) => auth.me(r, e, s) },
  { m: "GET",  pat: "/api/vault",         h: (r, e, s) => vault.getVault(r, e, s), auth: true },
  { m: "PUT",  pat: "/api/vault",         h: (r, e, s) => vault.putVault(r, e, s), auth: true, csrf: true },
  { m: "POST", pat: "/api/infer/instant", h: (r, e, s) => ai.instant(r, e, s), auth: true, csrf: true },
  { m: "POST", pat: "/api/infer/auto",      h: (r, e, s) => ai.autoInfer(r, e, s), auth: true, csrf: true },
  { m: "POST", pat: "/api/infer/instant-image", h: (r, e, s) => ai.instantImage(r, e, s), auth: true, csrf: true },
  { m: "POST", pat: "/api/infer/:provider", h: (r, e, s, p) => ai.proxyInfer(r, e, s, p), auth: true },
  { m: "GET",  pat: "/api/usage",         h: (r, e, s) => ai.usageReport(r, e, s), auth: true },
];

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    // التطبيق نفس الأصل — لا CORS خارجي إطلاقاً (الكوكيز HttpOnly+SameSite=Lax تحمي أصلاً)
    const cors: Record<string, string> = {
      "access-control-allow-headers": "content-type, x-csrf, x-upstream-key",
      "access-control-allow-methods": "GET, POST, PUT, OPTIONS",
    };
    // رؤوس الأمان على كل استجابة — خط الإنتاج الأول
    const SEC: Record<string, string> = {
      "content-security-policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "referrer-policy": "strict-origin-when-cross-origin",
      "permissions-policy": "camera=(), microphone=(), geolocation=()",
      "strict-transport-security": "max-age=31536000; includeSubDomains",
      "cross-origin-opener-policy": "same-origin",
    };
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...cors, ...SEC } });

    if (path.startsWith("/api/")) {
      try {
        for (const r of routes) {
          if (r.m !== req.method) continue;
          const params = match(r.pat, path);
          if (!params) continue;
          const sd = await getSessionData(env, parseCookies(req)["ah_s"] ?? null);
          const s: Session = { token: parseCookies(req)["ah_s"] ?? null, csrf: sd?.csrf ?? null, userId: sd?.userId ?? null };
          if (r.auth && !s.userId) return new Response(JSON.stringify({ error: "auth_required" }), { status: 401, headers: { "content-type": "application/json", ...cors, ...SEC } });
          if (r.csrf && (req.headers.get("x-csrf") ?? "") !== s.csrf) return new Response(JSON.stringify({ error: "csrf" }), { status: 403, headers: { "content-type": "application/json", ...cors, ...SEC } });
          const res = await r.h(req, env, s, params);
          for (const [k, v] of Object.entries({ ...cors, ...SEC })) res.headers.set(k, v);
          return res;
        }
        return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { "content-type": "application/json", ...cors, ...SEC } });
      } catch (e) {
        console.error(`API_ERR ${path} ${(e as Error).message}`);
        return new Response(JSON.stringify({ error: "internal" }), { status: 500, headers: { "content-type": "application/json", ...cors, ...SEC } });
      }
    }

    if (path === "/health") return new Response(JSON.stringify({ ok: true, v: "0.8.0-a" }), { headers: { "content-type": "application/json", ...cors, ...SEC } });

    // البقية = أصول ساكنة (برؤوس الأمان نفسها)
    const asset = await env.ASSETS.fetch(req);
    for (const [k, v] of Object.entries(SEC)) asset.headers.set(k, v);
    return asset;
  },
};
