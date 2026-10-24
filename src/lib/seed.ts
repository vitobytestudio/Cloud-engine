import type { DB, Lead, Platform, Opportunity, Connector } from "./types";
import { iso, uid } from "./utils";

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function lead(
  name: string,
  handle: string,
  platform: Platform,
  opts: Partial<Lead> & { ageMs: number }
): Lead {
  const { ageMs, ...rest } = opts;
  return {
    id: uid(),
    name,
    handle,
    platform,
    status: "new",
    tags: [],
    score: 50,
    consent: Boolean(rest.phone),
    source: "يدوي",
    createdAt: iso(-ageMs),
    lastActivityAt: iso(-ageMs),
    ...rest,
  };
}

export function buildSeed(): DB {
  const now = Date.now();

  const leads: Lead[] = [
    lead("أمينة بن عمر", "@amina.coiffure", "instagram", {
      ageMs: 13 * DAY,
      phone: "0550 12 34 56",
      source: "أتمتة «سعر»",
      status: "customer",
      tags: ["صالون", "وهران", "VIP"],
      score: 92,
      notes: "صالون تجميل في وهران — طلبت ماكينة ميكر + كرسيين.",
    }),
    lead("يوسف حمادي", "+213661998877", "whatsapp", {
      ageMs: 11 * DAY,
      phone: "0661 99 88 77",
      source: "واتساب — كاتالوغ",
      status: "qualified",
      tags: ["مستعد للشراء"],
      score: 81,
    }),
    lead("سارة مرزوق", "@sara.style_", "tiktok", {
      ageMs: 10 * DAY,
      source: "مراقبة «تجهيزات صالون»",
      status: "contacted",
      tags: ["مؤثرة"],
      score: 57,
    }),
    lead("كريم بلحاج", "Karim.Blahaj", "facebook", {
      ageMs: 9 * DAY,
      source: "أتمتة «حجز»",
      status: "contacted",
      tags: [],
      score: 64,
    }),
    lead("نسرين قدور", "@nesrine.kd", "instagram", {
      ageMs: 8 * DAY,
      phone: "0770 45 21 30",
      source: "أتمتة «سعر»",
      status: "qualified",
      tags: ["ماكياج"],
      score: 74,
    }),
    lead("محمد الأمين", "+213770998812", "whatsapp", {
      ageMs: 7 * DAY,
      phone: "0770 99 88 12",
      source: "صفحة الالتقاط: عرض الصالونات",
      status: "customer",
      tags: ["صالون", "قسنطينة"],
      score: 88,
    }),
    lead("فاطمة الزهراء", "@fati.zrt", "instagram", {
      ageMs: 6 * DAY,
      source: "أتمتة «توصيل»",
      status: "contacted",
      tags: [],
      score: 60,
    }),
    lead("عبد الرحمان طايبي", "Abderrahmane.T", "facebook", {
      ageMs: 5 * DAY,
      source: "مراقبة «ماكينة حلاقة»",
      status: "lost",
      tags: ["ميزانية منخفضة"],
      score: 30,
      notes: "السعر خارج ميزانيته حالياً — يُعاد التواصل معه موسمياً.",
    }),
    lead("ليلى شريفي", "@lila.sheriff", "instagram", {
      ageMs: 4 * DAY,
      phone: "0555 77 88 90",
      source: "صفحة الالتقاط: عرض الصالونات",
      status: "new",
      tags: [],
      score: 68,
    }),
    lead("إلياس مزيان", "@elyas.mz", "tiktok", {
      ageMs: 3 * DAY,
      source: "مراقبة «كرسي باربر»",
      status: "new",
      tags: ["باربر"],
      score: 52,
    }),
    lead("خديجة سعدي", "+213661445522", "whatsapp", {
      ageMs: 2 * DAY,
      phone: "0661 44 55 22",
      source: "واتساب — كاتالوغ",
      status: "contacted",
      tags: [],
      score: 71,
    }),
    lead("رامي بن علي", "@rami.benali", "instagram", {
      ageMs: 5 * HOUR,
      source: "أتمتة «توصيل»",
      status: "new",
      tags: [],
      score: 47,
    }),
    lead("وليد عثماني", "@walid.othmani", "instagram", {
      ageMs: 2 * HOUR,
      phone: "0699 33 22 11",
      source: "أتمتة «سعر»",
      status: "new",
      tags: ["باربر"],
      score: 77,
    }),
  ];

  const conversations: DB["conversations"] = [];
  const messages: DB["messages"] = [];

  const conv = (
    leadIdx: number,
    msgs: Array<["in" | "out", string, number]>, // [direction, body, ageMs]
    unread = 0
  ) => {
    const l = leads[leadIdx];
    const id = uid();
    const last = msgs[msgs.length - 1];
    conversations.push({
      id,
      leadId: l.id,
      platform: l.platform,
      unread,
      lastMessageAt: iso(-last[2]),
      lastMessagePreview: last[1],
    });
    for (const [direction, body, ageMs] of msgs) {
      messages.push({
        id: uid(),
        conversationId: id,
        direction,
        body,
        status: direction === "out" ? "read" : "delivered",
        createdAt: iso(-ageMs),
      });
    }
  };

  conv(
    0,
    [
      ["in", "السلام عليكم، شفت منشور الميكر 👌 شحال السعر؟", 26 * HOUR],
      ["out", "وعليكم السلام أمينة 🌸 الميكر الأصلي بـ 34.900 دج مع توصيل لـ 58 ولاية. نبعثلك الكاتالوغ الكامل؟", 25.5 * HOUR],
      ["in", "اه باراكا الله فيكم، عندي صالون في وهران", 25 * HOUR],
      ["out", "ممتاز! عندنا خصم خاصة للصالونات 💜 نبعتلك التفاصيل على هذا الرقم؟", 24.8 * HOUR],
      ["in", "اه هذا رقمي 0550 12 34 56", 24 * HOUR],
    ],
    0
  );
  conv(
    1,
    [
      ["in", "السلام عليكم، حبيت نسقسي واش عندكم من كراسي باربر", 3 * HOUR],
      ["out", "وعليكم السلام يوسف 🙌 عندنا 3 موديلات: عادي 18.500، فاخر 27.900، وبروفيسيونال 41.000 دج. أنا نعرفلك الفرق بالصور؟", 2.8 * HOUR],
      ["in", "اه عيني البروفيسيونال شحال توصيلو لقسنطينة؟", 2.5 * HOUR],
    ],
    1
  );
  conv(
    3,
    [
      ["in", "سلام، نحب نحجز موعد لتركيب التجهيزات", 20 * HOUR],
      ["out", "مرحبا كريم 🌟 مرحباً! أقولنا وين المكان والأيام المناسبة ونثبتوها فوراً.", 19.5 * HOUR],
    ],
    0
  );
  conv(
    4,
    [
      ["in", "سلام خويت نقولك بلي الميكر ولات في المدينة؟ 🥲", 40 * MIN],
      ["out", "أهلاً نسرين 🌸 اه وصلنا أمس! خاصك نحجزولك واحدة من الكمية الجديدة؟", 35 * MIN],
      ["in", "اه باراكا الله فيكم. شحال ولاو؟", 30 * MIN],
    ],
    1
  );
  conv(
    5,
    [
      ["in", "مرحبا، أنا صاحب صالون جديد في قسنطينة ونحب نجهلو كامل", 30 * HOUR],
      ["out", "مرحباً بك محمد 🎉 فينا كامل: كراسي، مرايا، محركات، أدوات. نصايحك تبدا بهذا الباك: https://mirsal.dz/p/salon-offer", 29 * HOUR],
      ["in", "شفت الباك، حلو بزاف. نحب نفاوض على الثمن", 28 * HOUR],
      ["out", "أكيد! المدير التاجر يحكي معك اليوم إن شاء الله 🤝", 27 * HOUR],
    ],
    0
  );
  conv(
    6,
    [
      ["in", "التوصيل يشمل لبسكرة؟", 90 * MIN],
      ["out", "اه فاطمة، نوصلو لكل الولايات 🚚 التوصيل مجاني للطلبيات فوق 50.000 دج.", 80 * MIN],
      ["in", "تمام، راح نرجعلك", 75 * MIN],
    ],
    0
  );
  conv(
    10,
    [
      ["in", "سلام عليكم، بعتولي الكاتالوغ من قبل وشفتو، عندي سؤال على المحركات", 5 * HOUR],
      ["out", "وعليكم السلام خديجة 🌷 تفضلي، أنا في الخدمة.", 4.8 * HOUR],
    ],
    1
  );
  conv(
    11,
    [
      ["in", "التوصيل لقسنطينة كيماش؟", 4 * HOUR],
      ["out", "مرحباً رامي 🚚 نوصلو لقسنطينة في 48 سا، ومجاناً فوق 50.000 دج.", 3.9 * HOUR],
    ],
    0
  );

  const automations: DB["automations"] = [
    {
      id: uid(),
      name: "رد فوري على كلمة «سعر»",
      platform: "instagram",
      trigger: "comment_keyword",
      keyword: "سعر",
      replyTemplate:
        "هلا بيك {{الاسم}} 🌸 الأسعار حسب الموديل — أبعثلك الكاتالوغ الكامل هنا في الخاص؟ وإن حبيت، اكتبلي رقمك ونتصلو بيك اليوم!",
      ctaLink: "",
      collectPhone: true,
      active: true,
      triggeredCount: 184,
      leadsCaptured: 63,
      createdAt: iso(-20 * DAY),
    },
    {
      id: uid(),
      name: "حجز المواعيد تلقائياً",
      platform: "facebook",
      trigger: "comment_keyword",
      keyword: "حجز",
      replyTemplate:
        "مرحباً {{الاسم}} 🌟 للحجز، اختار اليوم المناسب من هنا: {{الرابط}} — المواعيد محدودة هذا الأسبوع!",
      ctaLink: "https://cal.com/anaqa-studio",
      collectPhone: true,
      active: true,
      triggeredCount: 97,
      leadsCaptured: 41,
      createdAt: iso(-18 * DAY),
    },
    {
      id: uid(),
      name: "معلومات التوصيل — تيك توك",
      platform: "tiktok",
      trigger: "comment_keyword",
      keyword: "توصيل",
      replyTemplate:
        "🚚 نوصلو لكل الولايات في 48-72 سا! التوصيل مجاني فوق 50.000 دج. قولي ولايتك ونعطيك التفاصيل بالضبط.",
      collectPhone: false,
      active: true,
      triggeredCount: 142,
      leadsCaptured: 38,
      createdAt: iso(-15 * DAY),
    },
    {
      id: uid(),
      name: "إرسال الكاتالوغ على واتساب",
      platform: "whatsapp",
      trigger: "dm_keyword",
      keyword: "كاتالوغ",
      replyTemplate:
        "أهلاً بك 🌟 هذا الكاتالوغ الكامل 2026: {{الرابط}} — ولو حبيت مساعدة في الاختيار أنا هنا!",
      ctaLink: "https://mirsal.dz/catalogue-2026",
      collectPhone: false,
      active: false,
      triggeredCount: 56,
      leadsCaptured: 22,
      createdAt: iso(-12 * DAY),
    },
  ];

  const rules: DB["rules"] = [
    { id: uid(), keyword: "تجهيزات صالون", platforms: ["instagram", "tiktok"], active: true, matchesCount: 63, createdAt: iso(-14 * DAY) },
    { id: uid(), keyword: "ماكينة حلاقة", platforms: ["facebook", "x"], active: true, matchesCount: 41, createdAt: iso(-13 * DAY) },
    { id: uid(), keyword: "كرسي باربر", platforms: ["facebook", "instagram"], active: true, matchesCount: 28, createdAt: iso(-10 * DAY) },
    { id: uid(), keyword: "صالون تجميل وهران", platforms: ["instagram"], active: true, matchesCount: 17, createdAt: iso(-7 * DAY) },
    { id: uid(), keyword: "ماكياج احترافي", platforms: ["tiktok"], active: false, matchesCount: 9, createdAt: iso(-4 * DAY) },
  ];

  const mentions: DB["mentions"] = [
    {
      id: uid(),
      ruleId: rules[0].id,
      platform: "tiktok",
      authorName: "سارة مرزوق",
      authorHandle: "@sara.style_",
      content: "ولا حد يعرف وين نلقا تجهيزات صالون أصلية في وهران؟ عندي افتتاح الشهر الجاي 💇‍♀️",
      url: "#",
      likes: 342,
      comments: 47,
      sentiment: "positive",
      converted: false,
      createdAt: iso(-25 * MIN),
    },
    {
      id: uid(),
      ruleId: rules[2].id,
      platform: "facebook",
      authorName: "بلال عمراني",
      authorHandle: "Bilal.Omrani",
      content: "نورمالمي كرسي باربر بروفيسيونال، الميزانية حول 30 ألف. اقترحوالي موديلات 👊",
      url: "#",
      likes: 18,
      comments: 12,
      sentiment: "neutral",
      converted: false,
      createdAt: iso(-2 * HOUR),
    },
    {
      id: uid(),
      ruleId: rules[3].id,
      platform: "instagram",
      authorName: "مليكة ح.",
      authorHandle: "@malika.hamdi",
      content: "أحلى صالون تجميل وهران فتح قريب وعمره يحتاج ملي حلاقة 😍 شكون يجاوبني على الأسعار؟",
      url: "#",
      likes: 96,
      comments: 23,
      sentiment: "positive",
      converted: false,
      createdAt: iso(-3 * HOUR),
    },
    {
      id: uid(),
      ruleId: rules[1].id,
      platform: "x",
      authorName: "ياسين بودية",
      authorHandle: "@yacine_b",
      content: "ماكينة حلاقة المستعملة خذلتني في وسط الشغل 🙄 هذي المرة نقطع غليان ونشري جديدة أصليّة.",
      url: "#",
      likes: 41,
      comments: 9,
      sentiment: "negative",
      converted: false,
      createdAt: iso(-6 * HOUR),
    },
    {
      id: uid(),
      ruleId: rules[0].id,
      platform: "instagram",
      authorName: "هند بلقاسم",
      authorHandle: "@hind.blqs",
      content: "قائمة تجهيزات صالون كاملة نحتاجها للعرض تاع الاستيراد، شكون عندو مصدر ثقة؟",
      url: "#",
      likes: 12,
      comments: 5,
      sentiment: "neutral",
      converted: true,
      createdAt: iso(-9 * HOUR),
    },
  ];

  const campaigns: DB["campaigns"] = [
    {
      id: uid(),
      name: "الجمعة البيضاء — خصم 30٪",
      channel: "whatsapp",
      template:
        "مرحباً {{الاسم}} 👋 عرض الجمعة البيضاء وصل! خصم 30٪ على كل تجهيزات الصالونات حتى منتصف الليل 🖤 الطلب: {{الرابط}}",
      audienceTag: "مهم",
      status: "sent",
      targeted: 420,
      sent: 412,
      delivered: 398,
      read: 351,
      replied: 87,
      createdAt: iso(-8 * DAY),
    },
    {
      id: uid(),
      name: "تذكير مواعيد الصيانة",
      channel: "whatsapp",
      template:
        "أهلاً {{الاسم}} 🌸 ماكينتك تستحق صيانة! عندك خصم 15٪ على الصيانة هذا الأسبوع. نحجزلك موعد؟",
      audienceTag: "صالون",
      status: "sending",
      targeted: 180,
      sent: 96,
      delivered: 90,
      read: 61,
      replied: 14,
      createdAt: iso(-1 * HOUR),
    },
    {
      id: uid(),
      name: "كاتالوغ 2026 — الصالونات الجديدة",
      channel: "whatsapp",
      template:
        "مرحباً {{الاسم}} 🎉 كاتالوغ 2026 وصل بأسعار الجملة للصالونات الجديدة. شوفو هنا: {{الرابط}}",
      audienceTag: "باربر",
      status: "draft",
      targeted: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      replied: 0,
      createdAt: iso(-20 * MIN),
    },
  ];

  const capturePages: DB["capturePages"] = [
    {
      id: uid(),
      slug: "salon-offer",
      title: "عرض الصالونات الجديدة",
      headline: "جهّز صالونك كاملاً ووفّر 20٪",
      subtext:
        "باك تجهيزات كامل: كرسي، مرآة، محرك، وأدوات احترافية — مع تركيب مجاني في وهران والضواحي. سجل بياناتك ويتصل بك مستشارنا اليوم.",
      offer: "خصم 20٪ + توصيل مجاني لأول طلبية",
      ctaLabel: "أرسل طلب الحجز",
      askPhone: true,
      askEmail: false,
      published: true,
      views: 342,
      conversions: 47,
      createdAt: iso(-6 * DAY),
    },
    {
      id: uid(),
      slug: "makeup-course",
      title: "ورشة ماكياج احترافي",
      headline: "ورشة ماكياج احترافي — مقاعد محدودة",
      subtext: "3 أيام تدريب عملي مع شهادة معتمدة. سجل اهتمامك ونبعتلك البرنامج والأسعار.",
      ctaLabel: "سجّل اهتمامي",
      askPhone: true,
      askEmail: true,
      published: false,
      views: 0,
      conversions: 0,
      createdAt: iso(-2 * DAY),
    },
  ];

  const activity: DB["activity"] = [
    { id: uid(), type: "lead", text: "عميل جديد من أتمتة «سعر» — وليد عثماني", platform: "instagram", createdAt: iso(-2 * HOUR) },
    { id: uid(), type: "automation", text: "رد تلقائي أُرسل إلى 3 متابعين علّقوا بكلمة «سعر»", platform: "instagram", createdAt: iso(-3 * HOUR) },
    { id: uid(), type: "message", text: "رسالة جديدة من يوسف حمادي على واتساب", platform: "whatsapp", createdAt: iso(-3 * HOUR) },
    { id: uid(), type: "mention", text: "ذكر جديد لـ «تجهيزات صالون» من @sara.style_", platform: "tiktok", createdAt: iso(-25 * MIN) },
    { id: uid(), type: "campaign", text: "حملة «تذكير مواعيد الصيانة» تُرسل الآن — 96/180", platform: "whatsapp", createdAt: iso(-1 * HOUR) },
    { id: uid(), type: "lead", text: "عميل جديد من صفحة الالتقاط «عرض الصالونات»", platform: "instagram", createdAt: iso(-4 * DAY) },
    { id: uid(), type: "system", text: "تم ربط حساب إنستغرام للأعمال بنجاح", createdAt: iso(-20 * DAY) },
  ];

  return {
    workspace: {
      name: "أناقة ستور",
      tagline: "تجهيزات صالونات وتجميل — وهران",
      city: "وهران",
    },
    leads,
    conversations,
    messages,
    automations,
    rules,
    mentions,
    campaigns,
    capturePages,
    activity,
    opportunities: buildOpportunities(),
    connectors: buildConnectors(),
    profile: {
      professionId: "",
      keywords: [],
      wilayas: ["كل الولايات"],
      alertChannel: "app",
      setupDone: false,
      createdAt: iso(),
    },
    subscription: {
      planId: "free",
      status: "active",
      startedAt: iso(-3 * DAY),
      renewsAt: iso(27 * DAY),
      totalDelivered: 41,
    },
  };
}

