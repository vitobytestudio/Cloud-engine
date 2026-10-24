import { NextRequest, NextResponse } from "next/server";
import { db, persist } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { Lead, Platform } from "@/lib/types";

export const dynamic = "force-dynamic";

// ============================================================
// Webhook رسمي لمنصات Meta (إنستغرام / فيسبوك) — Graph API
// 1) GET:  التحقق من الاشتراك (hub.challenge) بـ META_VERIFY_TOKEN
// 2) POST: استقبال التعليقات والرسائل، تشغيل الأتمتة المطابقة،
//          إنشاء العميل، وإرسال الرد عبر Graph API (في الإنتاج).
// توثيق: https://developers.facebook.com/docs/graph-api/webhooks
// ============================================================

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const mode = sp.get("hub.mode");
  const token = sp.get("hub.verify_token");
  const challenge = sp.get("hub.challenge");
  const expected = process.env.META_VERIFY_TOKEN ?? "mirsal-verify";

  if (mode === "subscribe" && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "verification failed" }, { status: 403 });
}

interface MetaEvent {
  field: string;
  value: {
    from?: { id: string; username?: string; name?: string };
    text?: string;
    message?: { text?: string };
    id?: string;
  };
}

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  if (!payload?.entry) return NextResponse.json({ ok: true }); // تجاهل الأحداث غير المدعومة

  const d = db();

  for (const entry of payload.entry as Array<{ changes?: MetaEvent[]; messaging?: Array<{ message?: { text?: string }; sender?: { id: string } }> }>) {
    // — تعليقات المنشورات (تشغيل أتمتة «تعليق → رسالة») —
    for (const change of entry.changes ?? []) {
      const text = change.value?.text ?? "";
      const commenter = change.value?.from;
      if (!text || !commenter) continue;

      const automation = d.automations.find(
        (a) =>
          a.active &&
          (a.platform === "instagram" || a.platform === "facebook") &&
          text.includes(a.keyword)
      );
      if (!automation) continue;

      const name = commenter.username ?? commenter.name ?? "متابع جديد";
      let lead = d.leads.find((l) => l.handle === `@${name}` && l.platform === automation.platform);
      if (!lead) {
        lead = {
          id: uid(),
          name,
          handle: `@${name}`,
          platform: automation.platform as Platform,
          source: `أتمتة «${automation.keyword}»`,
          status: "new",
          tags: ["أتمتة"],
          score: 60,
          consent: false,
          createdAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString(),
        };
        d.leads.unshift(lead);
        automation.leadsCaptured += 1;
      }
      automation.triggeredCount += 1;

      // الرد التلقائي (في الإنتاج: POST /{comment-id}/replies عبر Graph API + رسالة خاصة)
      const reply = automation.replyTemplate
        .replaceAll("{{الاسم}}", name)
        .replaceAll("{{الرابط}}", automation.ctaLink ?? "");
      d.messages.push({
        id: uid(),
        conversationId: `pending-${commenter.id}`,
        direction: "out",
        body: reply,
        status: "sent",
        createdAt: new Date().toISOString(),
      });
      d.activity.unshift({
        id: uid(),
        type: "automation",
        text: `أتمتة «${automation.keyword}» ردّت على ${name}`,
        platform: automation.platform,
        createdAt: new Date().toISOString(),
      });
    }
  }

  persist();
  // Meta تتطلب رد 200 سريعاً دائماً
  return NextResponse.json({ ok: true });
}
