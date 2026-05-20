import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  // Image optimization disabled — we don't host images currently
  images: { unoptimized: true },
  experimental: {
    // Cache external fetches to MeiliSearch via Next data cache
  },
};

export default nextConfig;
