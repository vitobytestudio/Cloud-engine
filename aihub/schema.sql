-- AIHub — المخطط الأساسي (المرحلة A)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  pass_hash TEXT NOT NULL,          -- pbkdf2$iter$salt$hash (تفعيل الحساب فقط — لا علاقة له بمفاتيح النماذج)
  full_name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'FREE',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- خزنة صفرية المعرفة: خادم يخزّن النص المشفّر فقط — لا يمكن لأحد (ولا نحن) قراءته
CREATE TABLE IF NOT EXISTS vault_blobs (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  blob TEXT NOT NULL,               -- {v,salt,iv,ct} JSON مشفّر داخل المتصفح AES-256-GCM
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- سقوف الخطة — جدول حي يُعدَّل بلا نشر
CREATE TABLE IF NOT EXISTS plan_limits (
  plan TEXT PRIMARY KEY,
  instant_daily INTEGER NOT NULL,       -- طلبات الحلقة الفورية (Workers AI) يومياً
  proxy_rpm INTEGER NOT NULL,           -- طلبات الاستدلال في الدقيقة
  agents INTEGER NOT NULL,
  auto_daily INTEGER NOT NULL DEFAULT 300,      -- طلبات Nexus Open (التدوير الذكي) يومياً
  instant_img_daily INTEGER NOT NULL DEFAULT 5, -- تجربة الصور الفورية يومياً (سقف عدل معلن)
  vault_size INTEGER NOT NULL           -- بايت
);

-- عداد الاستهلاك اليومي (الحلقة الفورية + التزامن)
CREATE TABLE IF NOT EXISTS usage_daily (
  user_id TEXT NOT NULL,
  day TEXT NOT NULL,
  instant INTEGER NOT NULL DEFAULT 0,
  auto INTEGER NOT NULL DEFAULT 0,
  instant_img INTEGER NOT NULL DEFAULT 0,
  proxy INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

-- أحداث أمنية (تدقيق: من ثبت مفتاحاً، من تجاوز الحدود)
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  kind TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
