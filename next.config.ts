import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/api/chat": ["./data/knowledge/**/*"],
    },
  },
};

export default nextConfig;
