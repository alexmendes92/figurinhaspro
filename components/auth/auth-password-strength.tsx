"use client";

interface PasswordStrengthProps {
  password: string;
}

function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 1, label: "Fraca", color: "bg-red-500" };
  if (score <= 2) return { score: 2, label: "Razoável", color: "bg-amber-500" };
  if (score <= 3) return { score: 3, label: "Boa", color: "bg-yellow-400" };
  return { score: 4, label: "Forte", color: "bg-emerald-400" };
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const { score, label, color } = getStrength(password);

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? color : "bg-white/[0.06]"
            }`}
          />
        ))}
      </div>
      <p className={`text-[11px] font-medium ${
        score <= 1 ? "text-red-400" : score <= 2 ? "text-amber-400" : score <= 3 ? "text-yellow-400" : "text-emerald-400"
      }`}>
        {label}
      </p>
    </div>
  );
}
