import Link from "next/link";

interface GettingStartedProps {
  hasStock: boolean;
  hasPrices: boolean;
  hasPhone: boolean;
  storeUrl: string;
}

const steps = [
  {
    label: "Adicione figurinhas ao estoque",
    href: "/painel/estoque",
    key: "hasStock" as const,
    icon: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
  },
  {
    label: "Configure seus precos",
    href: "/painel/precos",
    key: "hasPrices" as const,
    icon: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z",
  },
  {
    label: "Adicione seu WhatsApp",
    href: "/painel/loja",
    key: "hasPhone" as const,
    icon: "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z",
  },
];

export default function GettingStarted({
  hasStock,
  hasPrices,
  hasPhone,
  storeUrl,
}: GettingStartedProps) {
  const flags = { hasStock, hasPrices, hasPhone };
  const completed = Object.values(flags).filter(Boolean).length;
  const total = steps.length;

  if (completed === total) return null;

  return (
    <div className="rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.04] to-transparent p-5 sm:p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">Configure sua loja</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {completed} de {total} concluidos
          </p>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`w-8 h-1.5 rounded-full ${i < completed ? "bg-amber-500" : "bg-white/[0.06]"}`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step) => {
          const done = flags[step.key];
          return (
            <Link
              key={step.key}
              href={step.href}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                done
                  ? "bg-white/[0.02] opacity-60"
                  : "bg-white/[0.03] border border-white/[0.06] hover:border-amber-500/20 hover:bg-amber-500/[0.03]"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  done ? "bg-emerald-500/10" : "bg-amber-500/10"
                }`}
              >
                {done ? (
                  <svg
                    className="w-4 h-4 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-amber-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                  </svg>
                )}
              </div>
              <span
                className={`text-[13px] font-medium ${done ? "text-gray-500 line-through" : "text-white"}`}
              >
                {step.label}
              </span>
              {!done && (
                <svg
                  className="w-4 h-4 text-gray-600 ml-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
