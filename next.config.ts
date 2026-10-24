import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // السماح لنطاق المعاينة الحية بالوصول إلى أصول وضع التطوير
  allowedDevOrigins: ["*.e2b.app"],
  // إخفاء شارة أدوات التطوير (N) عن الواجهة
  devIndicators: false,
};


export default nextConfig;
