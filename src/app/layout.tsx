import type { Metadata } from "next";
import "@fontsource-variable/cairo";
import "./globals.css";

export const metadata: Metadata = {
  title: "مِرسال — استقطب عملاءك من السوشيال ميديا تلقائياً وبدون حظر",
  description:
    "منصة عربية تحوّل التعليقات والمتابعين إلى عملاء يدفعون: ردود تلقائية فورية، صندوق موحد لحظي، مراقبة الكلمات المفتاحية، وحملات واتساب رسمية — كل ذلك عبر الواجهات الرسمية الآمنة.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
