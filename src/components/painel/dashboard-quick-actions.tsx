import Link from "next/link";

interface Props {
  storeUrl: string;
}

const SECONDARY_CLASS =
  "inline-flex items-center justify-center sm:justify-start gap-2 px-3.5 py-2 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.06] text-xs font-semibold text-white transition-all";

const PRIMARY_CLASS =
  "inline-flex items-center justify-center sm:justify-start gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 text-black text-xs font-bold transition-all shadow-lg shadow-accent-500/20";

export default function DashboardQuickActions({ storeUrl }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 shrink-0">
      <Link href="/painel/estoque" className={SECONDARY_CLASS}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5"
        >
          <path d="M4 7h3l2-3h6l2 3h3v13H4z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        Scanner
        <span className="ml-0.5 px-1.5 py-0.5 rounded bg-white/[0.06] text-[9px] font-mono text-gray-400">
          em breve
        </span>
      </Link>

      <Link href="/painel/estoque" className={SECONDARY_CLASS}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5"
        >
          <path d="M20 12a8 8 0 1 1-3-6.24L20 4l-1 3.3A8 8 0 0 1 20 12z" />
          <path d="M8 10c1 3 3 5 6 6l1.5-1.5a1 1 0 0 1 1-.25l2 .5a1 1 0 0 1 .75 1V17a2 2 0 0 1-2 2C11 19 5 13 5 8a2 2 0 0 1 2-2h1.2a1 1 0 0 1 1 .75l.5 2a1 1 0 0 1-.25 1L8 10z" />
        </svg>
        Colar WhatsApp
      </Link>

      <Link href="/painel/estoque/novo" className={SECONDARY_CLASS}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5"
        >
          <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
        Criar album
      </Link>

      <a
        href={storeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={SECONDARY_CLASS}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5"
        >
          <path d="M14 3h7v7" />
          <path d="M10 14L21 3" />
          <path d="M21 14v7H3V3h7" />
        </svg>
        Ver vitrine
      </a>

      <Link href="/painel/estoque" className={PRIMARY_CLASS}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5"
        >
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
        Marcar figurinha
      </Link>
    </div>
  );
}
