-- تجديد حالة العرض التجريبي مع كل نشر — البذور فقط، بلا مساس بالمستخدمين الحقيقيين
UPDATE posts SET is_boosted=1, boost_expires_at=datetime('now','+40 hours') WHERE id='p1';
UPDATE stories SET expires_at=datetime('now','+24 hours')
  WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@nexus.demo');
UPDATE boosts SET status='ACTIVE' WHERE id='b1';