// ——— رصّاد الفرص: بيانات أولية (توقيتات حديثة — الجديد فقط) ———

function buildOpportunities(): Opportunity[] {
  const MIN = 60 * 1000;
  const HOUR = 60 * MIN;
  const opp = (
    title: string,
    excerpt: string,
    authorPublic: string,
    platform: Opportunity["platform"],
    sourceUrl: string,
    keyword: string,
    connectorId: string,
    ageMs: number,
    likes: number,
    comments: number,
    locationHint?: string,
    status: Opportunity["status"] = "new"
  ): Opportunity => ({
    id: uid(),
    title,
    excerpt,
    authorPublic,
    platform,
    sourceUrl,
    keyword,
    engagement: { likes, comments },
    locationHint,
    status,
    connectorId,
    publishedAt: iso(-ageMs),
    fetchedAt: iso(-Math.min(ageMs, 2 * MIN)),
  });

  return [
    opp(
      "مطلوب مصمم جرافيك — 10 تصاميم للسوشيال ميديا",
      "السلام عليكم، نبحث عن مصمم جرافيك لتحرير 10 تصاميم منشورات + ستوري لماركة حلويات منزلية. الميزانية: 8.000 دج. العمل مستقبلي إذا أعجبتنا الجودة. المراسلة في التعليقات أو الخاص.",
      "حلويات بيتية DZ",
      "facebook",
      "https://facebook.com/groups/freelance.dz/posts/872634512",
      "مصمم",
      "meta_webhook",
      12 * MIN,
      34,
      21,
      "الجزائر العاصمة"
    ),
    opp(
      "نبحث مبرمج ويب لموقع شركة استيراد",
      "شركة في وهران تحتاج مبرمج ويب لتطوير موقع تعريفي + كاتالوغ منتجات. يفضل من لديه أعمال سابقة. الدفع بالمرحلة، السعر بالاتفاق.",
      "شركة النخبة للاستيراد",
      "facebook",
      "https://facebook.com/groups/ouedranouou/posts/915223481",
      "مبرمج",
      "meta_webhook",
      38 * MIN,
      12,
      9,
      "وهران"
    ),
    opp(
      "مطلوب مونتير ريلز وتيك توك — عمل أسبوعي مستمر",
      "نعمل مع عدة زبائن ونحتاج مونتير فيديوهات قصيرة (ريلز/تيك توك) بأسلوب ديناميكي. 8-12 فيديو شهرياً. أدفع لكل فيديو.",
      "وكالة برومو DZ",
      "telegram",
      "https://t.me/s/dz_freelance/4821",
      "مونتير",
      "telegram",
      55 * MIN,
      8,
      14
    ),
    opp(
      "من يصمم شعار (لوقو) لمشروع حلويات جزائرية؟ 🍰",
      "بديت مشروع حلويات تقليدية ونحتاج شعار أنيق + تغليف بسيط. الميزانية محدودة (5000-7000 دج) لكن وعد بالدعاية 😄",
      "نسرين ح.",
      "instagram",
      "https://instagram.com/p/C9xKp2LmQte/",
      "شعار",
      "meta_webhook",
      1 * HOUR + 20 * MIN,
      45,
      17,
      "سطيف"
    ),
    opp(
      "كاتب محتوى عربي لمدونة تقنية — الدفع بالمقال",
      "مدونة جزائرية جديدة تبحث عن كاتب محتوى بالعربية الفصحى المبسطة، مقالات تقنية 1000 كلمة. الدفع 1500 دج للمقال (يصعد مع الأداء).",
      "تك نيوز الجزائر",
      "rss",
      "https://forum.dz-dev.org/t/kitaba-taqnia/1245",
      "كاتب",
      "rss",
      3 * HOUR,
      5,
      6
    ),
    opp(
      "نبحث مدرب/ة رياضي لأونلاين كوتشينغ",
      "مشروع كوتشينغ أونلاين يبحث مدرب معتمد لمتابعة مجموعة نسائية (10 أشخاص). الجلسات أسبوعية عبر زووم. الراتب شهري.",
      "فيط سبورت",
      "x",
      "https://x.com/vita_sport/status/1812345678901",
      "مدرب",
      "x_api",
      5 * HOUR,
      23,
      11,
      "عن بعد"
    ),
    opp(
      "مطلوب مصور فوتوغرافي لافتتاح صالون — وهران",
      "صالون جديد في بير الجير يحتاج مصور لتغطية يوم الافتتاح + جلسة تصوير للكتالوغ. الدفع اليومي + وجبة 😄",
      "صالون ليلى",
      "facebook",
      "https://facebook.com/groups/orane.annonce/posts/77123994",
      "مصور",
      "meta_webhook",
      26 * HOUR,
      19,
      8,
      "وهران — بير الجير",
      "saved"
    ),
    opp(
      "مبرمج تطبيقات موبايل — فلاتر لمشروع توصيل",
      "نبحث عن مطور Flutter لتطبيق توصيل طلبات (نسخة عميل + توصيلي). المشروع ممول، الحصة أو الدفع بالمرحلة.",
      "وصّلها DZ",
      "telegram",
      "https://t.me/s/dz_startups/1203",
      "مبرمج",
      "telegram",
      2 * DAY,
      31,
      25,
      undefined,
      "contacted"
    ),
  ];
}

