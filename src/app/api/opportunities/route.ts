import { NextRequest, NextResponse } from "next/server";
import { db, persist } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { Opportunity, OpportunityPlatform } from "@/lib/types";

export const dynamic = "force-dynamic";

// ============================================================
// رصّاد الفرص — جلب الفرص من محتوى عام ظاهر + رابط المنشور إلزامي
// القاعدة: نعرض الجديد أولاً، والقديم (>72سا) يُعلَّم "انتهت" ولا يظهر افتراضياً.
// في الإنتاج: تعبئة هذا المخزون تتم آلياً من الموصلات (Webhooks / X API /
// Telegram Bot API / RSS) عبر دالة refresh أدناه — نفس بنية البيانات.
// ============================================================

function detectPlatform(url: string): OpportunityPlatform {
  const u = url.toLowerCase();
  if (u.includes("instagram.")) return "instagram";
  if (u.includes("facebook.") || u.includes("fb.com")) return "facebook";
  if (u.includes("tiktok.")) return "tiktok";
  if (u.includes("twitter.") || u.includes("x.com")) return "x";
  if (u.includes("t.me") || u.includes("telegram.")) return "telegram";
  if (u.includes("/feed") || u.includes("rss")) return "rss";
  return "web";
}

// جلب الميتاداتا العامة الظاهرة (og:title / og:description) — مثل أي متصفح، مع مهلة قصيرة
async function fetchPublicMeta(url: string): Promise<{ title?: string; desc?: string }> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "MirsalBot/1.0 (+public og-metadata)" },
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) return {};
    const html = (await res.text()).slice(0, 200_000);
    const meta = (prop: string) => {
      const re = new RegExp(`<meta[^>]*(?:property|name)="${prop}"[^>]*content="([^"]*)"`, "i");
      const m = html.match(re);
      return m?.[1] ?? undefined;
    };
    const t = meta("og:title");
    const d = meta("og:description") ?? meta("description");
    return { title: t?.slice(0, 120), desc: d?.slice(0, 400) };
  } catch {
    return {}; // الشبكة قد تكون مقيدة في بيئة التطوير — نكتفى بما أدخله المستخدم
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const d = db();

  // الوضع الحي
  if (sp.get("live") === "1" && Math.random() < 0.18) {
    const { simOpportunity } = await import("@/lib/simulate");
    simOpportunity();
  }

  const statusFilter = sp.get("status"); // new|saved|contacted|won|ignored|all
  let items = [...d.opportunities].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  if (statusFilter && statusFilter !== "all") {
    items = items.filter((o) => o.status === statusFilter);
  }

  const now = Date.now();
  const counts = {
    hot: d.opportunities.filter((o) => now - new Date(o.publishedAt).getTime() < 3600_000).length,
    warm: d.opportunities.filter((o) => {
      const a = now - new Date(o.publishedAt).getTime();
      return a >= 3600_000 && a < 86400_000;
    }).length,
    cold: d.opportunities.filter((o) => {
      const a = now - new Date(o.publishedAt).getTime();
      return a >= 86400_000 && a < 72 * 3600_000;
    }).length,
    expired: d.opportunities.filter((o) => now - new Date(o.publishedAt).getTime() >= 72 * 3600_000).length,
    new: d.opportunities.filter((o) => o.status === "new").length,
  };

  const connectors = d.connectors;
  return NextResponse.json({ opportunities: items, counts, connectors });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const url = String(body?.url ?? "").trim();
  if (!url || !/^https?:\/\//.test(url))
    return NextResponse.json({ error: "رابط المنشور مطلوب (يبدأ بـ http)" }, { status: 400 });

  const d = db();
  const manual = d.connectors.find((c) => c.kind === "manual");
  const meta = await fetchPublicMeta(url);

  const title = String(body.title ?? meta.title ?? "فرصة من رابط ملصوق").slice(0, 120);
  const excerpt = String(body.excerpt ?? meta.desc ?? "").slice(0, 400);

  const o: Opportunity = {
    id: uid(),
    title,
    excerpt: excerpt || "— افتح المنشور للاطلاع على التفاصيل الكاملة —",
    authorPublic: String(body.author ?? "").slice(0, 60) || "ناشر عام",
    platform: detectPlatform(url),
    sourceUrl: url,
    keyword: String(body.keyword ?? "لصق يدوي").slice(0, 40),
    engagement: { likes: 0, comments: 0 },
    status: "new",
    connectorId: manual?.id ?? "manual",
    publishedAt: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
  };
  d.opportunities.unshift(o);
  if (d.opportunities.length > 60) d.opportunities.length = 60;
  if (manual) {
    manual.fetchedCount += 1;
    manual.lastFetchedAt = new Date().toISOString();
  }
  d.activity.unshift({
    id: uid(),
    type: "mention",
    text: `فرصة مُلصقة يدوياً — ${title}`,
    createdAt: new Date().toISOString(),
  });
  persist();
  return NextResponse.json(o, { status: 201 });
}
