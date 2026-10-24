// مِرسال — أنواع البيانات الأساسية

export type Platform = "instagram" | "facebook" | "whatsapp" | "tiktok" | "x";

export type LeadStatus = "new" | "contacted" | "qualified" | "customer" | "lost";

export interface Lead {
  id: string;
  name: string;
  handle: string;
  platform: Platform;
  phone?: string;
  email?: string;
  source: string;
  status: LeadStatus;
  tags: string[];
  score: number; // 0-100 مؤشر الاهتمام
  consent: boolean; // موافقة صريحة على التواصل
  notes?: string;
  createdAt: string;
  lastActivityAt: string;
}

export interface Conversation {
  id: string;
  leadId: string;
  platform: Platform;
  unread: number;
  lastMessageAt: string;
  lastMessagePreview: string;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: "in" | "out";
  body: string;
  status: "sent" | "delivered" | "read";
  createdAt: string;
}

export type AutomationTrigger = "comment_keyword" | "story_reply" | "dm_keyword";

export interface Automation {
  id: string;
  name: string;
  platform: Platform;
  trigger: AutomationTrigger;
  keyword: string;
  replyTemplate: string;
  ctaLink?: string;
  collectPhone: boolean;
  active: boolean;
  triggeredCount: number;
  leadsCaptured: number;
  createdAt: string;
}

export interface ListenRule {
  id: string;
  keyword: string;
  platforms: Platform[];
  active: boolean;
  matchesCount: number;
  createdAt: string;
}

export type Sentiment = "positive" | "neutral" | "negative";

export interface Mention {
  id: string;
  ruleId: string;
  platform: Platform;
  authorName: string;
  authorHandle: string;
  content: string;
  url: string;
  likes: number;
  comments: number;
  sentiment: Sentiment;
  converted: boolean;
  createdAt: string;
}

export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent";

export interface Campaign {
  id: string;
  name: string;
  channel: "whatsapp";
  template: string;
  audienceTag: string;
  status: CampaignStatus;
  targeted: number;
  sent: number;
  delivered: number;
  read: number;
  replied: number;
  createdAt: string;
}

export interface CapturePage {
  id: string;
  slug: string;
  title: string;
  headline: string;
  subtext: string;
  offer?: string;
  ctaLabel: string;
  askPhone: boolean;
  askEmail: boolean;
  published: boolean;
  views: number;
  conversions: number;
  createdAt: string;
}

export type ActivityType = "lead" | "message" | "mention" | "automation" | "campaign" | "system";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  text: string;
  platform?: Platform;
  createdAt: string;
}

export interface DB {
  workspace: { name: string; tagline: string; city: string };
  leads: Lead[];
  conversations: Conversation[];
  messages: Message[];
  automations: Automation[];
  rules: ListenRule[];
  mentions: Mention[];
  campaigns: Campaign[];
  capturePages: CapturePage[];
  activity: ActivityEvent[];
  opportunities: Opportunity[];
  connectors: Connector[];
  profile: RadarProfile;
  subscription: Subscription;
}

// ——— رصّاد الفرص: فرص عملاء من محتوى عام + رابط إلزامي ———

export type OpportunityPlatform = Platform | "telegram" | "rss" | "web";

export type OpportunityStatus = "new" | "saved" | "contacted" | "won" | "ignored";

export interface Opportunity {
  id: string;
  title: string;
  excerpt: string;
  authorPublic: string; // الاسم العلني الظاهر فقط
  platform: OpportunityPlatform;
  sourceUrl: string; // رابط المنشور الأصلي (إلزامي — طريقة التواصل القانونية)
  keyword: string; // الكلمة المطابقة التي جلبتها
  engagement: { likes: number; comments: number };
  locationHint?: string; // إن ظهرت علناً في المنشور
  status: OpportunityStatus;
  connectorId: string;
  publishedAt: string; // توقيت النشر الأصلي — أساس درجة النضارة
  fetchedAt: string;
}

export type ConnectorKind = "meta_webhook" | "x_api" | "telegram" | "rss" | "manual";

export interface Connector {
  id: string;
  name: string;
  kind: ConnectorKind;
  platforms: OpportunityPlatform[];
  active: boolean;
  legalNote: string;
  lastFetchedAt?: string;
  fetchedCount: number;
  requiresKey?: string; // متغير البيئة المطلوب للتفعيل الحقيقي
}

// ——— ملف الرصد الذكي: إعداد لمرة واحدة ثم أتمتة كاملة ———

export type AlertChannel = "app" | "whatsapp" | "telegram";

export interface RadarProfile {
  professionId: string;
  keywords: string[]; // كلمات مولدة تلقائياً من التخصص + مخصصة
  wilayas: string[]; // "كل الولايات" مسموحة
  alertChannel: AlertChannel;
  alertPhone?: string; // بموافقة صريحة — للتنبيهات فقط
  setupDone: boolean;
  createdAt: string;
}

// ——— الباقات والاشتراك: نبيع زبائن جاهزين، لا أدوات بحث ———

export type PlanId = "free" | "growth" | "pro";

export interface Plan {
  id: PlanId;
  name: string;
  priceDzd: number;
  tagline: string;
  dailyClients: number; // -1 = غير محدود
  weeklyClientsFree?: number;
  allChannels: boolean;
  instantAlert: boolean;
  priority: boolean;
  features: string[];
}

export interface Subscription {
  planId: PlanId;
  status: "active" | "expired";
  startedAt: string;
  renewsAt: string;
  totalDelivered: number;
}
