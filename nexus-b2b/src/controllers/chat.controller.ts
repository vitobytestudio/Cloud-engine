// ——— المحادثات وصفقات الضمان (حالات عبر D1 + بث حي عبر ChatRoom DO) ———
import type { Env, Session } from "../env";
import { notify as pushNotify } from "./features.controller";
import { rateLimit } from "../lib/rate";
import { onVisitorMessage } from "./bot.controller";

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });

async function notify(env: Env, convId: string, event: unknown): Promise<void> {
  const id = env.CHAT_ROOM.idFromName(convId);
  const stub = env.CHAT_ROOM.get(id);
  await stub.fetch("https://do.internal/notify", { method: "POST", body: JSON.stringify(event) }).catch(() => {});
}

export async function conversations(env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const rows = await env.DB.prepare(
    `SELECT c.id, c.last_message_at,
            CASE WHEN c.participant_one=? THEN c.participant_two ELSE c.participant_one END AS other_id,
            u.username, u.full_name, u.sector, u.badge_tier, u.avatar_color, u.company_name,
            (SELECT content FROM messages m WHERE m.conversation_id=c.id ORDER BY m.created_at DESC LIMIT 1) AS snippet,
            (SELECT message_type FROM messages m WHERE m.conversation_id=c.id ORDER BY m.created_at DESC LIMIT 1) AS snippet_type
     FROM conversations c JOIN users u ON u.id = (CASE WHEN c.participant_one=? THEN c.participant_two ELSE c.participant_one END)
     WHERE c.participant_one=? OR c.participant_two=?
     ORDER BY c.last_message_at DESC LIMIT 50`
  ).bind(s.userId, s.userId, s.userId, s.userId).all();
  return json({ items: rows.results ?? [] });
}

export async function openWith(req: Request, env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  // قيمة الباقة: المجاني 5 محادثات/يوم · الباقات المدفوعة 25/يوم
  const tierRow = await env.DB.prepare("SELECT badge_tier FROM users WHERE id=?").bind(s.userId).first<{ badge_tier: string }>();
  const convCap = tierRow && tierRow.badge_tier !== "FREE" ? 25 : 5;
  if (!(await rateLimit(env, `conv:${s.userId}`, convCap, 86400))) return json({ error: "daily_limit" }, 429);
  const b = (await req.json().catch(() => ({}))) as { username?: string };
  const uname = (p.username ?? b.username ?? "").trim();
  const other = await env.DB.prepare("SELECT id FROM users WHERE username=?").bind(uname).first<{ id: string }>();
  if (!other || other.id === s.userId) return json({ error: "not_found" }, 404);
  const a = s.userId < other.id ? s.userId : other.id;
  const z = s.userId < other.id ? other.id : s.userId;
  const ex = await env.DB.prepare("SELECT id FROM conversations WHERE participant_one=? AND participant_two=?").bind(a, z).first<{ id: string }>();
  if (ex) return json({ ok: true, id: ex.id });
  const id = `c-${crypto.randomUUID().slice(0, 12)}`;
  await env.DB.prepare("INSERT INTO conversations (id,participant_one,participant_two) VALUES (?,?,?)").bind(id, a, z).run();
  return json({ ok: true, id }, 201);
}

export async function messages(env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const c = await env.DB.prepare("SELECT participant_one, participant_two FROM conversations WHERE id=?").bind(p.id)
    .first<{ participant_one: string; participant_two: string }>();
  if (!c || (c.participant_one !== s.userId && c.participant_two !== s.userId)) return json({ error: "forbidden" }, 403);
  const rows = await env.DB.prepare(
    `SELECT m.*, u.username, u.full_name, u.avatar_color, (bm.message_id IS NOT NULL) AS via_bot
     FROM messages m JOIN users u ON u.id=m.sender_id
     LEFT JOIN bot_messages bm ON bm.message_id=m.id
     WHERE m.conversation_id=? ORDER BY m.created_at ASC LIMIT 200`
  ).bind(p.id).all();
  return json({ items: rows.results ?? [], me: s.userId });
}

