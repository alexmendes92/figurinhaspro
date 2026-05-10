import { evaluateAutoLogin } from "./handler";

const TOKEN = "a".repeat(32);

describe("evaluateAutoLogin", () => {
  it("retorna not-found em produção mesmo com token válido", () => {
    const result = evaluateAutoLogin({
      vercelEnv: "production",
      expectedToken: TOKEN,
      providedToken: TOKEN,
      nextPath: "/painel",
    });
    expect(result.kind).toBe("not-found");
  });

  it("retorna not-found quando DEV_AUTO_LOGIN_TOKEN não está setado", () => {
    const result = evaluateAutoLogin({
      vercelEnv: "preview",
      expectedToken: undefined,
      providedToken: TOKEN,
      nextPath: "/painel",
    });
    expect(result.kind).toBe("not-found");
  });

  it("retorna unauthorized quando token enviado não bate", () => {
    const result = evaluateAutoLogin({
      vercelEnv: "preview",
      expectedToken: TOKEN,
      providedToken: "b".repeat(32),
      nextPath: "/painel",
    });
    expect(result.kind).toBe("unauthorized");
  });

  it("retorna unauthorized quando token enviado está ausente", () => {
    const result = evaluateAutoLogin({
      vercelEnv: "preview",
      expectedToken: TOKEN,
      providedToken: null,
      nextPath: "/painel",
    });
    expect(result.kind).toBe("unauthorized");
  });

  it("permite quando tudo bate em preview", () => {
    const result = evaluateAutoLogin({
      vercelEnv: "preview",
      expectedToken: TOKEN,
      providedToken: TOKEN,
      nextPath: "/painel/estoque",
    });
    expect(result).toEqual({ kind: "allow", nextPath: "/painel/estoque" });
  });

  it("permite quando vercelEnv é undefined (dev local sem Vercel)", () => {
    const result = evaluateAutoLogin({
      vercelEnv: undefined,
      expectedToken: TOKEN,
      providedToken: TOKEN,
      nextPath: null,
    });
    expect(result).toEqual({ kind: "allow", nextPath: "/painel" });
  });

  it("bloqueia open-redirect com URL absoluta", () => {
    const result = evaluateAutoLogin({
      vercelEnv: "preview",
      expectedToken: TOKEN,
      providedToken: TOKEN,
      nextPath: "https://evil.com/phish",
    });
    expect(result).toEqual({ kind: "allow", nextPath: "/painel" });
  });

  it("bloqueia open-redirect com protocol-relative URL", () => {
    const result = evaluateAutoLogin({
      vercelEnv: "preview",
      expectedToken: TOKEN,
      providedToken: TOKEN,
      nextPath: "//evil.com/phish",
    });
    expect(result).toEqual({ kind: "allow", nextPath: "/painel" });
  });
});
