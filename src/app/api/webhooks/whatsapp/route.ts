import { NextRequest, NextResponse } from "next/server";
import { db, persist } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

// ============================================================
// Webhook رسمي لواتساب — WhatsApp Business Platform (Cloud API)
// 1) GET:  تحقق الاشتراك بـ WHATSAPP_VERIFY_TOKEN
// 2) POST: استقبال الرسائل الواردة وتحديثات الحالة (sent/delivered/read)
// توثيق: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
// ============================================================

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const mode = sp.get("hub.mode");
  const token = sp.get("hub.verify_token");
  const challenge = sp.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN ?? "mirsal-verify";

  if (mode === "subscribe" && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "verification failed" }, { status: 403 });
}

interface WaEvent {
  statuses?: Array<{ id: string; status: string }>;
  messages?: Array<{
    from: string;
    text?: { body?: string };
    type?: string;
  }>;
}

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  if (!payload?.entry) return NextResponse.json({ ok: true });

  const d = db();

  for (const entry of payload.entry as Array<{ changes?: Array<{ value?: WaEvent }> }>) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value) continue;

      // — تحديثات حالة الرسائل الصادرة —
      for (const st of value.statuses ?? []) {
        const msg = d.messages.find((m) => m.id === st.id || m.id.endsWith(st.id));
        if (msg && (st.status === "delivered" || st.status === "read" || st.status === "sent")) {
          msg.status = st.status as "sent" | "delivered" | "read";
        }
      }

      // — الرسائل الواردة —
      for (const m of value.messages ?? []) {
        if (!m.text?.body) continue;
        const phone = m.from;
        let lead = d.leads.find((l) => l.platform === "whatsapp" && l.phone?.replace(/\D/g, "").endsWith(phone.replace(/\D/g, "").slice(-9)));
        if (!lead) {
          lead = {
            id: uid(),
            name: `واتساب ${phone.slice(-4)}`,
            handle: `+${phone}`,
            platform: "whatsapp",
            phone,
            source: "واتساب — رسالة واردة",
            status: "new",
            tags: [],
            score: 55,
            consent: true, // مراسلتنا أولاً = موافقة على الرد
            createdAt: new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
          };
          d.leads.unshift(lead);
        }

        let conv = d.conversations.find((c) => c.leadId === lead!.id && c.platform === "whatsapp");
        if (!conv) {
          conv = {
            id: uid(),
            leadId: lead.id,
            platform: "whatsapp",
            unread: 0,
            lastMessageAt: new Date().toISOString(),
            lastMessagePreview: "",
          };
          d.conversations.unshift(conv);
        }

        const msg = {
          id: uid(),
          conversationId: conv.id,
          direction: "in" as const,
          body: m.text.body.slice(0, 1000),
          status: "delivered" as const,
          createdAt: new Date().toISOString(),
        };
        d.messages.push(msg);
        conv.unread += 1;
        conv.lastMessageAt = msg.createdAt;
        conv.lastMessagePreview = msg.body;

        d.activity.unshift({
          id: uid(),
          type: "message",
          text: `رسالة واتساب جديدة من ${lead.name}`,
          platform: "whatsapp",
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  persist();
  return NextResponse.json({ ok: true });
}
