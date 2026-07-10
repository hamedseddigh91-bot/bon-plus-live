import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    cpus: 2,
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
