import Link from "next/link";

export type AlertKind = "expiring" | "low-stock" | "no-prices" | "no-phone" | "empty";

export interface DashboardAlert {
  kind: AlertKind;
  title: string;
  detail: string;
  severity: "high" | "med" | "info";
  href?: string;
  cta?: string;
}

const ICON: Record<AlertKind, React.ReactNode> = {
  expiring: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M12 2s4 4 4 8a4 4 0 1 1-8 0c0-1.5.5-2.5 1-3.5C7 9 4 11 4 15a8 8 0 0 0 16 0c0-5-4-8-8-13z" />
    </svg>
  ),
  "low-stock": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M12 2 2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  "no-prices": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M20.59 13.41 13 21a2 2 0 0 1-2.83 0l-7-7A2 2 0 0 1 2.59 12L3 4l8-.41a2 2 0 0 1 1.41.59l8.17 8.17a2 2 0 0 1 0 2.83z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  ),
  "no-phone": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M20 12a8 8 0 1 1-3-6.24L20 4l-1 3.3A8 8 0 0 1 20 12z" />
      <path d="M8 10c1 3 3 5 6 6l1.5-1.5a1 1 0 0 1 1-.25l2 .5a1 1 0 0 1 .75 1V17a2 2 0 0 1-2 2C11 19 5 13 5 8a2 2 0 0 1 2-2h1.2a1 1 0 0 1 1 .75l.5 2a1 1 0 0 1-.25 1L8 10z" />
    </svg>
  ),
  empty: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 4 4 5-6" />
    </svg>
  ),
};

const TONE: Record<DashboardAlert["severity"], { wrap: string; icon: string }> = {
  high: { wrap: "bg-red-500/[0.06] border-red-500/20", icon: "text-red-400 bg-red-500/10" },
  med: { wrap: "bg-amber-500/[0.06] border-amber-500/20", icon: "text-amber-400 bg-amber-500/10" },
  info: { wrap: "bg-white/[0.03] border-white/[0.06]", icon: "text-blue-400 bg-blue-500/10" },
};

export function DashboardAlerts({ alerts }: { alerts: DashboardAlert[] }) {
  if (!alerts.length) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#0f1219] p-5 min-h-[280px] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-5 h-5 text-emerald-400"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l4.5 4.5L19 7" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-white">Tudo em ordem</p>
        <p className="text-[11px] text-gray-500 mt-1">Nada exige sua atenção agora</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0f1219] p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] text-amber-400/70 font-semibold uppercase tracking-wider">
            Antecipamos
          </p>
          <p className="text-base font-bold text-white mt-0.5">Precisa da sua atenção</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {alerts.map((a, i) => {
          const tone = TONE[a.severity];
          return (
            <div
              key={`${a.kind}-${i}`}
              className={`flex items-center gap-3 p-3 rounded-xl border ${tone.wrap}`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tone.icon}`}
              >
                {ICON[a.kind]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white truncate">{a.title}</p>
                <p className="text-[11px] text-gray-500 truncate">{a.detail}</p>
              </div>
              {a.href && (
                <Link
                  href={a.href}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-white font-semibold transition-all shrink-0"
                >
                  {a.cta || "Resolver"}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
