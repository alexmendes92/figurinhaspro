import { describe, it, expect, vi } from "vitest";
import { submitOrder, type SubmitOrderInput } from "./submit-order";

const baseInput: SubmitOrderInput = {
  sellerSlug: "loja-test",
  customerName: "Cliente",
  channel: "SYSTEM",
  items: [
    {
      albumSlug: "panini_fifa_world_cup_2022",
      stickerCode: "BRA1",
      stickerName: "Sticker",
      quantity: 1,
      unitPrice: 2.5,
    },
  ],
};

function mockFetch(status: number, body: unknown): typeof fetch {
  return vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  ) as unknown as typeof fetch;
}

describe("submitOrder", () => {
  it("retorna ok:true com order quando server responde 200", async () => {
    const order = { id: "order-1", totalPrice: 5.0 };
    const result = await submitOrder(baseInput, mockFetch(200, order));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.order.id).toBe("order-1");
      expect(result.order.totalPrice).toBe(5.0);
    }
  });

  it("retorna ok:false com error 'price_mismatch' quando server responde 422", async () => {
    const result = await submitOrder(
      baseInput,
      mockFetch(422, { error: "price_mismatch", message: "Preços mudaram." })
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("price_mismatch");
      expect(result.status).toBe(422);
    }
  });

  it("retorna ok:false com error 'out_of_stock' quando server responde 409", async () => {
    const result = await submitOrder(
      baseInput,
      mockFetch(409, { error: "out_of_stock", message: "Sem estoque." })
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("out_of_stock");
      expect(result.status).toBe(409);
    }
  });

  it("retorna ok:false com error 'plan_limit' quando server responde 403", async () => {
    const result = await submitOrder(
      baseInput,
      mockFetch(403, { error: "plan_limit", message: "Limite atingido." })
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("plan_limit");
  });

  it("retorna ok:false com error 'validation' quando server responde 400 (Zod)", async () => {
    const result = await submitOrder(
      baseInput,
      mockFetch(400, { error: "Dados inválidos", details: [] })
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("validation");
  });

  it("retorna ok:false com error 'server' quando server responde 500", async () => {
    const result = await submitOrder(
      baseInput,
      mockFetch(500, { error: "Erro interno" })
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("server");
  });

  it("retorna ok:false com error 'network' quando fetch lança", async () => {
    const failingFetch = vi.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;

    const result = await submitOrder(baseInput, failingFetch);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("network");
      expect(result.message).toContain("network down");
    }
  });

  it("envia POST /api/orders com Content-Type application/json", async () => {
    const fetchSpy = mockFetch(200, { id: "x", totalPrice: 0 });
    await submitOrder(baseInput, fetchSpy);

    const call = (fetchSpy as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe("/api/orders");
    expect(call[1].method).toBe("POST");
    expect(call[1].headers["Content-Type"]).toBe("application/json");

    const body = JSON.parse(call[1].body as string);
    expect(body.sellerSlug).toBe("loja-test");
    expect(body.items).toHaveLength(1);
  });
});
