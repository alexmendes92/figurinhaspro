import { buildCounterText } from "./inventory-counter-text";

describe("buildCounterText", () => {
  const baseInput = {
    isSearching: false,
    filteredCount: 0,
    baseInStock: 0,
    baseCount: 0,
    filter: "all" as const,
    activeSection: "all" as const,
    visibleSectionName: null,
    filteredInVisibleSection: 0,
    saving: false,
  };

  it("modo busca → mostra apenas 'N encontradas'", () => {
    const result = buildCounterText({
      ...baseInput,
      isSearching: true,
      filteredCount: 5,
    });
    expect(result.primary).toBe("5 encontradas");
    expect(result.secondary).toBeNull();
    expect(result.contextHint).toBeNull();
  });

  it("Todas + filter=all → mostra apenas '{inStock}/{count} em estoque'", () => {
    const result = buildCounterText({
      ...baseInput,
      baseInStock: 667,
      baseCount: 675,
      filter: "all",
      activeSection: "all",
    });
    expect(result.primary).toBe("667/675 em estoque");
    expect(result.secondary).toBeNull();
    expect(result.contextHint).toBeNull();
  });

  it("Seção CONTENT + filter=missing → contador local sem hint", () => {
    const result = buildCounterText({
      ...baseInput,
      baseInStock: 5,
      baseCount: 8,
      filteredCount: 3,
      filter: "missing",
      activeSection: 0, // CONTENT
      visibleSectionName: "CONTENT",
      filteredInVisibleSection: 3,
    });
    expect(result.primary).toBe("5/8 em estoque");
    expect(result.secondary).toBe("3 exibidas");
    expect(result.contextHint).toBeNull(); // escopo já é específico
  });

  it("Todas + filter=missing + observer em CONTENT → contador global + hint contextual", () => {
    // Cenário do review original: user vê 3 cards mas contador diz 8
    const result = buildCounterText({
      ...baseInput,
      baseInStock: 667,
      baseCount: 675,
      filteredCount: 8, // 8 faltantes no álbum inteiro
      filter: "missing",
      activeSection: "all",
      visibleSectionName: "CONTENT",
      filteredInVisibleSection: 3, // só 3 faltantes nessa seção visível
    });
    expect(result.primary).toBe("667/675 em estoque");
    expect(result.secondary).toBe("8 exibidas");
    expect(result.contextHint).toBe("3 nesta seção: CONTENT");
  });

  it("Todas + filter=missing + observer em seção sem faltantes → hint não aparece se igual ao total", () => {
    // edge case: se filteredInVisibleSection === filteredCount, hint redundante
    const result = buildCounterText({
      ...baseInput,
      baseInStock: 5,
      baseCount: 8,
      filteredCount: 3,
      filter: "missing",
      activeSection: "all",
      visibleSectionName: "CONTENT",
      filteredInVisibleSection: 3,
    });
    expect(result.contextHint).toBeNull();
  });

  it("Todas + filter=in-stock → mesma lógica do missing", () => {
    const result = buildCounterText({
      ...baseInput,
      baseInStock: 667,
      baseCount: 675,
      filteredCount: 667,
      filter: "in-stock",
      activeSection: "all",
      visibleSectionName: "CONTENT",
      filteredInVisibleSection: 5,
    });
    expect(result.secondary).toBe("667 exibidas");
    expect(result.contextHint).toBe("5 nesta seção: CONTENT");
  });

  it("preserva flag saving em qualquer cenário", () => {
    const result = buildCounterText({ ...baseInput, saving: true });
    expect(result.saving).toBe(true);
  });
});
