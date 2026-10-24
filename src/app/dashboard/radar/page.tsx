"use client";

import { useMemo, useState } from "react";
import {
  Crosshair,
  RefreshCw,
  ExternalLink,
  Bookmark,
  UserPlus,
  Check,
  ShieldCheck,
  Link2,
  Plus,
  Radio,
  Heart,
  MessageCircle as MsgIcon,
  MapPin,
  Send as TelegramIcon,
  Rss,
  Globe,
} from "lucide-react";
import { useJson, useLive } from "@/lib/hooks";
import { Btn, Empty, Field, inputCls, Modal, PageHeader, PlatformIcon, Toggle } from "@/components/ui";
import {
  OPP_PLATFORM_LABEL,
  freshAgo,
  freshnessOf,
  relTime,
} from "@/lib/utils";
import type { Connector, Opportunity, OpportunityPlatform } from "@/lib/types";

interface Data {
  opportunities: Opportunity[];
  counts: { hot: number; warm: number; cold: number; expired: number; new: number };
  connectors: Connector[];
}

function OppIcon({ p, className = "h-4 w-4" }: { p: OpportunityPlatform; className?: string }) {
  switch (p) {
    case "telegram":
      return <TelegramIcon className={className} />;
    case "rss":
      return <Rss className={className} />;
    case "web":
      return <Globe className={className} />;
    default:
      return <PlatformIcon p={p} className={className} />;
  }
}

const OPP_ICON_BG: Record<string, string> = {
  instagram: "bg-pink-600",
  facebook: "bg-blue-600",
  whatsapp: "bg-emerald-600",
  tiktok: "bg-slate-900",
  x: "bg-slate-800",
  telegram: "bg-sky-500",
  rss: "bg-orange-500",
  web: "bg-violet-600",
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  new: { label: "جديدة", cls: "bg-sky-100 text-sky-700" },
  saved: { label: "محفوظة", cls: "bg-amber-100 text-amber-700" },
  contacted: { label: "تحوّلت لعميل", cls: "bg-emerald-100 text-emerald-700" },
  won: { label: "مكتملة ✦", cls: "bg-violet-100 text-violet-700" },
  ignored: { label: "متجاهلة", cls: "bg-slate-100 text-slate-400" },
};

type Tab = "all" | "hot" | "warm" | "saved";

