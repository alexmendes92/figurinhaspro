import Link from "next/link";
import {
  computeOnboardingProgress,
  type OnboardingFieldId,
  type OnboardingProgressInput,
} from "@/lib/onboarding-progress";

const FIELD_META: Record<OnboardingFieldId, { label: string; help: string }> = {
  shopDescription: {
    label: "Descrição da loja",
    help: "O que você vende e há quanto tempo",
  },
  businessHours: {
    label: "Horário de atendimento",
    help: "Quando você responde clientes",
  },
  paymentMethods: {
    label: "Métodos de pagamento",
    help: "PIX, cartão, dinheiro, transferência",
  },
};

export default function OnboardingChecklist(props: OnboardingProgressInput) {
  const { filledCount, total, percent, missing } = computeOnboardingProgress(props);
  const isComplete = filledCount === total;

  if (isComplete) {
    return (
      <div className="mb-6 px-4 py-2.5 rounded-xl border border-green-500/20 bg-green-500/5 flex items-center gap-2">
        <svg
          className="w-4 h-4 text-green-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <p className="text-xs text-green-400 font-medium">
          Vitrine pronta — {filledCount} de {total} campos preenchidos
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold tracking-tight">
            Sua vitrine está {percent}% configurada
          </p>
          <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-[var(--muted)]">
            {filledCount}/{total}
          </span>
        </div>
        <div
          className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso de configuração da vitrine"
        >
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-700"
            style={{ width: `${Math.max(percent, 4)}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2">
        {missing.map((field) => {
          const meta = FIELD_META[field];
          return (
            <li
              key={field}
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-[var(--border)] bg-white/[0.02]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{meta.label}</p>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">{meta.help}</p>
              </div>
              <Link
                href={`?edit=1#${field}`}
                className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors min-h-[44px] sm:min-h-0 shrink-0 flex items-center"
              >
                Configurar
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
