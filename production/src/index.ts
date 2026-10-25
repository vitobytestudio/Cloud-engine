import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./env";
import { requireAuth } from "./lib/auth";
import { authRoutes } from "./routes/auth";
import { paymentRoutes } from "./routes/payments";
import { clientRoutes } from "./routes/clients";
import { adminRoutes, ingestHandler } from "./routes/admin";
import { radarRoutes } from "./routes/radar";
import { PROFESSIONS, WILAYAS } from "./lib/matching";
import { PLANS } from "./lib/plans";
import { randomId } from "./lib/crypto";

const app = new Hono<{ Bindings: Env; Variables: { user: { id: string; email: string; name: string; role: string }; csrf: string } }>();

app.use("*", cors({
  origin: (origin) => origin ?? "*", // نفس الأصل على workers.dev
  credentials: true,
}));

// المسارات العامة
app.route("/", authRoutes);

// المسارات المحمية
app.use("/api/payments/*", requireAuth);
app.use("/api/clients/*", requireAuth);
app.use("/api/radar/*", requireAuth);
app.use("/api/me/*", requireAuth);
app.use("/api/profile", requireAuth);
app.use("/api/admin/*", requireAuth);
app.use("/api/plans", async (c, next) => next()); // عامة
app.route("/", paymentRoutes);
app.route("/", clientRoutes);
app.route("/", radarRoutes);
app.route("/", adminRoutes);
app.post("/api/ingest", ingestHandler);

app.get("/api/plans", (c) =>
  c.json({
    plans: PLANS,
    payment: {
      rip: c.env.PAYMENT_RIP,
      account: c.env.PAYMENT_ACCOUNT,
      key: c.env.PAYMENT_KEY,
      holder: c.env.PAYMENT_HOLDER,
      method: "تحويل بريدي CCP — يُرفع الوصل من المنصة",
    },
  })
);

app.get("/api/meta", (c) =>
  c.json({ professions: PROFESSIONS.map((p) => ({ id: p.id, label: p.label })), wilayas: WILAYAS })
);

app.put("/api/profile", async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => null);
  const professionId = String(body?.profession_id ?? "");
  if (professionId && !PROFESSIONS.some((p) => p.id === professionId))
    return c.json({ error: "تخصص غير معروف" }, 400);

  const wilayas: string[] = Array.isArray(body?.wilayas) && body.wilayas.length
    ? body.wilayas.filter((w: unknown) => typeof w === "string").slice(0, 12)
    : ["كل الولايات"];
  const keywords: string[] = Array.isArray(body?.keywords)
    ? body.keywords.filter((k: unknown) => typeof k === "string" && k.trim()).map((k: string) => k.trim().slice(0, 30)).slice(0, 20)
    : [];

  await c.env.DB.prepare(
    `UPDATE profiles SET profession_id = ?2, keywords_json = ?3, wilayas_json = ?4, setup_done = ?5 WHERE user_id = ?1`
  )
    .bind(user.id, professionId, JSON.stringify(keywords), JSON.stringify(wilayas), professionId ? 1 : 0)
    .run();

  await c.env.DB.prepare(
    "INSERT INTO audit_log (id, actor, action, target, created_at) VALUES (?1,?2,'profile_updated',?3,?4)"
  ).bind(randomId("au_"), user.id, professionId || "none", Date.now()).run();

  return c.json({ ok: true });
});

// الصفحة والواجهة — SPA fallback لأي مسار غير API
app.get("/", (c) => c.env.ASSETS.fetch(c.req.raw));

app.notFound((c) => {
  if (c.req.path.startsWith("/api/")) return c.json({ error: "غير موجود" }, 404);
  return c.env.ASSETS.fetch(new Request(new URL("/index.html", c.req.url).toString(), { headers: c.req.raw.headers }));
});

export default {
  fetch: app.fetch,

  // الصيانة الدورية: حذف الزبائن الأقدم من 72 ساعة (الجديد فقط) + إبطال الاشتراكات المنتهية
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    const now = Date.now();
    ctx.waitUntil(
      (async () => {
        const clients = await env.DB.prepare("DELETE FROM clients WHERE published_at < ?1").bind(now - 72 * 3600_000).run();
        const subs = await env.DB.prepare("UPDATE subscriptions SET status = 'expired', updated_at = ?2 WHERE renews_at < ?1 AND status = 'active'").bind(now, now).run();
        const sessions = await env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?1").bind(now).run();
        await env.DB.prepare(
          "INSERT INTO audit_log (id, actor, action, meta, created_at) VALUES (?1,'system','cron_cleanup',?2,?3)"
        )
          .bind(randomId("au_"), JSON.stringify({ clients: clients.meta.changes, expired_subs: subs.meta.changes, sessions: sessions.meta.changes }), now)
          .run();
      })()
    );
  },
} satisfies ExportedHandler<Env>;
