"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Users,
  Zap,
  Radar,
  Send,
  FileDown,
  Settings,
  Radio,
} from "lucide-react";
import { useJson, useLive } from "@/lib/hooks";

const NAV = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/dashboard/inbox", label: "الصندوق الموحد", icon: Inbox },
  { href: "/dashboard/leads", label: "العملاء", icon: Users },
  { href: "/dashboard/automations", label: "الأتمتة", icon: Zap },
  { href: "/dashboard/monitoring", label: "المراقبة اللحظية", icon: Radar },
  { href: "/dashboard/campaigns", label: "الحملات", icon: Send },
  { href: "/dashboard/pages", label: "صفحات الالتقاط", icon: FileDown },
  { href: "/dashboard/settings", label: "الإعدادات", icon: Settings },
];

export function Logo({ light }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-600/30">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M2.4 11.1 20.8 3.2c.8-.34 1.6.44 1.3 1.26l-6 16.9c-.3.86-1.5.9-1.9.06l-2.6-5.8a1.4 1.4 0 0 0-.6-.64l-5.9-3.2c-.8-.44-.7-1.62.2-1.7Zm7.9 5.4 1.8 3.9 2.6-7.2-4.4 3.3Zm5-4.5 2.4-6.8-10.5 4.6 4.5 2.4c.3.17.55.4.74.7l.36.5 2.5-1.4Z" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className={`text-lg font-extrabold ${light ? "text-white" : "text-slate-900"}`}>مِرسال</div>
        <div className={`text-[10px] font-semibold ${light ? "text-slate-400" : "text-slate-500"}`}>
          استقطاب العملاء — بلا حظر
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { live, setLive } = useLive();
  const stats = useJson<{ workspace: { name: string } }>("/api/stats", 0);
  const workspaceName = stats.data?.workspace.name ?? "مساحة العمل";

  return (
    <aside className="fixed inset-y-0 start-0 z-40 flex w-[248px] flex-col bg-slate-950 px-3 py-5">
      <div className="px-2 pb-5">
        <Logo light />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-bold transition ${
                active
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 space-y-3 border-t border-slate-800 pt-4">
        <button
          onClick={() => setLive(!live)}
          className="flex w-full items-center justify-between rounded-xl bg-slate-900 px-3 py-2.5 text-[12px] font-bold text-slate-300 hover:bg-slate-800"
        >
          <span className="flex items-center gap-2">
            <Radio className={`h-4 w-4 ${live ? "text-emerald-400" : "text-slate-500"}`} />
            الوضع الحي
          </span>
          <span className="flex items-center gap-1.5">
            {live && <span className="live-dot h-2 w-2 rounded-full bg-emerald-400" />}
            <span className={live ? "text-emerald-400" : "text-slate-500"}>{live ? "مفعّل" : "متوقف"}</span>
          </span>
        </button>

        <div className="flex items-center gap-2.5 rounded-xl bg-slate-900/60 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[12px] font-extrabold text-white">
            {workspaceName.charAt(0)}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[12px] font-bold text-white">{workspaceName}</div>
            <div className="truncate text-[10px] text-slate-500">مساحة عمل تجريبية</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
