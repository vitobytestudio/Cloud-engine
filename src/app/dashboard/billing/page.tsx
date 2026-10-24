"use client";

import { useState } from "react";
import { Check, CreditCard, Loader2, Sparkles, BadgeCheck } from "lucide-react";
import { useJson } from "@/lib/hooks";
import { Btn, Modal, PageHeader } from "@/components/ui";
import { fmtDzd } from "@/lib/plans";
import type { Plan, Subscription } from "@/lib/types";

interface Data {
  subscription: Subscription;
  plan: Plan;
  plans: Plan[];
  usage: { today: number; dailyQuota: number; week: number; weeklyQuota: number | null };
}

export default function BillingPage() {
  const { data, refresh } = useJson<Data>("/api/subscription", 8000);
  const [checkout, setCheckout] = useState<Plan | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const activate = async () => {
    if (!checkout || confirming) return;
    setConfirming(true);
    await fetch("/api/subscription", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: checkout.id }),
    });
    setConfirming(false);
    setDone(true);
    refresh();
  };

  const current = data?.plan;
  const usage = data?.usage;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="الباقات"
        sub="أنت تدفع مقابل زبائن جاهزين يصلونك — لا مقابل أداة بحث. هذا الفرق."
      />

      {/* الاستهلاك الحالي */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11.5px] font-bold text-slate-400">باقتك الحالية</div>
          <div className="mt-1 flex items-center gap-2 text-[17px] font-black text-slate-900">
            {current?.name ?? "…"}
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-black text-emerald-600">نشطة</span>
          </div>
          <div className="mt-0.5 text-[11px] font-semibold text-slate-400">
            {data?.subscription.planId === "free" ? "مجانية — للأبد" : `تجديد: ${new Date(data?.subscription.renewsAt ?? Date.now()).toLocaleDateString("ar-DZ")}`}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11.5px] font-bold text-slate-400">زبائن جاهزون — هذا الأسبوع</div>
          <div className="mt-1 text-[17px] font-black text-slate-900">
            {usage ? usage.week : "…"}
            <span className="ms-1 text-[12px] font-bold text-slate-400">
              {usage?.weeklyQuota ? `/ ${usage.weeklyQuota}` : "مسلَّم"}
            </span>
          </div>
          <div className="mt-1 text-[11px] font-semibold text-slate-400">بمنشوراتهم وروابط تواصلهم</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11.5px] font-bold text-slate-400">إجمالي ما وصلتك</div>
          <div className="mt-1 text-[17px] font-black text-slate-900">{data?.subscription.totalDelivered ?? "…"} زبون</div>
          <div className="mt-1 text-[11px] font-semibold text-slate-400">منذ انضمامك</div>
        </div>
      </div>

      {/* الباقات */}
      <div className="grid gap-4 md:grid-cols-3">
        {(data?.plans ?? []).map((p) => {
          const isCurrent = data?.subscription.planId === p.id;
          const highlight = p.id === "growth";
          return (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-3xl border p-6 transition md:p-7 ${
                highlight
                  ? "border-violet-300 bg-gradient-to-b from-violet-50 to-white shadow-xl shadow-violet-600/10"
                  : "border-slate-200 bg-white shadow-sm"
              }`}
            >
              {highlight && (
                <span className="absolute -top-3 start-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3.5 py-1 text-[11px] font-black text-white shadow-lg shadow-violet-600/30">
                  الأنسب للفريلانسر
                </span>
              )}
              <div className="text-[14px] font-black text-slate-900">{p.name}</div>
              <div className="mt-1 text-[11.5px] font-semibold text-slate-400">{p.tagline}</div>
              <div className="mt-4 flex items-end gap-1.5">
                <span className="text-[34px] font-black leading-none text-slate-900">{fmtDzd(p.priceDzd).replace(" دج", "")}</span>
                <span className="pb-1 text-[11.5px] font-bold text-slate-400">دج{p.priceDzd > 0 ? " / شهرياً" : " — للأبد"}</span>
              </div>
              <div className="my-5 h-px bg-slate-100" />
              <ul className="flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[12.5px] font-semibold leading-6 text-slate-600">
                    <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-violet-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <Btn
                onClick={() => (isCurrent ? undefined : setCheckout(p))}
                disabled={isCurrent}
                variant={highlight && !isCurrent ? "primary" : "ghost"}
                className="mt-6 w-full !py-3"
              >
                {isCurrent ? (
                  <>
                    <BadgeCheck className="h-4 w-4" />
                    باقتك الحالية
                  </>
                ) : p.id === "free" ? (
                  "التحويل للانطلاقة"
                ) : (
                  "اشترك واستقبل زبائنك"
                )}
              </Btn>
            </div>
          );
        })}
      </div>

      {/* ضمانات */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          ["بدون التزام شهري", "ألغِ متى شئت — يبقى رصيد الشهر"],
          ["دفع جزائري 100٪", "CIB والذهبية عبر بوابة آمنة عند الإطلاق"],
          ["ضمان الجودة", "زبون بلا منشور ورابط؟ لا يُحسب من باقتك"],
        ].map(([t, d]) => (
          <div key={t} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <div className="text-[12.5px] font-black text-slate-800">{t}</div>
            <div className="mt-1 text-[11px] font-semibold leading-5 text-slate-400">{d}</div>
          </div>
        ))}
      </div>

      {/* نافذة الدفع */}
      <Modal open={!!checkout} onClose={() => { setCheckout(null); setDone(false); }} title={done ? "تم التفعيل" : `الاشتراك في باقة ${checkout?.name ?? ""}`}>
        {done ? (
          <div className="py-6 text-center">
            <BadgeCheck className="mx-auto h-14 w-14 text-emerald-500" />
            <div className="mt-3 text-[16px] font-black text-slate-900">باقتك فعّالت — راقب «زبائنك الجاهزون»</div>
            <p className="mx-auto mt-2 max-w-sm text-[12.5px] leading-7 text-slate-500">
              ستبدأ الفرص المطابقة بالوصول فوراً، وكل زبون بمنشوره ورابط تواصله ورسالة جاهزة.
            </p>
            <Btn className="mt-5" onClick={() => { setCheckout(null); setDone(false); }}>حسناً</Btn>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between text-[13px] font-black text-slate-800">
                <span>باقة {checkout?.name}</span>
                <span>{checkout ? fmtDzd(checkout.priceDzd) : ""}</span>
              </div>
              <div className="mt-1 text-[11px] font-semibold text-slate-400">
                {checkout?.dailyClients === -1 ? "زبائن غير محدودين" : checkout?.dailyClients ? `حتى ${checkout.dailyClients} زبائن يومياً` : `${checkout?.weeklyClientsFree} زبائن أسبوعياً`} · تجديد شهري · إلغاء متى شئت
              </div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[12px] leading-6 text-amber-800">
              <div className="flex items-center gap-1.5 font-black">
                <CreditCard className="h-4 w-4" />
                الدفع عند الإطلاق التجاري
              </div>
              في هذه النسخة التجريبية الترقية تُفعَّل فوراً بالمحاكاة. عند الإطلاق: الدفع بـ CIB / الذهبية عبر بوابة Chargily الآمنة، وبنفس الأسعار.
            </div>
            <Btn onClick={activate} disabled={confirming} className="w-full !py-3">
              {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {confirming ? "جارٍ التفعيل…" : "تفعيل فوري (تجريبي)"}
            </Btn>
          </div>
        )}
      </Modal>
    </div>
  );
}
