import { NextResponse } from "next/server";
import { db } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const d = db();
  const mentions = [...d.mentions]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((m) => ({ ...m, rule: d.rules.find((r) => r.id === m.ruleId) ?? null }));
  return NextResponse.json({ mentions, rules: d.rules });
}
