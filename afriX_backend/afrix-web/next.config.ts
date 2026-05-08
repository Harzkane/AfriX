import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Ensure production builds are optimized (no x-powered-by header)
  poweredByHeader: false,
};

export default nextConfig;
