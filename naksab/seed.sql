INSERT OR IGNORE INTO categories (id, slug, name, icon) VALUES
  ('cat-prog', 'programming', 'Programming & Tech', '</>'),
  ('cat-design', 'design', 'Design & Creative', '◆'),
  ('cat-video', 'video', 'Video & Animation', '▶'),
  ('cat-marketing', 'marketing', 'Digital Marketing', '↗'),
  ('cat-writing', 'writing', 'Writing & Translation', '✎'),
  ('cat-ai', 'ai', 'AI Services', '◎'),
  ('cat-business', 'business', 'Business & Consulting', '▣'),
  ('cat-audio', 'audio', 'Music & Audio', '♪');

-- ═══ الباقات: أسعار قابلة للتعديل من الإدارة — PRO/VIP معطلة (Coming Soon) حتى موافقة المالك ═══
INSERT OR IGNORE INTO plans (id, name, price_dzd, period, ai_quota_daily, ai_quota_monthly, features, active, buyable, sort) VALUES
('free', 'FREE', 0, 'monthly', 10, 100, '["Profile & portfolio","Services marketplace","Weighted matching","Project room","Mutual reviews","10 AI structuring / day"]', 1, 0, 0),
('pro', 'PRO', 1900, 'monthly', 60, 800, '["Everything in FREE","60 AI structuring / day","Priority in matching","Verified badge request","Advanced analytics","Direct client contact"]', 0, 0, 1),
('vip', 'VIP', 4900, 'monthly', 200, 3000, '["Everything in PRO","200 AI structuring / day","Top ranking in matches","Dedicated support channel","Early access to new features","Boost campaign credits"]', 0, 0, 2);
INSERT OR IGNORE INTO settings (k, v, updated_at, updated_by) VALUES
('payments_enabled', '0', 0, 'system'),
('ai_free_daily', '10', 0, 'system'),
('ai_free_monthly', '100', 0, 'system'),
('credits_price_dzd_per_100', '300', 0, 'system');

-- باقتا العضوية الجسرية (امتيازات المنصتين — idempotent)
INSERT OR REPLACE INTO plans (id, name, price_dzd, period, ai_quota_daily, ai_quota_monthly, features, active, buyable, sort) VALUES
('bridge-weekly', 'عضوية الأسبوع', 199, 'weekly', 0, 0, '["ثمن الجسر 3% بدل 5%","خصم 10% إضافي على فيديوهات نيكسوس","أولوية عرض في كتالوج المحترفين"]', 1, 1, 90),
('bridge-monthly', 'عضوية الشهر', 699, 'monthly', 0, 0, '["ثمن الجسر 2% بدل 5%","خصم 20% إضافي على فيديوهات نيكسوس","أولوية عرض في كتالوج المحترفين","شارة عضوية على ملفك"]', 1, 1, 91);
