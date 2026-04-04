import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
