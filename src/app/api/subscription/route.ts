import { NextRequest, NextResponse } from "next/server";
import { db, persist } from "@/lib/store";
import { PLANS, planById, deliveredToday } from "@/lib/plans";
import { PROFESSIONS, professionById } from "@/lib/matching";
import type { PlanId, Subscription } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const d = db();
  const sub = d.subscription;
  const plan = planById(sub.planId);

  const todayCount = deliveredToday(d.opportunities);
  const weekCount = (() => {
    const from = Date.now() - 7 * 86400_000;
    return d.opportunities.filter(
      (o) => new Date(o.fetchedAt).getTime() >= from && o.status !== "ignored"
    ).length;
  })();

  return NextResponse.json({
    subscription: sub,
    plan,
    plans: PLANS,
    usage: {
      today: todayCount,
      dailyQuota: plan.dailyClients, // 0 للغير محدود/المجاني
      week: weekCount,
      weeklyQuota: plan.weeklyClientsFree ?? null,
    },
    professionsCount: PROFESSIONS.length,
    professionLabel: d.profile.professionId ? professionById(d.profile.professionId)?.label ?? null : null,
  });
}

// تغيير الباقة — في الديمو يُفعّل فوراً بالمحاكاة؛ في الإنتاج يُسبق بتأكيد دفع (CIB/الذهبية)
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const planId = String(body?.planId ?? "");
  if (!PLANS.some((p) => p.id === planId))
    return NextResponse.json({ error: "باقة غير معروفة" }, { status: 400 });

  const d = db();
  const sub: Subscription = {
    planId: planId as PlanId,
    status: "active",
    startedAt: new Date().toISOString(),
    renewsAt: new Date(Date.now() + 30 * 86400_000).toISOString(),
    totalDelivered: d.subscription?.totalDelivered ?? 0,
  };
  d.subscription = sub;
  d.activity.unshift({
    id: "sub-" + Date.now(),
    type: "system",
    text: `تم تفعيل باقة «${planById(sub.planId).name}» — توصيل الزبائن الجاهزين يعمل بأقصى طاقة`,
    createdAt: new Date().toISOString(),
  });
  persist();
  return NextResponse.json({ ok: true, subscription: sub, plan: planById(sub.planId) });
}
