// ——— NEXUS B2B: نقطة الدخول — توجيه REST + ترقية WebSocket + أصول الواجهة ———
import type { Env, Session } from "./env";
import { getSessionData, parseCookies } from "./lib/auth";
import { rateLimit, clientIp } from "./lib/rate";
import * as auth from "./controllers/auth.controller";
import * as feed from "./controllers/feed.controller";
import * as stream from "./controllers/stream.controller";
import * as stories from "./controllers/stories.controller";
import * as profiles from "./controllers/profiles.controller";
import * as chat from "./controllers/chat.controller";
import * as boost from "./controllers/boost.controller";
import * as accounts from "./controllers/accounts.controller";
import * as features from "./controllers/features.controller";
import { ChatRoom } from "./durable-objects/ChatRoom";

export { ChatRoom };

type Params = Record<string, string>;
type Handler = (req: Request, env: Env, s: Session, p: Params) => Promise<Response>;

const routes: Array<{ m: string; pat: string; h: Handler; auth?: boolean; csrf?: boolean; limit?: [number, number] }> = [
  { m: "GET",    pat: "/api/me",                        h: (r, e, s) => auth.me(e, s) },
  { m: "POST",   pat: "/api/auth/register",             h: auth.register,           limit: [5, 3600] },
  { m: "POST",   pat: "/api/auth/login",                h: auth.login,              limit: [8, 900] },
  { m: "POST",   pat: "/api/auth/demo-login",           h: auth.demoLogin,          limit: [20, 3600] },
  { m: "POST",   pat: "/api/auth/logout",               h: auth.logout,             csrf: true },
  { m: "POST",   pat: "/api/account/tier",              h: accounts.updateTier,     auth: true, csrf: true, limit: [15, 3600] },
  { m: "POST",   pat: "/api/account/sector",            h: accounts.updateSector,   auth: true, csrf: true, limit: [15, 3600] },
  { m: "GET",    pat: "/api/analytics",                 h: features.analytics,      auth: true },
  { m: "GET",    pat: "/api/search",                    h: features.search },
  { m: "GET",    pat: "/api/pulse",                     h: features.pulse },
  { m: "GET",    pat: "/api/notifications",             h: features.notifications,  auth: true },
  { m: "POST",   pat: "/api/notifications/read",        h: features.readAll,        auth: true, csrf: true },
  { m: "POST",   pat: "/api/follow/:username",          h: features.follow,         auth: true, csrf: true, limit: [40, 3600] },
  { m: "GET",    pat: "/api/samples/incoming",          h: features.incomingSamples, auth: true },
  { m: "POST",   pat: "/api/samples/:id",               h: features.requestSample,  auth: true, csrf: true, limit: [20, 3600] },
  { m: "POST",   pat: "/api/samples/action/:id",        h: features.sampleAction,   auth: true, csrf: true, limit: [30, 3600] },
  { m: "GET",    pat: "/api/feed",                      h: feed.feed },
  { m: "POST",   pat: "/api/posts",                     h: profiles.createPost,     auth: true, csrf: true, limit: [3, 3600] },
  { m: "POST",   pat: "/api/posts/:id/vote",            h: feed.vote,               auth: true, csrf: true, limit: [30, 60] },
  { m: "POST",   pat: "/api/posts/:id/save",            h: feed.save,               auth: true, csrf: true, limit: [30, 60] },
  { m: "POST",   pat: "/api/posts/:id/view",            h: feed.view,               limit: [120, 60] },
  { m: "GET",    pat: "/api/stories",                   h: (r, e, s) => stories.list(e, s) },
  { m: "POST",   pat: "/api/stories",                   h: stories.create,          auth: true, csrf: true, limit: [8, 3600] },
  { m: "POST",   pat: "/api/stories/:id/view",          h: stories.view,            auth: true },
  { m: "GET",    pat: "/api/profile/:username",         h: (r, e, s, p) => profiles.profile(e, s, p) },
  { m: "POST",   pat: "/api/stream/direct-upload",      h: stream.directUpload,     auth: true, csrf: true, limit: [10, 3600] },
  { m: "PUT",    pat: "/api/stream/upload/:media_id",   h: stream.uploadPut,        auth: true, limit: [12, 3600] },
  { m: "GET",    pat: "/media/:id",                     h: (r, e, s, p) => stream.mediaGet(e, p.id) },
  { m: "GET",    pat: "/api/chat/conversations",        h: (r, e, s) => chat.conversations(e, s), auth: true },
  { m: "POST",   pat: "/api/chat/open/:username",       h: chat.openWith,           auth: true, csrf: true, limit: [5, 86400] },
  { m: "GET",    pat: "/api/chat/:id/messages",         h: (r, e, s, p) => chat.messages(e, s, p), auth: true },
  { m: "POST",   pat: "/api/chat/:id/messages",         h: chat.send,               auth: true, csrf: true, limit: [30, 60] },
  { m: "POST",   pat: "/api/deal/:id/action",           h: chat.dealAction,         auth: true, csrf: true, limit: [20, 60] },
  { m: "POST",   pat: "/api/boost/checkout",            h: boost.checkout,          auth: true, csrf: true, limit: [5, 3600] },
  { m: "GET",    pat: "/api/wallet",                    h: (r, e, s) => boost.wallet(e, s), auth: true },
  { m: "POST",   pat: "/api/presence",                  h: presence,                limit: [120, 60] },
  { m: "GET",    pat: "/api/presence",                  h: presenceCount },
];

