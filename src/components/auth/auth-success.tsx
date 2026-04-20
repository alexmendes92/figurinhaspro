import Link from "next/link";

interface AuthSuccessProps {
  icon: "email" | "check" | "lock";
  title: string;
  description: string | React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
}

const icons = {
  email: (
    <svg
      className="w-7 h-7 text-emerald-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  ),
  check: (
    <svg
      className="w-7 h-7 text-emerald-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  lock: (
    <svg
      className="w-7 h-7 text-emerald-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  ),
};

export function AuthSuccess({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: AuthSuccessProps) {
  return (
    <div className="text-center space-y-4 slide-up">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
        {icons[icon]}
      </div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="text-sm text-gray-400">{description}</div>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex px-6 py-3 rounded-xl border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/[0.04] transition-all"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
