/**
 * Vitest Setup — Global Mocks
 * ADR 0005: Mocks Prisma + Stripe globalmente para services + API routes
 *
 * Padrão: Services precisam Prisma client + Stripe SDK, mas não devem tocar DB real em testes.
 * Mock centralizado aqui evita duplicação entre testes.
 */

import { vi } from "vitest";

/**
 * Mock Prisma Client — estrutura mínima para testes
 * Schema P8: Seller, CustomAlbum, Inventory, PriceRule, SectionPriceRule, QuantityTier,
 * Order, OrderItem, SubscriptionEvent, BizLead, BizActivity, BizOffer, BizExperiment,
 * BizInitiative, BizMilestone, BizTask, BizKpi, BizKpiSnapshot
 */
export const prismaMock = {
  seller: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
  customAlbum: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  inventory: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
  priceRule: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  sectionPriceRule: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  quantityTier: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  order: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  orderItem: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  subscriptionEvent: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  bizLead: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  bizActivity: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  bizOffer: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  bizExperiment: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  bizInitiative: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  bizTask: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  bizKpi: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  bizKpiSnapshot: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
};

/**
 * Mock global do módulo @/lib/db
 * Qualquer import de { prisma } from "@/lib/db" recebe este mock
 */
vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

/**
 * Mock Stripe client
 * @/lib/stripe exports getStripeClient() para operações Stripe
 */
export const stripeMock = {
  checkout: {
    sessions: {
      create: vi.fn(),
      retrieve: vi.fn(),
      list: vi.fn(),
    },
  },
  customers: {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
  },
  products: {
    create: vi.fn(),
    retrieve: vi.fn(),
  },
  prices: {
    create: vi.fn(),
    list: vi.fn(),
  },
};

vi.mock("@/lib/stripe", () => ({
  getStripeClient: vi.fn().mockReturnValue(stripeMock),
}));

/**
 * Reset mocks antes de cada teste
 * Garante que mocks não vazem entre testes (estado limpo)
 */
beforeEach(() => {
  vi.clearAllMocks();
});
