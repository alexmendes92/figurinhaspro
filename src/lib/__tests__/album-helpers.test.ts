import { describe, it, expect } from "vitest";
import {
  calculateAlbumCoverage,
  getCoverageColor,
  isAlbumComplete,
} from "@/lib/album-helpers";

describe("calculateAlbumCoverage", () => {
  it("retorna percent=0 e missing=total quando nada em estoque", () => {
    expect(calculateAlbumCoverage(0, 670)).toEqual({ percent: 0, missing: 670 });
  });

  it("retorna percent=100 e missing=0 quando tudo em estoque", () => {
    expect(calculateAlbumCoverage(670, 670)).toEqual({ percent: 100, missing: 0 });
  });

  it("arredonda percent para inteiro mais proximo", () => {
    expect(calculateAlbumCoverage(536, 670)).toEqual({ percent: 80, missing: 134 });
  });

  it("retorna percent=0 quando total e 0 (evita divisao por zero)", () => {
    expect(calculateAlbumCoverage(0, 0)).toEqual({ percent: 0, missing: 0 });
  });

  it("clampa percent a 100 quando inStock excede total", () => {
    expect(calculateAlbumCoverage(700, 670)).toEqual({ percent: 100, missing: 0 });
  });
});

describe("getCoverageColor", () => {
  it("emerald para >= 80%", () => {
    expect(getCoverageColor(80)).toEqual({ bg: "bg-emerald-500", text: "text-emerald-400" });
    expect(getCoverageColor(100)).toEqual({ bg: "bg-emerald-500", text: "text-emerald-400" });
  });

  it("accent para 30-79%", () => {
    expect(getCoverageColor(30)).toEqual({ bg: "bg-accent-500", text: "text-accent-400" });
    expect(getCoverageColor(79)).toEqual({ bg: "bg-accent-500", text: "text-accent-400" });
  });

  it("zinc para < 30%", () => {
    expect(getCoverageColor(29)).toEqual({ bg: "bg-zinc-500", text: "text-zinc-400" });
    expect(getCoverageColor(0)).toEqual({ bg: "bg-zinc-500", text: "text-zinc-400" });
  });
});

describe("isAlbumComplete", () => {
  it("true quando inStock == total", () => {
    expect(isAlbumComplete({ inStock: 670, total: 670 })).toBe(true);
  });

  it("false quando inStock < total", () => {
    expect(isAlbumComplete({ inStock: 669, total: 670 })).toBe(false);
  });

  it("true quando inStock > total (cobertura excessiva conta como completo)", () => {
    expect(isAlbumComplete({ inStock: 700, total: 670 })).toBe(true);
  });

  it("false quando total e 0 (album sem stickers nao e completo)", () => {
    expect(isAlbumComplete({ inStock: 0, total: 0 })).toBe(false);
  });
});
