import { NextRequest, NextResponse } from "next/server";
import { db, persist } from "@/lib/store";
import { uid } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = db();
  const conv = d.conversations.find((c) => c.id === id);
  if (!conv) return NextResponse.json({ error: "غير موجودة" }, { status: 404 });
  const lead = d.leads.find((l) => l.id === conv.leadId) ?? null;
  const messages = d.messages
    .filter((m) => m.conversationId === id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  // فتح المحادثة يصفّر غير المقروءة
  if (conv.unread > 0) {
    conv.unread = 0;
    persist();
  }

  return NextResponse.json({ conversation: conv, lead, messages });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const text = String(body?.body ?? "").trim();
  if (!text) return NextResponse.json({ error: "نص الرسالة مطلوب" }, { status: 400 });

  const d = db();
  const conv = d.conversations.find((c) => c.id === id);
  if (!conv) return NextResponse.json({ error: "غير موجودة" }, { status: 404 });

  const msg = {
    id: uid(),
    conversationId: id,
    direction: "out" as const,
    body: text.slice(0, 1000),
    status: "sent" as const,
    createdAt: new Date().toISOString(),
  };
  d.messages.push(msg);
  conv.lastMessageAt = msg.createdAt;
  conv.lastMessagePreview = msg.body;
  const lead = d.leads.find((l) => l.id === conv.leadId);
  if (lead) {
    lead.lastActivityAt = msg.createdAt;
    if (lead.status === "new") lead.status = "contacted";
  }
  persist();

  // في الإنتاج: إرسال فعلي عبر WhatsApp Cloud API / Meta Graph API ثم تحديث الحالة عبر Webhook
  setTimeout(() => {
    const m = db().messages.find((x) => x.id === msg.id);
    if (m) {
      m.status = "delivered";
      persist();
    }
  }, 1200);
  setTimeout(() => {
    const m = db().messages.find((x) => x.id === msg.id);
    if (m) {
      m.status = "read";
      persist();
    }
  }, 2600);

  return NextResponse.json(msg, { status: 201 });
}
