import { beforeEach, describe, expect, it, vi } from "vitest";

describe("imgUrl", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("mantem URL absoluta intacta", async () => {
    vi.stubEnv("NEXT_PUBLIC_IMAGES_BASE_URL", "https://figurinhas.arenacards.com.br");
    const { imgUrl } = await import("../images");

    expect(imgUrl("https://cdn.externo.com/teste.webp")).toBe(
      "https://cdn.externo.com/teste.webp"
    );
  });

  it("prefixa paths relativos com a base publica", async () => {
    vi.stubEnv("NEXT_PUBLIC_IMAGES_BASE_URL", "https://figurinhas.arenacards.com.br");
    const { imgUrl } = await import("../images");

    expect(imgUrl("/covers/2022.webp")).toBe(
      "https://figurinhas.arenacards.com.br/covers/2022.webp"
    );
    expect(imgUrl("stickers/panini_fifa_world_cup_2022/images/FWC1.jpg")).toBe(
      "https://figurinhas.arenacards.com.br/stickers/panini_fifa_world_cup_2022/images/FWC1.jpg"
    );
  });

  it("cai para path local normalizado quando a base nao esta definida", async () => {
    vi.stubEnv("NEXT_PUBLIC_IMAGES_BASE_URL", "");
    const { imgUrl } = await import("../images");

    expect(imgUrl("/covers/2022.webp")).toBe("/covers/2022.webp");
    expect(imgUrl("covers/2022.webp")).toBe("/covers/2022.webp");
  });

  it("normaliza multiplas barras iniciais", async () => {
    vi.stubEnv("NEXT_PUBLIC_IMAGES_BASE_URL", "https://figurinhas.arenacards.com.br/");
    const { imgUrl } = await import("../images");

    expect(imgUrl("//covers/2022.webp")).toBe(
      "https://figurinhas.arenacards.com.br/covers/2022.webp"
    );
  });

  it("retorna string vazia para valores nulos", async () => {
    vi.stubEnv("NEXT_PUBLIC_IMAGES_BASE_URL", "https://figurinhas.arenacards.com.br");
    const { imgUrl } = await import("../images");

    expect(imgUrl("")).toBe("");
    expect(imgUrl(undefined)).toBe("");
    expect(imgUrl(null)).toBe("");
  });
});
