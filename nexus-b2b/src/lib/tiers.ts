// ——— سلّم الباقات: الرتبة والحدود — مصدر الحقيقة للإغلاق والفتح ———
export const TIER_RANK: Record<string, number> = {
  FREE: 0,
  PRO_TALENT: 1,
  MERCHANT_EMERALD: 2,
  ENTERPRISE_GOLD: 3,
};
export const atLeast = (tier: string, min: string) => (TIER_RANK[tier] ?? 0) >= (TIER_RANK[min] ?? 99);
export const CHAT_DAILY = { FREE: 5, PAID: 25 } as const;
