"use client";

import { useState, useEffect } from "react";

interface PriceRule {
  id: string;
  stickerType: string;
  albumSlug: string | null;
  price: number;
}

const typeConfig = [
  {
    type: "regular",
    label: "Regular",
    desc: "Figurinhas comuns — maioria do álbum",
    icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75z",
    color: "text-zinc-400",
    bg: "bg-zinc-500/8 border-zinc-500/15",
    default: 2.5,
  },
  {
    type: "foil",
    label: "Especial (Foil)",
    desc: "Figurinhas metalizadas, bordas douradas, escudos",
    icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z",
    color: "text-[var(--accent)]",
    bg: "bg-[var(--accent-dim)] border-[var(--accent-border)]",
    default: 5.0,
  },
  {
    type: "shiny",
    label: "Brilhante (Shiny)",
    desc: "Figurinhas com efeito brilho, holográficas",
    icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
    color: "text-purple-400",
    bg: "bg-purple-500/8 border-purple-500/15",
    default: 4.0,
  },
];

export default function PrecosPage() {
  const [rules, setRules] = useState<PriceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/prices")
      .then((r) => r.json())
      .then((data) => { setRules(data); setLoading(false); });
  }, []);

  async function updatePrice(type: string, price: number) {
    setSaving(type);
    const res = await fetch("/api/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stickerType: type, price, albumSlug: null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRules((prev) => {
        const idx = prev.findIndex((r) => r.stickerType === type && r.albumSlug === null);
        if (idx >= 0) { const copy = [...prev]; copy[idx] = updated; return copy; }
        return [...prev, updated];
      });
      setSaved(type);
      setTimeout(() => setSaved(null), 2000);
    }
    setSaving(null);
  }

  const globalRules = new Map(
    rules.filter((r) => !r.albumSlug).map((r) => [r.stickerType, r.price])
  );

  return (
    <div className="p-6 lg:p-8 max-w-2xl slide-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Preços</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Defina o valor por tipo de figurinha. Aplicado a todos os álbuns.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-[var(--card)] border border-[var(--border)] shimmer" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {typeConfig.map((tc) => {
            const currentPrice = globalRules.get(tc.type) ?? tc.default;
            const isSaving = saving === tc.type;
            const isSaved = saved === tc.type;

            return (
              <div
                key={tc.type}
                className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-hover)] transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${tc.bg} border flex items-center justify-center shrink-0 mt-0.5`}>
                      <svg className={`w-5 h-5 ${tc.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={tc.icon} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{tc.label}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{tc.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-[var(--muted)]">R$</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0.50"
                      defaultValue={currentPrice.toFixed(2)}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0 && val !== currentPrice) {
                          updatePrice(tc.type, val);
                        }
                      }}
                      className="!w-24 text-right font-[family-name:var(--font-geist-mono)] text-[var(--accent)] font-semibold"
                    />
                    <div className="w-14 text-right">
                      {isSaving && (
                        <span className="text-[10px] text-[var(--accent)] pulse-dot">Salvando</span>
                      )}
                      {isSaved && (
                        <span className="text-[10px] text-[var(--success)] flex items-center gap-1 justify-end">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Salvo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-start gap-3">
          <svg className="w-4 h-4 text-[var(--info)] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <div>
            <p className="text-xs font-medium text-[var(--muted)]">Preço customizado</p>
            <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
              Você pode definir preços individuais para figurinhas específicas diretamente na tela de estoque,
              sobrescrevendo essas regras gerais.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
