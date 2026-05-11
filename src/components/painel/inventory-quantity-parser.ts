export interface ParsedQuantity {
  valid: boolean;
  value: number;
  shouldUpdate: boolean;
}

const MAX_QUANTITY = 999;

// Parseia o input de qty do StickerCard quando o user clica no número
// pra editar diretamente. Devolve estado limpo pro componente decidir
// se chama updateQuantity (evita fetch quando valor não mudou).
export function parseQuantityInput(raw: string, current: number): ParsedQuantity {
  const trimmed = raw.trim();
  if (trimmed === "") return { valid: false, value: current, shouldUpdate: false };

  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isNaN(parsed)) return { valid: false, value: current, shouldUpdate: false };

  const clamped = Math.max(0, Math.min(MAX_QUANTITY, parsed));
  return { valid: true, value: clamped, shouldUpdate: clamped !== current };
}
