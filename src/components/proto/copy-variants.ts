// PROTÓTIPO — uso interno do fundador para validar H1 (modal de limite contextual com ROI converte FREE→PRO).
// Definido em output/05-prototipo-definicao.md §3.a item 2.1. Nunca importado pelo código de produção.

export type ModalVariant = "v1" | "v2" | "v3" | "v4" | "v5";

type VariantConfig = {
  name: string;
  hypothesis: string;
  headerText: string;
  ctaText: string;
  secondaryText: string;
  badgeText?: string;
  highlightColor: "amber" | "red";
};

export const COPY_VARIANTS: Record<ModalVariant, VariantConfig> = {
  v1: {
    name: "V1 — Controle (R$ 49/mês)",
    hypothesis: "Pricing direto convence quando ROI fica explícito",
    headerText: "Você atingiu 100/100 figurinhas no FREE",
    ctaText: "Assinar PRO — R$ 49/mês",
    secondaryText: "Continuar no FREE",
    highlightColor: "amber",
  },
  v2: {
    name: "V2 — R$ 1,60/dia",
    hypothesis: "Diluir preço em diário reduz fricção psicológica",
    headerText: "Você atingiu 100/100 figurinhas no FREE",
    ctaText: "Assinar PRO — R$ 1,60/dia",
    secondaryText: "Continuar no FREE",
    highlightColor: "amber",
  },
  v3: {
    name: "V3 — Comparação concreta (2 pacotes)",
    hypothesis: "Comparação com o produto físico vence comparação genérica",
    headerText: "Você atingiu 100/100 figurinhas no FREE",
    ctaText: "Assinar PRO — menos que 2 pacotes/mês",
    secondaryText: "Continuar no FREE",
    highlightColor: "amber",
  },
  v4: {
    name: "V4 — ROI explícito (4 vendas)",
    hypothesis: "Tempo até payback é o gatilho de decisão",
    headerText: "Você atingiu 100/100 figurinhas no FREE",
    ctaText: "Assinar PRO — paga em 4 vendas",
    secondaryText: "Continuar no FREE",
    badgeText: "ROI em 4 vendas",
    highlightColor: "amber",
  },
  v5: {
    name: "V5 — Escassez Copa",
    hypothesis: "Janela temporal da Copa pesa mais que ROI racional",
    headerText: "Copa termina em 81 dias. Você está perdendo vendas no FREE.",
    ctaText: "Garantir PRO antes da Copa — R$ 49/mês",
    secondaryText: "Continuar no FREE (perder vendas)",
    badgeText: "Copa 2026",
    highlightColor: "red",
  },
};

export const VARIANT_KEYS: ModalVariant[] = ["v1", "v2", "v3", "v4", "v5"];

export function isValidVariant(value: string | undefined): value is ModalVariant {
  return value === "v1" || value === "v2" || value === "v3" || value === "v4" || value === "v5";
}

export function getVariant(value: string | undefined): ModalVariant {
  return isValidVariant(value) ? value : "v1";
}
