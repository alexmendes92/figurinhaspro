import { describe, expect, it } from "vitest";
import {
  applyDiscount,
  buildStickerSectionMap,
  type PriceContext,
  type QuantityTier,
  resolveQuantityDiscount,
  resolveUnitPrice,
  type SectionRule,
} from "./price-resolver";

/**
 * Testes de caracterização do sistema de preços 3 eixos.
 *
 * Plano: thoughts/planos/2026-05-17-cobertura-testes-precos-3-eixos.md
 * Pesquisa: thoughts/pesquisas/2026-05-17-precos-3-eixos-estado-funcional.md
 *
 * Não é TDD strict — código já existe e funciona. É rede de testes pra destravar
 * refactor (proposta lib/pricing/ em output/03-estrutura.md).
 */

// ── Helpers ──

function makeCtx(overrides: Partial<PriceContext> = {}): PriceContext {
  return {
    customPrice: null,
    stickerType: "regular",
    sectionName: "",
    albumTypeRules: {},
    globalTypeRules: {},
    sectionRules: new Map<string, SectionRule>(),
    ...overrides,
  };
}

// ── resolveUnitPrice — 5 níveis da hierarquia + ajuste de seção ──

describe("resolveUnitPrice", () => {
  describe("hierarquia de tipo (sem ajuste de seção)", () => {
    it("nível 0 — customPrice definido vence todo o resto", () => {
      const ctx = makeCtx({
        customPrice: 9.99,
        stickerType: "regular",
        albumTypeRules: { regular: 3.0 },
        globalTypeRules: { regular: 2.0 },
      });
      expect(resolveUnitPrice(ctx)).toBe(9.99);
    });

    it("nível 0 — customPrice = 0 não conta como definido (cai pra próximo nível)", () => {
      const ctx = makeCtx({
        customPrice: 0,
        stickerType: "regular",
        albumTypeRules: { regular: 3.5 },
      });
      expect(resolveUnitPrice(ctx)).toBe(3.5);
    });

    it("nível 0 — customPrice null cai pra próximo nível", () => {
      const ctx = makeCtx({
        customPrice: null,
        albumTypeRules: { regular: 3.5 },
      });
      expect(resolveUnitPrice(ctx)).toBe(3.5);
    });

    it("nível 1 — albumTypeRules vence globalTypeRules e DEFAULT_PRICES", () => {
      const ctx = makeCtx({
        stickerType: "regular",
        albumTypeRules: { regular: 4.0 },
        globalTypeRules: { regular: 3.0 },
      });
      expect(resolveUnitPrice(ctx)).toBe(4.0);
    });

    it("nível 2 — globalTypeRules vence DEFAULT_PRICES quando album não tem regra", () => {
      const ctx = makeCtx({
        stickerType: "regular",
        albumTypeRules: {},
        globalTypeRules: { regular: 3.0 },
      });
      expect(resolveUnitPrice(ctx)).toBe(3.0);
    });

    it("nível 3 — DEFAULT_PRICES.regular = 2.5 quando nem album nem global têm regra", () => {
      const ctx = makeCtx({ stickerType: "regular" });
      expect(resolveUnitPrice(ctx)).toBe(2.5);
    });

    it("nível 3 — DEFAULT_PRICES.foil = 5.0", () => {
      const ctx = makeCtx({ stickerType: "foil" });
      expect(resolveUnitPrice(ctx)).toBe(5.0);
    });

    it("nível 3 — DEFAULT_PRICES.shiny = 4.0", () => {
      const ctx = makeCtx({ stickerType: "shiny" });
      expect(resolveUnitPrice(ctx)).toBe(4.0);
    });

    it("fallback final — tipo desconhecido sem nenhuma regra retorna 2.5", () => {
      const ctx = makeCtx({ stickerType: "tipo-inexistente" });
      expect(resolveUnitPrice(ctx)).toBe(2.5);
    });
  });

  describe("ajuste de seção/país (eixo 2)", () => {
    it("FLAT — substitui o preço base pelo valor da regra", () => {
      const sectionRules = new Map<string, SectionRule>([
        ["Brasil", { sectionName: "Brasil", adjustType: "FLAT", value: 10.0 }],
      ]);
      const ctx = makeCtx({
        stickerType: "regular",
        sectionName: "Brasil",
        albumTypeRules: { regular: 3.0 },
        sectionRules,
      });
      expect(resolveUnitPrice(ctx)).toBe(10.0);
    });

    it("OFFSET positivo — soma ao preço base", () => {
      const sectionRules = new Map<string, SectionRule>([
        ["Argentina", { sectionName: "Argentina", adjustType: "OFFSET", value: 1.5 }],
      ]);
      const ctx = makeCtx({
        stickerType: "regular",
        sectionName: "Argentina",
        albumTypeRules: { regular: 3.0 },
        sectionRules,
      });
      expect(resolveUnitPrice(ctx)).toBe(4.5);
    });

    it("OFFSET negativo — subtrai do preço base", () => {
      const sectionRules = new Map<string, SectionRule>([
        ["Brasil", { sectionName: "Brasil", adjustType: "OFFSET", value: -0.5 }],
      ]);
      const ctx = makeCtx({
        stickerType: "regular",
        sectionName: "Brasil",
        albumTypeRules: { regular: 3.0 },
        sectionRules,
      });
      expect(resolveUnitPrice(ctx)).toBe(2.5);
    });

    it("OFFSET negativo extremo — piso 0.01 (nunca abaixo)", () => {
      const sectionRules = new Map<string, SectionRule>([
        ["Brasil", { sectionName: "Brasil", adjustType: "OFFSET", value: -100 }],
      ]);
      const ctx = makeCtx({
        stickerType: "regular",
        sectionName: "Brasil",
        albumTypeRules: { regular: 3.0 },
        sectionRules,
      });
      expect(resolveUnitPrice(ctx)).toBe(0.01);
    });

    it("seção sem regra correspondente — usa preço base sem ajuste", () => {
      const sectionRules = new Map<string, SectionRule>([
        ["Argentina", { sectionName: "Argentina", adjustType: "FLAT", value: 10.0 }],
      ]);
      const ctx = makeCtx({
        stickerType: "regular",
        sectionName: "Brasil", // não bate
        albumTypeRules: { regular: 3.0 },
        sectionRules,
      });
      expect(resolveUnitPrice(ctx)).toBe(3.0);
    });

    it("customPrice ainda vence regra de seção (custom é nível 0)", () => {
      const sectionRules = new Map<string, SectionRule>([
        ["Brasil", { sectionName: "Brasil", adjustType: "FLAT", value: 99.0 }],
      ]);
      const ctx = makeCtx({
        customPrice: 7.0,
        stickerType: "regular",
        sectionName: "Brasil",
        sectionRules,
      });
      expect(resolveUnitPrice(ctx)).toBe(7.0);
    });
  });
});