export default function RadarPage() {
  const { live } = useLive();
  const { data, refresh } = useJson<Data>(`/api/opportunities?live=${live ? 1 : 0}`, 4000);
  const [tab, setTab] = useState<Tab>("all");
  const [onlyFresh, setOnlyFresh] = useState(true);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [paste, setPaste] = useState({ url: "", title: "", excerpt: "", author: "" });
  const [pasting, setPasting] = useState(false);
  const [scanning, setScanning] = useState(false);

  const now = Date.now();
  const items = useMemo(() => {
    let arr = data?.opportunities ?? [];
    if (onlyFresh) arr = arr.filter((o) => now - new Date(o.publishedAt).getTime() < 72 * 3600_000);
    if (tab === "hot") arr = arr.filter((o) => now - new Date(o.publishedAt).getTime() < 3600_000);
    if (tab === "warm")
      arr = arr.filter((o) => {
        const a = now - new Date(o.publishedAt).getTime();
        return a >= 3600_000 && a < 86400_000;
      });
    if (tab === "saved") arr = arr.filter((o) => o.status === "saved" || o.status === "contacted" || o.status === "won");
    return arr;
  }, [data, tab, onlyFresh, now]);

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
  const activeConns = connectors.filter((c) => c.active);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="رصّاد الفرص"
        sub="فرص عملاء من المحتوى العام — الجديد فقط، لحظة نشره، مع رابط المنشور دائماً"
        actions={
          <>
            <Btn variant="ghost" onClick={() => setPasteOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              الصق رابط منشور
            </Btn>
            <Btn onClick={scan} disabled={scanning}>
              <RefreshCw className={`h-3.5 w-3.5 ${scanning ? "animate-spin" : ""}`} />
              {scanning ? "جارٍ المسح…" : "مسح الآن"}
            </Btn>
          </>
        }
      />

      {/* شريط الموصلات */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-1.5 ps-1 text-[12px] font-extrabold text-slate-500">
          <Radio className={`h-4 w-4 ${live ? "text-emerald-500" : "text-slate-400"}`} />
          الموصلات:
        </div>
        {connectors.map((c) => (
          <span
            key={c.id}
            title={`${c.legalNote}${c.lastFetchedAt ? ` — آخر مسح: ${relTime(c.lastFetchedAt)}` : ""}`}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
              c.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${c.active ? "live-dot bg-emerald-500" : "bg-slate-300"}`} />
            {c.name}
          </span>
        ))}
        <span className="ms-auto text-[10.5px] font-bold text-slate-400">
          {activeConns.length}/{connectors.length} موصل نشط — الجلب منذ آخر مسح فقط
        </span>
      </div>

      {/* التبويبات */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { key: "all", label: "الجديدة", badge: counts?.new },
              { key: "hot", label: "خلال الساعة الأخيرة", badge: counts?.hot },
              { key: "warm", label: "اليوم", badge: counts?.warm },
              { key: "saved", label: "تابعتُها", badge: undefined },
            ] as Array<{ key: Tab; label: string; badge?: number }>
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-extrabold transition ${
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
        <label className="ms-auto flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
          <Toggle on={onlyFresh} onChange={setOnlyFresh} />
          <span className="text-[11.5px] font-extrabold text-slate-600">الجديد فقط (آخر 72 ساعة)</span>
        </label>
      </div>

      {/* ملاحظة القديم */}
      {!!counts?.expired && (
        <div className="mb-3 rounded-xl bg-slate-100 px-3.5 py-2 text-[11.5px] font-bold text-slate-500">
          أُخفيت {counts.expired} فرصة أقدم من 72 ساعة تلقائياً — الرصد يعرض الجديد حصراً.
        </div>
      )}

      {/* البطاقات */}
      <div className="space-y-3">
        {items.map((o) => {
          const f = freshnessOf(o.publishedAt);
          const st = STATUS_LABEL[o.status];
          return (
            <div key={o.id} className="pop-in rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${OPP_ICON_BG[o.platform]}`}>
                    <OppIcon p={o.platform} className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-black ${f.cls}`}>
                        {f.label}
                      </span>
                      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10.5px] font-extrabold text-violet-600">
                        «{o.keyword}»
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-extrabold ${st.cls}`}>{st.label}</span>
                    </div>
                    <div className="mt-1.5 text-[14px] font-extrabold text-slate-900">{o.title}</div>
                    <div className="text-[11px] font-semibold text-slate-400">
                      {o.authorPublic}
                      {o.locationHint && (
                        <span className="ms-2 inline-flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {o.locationHint}
                        </span>
                      )}
                      <span className="ms-2">{freshAgo(o.publishedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <a
                    href={o.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl bg-violet-600 px-3 py-2 text-[12px] font-extrabold text-white shadow-md shadow-violet-600/25 hover:bg-violet-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    افتح المنشور
                  </a>
                  {o.status === "new" && (
                    <>
                      <button onClick={() => act(o, "status", "saved")} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-600" title="حفظ" aria-label="حفظ">
                        <Bookmark className="h-4 w-4" />
                      </button>
                      <button onClick={() => act(o, "to-lead")} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600" title="تحويل إلى عميل" aria-label="تحويل">
                        <UserPlus className="h-4 w-4" />
                      </button>
                      <button onClick={() => act(o, "status", "ignored")} className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-50" title="تجاهل" aria-label="تجاهل">
                        <Check className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-[12.5px] leading-7 text-slate-600">{o.excerpt}</p>

              <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5 text-rose-300" />
                  {o.engagement.likes}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MsgIcon className="h-3.5 w-3.5 text-sky-300" />
                  {o.engagement.comments}
                </span>
                <span className="inline-flex items-center gap-1" dir="ltr">
                  <Link2 className="h-3.5 w-3.5" />
                  {new URL(o.sourceUrl).hostname}
                </span>
                <span className="ms-auto inline-flex items-center gap-1 text-emerald-600">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  محتوى عام ظاهر — التواصل عبر المنشور
                </span>
              </div>
            </div>
          );
        })}

        {!items.length && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Empty
              icon={<Crosshair className="h-8 w-8" />}
              title="لا فرص في هذا التصنيف"
              sub="فعّل الوضع الحي وانتظر ثوانٍ، أو اضغط «مسح الآن» — أو الصق رابط منشور تصادفه."
            />
          </div>
        )}
      </div>

      {/* شريط القانونية */}
      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-[12px] leading-7 text-emerald-800">
        <div className="mb-1 flex items-center gap-1.5 text-[13px] font-extrabold">
          <ShieldCheck className="h-4 w-4" />
          كيف نجلب بشكل قانوني 100٪؟
        </div>
        نجلب فقط ما هو <b>عام وظاهر للجميع</b> (اسم الناشر العلني، نص المنشور، التوقيت، التفاعلات) عبر الواجهات
        الرسمية (Meta Webhooks، X API، Telegram Bot API، خلاصات RSS) أو ميتاداتا الصفحة العامة عند اللصق اليدوي.
        <b>رابط المنشور مصدر كل فرصة</b> — تتصفّح وتردّ هناك بنفسك باحترام. لا سحب لأرقام ولا بيانات خاصة،
        والفرص الأقدم من 72 ساعة تُحذف تلقائياً (تقليل التخزين = امتثال لقانون 18-07 وGDPR).
      </div>

      {/* نافذة اللصق اليدوي */}
      <Modal open={pasteOpen} onClose={() => setPasteOpen(false)} title="إضافة فرصة من رابط">
        <div className="space-y-4">
          <Field label="رابط المنشور *" hint="فيسبوك، إنستغرام، إكس، تيليغرام، منتدى… أي منشور عام">
            <input
              value={paste.url}
              onChange={(e) => setPaste({ ...paste, url: e.target.value })}
              placeholder="https://facebook.com/groups/…/posts/…"
              dir="ltr"
              className={`${inputCls} text-left`}
            />
          </Field>
          <Field label="عنوان مختصر (اختياري)" hint="يُجلب تلقائياً من المنشور إن تُرك فارغاً">
            <input value={paste.title} onChange={(e) => setPaste({ ...paste, title: e.target.value })} placeholder="مطلوب مصمم لوقو…" className={inputCls} />
          </Field>
          <Field label="تفاصيل إضافية (اختياري)">
            <textarea value={paste.excerpt} onChange={(e) => setPaste({ ...paste, excerpt: e.target.value })} rows={3} className={inputCls} />
          </Field>
          <Field label="اسم الناشر الظاهر (اختياري)">
            <input value={paste.author} onChange={(e) => setPaste({ ...paste, author: e.target.value })} className={inputCls} />
          </Field>
          <div className="flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setPasteOpen(false)}>إلغاء</Btn>
            <Btn onClick={submitPaste} disabled={pasting || !paste.url.startsWith("http")}>
              <Plus className="h-3.5 w-3.5" />
              {pasting ? "جارٍ الجلب…" : "إضافة الفرصة"}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