function buildConnectors(): Connector[] {
  return [
    {
      id: "meta_webhook",
      name: "صفحاتك — Meta Webhook",
      kind: "meta_webhook",
      platforms: ["facebook", "instagram"],
      active: true,
      legalNote: "أحداث رسمية من ميتا للصفحات المرتبطة بحسابك — لحظي 100٪",
      lastFetchedAt: iso(-2 * MIN),
      fetchedCount: 312,
    },
    {
      id: "x_api",
      name: "إكس — البحث الحديث",
      kind: "x_api",
      platforms: ["x"],
      active: true,
      legalNote: "X API v2 الرسمية: منشورات آخر 7 أيام فقط بالكلمات المفتاحية",
      lastFetchedAt: iso(-6 * MIN),
      fetchedCount: 87,
      requiresKey: "X_BEARER_TOKEN",
    },
    {
      id: "telegram",
      name: "قنوات تيليغرام العامة",
      kind: "telegram",
      platforms: ["telegram"],
      active: true,
      legalNote: "قنوات عامة فقط (معاينة t.me/s) عبر Telegram Bot API الرسمية",
      lastFetchedAt: iso(-4 * MIN),
      fetchedCount: 156,
    },
    {
      id: "rss",
      name: "خلاصات RSS — منتديات ومواقع إعلانات",
      kind: "rss",
      platforms: ["rss", "web"],
      active: true,
      legalNote: "خلاصات عامة معلنة من المواقع نفسها — جلب التدفق الجديد فقط",
      lastFetchedAt: iso(-9 * MIN),
      fetchedCount: 203,
    },
    {
      id: "manual",
      name: "الصق رابطاً يدوياً",
      kind: "manual",
      platforms: ["web"],
      active: true,
      legalNote: "تجلب الميتاداتا العامة الظاهرة (og:) فقط + الرابط والتوقيت",
      fetchedCount: 41,
    },
  ];
}
