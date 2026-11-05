-- بذرة متجر العرض (idempotent — INSERT OR IGNORE لا يكرر ولا يمس بيانات التجار)
INSERT OR IGNORE INTO users (id, email, name, slug, k0, store_name, bio, logo, banner, whatsapp, color, created_at) VALUES
('u_demo_vito', 'demo-store@nexus-platform.dz', 'VITO', 'vito-store', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b8550', 'متجر VITO — عرض المنصة', 'متجر العرض الرسمي لمنصة NEXUS: منتجات مختارة تُريك شكل متجرك وستورك. افتح متجرك بدقيقة.', '/icon.png', '/data/demo/banner.jpg', '', '#7a5cff', 1730732400000);

INSERT OR IGNORE INTO products (id, user_id, title, descr, price, compare_at, image, category, stock, featured, active, created_at) VALUES
('p_demo_watch', 'u_demo_vito', 'ساعة يد فاخرة — ستيل ستانلس', 'ساعة رجالية أنيقة بهيكل ستانلس ستيل مقاوم للماء، حركة كوارتز يابانية دقيقة، مقاومة خدوش الزجاج. تأتي بعلبة هدية أنيقة.', 12900, 15900, '/data/demo/p-watch.jpg', 'electronics', -1, 1, 1, 1730732400000),
('p_demo_perfume', 'u_demo_vito', 'عطر شرقي فاخر 100مل', 'عطر شرقي بثبات يتجاوز 12 ساعة، مزيج العود والعنبر والمسك الأبيض. مثالي للمناسبات والسهرات، عبوة زجاجية فاخرة.', 3500, 4900, '/data/demo/p-perfume.jpg', 'beauty', -1, 1, 1, 1730733300000),
('p_demo_sneakers', 'u_demo_vito', 'حذاء رياضي بريميوم أبيض', 'حذاء رياضي عصري بجلد صناعي عالي الجودة، نعل مريح مضاد للانزلاق، مناسب للجري والاستعمال اليومي. مقاسات 39-45.', 8900, 11500, '/data/demo/p-sneakers.jpg', 'sport', -1, 1, 1, 1730734200000),
('p_demo_dress', 'u_demo_vito', 'فستان سهرة مطرز', 'فستان سهرة أسود أنيق بتطريز يدوي راقٍ، قماش فاخر لا يتجعد، تصميم يحتفي بالأناقة الجزائرية. متوفر بجميع المقاسات.', 10500, 13900, '/data/demo/p-dress.jpg', 'mode', -1, 0, 1, 1730735100000);
