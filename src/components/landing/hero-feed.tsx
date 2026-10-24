"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpLeft, ShieldCheck } from "lucide-react";

interface FeedItem {
  kw: string;
  title: string;
  src: string;
  time: string;
  place: string;
}

const POOL: FeedItem[] = [
  { kw: "تصميم جرافيك", title: "مطلوب مصمم هوية بصرية كاملة — مشروع مقهى مختص", src: "فيسبوك · مجموعة فريلانس الجزائر", time: "الآن", place: "الجزائر العاصمة" },
  { kw: "تطوير ويب", title: "شركة استيراد تبحث مطوّر موقع تعريفي وكاتالوغ", src: "إنستغرام · تعليق منشور ترويجي", time: "قبل 3 د", place: "وهران" },
  { kw: "مونتاج فيديو", title: "قناة تعليمية: مونتير ريلز — تعاقد شهري ثابت", src: "تيليغرام · قناة عامة موثّقة", time: "قبل 7 د", place: "عن بُعد" },
  { kw: "كتابة محتوى", title: "مدونة تقنية جزائرية: كاتب مقالات بالعربية", src: "RSS · منتدى المطورين", time: "قبل 12 د", place: "عن بُعد" },
  { kw: "تصوير", title: "افتتاح صالون تجميل: تغطية + جلسة كاتالوغ", src: "فيسبوك · مجموعة إعلانات وهران", time: "قبل 18 د", place: "وهران" },
  { kw: "إدارة صفحات", title: "مطعم جديد: إدارة سوشيال ميديا بدوام جزئي", src: "إكس · بحث حديث", time: "قبل 21 د", place: "قسنطينة" },
  { kw: "ترجمة", title: "ترجمة كتيّب منتجات 20 صفحة — فرنسي إلى عربي", src: "تيليغرام · قناة خدمات", time: "قبل 26 د", place: "سطيف" },
];

export default function HeroFeed() {
  const [items, setItems] = useState<FeedItem[]>(() => POOL.slice(0, 4));
  const idx = useRef(4);

  useEffect(() => {
    const t = setInterval(() => {
      setItems((prev) => {
        const next = [POOL[idx.current % POOL.length], ...prev].slice(0, 4);
        idx.current += 1;
        return next;
      });
    }, 3400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="glass relative overflow-hidden rounded-2xl shadow-2xl shadow-black/50">
      {/* رأس النافذة */}
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 rounded-full bg-rose-500/80" />
          <span className="flex h-2 w-2 rounded-full bg-amber-500/70" />
          <span className="flex h-2 w-2 rounded-full bg-emerald-500/80" />
        </div>
        <div className="flex items-center gap-2 text-[11px] font-extrabold text-slate-400">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
          لوحة الفرص — بث مباشر
        </div>
      </div>

      {/* الترويسة الداخلية */}
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <div className="text-[12px] font-extrabold text-slate-300">تدفّق الفرص الواردة</div>
        <div className="rounded-md bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold text-slate-500" dir="ltr">
          mirsal.dz / radar
        </div>
      </div>

      {/* الصفوف */}
      <div className="space-y-2 px-4 pb-4">
        {items.map((it, i) => (
          <div
            key={`${it.title}-${i}-${items.length}`}
            className={`feed-in rounded-xl border px-4 py-3 transition ${
              i === 0
                ? "border-violet-400/25 bg-violet-400/[0.08]"
                : "border-white/[0.06] bg-white/[0.03]"
            }`}
            style={{ opacity: 1 - i * 0.14 }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-black ${
                    i === 0 ? "bg-violet-400/20 text-violet-200" : "bg-white/[0.06] text-slate-400"
                  }`}
                >
                  {it.kw}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-extrabold text-slate-100">{it.title}</div>
                  <div className="truncate text-[10px] font-semibold text-slate-500">
                    {it.src} · {it.place}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500">{it.time}</span>
                <ArrowUpLeft className="h-3.5 w-3.5 text-slate-500" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* تذييل الحماية */}
      <div className="flex items-center justify-between border-t border-white/[0.07] bg-white/[0.02] px-5 py-3">
        <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/80" />
          مصادر عامة عبر واجهات رسمية — توثيق كامل للمصدر
        </div>
        <div className="text-[10px] font-black tabular-nums text-slate-600" dir="ltr">
          RT &lt; 60s
        </div>
      </div>

      {/* لمعة عابرة */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-y-0 w-1/3 bg-gradient-to-l from-transparent via-white/[0.03] to-transparent"
          style={{ animation: "shimmer-line 7s ease-in-out infinite" }}
        />
      </div>
    </div>
  );
}
