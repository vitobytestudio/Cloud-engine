"use client";

import { useEffect, useState } from "react";
import {
  Instagram,
  Facebook,
  MessageCircle,
  Music2,
  Twitter,
  X as XIcon,
  Check,
  Copy,
} from "lucide-react";
import type { LeadStatus, Platform, Sentiment } from "@/lib/types";
import { PLATFORM_META, SENTIMENT_META, STATUS_META } from "@/lib/utils";

// ——— أيقونات المنصات ———

export function PlatformIcon({ p, className = "h-4 w-4" }: { p: Platform; className?: string }) {
  switch (p) {
    case "instagram":
      return <Instagram className={className} />;
    case "facebook":
      return <Facebook className={className} />;
    case "whatsapp":
      return <MessageCircle className={className} />;
    case "tiktok":
      return <Music2 className={className} />;
    case "x":
      return <Twitter className={className} />;
  }
}

export function PlatformBadge({ p }: { p: Platform }) {
  const m = PLATFORM_META[p];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${m.bg} ${m.fg} px-2 py-0.5 text-[11px] font-semibold`}>
      <PlatformIcon p={p} className="h-3 w-3" />
      {m.label}
    </span>
  );
}

// ——— شارات ———

export function StatusBadge({ s }: { s: LeadStatus }) {
  const m = STATUS_META[s];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

export function SentimentBadge({ s }: { s: Sentiment }) {
  const m = SENTIMENT_META[s];
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.cls}`}>{m.label}</span>;
}

// ——— بطاقة إحصائية ———

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "violet",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  tone?: "violet" | "emerald" | "sky" | "amber";
}) {
  const tones: Record<string, string> = {
    violet: "bg-violet-100 text-violet-600",
    emerald: "bg-emerald-100 text-emerald-600",
    sky: "bg-sky-100 text-sky-600",
    amber: "bg-amber-100 text-amber-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[13px] font-medium text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900">{value}</div>
          {sub && <div className="mt-1 text-[11px] text-slate-400">{sub}</div>}
        </div>
        <div className={`rounded-xl p-2.5 ${tones[tone]}`}>{icon}</div>
      </div>
    </div>
  );
}

// ——— رأس صفحة اللوحة ———

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// ——— زر ———

export function Btn({
  children,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "soft" | "danger";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const v: Record<string, string> = {
    primary:
      "bg-violet-600 text-white hover:bg-violet-700 shadow-sm shadow-violet-600/20 disabled:opacity-50",
    soft: "bg-violet-50 text-violet-700 hover:bg-violet-100",
    ghost: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-100",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-bold transition ${v[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// ——— مفتاح تبديل ———

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-emerald-500" : "bg-slate-300"}`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "start-[22px]" : "start-0.5"}`}
      />
    </button>
  );
}

// ——— نافذة منبثقة ———

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={`max-h-[92vh] w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"} overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="إغلاق">
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ——— حقول النماذج ———

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

// ——— شريط تقييم الاهتمام ———

export function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-slate-300";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[11px] font-bold text-slate-500">{score}</span>
    </div>
  );
}

// ——— حالة فارغة ———

export function Empty({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">{icon}</div>
      <div className="text-sm font-bold text-slate-600">{title}</div>
      {sub && <div className="max-w-xs text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

// ——— زر النسخ ———

export function CopyBtn({ text, label = "نسخ" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1500);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
        } catch {}
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
    >
      {done ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {done ? "تم النسخ" : label}
    </button>
  );
}

// ——— الرسوم البيانية ———

export function Sparkline({ points, color = "#7c3aed" }: { points: number[]; color?: string }) {
  if (!points.length) return null;
  const max = Math.max(...points, 1);
  const w = 300;
  const h = 80;
  const step = w / Math.max(points.length - 1, 1);
  const coords = points.map((p, i) => `${i * step},${h - (p / max) * (h - 10) - 5}`);
  const area = `M0,${h} L${coords.join(" L")} L${w},${h} Z`;
  return (
    <div dir="ltr">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        <path d={area} fill={color} opacity="0.08" />
        <polyline points={coords.join(" ")} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.length > 0 && (
          <circle
            cx={coords[coords.length - 1].split(",")[0]}
            cy={coords[coords.length - 1].split(",")[1]}
            r="4"
            fill={color}
          />
        )}
      </svg>
    </div>
  );
}

export function Donut({ slices }: { slices: Array<{ label: string; value: number; color: string }> }) {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  let acc = 0;
  const R = 52;
  const C = 2 * Math.PI * R;
  return (
    <div dir="ltr" className="flex items-center justify-center gap-6">
      <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#f1f5f9" strokeWidth="16" />
        {slices.map((s) => {
          const frac = s.value / total;
          const dash = `${frac * C} ${C}`;
          const offset = -acc * C;
          acc += frac;
          return (
            <circle
              key={s.label}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeDasharray={dash}
              strokeDashoffset={offset}
              transform="rotate(-90 70 70)"
              strokeLinecap="butt"
            />
          );
        })}
        <text x="70" y="66" textAnchor="middle" className="fill-slate-900" style={{ fontSize: 22, fontWeight: 800 }}>
          {total}
        </text>
        <text x="70" y="86" textAnchor="middle" className="fill-slate-400" style={{ fontSize: 10 }}>
          عميل
        </text>
      </svg>
      <div className="space-y-2">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-[12px]">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="font-semibold text-slate-600">{s.label}</span>
            <span className="font-extrabold text-slate-900">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
