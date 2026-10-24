import { NextRequest, NextResponse } from "next/server";
import { db, persist } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });

  const d = db();
  const a = d.automations.find((x) => x.id === id);
  if (!a) return NextResponse.json({ error: "غير موجودة" }, { status: 404 });

  if (typeof body.active === "boolean") a.active = body.active;
  if (typeof body.name === "string") a.name = body.name.slice(0, 80);
  if (typeof body.keyword === "string") a.keyword = body.keyword.slice(0, 40);
  if (typeof body.replyTemplate === "string") a.replyTemplate = body.replyTemplate.slice(0, 600);
  if (typeof body.ctaLink === "string") a.ctaLink = body.ctaLink.slice(0, 200) || undefined;
  if (typeof body.collectPhone === "boolean") a.collectPhone = body.collectPhone;
  if (typeof body.platform === "string") a.platform = body.platform as typeof a.platform;
  if (typeof body.trigger === "string") a.trigger = body.trigger as typeof a.trigger;

  persist();
  return NextResponse.json(a);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = db();
  const before = d.automations.length;
  d.automations = d.automations.filter((a) => a.id !== id);
  if (d.automations.length === before) return NextResponse.json({ error: "غير موجودة" }, { status: 404 });
  persist();
  return NextResponse.json({ ok: true });
}
