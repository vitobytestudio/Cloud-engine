"use client";

import { useEffect, useState } from "react";
import { Send, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

export default function CaptureForm({
  slug,
  askPhone,
  askEmail,
  ctaLabel,
}: {
  slug: string;
  askPhone: boolean;
  askEmail: boolean;
  ctaLabel: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  // تسجيل مشاهدة الصفحة
  useEffect(() => {
    fetch(`/api/capture/${encodeURIComponent(slug)}`, { cache: "no-store" }).catch(() => {});
  }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setError("");
    const res = await fetch(`/api/capture/${encodeURIComponent(slug)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, consent }),
    });
    if (res.ok) {
      setState("done");
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "حدث خطأ، حاول مجدداً");
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="pop-in rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
        <div className="mt-4 text-xl font-black">تم استلام بياناتك بنجاح! 🎉</div>
        <p className="mt-2 text-[13px] leading-7 text-slate-300">
          سيتواصل معك فريقنا خلال دقائق إن شاء الله.
          <br />
          ألقِ نظرة على رسائل واتساب الخاصة بك.
        </p>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3.5 text-[14px] text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20";

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="الاسم الكامل *"
        required
        className={inputCls}
      />
      {askPhone && (
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="رقم الهاتف / واتساب"
          dir="ltr"
          inputMode="tel"
          className={`${inputCls} text-right placeholder:text-right`}
        />
      )}
      {askEmail && (
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="البريد الإلكتروني"
          type="email"
          dir="ltr"
          className={`${inputCls} text-right placeholder:text-right`}
        />
      )}

      <label className="flex items-start gap-2.5 rounded-2xl border border-slate-800 bg-slate-900/50 p-3.5">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
          className="mt-0.5 h-4 w-4 accent-violet-500"
        />
        <span className="text-[12px] leading-6 text-slate-400">
          أوافق على أن يتواصل معي الفريق عبر واتساب أو الهاتف بخصوص هذا العرض.
        </span>
      </label>

      {error && <div className="rounded-xl bg-rose-500/10 px-3 py-2 text-[12px] font-bold text-rose-300">{error}</div>}

      <button
        type="submit"
        disabled={state === "sending"}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-500 py-4 text-[15px] font-black shadow-xl shadow-violet-600/40 transition hover:opacity-95 disabled:opacity-60"
      >
        {state === "sending" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4.5 w-4.5 -scale-x-100" />}
        {state === "sending" ? "جارٍ الإرسال…" : ctaLabel}
      </button>

      <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] font-bold text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5" />
        لا رسائل مزعجة — تواصل واحد مفيد فقط
      </div>
    </form>
  );
}
