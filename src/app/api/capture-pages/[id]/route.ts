import { NextRequest, NextResponse } from "next/server";
import { db, persist } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const page = db().capturePages.find((p) => p.id === id);
  if (!page) return NextResponse.json({ error: "غير موجودة" }, { status: 404 });
  if (typeof body?.published === "boolean") page.published = body.published;
  persist();
  return NextResponse.json(page);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = db();
  const before = d.capturePages.length;
  d.capturePages = d.capturePages.filter((p) => p.id !== id);
  if (d.capturePages.length === before) return NextResponse.json({ error: "غير موجودة" }, { status: 404 });
  persist();
  return NextResponse.json({ ok: true });
}
