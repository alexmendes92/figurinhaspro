// PROTÓTIPO — rota base do modal de ROI (output/05-prototipo-definicao.md §3.a item 3.1).
// Lê query params (denied, priceAvg, variant) e renderiza modal sobre fundo simulado.
// Default: denied=15, priceAvg=12.50, variant=v1.
// Acessível via /proto/modal-roi?denied=15&priceAvg=12.50&variant=v1

import { getVariant } from "@/components/proto/copy-variants";
import { PlanLimitModalPreview } from "@/components/proto/plan-limit-modal-preview";

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

export default async function ModalRoiPrototypePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const denied = parseInteger(pickFirst(params.denied), 15);
  const priceAvg = parseFloat(pickFirst(params.priceAvg), 12.5);
  const variant = getVariant(pickFirst(params.variant));

  return (
    <main className="relative min-h-dvh bg-[#0b0e14] px-4 py-8 sm:px-6 sm:py-12">
      <FakePainelBackground />
      <div className="relative z-10 flex min-h-[calc(100dvh-4rem)] items-center justify-center">
        <PlanLimitModalPreview denied={denied} priceAvg={priceAvg} variant={variant} />
      </div>
      <PrototypeBadge />
    </main>
  );
}

function FakePainelBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 select-none opacity-30 blur-sm"
    >
      <div className="px-4 sm:px-6">
        <div className="mt-4 h-12 rounded-xl border border-white/10 bg-white/[0.03]" />
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="h-24 rounded-xl border border-white/10 bg-white/[0.04]" />
          <div className="h-24 rounded-xl border border-white/10 bg-white/[0.04]" />
          <div className="h-24 rounded-xl border border-white/10 bg-white/[0.04]" />
        </div>
        <div className="mt-6 h-64 rounded-xl border border-white/10 bg-white/[0.04]" />
        <div className="mt-4 h-32 rounded-xl border border-white/10 bg-white/[0.04]" />
      </div>
    </div>
  );
}

function PrototypeBadge() {
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-20 -translate-x-1/2 select-none rounded-full border border-amber-500/40 bg-[#0b0e14]/90 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-amber-300 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
      Protótipo · não cobra
    </div>
  );
}
