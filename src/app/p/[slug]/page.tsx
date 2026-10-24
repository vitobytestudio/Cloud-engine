import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/store";
import CaptureForm from "./capture-form";
import { LogoMark } from "@/components/logo";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = db().capturePages.find((p) => p.slug === decodeURIComponent(slug));
  return { title: page ? `${page.headline} — ${page.title}` : "صفحة غير متوفرة" };
}

export default async function CapturePage({ params }: Props) {
  const { slug } = await params;
  const page = db().capturePages.find((p) => p.slug === decodeURIComponent(slug) && p.published);
  if (!page) notFound();

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* خلفية زخرفية */}
      <div className="pointer-events-none absolute -top-40 start-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-violet-600/25 blur-3xl rtl:translate-x-1/2" />
      <div className="pointer-events-none absolute -bottom-40 end-0 h-80 w-96 rounded-full bg-fuchsia-600/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col px-5 py-10">
        <div className="mb-10 flex items-center gap-2.5">
          <LogoMark />
          <span className="text-[11px] font-bold text-slate-500">بواسطة مِرسال</span>
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-black leading-snug sm:text-4xl">{page.headline}</h1>
          {page.offer && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-violet-600 to-fuchsia-500 px-4 py-2 text-[13px] font-extrabold shadow-lg shadow-violet-600/40">
              🎁 {page.offer}
            </div>
          )}
          <p className="mt-5 text-[14px] leading-8 text-slate-400">{page.subtext}</p>

          <div className="mt-8">
            <CaptureForm slug={page.slug} askPhone={page.askPhone} askEmail={page.askEmail} ctaLabel={page.ctaLabel} />
          </div>
        </div>

        <div className="mt-10 text-center text-[11px] font-semibold text-slate-600">
          بياناتك بأمان — تُستخدم للتواصل معك فقط وبموافقتك
        </div>
      </div>
    </div>
  );
}
