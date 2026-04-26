import { computeOnboardingProgress } from "./onboarding-progress";

describe("computeOnboardingProgress", () => {
  it("retorna 0% quando nenhum campo está preenchido", () => {
    const result = computeOnboardingProgress({
      shopDescription: null,
      businessHours: null,
      paymentMethods: null,
    });
    expect(result).toEqual({
      filledCount: 0,
      total: 3,
      percent: 0,
      missing: ["shopDescription", "businessHours", "paymentMethods"],
    });
  });

  it("retorna 33% com 1 campo preenchido", () => {
    const result = computeOnboardingProgress({
      shopDescription: "Minha lojinha",
      businessHours: null,
      paymentMethods: null,
    });
    expect(result.filledCount).toBe(1);
    expect(result.percent).toBe(33);
    expect(result.missing).toEqual(["businessHours", "paymentMethods"]);
  });

  it("retorna 67% com 2 campos preenchidos", () => {
    const result = computeOnboardingProgress({
      shopDescription: "Loja",
      businessHours: "Seg-Sex 9h",
      paymentMethods: null,
    });
    expect(result.filledCount).toBe(2);
    expect(result.percent).toBe(67);
    expect(result.missing).toEqual(["paymentMethods"]);
  });

  it("retorna 100% com todos preenchidos", () => {
    const result = computeOnboardingProgress({
      shopDescription: "Loja",
      businessHours: "Seg-Sex 9h",
      paymentMethods: "PIX, Cartão",
    });
    expect(result).toEqual({
      filledCount: 3,
      total: 3,
      percent: 100,
      missing: [],
    });
  });

  it("trata whitespace puro como vazio", () => {
    const result = computeOnboardingProgress({
      shopDescription: "   ",
      businessHours: "\t\n",
      paymentMethods: "PIX",
    });
    expect(result.filledCount).toBe(1);
    expect(result.missing).toEqual(["shopDescription", "businessHours"]);
  });
});
