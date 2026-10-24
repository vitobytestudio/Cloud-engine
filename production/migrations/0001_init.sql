-- مِرسال — المخطط الأولي (D1 / SQLite)
-- مبادئ: هويات مفصولة، بصمات لا كلمات سر، تدقيق كامل، احتفاظ محدود (72 ساعة للفرص)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  email_norm TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,      -- PBKDF2-SHA256 (100k)
  salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- user | admin
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER,
  consent_at INTEGER NOT NULL,       -- موافقة الشروط والخصوصية
  created_at INTEGER NOT NULL,
  last_login_at INTEGER
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,               -- SHA-256(token) — لا نخزن التوكن نفسه
  user_id TEXT NOT NULL REFERENCES users(id),
  csrf TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  ip_hash TEXT,
  ua_hash TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_exp ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  profession_id TEXT NOT NULL DEFAULT '',
  keywords_json TEXT NOT NULL DEFAULT '[]',
  wilayas_json TEXT NOT NULL DEFAULT '["كل الولايات"]',
  alert_channel TEXT NOT NULL DEFAULT 'app',  -- app فقط في هذه النسخة (بلا SMS)
  setup_done INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  plan_id TEXT NOT NULL,             -- free | growth | pro
  status TEXT NOT NULL DEFAULT 'active', -- active | expired
  started_at INTEGER NOT NULL,
  renews_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_subs_user ON subscriptions(user_id);

-- طلبات الدفع — مرجع فريد لكل طلب، المبلغ يحدده النظام لا العميل
CREATE TABLE IF NOT EXISTS payment_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  plan_id TEXT NOT NULL,
  amount_dzd INTEGER NOT NULL,
  reference TEXT NOT NULL UNIQUE,    -- MRS-XXXXXX يُكتب في وحدة التحويل
  status TEXT NOT NULL DEFAULT 'pending', -- pending | submitted | approved | rejected | cancelled
  risk_flag INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON payment_orders(status);

-- وصولات الدفع — مشفرة AES-256-GCM في R2، بيانات وصفية فقط هنا
CREATE TABLE IF NOT EXISTS payment_receipts (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES payment_orders(id),
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  sha256 TEXT NOT NULL UNIQUE,       -- منع إعادة استعمال نفس الوصل إطلاقاً
  transfer_name TEXT NOT NULL,
  transfer_date TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  ip_hash TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_receipts_dup ON payment_receipts(transfer_name, transfer_date);

-- قرار المراجعة البشرية (بلا AI — قواعد حتمية + إنسان)
CREATE TABLE IF NOT EXISTS payment_decisions (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES payment_orders(id),
  admin_id TEXT NOT NULL,
  decision TEXT NOT NULL,            -- approved | rejected
  reason TEXT,
  created_at INTEGER NOT NULL
);

-- الزبائن الجاهزون — منشور + رابط وصول إلزامي + احتفاظ 72 ساعة
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  author_public TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,   -- إلزامي وفريد — منع التكرار من المصدر
  keyword TEXT NOT NULL DEFAULT '',
  location_hint TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'ingest',
  status TEXT NOT NULL DEFAULT 'active',
  published_at INTEGER NOT NULL,
  ingested_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_clients_pub ON clients(published_at);

-- سجل التسليم لكل مستخدم (أساس الحصص ومنع التكرار)
CREATE TABLE IF NOT EXISTS client_deliveries (
  client_id TEXT NOT NULL REFERENCES clients(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  delivered_at INTEGER NOT NULL,
  PRIMARY KEY (client_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_deliv_user ON client_deliveries(user_id, delivered_at);

CREATE TABLE IF NOT EXISTS client_status (
  client_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL,              -- contacted | won | skipped
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (client_id, user_id)
);

-- سجل التدقيق — كل فعل حساس مُوثّق
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,               -- user id | admin id | 'system' | 'anonymous'
  action TEXT NOT NULL,
  target TEXT,
  meta TEXT,
  ip_hash TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor, created_at);
