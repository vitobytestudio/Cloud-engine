import { NextRequest, NextResponse } from "next/server";
import { db, persist } from "@/lib/store";
import type { LeadStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });

  const d = db();
  const lead = d.leads.find((l) => l.id === id);
  if (!lead) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  if (typeof body.status === "string") lead.status = body.status as LeadStatus;
  if (typeof body.notes === "string") lead.notes = body.notes.slice(0, 500);
  if (Array.isArray(body.tags)) lead.tags = body.tags.slice(0, 8).map(String);
  if (typeof body.phone === "string") {
    lead.phone = body.phone.slice(0, 30) || undefined;
    if (lead.phone) lead.consent = true;
  }
  if (typeof body.score === "number") lead.score = Math.max(0, Math.min(100, body.score));
  lead.lastActivityAt = new Date().toISOString();

  persist();
  return NextResponse.json(lead);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = db();
  const before = d.leads.length;
  d.leads = d.leads.filter((l) => l.id !== id);
  if (d.leads.length === before) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  persist();
  return NextResponse.json({ ok: true });
}
