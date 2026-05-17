/**
 * Submete pedido pra /api/orders com tratamento tipado de erro.
 *
 * Spec: thoughts/planos/2026-05-17-seguranca-pedido.md Fase 3 — extrair handler
 * do JSX pra função testável e garantir que cart só limpa em 2xx.
 *
 * @param fetchFn injetável pra testes — default usa window.fetch.
 */

export interface SubmitOrderItem {
  albumSlug: string;
  stickerCode: string;
  stickerName: string;
  quantity: number;
  unitPrice: number;
}

export interface SubmitOrderInput {
  sellerSlug: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  channel: "SYSTEM" | "WHATSAPP" | "MANUAL";
  notes?: string;
  items: SubmitOrderItem[];
}

export type SubmitOrderErrorCode =
  | "price_mismatch"
  | "out_of_stock"
  | "album_not_found"
  | "plan_limit"
  | "validation"
  | "network"
  | "server";

export type SubmitOrderResult =
  | { ok: true; order: { id: string; totalPrice: number } }
  | { ok: false; error: SubmitOrderErrorCode; message: string; status?: number };

function mapStatusToError(
  status: number,
  payload: { error?: string } | null
): SubmitOrderErrorCode {
  if (status === 422) return "price_mismatch";
  if (status === 409) return "out_of_stock";
  if (status === 404 && payload?.error === "album_not_found") return "album_not_found";
  if (status === 403) return "plan_limit";
  if (status === 400) return "validation";
  return "server";
}

export async function submitOrder(
  input: SubmitOrderInput,
  fetchFn: typeof fetch = fetch
): Promise<SubmitOrderResult> {
  let response: Response;
  try {
    response = await fetchFn("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Falha de rede";
    return { ok: false, error: "network", message };
  }

  const payload = (await response.json().catch(() => null)) as
    | { id?: string; totalPrice?: number; error?: string; message?: string }
    | null;

  if (response.ok && payload?.id != null) {
    return {
      ok: true,
      order: { id: payload.id, totalPrice: payload.totalPrice ?? 0 },
    };
  }

  return {
    ok: false,
    error: mapStatusToError(response.status, payload),
    message: payload?.message ?? payload?.error ?? `Erro ${response.status}`,
    status: response.status,
  };
}
