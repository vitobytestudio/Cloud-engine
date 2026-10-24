import type { Conversation, Message, Platform } from "./types";
import { PROFESSIONS, professionById } from "./matching";
import { db, persist } from "./store";
import { iso, uid } from "./utils";

// محرك المحاكاة — يمنح المعاينة إحساساً لحظياً حياً.
// في الإنتاج تُستبدل مداخله بـ Webhooks المنصات الرسمية (نفس بنية البيانات).

const FIRST = ["ريم", "هدى", "أسامة", "إيمان", "سفيان", "بشرى", "أنيس", "وسام", "مروة", "زكرياء", "إيناس", "طارق"];
const LAST = ["بن يحيى", "شعبان", "بوPEAT", "زرrouki", "مرابط", "بن ناصر", "عمراني", "دحماني", "لعروسي", "بوزيد"];
const HANDLES = ["@reeem.dz", "@hoda.style", "@osama_barber", "@iman.beauty", "@sofiane.dz", "@bouchra.co", "@anis_2026", "@wissam.mr", "@merva.dz", "@zakaria.bna"];
const PLATFORMS: Platform[] = ["instagram", "facebook", "whatsapp", "tiktok"];
const SOURCES = ["أتمتة «سعر»", "أتمتة «حجز»", "أتمتة «توصيل»", "مراقبة «تجهيزات صالون»", "صفحة الالتقاط: عرض الصالونات", "واتساب — كاتالوغ"];
const OPENINGS = [
  "السلام عليكم، شحال السعر بلازمنا؟",
  "مرحبا، هذا متوفر؟ 👀",
  "سلام، التوصيل لولاية سطيف كيماش؟",
  "أهلا، عندكم كاتالوغ جديد؟",
  "سلام عليكم، نحب نسقسي على الدفع بالتقسيط",
  "ممكن تفاصيل أكثر على الباك الكامل؟ 🌸",
];
const REPLIES = [
  "شكراً، راح نفكر فيها وأرد عليك 👌",
  "ممكن صور للمنتج من قريب؟",
  "واش عنكم من ألوان أخرى؟",
  "تمام، حجزتها! شكراً 🙏",
  "ممكن رقم للتواصل المباشر؟",
  "آخر سؤال: الضمان يشمل ولاية أخرى؟",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pushActivity(type: "lead" | "message" | "mention" | "automation" | "campaign", text: string, platform?: Platform) {
  db().activity.unshift({ id: uid(), type, text, platform, createdAt: iso() });
  if (db().activity.length > 80) db().activity.length = 80;
}

export function simNewLead(): void {
  const d = db();
  const i = Math.floor(Math.random() * FIRST.length);
  const name = `${FIRST[i]} ${pick(LAST).replace("بوPEAT", "بوعلام").replace("زرrouki", "زروقي")}`;
  const platform = pick(PLATFORMS);
  const withPhone = Math.random() < 0.45;
  const source = pick(SOURCES);
  d.leads.unshift({
    id: uid(),
    name,
    handle: pick(HANDLES),
    platform,
    phone: withPhone ? `0${pick(["5", "6", "7"])}${Math.floor(10000000 + Math.random() * 89999999)}`.replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4") : undefined,
    source,
    status: "new",
    tags: [],
    score: 40 + Math.floor(Math.random() * 55),
    consent: withPhone,
    createdAt: iso(),
    lastActivityAt: iso(),
  });
  const l = d.leads[0];
  if (Math.random() < 0.7) {
    const id = uid();
    const body = pick(OPENINGS);
    d.conversations.unshift({
      id,
      leadId: l.id,
      platform,
      unread: 1,
      lastMessageAt: iso(),
      lastMessagePreview: body,
    });
    d.messages.push({ id: uid(), conversationId: id, direction: "in", body, status: "delivered", createdAt: iso() });
  }
  pushActivity("lead", `عميل جديد — ${name} (${source})`, platform);
  persist();
}

export function simInboundMessage(conversationId?: string): void {
  const d = db();
  const convs = d.conversations;
  if (!convs.length) return;
  const c: Conversation = conversationId
    ? convs.find((x) => x.id === conversationId) ?? pick(convs)
    : pick(convs);
  const body = pick(REPLIES);
  const msg: Message = { id: uid(), conversationId: c.id, direction: "in", body, status: "delivered", createdAt: iso() };
  d.messages.push(msg);
  c.unread += 1;
  c.lastMessageAt = msg.createdAt;
  c.lastMessagePreview = body;
  const lead = d.leads.find((l) => l.id === c.leadId);
  if (lead) lead.lastActivityAt = iso();
  pushActivity("message", `رسالة جديدة من ${lead?.name ?? "عميل"} على ${c.platform === "whatsapp" ? "واتساب" : c.platform}`, c.platform);
  persist();
}

export function simMention(): void {
  const d = db();
  const activeRules = d.rules.filter((r) => r.active);
  if (!activeRules.length) return;
  const rule = pick(activeRules);
  const i = Math.floor(Math.random() * FIRST.length);
  const name = `${FIRST[i]} ${pick(LAST).replace("بوPEAT", "بوعلام").replace("زرrouki", "زروقي")}`;
  d.mentions.unshift({
    id: uid(),
    ruleId: rule.id,
    platform: pick(rule.platforms),
    authorName: name,
    authorHandle: pick(HANDLES),
    content: pick([
      `نحب نقترح عليكم ${rule.keyword} جودة عالية، شكون يرشحلي؟`,
      `واش رايكم في ${rule.keyword} المتوفرة حالياً بالسوق؟`,
      `في حاجة لـ ${rule.keyword} بثمن معقول لهذا الشهر؟ 🙏`,
    ]),
    url: "#",
    likes: 5 + Math.floor(Math.random() * 300),
    comments: 2 + Math.floor(Math.random() * 40),
    sentiment: pick(["positive", "neutral", "positive", "negative"] as const),
    converted: false,
    createdAt: iso(),
  });
  rule.matchesCount += 1;
  pushActivity("mention", `ذكر جديد لـ «${rule.keyword}»`, d.mentions[0].platform);
  persist();
}

export function simOpportunity(): void {
  const d = db();
  const activeConns = d.connectors.filter((c) => c.active && c.kind !== "manual");
  if (!activeConns.length) return;
  const conn = pick(activeConns);
  const platform = pick(conn.platforms);

  // الأتمتة الكاملة: إن ضُبط ملف المستخدم، تتولد الفرص من تخصصه وكلماته تلقائياً
  const prof = d.profile.setupDone ? professionById(d.profile.professionId) : undefined;
  let TEMPLATES: Array<{ title: string; excerpt: string; keyword: string; author: string; loc?: string }> = [
    { title: "مطلوب مصمم لوقو لمشروع ناشئ", excerpt: "السلام عليكم، عندنا مشروع قهوة مختصة ونحتاج هوية بصرية كاملة (شعار + ألوان + منيو). الميزانية مرنة للشغل الحلو.", keyword: "مصمم", author: "قهوة دزاير", loc: "الجزائر العاصمة" },
    { title: "نبحث مبرمج لإصلاح موقع ووردبريس", excerpt: "موقعنا فيه مشكلة تقنية منذ يومين وخسرنا زبائن. من يقدر يصلح اليوم؟ الدفع فوري نقداً.", keyword: "مبرمج", author: "مكتبة النور", loc: "قسنطينة" },
    { title: "مطلوب مونتير فيديوهات يوتيوب", excerpt: "قناة تعليمية جديدة تبحث مونتير (قص + ترجمة + مؤثرات). فيديو واحد أسبوعياً، 3000 دج للفيديو.", keyword: "مونتير", author: "أكاديمية النجاح" },
    { title: "من يكتب CV احترافي بالفرنسية؟", excerpt: "نحتاج شخص يكتب ويرتب سيرة ذاتية احترافية بالفرنسية لطلب عمل في شركة أجنبية. بسرعة من فضلكم.", keyword: "كاتب", author: "ياسين م.", loc: "عنابة" },
    { title: "مطلوب مصور أعراس — موسم الصيف", excerpt: "نبحث مصور محترف لتغطية حفلي زفاف في جويلية. العدة كاملة إجبارية. أجور ممتازة للمحترف.", keyword: "مصور", author: "قاعة الأفراح", loc: "بليدة" },
    { title: "نسعد مدير صفحات سوشيال ميديا", excerpt: "مطعم جديد يحتاج شخص يدير صفحاته (تصوير + نشر + ردود). عمل جزئي شهري ثابت.", keyword: "سوشيال", author: "مطعم الذواقة", loc: "وهران" },
  ];

  if (prof) {
    const kw = prof.keywords;
    const loc = d.profile.wilayas.includes("كل الولايات") ? undefined : pick(d.profile.wilayas);
    TEMPLATES = [
      { title: `مطلوب ${prof.label} — مشروع جديد يبحث عن تنفيذ احترافي`, excerpt: `السلام عليكم، نبحث عن مختص في ${prof.label} لعمل عاجل. الجودة والالتزام أولاً. الميزانية قابلة للتفاوض مع الأعمال السابقة.`, keyword: pick(kw), author: pick(["مشروع ناشئ DZ", "شركة وهران للتقنية", "متجر إلكتروني", "وكالة جزائرية", "علامة محلية"]), loc },
      { title: `نبحث ${pick(kw)} لعمل مستمر — دفع أسبوعي`, excerpt: `لدينا عدة مشاريع ونحتاج ${prof.label.toLowerCase()} للتعاقد طويل المدى. الدفع أسبوعي بعد كل تسليم.`, keyword: pick(kw), author: "مجموعة أعمال DZ", loc },
      { title: `من يقدم خدمة ${prof.label.toLowerCase()}؟ استعجال`, excerpt: `مطلوب عمل بسرعة (هذا الأسبوع). السعر بالاتفاق بعد رؤية نماذج الأعمال. التواصل في التعليقات.`, keyword: pick(kw), author: pick(["خ. مراد", "س. بوعلام", "متجر النخبة"]), loc: loc ?? pick(["الجزائر العاصمة", "وهران", "قسنطينة", "سطيف"]) },
    ];
  }

  const tpl = pick(TEMPLATES);
  const slug = Math.floor(100000000 + Math.random() * 899999999);
  const urls: Record<string, string> = {
    facebook: `https://facebook.com/groups/dz.services/posts/${slug}`,
    instagram: `https://instagram.com/p/C${slug.toString(36)}/`,
    x: `https://x.com/user_dz/status/${slug}`,
    telegram: `https://t.me/s/dz_freelance/${Math.floor(1000 + Math.random() * 8999)}`,
    rss: `https://forum.dz-dev.org/t/forsa-${Math.floor(100 + Math.random() * 899)}`,
    web: `https://annaba-jobs.dz/annonce/${slug}`,
  };

  d.opportunities.unshift({
    id: uid(),
    title: tpl.title,
    excerpt: tpl.excerpt,
    authorPublic: tpl.author,
    platform,
    sourceUrl: urls[platform] ?? urls.web,
    keyword: tpl.keyword,
    engagement: { likes: 3 + Math.floor(Math.random() * 60), comments: 1 + Math.floor(Math.random() * 25) },
    locationHint: tpl.loc,
    status: "new",
    connectorId: conn.id,
    publishedAt: iso(-Math.floor(Math.random() * 6 * 60 * 1000)), // أقل من 6 دقائق
    fetchedAt: iso(),
  });
  if (d.opportunities.length > 60) d.opportunities.length = 60;

  conn.lastFetchedAt = iso();
  conn.fetchedCount += 1;
  pushActivity("mention", `فرصة جديدة عبر ${conn.name} — «${tpl.keyword}»`, platform === "telegram" || platform === "rss" || platform === "web" ? undefined : platform);
  persist();
}

export function autoSimulate(): void {
  const r = Math.random();
  if (r < 0.35) simNewLead();
  else if (r < 0.7) simInboundMessage();
  else if (r < 0.85) simMention();
  else simOpportunity();
}
