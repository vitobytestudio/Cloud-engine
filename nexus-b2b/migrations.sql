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
