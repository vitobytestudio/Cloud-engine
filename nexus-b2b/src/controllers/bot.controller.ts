// ——— v0.10-B: بوتات الباقات «جاهز عند المفتاح» — وكيل استقبال/مساعد مبيعات/وكيل مبيعات كامل ———
import type { Env, Session } from "../env";
import { botCap } from "../lib/tiers";
import { notify as pushNotify } from "./features.controller";

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });

async function doNotify(env: Env, convId: string, event: unknown): Promise<void> {
  const stub = env.CHAT_ROOM.get(env.CHAT_ROOM.idFromName(convId));
  await stub.fetch("https://do.internal/notify", { method: "POST", body: JSON.stringify(event) }).catch(() => {});
}

type Lang = "ar" | "en" | "fr";
function detectLang(t: string): Lang {
  if (/[\u0600-\u06FF]/.test(t)) return "ar";
  if (/\b(bonjour|prix|combien|délai|delai|offre|devis|merci|jours|oui)\b/i.test(t)) return "fr";
  return "en";
}
type Intent = "greet" | "price" | "offer" | "time" | "portfolio" | "contact" | "generic";
function detectIntent(t: string): Intent {
  const s = t.toLowerCase();
  if (/(عرض سعر|عرض|offer|quote|devis|proposal|افس)/.test(s)) return "offer";
  if (/(سعر|كم|تكلفة|ميزانية|price|cost|budget|prix|combien|tarif)/.test(s)) return "price";
  if (/(متى|مدة|أيام|وقت التسليم|deadline|délai|delai|timeline|days|jours)/.test(s)) return "time";
  if (/(أعمال|نماذج|معرض|سابقة|portfolio|références|references|samples)/.test(s)) return "portfolio";
  if (/(اجتماع|مكالمة|اتصال|رقم|هاتف|call|meeting|zoom|phone)/.test(s)) return "contact";
  if (/(مرحبا|أهلا|السلام|صباح|مساء|hello|hi\b|bonjour|صباح الخير)/.test(s)) return "greet";
  return "generic";
}
function extractBudget(t: string): number {
  const m = t.replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660)).match(/(\d[\d,\.\s]{2,12})\s*(?:€|eur|يورو|euro)?/i);
  if (!m) return 0;
  const n = Math.round(parseFloat(m[1].replace(/[\s,]/g, "")));
  return Number.isFinite(n) && n >= 100 ? Math.min(n * 100, 50_000_00) : 0;
}

type OwnerCtx = { company: string; product: string; priceC: number; days: number };

async function ownerCtx(env: Env, ownerId: string): Promise<OwnerCtx> {
  const u = await env.DB.prepare("SELECT company_name, full_name FROM users WHERE id=?").bind(ownerId)
    .first<{ company_name: string; full_name: string }>();
  const p = await env.DB.prepare("SELECT title, price_cents FROM merchant_products WHERE user_id=? ORDER BY price_cents ASC LIMIT 1")
    .bind(ownerId).first<{ title: string; price_cents: number }>();
  const sv = await env.DB.prepare("SELECT service_title, starting_price_cents, delivery_days FROM freelancer_services WHERE user_id=? ORDER BY starting_price_cents ASC LIMIT 1")
    .bind(ownerId).first<{ service_title: string; starting_price_cents: number; delivery_days: number }>();
  return {
    company: u?.company_name || u?.full_name || "",
    product: p?.title || sv?.service_title || "",
    priceC: p?.price_cents ?? sv?.starting_price_cents ?? 4900,
    days: sv?.delivery_days ?? 7,
  };
}

