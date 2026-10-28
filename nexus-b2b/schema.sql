-- NEXUS B2B — نموذج البيانات v0.1 (إنتاجي الأساس)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
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
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    media_id TEXT DEFAULT '',
    playback_url TEXT NOT NULL,
    thumbnail_url TEXT DEFAULT '',
    media_kind TEXT DEFAULT 'VIDEO',
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
    deal_delivery_days INTEGER,
    deal_revisions INTEGER,
    deal_vat TEXT DEFAULT '',
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

-- ——— v0.4.0: جداول القيمة الحقيقية للاشتراكات ———
CREATE TABLE IF NOT EXISTS post_stats_daily (
    post_id TEXT NOT NULL REFERENCES posts(id),
    day TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    PRIMARY KEY (post_id, day)
);
CREATE INDEX IF NOT EXISTS idx_stats_day ON post_stats_daily(day);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    actor_id TEXT DEFAULT '',
    kind TEXT NOT NULL,
    ref_type TEXT DEFAULT '',
    ref_id TEXT DEFAULT '',
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS follows (
    follower_id TEXT NOT NULL REFERENCES users(id),
    followee_id TEXT NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, followee_id)
);

CREATE TABLE IF NOT EXISTS sample_requests (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES merchant_products(id),
    merchant_id TEXT NOT NULL REFERENCES users(id),
    requester_id TEXT NOT NULL REFERENCES users(id),
    qty INTEGER DEFAULT 1,
    note TEXT DEFAULT '',
    status TEXT CHECK(status IN ('PENDING','ACCEPTED','DECLINED')) DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_samples_merchant ON sample_requests(merchant_id, status);

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
