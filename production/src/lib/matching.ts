// ——— محرك المطابقة: تخصصات الفريلانسر الجزائري بمرادفات السوق الحقيقية ———
// قرار مؤسسي: بلا ذكاء اصطناعي — قواعد لغوية حتمية شفافة وقابلة للتدقيق.

export interface Profession {
  id: string;
  label: string;
  keywords: string[];
}

export const PROFESSIONS: Profession[] = [
  { id: "dev_web", label: "برمجة مواقع وتطبيقات", keywords: ["مبرمج", "مطور", "برمجة", "موقع", "ويب", "تطبيق", "ووردبريس", "wordpress", "متجر الكتروني", "فلاتر", "flutter", "developer"] },
  { id: "logo_brand", label: "تصميم الشعارات والهوية", keywords: ["شعار", "لوقو", "لوجو", "هوية بصرية", "براندنج", "تصميم شعار", "branding", "logo"] },
  { id: "graphic", label: "تصميم جرافيك ومنشورات", keywords: ["مصمم", "تصميم", "جرافيك", "بوستر", "فلاير", "منشورات", "تصاميم", "designer"] },
  { id: "video_ads", label: "فيديوهات إعلانية", keywords: ["فيديو اعلاني", "اعلان ممول", "فيديو ترويجي", "موشن", "motion", "اعلان", "فيديو تسويقي"] },
  { id: "montage", label: "مونتاج فيديو", keywords: ["مونتير", "مونتاج", "ريلز", "تيك توك", "يوتيوب", "قص فيديو", "premiere", "after effects"] },
  { id: "content", label: "كتابة المحتوى", keywords: ["كاتب", "كتابة", "محتوى", "مقالات", "مدونة", "سيناريو", "كوبي"] },
  { id: "photo", label: "تصوير فوتوغرافي", keywords: ["مصور", "تصوير", "فوتوغرافي", "جلسة تصوير", "اعراس", "منتجات"] },
  { id: "smm", label: "إدارة صفحات السوشيال ميديا", keywords: ["ادارة صفحات", "سوشيال ميديا", "community manager", "تسويق", "صفحة"] },
  { id: "translation", label: "الترجمة", keywords: ["ترجمة", "مترجم", "فرنسي", "انجليزي", "traduction"] },
];

export const WILAYAS = ["كل الولايات", "الجزائر", "وهران", "قسنطينة", "سطيف", "عنابة", "بجاية", "البليدة", "تلمسان", "ورقلة"];

export function professionById(id: string): Profession | undefined {
  return PROFESSIONS.find((p) => p.id === id);
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

export interface MatchResult {
  score: number;
  reasons: string[];
  matched: boolean;
}

export function matchClient(
  client: { title: string; excerpt: string; keyword: string; location_hint: string | null; published_at: number },
  profile: { profession_id: string; keywords_json: string; wilayas_json: string }
): MatchResult {
  const customKw: string[] = JSON.parse(profile.keywords_json || "[]");
  const wilayas: string[] = JSON.parse(profile.wilayas_json || '["كل الولايات"]');
  const haystack = normalize(`${client.title} ${client.excerpt} ${client.keyword}`);

  const pool = new Set<string>();
  if (profile.profession_id) professionById(profile.profession_id)?.keywords.forEach((k) => pool.add(normalize(k)));
  customKw.forEach((k) => pool.add(normalize(k)));
  if (!pool.size) return { score: 0, reasons: [], matched: false };

  const hits: string[] = [];
  pool.forEach((k) => {
    if (k && haystack.includes(k)) hits.push(k);
  });
  if (!hits.length) return { score: 0, reasons: [], matched: false };

  const reasons = [`تخصصك: ${hits.slice(0, 3).join(" · ")}`];
  let score = 55 + Math.min(15, (hits.length - 1) * 8);

  const ageMin = (Date.now() - client.published_at) / 60000;
  if (ageMin < 60) {
    score += 25;
    reasons.push("نُشر خلال الساعة الأخيرة");
  } else if (ageMin < 1440) {
    score += 12;
    reasons.push("نُشر اليوم");
  }

  const wantAny = wilayas.includes("كل الولايات");
  if (client.location_hint && (wantAny || wilayas.some((w) => client.location_hint?.includes(w)))) {
    score += 8;
    reasons.push(`الولاية: ${client.location_hint}`);
  }

  return { score: Math.min(100, score), reasons, matched: true };
}

/** الرسالة الافتتاحية الجاهزة — قواعد صياغة ثابتة (بلا AI) */
export function openingMessage(
  client: { title: string; author_public: string; keyword?: string },
  profLabel: string | null
): string {
  const who = profLabel ?? client.keyword;
  return [
    `السلام عليكم، ${client.author_public}.`,
    `شفت طلبكم بخصوص «${client.title}» — هذا من تخصصي: ${who}.`,
    `عندي أعمال مشابهة ونقدر نبدلو التفاصيل والميزانية الآن. متاحين متى تحبوا؟`,
  ].join("\n");
}
