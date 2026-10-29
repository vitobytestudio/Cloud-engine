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

-- ——— v0.4.0: بيانات حية للتحليلات والإشعارات والمتابعة ———
INSERT OR IGNORE INTO post_stats_daily (post_id,day,views,likes,saves) VALUES
('p3',date('now','-13 days'),34,2,1),('p3',date('now','-12 days'),41,3,0),('p3',date('now','-11 days'),38,1,1),
('p3',date('now','-10 days'),52,4,2),('p3',date('now','-9 days'),47,2,0),('p3',date('now','-8 days'),63,5,1),
('p3',date('now','-7 days'),71,4,2),('p3',date('now','-6 days'),58,3,1),('p3',date('now','-5 days'),84,6,3),
('p3',date('now','-4 days'),92,7,2),('p3',date('now','-3 days'),118,9,4),('p3',date('now','-2 days'),96,6,2),
('p3',date('now','-1 days'),131,11,5),('p3',date('now'),87,5,2),
('p1',date('now','-5 days'),210,12,4),('p1',date('now','-4 days'),264,15,5),('p1',date('now','-3 days'),312,18,7),
('p1',date('now','-2 days'),289,16,6),('p1',date('now','-1 days'),341,21,8),('p1',date('now'),198,11,3),
('p2',date('now','-2 days'),44,2,1),('p2',date('now','-1 days'),61,4,2),('p2',date('now'),37,1,1);

INSERT OR IGNORE INTO notifications (id,user_id,actor_id,kind,ref_type,ref_id,created_at) VALUES
('n-seed-1','u-demo-amin','u-klaus','like','post','p3',datetime('now','-3 hours')),
('n-seed-2','u-demo-amin','u-salma','save','post','p3',datetime('now','-9 hours')),
('n-seed-3','u-demo-amin','u-omar','follow','user','u-demo-amin',datetime('now','-1 days'));

INSERT OR IGNORE INTO follows (follower_id,followee_id) VALUES
('u-klaus','u-demo-amin'),('u-salma','u-demo-amin'),('u-omar','u-demo-amin'),('u-demo-amin','u-klaus');

-- ——— v0.8: بيانات فلاتر البحث الحقيقية ———
INSERT OR IGNORE INTO freelancer_services (id,user_id,service_title,starting_price_cents,rate_unit,delivery_days) VALUES
('sv-klaus-1','u-klaus','B2B checkout audit & rebuild',9000,'PROJECT',10);
UPDATE users SET vat_number='DE123456789' WHERE username='klaus' AND (vat_number IS NULL OR vat_number='');
UPDATE posts SET title='Shopify migration case study — 3.2x checkout lift' WHERE id='p1';

-- ——— v0.10-B: حساب المالك (الأول عالمياً) + تقارير خبراء الأمن + داعمو NEXUS ———
INSERT OR IGNORE INTO users (id,email,password_hash,username,full_name,sector,badge_tier,country_code,avatar_color,bio,reputation_score,company_name,verified,created_at) VALUES
('u-vitobyte','owner@nexus.demo','pbkdf2$210000$7086661cf92c1a91b486781e1e01cbe2$UuonNBpYZWxnu7mgjof6mMN65hxwKhgAuqq6uxPR8VA=','vitobyte','VitoByte Studio','FOUNDER','FREE','DZ','#E5A93C','الشبكة الأم — حساب المنصة الأول. نبني قنوات فرص حقيقية بين الشركات الأوروبية.',200,'VitoByte Studio',1,datetime('now','-300 days')),
('u-sec-nad','nad@nexus.demo','!disabled','sec_nad','نادر الصالح','FOUNDER','FREE','JO','#64748B','محقق حوادث أمن سيبراني — أنشر تقارير تدقيق مفتوحة للشركات الصغيرة.',160,'Sentinel Labs',1,datetime('now','-180 days')),
('u-sec-mira','mira@nexus.demo','!disabled','sec_mira','ميرا هوفمان','FREELANCER','FREE','DE','#64748B','مدققة أمن تطبيقات — OWASP ASVS. كل تقرير قابل للتنفيذ.',150,'',1,datetime('now','-150 days')),
('u-sec-tarek','tarek@nexus.demo','!disabled','sec_tarek','طارق بن يوسف','MERCHANT','FREE','TN','#64748B','استشاري حماية بيانات GDPR للتجارة الإلكترونية.',145,'DatShield Consulting',1,datetime('now','-120 days'));

