import type { Metadata } from "next";
import "@fontsource-variable/cairo";
import "./globals.css";
import { buildSeed } from "@/lib/seed";
import { buildStaticShim } from "@/lib/static-shim";

const STATIC_MODE = process.env.NEXT_PUBLIC_STATIC_DEPLOY === "1";

export const metadata: Metadata = {
  title: "مِرسال — استقطب عملاءك من السوشيال ميديا تلقائياً وبدون حظر",
  description:
    "منصة عربية تحوّل التعليقات والمتابعين إلى عملاء يدفعون: ردود تلقائية فورية، صندوق موحد لحظي، مراقبة الكلمات المفتاحية، وحملات واتساب رسمية — كل ذلك عبر الواجهات الرسمية الآمنة.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans antialiased">
        {STATIC_MODE && (
          <script
            dangerouslySetInnerHTML={{ __html: buildStaticShim(JSON.stringify(buildSeed())) }}
          />
        )}
        {children}
      </body>
    </html>
  );
}
