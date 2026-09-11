import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle used by both Dockerfile and Dockerfile.vercel.
  output: "standalone",
  poweredByHeader: false,
  // No `env` block: configuration is read at runtime, never inlined at build time (ADR-025).
};

export default nextConfig;
