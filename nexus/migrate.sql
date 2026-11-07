-- ترقية حية (كل سطر يُنفَّذ مع تسامح الفشل المكرر في CI)
ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE users ADD COLUMN credits INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN verified INTEGER NOT NULL DEFAULT 0;

-- ترقية الإشعارات (idempotent)
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
