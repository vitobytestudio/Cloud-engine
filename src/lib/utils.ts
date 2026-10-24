import type { LeadStatus, Platform, Sentiment } from "./types";

export function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function iso(msOffset = 0): string {
  return new Date(Date.now() + msOffset).toISOString();
}

export function relTime(dateIso: string): string {
  const diff = Date.now() - new Date(dateIso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} سا`;
  const d = Math.floor(h / 24);
  if (d < 30) return `قبل ${d} ي`;
  return new Date(dateIso).toLocaleDateString("ar-DZ");
}

export const PLATFORM_META: Record<
  Platform,
  { label: string; bg: string; fg: string; solid: string }
> = {
  instagram: { label: "إنستغرام", bg: "bg-pink-100", fg: "text-pink-600", solid: "bg-pink-600" },
  facebook: { label: "فيسبوك", bg: "bg-blue-100", fg: "text-blue-600", solid: "bg-blue-600" },
  whatsapp: { label: "واتساب", bg: "bg-emerald-100", fg: "text-emerald-600", solid: "bg-emerald-600" },
  tiktok: { label: "تيك توك", bg: "bg-slate-200", fg: "text-slate-800", solid: "bg-slate-900" },
  x: { label: "إكس", bg: "bg-slate-200", fg: "text-slate-700", solid: "bg-slate-800" },
};

export const STATUS_META: Record<
  LeadStatus,
  { label: string; cls: string; dot: string }
> = {
  new: { label: "جديد", cls: "bg-sky-100 text-sky-700", dot: "bg-sky-500" },
  contacted: { label: "تم التواصل", cls: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  qualified: { label: "مؤهل", cls: "bg-violet-100 text-violet-700", dot: "bg-violet-500" },
  customer: { label: "عميل", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  lost: { label: "مفقود", cls: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
};

export const SENTIMENT_META: Record<Sentiment, { label: string; cls: string }> = {
  positive: { label: "إيجابي", cls: "bg-emerald-100 text-emerald-700" },
  neutral: { label: "محايد", cls: "bg-slate-100 text-slate-600" },
  negative: { label: "سلبي", cls: "bg-rose-100 text-rose-700" },
};

export const TRIGGER_LABEL: Record<string, string> = {
  comment_keyword: "تعليق يحتوي كلمة",
  story_reply: "رد على ستوري",
  dm_keyword: "رسالة خاصة تحتوي كلمة",
};

export function pct(n: number, d: number): string {
  if (!d) return "0٪";
  return `${Math.round((n / d) * 100)}٪`;
}

// ——— رصّاد الفرص ———

export const OPP_PLATFORM_LABEL: Record<string, string> = {
  instagram: "إنستغرام",
  facebook: "فيسبوك",
  whatsapp: "واتساب",
  tiktok: "تيك توك",
  x: "إكس",
  telegram: "تيليغرام",
  rss: "RSS",
  web: "ويب",
};

export type Freshness = "hot" | "warm" | "cold" | "expired";

export function freshnessOf(publishedAt: string): {
  key: Freshness;
  label: string;
  emoji: string;
  cls: string;
} {
  const ageMin = (Date.now() - new Date(publishedAt).getTime()) / 60000;
  if (ageMin < 60)
    return { key: "hot", label: "خلال الساعة", emoji: "", cls: "bg-rose-100 text-rose-700" };
  if (ageMin < 24 * 60)
    return { key: "warm", label: "اليوم", emoji: "", cls: "bg-amber-100 text-amber-700" };
  if (ageMin < 72 * 60)
    return { key: "cold", label: "هذا الأسبوع", emoji: "", cls: "bg-sky-100 text-sky-700" };
  return { key: "expired", label: "منتهية — أقدم من 72 ساعة", emoji: "", cls: "bg-slate-100 text-slate-400" };
}

export function freshAgo(dateIso: string): string {
  const s = Math.floor((Date.now() - new Date(dateIso).getTime()) / 1000);
  if (s < 45) return "الآن مباشرة";
  const m = Math.floor(s / 60);
  if (m < 60) return `قبل ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} سا`;
  const d = Math.floor(h / 24);
  return `قبل ${d} يوم`;
}
