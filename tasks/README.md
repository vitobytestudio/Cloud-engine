# جسر NEXUS عبر Git — بروتوكول صندوق المهام

الفرق الجوهري عن أي أتمتة سحابية: **المتصفح ينفذ في جهازك أنت**، بشبكتك وجلستك وأمام عينك،
والوكيل في Arena يتحرك داخل حدوده (GitHub فقط): يجهز المهام ويقرأ النتائج. لا يوجد أي
Workflow يشغل متصفحاً من خوادم GitHub — ذلك محذوف عمداً وحصرياً.

## كيف يدور

```
الوكيل (Arena)                     أنت (جهازك)
─────────────                      ───────────
يكتب tasks/request.json   ─push─►  python tools/local_worker.py --worker
                                   ▸ يفتح نافذة كروم (ملف تعريف خاص بالجسر)
                                   ▸ ينفذ المهام أمام عينك
                                   ▸ يرفع assets/<id>/* + tasks/response.json
يسحب النتائج من الفرع     ◄─push─
ويركّبها في NEXUS
```

## صيغة المهمة (tasks/request.json — مصفوفة)

```json
[
  {"id": "shot_1",  "action": "screenshot", "url": "https://example.com", "wait_ms": 4000, "full": false},
  {"id": "txt_1",   "action": "extract",    "url": "https://example.com", "max_chars": 20000},
  {"id": "chat_1",  "action": "chat", "url": "https://gemini.google.com/app",
   "input_selector": "textarea", "message": "نص الرسالة", "reply_ms": 30000}
]
```

- `screenshot`: صورة للصفحة → `assets/<id>/shot.png`.
- `extract`: نص الصفحة الظاهر → `assets/<id>/text.txt`.
- `chat`: تعبئة حقل الرسالة وإرسالها (Enter) ثم لقطة كاملة + نص الصفحة → `reply.png` / `reply.txt`.
  - محددات الحقول تتغير مع تحديثات الواجهات — عدّل `input_selector` عند الحاجة.
- بعد المعالجة يفرّغ العامل `request.json` ويكتب النتيجة في `response.json` بحالة `done/failed`.

## أول تشغيل (دقيقتان)

```bash
git clone https://github.com/vitobytestudio/cloud-engine nexus-bridge
cd nexus-bridge
git checkout main            # الفرع العام — أو أي فرع يحدده الوكيل
pip install playwright && python -m playwright install chromium
python tools/local_worker.py --worker
```

أول مرة تريد جلسة مسجلة (جيميني/شات جي بي تي): سجّل دخولك **بيدك** داخل نافذة الجسر
التي يفتحها — الملف التعريفي `~/.nexus-bridge-chrome` يحفظها لجهازك وحدك، ولا تُرفع
كوكيز ولا كلمات سر إلى أي مكان إطلاقاً.

## حدود واضحة

1. لا سر ولا جلسة يُخزن في GitHub — أي مقترح كهذا يُرفض دائماً.
2. لا Workflow ينفذ متصفحاً ضد google.com / chatgpt.com من خوادم GitHub — محذوف من البنية عمداً.
3. أتمتة حسابك الشخصي مسؤوليتك: اقرأ شروط كل منصة؛ الأتمتة المحلية بالإشراف البشري هي النمط الذي تعتمده الأدوات المثبتة (Claude in Chrome وPlaywright MCP وأشباهها).
4. أسرع بديل رسمي بلا متصفح أصلاً: مفاتيح API في سر `AI_KEYS` — وكيل NEXUS يشتغل بها فوراً.