export async function send(req: Request, env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  if (!(await rateLimit(env, `msg:${s.userId}`, 30, 60))) return json({ error: "too_many" }, 429);
  const c = await env.DB.prepare("SELECT participant_one, participant_two FROM conversations WHERE id=?").bind(p.id)
    .first<{ participant_one: string; participant_two: string }>();
  if (!c || (c.participant_one !== s.userId && c.participant_two !== s.userId)) return json({ error: "forbidden" }, 403);
  const b = (await req.json().catch(() => ({}))) as { content?: string; type?: string; deal_title?: string; deal_amount_cents?: number; deal_delivery_days?: number; deal_revisions?: number; deal_vat?: string };
  const type = ["TEXT", "PROPOSAL", "PAYMENT_REQUEST", "SAMPLE_ORDER"].includes(b.type ?? "") ? b.type! : "TEXT";
  const content = (b.content ?? "").slice(0, 1000);
  if (type === "TEXT" && !content.trim()) return json({ error: "empty" }, 400);
  const id = `m-${crypto.randomUUID().slice(0, 12)}`;
  await env.DB.prepare(
    `INSERT INTO messages (id,conversation_id,sender_id,content,message_type,deal_title,deal_amount_cents,deal_delivery_days,deal_revisions,deal_vat,deal_status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(id, p.id, s.userId, content, type,
    type === "TEXT" ? "" : (b.deal_title ?? "").slice(0, 160),
    type === "TEXT" ? null : Math.max(0, Math.round(b.deal_amount_cents ?? 0)),
    type === "TEXT" ? null : Math.min(180, Math.max(1, Math.round(b.deal_delivery_days ?? 5))),
    type === "TEXT" ? null : Math.min(10, Math.max(0, Math.round(b.deal_revisions ?? 2))),
    type === "TEXT" ? null : (b.deal_vat === "incl" ? "incl" : b.deal_vat === "reverse" ? "reverse" : "excl"),
    type === "TEXT" ? null : "PENDING").run();
  await env.DB.prepare("UPDATE conversations SET last_message_at=datetime('now') WHERE id=?").bind(p.id).run();
  const partner = c.participant_one === s.userId ? c.participant_two : c.participant_one;
  await pushNotify(env, partner, s.userId, "message", "conversation", p.id);
  const full = await env.DB.prepare(
    "SELECT m.*, u.username, u.full_name, u.avatar_color FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.id=?"
  ).bind(id).first();
  await notify(env, p.id, { t: "msg", message: full });
  // ——— v0.10-B: بوت الطرف الآخر يرد فوراً على زوّار صفحته (جاهز عند المفتاح) ———
  if (type === "TEXT" && partner !== s.userId) {
    await onVisitorMessage(env, p.id, partner, s.userId, content);
  }
  const full2 = await env.DB.prepare(
    "SELECT m.*, u.username, u.full_name, u.avatar_color FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.id=?"
  ).bind(id).first();
  return json({ ok: true, message: full2 }, 201);
}

export async function dealAction(req: Request, env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const b = (await req.json().catch(() => ({}))) as { action?: string };
  const m = await env.DB.prepare(
    `SELECT m.*, c.participant_one, c.participant_two FROM messages m JOIN conversations c ON c.id=m.conversation_id WHERE m.id=?`
  ).bind(p.id).first<{ sender_id: string; participant_one: string; participant_two: string; conversation_id: string; deal_status: string | null; deal_amount_cents: number | null; deal_title: string }>();
  if (!m || !m.deal_status) return json({ error: "not_found" }, 404);
  const isRecipient = s.userId !== m.sender_id;
  if (!isRecipient) return json({ error: "only_recipient" }, 403);
  if (m.deal_status !== "PENDING") return json({ error: "not_pending" }, 409);
  if (b.action === "request_edit") {
    // طلب تعديل: لا يغيّر الحالة — إشعار للمرسل بطلب المراجعة
    const sender = m.sender_id;
    await pushNotify(env, sender, s.userId, "deal_edit", "conversation", m.conversation_id);
    return json({ ok: true, edit_requested: true });
  }
  if (b.action === "decline") {
    await env.DB.prepare("UPDATE messages SET deal_status='DECLINED' WHERE id=?").bind(p.id).run();
  } else if (b.action === "accept") {
    // مرحلة الضمان الأولى: قفل محاسبي في الدفتر (Stub) — الربط الفعلي بـStripe Connect عند إدخال المفاتيح
    await env.DB.prepare("UPDATE messages SET deal_status='ESCROWED' WHERE id=?").bind(p.id).run();
    await env.DB.prepare(
      `INSERT OR IGNORE INTO transactions (id,user_id,kind,amount_cents,ref_type,ref_id,provider_event_id)
       VALUES (?,?,?,?,?,?,?)`
    ).bind(`tx-${crypto.randomUUID().slice(0, 10)}`, s.userId, "ESCROW_LOCK", -(m.deal_amount_cents ?? 0), "DEAL", p.id,
      `stub_escrow_${p.id}`).run();
  } else return json({ error: "bad_action" }, 400);
  const updated = await env.DB.prepare(
    "SELECT m.*, u.username, u.full_name, u.avatar_color FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.id=?"
  ).bind(p.id).first();
  await notify(env, m.conversation_id, { t: "deal", message: updated });
  return json({ ok: true, message: updated });
}
