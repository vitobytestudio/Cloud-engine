"use client";

import { useState } from "react";
import Link from "next/link";
import { FileDown, Plus, ExternalLink, Trash2, Eye, Target, Globe } from "lucide-react";
import { useJson } from "@/lib/hooks";
import { Btn, CopyBtn, Empty, Field, inputCls, Modal, PageHeader, Toggle } from "@/components/ui";
import { relTime } from "@/lib/utils";
import type { CapturePage } from "@/lib/types";

export default function CapturePagesPage() {
  const { data, refresh } = useJson<{ pages: CapturePage[] }>("/api/capture-pages", 6000);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    headline: "",
    subtext: "",
    offer: "",
    ctaLabel: "أرسل بياناتي",
    askPhone: true,
    askEmail: false,
    published: true,
  });
  const [saving, setSaving] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const save = async () => {
    if (!form.title.trim() || !form.headline.trim()) return;
    setSaving(true);
    await fetch("/api/capture-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setModal(false);
    setForm({ title: "", headline: "", subtext: "", offer: "", ctaLabel: "أرسل بياناتي", askPhone: true, askEmail: false, published: true });
    refresh();
  };

  const togglePub = async (p: CapturePage, published: boolean) => {
    await fetch(`/api/capture-pages/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published }),
    });
    refresh();
  };

  const remove = async (p: CapturePage) => {
    await fetch(`/api/capture-pages/${p.id}`, { method: "DELETE" });
    refresh();
  };

  const pages = data?.pages ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="صفحات الالتقاط"
        sub="رابط واحد يجمع بيانات الزبون بموافقته — وتظهر في لوحتك لحظياً"
        actions={
          <Btn onClick={() => setModal(true)}>
            <Plus className="h-4 w-4" />
            صفحة جديدة
          </Btn>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {pages.map((p) => {
          const rate = p.views ? Math.round((p.conversions / p.views) * 100) : 0;
          return (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                    <FileDown className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-[14px] font-extrabold text-slate-900">{p.title}</div>
                    <div className="text-[11px] font-semibold text-slate-400">{relTime(p.createdAt)}</div>
                  </div>
                </div>
                <Toggle on={p.published} onChange={(v) => togglePub(p, v)} />
              </div>

              <div className="mt-3 truncate rounded-xl bg-slate-50 px-3 py-2.5 text-[12px] font-bold text-slate-500" dir="ltr">
                {origin}/p/{p.slug}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                  <Eye className="mx-auto h-4 w-4 text-sky-500" />
                  <div className="mt-1 text-[15px] font-black text-slate-900">{p.views}</div>
                  <div className="text-[10px] font-bold text-slate-400">مشاهدة</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                  <Target className="mx-auto h-4 w-4 text-emerald-500" />
                  <div className="mt-1 text-[15px] font-black text-slate-900">{p.conversions}</div>
                  <div className="text-[10px] font-bold text-slate-400">تحويل</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                  <Globe className="mx-auto h-4 w-4 text-violet-500" />
                  <div className="mt-1 text-[15px] font-black text-slate-900">{rate}٪</div>
                  <div className="text-[10px] font-bold text-slate-400">نسبة التحويل</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CopyBtn text={`${origin}/p/${p.slug}`} label="نسخ الرابط" />
                  <Link href={`/p/${p.slug}`} target="_blank">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50">
                      <ExternalLink className="h-3 w-3" />
                      فتح
                    </span>
                  </Link>
                </div>
                <button onClick={() => remove(p)} className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500" aria-label="حذف">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!pages.length && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Empty icon={<FileDown className="h-8 w-8" />} title="لا صفحات بعد" sub="أنشئ صفحة التقاط لعرضك — وشاركها في البايو والستوري والإعلانات." />
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="صفحة التقاط جديدة">
        <div className="space-y-4">
          <Field label="عنوان الصفحة (داخلي)">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="عرض الصالونات الجديدة" className={inputCls} />
          </Field>
          <Field label="العنوان الرئيسي الظاهر">
            <input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="جهّز صالونك ووفّر 20٪" className={inputCls} />
          </Field>
          <Field label="الوصف">
            <textarea value={form.subtext} onChange={(e) => setForm({ ...form, subtext: e.target.value })} rows={3} placeholder="اشرح العرض بوضوح ووجاذبية…" className={inputCls} />
          </Field>
          <Field label="شريط العرض (اختياري)">
            <input value={form.offer} onChange={(e) => setForm({ ...form, offer: e.target.value })} placeholder="خصم 20٪ + توصيل مجاني" className={inputCls} />
          </Field>
          <Field label="نص زر الإرسال">
            <input value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} className={inputCls} />
          </Field>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[12px] font-extrabold text-slate-600">
              <input type="checkbox" checked={form.askPhone} onChange={(e) => setForm({ ...form, askPhone: e.target.checked })} className="h-4 w-4 accent-violet-600" />
              أطلب رقم الهاتف
            </label>
            <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[12px] font-extrabold text-slate-600">
              <input type="checkbox" checked={form.askEmail} onChange={(e) => setForm({ ...form, askEmail: e.target.checked })} className="h-4 w-4 accent-violet-600" />
              أطلب البريد الإلكتروني
            </label>
            <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[12px] font-extrabold text-slate-600">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-4 w-4 accent-violet-600" />
              منشورة فوراً
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="ghost" onClick={() => setModal(false)}>إلغاء</Btn>
            <Btn onClick={save} disabled={saving}>
              <Plus className="h-3.5 w-3.5" />
              {saving ? "جارٍ الإنشاء…" : "إنشاء الصفحة"}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
