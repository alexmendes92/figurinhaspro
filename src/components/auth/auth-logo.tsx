interface AuthLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizes = {
  sm: { box: "w-10 h-10 rounded-xl", letter: "text-base", shadow: "shadow-lg" },
  md: { box: "w-14 h-14 rounded-2xl", letter: "text-xl", shadow: "shadow-lg" },
  lg: { box: "w-20 h-20 rounded-3xl", letter: "text-3xl", shadow: "shadow-2xl" },
};

export function AuthLogo({ size = "md", showText = false }: AuthLogoProps) {
  const s = sizes[size];
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`${s.box} bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center ${s.shadow} shadow-amber-500/20`}
      >
        <span
          className={`text-white ${s.letter} font-black font-[family-name:var(--font-geist-mono)]`}
        >
          F
        </span>
      </div>
      {showText && (
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Figurinhas<span className="text-amber-400">Pro</span>
        </h2>
      )}
    </div>
  );
}
