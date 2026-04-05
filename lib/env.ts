import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatório").startsWith("postgres", "DATABASE_URL deve começar com 'postgres'"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET deve ter pelo menos 32 caracteres"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const isDev = process.env.NODE_ENV !== "production";

  // Em dev, aceitar fallbacks
  if (isDev) {
    return {
      DATABASE_URL: process.env.DATABASE_URL || "",
      SESSION_SECRET: process.env.SESSION_SECRET || "dev-secret-must-be-at-least-32-characters-long!",
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    };
  }

  // Em produção, validar rigorosamente
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `  ✗ ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `\n⚠️  Variáveis de ambiente inválidas:\n${errors}\n`
    );
  }

  return result.data;
}

export const env = validateEnv();
