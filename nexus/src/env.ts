export interface Env {
  DB: D1Database;
  CACHE_KV: KVNamespace;
  ASSETS: Fetcher;
  ENVIRONMENT: string;
}
export interface Session {
  userId: string;
  role: string;
  csrf: string;
}
