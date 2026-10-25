import { Hono } from "hono";
import type { Env } from "../env";
import { createSession, destroySession, verifyLogin, createUser, rateLimit, audit, clientIpHash, getCookie, setCookie, sha256Hex } from "../lib/auth";

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.post("/api/auth/register", async (c) => {
  if (!(await rateLimit(c, "reg:" + (await clientIpHash(c)), 5, 3600_000)))
    return c.json({ error: "محاولات كثيرة — أعد المحاولة لاحقاً" }, 429);

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "طلب غير صالح" }, 400);

  const result = await createUser(c, {
    email: String(body.email ?? ""),
    name: String(body.name ?? ""),
    password: String(body.password ?? ""),
    consent: Boolean(body.consent),
  });
  if (!result.ok) return c.json({ error: result.error }, result.status as 400 | 409);

  await createSession(c, result.id);
  return c.json({ ok: true, role: result.role });
});

authRoutes.post("/api/auth/login", async (c) => {
  const ipH = await clientIpHash(c);
  if (!(await rateLimit(c, "login:" + ipH, 20, 900_000)))
    return c.json({ error: "محاولات كثيرة — أعد المحاولة بعد قليل" }, 429);

  const body = await c.req.json().catch(() => null);
  const email = String(body?.email ?? "");
  const password = String(body?.password ?? "");
  if (!email || !password) return c.json({ error: "البريد وكلمة السر مطلوبان" }, 400);

  const result = await verifyLogin(c, email, password);
  if (!result.ok) return c.json({ error: result.error }, result.status as 401 | 423);

  await createSession(c, result.user.id);
  await audit(c, result.user.id, "login", result.user.id);
  return c.json({ ok: true, user: result.user });
});

authRoutes.post("/api/auth/logout", async (c) => {
  await destroySession(c);
  return c.json({ ok: true });
});

authRoutes.get("/api/auth/csrf", async (c) => {
  const token = getCookie(c, "mirsal_session");
  if (token) {
    const row = await c.env.DB.prepare("SELECT csrf, expires_at FROM sessions WHERE id = ?1")
      .bind(await sha256Hex(token))
      .first<{ csrf: string; expires_at: number }>();
    if (row && row.expires_at > Date.now()) {
      setCookie(c, "mirsal_csrf", row.csrf, { httpOnly: false, secure: true, sameSite: "Lax", path: "/", maxAge: Math.floor((row.expires_at - Date.now()) / 1000) });
    }
  }
  return c.json({ ok: true });
});

authRoutes.get("/api/health", (c) => c.json({ ok: true, service: "mirsal", v: "2.1.0", ts: Date.now() }));
