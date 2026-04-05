import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["better-sqlite3"],
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
