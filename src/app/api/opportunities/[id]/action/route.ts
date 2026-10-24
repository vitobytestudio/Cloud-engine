import { NextRequest, NextResponse } from "next/server";
import { db, persist } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { Lead, OpportunityStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED: OpportunityStatus[] = ["new", "saved", "contacted", "won", "ignored"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const action = String(body?.action ?? "");
  const d = db();
  const o = d.opportunities.find((x) => x.id === id);
  if (!o) return NextResponse.json({ error: "غير موجودة" }, { status: 404 });

  if (action === "status" && ALLOWED.includes(body?.status)) {
    o.status = body.status as OpportunityStatus;
    persist();
    return NextResponse.json(o);
  }

  // تحويل الفرصة إلى عميل في CRM — بالبيانات العامة فقط + رابط المصدر
  if (action === "to-lead") {
    if (o.status === "contacted" || o.status === "won")
      return NextResponse.json({ error: "محولة مسبقاً" }, { status: 409 });

    const basePlatforms = ["instagram", "facebook", "whatsapp", "tiktok", "x"] as const;
    const leadPlatform = (basePlatforms as readonly string[]).includes(o.platform)
      ? (o.platform as Lead["platform"])
      : "facebook";

    const lead: Lead = {
      id: uid(),
      name: o.authorPublic,
      handle: "",
      platform: leadPlatform,
      source: `رصّاد الفرص — «${o.keyword}»`,
      status: "new",
      tags: ["رصّاد", o.keyword],
      score: 70,
      consent: false, // لم تعطِ بياناتها — التواصل عبر المنشور العام أولاً
      notes: `فرصة: ${o.title}\nالمصدر: ${o.sourceUrl}`,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };
    d.leads.unshift(lead);
    o.status = "contacted";
    d.activity.unshift({
      id: uid(),
      type: "lead",
      text: `فرصة تحوّلت لعميل — ${lead.name} (${o.keyword})`,
      createdAt: new Date().toISOString(),
    });
    persist();
    return NextResponse.json({ opportunity: o, lead }, { status: 201 });
  }

  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}
