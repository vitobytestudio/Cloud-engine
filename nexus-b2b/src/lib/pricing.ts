// ——— مصدر الأسعار الوحيد (الخادم هو من يسعّر — لا ثقة بالمتصفح) ———
export type BoostTier = {
  name: "FLASH_DROP" | "TARGET_BOOST" | "DOMINANCE_DROP";
  price_cents: number;
  impressions: number;
  hours: number;
  geo: boolean;
};

export const BOOST_CATALOG: Record<string, BoostTier> = {
  FLASH_DROP:     { name: "FLASH_DROP",     price_cents: 1900,  impressions: 5000,  hours: 6,  geo: false },
  TARGET_BOOST:   { name: "TARGET_BOOST",   price_cents: 4900,  impressions: 12000, hours: 24, geo: true  },
  DOMINANCE_DROP: { name: "DOMINANCE_DROP", price_cents: 12900, impressions: 15000, hours: 48, geo: true  },
};

export const ARTIFACT_LABELS: Record<string, string> = {
  GITHUB_REPO: "مستودع تقني",
  FIGMA_FILE: "ملف تصميم",
  STORE_LINK: "رابط متجر",
  AUDIT_DOC: "وثيقة تدقيق",
  CASE_METRIC: "مقاييس موثقة",
};

export const CATEGORY_LABELS: Record<string, string> = {
  SHOWCASE: "عرض عمل",
  REVENUE_WIN: "نجاح مالي",
  PRODUCT_DEMO: "عرض منتج",
  WORKFLOW_HACK: "أتمتة وأدوات",
  CASE_STUDY: "دراسة حالة",
};
