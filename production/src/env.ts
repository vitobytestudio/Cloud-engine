export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ASSETS: Fetcher;

  // vars
  APP_NAME: string;
  PAYMENT_RIP: string;
  PAYMENT_ACCOUNT: string;
  PAYMENT_KEY: string;
  PAYMENT_HOLDER: string;

  // secrets (wrangler secret put)
  RECEIPT_ENCRYPTION_KEY: string; // 64 hex chars = 32 bytes
  INGEST_TOKEN: string;           // رمز استقبال الزبائن من الموصلات الرسمية
  ADMIN_EMAIL: string;            // أول بريد يُسجل به يحصل على صلاحية الإدارة
}
