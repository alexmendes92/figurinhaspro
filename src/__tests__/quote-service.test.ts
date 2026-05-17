import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Mock local de @/lib/db — sobrescreve o setup global (que exporta { prisma },
 * incompatível com o quote-service que importa { db }).
 *
 * Padrão: mock por modelo só com as operações usadas pelo service.
 */
const dbMock = {
  priceRule: { findMany: vi.fn() },
  sectionPriceRule: { findMany: vi.fn() },
  customAlbum: { findMany: vi.fn() },
  inventory: { findUnique: vi.fn() },
  $transaction: vi.fn(),
};

vi.mock("@/lib/db", () => ({
  db: dbMock,
}));

// Import depois do mock — vitest hoisting garante ordem correta.
const { createQuoteWithDecrement, PriceManipulationError, InventoryNotFoundError, AlbumNotFoundError } =
  await import("@/lib/quote-service");

// ── Fixtures ──

const sellerId = "seller-1";

// Sticker code BRA1 pertence a "Brazil" no álbum estático panini_fifa_world_cup_2022
// (verificado contra src/lib/albums.ts — sticker real do catálogo Panini).
const validItem = {
  albumSlug: "panini_fifa_world_cup_2022",
  stickerCode: "BRA1",
  stickerName: "Test Sticker",
  quantity: 2,
  unitPrice: 2.5, // DEFAULT_PRICES.regular
};

beforeEach(() => {
  vi.clearAllMocks();

  // Defaults razoáveis: sem PriceRules, sem SectionRules, sem custom albums.
  dbMock.priceRule.findMany.mockResolvedValue([]);
  dbMock.sectionPriceRule.findMany.mockResolvedValue([]);
  dbMock.customAlbum.findMany.mockResolvedValue([]);
  // Inventory padrão: existe, sem customPrice, com estoque suficiente.
  dbMock.inventory.findUnique.mockResolvedValue({
    sellerId,
    albumSlug: validItem.albumSlug,
    stickerCode: validItem.stickerCode,
    customPrice: null,
    quantity: 10,
  });

  // Transaction default: executa o callback contra os mesmos mocks (sem isolamento real).
  dbMock.$transaction.mockImplementation(async (fn: (tx: typeof dbMock) => unknown) => fn(dbMock));
});

// ── Cenários de erro de preço ──

describe("createQuoteWithDecrement — validação de preço server-side", () => {
  it("rejeita item com unitPrice menor que preço resolvido server-side", async () => {
    // PriceRule global: regular = 5.00 (cliente tenta pagar 2.50)
    dbMock.priceRule.findMany.mockResolvedValue([
      { sellerId, stickerType: "regular", albumSlug: null, price: 5.0 },
    ]);

    await expect(
      createQuoteWithDecrement(
        sellerId,
        "Cliente",
        null,
        null,
        [{ ...validItem, unitPrice: 2.5 }], // underpay
        "SYSTEM"
      )
    ).rejects.toThrow(PriceManipulationError);
  });

  it("aceita item com unitPrice EXATAMENTE igual ao preço resolvido", async () => {
    dbMock.priceRule.findMany.mockResolvedValue([
      { sellerId, stickerType: "regular", albumSlug: null, price: 3.0 },
    ]);

    // Mock create + update da inventory dentro da $transaction (callback recebe tx)
    const createdOrder = { id: "order-1", items: [{}] };
    dbMock.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        order: { create: vi.fn().mockResolvedValue(createdOrder) },
        inventory: {
          findUnique: vi.fn().mockResolvedValue({ quantity: 10 }),
          update: vi.fn().mockResolvedValue({}),
        },
      })
    );

    const result = await createQuoteWithDecrement(
      sellerId,
      "Cliente",
      null,
      null,
      [{ ...validItem, unitPrice: 3.0 }],
      "SYSTEM"
    );

    expect(result).toEqual(createdOrder);
  });

  it("aceita overpay (cliente paga mais que server resolveu) — usa preço resolvido no Order", async () => {
    dbMock.priceRule.findMany.mockResolvedValue([
      { sellerId, stickerType: "regular", albumSlug: null, price: 3.0 },
    ]);

    const orderCreateMock = vi.fn().mockResolvedValue({ id: "order-2", items: [] });
    dbMock.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        order: { create: orderCreateMock },
        inventory: {
          findUnique: vi.fn().mockResolvedValue({ quantity: 10 }),
          update: vi.fn().mockResolvedValue({}),
        },
      })
    );

    await createQuoteWithDecrement(
      sellerId,
      "Cliente",
      null,
      null,
      [{ ...validItem, unitPrice: 99.0 }], // overpay extremo
      "SYSTEM"
    );

    // Verifica que Order.create foi chamado com unitPrice = 3.0 (resolvido server), não 99.0 (client).
    const createArg = orderCreateMock.mock.calls[0][0];
    expect(createArg.data.items.create[0].unitPrice).toBe(3.0);
    // totalPrice usa o preço resolvido: 3.0 * 2 = 6.0
    expect(createArg.data.totalPrice).toBe(6.0);
  });

  it("usa Inventory.customPrice quando definido (ignora PriceRule)", async () => {
    dbMock.priceRule.findMany.mockResolvedValue([
      { sellerId, stickerType: "regular", albumSlug: null, price: 5.0 },
    ]);
    dbMock.inventory.findUnique.mockResolvedValue({
      sellerId,
      albumSlug: validItem.albumSlug,
      stickerCode: validItem.stickerCode,
      customPrice: 7.5, // ganha de tudo
      quantity: 10,
    });

    // Cliente paga 5 (vê preço da PriceRule), mas o customPrice é 7.5 → underpay.
    await expect(
      createQuoteWithDecrement(
        sellerId,
        "Cliente",
        null,
        null,
        [{ ...validItem, unitPrice: 5.0 }],
        "SYSTEM"
      )
    ).rejects.toThrow(PriceManipulationError);
  });

  it("respeita SectionPriceRule FLAT no preço resolvido", async () => {
    // PriceRule global = 3.00, mas SectionRule FLAT pra "Brazil" = 10.00
    dbMock.priceRule.findMany.mockResolvedValue([
      { sellerId, stickerType: "regular", albumSlug: null, price: 3.0 },
    ]);
    dbMock.sectionPriceRule.findMany.mockResolvedValue([
      {
        sellerId,
        albumSlug: validItem.albumSlug,
        sectionName: "Brazil",
        adjustType: "FLAT",
        value: 10.0,
      },
    ]);

    // Cliente envia 3.00 (preço base) — section rule resolve 10.00 → underpay.
    await expect(
      createQuoteWithDecrement(
        sellerId,
        "Cliente",
        null,
        null,
        [{ ...validItem, unitPrice: 3.0 }],
        "SYSTEM"
      )
    ).rejects.toThrow(PriceManipulationError);
  });
});

