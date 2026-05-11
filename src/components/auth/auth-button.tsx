import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuthButtonProps extends Omit<ButtonProps, "variant" | "size"> {
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
  const shadow =
    variant === "primary"
      ? "shadow-xl shadow-accent-500/20 hover:shadow-accent-500/30"
      : "";

  return (
    <Button
      variant={variant}
      size="lg"
      disabled={disabled || loading}
      className={cn("w-full py-3.5 text-sm font-bold", shadow, className)}
      {...props}
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>{typeof children === "string" ? children : "Carregando..."}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}
