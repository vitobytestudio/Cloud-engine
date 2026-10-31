-- Nexus Hub — سقوف الباقات (حية، تُعدَّل بلا نشر)
-- فترة التجريب: كل شيء مجاني بسقوف سخية — التسعير يُفعَّل لاحقاً بقرار المالك (Grandfathering محفوظ)
DELETE FROM plan_limits;
INSERT INTO plan_limits (plan, instant_daily, proxy_rpm, agents, instant_img_daily, vault_size) VALUES
  ('FREE', 200,  60,  5,  30,  1048576),
  ('PRO',  600,  120, 10, 80,  5242880),
  ('TEAM', 2000, 300, 50, 250, 10485760);
