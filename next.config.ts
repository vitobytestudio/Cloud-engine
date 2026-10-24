import type { NextConfig } from "next";

// وضع النشر الساكن (نسخة GitHub Pages التجريبية): NEXT_PUBLIC_STATIC_DEPLOY=1
const STATIC = process.env.NEXT_PUBLIC_STATIC_DEPLOY === "1";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // السماح لنطاق المعاينة الحية بالوصول إلى أصول وضع التطوير
  allowedDevOrigins: ["*.e2b.app"],
  // إخفاء شارة أدوات التطوير (N) عن الواجهة
  devIndicators: false,
  ...(STATIC
    ? {
        output: "export",
        basePath: "/Cloud-engine",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
