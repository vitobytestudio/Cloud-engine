import { NextRequest, NextResponse } from "next/server";
import { db, persist } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const d = db();
  const leads = [...d.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ leads, total: leads.length });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });

  const d = db();
  const lead: Lead = {
    id: uid(),
    name: String(body.name).slice(0, 80),
    handle: String(body.handle ?? "").slice(0, 60),
    platform: body.platform ?? "instagram",
    phone: body.phone ? String(body.phone).slice(0, 30) : undefined,
    email: body.email ? String(body.email).slice(0, 80) : undefined,
    source: String(body.source ?? "إضافة يدوية"),
    status: body.status ?? "new",
    tags: Array.isArray(body.tags) ? body.tags.slice(0, 8).map(String) : [],
    score: Number(body.score ?? 50),
    consent: Boolean(body.consent),
    notes: body.notes ? String(body.notes).slice(0, 500) : undefined,
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  };
  d.leads.unshift(lead);
  d.activity.unshift({
    id: uid(),
    type: "lead",
    text: `عميل جديد — ${lead.name} (${lead.source})`,
    platform: lead.platform,
    createdAt: new Date().toISOString(),
  });
  persist();
  return NextResponse.json(lead, { status: 201 });
}
