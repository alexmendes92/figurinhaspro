import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["better-sqlite3"],
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
