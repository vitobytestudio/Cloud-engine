import { NextRequest, NextResponse } from "next/server";
import { db, persist } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

// صفحة التقاط عامة: GET يعيد بياناتها ويزيد المشاهدات
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = db();
  const page = d.capturePages.find((p) => p.slug === decodeURIComponent(slug));
  if (!page || !page.published) return NextResponse.json({ error: "غير متوفرة" }, { status: 404 });

  page.views += 1;
  persist();
  return NextResponse.json({ page });
}

// إرسال بيانات العميل — بموافقته الصريحة ( consent )
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
  if (!body?.consent)
    return NextResponse.json({ error: "يجب موافقة العميل على التواصل" }, { status: 400 });

  const d = db();
  const page = d.capturePages.find((p) => p.slug === decodeURIComponent(slug));
  if (!page || !page.published) return NextResponse.json({ error: "غير متوفرة" }, { status: 404 });

  const lead: Lead = {
    id: uid(),
    name: name.slice(0, 80),
    handle: "",
    platform: "whatsapp",
    phone: body.phone ? String(body.phone).slice(0, 30) : undefined,
    email: body.email ? String(body.email).slice(0, 80) : undefined,
    source: `صفحة الالتقاط: ${page.title}`,
    status: "new",
    tags: ["صفحة التقاط"],
    score: page.askPhone && body.phone ? 72 : 55,
    consent: true,
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  };
  d.leads.unshift(lead);
  page.conversions += 1;

  // محادثة ترحيبية تلقائية
  const convId = uid();
  d.conversations.unshift({
    id: convId,
    leadId: lead.id,
    platform: "whatsapp",
    unread: 0,
    lastMessageAt: new Date().toISOString(),
    lastMessagePreview: "مرحباً بك! وصلنا طلبك 🌸",
  });
  d.messages.push({
    id: uid(),
    conversationId: convId,
    direction: "out",
    body: `مرحباً ${lead.name} 👋 وصلنا طلبك من «${page.title}» — سنتواصل معك خلال دقائق إن شاء الله 🌸`,
    status: "sent",
    createdAt: new Date().toISOString(),
  });

  d.activity.unshift({
    id: uid(),
    type: "lead",
    text: `عميل جديد من صفحة الالتقاط «${page.title}» — ${lead.name}`,
    platform: "whatsapp",
    createdAt: new Date().toISOString(),
  });
  persist();
  return NextResponse.json({ ok: true }, { status: 201 });
}
