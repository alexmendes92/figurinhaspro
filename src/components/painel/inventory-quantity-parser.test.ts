import { parseQuantityInput } from "./inventory-quantity-parser";

describe("parseQuantityInput", () => {
  it("valor vazio → inválido, mantém qty atual, não atualiza", () => {
    expect(parseQuantityInput("", 5)).toEqual({ valid: false, value: 5, shouldUpdate: false });
    expect(parseQuantityInput("   ", 5)).toEqual({ valid: false, value: 5, shouldUpdate: false });
  });

  it("valor totalmente não-numérico → inválido", () => {
    expect(parseQuantityInput("abc", 3)).toEqual({ valid: false, value: 3, shouldUpdate: false });
    expect(parseQuantityInput("!@#", 3)).toEqual({ valid: false, value: 3, shouldUpdate: false });
  });

  it("string mista com prefixo numérico → aceita o prefixo (parseInt forgiving)", () => {
    // Comportamento intencional: UX de input parcial. `"1.5.2"` vira 1, `"12abc"` vira 12.
    // Trade-off: aceitar input forgiving > rejeitar e frustrar user.
    expect(parseQuantityInput("1.5.2", 3)).toEqual({ valid: true, value: 1, shouldUpdate: true });
    expect(parseQuantityInput("12abc", 3)).toEqual({ valid: true, value: 12, shouldUpdate: true });
  });

  it("valor inteiro positivo válido → retorna valor", () => {
    expect(parseQuantityInput("7", 3)).toEqual({ valid: true, value: 7, shouldUpdate: true });
  });

  it("valor igual ao atual → válido mas não atualiza (evita fetch desnecessário)", () => {
    expect(parseQuantityInput("3", 3)).toEqual({ valid: true, value: 3, shouldUpdate: false });
  });

  it("negativo → clampa em 0", () => {
    expect(parseQuantityInput("-5", 3)).toEqual({ valid: true, value: 0, shouldUpdate: true });
  });

  it("zero → vira clear (qty=0)", () => {
    expect(parseQuantityInput("0", 5)).toEqual({ valid: true, value: 0, shouldUpdate: true });
  });

  it("valor muito alto → clampa em 999 (sanity limit)", () => {
    expect(parseQuantityInput("99999", 5)).toEqual({ valid: true, value: 999, shouldUpdate: true });
    expect(parseQuantityInput("1000", 5)).toEqual({ valid: true, value: 999, shouldUpdate: true });
  });

  it("999 é o limite válido superior", () => {
    expect(parseQuantityInput("999", 5)).toEqual({ valid: true, value: 999, shouldUpdate: true });
  });

  it("decimal → parseado como int (truncado)", () => {
    expect(parseQuantityInput("3.7", 1)).toEqual({ valid: true, value: 3, shouldUpdate: true });
  });

  it("aceita espaços em volta", () => {
    expect(parseQuantityInput("  12  ", 1)).toEqual({ valid: true, value: 12, shouldUpdate: true });
  });
});
