"use client";

import { useEffect, useState } from "react";
import { Instagram, Facebook, MessageCircle, Music2, Link2, ShieldCheck, Terminal, CheckCircle2, Circle } from "lucide-react";
import { CopyBtn, PageHeader } from "@/components/ui";

const INTEGRATIONS = [
  {
    id: "instagram",
    name: "إنستغرام للأعمال",
    via: "Meta Graph API",
    icon: Instagram,
    color: "bg-pink-600",
    steps: ["حساب إنستغرام للأعمال مرتبط بصفحة فيسبوك", "تطبيق مطوّر في Meta for Developers", "أذونات: instagram_manage_messages, pages_manage_metadata"],
  },
  {
    id: "whatsapp",
    name: "واتساب للأعمال",
    via: "WhatsApp Business Platform (Cloud API)",
    icon: MessageCircle,
    color: "bg-emerald-600",
    steps: ["رقم هاتف مخصص للنشاط التجاري", "حساب واتساب للأعمال موثّق (اختياري للشارة الخضراء)", "قوالب رسائل معتمدة من ميتا قبل الإرسال الجماعي"],
  },
  {
    id: "facebook",
    name: "صفحات فيسبوك",
    via: "Meta Graph API",
    icon: Facebook,
    color: "bg-blue-600",
    steps: ["صفحة فيسبوك للنشاط", "أذونات: pages_messaging, pages_read_engagement", "اشتراك Webhook في الصفحة"],
  },
  {
    id: "tiktok",
    name: "تيك توك للأعمال",
    via: "TikTok Business API",
    icon: Music2,
    color: "bg-slate-900",
    steps: ["حساب TikTok Business", "تسجيل تطبيق في TikTok for Developers", "أذونات التعليقات والرسائل حسب الموافقة"],
  },
];

export default function SettingsPage() {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="الإعدادات" sub="اربط منصاتك رسمياً — حسابك محمي والبيانات مشفرة" />

      {/* حالة الربط */}
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-amber-600" />
        <div className="text-[12.5px] leading-6 text-amber-800">
          <span className="font-extrabold">أنت الآن في «البيئة التجريبية».</span>{" "}
          كل المزايا تعمل ببيانات محاكاة. عند الربط الفعلي بحساباتك عبر الواجهات الرسمية أدناه،
          تتوقف المحاكاة وتبدأ البيانات الحقيقية بالتدفق عبر Webhooks — دون أي تغيير في اللوحة.
        </div>
      </div>

      {/* الربط */}
      <div className="grid gap-4 md:grid-cols-2">
        {INTEGRATIONS.map((int) => (
          <div key={int.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${int.color}`}>
                  <int.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-[14px] font-extrabold text-slate-900">{int.name}</div>
                  <div className="text-[11px] font-semibold text-slate-400">{int.via}</div>
                </div>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-600">
                <Circle className="h-2.5 w-2.5" />
                غير مربوط
              </span>
            </div>
            <ul className="mt-4 space-y-2">
              {int.steps.map((s) => (
                <li key={s} className="flex items-start gap-2 text-[12px] font-semibold leading-6 text-slate-500">
                  <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  {s}
                </li>
              ))}
            </ul>
            <button className="mt-4 w-full rounded-xl border border-violet-200 bg-violet-50 py-2.5 text-[13px] font-extrabold text-violet-700 transition hover:bg-violet-100">
              ربط الحساب رسمياً (يتطلب حساب مطوّر)
            </button>
          </div>
        ))}
      </div>

      {/* Webhooks */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-1 flex items-center gap-2 text-[14px] font-extrabold text-slate-900">
          <Link2 className="h-4 w-4 text-violet-600" />
          عناوين الربط (Webhooks)
        </div>
        <p className="mb-4 text-[12px] text-slate-400">
          ضع هذه العناوين في إعدادات Webhooks لدى Meta / واتساب بعد نشر المنصة على نطاقك.
        </p>
        <div className="space-y-3">
          {[
            { label: "Meta (إنستغرام + فيسبوك)", url: `${origin}/api/webhooks/meta`, token: "META_VERIFY_TOKEN" },
            { label: "واتساب Cloud API", url: `${origin}/api/webhooks/whatsapp`, token: "WHATSAPP_VERIFY_TOKEN" },
          ].map((w) => (
            <div key={w.url} className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3">
              <Terminal className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-extrabold text-slate-500">{w.label}</div>
                <div className="truncate text-[12px] font-bold text-slate-700" dir="ltr">{w.url}</div>
              </div>
              <CopyBtn text={w.url} label="نسخ" />
              <span className="rounded-lg bg-white px-2 py-1 text-[10.5px] font-bold text-slate-400" dir="ltr">
                verify token: {w.token}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* الخصوصية */}
      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
        <div className="mb-1 flex items-center gap-2 text-[14px] font-extrabold text-emerald-800">
          <ShieldCheck className="h-4 w-4" />
          التزامنا بالخصوصية
        </div>
        <p className="text-[12.5px] leading-7 text-emerald-800/80">
          مِرسال يجمع فقط ما يعطيه العميل طوعاً (اسمه ورقمه بموافقته الصريحة)، يعرض المحتوى العام فقط في المراقبة،
          ولا يخزن أي بيانات خاصة من حسابات الناس. متوافق مع قانون حماية المعطيات الشخصية (18-07) والسوق الأوروبي GDPR —
          جاهز لنموّ عالمي بلا مخاطر قانونية.
        </p>
      </div>
    </div>
  );
}
