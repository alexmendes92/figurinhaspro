import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL || "";

  if (!url.startsWith("postgres")) {
    throw new Error(
      "DATABASE_URL must be a Postgres connection string (Neon). " +
        "SQLite is no longer supported. Get a free Neon DB at https://neon.tech"
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { neon } = require("@neondatabase/serverless");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaNeon } = require("@prisma/adapter-neon");
  const sql = neon(url);
  const adapter = new PrismaNeon(sql);
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
