-- NAKSAB — migrations 0001 (الأساس: Stage 1) — لا migrations مدمرة أبداً
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'freelancer',      -- freelancer | client | admin
  kdf TEXT NOT NULL DEFAULT 'pbkdf2',
  pass_hash TEXT NOT NULL,
  headline TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  country TEXT DEFAULT '',
  langs TEXT DEFAULT '',                        -- CSV: en,ar,fr
  categories TEXT DEFAULT '[]',                 -- JSON array of slugs
  skills TEXT DEFAULT '[]',                     -- JSON array of slugs
  links TEXT DEFAULT '[]',                      -- JSON [{label,url}]
  available INTEGER DEFAULT 1,
  verified INTEGER DEFAULT 0,                   -- Verified Client / verified freelancer
  reputation REAL DEFAULT 0,                    -- weighted avg rating
  reviews_count INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,                  -- completed projects
  banned INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  csrf TEXT NOT NULL,
  expires INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  skills TEXT DEFAULT '[]',
  price_min INTEGER NOT NULL DEFAULT 0,
  price_max INTEGER NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  delivery_days INTEGER DEFAULT 7,
  revisions INTEGER DEFAULT 1,
  addons TEXT DEFAULT '[]',       -- JSON [{title,price}]
  requirements TEXT DEFAULT '',
  active INTEGER DEFAULT 1,
  boost_until INTEGER DEFAULT 0,  -- NAKSAB BOOST (Stage 2 — الحقل جاهز)
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_services_user ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_cat ON services(category);

CREATE TABLE IF NOT EXISTS portfolio (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT DEFAULT 'work',       -- work | achievement | post
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  media_type TEXT DEFAULT 'image',-- image | video (external links only)
  media_url TEXT DEFAULT '',
  thumb_url TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  likes INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio(user_id);

CREATE TABLE IF NOT EXISTS likes (
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (follower_id, user_id)
);

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT '',
  skills TEXT DEFAULT '[]',
  budget_min INTEGER DEFAULT 0,
  budget_max INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  structured TEXT DEFAULT '',     -- JSON من الهيكلة الذكية (أو يدوية)
  status TEXT DEFAULT 'open',     -- open | closed
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_requests_client ON requests(client_id);

CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  freelancer_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  days INTEGER DEFAULT 7,
  cover TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending | accepted | rejected | withdrawn
  created_at INTEGER NOT NULL,
  UNIQUE(request_id, freelancer_id)
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  freelancer_id TEXT NOT NULL,
  proposal_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'active',   -- active | delivered | completed | cancelled
  client_confirmed INTEGER DEFAULT 0,
  freelancer_confirmed INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_projects_party ON projects(client_id, freelancer_id);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_project ON messages(project_id);

CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  due_days INTEGER DEFAULT 7,
  status TEXT DEFAULT 'pending',  -- pending | delivered | approved
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS deliverables (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  added_by TEXT NOT NULL,
  url TEXT NOT NULL,
  note TEXT DEFAULT '',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  body TEXT DEFAULT '',
  status TEXT DEFAULT 'published', -- published | hidden (إشراف)
  flagged INTEGER DEFAULT 0,       -- مشتبه به → مراجعة إدارية
  created_at INTEGER NOT NULL,
  UNIQUE(project_id, author_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_id);

CREATE TABLE IF NOT EXISTS ads (
  id TEXT PRIMARY KEY,
  advertiser_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  media_url TEXT DEFAULT '',
  target_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending | approved | rejected
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  body TEXT NOT NULL,
  ref TEXT DEFAULT '',
  read INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);

CREATE TABLE IF NOT EXISTS ai_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT DEFAULT '',
  kind TEXT NOT NULL,
  provider TEXT DEFAULT '',
  model TEXT DEFAULT '',
  ok INTEGER DEFAULT 1,
  ms INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit (
  id TEXT PRIMARY KEY,
  admin_id TEXT DEFAULT '',
  action TEXT NOT NULL,
  detail TEXT DEFAULT '',
  created_at INTEGER NOT NULL
);

-- ملاحظة ترحيل: قواعد قائمة تحتاج: ALTER TABLE users ADD COLUMN plan_id TEXT NOT NULL DEFAULT 'free' (يُطبَّق بترحيل متسامح في workflow النشر)

-- ═══ Stage 2 Foundation: الدفع + AI Credits + حماية الإدارة (خامِلة حتى تفعيل المالك) ═══
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_dzd INTEGER NOT NULL DEFAULT 0,
  period TEXT DEFAULT 'monthly',
  ai_quota_daily INTEGER NOT NULL DEFAULT 0,
  ai_quota_monthly INTEGER NOT NULL DEFAULT 0,
  features TEXT DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 0,
  buyable INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  plan_id TEXT,
  credits INTEGER NOT NULL DEFAULT 0,
  amount_dzd INTEGER NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  provider TEXT DEFAULT '',
  provider_ref TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  idempotency_key TEXT UNIQUE,
  risk_flags TEXT DEFAULT '[]',
  meta TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL,
  confirmed_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_pay_user ON payments(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_pay_status ON payments(status, created_at);
CREATE TABLE IF NOT EXISTS credit_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  ref_id TEXT DEFAULT '',
  balance_after INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON credit_ledger(user_id, created_at);
CREATE TABLE IF NOT EXISTS financial_audit (
  id TEXT PRIMARY KEY,
  at INTEGER NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  payment_id TEXT DEFAULT '',
  detail TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS admin_devices (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  label TEXT DEFAULT '',
  created_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL DEFAULT 0,
  revoked INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS admin_meta (k TEXT PRIMARY KEY, v TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT NOT NULL, updated_at INTEGER, updated_by TEXT DEFAULT '');
