/**
 * Constantes centralizadas para tipos de figurinha.
 * Todos os componentes que exibem labels de tipo devem importar daqui.
 * O valor interno ("regular", "foil", "shiny") NUNCA muda — apenas labels visíveis ao usuário.
 */

export const STICKER_TYPES = ["regular", "foil", "shiny"] as const;
export type StickerType = (typeof STICKER_TYPES)[number];

export interface StickerTypeConfig {
  type: StickerType;
  label: string; // "Normal", "Especial (Foil)", "Brilhante (Shiny)"
  shortLabel: string; // "Normal", "Especial", "Brilhante"
  desc: string;
  color: string; // text color class
  bg: string; // bg + border classes
  badgeClass: string; // badge compact style
  defaultPrice: number;
  icon: string; // SVG path
}

export const STICKER_TYPE_CONFIG: StickerTypeConfig[] = [
  {
    type: "regular",
    label: "Normal",
    shortLabel: "Normal",
    desc: "Figurinhas comuns — maioria do álbum",
    color: "text-zinc-400",
    bg: "bg-zinc-500/8 border-zinc-500/15",
    badgeClass: "bg-zinc-500/80 text-white",
    defaultPrice: 2.5,
    icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75z",
  },
  {
    type: "foil",
    label: "Especial (Foil)",
    shortLabel: "Especial",
    desc: "Figurinhas metalizadas, bordas douradas, escudos",
    color: "text-[var(--accent)]",
    bg: "bg-[var(--accent-dim)] border-[var(--accent-border)]",
    badgeClass: "bg-amber-500/80 text-black",
    defaultPrice: 5.0,
    icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z",
  },
  {
    type: "shiny",
    label: "Brilhante (Shiny)",
    shortLabel: "Brilhante",
    desc: "Figurinhas com efeito brilho, holográficas",
    color: "text-purple-400",
    bg: "bg-purple-500/8 border-purple-500/15",
    badgeClass: "bg-purple-500/80 text-white",
    defaultPrice: 4.0,
    icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
  },
];

/** Map rápido para lookup por tipo */
const configMap = new Map(STICKER_TYPE_CONFIG.map((c) => [c.type, c]));

/** Retorna config completa de um tipo. Fallback para "regular" se tipo desconhecido. */
export function getStickerTypeConfig(type: string): StickerTypeConfig {
  return configMap.get(type as StickerType) ?? STICKER_TYPE_CONFIG[0];
}

/** Retorna label completa: "Normal", "Especial (Foil)", "Brilhante (Shiny)" */
export function getStickerTypeLabel(type: string): string {
  return getStickerTypeConfig(type).label;
}

/** Retorna label curta: "Normal", "Especial", "Brilhante" */
export function getStickerTypeShortLabel(type: string): string {
  return getStickerTypeConfig(type).shortLabel;
}

/** Retorna preço default de um tipo */
export function getDefaultPrice(type: string): number {
  return getStickerTypeConfig(type).defaultPrice;
}

/** Map de preços default: { regular: 2.5, foil: 5.0, shiny: 4.0 } */
export const DEFAULT_PRICES: Record<string, number> = Object.fromEntries(
  STICKER_TYPE_CONFIG.map((c) => [c.type, c.defaultPrice])
);
