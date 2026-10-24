"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Code2, PenTool, Layers, Clapperboard, Film, PenLine, Camera, Share2, Globe,
  ArrowLeft, Check, Loader2, MapPin, BellRing, Sparkles,
} from "lucide-react";
import { useJson } from "@/lib/hooks";
import { Btn, inputCls } from "@/components/ui";
import type { RadarProfile } from "@/lib/types";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  code: Code2, pen: PenTool, layers: Layers, video: Clapperboard,
  film: Film, text: PenLine, camera: Camera, share: Share2, globe: Globe,
};

interface Data {
  profile: RadarProfile;
  professions: Array<{ id: string; label: string; icon: string }>;
  wilayas: string[];
}

export default function Onboarding() {
  const router = useRouter();
  const { data } = useJson<Data>("/api/profile");
  const [step, setStep] = useState(1);
  const [professionId, setProfessionId] = useState("");
  const [customKw, setCustomKw] = useState<string[]>([]);
  const [kwInput, setKwInput] = useState("");
  const [wilayas, setWilayas] = useState<string[]>(["كل الولايات"]);
  const [alertChannel, setAlertChannel] = useState<"app" | "whatsapp" | "telegram">("app");
  const [alertPhone, setAlertPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const professionLabel = useMemo(
    () => data?.professions.find((p) => p.id === professionId)?.label ?? "",
    [data, professionId]
  );

  const toggleWilaya = (w: string) => {
    setWilayas((prev) => {
      if (w === "كل الولايات") return prev.includes(w) ? [] : ["كل الولايات"];
      const next = prev.filter((x) => x !== "كل الولايات");
      return next.includes(w) ? next.filter((x) => x !== w) : [...next, w];
    });
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ professionId, keywords: customKw, wilayas, alertChannel, alertPhone }),
    });
    router.push("/dashboard/radar?activated=1");
  };

  const steps = ["التخصص", "كلمات الرصد", "نطاق العمل والتنبيه"];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06060b] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="aurora-a absolute -top-40 start-[20%] h-[380px] w-[560px] rounded-full bg-violet-600/[0.14] blur-[120px]" />
        <div className="absolute inset-0 grid-overlay" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-10">
        {/* الترويسة */}
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-600/40">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M2.4 11.1 20.8 3.2c.8-.34 1.6.44 1.3 1.26l-6 16.9c-.3.86-1.5.9-1.9.06l-2.6-5.8a1.4 1.4 0 0 0-.6-.64l-5.9-3.2c-.8-.44-.7-1.62.2-1.7Zm7.9 5.4 1.8 3.9 2.6-7.2-4.4 3.3Zm5-4.5 2.4-6.8-10.5 4.6 4.5 2.4c.3.17.55.4.74.7l.36.5 2.5-1.4Z" />
              </svg>
            </div>
            <span className="text-[15px] font-black">تفعيل الرصد التلقائي</span>
          </div>
          <button onClick={() => router.push("/dashboard")} className="text-[12px] font-bold text-slate-400 hover:text-white">
            لاحقاً
          </button>
        </div>

        {/* شريط الخطوات */}
        <div className="mb-10 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-black transition-all duration-500 ${
                  step > i + 1
                    ? "bg-emerald-500 text-white"
                    : step === i + 1
                      ? "bg-white text-[#06060b] shadow-lg shadow-white/20"
                      : "border border-white/10 text-slate-500"
                }`}
              >
                {step > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`hidden text-[12px] font-bold sm:block ${step === i + 1 ? "text-white" : "text-slate-500"}`}>
                {s}
              </span>
              {i < steps.length - 1 && (
                <div className="h-px flex-1 bg-white/10">
                  <div className={`h-px bg-violet-400 transition-all duration-700 ${step > i + 1 ? "w-full" : "w-0"}`} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* الخطوة 1: التخصص */}
        {step === 1 && (
          <div className="pop-in">
            <h1 className="text-2xl font-black md:text-3xl">ما تخصصك؟</h1>
            <p className="mt-2 text-[13.5px] leading-7 text-slate-400">
              اختر مجالك — وسيضبط مِرسال الرصد على طلبات هذا التخصص وحده، لحظة نشرها.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {(data?.professions ?? []).map((p) => {
                const Icon = ICONS[p.icon] ?? Layers;
                const on = professionId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setProfessionId(p.id)}
                    className={`group flex items-center gap-3.5 rounded-2xl border p-4.5 p-4 text-start transition-all duration-300 ${
                      on
                        ? "border-violet-400/50 bg-violet-500/[0.12] shadow-[0_0_40px_-10px] shadow-violet-500/40"
                        : "border-white/[0.07] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                        on ? "bg-violet-500/25 text-violet-200" : "bg-white/[0.06] text-slate-400 group-hover:text-slate-200"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className={`flex-1 text-[13.5px] font-black ${on ? "text-white" : "text-slate-300"}`}>{p.label}</span>
                    {on && <Check className="h-4 w-4 text-violet-300" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex justify-end">
              <Btn onClick={() => setStep(2)} disabled={!professionId} className="!px-6 !py-3">
                متابعة
                <ArrowLeft className="h-4 w-4" />
              </Btn>
            </div>
          </div>
        )}

        {/* الخطوة 2: الكلمات */}
        {step === 2 && (
          <div className="pop-in">
            <h1 className="text-2xl font-black md:text-3xl">كلمات الرصد</h1>
            <p className="mt-2 text-[13.5px] leading-7 text-slate-400">
              ولّدنا لك تلقائياً كل الكلمات التي يكتبها العملاء الحقيقيون (بالمرادفات والدارجة).
              يمكنك إضافة كلمات خاصة بك.
            </p>
            <div className="mt-7 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 text-[12px] font-black text-emerald-300">
                <Sparkles className="h-4 w-4" />
                مولّدة تلقائياً من تخصصك: {professionLabel}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {data?.professions.find((p) => p.id === professionId)?.id &&
                  Array.from({ length: 8 }).map((_, i) => (
                    <span key={i} className="rounded-lg bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold text-slate-400">
                      ● ● ●
                    </span>
                  ))}
              </div>
              <p className="mt-3 text-[11px] font-semibold leading-6 text-slate-500">
                تعمل بصمت في المحرك — لا حاجة لتعديلها. تُحدَّث مع تطور لغة السوق.
              </p>
            </div>
            <div className="mt-5">
              <div className="mb-2 text-[12.5px] font-black text-slate-300">كلمات إضافية خاصة (اختياري)</div>
              <div className="flex gap-2">
                <input
                  value={kwInput}
                  onChange={(e) => setKwInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && kwInput.trim()) {
                      setCustomKw([...new Set([...customKw, kwInput.trim()])]);
                      setKwInput("");
                    }
                  }}
                  placeholder="اكتب كلمة واضغط Enter…"
                  className={inputCls}
                />
              </div>
              {!!customKw.length && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {customKw.map((k) => (
                    <button
                      key={k}
                      onClick={() => setCustomKw(customKw.filter((x) => x !== k))}
                      className="inline-flex items-center gap-1 rounded-lg bg-violet-500/15 px-2.5 py-1 text-[11px] font-black text-violet-200 hover:bg-rose-500/20 hover:text-rose-300"
                    >
                      {k} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-8 flex items-center justify-between">
              <Btn variant="ghost" onClick={() => setStep(1)}>رجوع</Btn>
              <Btn onClick={() => setStep(3)} className="!px-6 !py-3">
                متابعة
                <ArrowLeft className="h-4 w-4" />
              </Btn>
            </div>
          </div>
        )}

        {/* الخطوة 3: الولايات والتنبيه */}
        {step === 3 && (
          <div className="pop-in">
            <h1 className="text-2xl font-black md:text-3xl">نطاق العمل والتنبيه</h1>
            <p className="mt-2 text-[13.5px] leading-7 text-slate-400">آخر خطوة — ثم يعمل النظام عنك تلقائياً 24/7.</p>

            <div className="mt-7">
              <div className="mb-3 flex items-center gap-2 text-[12.5px] font-black text-slate-300">
                <MapPin className="h-4 w-4 text-violet-300" />
                ولايات عملك
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["كل الولايات", "الجزائر", "وهران", "قسنطينة", "سطيف", "عنابة", "بجاية", "البليدة", "تلمسان", "ورقلة"].map((w) => (
                  <button
                    key={w}
                    onClick={() => toggleWilaya(w)}
                    className={`rounded-full px-3.5 py-1.5 text-[12px] font-black transition ${
                      wilayas.includes(w)
                        ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/40"
                        : "border border-white/10 text-slate-400 hover:bg-white/[0.05]"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <div className="mb-3 flex items-center gap-2 text-[12.5px] font-black text-slate-300">
                <BellRing className="h-4 w-4 text-violet-300" />
                كيف تصلك التنبيهات؟
              </div>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {(
                  [
                    { id: "app", label: "داخل المنصة", desc: "فوري — الافتراضي" },
                    { id: "whatsapp", label: "واتساب", desc: "رسالة قصيرة فورية" },
                    { id: "telegram", label: "تيليغرام", desc: "بوت خاص بك" },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setAlertChannel(c.id)}
                    className={`rounded-2xl border p-4 text-start transition ${
                      alertChannel === c.id
                        ? "border-violet-400/50 bg-violet-500/[0.12]"
                        : "border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="text-[13px] font-black">{c.label}</div>
                    <div className="mt-0.5 text-[11px] font-semibold text-slate-500">{c.desc}</div>
                  </button>
                ))}
              </div>
              {alertChannel !== "app" && (
                <input
                  value={alertPhone}
                  onChange={(e) => setAlertPhone(e.target.value)}
                  placeholder={alertChannel === "whatsapp" ? "رقم الواتساب (مثال: 0555 00 00 00)" : "@معرف التيليغرام"}
                  className={`${inputCls} mt-3`}
                />
              )}
              <p className="mt-2 text-[11px] font-semibold leading-6 text-slate-500">
                بالموافقة على التنبيهات الخارجية، توافق أن نرسل لك إشعارات الفرص المطابقة فقط — بلا رسائل ترويجية، ويمكنك الإيقاف متى شئت.
              </p>
            </div>

            <div className="mt-9 flex items-center justify-between">
              <Btn variant="ghost" onClick={() => setStep(2)}>رجوع</Btn>
              <Btn onClick={save} disabled={saving} className="!px-7 !py-3.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {saving ? "جارٍ التفعيل…" : "فعّل الرصد التلقائي"}
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
