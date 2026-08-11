import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone with a self-contained server.js and only the
  // node_modules actually reached at runtime. That is what the systemd unit on
  // the VPS runs, and it means the server never needs `next start`, the dev
  // dependencies, or a node_modules tree kept in sync after deploy.
  output: "standalone",

  experimental: {
    serverActions: {
      // Default 1MB is too small for a multi-image property upload.
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
