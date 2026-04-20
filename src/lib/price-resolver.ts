/**
 * Resolução centralizada de preço — 3 eixos:
 * 1. Tipo de figurinha (regular/foil/shiny) — global ou por álbum
 * 2. Seção/país (ex: Brasil, Argentina) — ajuste FLAT ou OFFSET
 * 3. Quantidade — desconto progressivo por volume
 *
 * Hierarquia (da mais alta para mais baixa prioridade):
 *   Individual (customPrice) > Section rule > Album type rule > Global type rule > Default
 */

import { DEFAULT_PRICES } from "@/lib/sticker-types";

// ── Tipos ──

export interface SectionRule {
  sectionName: string;
  adjustType: "FLAT" | "OFFSET"; // FLAT = preço absoluto | OFFSET = +/- sobre preço base
  value: number;
}

export interface QuantityTier {
  minQuantity: number;
  discount: number; // percentual (ex: 10 = 10% off)
}

export interface PriceContext {
  /** Preço individual definido no estoque (Inventory.customPrice) */
  customPrice: number | null;
  /** Tipo da figurinha: "regular" | "foil" | "shiny" */
  stickerType: string;
  /** Nome da seção a que a figurinha pertence */
  sectionName: string;
  /** Regras de preço por tipo, específicas do álbum */
  albumTypeRules: Record<string, number>;
  /** Regras de preço por tipo, globais */
  globalTypeRules: Record<string, number>;
  /** Regras por seção/país */
  sectionRules: Map<string, SectionRule>;
}

// ── Resolução de preço unitário ──

/**
 * Resolve o preço unitário de uma figurinha considerando os 3 eixos.
 * Retorna o preço final em R$.
 */
export function resolveUnitPrice(ctx: PriceContext): number {
  // Eixo 0: Preço individual (máxima prioridade)
  if (ctx.customPrice != null && ctx.customPrice > 0) {
    return ctx.customPrice;
  }

  // Eixo 1: Preço base por tipo (album rule > global rule > default)
  const basePrice =
    ctx.albumTypeRules[ctx.stickerType] ??
    ctx.globalTypeRules[ctx.stickerType] ??
    DEFAULT_PRICES[ctx.stickerType] ??
    2.5;

  // Eixo 2: Ajuste por seção/país
  const sectionRule = ctx.sectionRules.get(ctx.sectionName);
  if (sectionRule) {
    if (sectionRule.adjustType === "FLAT") {
      return sectionRule.value;
    }
    // OFFSET: soma ao preço base (pode ser negativo, mas nunca abaixo de 0.01)
    return Math.max(0.01, basePrice + sectionRule.value);
  }

  return basePrice;
}

// ── Desconto por quantidade ──

/**
 * Calcula o percentual de desconto com base na quantidade total de um álbum no carrinho.
 * Retorna o percentual (ex: 10 para 10%).
 * Se não há tiers ou quantidade insuficiente, retorna 0.
 */
export function resolveQuantityDiscount(totalQty: number, tiers: QuantityTier[]): number {
  if (tiers.length === 0 || totalQty <= 0) return 0;

  // Ordena por minQuantity decrescente para encontrar o maior tier aplicável
  const sorted = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
  for (const tier of sorted) {
    if (totalQty >= tier.minQuantity) {
      return tier.discount;
    }
  }

  return 0;
}

/**
 * Aplica o desconto percentual ao preço unitário.
 * Ex: preço R$2.50 com 10% desconto → R$2.25
 */
export function applyDiscount(unitPrice: number, discountPercent: number): number {
  if (discountPercent <= 0) return unitPrice;
  return Math.max(0.01, unitPrice * (1 - discountPercent / 100));
}

// ── Helper: Monta mapa de seções (stickerCode → sectionName) ──

/**
 * Dado as seções de um álbum, cria um mapa de código da figurinha → nome da seção.
 * Usado no server para pre-calcular e enviar ao client.
 */
export function buildStickerSectionMap(
  sections: { name: string; stickers: { code: string }[] }[]
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const section of sections) {
    for (const sticker of section.stickers) {
      map[sticker.code] = section.name;
    }
  }
  return map;
}
