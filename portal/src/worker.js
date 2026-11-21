/* ————————————————————————————————————————————————————————————————
   AS2 PORTAL — بوابة استشارة فريق AS2 — Vito Byte Studio
   العامل: يخدم الموقع عبر [assets] + واجهة الوكيل الذكي /api/chat
   الوكيل: قاعدة معرفة دقيقة محلية (KB — أكتوبر 2026)
           + وضع حي اختياري عبر OpenRouter (سر العامل أو مفتاح الزائر العابر)
   ———————————————————————————————————————————————————————————————— */

const VERSION = "1.0.0";
const APP = "as2-portal";
const RATE_LIMIT = 60;
const RATE_WINDOW = 60_000;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-as2-version": VERSION,
    },
  });

/* ————— تطبيع النص عربي/لاتيني ————— */
const norm = (s) =>
  (s || "")
    .toString()
    .toLowerCase()
    .replace(/[\u064B-\u0650\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/* ————— مُعزّزات مشتركة ————— */
const REG_BOOST = ["سجل", "تسجيل", "register", "sign up", "signup", "انضم", "انضمام", "انشاء حساب", "فتح حساب", "apply", "join", "خطوات", "steps", "كيف ادخل", "احصل على حساب"];
const WHAT_BOOST = ["ما هي", "ما هو", "what is", "about", "عن ", "شرح", "explain", "ايش", "شنو"];

/* ————— قاعدة المعرفة (أكتوبر 2026 — مصادر عامة محدثة) ————— */
const KB = [
  {
    id: "greeting",
    kw: ["مرحبا", "اهلا", "السلام عليكم", "هلا", "صباح الخير", "مساء الخير", "hello", "hey", "salam", "سلام", "good morning", "good evening", "hi"],
    chips: ["alignerr_what", "outlier_what", "alignerr_signup", "outlier_signup", "acceptance", "pay"],
    ar: `أهلاً بك في بوابة استشارة AS2 — فريق الأعمال الموجهة داخل Vito Byte Studio.
أنا وكيلك الذكي: أساعدك على الانضمام والقبول في منصتَي تدريب الذكاء الاصطناعي Alignerr وOutlier، وأرشدك للمهام عالية القيمة والدفع.
• اسألني: «كيف أسجل في Alignerr؟»
• أو: «كيف أنجح قبول ملفي؟»
• أو: «ما المهام عالية الدفع؟»
وفريق AS2 جاهز لمراجعة ملفك قبل التقديم — واتساب الاستوديو: 0777 84 56 35.`,
    en: `Welcome to the AS2 consultation gate — the guided-work team inside Vito Byte Studio.
I'm your AI agent: I help you join and get accepted on the two AI-training platforms, Alignerr and Outlier, and steer you to high-value, high-pay tasks.
• Ask me: "How do I register on Alignerr?"
• Or: "How do I get my profile accepted?"
• Or: "What are the highest-paying tasks?"
AS2 can review your profile before you apply — studio WhatsApp: +963 777 84 56 35.`,
  },
  {
    id: "alignerr_signup",
    kw: ["aligner", "الينر"],
    boost: REG_BOOST,
    chips: ["acceptance", "documents", "timeline", "pay"],
    ar: `خارطة التسجيل في Alignerr — 7 خطوات:
1. ادخل بحساب Google على alignerr.com وارفع سيرتك الذاتية — المنصة تعبّئ ملفك خلال ~30 ثانية، وتأكد من موقعك (يحدد الوظائف وخيارات الدفع).
2. ضبط تفضيلات المهارات والتخصص — وفعّل Alignerr Connect إن كنت مؤهلاً (وظائف مباشرة مع مختبرات الذكاء).
3. قدّم على الوظائف المطابقة لخبرتك — كل إعلان يعرض الشروط والأجر قبل البدء.
4. التحقق من الهاتف والهوية عبر Persona — وثيقة هوية حكومية سارية + كاميرا واضحة.
5. مقابلة Zara™ AI (محادثة ذكية تُبرز مهاراتك) وتقييمات إضافية عند الطلب (طلاقة لغة، معرفة تخصص — بعضها تقييم TestGorilla مؤقّت).
6. توقيع العقد وضبط الدفع — Stripe Connect أو PayPal (وبعض المساهمين عبر Deel).
7. الإلحاق: مجتمع Discord + مقدمة منصة Labelbox — وكل مشروع يبدأ بمرحلة Calibration تُراجَع فيها نماذج من عملك.
نصيحة AS2: أرسل لنا سيرتك قبل الخطوة 3 — مراجعتنا ترفع حظ القبول بوضوح.`,
    en: `Alignerr registration map — 7 steps:
1. Sign in with Google at alignerr.com and upload your resume — the platform fills your profile in ~30 seconds; confirm your location (it decides jobs and payout options).
2. Set your skill and domain preferences — and opt into Alignerr Connect if you qualify (direct jobs with AI labs).
3. Apply to jobs matching your expertise — every listing shows requirements and pay before you start.
4. Verify phone and identity via Persona — a valid government ID plus a clear camera.
5. Take the Zara™ AI interview (a smart chat highlighting your skills) plus any extra assessments (language fluency, domain knowledge — some via timed TestGorilla tests).
6. Sign the contract and set payouts — Stripe Connect or PayPal (some contributors via Deel).
7. Onboarding: the Discord community + Labelbox platform intro — and every project starts with a calibration phase where sample work is reviewed.
AS2 tip: send us your resume before step 3 — our review clearly raises acceptance odds.`,
  },
  {
    id: "alignerr_what",
    kw: ["aligner", "الينر"],
    boost: WHAT_BOOST,
    chips: ["alignerr_signup", "pay", "acceptance", "payout"],
    ar: `Alignerr هي شبكة مدرّبي الذكاء الاصطناعي المدعومة من Labelbox (شركة بنية بيانات مرموقة في سان فرانسيسكو، جمعت نحو 189 مليون دولار).
• المهمة: كتابة وتقييم وتصحيح مخرجات النماذج — برمجة، رياضيات، علوم، لغات، صوت.
• الأجر: مهام عامة 15–25$/س — تخصصات 30–50$/س — نخبوية حتى 150$/س (المتوسط المعلن ~80$).
• الشروط: خبرة حقيقية بالتخصص + إنجليزية كتابية واضحة؛ الطلبة والخريجون مرحّب بهم؛ لا ساعات دنيا (كثيرون يعملون 20–25 ساعة أسبوعياً).
• الدفع: دوري منتظم عبر Stripe Connect أو PayPal أو Deel.
ملاحظة AS2: الدفع غالباً على المهام المعتمدة لا على الساعات — الجودة هي عقدك الدائم.`,
    en: `Alignerr is the AI-trainer network powered by Labelbox (a trusted San Francisco data-infrastructure company, ~$189M raised).
• Work: writing, grading and correcting model outputs — coding, math, sciences, languages, audio.
• Pay: generalist $15–25/hr — specialist $30–50/hr — elite roles up to $150/hr (advertised average ~$80).
• Requirements: genuine domain expertise + clear written English; students and graduates welcome; no minimum hours (many work 20–25 h/week).
• Payouts: regular cycles via Stripe Connect, PayPal or Deel.
AS2 note: many projects pay per approved task, not per hour — quality is your standing contract.`,
  },
  {
    id: "outlier_signup",
    kw: ["outlier", "اوتلاير", "اوت لاير"],
    boost: REG_BOOST,
    chips: ["acceptance", "assessments", "documents", "timeline"],
    ar: `خارطة التسجيل في Outlier — 5 خطوات:
1. أنشئ حساباً مجانياً على outlier.ai واختر مجالات خبرتك بصدق (البرمجة والـ STEM تفتح الأعلى).
2. التحقق من الهوية عبر Veriff أو Persona — وثيقة حكومية سارية وصورة واضحة من هاتفك؛ رسوبها يعني استبعاداً فورياً.
3. اجتَز تقييمات الإلحاق (مهام تجريبية: تقييم ردود الذكاء، كتابة برومبتات) — خصّص ساعة إلى عدة ساعات، وأغلبها غير مدفوع (بعض وحدات المشاريع مكافأة ثابتة 10–20$).
4. انتظر القبول ودعوات المشاريع بالبريد — لكل مشروع دليل إرشادات (Project Rubric) قد يصل 30–50 صفحة؛ اقرأه كاملاً قبل أي مهمة.
5. اجتَز اختبار تمكين المشروع بدقة 80%+ على معايير تقييم RLHF والتحقق من الحقائق وكتابة التبريرات.
نصيحة AS2: لا تُسرع في التقييمات — التسرّع هو السبب الأول للرفض أو الهبوط في قوائم الأجر الأدنى.`,
    en: `Outlier registration map — 5 steps:
1. Create a free account at outlier.ai and choose your expertise areas honestly (coding and STEM open the highest tiers).
2. Verify identity via Veriff or Persona — a valid government ID and a clear phone camera; failing it means immediate disqualification.
3. Pass the onboarding assessments (sample tasks: evaluating AI replies, writing prompts) — reserve an hour to several; most are unpaid (some project modules carry a flat $10–20 bonus).
4. Wait for acceptance and project invitations by email — each project ships a 30–50-page guideline (Project Rubric); read it fully before any task.
5. Pass the project enablement exam with 80%+ accuracy on RLHF rubrics, factual verification and justification writing.
AS2 tip: never rush assessments — rushing is the #1 reason for rejection or landing in lower-pay queues.`,
  },
  {
    id: "outlier_what",
    kw: ["outlier", "اوتلاير", "اوت لاير"],
    boost: WHAT_BOOST,
    chips: ["outlier_signup", "pay", "payout", "acceptance"],
    ar: `Outlier منصة تشغّلها Scale AI — من أكبر شركات بيانات تدريب النماذج في العالم.
• المهمة: كتابة برومبتات، تقييم وترتيب ردود النماذج (RLHF)، تصحيح كود، مهام تخصصية.
• الأجر: عام 15–22$/س — متعدد اللغات 18–35$/س — STEM ‏30–45$/س — برمجة 35–55$/س+ — قانوني أمريكي 50–100$/س.
• المرونة: عمل حر عن بُعد، لا خبرة مطلوبة للمسار العام، والسعر يظهر قبل قبول أي مشروع — لا مفاجآت.
• الدفع: أسبوعياً أيام الثلاثاء (عمل الثلاثاء ← منتصف ليل الاثنين بتوقيت UTC) عبر PayPal أو AirTM.`,
    en: `Outlier is operated by Scale AI — one of the largest model-training data companies in the world.
• Work: writing prompts, evaluating and ranking model replies (RLHF), code review, specialist tasks.
• Pay: generalist $15–22/hr — multilingual $18–35/hr — STEM $30–45/hr — coding $35–55+/hr — US legal $50–100/hr.
• Flexibility: fully remote freelancing, no experience needed for the generalist track, and the rate is always shown before you accept a project — no surprises.
• Payouts: weekly on Tuesdays (work from Tuesday to Monday midnight UTC) via PayPal or AirTM.`,
  },
  {
    id: "acceptance",
    kw: ["قبول", "مقبول", "profile", "ملفي", "ملف الشخصي", "accept", "approval", "نجاح الملف", "تنجح"],
    chips: ["assessments", "documents", "as2_support", "timeline"],
    ar: `كيف ينجح قبول ملفك — قواعد AS2 الذهبية:
• خبرة حقيقية فقط: أنظمة الفرز تكشف المبالغة — قدّم على ما تتقنه فعلاً؛ الادعاء يضعف مصداقيتك على المنصة كلها.
• سيرة ذاتية بإنجازات قابلة للقياس: مشاريع، لغات برمجة، شهادات، أرقام.
• إنجليزية كتابية واضحة — شرط أساسي على المنصتين.
• التقييمات من أول مرة بدقة 80%+: اقرأ الإرشادات مرتين، برّر كل قرار بإسناد، ونص أصلي بلا أدوات ذكاء خارجية.
• التخصص يفتح الأعلى: برمجة (Python/JS)، رياضيات/STEM، قانوني، طبي، بيانات.
• القبول تنافسي (تقارير ~3% على Alignerr وقرار خلال أيام إلى أسابيع) — الصبر جزء من الخطة.
• تذكّر: على Alignerr الدفع غالباً على المهام المعتمدة — الجودة قبل السرعة.
خدمة AS2: مراجعة سيرتك وملفك قبل التقديم + محاكاة المقابلات — واتساب: 0777 84 56 35.`,
    en: `How to get your profile accepted — AS2 golden rules:
• Genuine expertise only: screening systems detect exaggeration — apply for what you truly master; overclaiming hurts your credibility platform-wide.
• A resume with measurable achievements: projects, languages, certifications, numbers.
• Clear written English — a hard requirement on both platforms.
• Pass assessments first time with 80%+: read guidelines twice, justify every decision with evidence, and write original text with no external AI tools.
• Specialization opens the top: coding (Python/JS), math/STEM, legal, medical, data.
• Acceptance is competitive (~3% reported on Alignerr; decisions take days to weeks) — patience is part of the plan.
• Remember: on Alignerr many projects pay per approved task — quality before speed.
AS2 service: resume and profile review before applying + interview simulation — WhatsApp: +963 777 84 56 35.`,
  },
  {
    id: "assessments",
    kw: ["تقييم", "تقييمات", "اختبار", "اختبارات", "assessment", "assessments", "test", "zara", "testgorilla", "quiz", "rlhf", "تمكين", "enablement", "مقابلة", "interview", "eq"],
    chips: ["acceptance", "high_value", "outlier_signup", "alignerr_signup"],
    ar: `دليل التقييمات:
• Alignerr: مقابلة Zara™ AI (محادثة تُبرز خبرتك) + تقييمات لغة/تخصص عند الطلب، بعضها عبر TestGorilla مؤقّت — تدرّب على الاختبارات المؤقتة قبلها.
• Outlier: تقييم إلحاق عام (تقييم ردود/كتابة برومبتات) ثم لكل مشروع اختبار تمكين — النجاح بدقة 80%+ على معايير RLHF والتحقق من الحقائق والتبريرات.
• قواعد ذهبية: اقرأ الدليل كاملاً (قد يصل 30–50 صفحة)، برّر كل تقييم بإسناد سطري، لا تستعن بأدوات ذكاء اصطناعي — الرصد آلي والنص الأصلي شرط.
• رسوب التقييم الأول لا يعني النهاية غالباً — لكنه قد يقلل دعوات المشاريع؛ استعد جيداً ثم أعد المحاولة.`,
    en: `Assessment guide:
• Alignerr: the Zara™ AI interview (a chat showcasing your expertise) plus language/domain assessments when required, some via timed TestGorilla tests — practice timed tests beforehand.
• Outlier: a general onboarding assessment (evaluating replies / writing prompts), then a per-project enablement exam — pass with 80%+ on RLHF rubrics, factual verification and justifications.
• Golden rules: read the full guideline (up to 30–50 pages), justify every rating with line-item evidence, and never use external AI tools — detection is automated and original text is required.
• Failing a first assessment rarely means the end — but it may reduce project invitations; prepare well and retry.`,
  },
  {
    id: "pay",
    kw: ["اجر", "راتب", "رواتب", "pay", "salary", "rate", "hourly", "per hour", "سعر الساعة", "دولار", "فلوس", "money", "earn", "كام", "كم ياخد", "تدفع"],
    chips: ["payout", "high_value", "alignerr_what", "outlier_what"],
    ar: `جدول الأجر الإرشادي (أكتوبر 2026 — يتغير حسب المشروع والموقع):
• مهام عامة: Alignerr 15–25$/س — Outlier 15–22$/س
• لغوية/متعددة اللغات: Alignerr 10–35$/س — Outlier 18–35$/س
• رياضيات/STEM: Alignerr 30–50$/س — Outlier 30–45$/س
• برمجة وهندسة برمجيات: Alignerr 50–120$/س (كبار 80–120$) — Outlier 35–55$/س+
• تخصصات نخبوية (قانوني/مالي/رؤية حاسوبية): Alignerr حتى 150$/س — Outlier (قانوني أمريكي) 50–100$/س
قاعدة ثابتة: السعر النهائي يُعلن قبل قبول كل مشروع — تحقق منه دائماً قبل البدء، وبعض مراحل التأهيل تدفع بمعدل أخفض.`,
    en: `Indicative pay table (October 2026 — varies by project and region):
• Generalist tasks: Alignerr $15–25/hr — Outlier $15–22/hr
• Language/multilingual: Alignerr $10–35/hr — Outlier $18–35/hr
• Math/STEM: Alignerr $30–50/hr — Outlier $30–45/hr
• Coding & engineering: Alignerr $50–120/hr (senior $80–120) — Outlier $35–55+/hr
• Elite specializations (legal/finance/Computer Vision): Alignerr up to $150/hr — Outlier (US legal) $50–100/hr
Standing rule: the final rate is announced before you accept each project — always check it before starting, and some enablement phases pay at a reduced rate.`,
  },
  {
    id: "payout",
    kw: ["stripe", "paypal", "deel", "airtm", "airwallex", "سحب", "استلام", "متى يوصل", "payout", "withdraw", "تحويل", "احالة", "referral", "دفعات"],
    chips: ["pay", "high_value", "as2_support"],
    ar: `قنوات الدفع:
• Alignerr: Stripe Connect أو PayPal، وبعض المساهمين عبر Deel — دورية منتظمة (أسبوعية إلى نصف شهرية حسب المشروع).
• Outlier: أسبوعياً أيام الثلاثاء — عن عمل الفترة من الثلاثاء إلى منتصف ليل الاثنين UTC — عبر PayPal أو AirTM (وAirwallex في بعض المناطق).
• إفصاح مهم: بعض مشاريع Alignerr تدفع على المهمة المعتمدة لا الساعات — المرفوض لا يُدفع، فاجتهد في الجودة قبل الحجم.
• الإحالة: Alignerr يدفع 150$ عن كل مرجع ناجح (25$ عند إلحاقه + 125$ بعد 10 ساعات عمل) — فرصة مثالية لمراجعين فريق AS2.`,
    en: `Payment rails:
• Alignerr: Stripe Connect or PayPal, some contributors via Deel — regular cycles (weekly to biweekly depending on the project).
• Outlier: weekly on Tuesdays — for work from Tuesday to Monday midnight UTC — via PayPal or AirTM (Airwallex in some regions).
• Key disclosure: some Alignerr projects pay per approved task, not hours — rejected work earns nothing, so invest in quality before volume.
• Referrals: Alignerr pays $150 per successful referral ($25 at onboarding + $125 after 10 hours worked) — a perfect channel for AS2 reviewers.`,
  },
  {
    id: "high_value",
    kw: ["عالية القيمة", "مهام عالية", "high value", "high-paying", "high paying", "highest", "نخبة", "elite", "premium", "افضل المهام", "مشاريع عالية", "مهمة غالية"],
    chips: ["pay", "acceptance", "as2_support", "assessments"],
    ar: `كيف تدخل المهام عالية القيمة والدفع:
1. ملف يضع تخصصك الأقوى أولاً — البرمجة (Python/JS) وSTEM والقانوني والطبي فوق الجميع.
2. اجتز التقييمات من أول مرة (80%+) — النتائج تحدد تيرك وقوائم الانتظار.
3. اقرأ Project Rubric كاملاً قبل كل مهمة — من يقرأ نصف الدليل يكسب نصف الأجر.
4. جودة مستمرة = أولوية في طوابير المشاريع النادرة والأعلى أجراً.
5. فعّل Alignerr Connect إن كنت مؤهلاً — وظائف مباشرة مع مختبرات الذكاء (80–120$/س).
6. راقب سعر كل مشروع قبل القبول — الأسعار تتذبذب مع الطلب.
• مجالات الطلب الأعلى: رياضيات متقدمة، برمجة، تحليل قانوني، استدلال طبي، علوم بيانات، لسانيات.`,
    en: `How to reach high-value, high-pay tasks:
1. A profile that puts your strongest domain first — coding (Python/JS), STEM, legal and medical top the board.
2. Pass assessments first time (80%+) — results decide your tier and queues.
3. Read the full Project Rubric before every task — those who read half the guide earn half the rate.
4. Consistent quality = priority queues for rare, top-paying projects.
5. Opt into Alignerr Connect if qualified — direct jobs with AI labs ($80–120/hr).
6. Watch each project's rate before accepting — prices fluctuate with demand.
• Highest-demand areas: advanced math, coding, legal analysis, medical reasoning, data science, linguistics.`,
  },
  {
    id: "as2_support",
    kw: ["as2", "دعم", "support", "الفريق", "فريق", "team", "استوديو", "studio", "واتساب", "whatsapp", "مساعدة", "help"],
    chips: ["alignerr_signup", "acceptance", "competitions", "high_value"],
    ar: `دعم فريق AS2 للأعمال الموجهة — نبقى معك قبل القبول وبعده:
• خارطة قبول شخصية: نراجع سيرتك وتفضيلات منصاتك قبل التقديم.
• تدريب على التقييمات: محاكاة Zara والاختبارات المؤقتة ومعايير RLHF بتصحيح مباشر.
• توجيه المهام: نساعدك باختيار المشاريع عالية القيمة وفهم إرشاداتها قبل قبولها.
• مراجعة الجودة: تدقيق أول مهامك قبل التسليم — الاعتماد المتكرر هو دخلك المستمر.
• شبكة الإحالات: ملفك القوي يفتح باب الإحالة (150$ عن كل مرجع ناجح على Alignerr).
تواصل مباشر: واتساب الاستوديو 0777 84 56 35.`,
    en: `AS2 guided-work support — we stay with you before and after acceptance:
• Personal acceptance map: we review your resume and platform preferences before you apply.
• Assessment training: Zara simulation, timed tests and RLHF rubrics with direct feedback.
• Task guidance: we help you pick high-value projects and understand their guidelines before accepting.
• Quality review: your first tasks are audited before submission — repeated approval is your steady income.
• Referral network: a strong profile opens the referral channel ($150 per successful Alignerr referral).
Direct contact: studio WhatsApp +963 777 84 56 35.`,
  },
  {
    id: "competitions",
    kw: ["مسابقة", "مسابقات", "competition", "competitions", "ctf", "hackathon", "هاكاثون", "icpc", "codeforces", "leetcode", "kaggle", "hacker cup", "hack the box", "tryhackme", "bug bounty", "bugcrowd", "hackerone", "topcoder", "atcoder", "codechef", "def con", "picoctf", "google ctf", "csaw", "bounty", "اولمبياد"],
    chips: ["as2_support", "high_value"],
    ar: `أبرز المحافل العالمية الدائمة والسنوية:
تطوير البرمجيات: ICPC (الأعرق جامعياً) — Meta Hacker Cup — Codeforces وAtCoder (أسبوعياً) — Topcoder وTCO — LeetCode (Weekly/Biweekly) — CodeChef — Kaggle (ذكاء اصطناعي بجوائز) — Google Summer of Code (مدفوعة) — هاكاثونات Devpost/MLH المستمرة.
الأمن السيبراني: Hack The Box وTryHackMe (مختبرات دائمة) — picoCTF وGoogle CTF وDEF CON CTF وCSAW (سنوية) — بَغي دائم: HackerOne وBugcrowd وIntigriti وYesWeHack — وبرامج الثغرات الرسمية: Google وMeta وMicrosoft وApple.
• الأجندة الشاملة لكل CTF: ctftime.org — وكل التفاصيل في قسم «الساحة العالمية» بالصفحة.`,
    en: `Top always-on and annual global arenas:
Software development: ICPC (the most prestigious university contest) — Meta Hacker Cup — Codeforces & AtCoder (weekly) — Topcoder & TCO — LeetCode (Weekly/Biweekly) — CodeChef — Kaggle (AI with major prizes) — Google Summer of Code (paid) — always-on Devpost/MLH hackathons.
Cybersecurity: Hack The Box & TryHackMe (always-on labs) — picoCTF, Google CTF, DEF CON CTF, CSAW (annual) — permanent bug bounties: HackerOne, Bugcrowd, Intigriti, YesWeHack — official VRPs: Google, Meta, Microsoft, Apple.
• The full CTF calendar: ctftime.org — full details in the "Global Arena" section of this page.`,
  },
  {
    id: "documents",
    kw: ["سيرة", "resume", "cv", "هوية", "id", "وثائق", "مستندات", "verification", "تحقق", "documents", "اوراق", "persona", "veriff"],
    chips: ["alignerr_signup", "outlier_signup", "timeline", "acceptance"],
    ar: `جهّز هذه الحزمة قبل أي تقديم:
• سيرة ذاتية إنجليزية بإنجازات قابلة للقياس (صفحة واحدة كافية غالباً).
• وثيقة هوية حكومية سارية (Persona/Veriff) + هاتف بكاميرا واضحة للتحقق الحي.
• حساب Google مستقر للدخول على Alignerr.
• بيانات دفع جاهزة: PayPal أساساً، ثم Stripe/Deel (Alignerr) وAirTM (Outlier) حسب متاح بلدك.
• بريد تتابع دؤوب — دعوات المشاريع تصله ولا تنتظر.
نصيحة: صوّر هويتك على خلفية نظيفة بإضاءة جيدة — أغلب رسوب التحقق الحي سببه الإضاءة والانعكاس.`,
    en: `Prepare this pack before any application:
• An English resume with measurable achievements (one page usually suffices).
• A valid government ID (Persona/Veriff) + a phone with a clear camera for live verification.
• A stable Google account for Alignerr sign-in.
• Payout details ready: PayPal first, then Stripe/Deel (Alignerr) and AirTM (Outlier) per your country.
• Watchful email — project invitations land there and won't wait.
Tip: shoot your ID on a clean background with good lighting — most live-verification failures are lighting/glare issues.`,
  },
  {
    id: "timeline",
    kw: ["كم يوم", "مدة", "how much time", "وقت القبول", "متوسط القبول", "duration", "waiting", "انتظار", "تاخر", "متاخر"],
    boost: ["كم يستغرق", "how long", "كم يستغرق القبول"],
    chips: ["acceptance", "documents", "alignerr_signup", "outlier_signup"],
    ar: `التوقيت الواقعي:
• Alignerr: المراجعة أيام إلى أسابيع (متوسط تقارير الإلحاق ~أسبوعان، وبعض التقارير تصل ~4 أسابيع) — القبول تنافسي (~3% تقاريراً).
• Outlier: التقييمات في يوم واحد إن استعدت جيداً، ثم القبول ودعوة أول مشروع أيام إلى أسبوعين حسب الطلب على تخصصك.
• الملفات المُحكمة (خبرة موثقة + تقييمات 80%+ من أول مرة) تُسرّع كل المسار.
• أثناء الانتظار: درّب نفسك على الاختبارات المؤقتة وجهّز عينات عملك — لا فراغات في سيرتك.`,
    en: `Realistic timeline:
• Alignerr: review takes days to weeks (reported onboarding averages ~2 weeks, some ~4) — acceptance is competitive (~3% reported).
• Outlier: assessments in one day if you prepare well, then acceptance and a first project invite within days to two weeks depending on demand for your domain.
• Sharp profiles (documented experience + first-try 80%+ assessments) accelerate the whole path.
• While waiting: practice timed tests and prepare work samples — no gaps in your resume.`,
  },
  {
    id: "problems",
    kw: ["رفض", "rejected", "rejection", "قلة", "قليلة", "لا مهام", "لا توجد مهام", "مشكلة", "problem", "issue", "حظر", "banned", "suspended", "ايقاف", "تعطل", "بطيء", "بطيئة"],
    chips: ["acceptance", "as2_support", "outlier_signup", "documents"],
    ar: `إن قلّت المهام أو رُفض ملفك — خطة AS2:
• راجع تخصصاتك المعلنة: زد الدقة وقلل الادعاء — المطابقة تتحسن حصراً بالصدق.
• أعِد التقييمات بعد استعداد حقيقي (الإرشادات كاملة مرتين + تبريرات بإسناد).
• جرّب المنصة الثانية بالتوازي — كثيرون في AS2 يجمعون Alignerr وOutlier معاً.
• فعّل Alignerr Connect ووسّع اللغات/المجالات القريبة من تخصصك.
• راقب بريدك ولوحة الفرص يومياً — المشاريع تُغلق سريعاً.
• اطلب مراجعة مجانية من فريق AS2 — واتساب: 0777 84 56 35.`,
    en: `Few tasks or a rejected profile — the AS2 plan:
• Re-audit your declared specialties: add precision, cut claims — matching improves only through honesty.
• Retake assessments after real preparation (full guidelines twice + evidenced justifications).
• Run the second platform in parallel — many in AS2 combine Alignerr and Outlier.
• Opt into Alignerr Connect and widen adjacent languages/domains.
• Check email and the opportunities board daily — projects close fast.
• Ask AS2 for a free profile review — WhatsApp: +963 777 84 56 35.`,
  },
  {
    id: "fallback",
    kw: [],
    chips: ["alignerr_what", "outlier_what", "alignerr_signup", "outlier_signup", "acceptance", "pay", "competitions"],
    ar: `لم أفهم سؤالك بدقة كافية — لكن هذه مواضيعي:
• «ما هي Alignerr؟» و«ما هي Outlier؟»
• «كيف أسجل في كل منصة؟»
• «كيف أنجح قبول ملفي؟»
• «التقييمات وكيف أنجحها؟»
• «الأجر والدفع؟»
• «المهام عالية القيمة؟»
• «دعم فريق AS2؟»
• «المسابقات العالمية؟»
اكتب سؤالك بأي صيغة — وأنا أجهّز الجواب الدقيق.`,
    en: `I didn't catch your question precisely — but here are my topics:
• "What is Alignerr?" and "What is Outlier?"
• "How do I register on each platform?"
• "How do I get my profile accepted?"
• "Assessments and how to pass them?"
• "Pay and payouts?"
• "High-value tasks?"
• "AS2 team support?"
• "Global competitions?"
Phrase your question any way you like — I'll prepare the precise answer.`,
  },
];

const CHIP_IDS = new Set(KB.flatMap((k) => k.chips).concat(KB.map((k) => k.id)));

export { KB, CHIP_IDS, matchIntent };

/* ————— مطابقة السؤال على النية ————— */
function matchIntent(q) {
  const t = norm(q);
  const tokens = t ? t.split(" ").length : 0;
  let best = null;
  let bestScore = 0;
  for (const it of KB) {
    if (it.id === "greeting" && tokens > 6) continue;
    if (it.id === "fallback") continue;
    let s = 0;
    for (const k of it.kw) {
      const nk = norm(k);
      if (!nk) continue;
      if (nk.length <= 4 && /^[\x20-\x7e]+$/.test(nk)) {
        if (new RegExp("(^| )" + nk + "( |$)").test(t)) s += 1;
      } else if (t.includes(nk)) s += 1;
    }
    for (const k of it.boost || []) {
      const nk = norm(k);
      if (nk && t.includes(nk)) s += 3;
    }
    if (s > bestScore) {
      bestScore = s;
      best = it;
    }
  }
  return best;
}

function kbAnswer(q, lang) {
  const it = matchIntent(q) || KB.find((x) => x.id === "fallback");
  return {
    intent: it.id,
    text: lang === "en" ? it.en : it.ar,
    chips: it.chips.filter((c) => CHIP_IDS.has(c)),
  };
}

/* ————— وضع الوكيل الحي (اختياري — OpenRouter) ————— */
const SYSTEM_PROMPT = `You are the official consultation agent of AS2 — the guided AI-work team inside Vito Byte Studio. You advise new developers joining the team about two AI-training platforms and how to succeed on them.

VERIFIED BRIEFING (October 2026):
[Alignerr — powered by Labelbox] Sign in with Google at alignerr.com + upload resume (profile auto-fills in ~30s; location affects jobs/payouts). Set skill/domain preferences; opt into Alignerr Connect (direct AI-lab jobs) if qualified. Apply to matching jobs (each listing shows requirements and pay before starting). Verify phone+ID via Persona (valid government ID). Take the Zara AI interview + extra assessments when required (language/domain; some timed TestGorilla tests). Sign contract; payouts via Stripe Connect or PayPal (some contributors via Deel). Onboarding: Discord community + Labelbox intro; every project starts with a calibration phase. Pay: generalist $15–25/hr, specialist $30–50/hr, elite up to $150/hr (advertised average ~$80). Acceptance is competitive (~3% reported; days to weeks). Many projects pay per APPROVED task, not hours — rejected work earns nothing. Referral: $150 per successful referral ($25 at onboarding + $125 after 10 hours worked).

[Outlier — operated by Scale AI] Free account at outlier.ai; choose expertise honestly (coding/STEM open the highest tiers). ID verification via Veriff or Persona. Onboarding assessments (sample tasks: evaluating AI replies, writing prompts; mostly unpaid; some project modules carry a $10–20 flat bonus). Then project invitations by email; each project ships a 30–50-page Project Rubric; pass the enablement exam with 80%+ on RLHF rubrics, factual verification and justification writing. Pay: generalist $15–22/hr, multilingual $18–35/hr, STEM $30–45/hr, coding $35–55+/hr, US legal $50–100/hr. Weekly payouts on Tuesdays (Tuesday to Monday midnight UTC) via PayPal or AirTM (Airwallex in some regions).

[Acceptance rules] Genuine expertise only (screening detects exaggeration). Resume with measurable achievements. Clear written English. Pass assessments first time at 80%+: read guidelines twice, justify every decision with evidence, original text, never use external AI tools. Specialization opens the top (Python/JS, STEM, legal, medical, data).

RULES: Reply in the user's language (Arabic if they write Arabic, English otherwise). Be structured, concrete and honest — never invent rates, guarantees or acceptance promises; say when figures vary by project. Keep answers under 220 words unless the user asks for detail. End with one concrete next step. When useful, mention that AS2 offers free profile review and assessment training (studio WhatsApp: +963 777 84 56 35).`;

async function askLLM(q, lang, key, history, env) {
  const messages = [
    {
      role: "system",
      content:
        SYSTEM_PROMPT +
        (lang === "ar" ? "\n\nThe user reads Arabic — reply in Arabic." : "\n\nThe user reads English — reply in English."),
    },
  ];
  for (const m of (history || []).slice(-8)) {
    if (m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim()) {
      messages.push({ role: m.role, content: m.content.slice(0, 1500) });
    }
  }
  messages.push({ role: "user", content: q.slice(0, 2000) });
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { authorization: "Bearer " + key, "content-type": "application/json" },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      messages,
      max_tokens: 900,
      temperature: 0.4,
    }),
    signal: AbortSignal.timeout(28_000),
  });
  if (!r.ok) throw new Error("llm_" + r.status);
  const d = await r.json();
  const text = d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
  if (!text || !text.trim()) throw new Error("llm_empty");
  return text.trim();
}