function replyFor(intent: Intent, lang: Lang, ctx: OwnerCtx): string {
  const price = (ctx.priceC / 100).toFixed(0);
  const prod = ctx.product || (lang === "ar" ? "باقة الانطلاق" : lang === "fr" ? "offre de départ" : "starter package");
  if (intent === "greet")
    return lang === "ar" ? `أهلاً بك في ${ctx.company}. كيف أقدر أساعدك — منتج، خدمة، أو عرض سعر؟`
      : lang === "fr" ? `Bienvenue chez ${ctx.company}. Comment puis-je aider — produit, service ou devis ?`
      : `Welcome to ${ctx.company}. How can I help — product, service, or a quote?`;
  if (intent === "price")
    return lang === "ar" ? `باقتنا «${prod}» تبدأ من ${price}€. أجهّز لك عرضاً مفصلاً بالنطاق والمدة — أخبرني بحجم حاجتك.`
      : lang === "fr" ? `Notre formule « ${prod} » démarre à ${price} €. Je prépare un devis détaillé — dites-moi votre besoin.`
      : `Our package "${prod}" starts at €${price}. I can prepare a detailed offer — tell me your scope.`;
  if (intent === "offer")
    return lang === "ar" ? `ممتاز — جهّزت عرضاً مبدئياً بناءً على ${prod}. ستجده أعلى المحادثة بعد مراجعة الإدارة فوراً.`
      : lang === "fr" ? `Parfait — j'ai préparé une proposition basée sur ${prod}. Vous la verrez dans la conversation.`
      : `Great — I prepared a starter offer based on ${prod}. You will see it in this conversation shortly.`;
  if (intent === "time")
    return lang === "ar" ? `التسليم القياسي ${ctx.days} أيام عمل، مع نافذة عاجلة للشركاء المشتركين.`
      : lang === "fr" ? `Livraison standard en ${ctx.days} jours ouvrés, créneau urgent pour les partenaires.`
      : `Standard delivery is ${ctx.days} business days, with an urgent slot for subscribed partners.`;
  if (intent === "portfolio")
    return lang === "ar" ? `كل أعمالنا الموثقة في ملفنا على الشبكة — بالفيديو وبأرقام حقيقية.`
      : lang === "fr" ? `Tous nos travaux vérifiés sont sur notre profil — en vidéo et avec des chiffres réels.`
      : `All our verified work is on our profile — in video, with real numbers.`;
  if (intent === "contact")
    return lang === "ar" ? `نرتب اجتماعاً قصيراً عبر هذه المحادثة — أخبرني باليوم والساعة المناسبين.`
      : lang === "fr" ? `Organisons un court appel ici — indiquez jour et heure.`
      : `Let's arrange a short call right here — tell me your day and time.`;
  return lang === "ar" ? `شكراً على رسالتك — وضّح لي النطاق والميزانية التقريبية وأجهّز لك العرض المناسب.`
    : lang === "fr" ? `Merci pour votre message — précisez le périmètre et le budget, je prépare l'offre.`
    : `Thanks for your message — share your scope and rough budget and I will prepare the right offer.`;
}

async function insertBotMessage(env: Env, convId: string, ownerId: string, content: string, visitorId: string): Promise<string> {
  const id = `m-${crypto.randomUUID().slice(0, 12)}`;
  await env.DB.prepare("INSERT INTO messages (id,conversation_id,sender_id,content,message_type) VALUES (?,?,?,?,'TEXT')")
    .bind(id, convId, ownerId, content.slice(0, 1000)).run();
  await env.DB.prepare("INSERT INTO bot_messages (message_id,kind) VALUES (?, 'reply')").bind(id).run();
  await env.DB.prepare("UPDATE conversations SET last_message_at=datetime('now') WHERE id=?").bind(convId).run();
  await pushNotify(env, visitorId, ownerId, "message", "conversation", convId);
  const full = await env.DB.prepare(
    "SELECT m.*, u.username, u.full_name, u.avatar_color FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.id=?"
  ).bind(id).first();
  await doNotify(env, convId, { t: "msg", message: full });
  return id;
}

