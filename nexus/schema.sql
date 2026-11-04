-- NEXUS v1.0 — منصة اجتماعية أنستغرامية للتجار والصنّاع الجزائريين — تصفير كامل
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  kdf TEXT NOT NULL DEFAULT 'pbkdf2',
  pass_hash TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  store_url TEXT DEFAULT '',                    -- رابط المتجر/الواتساب (https فقط)
  category TEXT DEFAULT '',                     -- تخصص العرض: ملابس/جمال/إلكترونيات...
  verified INTEGER DEFAULT 0,
  banned INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nx_users_username ON users(username);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  csrf TEXT NOT NULL,
  expires INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_nx_sessions_user ON sessions(user_id);

-- المنشورات: صورة + تعليق + تصنيف (صور عبر روابط https في v1.0 — بلا تخزين ولا تكاليف)
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  category TEXT DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nx_posts_user ON posts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_nx_posts_cat ON posts(category, created_at);

CREATE TABLE IF NOT EXISTS post_likes (
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, user_id)
);
CREATE TABLE IF NOT EXISTS post_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nx_comments_post ON post_comments(post_id, created_at);
CREATE TABLE IF NOT EXISTS post_saves (
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, user_id)
);
CREATE TABLE IF NOT EXISTS follows (
  follower_id TEXT NOT NULL,
  followee_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (follower_id, followee_id)
);
CREATE INDEX IF NOT EXISTS idx_nx_follows_ee ON follows(followee_id);

-- الستوريات: تعيش 24 ساعة (الحد زمني بالاستعلام — لا حاجة cron في v1.0)
CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nx_stories_user ON stories(user_id, created_at);
