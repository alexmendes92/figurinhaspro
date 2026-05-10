// PROTÓTIPO — galeria interna com 5 variantes lado a lado (output/05-prototipo-definicao.md §3.a item 3.3).
// Uso: fundador escolhe qual variante mandar pra cada Rodrigo. NÃO mostrar pros Rodrigos.
// Acessível via /proto/modal-roi/galeria

import Link from "next/link";
import { COPY_VARIANTS, VARIANT_KEYS } from "@/components/proto/copy-variants";
import { PlanLimitModalPreview } from "@/components/proto/plan-limit-modal-preview";

const DEFAULT_DENIED = 15;
const DEFAULT_PRICE = 12.5;

export default function ModalRoiGaleriaPage() {
  return (
    <main className="min-h-dvh bg-[#0b0e14] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-amber-400">
            Galeria interna · não compartilhar
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            5 variantes do modal de limite
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Compare as 5 variantes lado a lado e escolha qual mandar pra cada Rodrigo. Cada card
            tem o link individual com cenário padrão (denied={DEFAULT_DENIED},
            priceAvg=R$ {DEFAULT_PRICE.toFixed(2)}).
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {VARIANT_KEYS.map((variant) => {
            const config = COPY_VARIANTS[variant];
            return (
              <section
                key={variant}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-white">{config.name}</h2>
                    <p className="mt-0.5 text-xs text-zinc-500">{config.hypothesis}</p>
                  </div>
                  <Link
                    href={`/proto/modal-roi/${variant}`}
                    className="shrink-0 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60"
                  >
                    Abrir
                  </Link>
                </div>
                <div className="rounded-xl bg-[#0b0e14] p-3">
                  <PlanLimitModalPreview
                    denied={DEFAULT_DENIED}
                    priceAvg={DEFAULT_PRICE}
                    variant={variant}
                  />
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
