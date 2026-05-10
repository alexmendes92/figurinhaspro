// PROTÓTIPO — rota dinâmica para variantes nomeadas (output/05-prototipo-definicao.md §3.a item 3.2).
// Usa await params (Next 16). Acessível via /proto/modal-roi/v1 até /proto/modal-roi/v5.
// Permite ?denied e ?priceAvg via query params; variant vem do path.

import { notFound } from "next/navigation";
import { getVariant, isValidVariant } from "@/components/proto/copy-variants";
import { PlanLimitModalPreview } from "@/components/proto/plan-limit-modal-preview";

type RouteParams = Promise<{ variant: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseInteger(value: unknown, fallback: number): number {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseFloat(value: unknown, fallback: number): number {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function pickFirst(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function ModalRoiVariantPage({
  params,
  searchParams,
}: {
  params: RouteParams;
  searchParams: SearchParams;
}) {
  const { variant: rawVariant } = await params;
  if (!isValidVariant(rawVariant)) notFound();

  const queryParams = await searchParams;
  const denied = parseInteger(pickFirst(queryParams.denied), 15);
  const priceAvg = parseFloat(pickFirst(queryParams.priceAvg), 12.5);
  const variant = getVariant(rawVariant);

  return (
    <main className="relative min-h-dvh bg-[#0b0e14] px-4 py-8 sm:px-6 sm:py-12">
      <div className="relative z-10 flex min-h-[calc(100dvh-4rem)] items-center justify-center">
        <PlanLimitModalPreview denied={denied} priceAvg={priceAvg} variant={variant} />
      </div>
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-20 -translate-x-1/2 select-none rounded-full border border-amber-500/40 bg-[#0b0e14]/90 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-amber-300">
        Protótipo · variante {variant}
      </div>
    </main>
  );
}
