import type { Conversation, Message, Platform } from "./types";
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

export function autoSimulate(): void {
  const r = Math.random();
  if (r < 0.45) simNewLead();
  else if (r < 0.85) simInboundMessage();
  else simMention();
}
