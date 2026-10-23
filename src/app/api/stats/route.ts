import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";
import { autoSimulate } from "@/lib/simulate";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // الوضع الحي: فرصة لمحاكاة حدث وارد جديد في كل استقصاء
  if (req.nextUrl.searchParams.get("live") === "1" && Math.random() < 0.22) {
    autoSimulate();
  }

  const d = db();
  const startOfDay = new Date().setHours(0, 0, 0, 0);

  const newToday = d.leads.filter((l) => new Date(l.createdAt).getTime() >= startOfDay).length;
  const activeConvs = d.conversations.filter(
    (c) => c.unread > 0 || new Date(c.lastMessageAt).getTime() > Date.now() - 24 * 3600 * 1000
  ).length;
  const activeAutomations = d.automations.filter((a) => a.active).length;
  const customers = d.leads.filter((l) => l.status === "customer").length;
  const conversionRate = d.leads.length ? Math.round((customers / d.leads.length) * 100) : 0;

  // عملاء آخر 14 يوماً
  const days: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - i);
    const to = from.getTime() + 24 * 3600 * 1000;
    days.push(d.leads.filter((l) => {
      const t = new Date(l.createdAt).getTime();
      return t >= from.getTime() && t < to;
    }).length);
  }

  const platformOrder = ["instagram", "whatsapp", "facebook", "tiktok", "x"] as const;
  const platformColors: Record<string, string> = {
    instagram: "#db2777",
    whatsapp: "#059669",
    facebook: "#2563eb",
    tiktok: "#0f172a",
    x: "#475569",
  };
  const donut = platformOrder
    .map((p) => ({
      label: { instagram: "إنستغرام", whatsapp: "واتساب", facebook: "فيسبوك", tiktok: "تيك توك", x: "إكس" }[p],
      value: d.leads.filter((l) => l.platform === p).length,
      color: platformColors[p],
    }))
    .filter((s) => s.value > 0);

  const recentLeads = [...d.leads]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return NextResponse.json({
    workspace: d.workspace,
    cards: {
      newToday,
      activeConvs,
      activeAutomations,
      conversionRate,
      totalLeads: d.leads.length,
      unread: d.conversations.reduce((a, c) => a + c.unread, 0),
    },
    spark: days,
    donut,
    recentLeads,
    activity: [...d.activity].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12),
  });
}
