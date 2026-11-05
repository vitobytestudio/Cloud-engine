export type Session = { userId: string; csrf: string; exp: number };

export interface Env {
  DB: D1Database;
  CACHE_KV: KVNamespace;
  ASSETS: Fetcher;
  ENVIRONMENT: string;
  ADMIN_K0?: string;
}
