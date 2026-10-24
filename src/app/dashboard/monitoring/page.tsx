"use client";

import { useState } from "react";
import { Radar, Plus, Trash2, UserPlus, Heart, MessageCircle as MsgIcon, Check, Repeat } from "lucide-react";
import { useJson } from "@/lib/hooks";
import { Btn, Empty, PageHeader, PlatformBadge, PlatformIcon, SentimentBadge } from "@/components/ui";
import { PLATFORM_META, relTime } from "@/lib/utils";
import type { ListenRule, Mention, Platform } from "@/lib/types";

interface Data {
  mentions: Array<Mention & { rule: ListenRule | null }>;
  rules: ListenRule[];
}

export default function MonitoringPage() {
  const { data, refresh } = useJson<Data>("/api/mentions", 4000);
  const [kw, setKw] = useState("");
  const [plats, setPlats] = useState<Platform[]>(["instagram", "tiktok"]);
  const [adding, setAdding] = useState(false);

  const addRule = async () => {
    if (!kw.trim() || adding) return;
    setAdding(true);
    await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: kw, platforms: plats }),
    });
    setKw("");
    setAdding(false);
    refresh();
  };

  const toggleRule = async (r: ListenRule, active: boolean) => {
    await fetch(`/api/rules/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    refresh();
  };

  const deleteRule = async (r: ListenRule) => {
    await fetch(`/api/rules/${r.id}`, { method: "DELETE" });
    refresh();
  };

  const convert = async (m: Mention) => {
    await fetch(`/api/mentions/${m.id}/convert`, { method: "POST" });
    refresh();
  };

  const mentions = data?.mentions ?? [];
  const rules = data?.rules ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="المراقبة اللحظية"
        sub="اسمَع نبض السوق: من يطلب منتجك الآن في السوشيال؟ — وحوّله إلى عميل بضغطة"
      />

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        {/* القواعد */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-[14px] font-extrabold text-slate-900">كلمات أراقبها</div>
            <div className="space-y-2">
              {rules.map((r) => (
                <div key={r.id} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${r.active ? "border-violet-100 bg-violet-50/50" : "border-slate-100 bg-slate-50"}`}>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-extrabold text-slate-800">«{r.keyword}»</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {r.platforms.map((p) => (
                        <span key={p} className={`flex h-5 w-5 items-center justify-center rounded-md text-white ${PLATFORM_META[p].solid}`}>
                          <PlatformIcon p={p} className="h-3 w-3" />
                        </span>
                      ))}
                      <span className="ms-1 text-[10.5px] font-bold text-slate-400">{r.matchesCount} تطابق</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleRule(r, !r.active)}
                    className={`rounded-lg px-2 py-1 text-[10.5px] font-extrabold ${r.active ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500"}`}
                  >
                    {r.active ? "نشطة" : "متوقفة"}
                  </button>
                  <button onClick={() => deleteRule(r)} className="rounded-lg p-1 text-slate-300 hover:text-rose-500" aria-label="حذف">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {!rules.length && <div className="py-4 text-center text-[12px] text-slate-400">لا كلمات بعد — أضف أول كلمة 👇</div>}
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              <input
                value={kw}
                onChange={(e) => setKw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRule()}
                placeholder="كلمة جديدة… مثال: كرسي باربر"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-violet-400"
              />
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(PLATFORM_META) as Platform[]).map((p) => {
                  const on = plats.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => setPlats(on ? plats.filter((x) => x !== p) : [...plats, p])}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${on ? "bg-violet-100 text-violet-700" : "border border-slate-200 text-slate-400"}`}
                    >
                      <PlatformIcon p={p} className="h-3 w-3" />
                      {PLATFORM_META[p].label}
                    </button>
                  );
                })}
              </div>
              <Btn onClick={addRule} disabled={adding || !kw.trim()} className="w-full">
                <Plus className="h-4 w-4" />
                إضافة كلمة مراقبة
              </Btn>
            </div>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 text-[12px] leading-6 text-violet-800">
            <div className="mb-1 flex items-center gap-1.5 font-extrabold">
              <Radar className="h-4 w-4" />
              كيف تعمل المراقبة؟
            </div>
            نمسح المحتوى العام (التعليقات والمنشورات العامة) للكلمات التي تختارها عبر واجهات المنصات الرسمية — دون أي سحب لبيانات خاصة، والعميل يبقى مالكاً لبياناته.
          </div>
        </div>

        {/* تدفق المنشن */}
        <div className="space-y-3">
          {mentions.map((m) => (
            <div key={m.id} className="pop-in rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full text-white ${PLATFORM_META[m.platform].solid}`}>
                    <PlatformIcon p={m.platform} className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-[13px] font-extrabold text-slate-900">
                      {m.authorName}
                      <span className="ms-1.5 text-[11px] font-semibold text-slate-400">{m.authorHandle}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <PlatformBadge p={m.platform} />
                      {m.rule && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10.5px] font-extrabold text-violet-600">«{m.rule.keyword}»</span>}
                      <SentimentBadge s={m.sentiment} />
                      <span className="text-[10.5px] text-slate-300">{relTime(m.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {m.converted ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-600">
                    <Check className="h-3 w-3" />
                    تحوّل لعميل
                  </span>
                ) : (
                  <Btn variant="soft" onClick={() => convert(m)}>
                    <UserPlus className="h-3.5 w-3.5" />
                    تحويل إلى عميل
                  </Btn>
                )}
              </div>
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-[13px] leading-7 text-slate-700">{m.content}</p>
              <div className="mt-2 flex items-center gap-4 text-[11px] font-bold text-slate-400">
                <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-rose-400" /> {m.likes}</span>
                <span className="flex items-center gap-1"><MsgIcon className="h-3.5 w-3.5 text-sky-400" /> {m.comments}</span>
                <span className="flex items-center gap-1"><Repeat className="h-3.5 w-3.5" /> يطابق قاعدة مراقبة</span>
              </div>
            </div>
          ))}
          {!mentions.length && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Empty icon={<Radar className="h-8 w-8" />} title="لا منشن بعد" sub="أضف كلمات مراقبة — وستظهر فرص العملاء هنا لحظياً." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
