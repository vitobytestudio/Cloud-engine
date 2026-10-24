// محرك المطابقة الذكي — قلب الأتمتة الكاملة
// الفريلانسر يضبط تخصصه مرة واحدة، والنظام يرصد ويطابق ويوصل — بلا أي بحث يدوي.

import type { Opportunity, RadarProfile } from "./types";

export interface Profession {
  id: string;
  label: string;
  icon: "code" | "pen" | "video" | "camera" | "text" | "share" | "globe" | "layers";
  // كلمات الرصد — تشمل المرادفات التي يستعملها العملاء فعلياً في الجزائر
  keywords: string[];
  suggested?: boolean;
}

export const PROFESSIONS: Profession[] = [
  {
    id: "dev_web",
    label: "برمجة مواقع وتطبيقات",
    icon: "code",
    keywords: ["مبرمج", "مطور", "برمجة", "موقع", "ويب", "تطبيق", "ووردبريس", "wordpress", "متجر الكتروني", "فلاتر", "flutter", "اندرويد", "باك اند", "فرونت اند", "developer"],
  },
  {
    id: "logo_brand",
    label: "تصميم الشعارات والهوية",
    icon: "pen",
    keywords: ["شعار", "لوقو", "لوجو", "هوية بصرية", "براندنج", "تصميم شعار", "ستور", "branding", "logo"],
  },
  {
    id: "graphic",
    label: "تصميم جرافيك ومنشورات",
    icon: "layers",
    keywords: ["مصمم", "تصميم", "جرافيك", "بوستر", "فلاير", "منشورات", "تصاميم", "سوشيال ميديا", "designer"],
  },
  {
    id: "video_ads",
    label: "فيديوهات إعلانية",
    icon: "video",
    keywords: ["فيديو اعلاني", "إعلان ممول", "فيديو ترويجي", "موشن", "motion", "اعلان", "فيديو تسويقي", "ريلز اعلاني"],
  },
  {
    id: "montage",
    label: "مونتاج فيديو",
    icon: "video",
    keywords: ["مونتير", "مونتاج", "ريلز", "تيك توك", "يوتيوب", "قص فيديو", "مونتاج فيديوهات", "premiere", "after effects"],
  },
  {
    id: "content",
    label: "كتابة المحتوى",
    icon: "text",
    keywords: ["كاتب", "كتابة", "محتوى", "مقالات", "مدونة", "سيناريو", "كوبي", "redaction"],
  },
  {
    id: "photo",
    label: "تصوير فوتوغرافي",
    icon: "camera",
    keywords: ["مصور", "تصوير", "فوتوغرافي", "جلسة تصوير", "اعراس", "منتجات", "photographe"],
  },
  {
    id: "smm",
    label: "إدارة صفحات السوشيال ميديا",
    icon: "share",
    keywords: ["ادارة صفحات", "سوشيال ميديا", "مجتمع", "community manager", "صفحة فيسبوك", "انستغرام", "تسويق"],
  },
  {
    id: "translation",
    label: "الترجمة",
    icon: "globe",
    keywords: ["ترجمة", "مترجم", "فرنسي", "انجليزي", "traduction", "ترجمة ملفات", "كتيب"],
  },
];

export const WILAYAS = [
  "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار", "البليدة",
  "البويرة", "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر", "الجلفة", "جيجل",
  "سطيف", "سعيدة", "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة", "قسنطينة", "المدية", "مستغانم",
  "المسيلة", "معسكر", "ورقلة", "وهران", "البيض", "إليزي", "برج بوعريريج", "بومرداس", "الطارف",
  "تندوف", "تيسمسيلت", "الوادي", "خنشلة", "سوق أهراس", "تيبازة", "ميلة", "عين الدفلى", "النعامة",
  "عين تموشنت", "غرداية", "غليزان",
];

export function professionById(id: string): Profession | undefined {
  return PROFESSIONS.find((p) => p.id === id);
}

export interface MatchResult {
  score: number; // 0-100
  reasons: string[]; // أسباب المطابقة للعرض
  matched: boolean;
}

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ًٌٍَُِّْ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** مطابقة فرصة واحدة مع ملف الرصد */
export function matchOpportunity(o: Opportunity, profile: RadarProfile | null): MatchResult {
  if (!profile || !profile.setupDone) return { score: 0, reasons: [], matched: false };

  const haystack = normalize(`${o.title} ${o.excerpt} ${o.keyword}`);
  const kwPool = new Set<string>();
  if (profile.professionId) {
    professionById(profile.professionId)?.keywords.forEach((k) => kwPool.add(normalize(k)));
  }
  profile.keywords.forEach((k) => kwPool.add(normalize(k)));
  if (!kwPool.size) return { score: 0, reasons: [], matched: false };

  const hits: string[] = [];
  kwPool.forEach((k) => {
    if (k && haystack.includes(k)) hits.push(k);
  });

  if (!hits.length) return { score: 0, reasons: [], matched: false };

  const reasons = [`تخصصك: ${hits.slice(0, 3).join(" · ")}`];

  let score = 55 + Math.min(15, (hits.length - 1) * 8);

  const ageMin = (Date.now() - new Date(o.publishedAt).getTime()) / 60000;
  if (ageMin < 60) {
    score += 25;
    reasons.push("نُشرت خلال الساعة الأخيرة");
  } else if (ageMin < 1440) {
    score += 12;
    reasons.push("نُشرت اليوم");
  }

  const wantAnywhere = profile.wilayas.includes("كل الولايات");
  if (o.locationHint && (wantAnywhere || profile.wilayas.some((w) => o.locationHint?.includes(w)))) {
    score += 8;
    reasons.push(`الولاية: ${o.locationHint}`);
  }

  return { score: Math.min(100, score), reasons, matched: true };
}

/** الرسالة الافتتاحية الجاهزة — أكبر مُسهّل: الفريلانسر ينسخ ويرسل فقط */
export function suggestOpening(
  o: Opportunity,
  profLabel: string | null,
  freelancerName?: string
): string {
  const who = profLabel ?? o.keyword;
  const name = freelancerName?.trim() ? ` أنا ${freelancerName.trim()}.` : "";
  return [
    `السلام عليكم، ${o.authorPublic}.`,
    `شفت طلبكم بخصوص «${o.title}» — هذا من تخصصي: ${who}.${name}`,
    `عندي أعمال مشابهة ونقدر نبدلو التفاصيل والميزانية الآن. متاحين متى تحبوا؟`,
  ].join("\n");
}
