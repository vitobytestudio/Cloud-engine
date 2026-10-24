"use client";

import Link from "next/link";
import {
  UserPlus,
  MessagesSquare,
  Zap,
  TrendingUp,
  Play,
  Inbox as InboxIcon,
  Sparkles,
  MessageSquare,
  AtSign,
  Bot,
  Send,
  Activity,
  Instagram,
  Facebook,
  MessageCircle,
  Music2,
  Twitter,
  ArrowLeft,
} from "lucide-react";
import { useJson, useLive } from "@/lib/hooks";
import { Btn, PageHeader, PlatformIcon, ScoreBar, Sparkline, StatCard, StatusBadge, Donut } from "@/components/ui";
import { relTime } from "@/lib/utils";
import type { Lead, Platform } from "@/lib/types";

interface StatsData {
  workspace: { name: string; tagline: string; city: string };
  cards: { newToday: number; activeConvs: number; activeAutomations: number; conversionRate: number; totalLeads: number; unread: number };
  spark: number[];
  donut: Array<{ label: string; value: number; color: string }>;
  recentLeads: Lead[];
  activity: Array<{ id: string; type: string; text: string; platform?: Platform; createdAt: string }>;
}

const ACT_ICON: Record<string, React.ReactNode> = {
  lead: <UserPlus className="h-3.5 w-3.5" />,
  message: <MessageSquare className="h-3.5 w-3.5" />,
  mention: <AtSign className="h-3.5 w-3.5" />,
  automation: <Bot className="h-3.5 w-3.5" />,
  campaign: <Send className="h-3.5 w-3.5" />,
  system: <Sparkles className="h-3.5 w-3.5" />,
};

const PLATFORM_ICON_BG: Record<string, string> = {
  instagram: "bg-pink-100 text-pink-600",
  facebook: "bg-blue-100 text-blue-600",
  whatsapp: "bg-emerald-100 text-emerald-600",
  tiktok: "bg-slate-200 text-slate-800",
  x: "bg-slate-200 text-slate-700",
};

