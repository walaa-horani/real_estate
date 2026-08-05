import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default 1MB is too small for a multi-image property upload.
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
