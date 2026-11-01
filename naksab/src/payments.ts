// ——— NAKSAB Payments & Fraud Protection — قواعد حتمية خالصة (لا AI، لا SMS، لا بيانات دخول) ———
// الوحدة خاملة كلياً حتى يرفع المالك payments_enabled من لوحته.
import type { Env } from "./env";
import { getSetting } from "./lib";

export const PAY_STATES = ["pending", "confirmed", "rejected", "refunded", "expired"] as const;
export type PayState = (typeof PAY_STATES)[number];
// آلة حالات صارمة: أي انتقال خارج الجدول يُرفض
const TRANSITIONS: Record<PayState, PayState[]> = {
  pending: ["confirmed", "rejected", "expired"],
  confirmed: ["refunded"],
  rejected: [],
  refunded: [],
  expired: [],
};
export const canTransit = (from: PayState, to: PayState): boolean => (TRANSITIONS[from] ?? []).includes(to);

// المرجع الفريد: NK- + زمن قاعدة36 + عشوائي — يولّده الخادم حصراً (العميل لا يقترح مراجع)
export const genReference = (randHex: string): string => `NK-${Date.now().toString(36).toUpperCase()}${randHex.slice(0, 6).toUpperCase()}`;
export const REF_RE = /^NK-[A-Z0-9]{10,24}$/;

export async function paymentsEnabled(env: Env): Promise<boolean> {
  return (await getSetting(env, "payments_enabled", "0")) === "1";
}

// تحقق مبلغ مضبوط: تطابق تام بالدينار — لا تسامح
export const amountExact = (a: number, b: number): boolean => Number(a) === Number(b) && Number(a) > 0;

// توقيع Webhook: HMAC-SHA256 توقيت-آمن — الطلبات غير الموقعة ترفض قبل أي معالجة
export async function verifyWebhookSig(rawBody: string, signature: string, secret: string): Promise<boolean> {
  if (!signature || !secret) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const hexs = [...new Uint8Array(sig)].map((x) => x.toString(16).padStart(2, "0")).join("");
  if (signature.length !== hexs.length) return false;
  let r = 0;
  for (let i = 0; i < hexs.length; i++) r |= hexs.charCodeAt(i) ^ signature.charCodeAt(i);
  return r === 0;
}

export async function finAudit(env: Env, actor: string, action: string, paymentId = "", detail = ""): Promise<void> {
  await env.DB.prepare("INSERT INTO financial_audit (id, at, actor, action, payment_id, detail) VALUES (?,?,?,?,?,?)")
    .bind(`fa-${crypto.randomUUID().slice(0, 18)}`, Date.now(), actor, action, paymentId, detail.slice(0, 300)).run();
}

// Idempotency: مفتاح ثابت لنيّة الشراء (مستخدم+خطة+اليوم) — الضغط المتكرر يعيد العملية الأصلية
export const idemKeyOf = (userId: string, kind: string, plan: string): string => `${userId}:${kind}:${plan}:${new Date().toISOString().slice(0, 10)}`;

// قواعد مخاطرة حتمية — تُرجع أعلاماً؛ 2+ أعلام = تعليق يدوي للمراجعة (لا تأكيد آلي)
// ملاحظة العتبة: سقف الشحن 5,000 رصيد = 15,000دج كحد أقصى، فـ"العملية الكبيرة" هنا = 10,000دج+ (وليس 50k غير القابلة للتحقيق)
export type RiskCtx = { userPayments24h: number; userConfirmedTotal: number; amount: number; accountAgeH: number };
export function riskFlags(c: RiskCtx): string[] {
  const f: string[] = [];
  if (c.userPayments24h >= 5) f.push("velocity_high");
  if (c.userConfirmedTotal === 0 && c.amount >= 10000) f.push("first_large");
  if (c.accountAgeH < 1) f.push("account_fresh");
  return f;
}
