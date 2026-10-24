"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#product", label: "المنتج" },
  { href: "#how", label: "كيف يعمل" },
  { href: "#trust", label: "الأمان والامتثال" },
  { href: "#pricing", label: "الأسعار" },
];

export default function NavMobile() {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-300"
        aria-label="القائمة"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="pop-in absolute inset-x-3 top-[calc(100%+8px)] rounded-2xl border border-white/10 bg-[#0a0a14]/95 p-3 shadow-2xl shadow-black/60 backdrop-blur-xl">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-[13.5px] font-bold text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
            >
              {l.label}
            </a>
          ))}
          <div className="hairline my-2" />
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="block rounded-xl bg-white px-4 py-3 text-center text-[13.5px] font-black text-[#06060b]"
          >
            افتح اللوحة
          </Link>
        </div>
      )}
    </div>
  );
}
