import type { Plan, PlanId, Subscription } from "./types";

// ——— الباقات: المنتج هو "زبائن جاهزون يُسلَّمون لك" ———

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "انطلاقة",
    priceDzd: 0,
    tagline: "جرّب التوصيل وحقّق أول صفقة",
    dailyClients: 0,
    weeklyClientsFree: 3,
    allChannels: false,
    instantAlert: false,
    priority: false,
    features: [
      "3 زبائن جاهزين أسبوعياً",
      "منشور العميل + رابط الوصول الفعلي",
      "رسالة أولى جاهزة بنقرة واحدة",
      "تنبيه داخل المنصة",
      "تخصص واحد",
    ],
  },
  {
    id: "growth",
    name: "نمو",
    priceDzd: 1900,
    tagline: "الأكثر ملاءمة للفريلانسر الجاد",
    dailyClients: 5,
    weeklyClientsFree: undefined,
    allChannels: true,
    instantAlert: true,
    priority: false,
    features: [
      "حتى 5 زبائن جاهزين يومياً (150/شهر)",
      "كل القنوات الرسمية معاً",
      "تنبيه فوري واتساب / تيليغرام",
      "رسائل افتتاحية مصاغة باسمك وتخصصك",
      "أولوية الفرص المنشورة قبل أقل من ساعة",
      "تخصصان + ولايات غير محدودة",
    ],
  },
  {
    id: "pro",
    name: "محترف",
    priceDzd: 4900,
    tagline: "قسم تجاري كامل يعمل عنك",
    dailyClients: -1,
    weeklyClientsFree: undefined,
    allChannels: true,
    instantAlert: true,
    priority: true,
    features: [
      "زبائن جاهزون بلا حدود",
      "أعلى أولوية توصيل — قبل الجميع",
      "تخصصات متعددة في وقت واحد",
      "حساب مخصص + مراجعة أسبوعية للنتائج",
      "إشعارات هاتف فورية",
    ],
  },
];

export function planById(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function planLabel(id: PlanId): string {
  return planById(id).name;
}

/** حصة اليوم حسب الباقة */
export function dailyQuota(sub: Subscription): number {
  const plan = planById(sub.planId);
  if (plan.id === "free") return 0; // تُحسب أسبوعياً
  return plan.dailyClients;
}

/** عدد المسلَّم اليوم — يُحسب من الفرص المستلمة (فُتحت/رُوجعت) اليوم */
export function deliveredToday(opportunities: Array<{ fetchedAt: string; status: string }>): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return opportunities.filter(
    (o) => new Date(o.fetchedAt).getTime() >= start.getTime() && o.status !== "ignored"
  ).length;
}

export function fmtDzd(n: number): string {
  return n.toLocaleString("en").replace(/,/g, ".") + " دج";
}
