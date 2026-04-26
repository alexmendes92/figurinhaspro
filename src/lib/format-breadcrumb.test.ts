import { describe, expect, it } from "vitest";
import { formatCrumbSegment } from "./format-breadcrumb";

describe("formatCrumbSegment", () => {
  it("substitui underscores por espacos e capitaliza cada palavra", () => {
    expect(formatCrumbSegment("panini_fifa_world_cup_2018")).toBe("Panini Fifa World Cup 2018");
  });

  it("preserva numeros no slug", () => {
    expect(formatCrumbSegment("copa_2022")).toBe("Copa 2022");
  });

  it("trata segmento sem underscore (apenas capitaliza primeira letra)", () => {
    expect(formatCrumbSegment("estoque")).toBe("Estoque");
  });

  it("trata segmento sem underscore com varias palavras existentes", () => {
    expect(formatCrumbSegment("dashboard")).toBe("Dashboard");
  });

  it("string vazia retorna string vazia", () => {
    expect(formatCrumbSegment("")).toBe("");
  });

  it("apenas underscore retorna apenas espaco", () => {
    expect(formatCrumbSegment("_")).toBe(" ");
  });

  it("trata underscores consecutivos como espacos consecutivos", () => {
    expect(formatCrumbSegment("foo__bar")).toBe("Foo  Bar");
  });

  it("preserva CAPS originais ao capitalizar", () => {
    // Implementacao deve apenas capitalizar a primeira letra de cada palavra,
    // sem forcar lowercase no resto (mantem 'A' de 'API' se vier em CAPS).
    expect(formatCrumbSegment("api_keys")).toBe("Api Keys");
  });

  it("input com primeira letra ja maiuscula nao afeta", () => {
    expect(formatCrumbSegment("Sales_Report")).toBe("Sales Report");
  });

  it("trata segmento numerico puro", () => {
    expect(formatCrumbSegment("2018")).toBe("2018");
  });

  it("trata hifens preservando-os", () => {
    expect(formatCrumbSegment("foo-bar")).toBe("Foo-bar");
  });
});
