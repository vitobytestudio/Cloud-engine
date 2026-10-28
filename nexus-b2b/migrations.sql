-- ترحيل v0.8: قطاع المشتري — إعادة بناء users بقيود محدثة (بيانات محفوظة)
PRAGMA foreign_keys=OFF;
DROP TABLE IF EXISTS users_v2;
CREATE TABLE users_v2 (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    sector TEXT CHECK(sector IN ('FOUNDER','MERCHANT','FREELANCER','BUYER')) NOT NULL,
    badge_tier TEXT CHECK(badge_tier IN ('FREE','PRO_TALENT','MERCHANT_EMERALD','ENTERPRISE_GOLD')) DEFAULT 'FREE',
    country_code TEXT DEFAULT '',
    locale TEXT DEFAULT 'ar',
    avatar_color TEXT DEFAULT '#3B82F6',
    bio TEXT DEFAULT '',
    reputation_score INTEGER DEFAULT 100,
    company_name TEXT DEFAULT '',
    verified INTEGER DEFAULT 1,
    avatar_data TEXT DEFAULT '',
    vat_number TEXT DEFAULT '',
    portfolio_website TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO users_v2 (id,email,password_hash,username,full_name,sector,badge_tier,country_code,locale,avatar_color,bio,reputation_score,company_name,verified,avatar_data,vat_number,portfolio_website,created_at)
SELECT id,email,password_hash,username,full_name,sector,badge_tier,country_code,locale,avatar_color,bio,reputation_score,company_name,COALESCE(verified,1),COALESCE(avatar_data,''),COALESCE(vat_number,''),COALESCE(portfolio_website,''),created_at FROM users;
DROP TABLE users;
ALTER TABLE users_v2 RENAME TO users;
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
PRAGMA foreign_keys=ON;

-- ——— v0.10-B: النمو والسيادة ———
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    plan TEXT NOT NULL CHECK(plan IN ('PRO_TALENT','MERCHANT_EMERALD','ENTERPRISE_GOLD')),
    cycle TEXT NOT NULL CHECK(cycle IN ('MONTHLY','YEARLY')),
    status TEXT NOT NULL CHECK(status IN ('ACTIVE','CANCELED','EXPIRED')) DEFAULT 'ACTIVE',
    amount_cents INTEGER NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    renews_at DATETIME NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_subs_user ON subscriptions(user_id, status);
CREATE TABLE IF NOT EXISTS credit_grants (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    amount_cents INTEGER NOT NULL,
    remaining_cents INTEGER NOT NULL,
    source TEXT NOT NULL DEFAULT 'WELCOME_GIFT',
    status TEXT NOT NULL CHECK(status IN ('ACTIVE','SPENT','EXPIRED')) DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_grants_user ON credit_grants(user_id, status);
CREATE TABLE IF NOT EXISTS bot_offers (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    owner_id TEXT NOT NULL REFERENCES users(id),
    visitor_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    delivery_days INTEGER NOT NULL,
    revisions INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('PENDING_OWNER','SENT','AUTO_SENT','DECLINED')) DEFAULT 'PENDING_OWNER',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_boffers_owner ON bot_offers(owner_id, status);
CREATE TABLE IF NOT EXISTS bot_usage (
    user_id TEXT NOT NULL REFERENCES users(id),
    day TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, day)
);
CREATE TABLE IF NOT EXISTS bot_settings (
    user_id TEXT PRIMARY KEY REFERENCES users(id),
    autopilot INTEGER DEFAULT 0,
    max_price_cents INTEGER DEFAULT 0,
    max_days INTEGER DEFAULT 0,
    max_revisions INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS bot_messages (
    message_id TEXT PRIMARY KEY REFERENCES messages(id),
    kind TEXT NOT NULL DEFAULT 'reply',
    offer_id TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS security_events (
    id TEXT PRIMARY KEY,
    actor_key TEXT NOT NULL DEFAULT '',
    kind TEXT NOT NULL,
    severity INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_secev_key ON security_events(actor_key, created_at);
CREATE TABLE IF NOT EXISTS security_state (
    actor_key TEXT PRIMARY KEY,
    strikes INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0,
    penalty_until DATETIME,
    locked INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS supporter_pool (
    username TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    headline TEXT NOT NULL,
    sector TEXT NOT NULL,
    country_code TEXT DEFAULT '',
    avatar_color TEXT DEFAULT '#8B5CF6',
    kind TEXT NOT NULL DEFAULT 'SUPPORTER',
    active INTEGER DEFAULT 0,
    activated_at DATETIME
);
