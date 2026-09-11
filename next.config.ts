import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  // Self-contained server bundle used by both Dockerfile and Dockerfile.vercel.
  output: "standalone",
  poweredByHeader: false,
  env: {
    // Build metadata exposed by /api/health. NEXT_PUBLIC_GIT_SHA is injected by CI/CD.
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || packageJson.version,
  },
};

export default nextConfig;
