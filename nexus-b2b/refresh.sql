-- تجديد حالة العرض التجريبي مع كل نشر
UPDATE posts SET is_boosted=1, boost_expires_at=datetime('now','+40 hours') WHERE id='p1';
UPDATE stories SET expires_at=datetime('now','+24 hours');
UPDATE boosts SET status='ACTIVE' WHERE id='b1';
