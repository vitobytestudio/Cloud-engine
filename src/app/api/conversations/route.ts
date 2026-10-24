import { NextResponse } from "next/server";
import { db } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const d = db();
  const convs = [...d.conversations]
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
    .map((c) => ({
      ...c,
      lead: d.leads.find((l) => l.id === c.leadId) ?? null,
    }));
  return NextResponse.json({ conversations: convs });
}
