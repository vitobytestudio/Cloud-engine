import { NextRequest, NextResponse } from "next/server";
import { db, persist } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { Automation } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ automations: db().automations });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.keyword || !body?.replyTemplate)
    return NextResponse.json({ error: "الاسم والكلمة المفتاحية وقالب الرد مطلوبة" }, { status: 400 });

  const a: Automation = {
    id: uid(),
    name: String(body.name).slice(0, 80),
    platform: body.platform ?? "instagram",
    trigger: body.trigger ?? "comment_keyword",
    keyword: String(body.keyword).slice(0, 40),
    replyTemplate: String(body.replyTemplate).slice(0, 600),
    ctaLink: body.ctaLink ? String(body.ctaLink).slice(0, 200) : undefined,
    collectPhone: Boolean(body.collectPhone),
    active: true,
    triggeredCount: 0,
    leadsCaptured: 0,
    createdAt: new Date().toISOString(),
  };
  db().automations.unshift(a);
  db().activity.unshift({
    id: uid(),
    type: "automation",
    text: `تم إنشاء أتمتة جديدة «${a.name}»`,
    platform: a.platform,
    createdAt: new Date().toISOString(),
  });
  persist();
  return NextResponse.json(a, { status: 201 });
}
