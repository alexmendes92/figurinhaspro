// ============================================================
// lib/bot-hmac.ts
// ============================================================
// HMAC compartilhado entre o bot (Dify/n8n) e os endpoints /api/bot/*.
// Usado quando o request persiste dados (ex: POST /api/bot/quote cria Order).
// GET continua aberto porque so le catalogo publico.
//
// Contrato do header:
//   x-bot-signature: ts=<unix-seconds>,v1=<hmac-sha256-hex>
//
// Manifest que entra no HMAC:
//   `${ts}.${rawBody}`
//
// Segredo: process.env.BOT_HMAC_SECRET (min 32 chars recomendado).
//
// Janela anti-replay: +/-300s (5 min). Request fora da janela e rejeitado.
//
// Em dev (NODE_ENV !== "production") sem secret configurado, a validacao
// e SKIPADA com warning em stderr - facilita curl local sem bot real.
// Em prod sem secret, retorna "missing-secret" e o endpoint DEVE bloquear.

import { createHmac, timingSafeEqual } from "node:crypto";

export type BotHmacResult =
  | { ok: true; mode: "verified" | "dev-skip" }
  | {
      ok: false;
      reason: "missing-secret" | "missing-header" | "invalid-format" | "stale" | "invalid";
    };

const REPLAY_WINDOW_SECONDS = 300;

/**
 * Valida assinatura HMAC de requisicao do bot.
 *
 * @param xBotSignature valor do header `x-bot-signature`
 * @param rawBody body cru exato (string) - MUST matchar byte-a-byte o que foi assinado
 * @param nowUnix timestamp atual em segundos (injetavel para teste). Default = Date.now()/1000
 */
export function verifyBotSignature(
  xBotSignature: string | null,
  rawBody: string,
  nowUnix: number = Math.floor(Date.now() / 1000),
): BotHmacResult {
  const secret = process.env.BOT_HMAC_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[bot-hmac] BOT_HMAC_SECRET nao configurado - SKIPANDO verificacao (dev only)",
      );
      return { ok: true, mode: "dev-skip" };
    }
    return { ok: false, reason: "missing-secret" };
  }

  if (!xBotSignature) {
    return { ok: false, reason: "missing-header" };
  }

  const parts = xBotSignature.split(",").map((p) => p.trim());
  const tsPart = parts.find((p) => p.startsWith("ts="));
  const v1Part = parts.find((p) => p.startsWith("v1="));
  const tsRaw = tsPart?.slice(3);
  const v1 = v1Part?.slice(3);

  if (!tsRaw || !v1 || !/^\d+$/.test(tsRaw) || !/^[0-9a-f]+$/i.test(v1)) {
    return { ok: false, reason: "invalid-format" };
  }

  const ts = Number(tsRaw);
  if (Math.abs(nowUnix - ts) > REPLAY_WINDOW_SECONDS) {
    return { ok: false, reason: "stale" };
  }

  const manifest = `${ts}.${rawBody}`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(v1, "hex");
    if (a.length !== b.length) return { ok: false, reason: "invalid" };
    return timingSafeEqual(a, b)
      ? { ok: true, mode: "verified" }
      : { ok: false, reason: "invalid" };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

/**
 * Gera assinatura. Util para tests e scripts internos (nao usado em prod pelo server).
 * O bot (Dify/n8n) gera do lado dele, mas ter essa funcao facilita curl de diagnostico.
 */
export function signBotBody(
  rawBody: string,
  nowUnix: number = Math.floor(Date.now() / 1000),
): { header: string; ts: number; v1: string } {
  const secret = process.env.BOT_HMAC_SECRET;
  if (!secret) throw new Error("BOT_HMAC_SECRET nao configurado");
  const manifest = `${nowUnix}.${rawBody}`;
  const v1 = createHmac("sha256", secret).update(manifest).digest("hex");
  return { header: `ts=${nowUnix},v1=${v1}`, ts: nowUnix, v1 };
}
