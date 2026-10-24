// ——— الباقات: المنتج زبائن جاهزون يُسلَّمون — الأسعار بالدينار ———

export interface Plan {
  id: "free" | "growth" | "pro";
  name: string;
  priceDzd: number;
  dailyDeliver: number; // -1 غير محدود، 0 = أسبوعي فقط
  weeklyDeliver: number | null;
  priority: boolean;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "انطلاقة",
    priceDzd: 0,
    dailyDeliver: 0,
    weeklyDeliver: 3,
    priority: false,
    features: ["3 زبائن جاهزين أسبوعياً", "منشور العميل + رابط الوصول الفعلي", "رسالة افتتاحية جاهزة", "تخصص واحد"],
  },
  {
    id: "growth",
    name: "نمو",
    priceDzd: 1900,
    dailyDeliver: 5,
    weeklyDeliver: null,
    priority: false,
    features: ["حتى 5 زبائن جاهزين يومياً", "كل القنوات الرسمية", "رسائل باسمك وتخصصك", "أولوية الفرص الحديثة", "تخصصان"],
  },
  {
    id: "pro",
    name: "محترف",
    priceDzd: 4900,
    dailyDeliver: -1,
    weeklyDeliver: null,
    priority: true,
    features: ["زبائن جاهزون بلا حدود", "أعلى أولوية توصيل", "تخصصات متعددة", "حساب مخصص"],
  },
];

export function planById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function fmtDzd(n: number): string {
  return n.toLocaleString("en").replace(/,/g, ".") + " دج";
}
