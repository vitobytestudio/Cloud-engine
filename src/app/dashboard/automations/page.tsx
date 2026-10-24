"use client";

import { useState } from "react";
import { Zap, Plus, Pencil, Trash2, MousePointerClick, UserPlus } from "lucide-react";
import { useJson } from "@/lib/hooks";
import { Btn, Empty, Field, inputCls, Modal, PageHeader, PlatformIcon, Toggle } from "@/components/ui";
import { PLATFORM_META, TRIGGER_LABEL, relTime } from "@/lib/utils";
import type { Automation, AutomationTrigger, Platform } from "@/lib/types";

const EMPTY_FORM = {
  name: "",
  platform: "instagram" as Platform,
  trigger: "comment_keyword" as AutomationTrigger,
  keyword: "",
  replyTemplate: "",
  ctaLink: "",
  collectPhone: true,
};

export default function AutomationsPage() {
  const { data, refresh } = useJson<{ automations: Automation[] }>("/api/automations", 6000);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModal(true);
  };

  const openEdit = (a: Automation) => {
    setEditing(a);
    setForm({
      name: a.name,
      platform: a.platform,
      trigger: a.trigger,
      keyword: a.keyword,
      replyTemplate: a.replyTemplate,
      ctaLink: a.ctaLink ?? "",
      collectPhone: a.collectPhone,
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.keyword.trim() || !form.replyTemplate.trim()) return;
    setSaving(true);
    if (editing) {
      await fetch(`/api/automations/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setSaving(false);
    setModal(false);
    refresh();
  };

  const toggle = async (a: Automation, active: boolean) => {
    await fetch(`/api/automations/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    refresh();
  };

  const remove = async (a: Automation) => {
    await fetch(`/api/automations/${a.id}`, { method: "DELETE" });
    refresh();
  };

  const automations = data?.automations ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="الأتمتة"
        sub="ردود فورية على التعليقات والرسائل — تعمل 24/7 وتجمع بيانات العميل تلقائياً"
        actions={
          <Btn onClick={openNew}>
            <Plus className="h-4 w-4" />
            أتمتة جديدة
          </Btn>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {automations.map((a) => (
          <div
            key={a.id}
            className={`rounded-2xl border bg-white p-5 shadow-sm transition ${a.active ? "border-slate-200" : "border-slate-200 opacity-70"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${PLATFORM_META[a.platform].solid}`}>
                  <PlatformIcon p={a.platform} className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-[14px] font-extrabold text-slate-900">{a.name}</div>
                  <div className="text-[11px] font-semibold text-slate-400">
                    {PLATFORM_META[a.platform].label} · {TRIGGER_LABEL[a.trigger]}
                  </div>
                </div>
              </div>
              <Toggle on={a.active} onChange={(v) => toggle(a, v)} />
            </div>

            <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3.5">
              <div className="flex items-center gap-2 text-[12px]">
                <span className="rounded-lg bg-violet-100 px-2 py-0.5 font-black text-violet-700">«{a.keyword}»</span>
                <span className="text-slate-400">← يفعل الرد تلقائياً</span>
              </div>
              <p className="text-[12px] leading-6 text-slate-600">{a.replyTemplate}</p>
              {a.ctaLink && <p className="truncate text-[11px] font-bold text-sky-600" dir="ltr">{a.ctaLink}</p>}
              {a.collectPhone && (
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-extrabold text-emerald-600">
                  <UserPlus className="h-3 w-3" />
                  يجمع رقم العميل بموافقته
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-4 text-[11px] font-extrabold text-slate-500">
                <span className="flex items-center gap-1">
                  <MousePointerClick className="h-3.5 w-3.5 text-amber-500" />
                  {a.triggeredCount} تشغيل
                </span>
                <span className="flex items-center gap-1">
                  <UserPlus className="h-3.5 w-3.5 text-emerald-500" />
                  {a.leadsCaptured} عميل
                </span>
                <span className="text-slate-300">{relTime(a.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(a)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-violet-600" aria-label="تعديل">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove(a)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500" aria-label="حذف">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!automations.length && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Empty icon={<Zap className="h-8 w-8" />} title="لا أتمتات بعد" sub="أنشئ أول أتمتة: عندما يعلّق عميل بكلمة «سعر» يصله ردك فوراً." />
        </div>
      )}

      {/* نافذة الإنشاء/التعديل */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "تعديل الأتمتة" : "أتمتة جديدة"}>
        <div className="space-y-4">
          <Field label="اسم الأتمتة">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: رد فوري على كلمة «سعر»" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="المنصة">
              <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as Platform })} className={inputCls}>
                {(Object.keys(PLATFORM_META) as Platform[]).map((p) => (
                  <option key={p} value={p}>{PLATFORM_META[p].label}</option>
                ))}
              </select>
            </Field>
            <Field label="نوع التفعيل">
              <select value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value as AutomationTrigger })} className={inputCls}>
                {(Object.keys(TRIGGER_LABEL) as AutomationTrigger[]).map((t) => (
                  <option key={t} value={t}>{TRIGGER_LABEL[t]}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="الكلمة المفتاحية" hint="إذا احتوى التعليق على هذه الكلمة يعمل الرد فوراً">
            <input value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} placeholder="سعر" className={inputCls} />
          </Field>
          <Field label="قالب الرد التلقائي" hint="المتغيرات المتاحة: {{الاسم}} و{{الرابط}}">
            <textarea value={form.replyTemplate} onChange={(e) => setForm({ ...form, replyTemplate: e.target.value })} rows={4} placeholder="هلا بيك {{الاسم}} 🌸 نبعثلك الكاتالوغ الكامل؟" className={inputCls} />
          </Field>
          <Field label="رابط داخل الرد (اختياري)">
            <input value={form.ctaLink} onChange={(e) => setForm({ ...form, ctaLink: e.target.value })} placeholder="https://…" dir="ltr" className={`${inputCls} text-left`} />
          </Field>
          <label className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-3">
            <input type="checkbox" checked={form.collectPhone} onChange={(e) => setForm({ ...form, collectPhone: e.target.checked })} className="h-4 w-4 accent-emerald-600" />
            <span className="text-[12.5px] font-extrabold text-emerald-700">يطلب رقم العميل بعد الرد — ويُحفظ بموافقته</span>
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="ghost" onClick={() => setModal(false)}>إلغاء</Btn>
            <Btn onClick={save} disabled={saving}>
              <Zap className="h-3.5 w-3.5" />
              {saving ? "جارٍ الحفظ…" : editing ? "حفظ التعديلات" : "تفعيل الأتمتة"}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
