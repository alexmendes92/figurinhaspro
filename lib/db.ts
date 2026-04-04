import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL || "";

  if (!url.startsWith("postgres")) {
    throw new Error(
      `DATABASE_URL must start with postgres. Got: "${url.slice(0, 20)}"`
    );
  }

  const adapter = new PrismaNeonHttp(url, {});
  return new PrismaClient({ adapter });
}

// Lazy initialization via Proxy — only connects on first DB access,
// so builds pass without requiring a live database connection.
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createClient();
    }
    return (globalForPrisma.prisma as unknown as Record<string | symbol, unknown>)[prop];
  },
});
