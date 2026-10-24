import { NextResponse } from "next/server";
import { db, persist } from "@/lib/store";
import { simOpportunity } from "@/lib/simulate";

export const dynamic = "force-dynamic";

// ============================================================
// دورة مسح الموصلات — "الجديد فقط"
// في الإنتاج: كل موصل نشط يجلب ما نُشر منذ lastFetchedAt فقط
// (Meta Webhooks: فورية / X API: since_id / Telegram: offset / RSS: etag)
// ثم يتجاهل أي عنصر أقدم من 72 ساعة — لا قديم في النظام إطلاقاً.
// في بيئة الديمو: نحاكي وصول فرص جديدة بهيكل بيانات مطابق تماماً.
// ============================================================

export async function POST() {
  const d = db();
  const active = d.connectors.filter((c) => c.active && c.kind !== "manual");
  let added = 0;
  const rounds = Math.random() < 0.5 ? 1 : 2;
  for (let i = 0; i < rounds; i++) {
    simOpportunity();
    added++;
  }
  persist();
  return NextResponse.json({ ok: true, added, scanned: active.length });
}
