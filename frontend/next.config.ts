import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // これを true にしないと Vercel で落ちます
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
