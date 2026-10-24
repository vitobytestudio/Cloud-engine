"use client";

import { useState } from "react";
import { Send, Plus, Eye, MailCheck, MessageSquare, Reply } from "lucide-react";
import { useJson } from "@/lib/hooks";
import { Btn, Empty, Field, inputCls, Modal, PageHeader } from "@/components/ui";
import { relTime } from "@/lib/utils";
import type { Campaign } from "@/lib/types";

interface Data {
  campaigns: Campaign[];
  tags: string[];
}

const STATUS_CLS: Record<string, { label: string; cls: string }> = {
  draft: { label: "مسودة", cls: "bg-slate-100 text-slate-500" },
  scheduled: { label: "مجدولة", cls: "bg-sky-100 text-sky-600" },
  sending: { label: "تُرسل الآن…", cls: "bg-amber-100 text-amber-600" },
  sent: { label: "أُرسلت ✓", cls: "bg-emerald-100 text-emerald-600" },
};

export default function CampaignsPage() {
  const { data, refresh } = useJson<Data>("/api/campaigns", 3000);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", template: "", audienceTag: "", startNow: true });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name.trim() || !form.template.trim()) return;
    setSaving(true);
    await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setModal(false);
    setForm({ name: "", template: "", audienceTag: "", startNow: true });
    refresh();
  };

  const campaigns = data?.campaigns ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="حملات واتساب"
        sub="عروضك تصل صندوق عملائك مباشرة — عبر WhatsApp Business الرسمي ولمستلمين وافقتوا فقط"
        actions={
          <Btn onClick={() => setModal(true)}>
            <Plus className="h-4 w-4" />
            حملة جديدة
          </Btn>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {campaigns.map((c) => (
          <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Send className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-[14px] font-extrabold text-slate-900">{c.name}</div>
                  <div className="text-[11px] font-semibold text-slate-400">
                    {c.audienceTag ? `الجمهور: «${c.audienceTag}»` : "كل العملاء الموافقين"} · {relTime(c.createdAt)}
                  </div>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${STATUS_CLS[c.status].cls}`}>
                {STATUS_CLS[c.status].label}
              </span>
            </div>

            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-[12px] leading-6 text-slate-600">{c.template}</p>

            {c.targeted > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[
                  { icon: Send, label: "أُرسلت", v: c.sent, of: c.targeted, color: "text-violet-600" },
                  { icon: Eye, label: "وصلت", v: c.delivered, of: c.targeted, color: "text-sky-600" },
                  { icon: MailCheck, label: "قُرئت", v: c.read, of: c.targeted, color: "text-emerald-600" },
                  { icon: Reply, label: "ردّوا", v: c.replied, of: c.targeted, color: "text-amber-600" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-slate-50 p-2.5 text-center">
                    <s.icon className={`mx-auto h-4 w-4 ${s.color}`} />
                    <div className="mt-1 text-[15px] font-black text-slate-900">{s.v}</div>
                    <div className="text-[10px] font-bold text-slate-400">
                      {s.label} ({Math.round((s.v / Math.max(s.of, 1)) * 100)}٪)
                    </div>
                    {c.status === "sending" && s.v > 0 && s.v < s.of && (
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${(s.v / s.of) * 100}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {c.status === "draft" && (
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                <MessageSquare className="h-3.5 w-3.5" />
                أضف وسوم لعملائك ثم أرسل — القوالب تُعتمد رسمياً في واتساب قبل الإرسال.
              </div>
            )}
          </div>
        ))}
      </div>

      {!campaigns.length && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Empty icon={<Send className="h-8 w-8" />} title="لا حملات بعد" sub="أنشئ أول حملة واتساب لعروضك — تصّل عملاءك مباشرة." />
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="حملة واتساب جديدة">
        <div className="space-y-4">
          <Field label="اسم الحملة">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: عرض الجمعة البيضاء" className={inputCls} />
          </Field>
          <Field label="الجمهور المستهدف" hint="يُستثنى تلقائياً من لم يوافق على التواصل">
            <select value={form.audienceTag} onChange={(e) => setForm({ ...form, audienceTag: e.target.value })} className={inputCls}>
              <option value="">كل العملاء الموافقين</option>
              {(data?.tags ?? []).map((t) => (
                <option key={t} value={t}>وسم: {t}</option>
              ))}
            </select>
          </Field>
          <Field label="قالب الرسالة" hint="المتغيرات: {{الاسم}} و{{الرابط}} — تُرسل فقط بقوالب معتمدة من واتساب">
            <textarea
              value={form.template}
              onChange={(e) => setForm({ ...form, template: e.target.value })}
              rows={4}
              placeholder="مرحباً {{الاسم}} 👋 عرض خاص لك هذا الأسبوع…"
              className={inputCls}
            />
          </Field>
          <label className="flex items-center gap-2.5 rounded-xl bg-violet-50 p-3">
            <input type="checkbox" checked={form.startNow} onChange={(e) => setForm({ ...form, startNow: e.target.checked })} className="h-4 w-4 accent-violet-600" />
            <span className="text-[12.5px] font-extrabold text-violet-700">ابدأ الإرسال فوراً</span>
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="ghost" onClick={() => setModal(false)}>إلغاء</Btn>
            <Btn onClick={save} disabled={saving}>
              <Send className="h-3.5 w-3.5 -scale-x-100" />
              {saving ? "جارٍ الإنشاء…" : "إنشاء الحملة"}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
