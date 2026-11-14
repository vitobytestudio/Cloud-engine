export type Plan = "free" | "pro" | "vip";
export type Session = { userId: string; csrf: string; exp: number };

export interface Env {
  DB: D1Database;
  CACHE_KV: KVNamespace;
  ASSETS: Fetcher;
  ENVIRONMENT: string;
  ADMIN_K0?: string;
  ADMIN_PATH_SECRET?: string;
  ADMIN_SETUP_TOKEN?: string; /* صفحة الإعداد لا تُعرض على المنصة الرسمية — تُفتح من /setup/<توكن> حصراً بأمر المالك */
  AI_KEYS?: string;
  NAKSAB_ORIGIN?: string; /* مصدر كتالوج المحترفين — جسر ناكساب */
}
