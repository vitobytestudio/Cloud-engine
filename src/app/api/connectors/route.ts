import { NextRequest, NextResponse } from "next/server";
import { db, persist } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ connectors: db().connectors });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const conn = db().connectors.find((c) => c.id === body?.id);
  if (!conn) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (typeof body.active === "boolean") {
    conn.active = body.active;
    if (conn.active) conn.lastFetchedAt = new Date().toISOString();
  }
  persist();
  return NextResponse.json(conn);
}
