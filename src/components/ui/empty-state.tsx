import Link from "next/link";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: EmptyStateAction;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl bg-[var(--card,#111318)] border border-[var(--border,rgba(255,255,255,0.06))] p-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-6 h-6 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-400">{title}</p>
      {description && <p className="text-[11px] text-gray-600 mt-1">{description}</p>}
      {action && (
        <div className="mt-4">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all cursor-pointer"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
