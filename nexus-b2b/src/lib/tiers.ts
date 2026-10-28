// ——— v0.10-B: باقات الاشتراك، رتب الأولوية، حصص البوت، الهدية — مصدر الحقيقة الوحيد ———
import type { Env } from "../env";

export type PlanId = "PRO_TALENT" | "MERCHANT_EMERALD" | "ENTERPRISE_GOLD";

// أزرق 14€ · زمردي 39€ · ذهبي 119€ — السنوي بخصم 20%
export const PLAN_PRICES: Record<PlanId, { monthly: number; yearly: number }> = {
  PRO_TALENT: { monthly: 1400, yearly: 13440 },
  MERCHANT_EMERALD: { monthly: 3900, yearly: 37440 },
  ENTERPRISE_GOLD: { monthly: 11900, yearly: 114240 },
};

export function isPlan(v: string): v is PlanId {
  return v === "PRO_TALENT" || v === "MERCHANT_EMERALD" || v === "ENTERPRISE_GOLD";
}

// الترتيب الخادمي: المالك(0) → ذهبي → زمردي → أزرق → البقية
export function tierRank(badge: string | null | undefined): number {
  if (badge === "ENTERPRISE_GOLD") return 1;
  if (badge === "MERCHANT_EMERALD") return 2;
  if (badge === "PRO_TALENT") return 3;
  return 4;
}

export async function getOwnerId(env: Env): Promise<string> {
  try {
    const r = await env.DB.prepare("SELECT value FROM app_config WHERE key='owner_user_id'").first<{ value: string }>();
    return r?.value ?? "";
  } catch {
    return "";
  }
}

// بوتات الباقات «جاهز عند المفتاح»: حصص يومية متدرجة
export type BotCap = { replies: boolean; offers: boolean; autopilot: boolean; quota: number };
export function botCap(badge: string | null | undefined): BotCap {
  if (badge === "ENTERPRISE_GOLD") return { replies: true, offers: true, autopilot: true, quota: 150 };
  if (badge === "MERCHANT_EMERALD") return { replies: true, offers: true, autopilot: false, quota: 40 };
  if (badge === "PRO_TALENT") return { replies: true, offers: false, autopilot: false, quota: 10 };
  return { replies: false, offers: false, autopilot: false, quota: 0 };
}

// هدية NEXUS: رصيد داخلي ملك المستخدم — يصرف على الترويج فقط وينتهي بعد 90 يوماً
export const GIFT_CENTS = 15000;
export const GIFT_DAYS = 90;
export const GIFT_MIN_POSTS = 2;

export const isDev = (env: Env): boolean => env.ENVIRONMENT !== "production";

// سلّم الباقات للبوابات (v0.4+): هل تكفي الباقة الحالية للميزة المطلوبة؟
const LADDER = ["FREE", "PRO_TALENT", "MERCHANT_EMERALD", "ENTERPRISE_GOLD"];
export function atLeast(tier: string | null | undefined, need: string): boolean {
  return LADDER.indexOf(tier ?? "FREE") >= LADDER.indexOf(need);
}
