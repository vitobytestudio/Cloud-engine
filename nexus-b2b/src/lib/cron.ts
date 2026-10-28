// ——— v0.10-B: الحكّامة اليومية — إستشفاء حقيقي (ستوريات/رفعات/أرصدة/اشتراكات/داعمون/ملخصات) ———
import type { Env } from "../env";

export type CronOpts = {
  devBackdateStoryHours?: number;
  devBackdateGrantsDays?: number;
  devBackdateSubsDays?: number;
  forceWeekly?: boolean;
};

export async function runDaily(env: Env, o: CronOpts = {}): Promise<Record<string, number>> {
  const out: Record<string, number> = {};

  // خطاف تطوير فقط: إرجاع الزمن لاختبار الانتهاء (لا يعمل في الإنتاج أبداً)
  const isDev = env.ENVIRONMENT !== "production";
  if (isDev && o.devBackdateStoryHours) {
    await env.DB.prepare("UPDATE stories SET expires_at=datetime('now', ?) WHERE expires_at > datetime('now')")
      .bind(`-${o.devBackdateStoryHours} hours`).run();
  }
  if (isDev && o.devBackdateGrantsDays) {
    await env.DB.prepare("UPDATE credit_grants SET expires_at=datetime('now', ?) WHERE status='ACTIVE'")
      .bind(`-${o.devBackdateGrantsDays} days`).run();
  }
  if (isDev && o.devBackdateSubsDays) {
    await env.DB.prepare("UPDATE subscriptions SET renews_at=datetime('now', ?) WHERE status IN ('ACTIVE','CANCELED')")
      .bind(`-${o.devBackdateSubsDays} days`).run();
  }

  // 1) قصّ الستوريات المنتهية مع مشاهداتها
  const st = await env.DB.prepare(
    "DELETE FROM story_views WHERE story_id IN (SELECT id FROM stories WHERE expires_at < datetime('now'))"
  ).run();
  const st2 = await env.DB.prepare("DELETE FROM stories WHERE expires_at < datetime('now')").run();
  out.stories_trimmed = st2.meta.changes ?? 0;

  // 2) تنظيف رفعات الوسائط اليتيمة (48 ساعة بلا نشر)
  const up = await env.DB.prepare(
    "DELETE FROM pending_uploads WHERE created_at < datetime('now','-48 hours')"
  ).run();
  out.uploads_purged = up.meta.changes ?? 0;

  // 3) إطفاء الأرصدة المنتهية (الهدية = 90 يوماً)
  const gr = await env.DB.prepare(
    "UPDATE credit_grants SET status='EXPIRED' WHERE status='ACTIVE' AND expires_at < datetime('now')"
  ).run();
  out.grants_expired = gr.meta.changes ?? 0;

  // 4) انتهاء الاشتراكات + تخفيض الباقة (المنتهي فقط)
  const sx = await env.DB.prepare(
    "UPDATE subscriptions SET status='EXPIRED' WHERE status IN ('ACTIVE','CANCELED') AND renews_at < datetime('now')"
  ).run();
  out.subs_expired = sx.meta.changes ?? 0;
  if ((sx.meta.changes ?? 0) > 0) {
    await env.DB.prepare(
      `UPDATE users SET badge_tier='FREE'
       WHERE badge_tier != 'FREE'
         AND id NOT IN (SELECT user_id FROM subscriptions WHERE status='ACTIVE' AND renews_at >= datetime('now'))
         AND id IN (SELECT user_id FROM subscriptions WHERE status='EXPIRED')`
    ).run();
  }

  // 5) النمو الذكي للداعمين: تنشئة تدريجية — 40 أساس + 1 كل 3 أيام من الاحتياط
  const epoch = (await env.DB.prepare("SELECT value FROM app_config WHERE key='supporters_epoch'").first<{ value: string }>())?.value
    ?? new Date().toISOString().slice(0, 10);
  const days = Math.max(0, Math.floor((Date.now() - Date.parse(epoch + "T00:00:00Z")) / 86400000));
  const allowed = 40 + Math.floor(days / 3);
  const act = await env.DB.prepare("SELECT COUNT(*) AS c FROM supporter_pool WHERE active=1").first<{ c: number }>();
  let activated = 0;
  let active = act?.c ?? 0;
  while (active < allowed) {
    const next = await env.DB.prepare(
      "SELECT username FROM supporter_pool WHERE active=0 ORDER BY username LIMIT 1"
    ).first<{ username: string }>();
    if (!next) break;
    await env.DB.prepare("UPDATE supporter_pool SET active=1, activated_at=datetime('now') WHERE username=?").bind(next.username).run();
    active++;
    activated++;
  }
  out.supporters_activated = activated;
  out.supporters_active = active;

  // 6) ملخص أسبوعي لأصحاب الذهبية (يوم الاثنين أو إجبار تطويري)
  const dow = new Date().getUTCDay();
  if (o.forceWeekly || dow === 1) {
    const golds = await env.DB.prepare("SELECT id FROM users WHERE badge_tier='ENTERPRISE_GOLD'").all<{ id: string }>();
    let sent = 0;
    for (const g of golds.results ?? []) {
      const views = await env.DB.prepare(
        `SELECT COALESCE(SUM(s.views),0) AS v FROM post_stats_daily s JOIN posts p ON p.id=s.post_id
         WHERE p.user_id=? AND s.day >= date('now','-7 days')`
      ).bind(g.id).first<{ v: number }>();
      const convs = await env.DB.prepare(
        "SELECT COUNT(*) AS c FROM conversations WHERE participant_one=? OR participant_two=?"
      ).bind(g.id, g.id).first<{ c: number }>();
      const offers = await env.DB.prepare(
        "SELECT COUNT(*) AS c FROM bot_offers WHERE owner_id=? AND status IN ('SENT','AUTO_SENT') AND created_at >= datetime('now','-7 days')"
      ).bind(g.id).first<{ c: number }>();
      await env.DB.prepare("INSERT INTO notifications (id,user_id,kind,ref_type,ref_id) VALUES (?,?,?,?,?)")
        .bind(`n-wk-${crypto.randomUUID().slice(0, 10)}`, g.id, "weekly_summary", "report",
          JSON.stringify({ views: views?.v ?? 0, conversations: convs?.c ?? 0, offers: offers?.c ?? 0 })).run();
      sent++;
    }
    out.weekly_summaries = sent;
  }

  // تدوير الجلسات: TTL الـ30 يوماً في KV يتكفل تلقائياً — نسجّل الحدث للتدقيق
  out.session_policy = 30;
  return out;
}
