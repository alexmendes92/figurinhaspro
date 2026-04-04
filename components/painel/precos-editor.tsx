"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { STICKER_TYPE_CONFIG, getStickerTypeShortLabel, getDefaultPrice } from "@/lib/sticker-types";

interface PriceRule {
  id: string;
  stickerType: string;
  albumSlug: string | null;
  price: number;
}

interface AlbumMeta {
  slug: string;
  year: string;
  flag: string;
}

export default function PrecosEditor({
  sellerPlan,
  albumList,
}: {
  sellerPlan: string;
  albumList: AlbumMeta[];
}) {
  const [rules, setRules] = useState<PriceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  // Estado para nova regra por álbum
  const [newAlbumSlug, setNewAlbumSlug] = useState("");
  const [newStickerType, setNewStickerType] = useState("regular");
  const [newPrice, setNewPrice] = useState("");
  const [addingAlbumRule, setAddingAlbumRule] = useState(false);

  const canUseAlbumRules = true; // TODO: restaurar gate de plano depois → sellerPlan === "PRO" || sellerPlan === "UNLIMITED"

  useEffect(() => {
    fetch("/api/prices")
      .then((r) => r.json())
      .then((data) => { setRules(data); setLoading(false); });
  }, []);

  async function updatePrice(type: string, price: number, albumSlug: string | null = null) {
    const key = `${albumSlug || "global"}-${type}`;
    setSaving(key);
    const res = await fetch("/api/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stickerType: type, price, albumSlug }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRules((prev) => {
        const idx = prev.findIndex(
          (r) => r.stickerType === type && (r.albumSlug || null) === (albumSlug || null)
        );
        if (idx >= 0) { const copy = [...prev]; copy[idx] = updated; return copy; }
        return [...prev, updated];
      });
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    }
    setSaving(null);
  }

  async function deleteAlbumRule(albumSlug: string, stickerType: string) {
    const res = await fetch("/api/prices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albumSlug, stickerType }),
    });
    if (res.ok) {
      setRules((prev) => prev.filter(
        (r) => !(r.albumSlug === albumSlug && r.stickerType === stickerType)
      ));
    }
  }

  async function addAlbumRule() {
    const price = parseFloat(newPrice);
    if (!newAlbumSlug || !newStickerType || isNaN(price) || price <= 0) return;
    await updatePrice(newStickerType, price, newAlbumSlug);
    setNewAlbumSlug("");
    setNewStickerType("regular");
    setNewPrice("");
    setAddingAlbumRule(false);
  }

  const globalRules = new Map(
    rules.filter((r) => !r.albumSlug).map((r) => [r.stickerType, r.price])
  );

  const albumRules = rules.filter((r) => r.albumSlug);

  // Agrupa regras por álbum
  const albumRulesBySlug = new Map<string, PriceRule[]>();
  for (const rule of albumRules) {
    const slug = rule.albumSlug!;
    if (!albumRulesBySlug.has(slug)) albumRulesBySlug.set(slug, []);
    albumRulesBySlug.get(slug)!.push(rule);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl slide-up">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Preços</h1>
        <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
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
        <>
          {/* ── Preços globais ── */}
          <div className="space-y-4">
            {STICKER_TYPE_CONFIG.map((tc) => {
              const currentPrice = globalRules.get(tc.type) ?? tc.defaultPrice;
              const key = `global-${tc.type}`;
              const isSaving = saving === key;
              const isSaved = saved === key;

              return (
                <div
                  key={tc.type}
                  className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-hover)] transition-all"
                >
                  <div className="flex items-center gap-3 mb-3 sm:mb-0">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${tc.bg} border flex items-center justify-center shrink-0`}>
                      <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${tc.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={tc.icon} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{tc.label}</p>
                      <p className="text-[11px] sm:text-xs text-[var(--muted)] mt-0.5 truncate">{tc.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-2 sm:mt-0">
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
                      className="!w-28 sm:!w-24 text-right font-[family-name:var(--font-geist-mono)] text-[var(--accent)] font-semibold text-base sm:text-sm py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-700 focus:border-amber-500/40 focus:outline-none transition-colors"
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
              );
            })}
          </div>

          {/* ── Regras por álbum ── */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Preços por álbum</h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Sobrescrevem os preços globais para álbuns específicos.
                </p>
              </div>
              {canUseAlbumRules && (
                <button
                  onClick={() => setAddingAlbumRule(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Nova regra
                </button>
              )}
            </div>

            {!canUseAlbumRules ? (
              <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-400">Recurso PRO</p>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      Defina preços diferentes por álbum — ex: cobrar mais por figurinhas da Copa 2022.
                      Disponível nos planos PRO e Unlimited.
                    </p>
                    <Link
                      href="/painel/planos"
                      className="inline-block mt-2 text-xs text-amber-400 font-semibold hover:underline"
                    >
                      Ver planos →
                    </Link>
                  </div>
                </div>
              </div>
            ) : albumRulesBySlug.size === 0 && !addingAlbumRule ? (
              <div className="p-5 rounded-2xl border border-dashed border-[var(--border)] text-center">
                <p className="text-xs text-[var(--muted)]">
                  Nenhuma regra por álbum. Os preços globais acima serão usados.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from(albumRulesBySlug.entries()).map(([slug, slugRules]) => {
                  const albumInfo = albumList.find((a) => a.slug === slug);
                  return (
                    <div key={slug} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--card)]">
                        <p className="text-xs font-semibold flex items-center gap-2">
                          {albumInfo ? (
                            <>
                              <span>{albumInfo.flag}</span>
                              Copa {albumInfo.year}
                            </>
                          ) : slug}
                        </p>
                      </div>
                      {slugRules.map((rule) => {
                        const key = `${slug}-${rule.stickerType}`;
                        return (
                          <div key={key} className="px-4 py-2.5 flex items-center justify-between border-t border-[var(--border)] first:border-t-0">
                            <span className="text-xs text-[var(--muted)]">
                              {getStickerTypeShortLabel(rule.stickerType)}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[var(--muted)]">R$</span>
                              <input
                                type="number"
                                step="0.50"
                                min="0.50"
                                defaultValue={rule.price.toFixed(2)}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val) && val > 0 && val !== rule.price) {
                                    updatePrice(rule.stickerType, val, slug);
                                  }
                                }}
                                className="!w-20 text-right font-[family-name:var(--font-geist-mono)] text-[var(--accent)] font-semibold text-sm"
                              />
                              <div className="w-14 text-right">
                                {saving === key && (
                                  <span className="text-[10px] text-[var(--accent)] pulse-dot">Salvando</span>
                                )}
                                {saved === key && (
                                  <span className="text-[10px] text-[var(--success)]">Salvo</span>
                                )}
                              </div>
                              <button
                                onClick={() => deleteAlbumRule(slug, rule.stickerType)}
                                className="w-6 h-6 rounded flex items-center justify-center text-zinc-600 hover:text-red-400 transition-colors"
                                title="Remover regra"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Form para adicionar nova regra */}
            {addingAlbumRule && canUseAlbumRules && (
              <div className="mt-3 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                <p className="text-xs font-semibold text-amber-400 mb-3">Nova regra por álbum</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                  <select
                    value={newAlbumSlug}
                    onChange={(e) => setNewAlbumSlug(e.target.value)}
                    className="px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-sm sm:text-xs text-white"
                  >
                    <option value="">Selecionar álbum...</option>
                    {albumList.map((a) => (
                      <option key={a.slug} value={a.slug}>
                        {a.flag} Copa {a.year}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newStickerType}
                    onChange={(e) => setNewStickerType(e.target.value)}
                    className="px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-sm sm:text-xs text-white"
                  >
                    {STICKER_TYPE_CONFIG.map((tc) => (
                      <option key={tc.type} value={tc.type}>{tc.shortLabel}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-xs text-zinc-400">R$</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0.50"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder={getDefaultPrice(newStickerType).toFixed(2)}
                      onKeyDown={(e) => { if (e.key === "Enter") addAlbumRule(); }}
                      className="flex-1 px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-sm sm:text-xs font-[family-name:var(--font-geist-mono)] text-amber-400 font-semibold placeholder:text-zinc-600"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addAlbumRule}
                    disabled={!newAlbumSlug || !newPrice}
                    className="flex-1 py-2.5 sm:py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black text-sm sm:text-xs font-semibold transition-colors active:bg-amber-400"
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => setAddingAlbumRule(false)}
                    className="px-4 py-2.5 sm:py-2 rounded-lg border border-zinc-700 text-sm sm:text-xs text-zinc-400 hover:text-white transition-colors active:bg-zinc-800"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Info de hierarquia ── */}
          <div className="mt-8 p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
            <div className="flex items-start gap-3">
              <svg className="w-4 h-4 text-[var(--info)] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <div>
                <p className="text-xs font-medium text-[var(--muted)]">Hierarquia de preços</p>
                <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
                  Preço individual da figurinha &gt; Regra do álbum &gt; Preço global &gt; Valor padrão.
                  Defina preços individuais diretamente na tela de estoque.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
