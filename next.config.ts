// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🛠️ هذا السطر السحري يجبر مفسر Next.js على تشغيل وإضاءة تنسيقات Tailwind v4 داخل كود المشروع
  experimental: {
    inlineCss: true, 
  },
};

export default nextConfig;

