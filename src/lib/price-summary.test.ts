import { summarizeAlbumOverrides } from "./price-summary";

describe("summarizeAlbumOverrides", () => {
  it("retorna estado 'usando padrões' quando não há regras", () => {
    const result = summarizeAlbumOverrides(0);
    expect(result.isUsingDefaults).toBe(true);
    expect(result.count).toBe(0);
    expect(result.label).toBe("Usando preços padrão");
  });

  it("retorna singular 'personalização' quando há 1 regra", () => {
    const result = summarizeAlbumOverrides(1);
    expect(result.isUsingDefaults).toBe(false);
    expect(result.count).toBe(1);
    expect(result.label).toBe("1 personalização");
  });

  it("retorna plural 'personalizações' quando há mais de 1 regra", () => {
    const result = summarizeAlbumOverrides(3);
    expect(result.isUsingDefaults).toBe(false);
    expect(result.count).toBe(3);
    expect(result.label).toBe("3 personalizações");
  });

  it("trata contagem alta sem quebrar plural", () => {
    const result = summarizeAlbumOverrides(42);
    expect(result.label).toBe("42 personalizações");
    expect(result.isUsingDefaults).toBe(false);
  });

  it("trata input negativo como 'usando padrões' (defensivo)", () => {
    const result = summarizeAlbumOverrides(-5);
    expect(result.isUsingDefaults).toBe(true);
    expect(result.count).toBe(0);
    expect(result.label).toBe("Usando preços padrão");
  });
});