// ── Cenários de erro de inventory/album ──

describe("createQuoteWithDecrement — validação de existência", () => {
  it("lança InventoryNotFoundError se sticker não existe no estoque", async () => {
    dbMock.inventory.findUnique.mockResolvedValue(null);

    await expect(
      createQuoteWithDecrement(sellerId, "Cliente", null, null, [validItem], "SYSTEM")
    ).rejects.toThrow(InventoryNotFoundError);
  });

  it("lança AlbumNotFoundError se albumSlug não é estático nem custom", async () => {
    dbMock.customAlbum.findMany.mockResolvedValue([]); // nenhum custom

    await expect(
      createQuoteWithDecrement(
        sellerId,
        "Cliente",
        null,
        null,
        [{ ...validItem, albumSlug: "album_inexistente" }],
        "SYSTEM"
      )
    ).rejects.toThrow(AlbumNotFoundError);
  });

  it("aceita custom album (busca em db.customAlbum.findMany)", async () => {
    const customSlug = "custom_meu_album";
    dbMock.customAlbum.findMany.mockResolvedValue([
      {
        sellerId,
        slug: customSlug,
        title: "Meu Album",
        year: "2024",
        stickers: JSON.stringify([{ code: "X1", name: "Sticker X", type: "regular" }]),
      },
    ]);

    const createdOrder = { id: "order-custom", items: [] };
    dbMock.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        order: { create: vi.fn().mockResolvedValue(createdOrder) },
        inventory: {
          findUnique: vi.fn().mockResolvedValue({ quantity: 5 }),
          update: vi.fn().mockResolvedValue({}),
        },
      })
    );

    const result = await createQuoteWithDecrement(
      sellerId,
      "Cliente",
      null,
      null,
      [{ albumSlug: customSlug, stickerCode: "X1", stickerName: "Sticker X", quantity: 1, unitPrice: 2.5 }],
      "SYSTEM"
    );

    expect(result).toEqual(createdOrder);
  });

  it("lança InventoryNotFoundError dentro da transação se estoque insuficiente no decrement", async () => {
    dbMock.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        order: { create: vi.fn().mockResolvedValue({ id: "x", items: [] }) },
        inventory: {
          findUnique: vi.fn().mockResolvedValue({ quantity: 1 }), // só 1 em estoque
          update: vi.fn(),
        },
      })
    );

    await expect(
      createQuoteWithDecrement(
        sellerId,
        "Cliente",
        null,
        null,
        [{ ...validItem, quantity: 5 }], // pede 5 (tem só 1)
        "SYSTEM"
      )
    ).rejects.toThrow(InventoryNotFoundError);
  });
});

// ── Cenário happy path: decrementa inventory ──

describe("createQuoteWithDecrement — transação atômica", () => {
  it("decrementa inventory em transação quando happy path", async () => {
    const inventoryUpdateMock = vi.fn().mockResolvedValue({});
    const orderCreateMock = vi.fn().mockResolvedValue({ id: "order-3", items: [] });

    dbMock.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        order: { create: orderCreateMock },
        inventory: {
          findUnique: vi.fn().mockResolvedValue({ quantity: 10 }),
          update: inventoryUpdateMock,
        },
      })
    );

    await createQuoteWithDecrement(
      sellerId,
      "Cliente",
      "11999999999",
      "test@example.com",
      [validItem],
      "WHATSAPP",
      "observações"
    );

    expect(dbMock.$transaction).toHaveBeenCalledOnce();
    expect(orderCreateMock).toHaveBeenCalledOnce();
    expect(inventoryUpdateMock).toHaveBeenCalledWith({
      where: {
        sellerId_albumSlug_stickerCode: {
          sellerId,
          albumSlug: validItem.albumSlug,
          stickerCode: validItem.stickerCode,
        },
      },
      data: { quantity: { decrement: validItem.quantity } },
    });
  });
});
