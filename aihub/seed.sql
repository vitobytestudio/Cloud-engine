-- AIHub — سقوف الباقات (حية، تُعدَّل بلا نشر)
DELETE FROM plan_limits;
INSERT INTO plan_limits (plan, instant_daily, proxy_rpm, agents, instant_img_daily, vault_size) VALUES
  ('FREE', 20,   10,  1,  5,   65536),
  ('PRO',  200,  60,  10, 40,  1048576),
  ('TEAM', 1000, 300, 50, 150, 5242880);
