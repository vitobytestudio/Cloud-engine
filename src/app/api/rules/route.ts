import { NextRequest, NextResponse } from "next/server";
import { db, persist } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { ListenRule, Platform } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ rules: db().rules });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const keyword = String(body?.keyword ?? "").trim();
  if (!keyword) return NextResponse.json({ error: "الكلمة المفتاحية مطلوبة" }, { status: 400 });

  const rule: ListenRule = {
    id: uid(),
    keyword: keyword.slice(0, 40),
    platforms: (Array.isArray(body.platforms) && body.platforms.length
      ? body.platforms
      : ["instagram", "facebook"]) as Platform[],
    active: true,
    matchesCount: 0,
    createdAt: new Date().toISOString(),
  };
  db().rules.unshift(rule);
  persist();
  return NextResponse.json(rule, { status: 201 });
}
