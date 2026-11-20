export type Plan = "free" | "pro" | "vip";
export type Session = { userId: string; csrf: string; exp: number };

export interface Env {
  DB: D1Database;
  CACHE_KV: KVNamespace;
  ASSETS: Fetcher;
  ENVIRONMENT: string;
  ADMIN_K0?: string;
  ADMIN_PATH_SECRET?: string;
  ADMIN_SETUP_TOKEN?: string;
  ADMIN_SETUP_WINDOW_END?: string; /* نافذة إعداد مؤقتة بأمر المالك: نهاية النافذة (epoch ms) — تنقضي ذاتياً وتموت نهائياً بعد إنشاء المالك */ /* صفحة الإعداد لا تُعرض على المنصة الرسمية — تُفتح من /setup/<توكن> حصراً بأمر المالك */
  AI_KEYS?: string;
  NAKSAB_ORIGIN?: string;
  GH_VDB_TOKEN?: string; /* مرآة الأقراص الأبدية — توكن أرشيف المستودع */
  GH_VDB_REPO?: string; /* owner/name */ /* مصدر كتالوج المحترفين — جسر ناكساب */
  VBS_RELAY_TOKEN?: string; /* عقدة الأتمتة السحابية — توكن مشترك حصري */
  VBS_SESSION_KEY?: string; /* مفتاح تشفير جلسات Flow (64 hex = 32 بايت) */
  VBS_RELAY_ORIGIN?: string; /* أصل عقدة الربط/التنفيذ — https://host:port */
}
