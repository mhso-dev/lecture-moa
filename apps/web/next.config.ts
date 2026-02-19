import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@shared"],
  typescript: {
    ignoreBuildErrors: false,
  },
  typedRoutes: true,
  outputFileTracingRoot: new URL("../..", import.meta.url).pathname,
};

export default nextConfig;