export default function Overview() {
  const { live } = useLive();
  const { data, refresh } = useJson<StatsData>(`/api/stats?live=${live ? 1 : 0}`, 5000);
  const prof = useJson<{ profile: { setupDone: boolean; professionId: string } }>("/api/profile", 0);
  const setupDone = prof.data?.profile.setupDone ?? true;

  const simulate = async () => {
    await fetch("/api/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    refresh();
  };

  const c = data?.cards;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="لوحة التحكم"
        sub={data ? `${data.workspace.name} — ${data.workspace.tagline}` : "جارٍ التحميل…"}
        actions={
          <>
            <Btn variant="ghost" onClick={simulate}>
              <Play className="h-3.5 w-3.5" />
              توليد نشاط تجريبي
            </Btn>
            <Link href="/dashboard/pages">
              <Btn>
                <Sparkles className="h-3.5 w-3.5" />
                صفحة التقاط جديدة
              </Btn>
            </Link>
          </>
        }
      />

      {/* لافتة التفعيل الذكي */}
      {!setupDone && (
        <Link
          href="/dashboard/onboarding"
          className="group mb-4 flex items-center gap-4 rounded-2xl border border-violet-200 bg-gradient-to-l from-violet-50 to-white p-4 shadow-sm transition hover:border-violet-300"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-black text-slate-900">فعّل الرصد التلقائي الذكي</span>
            <span className="mt-0.5 block text-[11.5px] font-semibold leading-5 text-slate-500">
              دقيقة واحدة: تخصصك وكلماتك — ثم تصلك فرص العملاء المطابقة وحدها، بلا أي بحث.
            </span>
          </span>
          <span className="hidden text-[12px] font-black text-violet-600 group-hover:text-violet-700 sm:block">تفعيل ←</span>
        </Link>
      )}

      {/* البطاقات */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="عملاء جدد اليوم" value={c?.newToday ?? "…"} sub={`الإجمالي: ${c?.totalLeads ?? 0} عميل`} icon={<UserPlus className="h-5 w-5" />} />
        <StatCard label="محادثات نشطة" value={c?.activeConvs ?? "…"} sub={`${c?.unread ?? 0} رسالة غير مقروءة`} icon={<MessagesSquare className="h-5 w-5" />} tone="emerald" />
        <StatCard label="أتمتات تعمل الآن" value={c?.activeAutomations ?? "…"} sub="رد فوري 24/7" icon={<Zap className="h-5 w-5" />} tone="amber" />
        <StatCard label="معدل التحويل" value={c !== undefined ? `${c.conversionRate}٪` : "…"} sub="من عميل إلى مشترٍ" icon={<TrendingUp className="h-5 w-5" />} tone="sky" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* نمو العملاء */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-[14px] font-extrabold text-slate-900">نمو العملاء — آخر 14 يوماً</div>
              <div className="text-[11px] text-slate-400">من كل المنصات والقنوات</div>
            </div>
            <Link href="/dashboard/leads" className="flex items-center gap-1 text-[12px] font-bold text-violet-600 hover:underline">
              كل العملاء
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
          {data ? <Sparkline points={data.spark} /> : <div className="h-20 animate-pulse rounded-xl bg-slate-100" />}
        </div>

        {/* التوزيع */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 text-[14px] font-extrabold text-slate-900">العملاء حسب المنصة</div>
          {data ? <Donut slices={data.donut} /> : <div className="h-36 animate-pulse rounded-xl bg-slate-100" />}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* النشاط اللحظي */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[14px] font-extrabold text-slate-900">
              <Activity className="h-4 w-4 text-violet-600" />
              النشاط اللحظي
            </div>
            {live && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-600">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
                مباشر
              </span>
            )}
          </div>
          <div className="max-h-[320px] space-y-1 overflow-y-auto pe-1">
            {(data?.activity ?? []).map((a) => (
              <div key={a.id} className="pop-in flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${a.platform ? PLATFORM_ICON_BG[a.platform] : "bg-violet-100 text-violet-600"}`}>
                  {a.platform ? <PlatformIcon p={a.platform} className="h-3.5 w-3.5" /> : ACT_ICON[a.type] ?? <Sparkles className="h-3.5 w-3.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-semibold text-slate-700">{a.text}</div>
                  <div className="text-[10.5px] text-slate-400">{relTime(a.createdAt)}</div>
                </div>
              </div>
            ))}
            {!data && <div className="h-40 animate-pulse rounded-xl bg-slate-100" />}
          </div>
        </div>

        {/* أحدث العملاء */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[14px] font-extrabold text-slate-900">
              <UserPlus className="h-4 w-4 text-violet-600" />
              أحدث العملاء
            </div>
            <Link href="/dashboard/inbox" className="flex items-center gap-1 text-[12px] font-bold text-violet-600 hover:underline">
              <InboxIcon className="h-3.5 w-3.5" />
              الصندوق
            </Link>
          </div>
          <div className="space-y-1">
            {(data?.recentLeads ?? []).map((l) => (
              <div key={l.id} className="pop-in flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${PLATFORM_ICON_BG[l.platform]}`}>
                  <PlatformIcon p={l.platform} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold text-slate-800">
                    {l.name}
                    {l.phone && <span className="ms-1.5 text-[10px] font-extrabold text-emerald-600">✦ رقم</span>}
                  </div>
                  <div className="truncate text-[11px] text-slate-400">{l.source}</div>
                </div>
                <div className="hidden sm:block">
                  <ScoreBar score={l.score} />
                </div>
                <StatusBadge s={l.status} />
              </div>
            ))}
            {!data && <div className="h-40 animate-pulse rounded-xl bg-slate-100" />}
          </div>
        </div>
      </div>
    </div>
  );
}
