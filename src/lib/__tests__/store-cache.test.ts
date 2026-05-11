import { describe, expect, it } from "vitest";
import { storeCacheTag } from "../store-cache";

describe("storeCacheTag", () => {
  it("inclui sellerId + albumSlug com prefixo store-", () => {
    expect(storeCacheTag("seller-abc", "copa-2022")).toBe("store-seller-abc-copa-2022");
  });

  // Golden path do fix B1 (Fase 5.3 plano v6).
  // Vetor original: tag era `album-${albumSlug}`. Dois sellers com mesmo slug
  // ("copa-2022") compartilhavam cache → leak de seller.phone, paymentMethods etc.
  it("isola por sellerId — mesmo albumSlug em sellers diferentes gera tags distintas", () => {
    const tagA = storeCacheTag("seller-A", "copa-2022");
    const tagB = storeCacheTag("seller-B", "copa-2022");
    expect(tagA).not.toBe(tagB);
    expect(tagA).toBe("store-seller-A-copa-2022");
    expect(tagB).toBe("store-seller-B-copa-2022");
  });

  it("isola por albumSlug — mesmo seller com albums diferentes gera tags distintas", () => {
    const tag1 = storeCacheTag("seller-A", "copa-2022");
    const tag2 = storeCacheTag("seller-A", "copa-2026");
    expect(tag1).not.toBe(tag2);
  });

  it("é determinístico — mesma entrada sempre produz mesma tag", () => {
    expect(storeCacheTag("seller-X", "album-Y")).toBe(storeCacheTag("seller-X", "album-Y"));
  });
});
