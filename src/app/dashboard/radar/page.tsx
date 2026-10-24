"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Crosshair, RefreshCw, ExternalLink, Bookmark, UserPlus, Check,
  ShieldCheck, Link2, Plus, Radio, Heart, MessageCircle as MsgIcon,
  MapPin, Send as TelegramIcon, Rss, Globe, Sparkles, BellRing,
  Handshake, Copy,
} from "lucide-react";
import { useJson, useLive } from "@/lib/hooks";
import { Btn, Empty, Field, inputCls, Modal, PageHeader, PlatformIcon, Toggle, CopyBtn } from "@/components/ui";
import { freshAgo, freshnessOf, relTime } from "@/lib/utils";
import type { Connector, Opportunity, OpportunityPlatform } from "@/lib/types";

interface MatchInfo {
  score: number;
  reasons: string[];
  matched: boolean;
}
type OppItem = Opportunity & { match: MatchInfo; suggestion: string };

interface Data {
  opportunities: OppItem[];
  counts: { hot: number; warm: number; cold: number; expired: number; new: number };
  connectors: Connector[];
  profile: { setupDone: boolean; professionId: string; wilayas: string[]; alertChannel: string };
  subscription: { planId: string };
  plan: { id: string; name: string };
  usage: { today: number; dailyQuota: number; week: number; weeklyQuota: number | null };
}

function OppIcon({ p, className = "h-4 w-4" }: { p: OpportunityPlatform; className?: string }) {
  switch (p) {
    case "telegram": return <TelegramIcon className={className} />;
    case "rss": return <Rss className={className} />;
    case "web": return <Globe className={className} />;
    default: return <PlatformIcon p={p} className={className} />;
  }
}

const OPP_ICON_BG: Record<string, string> = {
  instagram: "bg-pink-600", facebook: "bg-blue-600", whatsapp: "bg-emerald-600",
  tiktok: "bg-slate-900", x: "bg-slate-800", telegram: "bg-sky-500",
  rss: "bg-orange-500", web: "bg-violet-600",
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  new: { label: "جديدة", cls: "bg-sky-100 text-sky-700" },
  saved: { label: "محفوظة", cls: "bg-amber-100 text-amber-700" },
  contacted: { label: "تحوّلت لعميل", cls: "bg-emerald-100 text-emerald-700" },
  won: { label: "مكتملة", cls: "bg-violet-100 text-violet-700" },
  ignored: { label: "متجاهلة", cls: "bg-slate-100 text-slate-400" },
};

