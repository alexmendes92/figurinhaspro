import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

// Button variants customizadas P8 — acentua nossa paleta accent (laranja Panini)
// em vez do default neutral do shadcn. Mantém `asChild` pra polimorfismo.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-accent-500 to-accent-600 text-black hover:from-accent-400 hover:to-accent-500",
        secondary:
          "border border-border bg-card text-foreground hover:bg-card-hover hover:border-border-hover",
        ghost:
          "border border-border bg-transparent text-muted hover:bg-card-hover hover:text-foreground hover:border-border-hover",
        danger:
          "bg-danger-500 text-white hover:bg-danger-400",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /**
   * Quando true, renderiza spinner Lucide e força disabled.
   * Spinner tem role="status" + aria-label="Carregando" para screen readers.
   * Incompatível com asChild (asChild não renderiza filho extra).
   */
  isLoading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  // asChild + isLoading não combina (Slot espera 1 filho); ignora isLoading nesse caso.
  const showSpinner = isLoading && !asChild;
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {showSpinner ? (
        <>
          <Loader2 role="status" aria-label="Carregando" className="animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { buttonVariants };
