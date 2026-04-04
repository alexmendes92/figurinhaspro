"use client";

import { useState, useEffect } from "react";
import { STICKER_TYPE_CONFIG } from "@/lib/sticker-types";
import { useToast } from "@/lib/toast-context";

interface PriceRule {
  id: string;
  stickerType: string;
  albumSlug: string | null;
  price: number;
}

export default function PrecosGlobalEditor({ sellerPlan }: { sellerPlan: string }) {
  const toast = useToast();
  const [rules, setRules] = useState<PriceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/prices")
      .then((r) => r.json())
      .then((data) => {
        // Filtra só regras globais (albumSlug null ou "")
        setRules(data.filter((r: PriceRule) => !r.albumSlug));
        setLoading(false);
      });
  }, []);

  async function updatePrice(type: string, price: number) {
    const key = `global-${type}`;
    setSaving(key);
    const res = await fetch("/api/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stickerType: type, price, albumSlug: null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRules((prev) => {
        const idx = prev.findIndex((r) => r.stickerType === type);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = updated;
          return copy;
        }
        return [...prev, updated];
      });
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    }
    setSaving(null);
  }

  const globalRules = new Map(rules.map((r) => [r.stickerType, r.price]));

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold tracking-tight">Preços padrão</h2>
        <p className="text-xs text-[var(--muted)] mt-0.5">
          Aplicados a todos os álbuns que não possuem preço específico.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-[var(--card)] border border-[var(--border)] shimmer" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {STICKER_TYPE_CONFIG.map((tc) => {
            const currentPrice = globalRules.get(tc.type) ?? tc.defaultPrice;
            const key = `global-${tc.type}`;
            const isSaving = saving === key;
            const isSaved = saved === key;

            return (
              <div
                key={tc.type}
                className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-hover)] transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${tc.bg} border flex items-center justify-center shrink-0`}>
                      <svg className={`w-4 h-4 ${tc.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={tc.icon} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{tc.label}</p>
                      <p className="text-[10px] text-[var(--muted)] truncate">{tc.desc}</p>
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
                      className="!w-24 text-right font-[family-name:var(--font-geist-mono)] text-[var(--accent)] font-semibold text-sm py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-700 focus:border-amber-500/40 focus:outline-none transition-colors"
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
    </div>
  );
}