function MatchRing({ score }: { score: number }) {
  const color = score >= 85 ? "#10b981" : score >= 65 ? "#8b5cf6" : "#64748b";
  const R = 15, C = 2 * Math.PI * R;
  return (
    <div className="relative h-11 w-11 shrink-0" dir="ltr">
      <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90">
        <circle cx="18" cy="18" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="18" cy="18" r={R} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * C} ${C}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black tabular-nums" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export default function RadarPage() {
  const { live } = useLive();
  const { data, refresh } = useJson<Data>(`/api/opportunities?live=${live ? 1 : 0}`, 4000);
  const [tab, setTab] = useState<"all" | "hour" | "today" | "followed">("all");
  const [mineOnly, setMineOnly] = useState(true);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [paste, setPaste] = useState({ url: "", title: "", excerpt: "", author: "" });
  const [pasting, setPasting] = useState(false);
  const [scanning, setScanning] = useState(false);

  const profile = data?.profile;
  const setupDone = profile?.setupDone ?? false;

  const now = Date.now();
  const items = useMemo(() => {
    let arr = data?.opportunities ?? [];
    if (mineOnly && setupDone) arr = arr.filter((o) => o.match?.matched);
    if (tab === "hour") arr = arr.filter((o) => now - new Date(o.publishedAt).getTime() < 3600_000);
    if (tab === "today") {
      arr = arr.filter((o) => {
        const a = now - new Date(o.publishedAt).getTime();
        return a >= 3600_000 && a < 86400_000;
      });
    }
    if (tab === "followed")
      arr = arr.filter((o) => ["saved", "contacted", "won"].includes(o.status));
    return arr;
  }, [data, tab, mineOnly, setupDone, now]);

  const scan = async () => {
    if (scanning) return;
    setScanning(true);
    await fetch("/api/opportunities/refresh", { method: "POST" });
    refresh();
    setTimeout(() => setScanning(false), 800);
  };

  const act = async (o: Opportunity, action: string, status?: string) => {
    await fetch(`/api/opportunities/${o.id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, status }),
    });
    refresh();
  };

  const submitPaste = async () => {
    if (!paste.url.trim().startsWith("http") || pasting) return;
    setPasting(true);
    await fetch("/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paste),
    });
    setPasting(false);
    setPasteOpen(false);
    setPaste({ url: "", title: "", excerpt: "", author: "" });
    refresh();
  };

  const counts = data?.counts;
  const connectors = data?.connectors ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="زبائنك الجاهزون"
        sub={
          setupDone
            ? "وصلوا إليك تلقائياً بمنشوراتهم وروابط تواصلهم — راجع، انسخ الرسالة، وتواصل"
            : "زبان جاهزون يُسلَّمون إليك — فعّل ملفك في دقيقة ليبدأ التوصيل"
        }
        actions={
          <>
            {!setupDone && (
              <Link href="/dashboard/onboarding">
                <Btn>
                  <Sparkles className="h-3.5 w-3.5" />
                  تفعيل التصفية الذكية
                </Btn>
              </Link>
            )}
            <Btn variant="ghost" onClick={() => setPasteOpen(true)} className="hidden sm:inline-flex">
              <Plus className="h-3.5 w-3.5" />
              إضافة رابط
            </Btn>
            <Btn onClick={scan} disabled={scanning}>
              <RefreshCw className={`h-3.5 w-3.5 ${scanning ? "animate-spin" : ""}`} />
              {scanning ? "مسح…" : "تحديث"}
            </Btn>
          </>
        }
      />

      {/* شريط الأتمتة */}
      <div className="mb-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="flex items-center gap-2 text-[12.5px] font-black text-emerald-300">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
            الرصد التلقائي نشط
          </span>
          <span className="text-[11px] font-bold text-slate-400">
            {connectors.filter((c) => c.active).length} قناة رسمية تعمل لحظياً · حذف تلقائي بعد 72 ساعة
          </span>
          {setupDone && (
            <span className="ms-auto inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 py-1 text-[11px] font-black text-slate-200">
              <BellRing className="h-3 w-3" />
              التنبيهات: {{ app: "داخل المنصة", whatsapp: "واتساب", telegram: "تيليغرام" }[profile?.alertChannel ?? "app"]}
            </span>
          )}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {connectors.map((c) => (
            <span
              key={c.id}
              title={c.legalNote}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold ${
                c.active ? "bg-white/[0.06] text-slate-300" : "bg-white/[0.03] text-slate-600"
              }`}
            >
              <span className={`h-1 w-1 rounded-full ${c.active ? "bg-emerald-400" : "bg-slate-600"}`} />
              {c.name}
            </span>
          ))}
        </div>
      </div>

      {/* عدّاد التسليم */}
      {data?.usage && (
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <Handshake className="h-5 w-5 shrink-0 text-violet-600" />
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-black text-slate-800">
              مسلَّم إلى لوحتك: {data.usage.week} زبون جاهز هذا الأسبوع
              <span className="ms-2 rounded-full bg-violet-50 px-2 py-0.5 text-[10.5px] font-black text-violet-600">
                باقة {data.plan.name}
              </span>
            </div>
            <div className="mt-1 text-[11px] font-semibold text-slate-400">
              {data.usage.dailyQuota === -1
                ? "توصيل بلا حدود — قبل الجميع"
                : data.usage.dailyQuota > 0
                  ? `حصة باقتك: ${data.usage.dailyQuota} زبائن يومياً`
                  : `${data.usage.weeklyQuota} زبائن أسبوعياً — رقِّ للتوصيل اليومي`}
            </div>
          </div>
          {data.subscription.planId !== "pro" && (
            <Link href="/dashboard/billing">
              <Btn variant="soft">ترقية الباقة</Btn>
            </Link>
          )}
        </div>
      )}

      {/* لافتة التفعيل */}
      {!setupDone && (
        <Link href="/dashboard/onboarding" className="group mb-4 block rounded-2xl border border-violet-400/25 bg-gradient-to-l from-violet-600/[0.14] to-fuchsia-600/[0.08] p-5 transition hover:border-violet-400/40">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-200">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-black text-white">فعّل ملف الرصد في 60 ثانية</div>
              <div className="mt-0.5 text-[12px] font-semibold leading-6 text-slate-400">
                تخصص واحد، كلمات مولّدة تلقائياً، ولاياتك — ثم لا تبحث أبداً: الفرص المطابقة تصلك وحدها.
              </div>
            </div>
            <span className="hidden text-[12px] font-black text-violet-300 group-hover:text-violet-200 sm:block">تفعيل ←</span>
          </div>
        </Link>
      )}

      {/* أدوات التصفية */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { key: "all", label: "الكل", badge: counts?.new },
              { key: "hour", label: "خلال الساعة", badge: counts?.hot },
              { key: "today", label: "اليوم", badge: counts?.warm },
              { key: "followed", label: "أتابعها", badge: undefined },
            ] as Array<{ key: "all" | "hour" | "today" | "followed"; label: string; badge?: number }>
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-black transition ${
                tab === t.key
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/25"
                  : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {t.label}
              {t.badge !== undefined && <span className="ms-1.5 opacity-60">{t.badge}</span>}
            </button>
          ))}
        </div>
        {setupDone && (
          <label className="ms-auto flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
            <Toggle on={mineOnly} onChange={setMineOnly} />
            <span className="text-[11.5px] font-black text-slate-600">مطابقة تخصصي فقط</span>
          </label>
        )}
      </div>

      {/* ملاحظة القديم */}
      {!!counts?.expired && (
        <div className="mb-3 rounded-xl bg-slate-100 px-3.5 py-2 text-[11.5px] font-bold text-slate-500">
          أُخفيت {counts.expired} فرصة أقدم من 72 ساعة تلقائياً — الجديد حصراً.
        </div>
      )}

      {/* البطاقات */}
      <div className="space-y-3">
        {items.map((o) => {
          const f = freshnessOf(o.publishedAt);
          const st = STATUS_LABEL[o.status] ?? STATUS_LABEL.new;
          const matched = o.match?.matched;
          return (
            <div
              key={o.id}
              className={`pop-in rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5 ${
                matched ? "border-violet-200" : "border-slate-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* درجة المطابقة — تظهر فقط مع ملف مفعّل */}
                {setupDone && (
                  <div className="hidden sm:block">
                    {matched ? (
                      <MatchRing score={o.match.score} />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-100 text-[10px] font-black text-slate-300">
                        —
                      </div>
                    )}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-black ${f.cls}`}>
                      {f.label}
                    </span>
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10.5px] font-extrabold text-violet-600">
                      {o.keyword}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-extrabold ${st.cls}`}>{st.label}</span>
                  </div>

                  <div className="mt-1.5 text-[14px] font-extrabold leading-6 text-slate-900">{o.title}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-400">
                    <span>{o.authorPublic}</span>
                    {o.locationHint && (
                      <span className="inline-flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        {o.locationHint}
                      </span>
                    )}
                    <span>{freshAgo(o.publishedAt)}</span>
                  </div>

                  {matched && o.match.reasons.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.match.reasons.slice(0, 2).map((r) => (
                        <span key={r} className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* الإجراءات */}
                <div className="flex shrink-0 items-center gap-1.5">
                  {o.status === "new" && (
                    <>
                      <button onClick={() => act(o, "status", "saved")} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600" title="حفظ" aria-label="حفظ">
                        <Bookmark className="h-4 w-4" />
                      </button>
                      <button onClick={() => act(o, "to-lead")} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600" title="تحويل إلى عميل" aria-label="تحويل">
                        <UserPlus className="h-4 w-4" />
                      </button>
                      <button onClick={() => act(o, "status", "ignored")} className="hidden rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 sm:block" title="تجاهل" aria-label="تجاهل">
                        <Check className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <p className="mt-3 line-clamp-2 rounded-xl bg-slate-50 p-3 text-[12.5px] leading-6 text-slate-600">{o.excerpt}</p>

              {/* الرسالة الجاهزة — ينسخها ويرسلها */}
              {o.suggestion && (
                <div className="mt-2.5 rounded-xl border border-dashed border-slate-200 bg-white p-3">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-black text-slate-500">
                      <Copy className="h-3 w-3" />
                      رسالة افتتاحية جاهزة — انسخها وأرسلها كما هي
                    </span>
                    <CopyBtn text={o.suggestion} label="نسخ الرسالة" />
                  </div>
                  <p className="whitespace-pre-line text-[11.5px] leading-6 text-slate-500">{o.suggestion}</p>
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                  <Heart className="h-3.5 w-3.5 text-rose-300" />
                  {o.engagement.likes}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                  <MsgIcon className="h-3.5 w-3.5 text-sky-300" />
                  {o.engagement.comments}
                </span>
                <a href={o.sourceUrl} target="_blank" rel="noopener noreferrer" className="ms-auto inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-[11.5px] font-black text-white shadow-md shadow-violet-600/25 transition hover:bg-violet-700">
                  <ExternalLink className="h-3.5 w-3.5" />
                  تواصل الآن — منشور العميل
                </a>
              </div>
            </div>
          );
        })}

        {!items.length && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Empty
              icon={<Crosshair className="h-8 w-8" />}
              title={mineOnly && setupDone ? "لا فرص مطابقة في هذه اللحظة" : "لا فرص في هذا التصنيف بعد"}
              sub="النظام يرصد باستمرار — ستظهر الفرصة المناسبة تلقائياً خلال دقائق."
            />
          </div>
        )}
      </div>

      {/* إخلاء قانوني */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-[12px] leading-7 text-slate-500">
        <div className="mb-1 flex items-center gap-1.5 text-[12.5px] font-black text-slate-700">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          المصادر والامتثال
        </div>
        يُرصد المحتوى العام الظاهر للجميع عبر الواجهات الرسمية (Meta، X API، Telegram Bot API، خلاصات RSS) مع توثيق رابط المصدر لكل فرصة، وحذف تلقائي للأقدم من 72 ساعة — توافق مع قانون 18-07 وGDPR.
      </div>

      {/* نافذة إضافة رابط */}
      <Modal open={pasteOpen} onClose={() => setPasteOpen(false)} title="إضافة فرصة من رابط">
        <div className="space-y-4">
          <Field label="رابط المنشور" hint="أي منشور عام: فيسبوك، إنستغرام، إكس، تيليغرام، منتدى">
            <input
              value={paste.url}
              onChange={(e) => setPaste({ ...paste, url: e.target.value })}
              placeholder="https://…"
              dir="ltr"
              className={`${inputCls} text-left`}
            />
          </Field>
          <Field label="عنوان مختصر (اختياري)">
            <input value={paste.title} onChange={(e) => setPaste({ ...paste, title: e.target.value })} className={inputCls} />
          </Field>
          <Field label="اسم الناشر الظاهر (اختياري)">
            <input value={paste.author} onChange={(e) => setPaste({ ...paste, author: e.target.value })} className={inputCls} />
          </Field>
          <div className="flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setPasteOpen(false)}>إلغاء</Btn>
            <Btn onClick={submitPaste} disabled={pasting || !paste.url.startsWith("http")}>
              <Plus className="h-3.5 w-3.5" />
              {pasting ? "جارٍ الجلب…" : "إضافة"}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
