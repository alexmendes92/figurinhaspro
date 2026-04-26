import { describe, expect, it } from "vitest";
import { flagFor } from "./country-flags";

describe("flagFor", () => {
  describe("paises diretos (lookup basico)", () => {
    it("retorna flag de Russia", () => {
      expect(flagFor("Russia")).toBe("🇷🇺");
    });

    it("retorna flag de Brazil em ingles", () => {
      expect(flagFor("Brazil")).toBe("🇧🇷");
    });

    it("retorna flag de Brasil em portugues", () => {
      expect(flagFor("Brasil")).toBe("🇧🇷");
    });

    it("retorna flag de Spain", () => {
      expect(flagFor("Spain")).toBe("🇪🇸");
    });

    it("retorna flag de Espana sem acento", () => {
      expect(flagFor("Espana")).toBe("🇪🇸");
    });

    it("retorna flag de Espana com acento", () => {
      expect(flagFor("España")).toBe("🇪🇸");
    });

    it("retorna flag de Argentina", () => {
      expect(flagFor("Argentina")).toBe("🇦🇷");
    });

    it("retorna flag de Saudi Arabia", () => {
      expect(flagFor("Saudi Arabia")).toBe("🇸🇦");
    });

    it("retorna flag de Costa Rica", () => {
      expect(flagFor("Costa Rica")).toBe("🇨🇷");
    });
  });

  describe("variantes Coreia do Sul vs Norte", () => {
    it("Korea Republic = Coreia do Sul", () => {
      expect(flagFor("Korea Republic")).toBe("🇰🇷");
    });

    it("South Korea = Coreia do Sul", () => {
      expect(flagFor("South Korea")).toBe("🇰🇷");
    });

    it("Korea Rebublic (typo do source) = Coreia do Sul", () => {
      expect(flagFor("Korea Rebublic")).toBe("🇰🇷");
    });

    it("Korea DPR = Coreia do Norte", () => {
      expect(flagFor("Korea DPR")).toBe("🇰🇵");
    });
  });

  describe("variantes ortograficas Cote d'Ivoire", () => {
    it("Cote d'Ivoire (ASCII)", () => {
      expect(flagFor("Cote d'Ivoire")).toBe("🇨🇮");
    });

    it("Cote D'Ivoire (caps mistos)", () => {
      expect(flagFor("Cote D'Ivoire")).toBe("🇨🇮");
    });

    it("Côte d'Ivoire (acento)", () => {
      expect(flagFor("Côte d'Ivoire")).toBe("🇨🇮");
    });
  });

  describe("variantes diversas (case e acento)", () => {
    it("RUSSIA em maiusculas", () => {
      expect(flagFor("RUSSIA")).toBe("🇷🇺");
    });

    it("trim de espacos extras", () => {
      expect(flagFor("  russia  ")).toBe("🇷🇺");
    });

    it("Mexico com acento", () => {
      expect(flagFor("México")).toBe("🇲🇽");
    });

    it("Mexico sem acento", () => {
      expect(flagFor("Mexico")).toBe("🇲🇽");
    });

    it("Belgique-Belgie variant", () => {
      expect(flagFor("Belgique-Belgie")).toBe("🇧🇪");
    });

    it("Hellas = Greece", () => {
      expect(flagFor("Hellas")).toBe("🇬🇷");
    });

    it("Helvetia = Switzerland", () => {
      expect(flagFor("Helvetia")).toBe("🇨🇭");
    });

    it("Magyarorszag = Hungary", () => {
      expect(flagFor("Magyarorszag")).toBe("🇭🇺");
    });

    it("Polska = Poland", () => {
      expect(flagFor("Polska")).toBe("🇵🇱");
    });
  });

  describe("seleções históricas com ano no nome", () => {
    it("Brasil 1958 retorna flag do Brasil", () => {
      expect(flagFor("Brasil 1958")).toBe("🇧🇷");
    });

    it("Italia 1934 retorna flag da Italia", () => {
      expect(flagFor("Italia 1934")).toBe("🇮🇹");
    });

    it("England 1966 retorna flag UK", () => {
      expect(flagFor("England 1966")).toBe("🇬🇧");
    });

    it("Uruguay 1930 retorna flag do Uruguai", () => {
      expect(flagFor("Uruguay 1930")).toBe("🇺🇾");
    });
  });

  describe("Group prefix (Group A - Pais)", () => {
    it("Group A - Italia retorna flag da Italia", () => {
      expect(flagFor("Group A - Italia")).toBe("🇮🇹");
    });

    it("Group B - Argentina retorna flag da Argentina", () => {
      expect(flagFor("Group B - Argentina")).toBe("🇦🇷");
    });

    it("Group F - Egypt retorna flag do Egito", () => {
      expect(flagFor("Group F - Egypt")).toBe("🇪🇬");
    });
  });

  describe("não-país retorna null", () => {
    it("Introduction", () => {
      expect(flagFor("Introduction")).toBeNull();
    });

    it("Stadiums", () => {
      expect(flagFor("Stadiums")).toBeNull();
    });

    it("Host cities' posters", () => {
      expect(flagFor("Host cities' posters")).toBeNull();
    });

    it("FIFA World Cup Legends", () => {
      expect(flagFor("FIFA World Cup Legends")).toBeNull();
    });

    it("Official Match Ball", () => {
      expect(flagFor("Official Match Ball")).toBeNull();
    });

    it("McDonald's (Russia) = sponsorship, nao pais", () => {
      expect(flagFor("McDonald's (Russia)")).toBeNull();
    });

    it("Coca Cola (Mexico) = sponsorship, nao pais", () => {
      expect(flagFor("Coca Cola (Mexico)")).toBeNull();
    });

    it("Outras", () => {
      expect(flagFor("Outras")).toBeNull();
    });

    it("Special Edition", () => {
      expect(flagFor("Special Edition")).toBeNull();
    });

    it("Poster", () => {
      expect(flagFor("Poster")).toBeNull();
    });
  });

  describe("entidades extintas retornam null", () => {
    it("CCCP (URSS)", () => {
      expect(flagFor("CCCP")).toBeNull();
    });

    it("SSSR (URSS)", () => {
      expect(flagFor("SSSR")).toBeNull();
    });

    it("Ceskoslovensko (Tchecoslovaquia)", () => {
      expect(flagFor("Ceskoslovensko")).toBeNull();
    });

    it("Jugoslavija (Iugoslavia)", () => {
      expect(flagFor("Jugoslavija")).toBeNull();
    });

    it("East Germany", () => {
      expect(flagFor("East Germany")).toBeNull();
    });
  });

  describe("entrada inválida retorna null", () => {
    it("string vazia", () => {
      expect(flagFor("")).toBeNull();
    });

    it("apenas espaços", () => {
      expect(flagFor("   ")).toBeNull();
    });

    it("nome desconhecido", () => {
      expect(flagFor("Wakanda")).toBeNull();
    });
  });
});