INSERT OR IGNORE INTO posts (id,user_id,playback_url,thumbnail_url,title,description,category_tag,artifact_type,artifact_url,views_count,likes_count,saves_count,downvotes_count,is_boosted,created_at) VALUES
('p0','u-vitobyte','/media/reel1.mp4','/media/poster1.jpg','NEXUS — شبكة الفرص التجارية بالفيديو العمودي: ابدأ في دقيقة','هذا هو الحساب الأم للمنصة. ننشر هنا تحديثات النظام، أدلة الانطلاق، وشرح آلية الضمان. كل حساب حقيقي يظهر في الشبكة — لا تفاعل وهمي.','SHOWCASE','CASE_METRIC','https://nexus.example/start',520,94,41,0,0,datetime('now','-40 minutes')),
('p-sec1','u-sec-nad','/media/reel3.mp4','/media/poster3.jpg','تدقيق أمني: 7 ثغرات شائعة في صفحات الدفع B2B وكيف تغلقها','تقرير من 12 تدقيق حقيقي: CSRF في النماذج، تسريب مفاتيح في السجلات، ثقة زائدة بالمتصفح، وحدود معدل غائبة. كل بند معه الإصلاح الفوري.','CASE_STUDY','AUDIT_DOC','https://sentinel.example/reports/checkout-audit',760,118,63,0,0,datetime('now','-2 days')),
('p-sec2','u-sec-mira','/media/reel5.mp4','/media/poster5.jpg','بروتوكول الاستجابة للحوادث في 60 دقيقة — قالب جاهز للشركات الصغيرة','من أول دقيقة: من يتصل بمن، كيف تحفظ الأدلة، متى تعلن، وكيف تعيد الثقة. القالب مستخدم في 30 شركة أوروبية.','WORKFLOW_HACK','AUDIT_DOC','https://mira.example/incident-60min',540,86,52,0,0,datetime('now','-4 days'));

INSERT OR IGNORE INTO stories (id,user_id,playback_url,thumbnail_url,media_type,caption,expires_at) VALUES
('s0','u-vitobyte','/media/reel1.mp4','/media/poster1.jpg','VIDEO','مرحباً بكم في NEXUS — شبكة الفرص الحقيقية',datetime('now','+20 hours'));

INSERT OR IGNORE INTO app_config (key,value) VALUES ('owner_user_id','u-vitobyte'),('supporters_epoch',date('now'));


