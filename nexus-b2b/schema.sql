-- NEXUS B2B — نموذج البيانات v0.1 (إنتاجي الأساس)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    sector TEXT CHECK(sector IN ('FOUNDER','MERCHANT','FREELANCER')) NOT NULL,
    badge_tier TEXT CHECK(badge_tier IN ('FREE','PRO_TALENT','MERCHANT_EMERALD','ENTERPRISE_GOLD')) DEFAULT 'FREE',
    country_code TEXT DEFAULT '',
    locale TEXT DEFAULT 'ar',
    avatar_color TEXT DEFAULT '#3B82F6',
    bio TEXT DEFAULT '',
    reputation_score INTEGER DEFAULT 100,
    company_name TEXT DEFAULT '',
    vat_number TEXT DEFAULT '',
    portfolio_website TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    media_id TEXT DEFAULT '',
    playback_url TEXT NOT NULL,
    thumbnail_url TEXT DEFAULT '',
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category_tag TEXT CHECK(category_tag IN ('SHOWCASE','REVENUE_WIN','PRODUCT_DEMO','WORKFLOW_HACK','CASE_STUDY')) NOT NULL,
    artifact_type TEXT CHECK(artifact_type IN ('GITHUB_REPO','FIGMA_FILE','STORE_LINK','AUDIT_DOC','CASE_METRIC')),
    artifact_url TEXT DEFAULT '',
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    downvotes_count INTEGER DEFAULT 0,
    quarantined INTEGER DEFAULT 0,
    is_boosted INTEGER DEFAULT 0,
    boost_expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_tag);
CREATE INDEX IF NOT EXISTS idx_posts_boost ON posts(is_boosted, boost_expires_at);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS post_votes (
    post_id TEXT NOT NULL REFERENCES posts(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    vote INTEGER NOT NULL CHECK(vote IN (1,-1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_votes_post ON post_votes(post_id);

CREATE TABLE IF NOT EXISTS post_saves (
    post_id TEXT NOT NULL REFERENCES posts(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    media_id TEXT DEFAULT '',
    playback_url TEXT NOT NULL,
    thumbnail_url TEXT DEFAULT '',
    media_type TEXT CHECK(media_type IN ('VIDEO','IMAGE')) DEFAULT 'VIDEO',
    caption TEXT DEFAULT '',
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_stories_exp ON stories(expires_at);

CREATE TABLE IF NOT EXISTS story_views (
    story_id TEXT NOT NULL REFERENCES stories(id),
    viewer_id TEXT NOT NULL REFERENCES users(id),
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (story_id, viewer_id)
);

CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    participant_one TEXT NOT NULL REFERENCES users(id),
    participant_two TEXT NOT NULL REFERENCES users(id),
    last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(participant_one, participant_two)
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id),
    sender_id TEXT NOT NULL REFERENCES users(id),
    content TEXT DEFAULT '',
    message_type TEXT CHECK(message_type IN ('TEXT','PROPOSAL','PAYMENT_REQUEST','SAMPLE_ORDER')) DEFAULT 'TEXT',
    deal_title TEXT DEFAULT '',
    deal_amount_cents INTEGER,
    deal_status TEXT CHECK(deal_status IN ('PENDING','ACCEPTED','ESCROWED','COMPLETED','DECLINED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS merchant_products (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'EUR',
    inventory_count INTEGER DEFAULT 0,
    sample_available INTEGER DEFAULT 1,
    external_checkout_url TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS freelancer_services (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    service_title TEXT NOT NULL,
    starting_price_cents INTEGER NOT NULL,
    rate_unit TEXT CHECK(rate_unit IN ('HOURLY','PROJECT')) DEFAULT 'PROJECT',
    delivery_days INTEGER DEFAULT 3
);

CREATE TABLE IF NOT EXISTS boosts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    post_id TEXT NOT NULL REFERENCES posts(id),
    tier_name TEXT CHECK(tier_name IN ('FLASH_DROP','TARGET_BOOST','DOMINANCE_DROP')) NOT NULL,
    target_sector TEXT DEFAULT '',
    target_country TEXT DEFAULT '',
    impressions_bought INTEGER NOT NULL,
    impressions_delivered INTEGER DEFAULT 0,
    amount_paid_cents INTEGER NOT NULL,
    status TEXT CHECK(status IN ('ACTIVE','COMPLETED')) DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_boosts_post ON boosts(post_id, status);

CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    kind TEXT CHECK(kind IN ('DEPOSIT','BOOST_PURCHASE','ESCROW_LOCK','ESCROW_RELEASE','ESCROW_REFUND')) NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'EUR',
    ref_type TEXT DEFAULT '',
    ref_id TEXT DEFAULT '',
    provider_event_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS pending_uploads (
    media_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    purpose TEXT CHECK(purpose IN ('POST','STORY')) DEFAULT 'POST',
    content_type TEXT DEFAULT '',
    bytes INTEGER DEFAULT 0,
    ready INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL REFERENCES users(id),
    target_type TEXT CHECK(target_type IN ('POST','USER','MESSAGE')) NOT NULL,
    target_id TEXT NOT NULL,
    reason TEXT CHECK(reason IN ('FRAUD','HARASSMENT','SPAM','IP_VIOLATION')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
