"use client";

import { useMemo, useState } from "react";
import { Search, Users, Phone, ShieldCheck, ShieldAlert, Tag, Save, Trash2 } from "lucide-react";
import { useJson } from "@/lib/hooks";
import { Btn, Empty, Field, inputCls, Modal, PageHeader, PlatformBadge, ScoreBar, StatusBadge } from "@/components/ui";
import { PLATFORM_META, STATUS_META, relTime } from "@/lib/utils";
import type { Lead, LeadStatus, Platform } from "@/lib/types";

const STATUS_TABS: Array<{ key: LeadStatus | "all"; label: string }> = [
  { key: "all", label: "الكل" },
  { key: "new", label: "جديد" },
  { key: "contacted", label: "تم التواصل" },
  { key: "qualified", label: "مؤهل" },
  { key: "customer", label: "عميل ✦" },
  { key: "lost", label: "مفقود" },
];

export default function LeadsPage() {
  const { data, refresh } = useJson<{ leads: Lead[] }>("/api/leads", 5000);
  const [tab, setTab] = useState<LeadStatus | "all">("all");
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<LeadStatus>("new");
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const leads = useMemo(() => {
    let arr = data?.leads ?? [];
    if (tab !== "all") arr = arr.filter((l) => l.status === tab);
    if (platform !== "all") arr = arr.filter((l) => l.platform === platform);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      arr = arr.filter(
        (l) =>
          l.name.toLowerCase().includes(needle) ||
          (l.phone ?? "").includes(needle) ||
          l.handle.toLowerCase().includes(needle) ||
          l.source.toLowerCase().includes(needle)
      );
    }
    return arr;
  }, [data, tab, q, platform]);

  const counts = useMemo(() => {
    const all = data?.leads ?? [];
    const c: Record<string, number> = { all: all.length };
    for (const l of all) c[l.status] = (c[l.status] ?? 0) + 1;
    return c;
  }, [data]);

  const openLead = (l: Lead) => {
    setSelected(l);
    setNotes(l.notes ?? "");
    setStatus(l.status);
    setTagInput("");
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    await fetch(`/api/leads/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes }),
    });
    setSaving(false);
    setSelected(null);
    refresh();
  };

  const removeTag = async (tag: string) => {
    if (!selected) return;
    const tags = selected.tags.filter((t) => t !== tag);
    setSelected({ ...selected, tags });
    await fetch(`/api/leads/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    });
    refresh();
  };

  const addTag = async () => {
    if (!selected || !tagInput.trim()) return;
    const tags = [...new Set([...selected.tags, tagInput.trim()])].slice(0, 8);
    setSelected({ ...selected, tags });
    setTagInput("");
    await fetch(`/api/leads/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    });
    refresh();
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="العملاء"
        sub={`${data?.leads.length ?? 0} عميل — كلهم بمصادرهم وبياناتهم الموثقة`}
      />

      {/* التبويبات والبحث */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-extrabold transition ${
                tab === t.key ? "bg-violet-600 text-white shadow-md shadow-violet-600/25" : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {t.label}
              <span className="ms-1.5 opacity-60">{counts[t.key] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="ms-auto flex items-center gap-2">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform | "all")}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-slate-600 outline-none"
          >
            <option value="all">كل المنصات</option>
            {(Object.keys(PLATFORM_META) as Platform[]).map((p) => (
              <option key={p} value={p}>{PLATFORM_META[p].label}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث بالاسم أو الرقم…"
              className="w-48 rounded-xl border border-slate-200 bg-white py-2 pe-3 ps-9 text-[12px] outline-none focus:border-violet-400"
            />
          </div>
        </div>
      </div>

      {/* الجدول */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[1.5fr_1fr_1.4fr_0.9fr_auto] gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3 text-[11px] font-extrabold text-slate-400 md:grid">
          <div>العميل</div>
          <div>المصدر</div>
          <div>التواصل</div>
          <div>الاهتمام</div>
          <div>الحالة</div>
        </div>
        {leads.map((l) => (
          <button
            key={l.id}
            onClick={() => openLead(l)}
            className="grid w-full grid-cols-1 gap-2 border-b border-slate-50 px-5 py-3.5 text-start transition hover:bg-violet-50/40 md:grid-cols-[1.5fr_1fr_1.4fr_0.9fr_auto] md:items-center md:gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 truncate text-[13.5px] font-extrabold text-slate-900">
                  {l.name}
                  <span className="text-[10px] font-semibold text-slate-300">{relTime(l.createdAt)}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <PlatformBadge p={l.platform} />
                  <span className="text-[11px] text-slate-400">{l.handle}</span>
                </div>
              </div>
            </div>
            <div className="truncate text-[12px] font-semibold text-slate-500">{l.source}</div>
            <div>
              {l.phone ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[12px] font-extrabold text-emerald-700" dir="ltr">
                  <Phone className="h-3 w-3" />
                  {l.phone}
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  لا رقم بعد — اطلبه بالمحادثة
                </span>
              )}
            </div>
            <ScoreBar score={l.score} />
            <div className="flex items-center justify-between gap-2 md:justify-start">
              <StatusBadge s={l.status} />
            </div>
          </button>
        ))}
        {!leads.length && (
          <Empty icon={<Users className="h-8 w-8" />} title="لا عملاء مطابقين" sub="جرّب تبويباً آخر أو ابحث بكلمة مختلفة — أو فعّل الوضع الحي وانتظر عميلاً جديداً." />
        )}
      </div>

      {/* تفاصيل العميل */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="ملف العميل" wide>
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-lg font-black text-white">
                {selected.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-extrabold text-slate-900">{selected.name}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <PlatformBadge p={selected.platform} />
                  <span className="text-[12px] font-semibold text-slate-400">{selected.handle}</span>
                  <span className="text-[11px] text-slate-300">· انضم {relTime(selected.createdAt)}</span>
                </div>
              </div>
              <ScoreBar score={selected.score} />
            </div>

            <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
              <div>
                <div className="text-[11px] font-bold text-slate-400">المصدر</div>
                <div className="mt-0.5 text-[13px] font-extrabold text-slate-700">{selected.source}</div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400">رقم الهاتف</div>
                <div className="mt-0.5 text-[13px] font-extrabold text-slate-700" dir="ltr">
                  {selected.phone ? `${selected.phone} ✦` : "— لم يُعطِ رقمه بعد"}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400">موافقة التواصل</div>
                <div className={`mt-0.5 flex items-center gap-1 text-[13px] font-extrabold ${selected.consent ? "text-emerald-600" : "text-slate-400"}`}>
                  {selected.consent ? <><ShieldCheck className="h-4 w-4" /> موافقة صريحة</> : "بانتظار الموافقة"}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400">آخر نشاط</div>
                <div className="mt-0.5 text-[13px] font-extrabold text-slate-700">{relTime(selected.lastActivityAt)}</div>
              </div>
            </div>

            {/* الوسوم */}
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[13px] font-extrabold text-slate-700">
                <Tag className="h-3.5 w-3.5 text-violet-500" />
                الوسوم
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {selected.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-extrabold text-violet-700">
                    {t}
                    <button onClick={() => removeTag(t)} className="text-violet-300 hover:text-rose-500" aria-label={`حذف ${t}`}>×</button>
                  </span>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTag()}
                    placeholder="وسم جديد…"
                    className="w-28 rounded-lg border border-dashed border-slate-300 px-2 py-1 text-[11px] outline-none focus:border-violet-400"
                  />
                </div>
              </div>
            </div>

            <Field label="الحالة">
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(STATUS_META) as LeadStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-extrabold transition ${
                      status === s ? `${STATUS_META[s].cls} ring-2 ring-offset-1 ring-violet-400` : "border border-slate-200 text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {STATUS_META[s].label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="ملاحظات داخلية">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="ماذا طلب العميل؟ ما آخر اتفاق؟…"
                className={inputCls}
              />
            </Field>

            <div className="flex items-center justify-between">
              <Btn
                variant="danger"
                onClick={async () => {
                  await fetch(`/api/leads/${selected.id}`, { method: "DELETE" });
                  setSelected(null);
                  refresh();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                حذف العميل
              </Btn>
              <Btn onClick={save} disabled={saving}>
                <Save className="h-3.5 w-3.5" />
                {saving ? "جارٍ الحفظ…" : "حفظ التغييرات"}
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
