import { NextRequest, NextResponse } from "next/server";
import { db, persist } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const rule = db().rules.find((r) => r.id === id);
  if (!rule) return NextResponse.json({ error: "غير موجودة" }, { status: 404 });
  if (typeof body?.active === "boolean") rule.active = body.active;
  persist();
  return NextResponse.json(rule);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = db();
  const before = d.rules.length;
  d.rules = d.rules.filter((r) => r.id !== id);
  if (d.rules.length === before) return NextResponse.json({ error: "غير موجودة" }, { status: 404 });
  persist();
  return NextResponse.json({ ok: true });
}
