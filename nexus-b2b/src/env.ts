export type Env = {
  DB: D1Database;
  CACHE_KV: KVNamespace;
  CHAT_ROOM: DurableObjectNamespace;
  ASSETS: Fetcher;
  AUTH_PEPPER?: string;
  ENVIRONMENT?: string;
  CF_ACCOUNT_ID?: string;
  STREAM_API_TOKEN?: string;
};

export type Session = {
  token: string | null;
  csrf: string | null;
  userId: string | null;
};

export type UserRow = {
  id: string;
  email: string;
  username: string;
  full_name: string;
  sector: "FOUNDER" | "MERCHANT" | "FREELANCER";
  badge_tier: "FREE" | "PRO_TALENT" | "MERCHANT_EMERALD" | "ENTERPRISE_GOLD";
  country_code: string;
  locale: string;
  avatar_color: string;
  bio: string;
  reputation_score: number;
  company_name: string;
  created_at: string;
};