function match(pat: string, path: string): Params | null {
  const a = pat.split("/"), b = path.split("/");
  if (a.length !== b.length) return null;
  const params: Params = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

async function presence(req: Request, env: Env, s: Session): Promise<Response> {
  const key = `pres:${s.userId ?? clientIp(req)}`;
  await env.CACHE_KV.put(key, "1", { expirationTtl: 300 });
  return new Response("ok", { headers: { "content-type": "text/plain" } });
}

async function presenceCount(_req: Request, env: Env): Promise<Response> {
  const list = await env.CACHE_KV.list({ prefix: "pres:" });
  return new Response(JSON.stringify({ online: Math.min(list.keys.length, 500) }), { headers: { "content-type": "application/json" } });
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    // ترقية WebSocket → غرفة المحادثة
    if (path.startsWith("/api/ws/chat/")) {
      const convId = path.split("/").pop() ?? "";
      const stub = env.CHAT_ROOM.get(env.CHAT_ROOM.idFromName(convId));
      return stub.fetch(req);
    }

    if (path.startsWith("/api/") || path.startsWith("/media/")) {
      for (const r of routes) {
        if (r.m !== req.method) continue;
        const params = match(r.pat, path);
        if (!params) continue;

        const cookies = parseCookies(req);
        const sd = await getSessionData(env, cookies["nx_s"] ?? null);
        const s: Session = { token: cookies["nx_s"] ?? null, csrf: sd?.csrf ?? null, userId: sd?.userId ?? null };

        if (r.auth && !s.userId) return json({ error: "auth_required" }, 401);
        if (r.csrf && s.token) {
          const hdr = req.headers.get("x-csrf") ?? "";
          if (!s.csrf || hdr !== s.csrf) return json({ error: "csrf" }, 403);
        }
        if (r.limit) {
          const key = `${r.pat}:${s.userId ?? clientIp(req)}`;
          if (!(await rateLimit(env, key, r.limit[0], r.limit[1]))) return json({ error: "too_many" }, 429);
        }
        try {
          return await r.h(req, env, s, params);
        } catch (e) {
          return json({ error: "server_error" }, 500);
        }
      }
      return json({ error: "not_found" }, 404);
    }

    // الأصول الثابتة (SPA)
    return env.ASSETS.fetch(req);
  },
};

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}
