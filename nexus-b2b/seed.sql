-- بيانات العرض التجريبية (حسابات العرض محمية: كلمة السر معطلة — الدخول عبر زر الحساب التجريبي فقط)
INSERT OR IGNORE INTO users (id,email,password_hash,username,full_name,sector,badge_tier,country_code,avatar_color,bio,reputation_score,company_name,created_at) VALUES
('u-demo-amin','amin@nexus.demo','!disabled','amin','أمين بلقاسم','FREELANCER','PRO_TALENT','DZ','#3B82F6','مصمم ومطور واجهات — أحول الأفكار إلى منتجات تُلمس. 47 مشروعاً مُسلّماً.',128,'',datetime('now','-40 days')),
('u-salma','salma@nexus.demo','!disabled','salma','سلمى حداد','MERCHANT','MERCHANT_EMERALD','FR','#10B981','مؤسِّسة LUMA — إضاءة ذكية للمكاتب. جملة وتجزئة داخل الاتحاد الأوروبي.',142,'LUMA Lighting',datetime('now','-120 days')),
('u-klaus','klaus@nexus.demo','!disabled','klaus','كلاوس فيبر','FOUNDER','ENTERPRISE_GOLD','DE','#E5A93C','Founder @ Nordwind GmbH — نبني أنظمة لوجستية للتجارة الأوروبية.',157,'Nordwind GmbH',datetime('now','-200 days')),
('u-lina','lina@nexus.demo','!disabled','lina','لينا مراد','FREELANCER','FREE','MA','#60A5FA','كاتبة محتوى تقني ومترجمة AR/FR/DE.',98,'',datetime('now','-15 days')),
('u-omar','omar@nexus.demo','!disabled','omar','عمر التازي','MERCHANT','FREE','MA','#34D399','متجر Atlas Goods — منتجات مغربية أصيلة للسوق الأوروبي.',96,'Atlas Goods',datetime('now','-10 days')),
('u-sofia','sofia@nexus.demo','!disabled','sofia','صوفيا رين','FOUNDER','FREE','FR','#F59E0B','نبني PayFlow — مدفوعات لحظية للمستقلين. شركاء تجريبيون مطلوبون.',104,'PayFlow',datetime('now','-30 days'));

INSERT OR IGNORE INTO posts (id,user_id,playback_url,thumbnail_url,title,description,category_tag,artifact_type,artifact_url,views_count,likes_count,saves_count,downvotes_count,is_boosted,boost_expires_at,created_at) VALUES
('p1','u-klaus','/media/reel1.mp4','/media/poster1.jpg','ضاعفنا معدل التحويل 3.2× بإعادة بناء صفحة الدفع','قصة كاملة: التشخيص، الثلاث فرضيات، ما نجح فعلاً، والأرقام قبل/بعد. ملف القياس مرفق.','CASE_STUDY','CASE_METRIC','https://metrics.nordwind.example/checkout-2026',1840,142,61,1,1,datetime('now','+40 hours'),datetime('now','-6 hours')),
('p2','u-salma','/media/reel2.mp4','/media/poster2.jpg','LUMA Desk — مصباح المكتب الذكي في 45 ثانية','العرض الكامل: حساس الإضاءة، تطبيق التحكم، وسعر الجملة للطلبات فوق 50 وحدة. اطلب عينة الآن.','PRODUCT_DEMO','STORE_LINK','https://luma.example/store/desk-pro',960,87,39,0,0,NULL,datetime('now','-11 hours')),
('p3','u-demo-amin','/media/reel3.mp4','/media/poster3.jpg','أتمتة فواتير الوكالة: من 4 ساعات إلى 12 دقيقة أسبوعياً','خط المعالجة كاملاً على GitHub: قراءة PDF، استخراج البنود، مطابقة بنكية، تقرير أسبوعي.','WORKFLOW_HACK','GITHUB_REPO','https://github.com/amin-demo/invoice-flow',1210,203,118,0,0,NULL,datetime('now','-20 hours')),
('p4','u-salma','/media/reel4.mp4','/media/poster4.jpg','أول 10,000 يورو من إعلانات الفيديو العمودي — ماذا تعلمنا','ثلاث حملات، تكلفة الاكتساب الحقيقية، والخطأ الذي كلفنا 800 يورو. الأرقام موثقة.','REVENUE_WIN','CASE_METRIC','https://metrics.luma.example/q1-ads',1520,176,52,2,0,NULL,datetime('now','-30 hours')),
('p5','u-klaus','/media/reel5.mp4','/media/poster5.jpg','دمج فريقين بعد الاستحواذ في 30 يوماً — بروتوكول كامل','وثيقة التدقيق التنظيمية: الأدوار، الأدوات، ما انكسر، وكيف أعدنا الإيقاع في أسبوعين.','CASE_STUDY','AUDIT_DOC','https://nordwind.example/audits/merger-30d',2100,231,97,1,0,NULL,datetime('now','-50 hours')),
('p6','u-omar','/media/reel6.mp4','/media/poster6.jpg','تشكيلة الأرجان الخريفية — عرض الجملة للسوق الأوروبي','صناعة يدوية أصيلة، تغليف بيئي، ولوحة أسعار جملة. العينات متاحة هذا الأسبوع.','PRODUCT_DEMO','STORE_LINK','https://atlasgoods.example/autumn',430,38,12,0,0,NULL,datetime('now','-3 hours')),
('p7','u-demo-amin','/media/reel5.mp4','/media/poster5.jpg','إعادة تصميم تطبيق مصرفي — من الفكرة إلى النموذج التفاعلي','رحلة التصميم كاملة على Figma: البحث، الهياكل، نظام التصميم، والنموذج القابل للتجربة.','SHOWCASE','FIGMA_FILE','https://figma.com/file/amin-demo/banking-ui',880,121,44,0,0,NULL,datetime('now','-9 hours')),
('p8','u-sofia','/media/reel1.mp4','/media/poster1.jpg','PayFlow — تسوية المستقلين في 60 ثانية','عرض المنتج: من الفاتورة إلى المبلغ في الحساب. نبحث عن شركاء تجريبيين في فرنسا وإسبانيا.','PRODUCT_DEMO','STORE_LINK','https://payflow.example/beta',650,71,28,0,0,NULL,datetime('now','-2 hours'));

