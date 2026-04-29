"use client";

// PROTÓTIPO — modal isolado que valida hipótese H1 (output/05-prototipo-definicao.md §3.a item 2.2).
// Mock: ROI calculado client-side a partir de props. Sem auth, Prisma, Stripe ou telemetria.
// CTA "Assinar PRO" não redireciona — só dispara alert + console.log para captura de feedback qualitativo.

import { COPY_VARIANTS, type ModalVariant } from "./copy-variants";

type PlanLimitModalPreviewProps = {
  denied: number;
  priceAvg: number;
  variant: ModalVariant;
};

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export function PlanLimitModalPreview({
  denied,
  priceAvg,
  variant,
}: PlanLimitModalPreviewProps) {
  const config = COPY_VARIANTS[variant];
  const gmv = denied * priceAvg;
  const isUrgent = config.highlightColor === "red";

  function handleCtaClick() {
    const payload = { variant, denied, priceAvg, gmv };
    console.log("[proto] CTA clicked", payload);
    if (typeof window !== "undefined") {
      window.alert(
        "Você clicaria aqui — obrigado pelo feedback! (este é um protótipo, não cobra nada)",
      );
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="proto-modal-title"
      className="relative mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#111318] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.55)] sm:p-8"
    >
      <button
        type="button"
        aria-label="Fechar"
        className="absolute right-4 top-4 rounded-full p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>

      {config.badgeText && (
        <div
          className={`mb-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${
            isUrgent
              ? "border-red-500/40 bg-red-500/10 text-red-300"
              : "border-amber-500/40 bg-amber-500/10 text-amber-300"
          }`}
        >
          {config.badgeText}
        </div>
      )}

      <h2
        id="proto-modal-title"
        className={`text-balance text-base font-semibold leading-snug sm:text-lg ${
          isUrgent ? "text-red-200" : "text-white"
        }`}
      >
        {config.headerText}
      </h2>

      <hr className="my-5 border-white/10" />

      <p className="text-sm text-zinc-400">No PRO, você teria adicionado as últimas</p>

      <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-6 text-center">
        <div className="font-mono text-5xl font-bold tabular-nums text-amber-300 sm:text-6xl">
          {denied}
        </div>
        <div className="mt-1 text-sm font-medium text-amber-200/80">
          {denied === 1 ? "figurinha" : "figurinhas"}
        </div>
      </div>

      <div className="mt-5 space-y-1">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Estimativa de vendas perdidas
        </p>
        <p className="text-2xl font-semibold text-white">{formatBRL(gmv)}</p>
        <p className="text-xs text-zinc-500">
          ({denied} × {formatBRL(priceAvg)} preço médio)
        </p>
      </div>

      <button
        type="button"
        onClick={handleCtaClick}
        className={`mt-6 w-full rounded-xl px-4 py-3 text-base font-semibold shadow-[0_8px_24px_rgba(245,158,11,0.25)] transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60 active:scale-[0.99] ${
          isUrgent
            ? "bg-red-500 text-white hover:bg-red-400"
            : "bg-amber-400 text-[#0b0e14] hover:bg-amber-300"
        }`}
      >
        {config.ctaText}
      </button>

      <button
        type="button"
        className="mt-3 block w-full rounded-lg px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60"
      >
        {config.secondaryText}
      </button>
    </div>
  );
}
