-- تخزين الوصولات المشفرة في KV (بديل R2 — بلا تفعيل خارجي)
-- KV يقبل حتى 25MB للقيمة، ووصلاتنا ≤5MB ومشفرة AES-256-GCM قبل الكتابة
ALTER TABLE payment_receipts RENAME COLUMN r2_key TO storage_key;
