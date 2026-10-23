import { NextRequest, NextResponse } from "next/server";
import { db, persist } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { CapturePage } from "@/lib/types";

export const dynamic = "force-dynamic";

function slugify(s: string): string {
  const base = s
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
  return base || `page-${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET() {
  return NextResponse.json({ pages: [...db().capturePages].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.headline)
    return NextResponse.json({ error: "العنوان والعنوان الفرعي مطلوبان" }, { status: 400 });

  const d = db();
  let slug = body.slug ? slugify(String(body.slug)) : slugify(String(body.title));
  if (d.capturePages.some((p) => p.slug === slug)) slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;

  const page: CapturePage = {
    id: uid(),
    slug,
    title: String(body.title).slice(0, 80),
    headline: String(body.headline).slice(0, 120),
    subtext: String(body.subtext ?? "").slice(0, 400),
    offer: body.offer ? String(body.offer).slice(0, 120) : undefined,
    ctaLabel: String(body.ctaLabel ?? "أرسل بياناتي").slice(0, 40),
    askPhone: body.askPhone !== false,
    askEmail: Boolean(body.askEmail),
    published: body.published !== false,
    views: 0,
    conversions: 0,
    createdAt: new Date().toISOString(),
  };
  d.capturePages.unshift(page);
  persist();
  return NextResponse.json(page, { status: 201 });
}
