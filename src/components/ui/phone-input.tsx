"use client";

interface PhoneInputProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
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
  className = "",
}: PhoneInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhone(e.target.value);
    if (onChange) onChange(formatted);
  }

  return (
    <input
      name={name}
      type="tel"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all ${className}`}
    />
  );
}