/* ————— حد معدل بسيط لكل IP ————— */
const buckets = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const b = buckets.get(ip) || { n: 0, t: now };
  if (now - b.t > RATE_WINDOW) {
    b.n = 0;
    b.t = now;
  }
  b.n++;
  buckets.set(ip, b);
  if (buckets.size > 5000) buckets.clear();
  return b.n > RATE_LIMIT;
}

/* ————— العامل ————— */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (!path.startsWith("/api/")) {
      return new Response("Not found", { status: 404 });
    }

    if (path === "/api/health" && request.method === "GET") {
      return json({ ok: true, v: VERSION, app: APP, agent: "kb+llm", updated: "2026-10" });
    }

    if (path === "/api/chat") {
      const ip = request.headers.get("cf-connecting-ip") || "local";
      if (rateLimited(ip)) return json({ ok: false, error: "rate_limited" }, 429);

      if (request.method === "GET") {
        const q = (url.searchParams.get("q") || "").trim();
        const lang = url.searchParams.get("lang") === "en" ? "en" : "ar";
        if (!q) return json({ ok: false, error: "empty_q" }, 400);
        const r = kbAnswer(q, lang);
        return json({ ok: true, mode: "kb", ...r });
      }

      if (request.method === "POST") {
        const body = await request.json().catch(() => null);
        const q = body && typeof body.q === "string" ? body.q.trim() : "";
        const lang = body && body.lang === "en" ? "en" : "ar";
        const history = body && Array.isArray(body.history) ? body.history : [];
        if (!q) return json({ ok: false, error: "empty_q" }, 400);
        if (q.length > 2000) return json({ ok: false, error: "q_too_long" }, 413);

        const key = ((body && typeof body.key === "string" && body.key.trim()) || env.OPENROUTER_API_KEY || "").trim();
        if (key) {
          try {
            const text = await askLLM(q, lang, key, history, env);
            return json({ ok: true, mode: "llm", intent: null, text, chips: ["acceptance", "pay", "as2_support"].filter((c) => CHIP_IDS.has(c)) });
          } catch (e) {
            const r = kbAnswer(q, lang);
            return json({ ok: true, mode: "kb", ...r, notice: "llm_fallback" });
          }
        }
        const r = kbAnswer(q, lang);
        return json({ ok: true, mode: "kb", ...r });
      }

      return json({ ok: false, error: "method_not_allowed" }, 405);
    }

    return json({ ok: false, error: "unknown_route" }, 404);
  },
};
