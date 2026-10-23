import { NextRequest, NextResponse } from "next/server";
import { db, persist } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

// تحويل منشور مُراقَب إلى عميل في CRM — بأخذ بياناته العامة + بدء محادثة ترحيبية
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = db();
  const mention = d.mentions.find((m) => m.id === id);
  if (!mention) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (mention.converted) return NextResponse.json({ error: "تم التحويل مسبقاً" }, { status: 409 });

  const rule = d.rules.find((r) => r.id === mention.ruleId);
  const lead: Lead = {
    id: uid(),
    name: mention.authorName,
    handle: mention.authorHandle,
    platform: mention.platform,
    source: `مراقبة «${rule?.keyword ?? "ذكر"}»`,
    status: "new",
    tags: ["من المراقبة"],
    score: 55 + Math.min(20, Math.floor(mention.likes / 50)),
    consent: false,
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  };
  d.leads.unshift(lead);
  mention.converted = true;

  const convId = uid();
  d.conversations.unshift({
    id: convId,
    leadId: lead.id,
    platform: mention.platform,
    unread: 0,
    lastMessageAt: new Date().toISOString(),
    lastMessagePreview: "مرحباً! شفتك تبحث… نقدر نساعدك؟",
  });
  d.messages.push({
    id: uid(),
    conversationId: convId,
    direction: "out",
    body: `مرحباً ${mention.authorName} 👋 شفنا تعليقك وتبحث عن حل — نقدر نساعدك؟ أنا هنا لأي سؤال 🌸`,
    status: "sent",
    createdAt: new Date().toISOString(),
  });

  d.activity.unshift({
    id: uid(),
    type: "lead",
    text: `تم تحويل ذكر إلى عميل — ${lead.name}`,
    platform: mention.platform,
    createdAt: new Date().toISOString(),
  });
  persist();
  return NextResponse.json(lead, { status: 201 });
}
