"use client";

import { useId } from "react";

interface PhoneInputProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  /** Quando true, input bloqueado + visual atenuado. */
  disabled?: boolean;
  /** Mensagem de erro. Quando definida, ativa aria-invalid + aria-describedby. */
  error?: string;
  /** Label visível acima do input. Acoplado via htmlFor. */
  label?: string;
  /** ClassName aplicado no <input> (backward compat). */
  className?: string;
  /** ClassName aplicado no wrapper <div> (só renderiza wrapper se label ou error definidos). */
  wrapperClassName?: string;
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function PhoneInput({
  name,
  value,
  onChange,
  placeholder = "(11) 99999-9999",
  required = false,
  disabled = false,
  error,
  label,
  className = "",
  wrapperClassName = "",
}: PhoneInputProps) {
  const id = useId();
  const errId = useId();
  const hasError = !!error;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhone(e.target.value);
    if (onChange) onChange(formatted);
  }

  const inputElement = (
    <input
      id={id}
      name={name}
      type="tel"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      aria-invalid={hasError || undefined}
      aria-describedby={hasError ? errId : undefined}
      className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border ${
        hasError ? "border-danger-400/40" : "border-white/[0.08]"
      } text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-accent-500/40 focus:ring-2 focus:ring-accent-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${className}`}
    />
  );

  // Backward compat: sem label e sem error → renderiza só o input (sem wrapper).
  if (!label && !hasError) return inputElement;

  return (
    <div className={`flex flex-col gap-1 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-muted">
          {label}
        </label>
      )}
      {inputElement}
      {hasError && (
        <p id={errId} role="alert" className="text-xs text-danger-400">
          {error}
        </p>
      )}
    </div>
  );
}
