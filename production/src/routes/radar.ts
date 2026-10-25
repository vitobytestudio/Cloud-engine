import { Hono } from "hono";
import type { Env } from "../env";
import { requireAuth, rateLimit } from "../lib/auth";
import { scan, classify } from "../lib/radar";
import { randomId } from "../lib/crypto";

type Vars = { user: { id: string; email: string; name: string; role: string } };
export const radarRoutes = new Hono<{ Bindings: Env; Variables: Vars }>();

/** مسح فوري حقيقي: يبحث القنوات العامة الآن، يخزن للجميع، ويرد بالنتائج */
radarRoutes.post("/api/radar/scan", async (c) => {
  const user = c.get("user");
  const db = c.env.DB;

  const limited = await rateLimit(c, `radar:${user.id}`, 12, 3600_000);
  if (!limited) return c.json({ error: "مسحات كثيرة — انتظر قليلاً" }, 429);

  const profile = await db
    .prepare("SELECT profession_id FROM profiles WHERE user_id = ?1")
    .bind(user.id)
    .first<{ profession_id: string }>();

  const { fetched, kept } = await scan(profile?.profession_id ? [profile.profession_id] : []);

  // تخزين فوري — التفرد على source_url يمنع التكرار، والقناة الرسمية مسجلة
  const now = Date.now();
  const stmts = kept.slice(0, 40).map((h) =>
    db
      .prepare(
        `INSERT OR IGNORE INTO clients
         (id, title, excerpt, author_public, platform, source_url, keyword, location_hint, likes, comments, source, status, published_at, ingested_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,0,0,'radar','active',?9,?10)`
      )
      .bind(
        randomId("c_"),
        h.title.slice(0, 160),
        h.excerpt.slice(0, 600),
        h.author_public.slice(0, 80),
        h.platform.slice(0, 20),
        h.source_url,
        classify(h)?.keyword?.slice(0, 40) ?? "",
        null,
        h.published_at,
        now
      )
  );
  let inserted = 0;
  if (stmts.length) {
    const res = await db.batch(stmts);
    inserted = res.reduce((a: number, r) => a + (r.meta?.changes ?? 0), 0);
  }

  await c.env.DB.prepare(
    "INSERT INTO audit_log (id, actor, action, meta, created_at) VALUES (?1,?2,'radar_scan',?3,?4)"
  )
    .bind(randomId("au_"), user.id, JSON.stringify({ fetched, found: kept.length, inserted }), now)
    .run();

  return c.json({
    ok: true,
    fetched,
    matched: kept.length,
    inserted,
    samples: kept.slice(0, 5).map((h) => ({ title: h.title, source_url: h.source_url, author: h.author_public })),
  });
});