async function quotaOk(env: Env, ownerId: string, quota: number): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  const r = await env.DB.prepare("SELECT used FROM bot_usage WHERE user_id=? AND day=?").bind(ownerId, day).first<{ used: number }>();
  if ((r?.used ?? 0) >= quota) return false;
  await env.DB.prepare(
    "INSERT INTO bot_usage (user_id,day,used) VALUES (?,?,1) ON CONFLICT(user_id,day) DO UPDATE SET used=used+1"
  ).bind(ownerId, day).run();
  return true;
}

// ——— الخطاف: تُستدعى بعد رسالة زائر لمالك باقة — رد فوري + عرض عند النية ———
export async function onVisitorMessage(env: Env, convId: string, ownerId: string, visitorId: string, text: string): Promise<void> {
  try {
    const badge = (await env.DB.prepare("SELECT badge_tier FROM users WHERE id=?").bind(ownerId).first<{ badge_tier: string }>())?.badge_tier ?? "FREE";
    const cap = botCap(badge);
    if (!cap.replies) return;
    if (!(await quotaOk(env, ownerId, cap.quota))) return;
    const ctx = await ownerCtx(env, ownerId);
    const lang = detectLang(text);
    const intent = detectIntent(text);
    await insertBotMessage(env, convId, ownerId, replyFor(intent, lang, ctx), visitorId);

    if (!cap.offers || (intent !== "price" && intent !== "offer")) return;
    const budget = extractBudget(text);
    const amount = budget > ctx.priceC ? budget : ctx.priceC;
    const days = ctx.days;
    const revisions = 2;
    const title = ctx.product || `عرض مخصص — ${ctx.company}`;
    let status: "PENDING_OWNER" | "AUTO_SENT" = "PENDING_OWNER";
    if (cap.autopilot) {
      const st = await env.DB.prepare("SELECT autopilot, max_price_cents, max_days, max_revisions FROM bot_settings WHERE user_id=?")
        .bind(ownerId).first<{ autopilot: number; max_price_cents: number; max_days: number; max_revisions: number }>();
      if (st?.autopilot && amount <= (st.max_price_cents || Infinity) && days <= (st.max_days || Infinity) && revisions <= (st.max_revisions || Infinity))
        status = "AUTO_SENT";
    }
    const oid = `bo-${crypto.randomUUID().slice(0, 12)}`;
    await env.DB.prepare(
      "INSERT INTO bot_offers (id,conversation_id,owner_id,visitor_id,title,amount_cents,delivery_days,revisions,status) VALUES (?,?,?,?,?,?,?,?,?)"
    ).bind(oid, convId, ownerId, visitorId, title.slice(0, 160), amount, days, revisions, status).run();
    if (status === "AUTO_SENT") {
      const mid = `m-${crypto.randomUUID().slice(0, 12)}`;
      await env.DB.prepare(
        `INSERT INTO messages (id,conversation_id,sender_id,content,message_type,deal_title,deal_amount_cents,deal_delivery_days,deal_revisions,deal_vat,deal_status)
         VALUES (?,?,?,?, 'PROPOSAL',?,?,?,?, 'excl','PENDING')`
      ).bind(mid, convId, ownerId, "", title.slice(0, 160), amount, days, revisions).run();
      await env.DB.prepare("INSERT INTO bot_messages (message_id,kind,offer_id) VALUES (?, 'offer', ?)").bind(mid, oid).run();
      await pushNotify(env, visitorId, ownerId, "message", "conversation", convId);
      const full = await env.DB.prepare(
        "SELECT m.*, u.username, u.full_name, u.avatar_color FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.id=?"
      ).bind(mid).first();
      await doNotify(env, convId, { t: "msg", message: full });
    } else {
      await pushNotify(env, ownerId, visitorId, "bot_offer", "conversation", convId);
    }
  } catch { /* البوت لا يُسقط إرسال الرسالة أبداً */ }
}