// ── resolveQuantityDiscount — last-match descendente ──

describe("resolveQuantityDiscount", () => {
  const tiers: QuantityTier[] = [
    { minQuantity: 5, discount: 5 },
    { minQuantity: 10, discount: 10 },
    { minQuantity: 20, discount: 20 },
  ];

  it("retorna 0 quando lista de tiers está vazia", () => {
    expect(resolveQuantityDiscount(100, [])).toBe(0);
  });

  it("retorna 0 quando totalQty é 0", () => {
    expect(resolveQuantityDiscount(0, tiers)).toBe(0);
  });

  it("retorna 0 quando totalQty é negativo", () => {
    expect(resolveQuantityDiscount(-5, tiers)).toBe(0);
  });

  it("retorna 0 quando quantidade está abaixo do menor tier", () => {
    expect(resolveQuantityDiscount(4, tiers)).toBe(0);
  });

  it("aplica boundary exata do menor tier", () => {
    expect(resolveQuantityDiscount(5, tiers)).toBe(5);
  });

  it("aplica tier intermediário quando quantidade está na faixa", () => {
    expect(resolveQuantityDiscount(15, tiers)).toBe(10);
  });

  it("aplica maior tier aplicável (last-match descendente) quando quantidade alcança o topo", () => {
    expect(resolveQuantityDiscount(50, tiers)).toBe(20);
  });

  it("ordena tiers desordenados antes de aplicar", () => {
    const unsorted: QuantityTier[] = [
      { minQuantity: 20, discount: 20 },
      { minQuantity: 5, discount: 5 },
      { minQuantity: 10, discount: 10 },
    ];
    expect(resolveQuantityDiscount(15, unsorted)).toBe(10);
  });
});

// ── applyDiscount — fórmula + piso 0.01 ──

describe("applyDiscount", () => {
  it("retorna preço inalterado quando desconto é 0", () => {
    expect(applyDiscount(2.5, 0)).toBe(2.5);
  });

  it("retorna preço inalterado quando desconto é negativo", () => {
    expect(applyDiscount(2.5, -10)).toBe(2.5);
  });

  it("aplica desconto válido — 10% sobre R$2.50 = R$2.25", () => {
    expect(applyDiscount(2.5, 10)).toBe(2.25);
  });

  it("aplica desconto de 50%", () => {
    expect(applyDiscount(10, 50)).toBe(5);
  });

  it("piso 0.01 — desconto de 100% retorna 0.01 (nunca zero)", () => {
    expect(applyDiscount(10, 100)).toBe(0.01);
  });

  it("piso 0.01 — desconto que zeraria preço retorna 0.01", () => {
    expect(applyDiscount(0.005, 99)).toBe(0.01);
  });
});

// ── buildStickerSectionMap — server-side, achata estrutura hierárquica ──

describe("buildStickerSectionMap", () => {
  it("constrói mapa code→sectionName a partir de múltiplas seções", () => {
    const sections = [
      { name: "Brasil", stickers: [{ code: "BRA1" }, { code: "BRA2" }] },
      { name: "Argentina", stickers: [{ code: "ARG1" }] },
    ];
    expect(buildStickerSectionMap(sections)).toEqual({
      BRA1: "Brasil",
      BRA2: "Brasil",
      ARG1: "Argentina",
    });
  });

  it("retorna mapa vazio quando não há seções", () => {
    expect(buildStickerSectionMap([])).toEqual({});
  });

  it("retorna mapa vazio quando seções existem mas não têm stickers", () => {
    expect(buildStickerSectionMap([{ name: "Brasil", stickers: [] }])).toEqual({});
  });

  it(
    "comportamento atual em duplicata: última seção ganha (overwrite silencioso) — " +
      "regressão capturada para refactor futuro",
    () => {
      const sections = [
        { name: "PrimeiraSecao", stickers: [{ code: "DUP1" }] },
        { name: "SegundaSecao", stickers: [{ code: "DUP1" }] },
      ];
      expect(buildStickerSectionMap(sections)).toEqual({
        DUP1: "SegundaSecao",
      });
    }
  );

  it("preserva ordem de inserção dentro de uma mesma seção (última figurinha vence em duplicata interna)", () => {
    const sections = [
      { name: "Brasil", stickers: [{ code: "X1" }, { code: "X1" }] },
    ];
    expect(buildStickerSectionMap(sections)).toEqual({ X1: "Brasil" });
  });
});
