import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL é obrigatório")
    .startsWith("postgres", "DATABASE_URL deve começar com 'postgres'"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET deve ter pelo menos 32 caracteres"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_IMAGES_BASE_URL: z.string().url().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_BASE: z.string().optional(),
  // Token opt-in para bypass de login em preview/dev (NUNCA habilitar em prod).
  // Ver src/app/api/dev/auto-login/route.ts — triple-guard ativa o endpoint.
  DEV_AUTO_LOGIN_TOKEN: z
    .string()
    .min(32, "DEV_AUTO_LOGIN_TOKEN deve ter >=32 chars (use openssl rand -hex 32)")
    .optional(),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const isDev = process.env.NODE_ENV !== "production";

  // Em dev, aceitar fallbacks
  if (isDev) {
    return {
      DATABASE_URL: process.env.DATABASE_URL || "",
      SESSION_SECRET:
        process.env.SESSION_SECRET || "dev-secret-must-be-at-least-32-characters-long!",
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_IMAGES_BASE_URL: process.env.NEXT_PUBLIC_IMAGES_BASE_URL,
      DEV_AUTO_LOGIN_TOKEN: process.env.DEV_AUTO_LOGIN_TOKEN,
    };
  }

  // Em produção, validar rigorosamente
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `  ✗ ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`\n⚠️  Variáveis de ambiente inválidas:\n${errors}\n`);
  }

  return result.data;
}

export const env = validateEnv();
