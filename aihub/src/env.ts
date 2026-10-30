export type Env = {
  DB: D1Database;
  CACHE_KV: KVNamespace;
  ASSETS: Fetcher;
  AI?: unknown; // ربط Workers AI — الإنتاج فقط (التطوير بلا شبكة يعيد خطأ لطيفاً)
  ENVIRONMENT: string;
  AUTH_PEPPER?: string;
};

export type Session = { token: string | null; csrf: string | null; userId: string | null };
