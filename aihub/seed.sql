-- Nexus Hub — سقوف الباقات (حية، تُعدَّل بلا نشر)
-- فترة التجريب: كل شيء مجاني بسقوف سخية — التسعير يُفعَّل لاحقاً بقرار المالك (Grandfathering محفوظ)
DELETE FROM plan_limits;
INSERT INTO plan_limits (plan, instant_daily, proxy_rpm, agents, auto_daily, instant_img_daily, vault_size) VALUES
  ('FREE', 500,  60,  5,  300, 60,  2097152),
  ('PRO',  1500, 120, 10, 1200, 150, 5242880),
  ('TEAM', 5000, 300, 50, 5000, 400, 10485760);