-- ——— داعمو NEXUS: 40 نشطاً + 40 احتياطياً (تنشئهم حكّامة يومية تدريجياً) ———
INSERT OR IGNORE INTO supporter_pool (username,full_name,headline,sector,country_code,avatar_color,kind,active) VALUES
('sup_01','Lars Bergmann','لوجستيات التجارة الإلكترونية','FOUNDER','DE','#8B5CF6','SUPPORTER',1),
('sup_02','Sophie Martin','مدفوعات B2B','MERCHANT','FR','#7C3AED','SUPPORTER',1),
('sup_03','Jonas Weber','تصنيع صناعي','FREELANCER','NL','#A78BFA','SUPPORTER',1),
('sup_04','Elena Petrova','تسويق الأعمال','FOUNDER','ES','#6D28D9','SUPPORTER',1),
('sup_05','Marco Ricci','أمن سيبراني','MERCHANT','SE','#8B5CF6','SUPPORTER',1),
('sup_06','Anna Kowalski','سلاسل التوريد','FREELANCER','BE','#7C3AED','SUPPORTER',1),
('sup_07','Pieter Van Dijk','استشارات نمو','FOUNDER','IT','#A78BFA','SUPPORTER',1),
('sup_08','Claire Dubois','برمجيات SaaS','MERCHANT','PL','#6D28D9','SUPPORTER',1),
('sup_09','Tomás Ruiz','استيراد وتصدير','FREELANCER','DZ','#8B5CF6','SUPPORTER',1),
('sup_10','Ingrid Johansson','تصميم صناعي','FOUNDER','MA','#7C3AED','SUPPORTER',1),
('sup_11','Karat Benali','ذكاء أعمال','MERCHANT','TN','#A78BFA','SUPPORTER',1),
('sup_12','Yasmine Haddad','طاقة متجددة','FREELANCER','JO','#6D28D9','SUPPORTER',1),
('sup_13','Omar Fathi','تغليف ذكي','FOUNDER','EG','#8B5CF6','SUPPORTER',1),
('sup_14','Layla Mansour','مقاولات أوروبية','MERCHANT','AT','#7C3AED','SUPPORTER',1),
('sup_15','Rami Khoury','تحليل بيانات','FREELANCER','PT','#A78BFA','SUPPORTER',1),
('sup_16','Nadia Bensalem','تجارة الجملة','FOUNDER','FI','#6D28D9','SUPPORTER',1),
('sup_17','Hugo Ferreira','لوجستيات التجارة الإلكترونية','MERCHANT','DE','#8B5CF6','SUPPORTER',1),
('sup_18','Marta Novak','مدفوعات B2B','FREELANCER','FR','#7C3AED','SUPPORTER',1),
('sup_19','Felix Braun','تصنيع صناعي','FOUNDER','NL','#A78BFA','SUPPORTER',1),
('sup_20','Amina Cherif','تسويق الأعمال','MERCHANT','ES','#6D28D9','SUPPORTER',1),
('sup_21','David Klein','أمن سيبراني','FREELANCER','SE','#8B5CF6','SUPPORTER',1),
('sup_22','Julie Roux','سلاسل التوريد','FOUNDER','BE','#7C3AED','SUPPORTER',1),
('sup_23','Sami Tawfik','استشارات نمو','MERCHANT','IT','#A78BFA','SUPPORTER',1),
('sup_24','Farida Zerrouki','برمجيات SaaS','FREELANCER','PL','#6D28D9','SUPPORTER',1),
('sup_25','Lucas Meyer','استيراد وتصدير','FOUNDER','DZ','#8B5CF6','SUPPORTER',1),
('sup_26','Emma Lindqvist','تصميم صناعي','MERCHANT','MA','#7C3AED','SUPPORTER',1),
('sup_27','Karim Dridi','ذكاء أعمال','FREELANCER','TN','#A78BFA','SUPPORTER',1),
('sup_28','Salma Bouchard','طاقة متجددة','FOUNDER','JO','#6D28D9','SUPPORTER',1),
('sup_29','Victor Sousa','تغليف ذكي','MERCHANT','EG','#8B5CF6','SUPPORTER',1),
('sup_30','Hana Ould Ali','مقاولات أوروبية','FREELANCER','AT','#7C3AED','SUPPORTER',1),
('sup_31','Pierre Lemoine','تحليل بيانات','FOUNDER','PT','#A78BFA','SUPPORTER',1),
('sup_32','Dina Fahmy','تجارة الجملة','MERCHANT','FI','#6D28D9','SUPPORTER',1),
('sup_33','Andrej Horvat','لوجستيات التجارة الإلكترونية','FREELANCER','DE','#8B5CF6','SUPPORTER',1),
('sup_34','Camille Girard','مدفوعات B2B','FOUNDER','FR','#7C3AED','SUPPORTER',1),
('sup_35','Bilal Amin','تصنيع صناعي','MERCHANT','NL','#A78BFA','SUPPORTER',1),
('sup_36','Rania Kettani','تسويق الأعمال','FREELANCER','ES','#6D28D9','SUPPORTER',1),
('sup_37','Stefan Richter','أمن سيبراني','FOUNDER','SE','#8B5CF6','SUPPORTER',1),
('sup_38','Maya Barakat','سلاسل التوريد','MERCHANT','BE','#7C3AED','SUPPORTER',1),
('sup_39','Nour Slimani','استشارات نمو','FREELANCER','IT','#A78BFA','SUPPORTER',1),
('sup_40','Thomas Beaumont','برمجيات SaaS','FOUNDER','PL','#6D28D9','SUPPORTER',1),
('rsup_01','Gabriel Fontaine','سلاسل التوريد','MERCHANT','ES','#A78BFA','SUPPORTER',0),
('rsup_02','Lina Haddadi','استشارات نمو','FREELANCER','SE','#6D28D9','SUPPORTER',0),
('rsup_03','Emil Weber','برمجيات SaaS','FOUNDER','BE','#8B5CF6','SUPPORTER',0),
('rsup_04','Sara Mansouri','استيراد وتصدير','MERCHANT','IT','#7C3AED','SUPPORTER',0),
('rsup_05','Diego Alvarez','تصميم صناعي','FREELANCER','PL','#A78BFA','SUPPORTER',0),
('rsup_06','Katya Volkov','ذكاء أعمال','FOUNDER','DZ','#6D28D9','SUPPORTER',0),
('rsup_07','Amir Ghalib','طاقة متجددة','MERCHANT','MA','#8B5CF6','SUPPORTER',0),
('rsup_08','Freja Nielsen','تغليف ذكي','FREELANCER','TN','#7C3AED','SUPPORTER',0),
('rsup_09','Mehdi Rahmani','مقاولات أوروبية','FOUNDER','JO','#A78BFA','SUPPORTER',0),
('rsup_10','Celine Marchand','تحليل بيانات','MERCHANT','EG','#6D28D9','SUPPORTER',0),
('rsup_11','Oussama Trabelsi','تجارة الجملة','FREELANCER','AT','#8B5CF6','SUPPORTER',0),
('rsup_12','Greta Fischer','لوجستيات التجارة الإلكترونية','FOUNDER','PT','#7C3AED','SUPPORTER',0),
('rsup_13','Walid Nasser','مدفوعات B2B','MERCHANT','FI','#A78BFA','SUPPORTER',0),
('rsup_14','Isabelle Perrot','تصنيع صناعي','FREELANCER','DE','#6D28D9','SUPPORTER',0),
('rsup_15','Youssef Amrani','تسويق الأعمال','FOUNDER','FR','#8B5CF6','SUPPORTER',0),
('rsup_16','Paula Costa','أمن سيبراني','MERCHANT','NL','#7C3AED','SUPPORTER',0),
('rsup_17','Dorra Mejri','سلاسل التوريد','FREELANCER','ES','#A78BFA','SUPPORTER',0),
('rsup_18','Henrik Olsen','استشارات نمو','FOUNDER','SE','#6D28D9','SUPPORTER',0),
('rsup_19','Leila Boumediene','برمجيات SaaS','MERCHANT','BE','#8B5CF6','SUPPORTER',0),
('rsup_20','Marc Girard','استيراد وتصدير','FREELANCER','IT','#7C3AED','SUPPORTER',0),
('rsup_21','Tarek Chaouch','تصميم صناعي','FOUNDER','PL','#A78BFA','SUPPORTER',0),
('rsup_22','Sofie Andersen','ذكاء أعمال','MERCHANT','DZ','#6D28D9','SUPPORTER',0),
('rsup_23','Rachid Bennis','طاقة متجددة','FREELANCER','MA','#8B5CF6','SUPPORTER',0),
('rsup_24','Eva Horak','تغليف ذكي','FOUNDER','TN','#7C3AED','SUPPORTER',0),
('rsup_25','Adel Kacem','مقاولات أوروبية','MERCHANT','JO','#A78BFA','SUPPORTER',0),
('rsup_26','Manon Leroy','تحليل بيانات','FREELANCER','EG','#6D28D9','SUPPORTER',0),
('rsup_27','Bilal Ozturk','تجارة الجملة','FOUNDER','AT','#8B5CF6','SUPPORTER',0),
('rsup_28','Astrid Berg','لوجستيات التجارة الإلكترونية','MERCHANT','PT','#7C3AED','SUPPORTER',0),
('rsup_29','Hichem Graya','مدفوعات B2B','FREELANCER','FI','#A78BFA','SUPPORTER',0),
('rsup_30','Carmen Silva','تصنيع صناعي','FOUNDER','DE','#6D28D9','SUPPORTER',0),
('rsup_31','Zineb Rahali','تسويق الأعمال','MERCHANT','FR','#8B5CF6','SUPPORTER',0),
('rsup_32','Petter Lund','أمن سيبراني','FREELANCER','NL','#7C3AED','SUPPORTER',0),
('rsup_33','Fouad Ziani','سلاسل التوريد','FOUNDER','ES','#A78BFA','SUPPORTER',0),
('rsup_34','Elise Moreau','استشارات نمو','MERCHANT','SE','#6D28D9','SUPPORTER',0),
('rsup_35','Oualid Saadi','برمجيات SaaS','FREELANCER','BE','#8B5CF6','SUPPORTER',0),
('rsup_36','Ines Cardoso','استيراد وتصدير','FOUNDER','IT','#7C3AED','SUPPORTER',0),
('rsup_37','Viktor Molnar','تصميم صناعي','MERCHANT','PL','#A78BFA','SUPPORTER',0),
('rsup_38','Salwa Ben Amor','ذكاء أعمال','FREELANCER','DZ','#6D28D9','SUPPORTER',0),
('rsup_39','Antoine Rey','طاقة متجددة','FOUNDER','MA','#8B5CF6','SUPPORTER',0),
('rsup_40','Malak Hosny','تغليف ذكي','MERCHANT','TN','#7C3AED','SUPPORTER',0);
