interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "ghost";
  children: React.ReactNode;
}

export function AuthButton({
  loading,
  variant = "primary",
  children,
  className,
  disabled,
  ...props
}: AuthButtonProps) {
  const base = "w-full py-3.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2";

  const variants = {
    primary:
      "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed",
    ghost:
      "border border-white/10 text-gray-300 hover:bg-white/[0.04] hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className || ""}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>{typeof children === "string" ? children : "Carregando..."}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