INSERT OR REPLACE INTO stories (id,user_id,playback_url,thumbnail_url,media_type,caption,expires_at) VALUES
('s1','u-salma','/media/reel2.mp4','/media/poster2.jpg','VIDEO','خط الإنتاج اليوم — دفعة جديدة تم شحنها',datetime('now','+18 hours')),
('s2','u-klaus','/media/reel1.mp4','/media/poster1.jpg','VIDEO','في الطريق إلى قمة برلين للتجارة',datetime('now','+14 hours')),
('s3','u-demo-amin','/media/reel3.mp4','/media/poster3.jpg','VIDEO','تسليم اليوم — آخر مراجعة قبل الإرسال',datetime('now','+22 hours'));

INSERT OR IGNORE INTO conversations (id,participant_one,participant_two,last_message_at) VALUES
('c-demo-1','u-demo-amin','u-salma',datetime('now','-2 hours'));

INSERT OR IGNORE INTO messages (id,conversation_id,sender_id,content,message_type,deal_title,deal_amount_cents,deal_status,created_at) VALUES
('m1','c-demo-1','u-salma','أمين، شاهدت عرض إعادة تصميم التطبيق المصرفي — العمل نظيف جداً. عندك وقت لهوية بصرية كاملة لمتجرنا الجديد؟','TEXT','','',NULL,datetime('now','-3 hours')),
('m2','c-demo-1','u-demo-amin','أهلاً سلمى، شكراً على كلمتك. نعم متاح — أرسلت لك عرضاً مبدئياً بالتفاصيل والمدة.','TEXT','','',NULL,datetime('now','-2 hours')),
('m3','c-demo-1','u-demo-amin','','PROPOSAL','هوية بصرية كاملة لمتجر LUMA الجديد — شعار ونظام ألوان وقوالب نشر',85000,'PENDING',datetime('now','-2 hours'));

INSERT OR IGNORE INTO merchant_products (id,user_id,title,price_cents,currency,inventory_count,sample_available,external_checkout_url) VALUES
('mp1','u-salma','LUMA Desk Pro — مصباح مكتب ذكي',8900,'EUR',320,1,'https://luma.example/wholesale/desk-pro'),
('mp2','u-salma','LUMA Strip — شريط إضاءة مكتبية',3490,'EUR',890,1,'https://luma.example/wholesale/strip');

INSERT OR IGNORE INTO freelancer_services (id,user_id,service_title,starting_price_cents,rate_unit,delivery_days) VALUES
('fs1','u-demo-amin','تصميم واجهة تطبيق كاملة — حتى 12 شاشة',120000,'PROJECT',10),
('fs2','u-demo-amin','مراجعة تجربة استخدام مع تقرير تحسينات',45000,'PROJECT',4),
('fs3','u-lina','كتابة محتوى تقني بالعربية والفرنسية',6000,'HOURLY',2);

INSERT OR IGNORE INTO boosts (id,user_id,post_id,tier_name,target_sector,target_country,impressions_bought,impressions_delivered,amount_paid_cents,status,created_at) VALUES
('b1','u-klaus','p1','DOMINANCE_DROP','','',15000,231,12900,'ACTIVE',datetime('now','-6 hours'));

INSERT OR IGNORE INTO transactions (id,user_id,kind,amount_cents,currency,ref_type,ref_id,provider_event_id,created_at) VALUES
('tx-welcome','u-demo-amin','DEPOSIT',2000,'EUR','','','stub_welcome_credit',datetime('now','-1 days')),
('tx-klaus-b1','u-klaus','BOOST_PURCHASE',-12900,'EUR','BOOST','b1','stub_boost_b1',datetime('now','-6 hours'));
