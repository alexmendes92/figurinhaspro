import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const R2_HOSTNAME = "figurinhasproimg.arenacards.com.br";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: R2_HOSTNAME }],
  },
  async redirects() {
    return [
      {
        source: "/albums/:path*",
        destination: `https://${R2_HOSTNAME}/albums/:path*`,
        permanent: false,
      },
      {
        source: "/stickers/:path*",
        destination: `https://${R2_HOSTNAME}/stickers/:path*`,
        permanent: false,
      },
      {
        source: "/covers/:path*",
        destination: `https://${R2_HOSTNAME}/covers/:path*`,
        permanent: false,
      },
      {
        source: "/flags/:path*",
        destination: `https://${R2_HOSTNAME}/flags/:path*`,
        permanent: false,
      },
    ];
  },
  serverExternalPackages: ["better-sqlite3"],
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
