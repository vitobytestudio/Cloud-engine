import { NextRequest, NextResponse } from "next/server";
import { db, persist } from "@/lib/store";
import { PROFESSIONS, WILAYAS, professionById } from "@/lib/matching";
import type { AlertChannel, RadarProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

// ملف الرصد الذكي — إعداد لمرة واحدة (60 ثانية) ثم أتمتة كاملة
export async function GET() {
  const d = db();
  return NextResponse.json({
    profile: d.profile,
    professions: PROFESSIONS.map((p) => ({ id: p.id, label: p.label, icon: p.icon, keywordsCount: p.keywords.length })),
    wilayas: WILAYAS,
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const d = db();

  const professionId = String(body?.professionId ?? "");
  if (professionId && !professionById(professionId))
    return NextResponse.json({ error: "تخصص غير معروف" }, { status: 400 });

  const wilayas: string[] = Array.isArray(body?.wilayas) && body.wilayas.length
    ? body.wilayas.filter((w: unknown) => typeof w === "string").slice(0, 50)
    : ["كل الولايات"];

  const alertChannel: AlertChannel = ["app", "whatsapp", "telegram"].includes(body?.alertChannel)
    ? body.alertChannel
    : "app";

  // كلمات التخصص تلقائياً + أي كلمات مخصصة أضافها
  const autoKw = professionId ? professionById(professionId)!.keywords : [];
  const customKw: string[] = Array.isArray(body?.keywords)
    ? body.keywords.filter((k: unknown) => typeof k === "string" && k.trim()).map((k: string) => k.trim().slice(0, 30))
    : [];

  const profile: RadarProfile = {
    professionId,
    keywords: Array.from(new Set([...customKw])).slice(0, 20),
    wilayas,
    alertChannel,
    alertPhone: body?.alertPhone ? String(body.alertPhone).slice(0, 30) : undefined,
    setupDone: Boolean(professionId),
    createdAt: d.profile.createdAt || new Date().toISOString(),
  };

  // كلمات التخصص تُخزن ضمنياً في المحرك (لا نكررها في الملف)
  d.profile = profile;

  d.activity.unshift({
    id: "radar-" + Date.now(),
    type: "system",
    text: professionId
      ? `تم تفعيل الرصد التلقائي — ${professionById(professionId)!.label} · ${wilayas[0]}`
      : "تم تحديث ملف الرصد",
    createdAt: new Date().toISOString(),
  });
  persist();

  // تفعيل فوري: أول دورة مسح تلقائية بعد الحفظ
  return NextResponse.json({ ok: true, profile, autoKeywords: autoKw });
}
