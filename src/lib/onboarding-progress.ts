export type OnboardingFieldId = "shopDescription" | "businessHours" | "paymentMethods";

export interface OnboardingProgressInput {
  shopDescription: string | null;
  businessHours: string | null;
  paymentMethods: string | null;
}

export interface OnboardingProgressResult {
  filledCount: number;
  total: number;
  percent: number;
  missing: OnboardingFieldId[];
}

const FIELDS: OnboardingFieldId[] = ["shopDescription", "businessHours", "paymentMethods"];

function isFilled(value: string | null): boolean {
  return !!value && value.trim().length > 0;
}

export function computeOnboardingProgress(
  input: OnboardingProgressInput
): OnboardingProgressResult {
  const total = FIELDS.length;
  const missing: OnboardingFieldId[] = [];
  let filledCount = 0;

  for (const field of FIELDS) {
    if (isFilled(input[field])) {
      filledCount++;
    } else {
      missing.push(field);
    }
  }

  const percent = Math.round((filledCount / total) * 100);

  return { filledCount, total, percent, missing };
}
