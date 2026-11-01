export type Env = {
  DB: D1Database;
  CACHE_KV: KVNamespace;
  ASSETS: Fetcher;
  ENVIRONMENT: string;
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  ADMIN_BOOTSTRAP_EMAIL?: string;
};

export type Session = { userId: string; role: string; csrf: string } | null;
