export interface AutoLoginInput {
  vercelEnv: string | undefined;
  expectedToken: string | undefined;
  providedToken: string | null;
  nextPath: string | null;
}

export type AutoLoginDecision =
  | { kind: "not-found"; reason: string }
  | { kind: "unauthorized"; reason: string }
  | { kind: "allow"; nextPath: string };

const DEFAULT_NEXT = "/painel";

export function evaluateAutoLogin(input: AutoLoginInput): AutoLoginDecision {
  if (input.vercelEnv === "production") {
    return { kind: "not-found", reason: "production environment" };
  }
  if (!input.expectedToken) {
    return { kind: "not-found", reason: "DEV_AUTO_LOGIN_TOKEN not configured" };
  }
  if (!input.providedToken || input.providedToken !== input.expectedToken) {
    return { kind: "unauthorized", reason: "token mismatch" };
  }
  return { kind: "allow", nextPath: sanitizeNextPath(input.nextPath) };
}

// Bloqueia open-redirect: só aceita paths internos do app.
function sanitizeNextPath(raw: string | null): string {
  if (!raw) return DEFAULT_NEXT;
  if (!raw.startsWith("/")) return DEFAULT_NEXT;
  if (raw.startsWith("//")) return DEFAULT_NEXT;
  return raw;
}
