import { NextRequest, NextResponse } from "next/server";
import { simInboundMessage, simMention, simNewLead } from "@/lib/simulate";

export const dynamic = "force-dynamic";

// توليد نشاط تجريبي يدوي — للعرض الحي قبل ربط المنصات الرسمية
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const type = body?.type ?? "auto";
  switch (type) {
    case "lead":
      simNewLead();
      break;
    case "message":
      simInboundMessage(body?.conversationId);
      break;
    case "mention":
      simMention();
      break;
    default: {
      const r = Math.random();
      if (r < 0.4) simNewLead();
      else if (r < 0.8) simInboundMessage();
      else simMention();
    }
  }
  return NextResponse.json({ ok: true });
}