// ——— واجهة المالك: العروض المنتظرة + الاعتماد بضغطة ———
export async function offers(_req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const rows = await env.DB.prepare(
    `SELECT o.*, c.id AS conv_id, u.username AS visitor_username, u.full_name AS visitor_name, u.avatar_color AS visitor_color
     FROM bot_offers o JOIN conversations c ON c.id=o.conversation_id JOIN users u ON u.id=o.visitor_id
     WHERE o.owner_id=? ORDER BY o.created_at DESC LIMIT 30`
  ).bind(s.userId).all();
  return json({ items: rows.results ?? [] });
}

export async function approve(req: Request, env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const o = await env.DB.prepare(
    "SELECT * FROM bot_offers WHERE id=? AND owner_id=? AND status='PENDING_OWNER'"
  ).bind(p.id, s.userId).first<{ id: string; conversation_id: string; owner_id: string; visitor_id: string; title: string; amount_cents: number; delivery_days: number; revisions: number }>();
  if (!o) return json({ error: "not_found" }, 404);
  const mid = `m-${crypto.randomUUID().slice(0, 12)}`;
  await env.DB.prepare(
    `INSERT INTO messages (id,conversation_id,sender_id,content,message_type,deal_title,deal_amount_cents,deal_delivery_days,deal_revisions,deal_vat,deal_status)
     VALUES (?,?,?,?, 'PROPOSAL',?,?,?,?, 'excl','PENDING')`
  ).bind(mid, o.conversation_id, s.userId, "", o.title, o.amount_cents, o.delivery_days, o.revisions).run();
  await env.DB.prepare("INSERT INTO bot_messages (message_id,kind,offer_id) VALUES (?, 'offer', ?)").bind(mid, o.id).run();
  await env.DB.prepare("UPDATE bot_offers SET status='SENT' WHERE id=?").bind(o.id).run();
  await env.DB.prepare("UPDATE conversations SET last_message_at=datetime('now') WHERE id=?").bind(o.conversation_id).run();
  await pushNotify(env, o.visitor_id, s.userId, "message", "conversation", o.conversation_id);
  const full = await env.DB.prepare(
    "SELECT m.*, u.username, u.full_name, u.avatar_color FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.id=?"
  ).bind(mid).first();
  await doNotify(env, o.conversation_id, { t: "msg", message: full });
  return json({ ok: true, message: full }, 201);
}

export async function decline(req: Request, env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const r = await env.DB.prepare(
    "UPDATE bot_offers SET status='DECLINED' WHERE id=? AND owner_id=? AND status='PENDING_OWNER'"
  ).bind(p.id, s.userId).run();
  return json({ ok: true, declined: (r.meta.changes ?? 0) > 0 });
}

export async function getSettings(_req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const st = await env.DB.prepare("SELECT autopilot, max_price_cents, max_days, max_revisions FROM bot_settings WHERE user_id=?")
    .bind(s.userId).first();
  const day = new Date().toISOString().slice(0, 10);
  const used = await env.DB.prepare("SELECT used FROM bot_usage WHERE user_id=? AND day=?").bind(s.userId, day).first<{ used: number }>();
  return json({ settings: st ?? null, used_today: used?.used ?? 0 });
}

export async function putSettings(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const b = (await req.json().catch(() => ({}))) as { autopilot?: boolean; max_price_cents?: number; max_days?: number; max_revisions?: number };
  const price = Math.min(5000000, Math.max(0, Math.round(b.max_price_cents ?? 0)));
  const days = Math.min(180, Math.max(0, Math.round(b.max_days ?? 0)));
  const revs = Math.min(10, Math.max(0, Math.round(b.max_revisions ?? 0)));
  await env.DB.prepare(
    `INSERT INTO bot_settings (user_id,autopilot,max_price_cents,max_days,max_revisions) VALUES (?,?,?,?,?)
     ON CONFLICT(user_id) DO UPDATE SET autopilot=excluded.autopilot, max_price_cents=excluded.max_price_cents,
       max_days=excluded.max_days, max_revisions=excluded.max_revisions`
  ).bind(s.userId, b.autopilot ? 1 : 0, price, days, revs).run();
  return json({ ok: true, autopilot: !!b.autopilot });
}
