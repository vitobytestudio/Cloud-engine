"use client";

import { useEffect, useRef, useState } from "react";

// ——— نظام الظهور التدريجي عند التمرير (مؤسسي، بلا مكتبات خارجية) ———

export function Reveal({
  children,
  delay = 0,
  y = 26,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "none" : `translateY(${y}px)`,
        transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

// ——— عدّاد متحرك يعمل عند الظهور ———

export function Counter({
  to,
  suffix = "",
  prefix = "",
  duration = 1600,
  className = "",
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const tick = (t: number) => {
            const p = Math.min((t - t0) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 4);
            setVal(Math.round(to * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`} dir="ltr">
      {prefix}
      {val.toLocaleString("en")}
      {suffix}
    </span>
  );
}

// ——— عنوان قسم موحّد ———

export function SectionHead({
  overline,
  title,
  sub,
  center = true,
}: {
  overline: string;
  title: React.ReactNode;
  sub?: string;
  center?: boolean;
}) {
  return (
    <div className={`mb-14 ${center ? "text-center" : ""}`}>
      <Reveal>
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.07] px-3.5 py-1.5 text-[12px] font-extrabold tracking-wide text-violet-300">
          <span className="h-1 w-1 rounded-full bg-violet-400" />
          {overline}
        </span>
      </Reveal>
      <Reveal delay={90}>
        <h2 className="mt-5 text-3xl font-black leading-[1.35] text-white md:text-[44px] md:leading-[1.3]">
          {title}
        </h2>
      </Reveal>
      {sub && (
        <Reveal delay={180}>
          <p className={`mt-4 text-[15px] leading-8 text-slate-400 ${center ? "mx-auto max-w-2xl" : ""}`}>
            {sub}
          </p>
        </Reveal>
      )}
    </div>
  );
}
