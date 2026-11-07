-- NEXUS — نواة المنصة (مرحلة 1: المتجر + السوق + الطلبيات + المالية)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  k0 TEXT NOT NULL,
  store_name TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  logo TEXT NOT NULL DEFAULT '',
  banner TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'free',
  credits INTEGER NOT NULL DEFAULT 0,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_slug ON users(slug);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  descr TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  compare_at INTEGER NOT NULL DEFAULT 0,
  image TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  stock INTEGER NOT NULL DEFAULT -1,
  featured INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_products_feed ON products(active, created_at);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  ptitle TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  total INTEGER NOT NULL,
  cname TEXT NOT NULL,
  phone TEXT NOT NULL,
  wilaya INTEGER NOT NULL,
  commune TEXT NOT NULL,
  delivery TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(user_id, status);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  label TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id, created_at);

CREATE TABLE IF NOT EXISTS agent_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  buyer TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  msgs INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_asess_user ON agent_sessions(user_id, updated_at);

CREATE TABLE IF NOT EXISTS agent_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_amsg_sess ON agent_messages(session_id, created_at);

-- ═══ الإشعارات ═══
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, created_at DESC);
