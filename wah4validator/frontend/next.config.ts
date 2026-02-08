import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove static export - we'll run as a standalone Next.js server
  images: { unoptimized: true },
};

export default nextConfig;
