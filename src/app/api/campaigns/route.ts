import { NextRequest, NextResponse } from "next/server";
import { db, persist } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { Campaign } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const d = db();

  // محاكاة تقدم الحملة المرسلة (في الإنتاج: تقارير Webhook من WhatsApp Business Platform)
  for (const c of d.campaigns) {
    if (c.status !== "sending") continue;
    const step = Math.max(2, Math.round(c.targeted * 0.06));
    c.sent = Math.min(c.targeted, c.sent + step);
    c.delivered = Math.min(c.sent, c.delivered + Math.round(step * 0.94));
    c.read = Math.min(c.delivered, c.read + Math.round(step * 0.75));
    c.replied = Math.min(c.read, c.replied + Math.round(step * 0.12));
    if (c.sent >= c.targeted) c.status = "sent";
  }
  persist();

  const tags = Array.from(new Set(d.leads.flatMap((l) => l.tags)));
  const audienceCount = (tag: string) => d.leads.filter((l) => l.tags.includes(tag)).length;
  return NextResponse.json({ campaigns: [...d.campaigns].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), tags, audienceCount });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.template)
    return NextResponse.json({ error: "الاسم وقالب الرسالة مطلوبان" }, { status: 400 });

  const d = db();
  const tag = String(body.audienceTag ?? "");
  const targeted = tag
    ? d.leads.filter((l) => l.tags.includes(tag) && l.consent).length
    : d.leads.filter((l) => l.consent).length;

  const c: Campaign = {
    id: uid(),
    name: String(body.name).slice(0, 80),
    channel: "whatsapp",
    template: String(body.template).slice(0, 800),
    audienceTag: tag,
    status: body.startNow ? "sending" : "draft",
    targeted,
    sent: 0,
    delivered: 0,
    read: 0,
    replied: 0,
    createdAt: new Date().toISOString(),
  };
  d.campaigns.unshift(c);
  if (body.startNow) {
    d.activity.unshift({
      id: uid(),
      type: "campaign",
      text: `انطلقت حملة «${c.name}» — ${targeted} مستلم بموافقتهم`,
      platform: "whatsapp",
      createdAt: new Date().toISOString(),
    });
  }
  persist();
  return NextResponse.json(c, { status: 201 });
}
