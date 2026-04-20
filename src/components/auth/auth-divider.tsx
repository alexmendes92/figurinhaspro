interface AuthDividerProps {
  text?: string;
}

export function AuthDivider({ text = "ou" }: AuthDividerProps) {
  return (
    <div className="flex items-center gap-4 my-6">
      <div className="flex-1 h-px bg-white/[0.06]" />
      <span className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">
        {text}
      </span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}
