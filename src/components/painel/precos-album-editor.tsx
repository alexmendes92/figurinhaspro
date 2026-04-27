"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { STICKER_TYPE_CONFIG } from "@/lib/sticker-types";
import { useToast } from "@/lib/toast-context";

// ── Tipos ──

interface PriceRule {
  id: string;
  stickerType: string;
  albumSlug: string | null;
  price: number;
}

interface SectionPriceRule {
  id: string;
  albumSlug: string;
  sectionName: string;
  adjustType: string;
  value: number;
}

interface QuantityTierData {
  id: string;
  albumSlug: string;
  minQuantity: number;
  discount: number;
}

interface AlbumPriceData {
  globalRules: PriceRule[];
  albumRules: PriceRule[];
  sectionRules: SectionPriceRule[];
  quantityTiers: QuantityTierData[];
}

// ── Componente Principal ──

export default function PrecosAlbumEditor({
  albumSlug,
  albumTitle,
  albumYear,
  albumFlag,
  sectionNames,
}: {
  albumSlug: string;
  albumTitle: string;
  albumYear: string;
  albumFlag: string;
  sectionNames: string[];
}) {
  const toast = useToast();
  const [data, setData] = useState<AlbumPriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ label: string; action: () => void } | null>(
    null
  );

  useEffect(() => {
    fetch(`/api/prices/${albumSlug}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [albumSlug]);

  function flashSaved(key: string) {
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
  }

  // ── Handlers: Type Rules ──

  async function updateTypePrice(type: string, price: number) {
    const key = `type-${type}`;
    setSaving(key);
    const res = await fetch("/api/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stickerType: type, price, albumSlug }),
    });
    if (res.ok) {
      const updated = await res.json();
      setData((prev) => {
        if (!prev) return prev;
        const idx = prev.albumRules.findIndex((r) => r.stickerType === type);
        const albumRules =
          idx >= 0
            ? prev.albumRules.map((r, i) => (i === idx ? updated : r))
            : [...prev.albumRules, updated];
        return { ...prev, albumRules };
      });
      flashSaved(key);
    }
    setSaving(null);
  }

  async function deleteTypePrice(type: string) {
    try {
      const res = await fetch("/api/prices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumSlug, stickerType: type }),
      });
      if (res.ok) {
        toast.success("Regra de preço removida");
        setData((prev) => {
          if (!prev) return prev;
          return { ...prev, albumRules: prev.albumRules.filter((r) => r.stickerType !== type) };
        });
      } else {
        toast.error("Erro ao remover regra");
      }
    } catch {
      toast.error("Erro de conexão");
    }
  }

  // ── Handlers: Section Rules ──

  async function saveSectionRule(sectionName: string, adjustType: string, value: number) {
    const key = `section-${sectionName}`;
    setSaving(key);
    const res = await fetch("/api/prices/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albumSlug, sectionName, adjustType, value }),
    });
    if (res.ok) {
      const updated = await res.json();
      setData((prev) => {
        if (!prev) return prev;
        const idx = prev.sectionRules.findIndex((r) => r.sectionName === sectionName);
        const sectionRules =
          idx >= 0
            ? prev.sectionRules.map((r, i) => (i === idx ? updated : r))
            : [...prev.sectionRules, updated];
        return { ...prev, sectionRules };
      });
      flashSaved(key);
    }
    setSaving(null);
  }

  async function deleteSectionRule(sectionName: string) {
    try {
      const res = await fetch("/api/prices/sections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumSlug, sectionName }),
      });
      if (res.ok) {
        toast.success("Ajuste de seção removido");
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sectionRules: prev.sectionRules.filter((r) => r.sectionName !== sectionName),
          };
        });
      } else {
        toast.error("Erro ao remover ajuste");
      }
    } catch {
      toast.error("Erro de conexão");
    }
  }

  // ── Handlers: Quantity Tiers ──

  async function saveTier(minQuantity: number, discount: number) {
    const key = `tier-${minQuantity}`;
    setSaving(key);
    const res = await fetch("/api/prices/tiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albumSlug, minQuantity, discount }),
    });
    if (res.ok) {
      const updated = await res.json();
      setData((prev) => {
        if (!prev) return prev;
        const idx = prev.quantityTiers.findIndex((t) => t.minQuantity === minQuantity);
        const quantityTiers =
          idx >= 0
            ? prev.quantityTiers.map((t, i) => (i === idx ? updated : t))
            : [...prev.quantityTiers, updated].sort((a, b) => a.minQuantity - b.minQuantity);
        return { ...prev, quantityTiers };
      });
      flashSaved(key);
    }
    setSaving(null);
  }

  async function deleteTier(minQuantity: number) {
    try {
      const res = await fetch("/api/prices/tiers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumSlug, minQuantity }),
      });
      if (res.ok) {
        toast.success("Faixa de desconto removida");
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            quantityTiers: prev.quantityTiers.filter((t) => t.minQuantity !== minQuantity),
          };
        });
      } else {
        toast.error("Erro ao remover faixa");
      }
    } catch {
      toast.error("Erro de conexão");
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl slide-up">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-[var(--card)] border border-[var(--border)] shimmer"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const globalMap = new Map(data.globalRules.map((r) => [r.stickerType, r.price]));
  const albumMap = new Map(data.albumRules.map((r) => [r.stickerType, r.price]));
  const sectionMap = new Map(data.sectionRules.map((r) => [r.sectionName, r]));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl slide-up">
      {/* Header */}
      <div className="mb-6">
        <p className="text-lg sm:text-xl font-bold tracking-tight">
          {albumFlag} Copa {albumYear}
        </p>
        <p className="text-xs text-[var(--muted)] mt-0.5">
          Configure preços específicos para este álbum.
        </p>
      </div>

      {/* 1. Preços base deste álbum */}
      <section className="mb-8">
        <div className="mb-4">
          <h2 className="text-base font-bold tracking-tight">
            <span className="text-zinc-500 font-mono mr-2">1.</span>Preços base
          </h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Sobrescrevem os preços padrão globais para este álbum.
          </p>
        </div>
        <div className="space-y-3">
          {STICKER_TYPE_CONFIG.map((tc) => {
            const albumPrice = albumMap.get(tc.type);
            const globalPrice = globalMap.get(tc.type);
            const effectivePrice = albumPrice ?? globalPrice ?? tc.defaultPrice;
            const hasOverride = albumPrice != null;
            const key = `type-${tc.type}`;

            return (
              <div
                key={tc.type}
                className={`p-4 rounded-2xl border transition-all ${
                  hasOverride
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-[var(--border)] bg-[var(--card)]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl ${tc.bg} border flex items-center justify-center shrink-0`}
                    >
                      <svg
                        className={`w-4 h-4 ${tc.color}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d={tc.icon} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{tc.shortLabel}</p>
                      <p className="text-[10px] text-[var(--muted)]">
                        {hasOverride
                          ? "Preço personalizado neste álbum"
                          : `Herdando padrão: R$${(globalPrice ?? tc.defaultPrice).toFixed(2).replace(".", ",")}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-[var(--muted)]">R$</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0.50"
                      defaultValue={effectivePrice.toFixed(2)}
                      onBlur={(e) => {
                        const val = Number.parseFloat(e.target.value);
                        if (!Number.isNaN(val) && val > 0 && val !== albumPrice) {
                          updateTypePrice(tc.type, val);
                        }
                      }}
                      className="!w-24 text-right font-[family-name:var(--font-geist-mono)] text-[var(--accent)] font-semibold text-sm py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-700 focus:border-amber-500/40 focus:outline-none transition-colors"
                    />
                    {hasOverride && (
                      <button
                        onClick={() =>
                          setConfirmDelete({
                            label: `regra de preço "${tc.label}"`,
                            action: () => deleteTypePrice(tc.type),
                          })
                        }
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-red-400 transition-colors"
                        title="Remover e voltar ao padrão"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                    <div className="w-14 text-right">
                      {saving === key && (
                        <span className="text-[10px] text-[var(--accent)] pulse-dot">Salvando</span>
                      )}
                      {saved === key && (
                        <span className="text-[10px] text-[var(--success)] flex items-center gap-1 justify-end">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
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
      </section>

      {/* 2. Ajustes por seção/país */}
      <section className="mb-8">
        <div className="mb-4">
          <h2 className="text-base font-bold tracking-tight">
            <span className="text-zinc-500 font-mono mr-2">2.</span>Ajustes por seção/país
          </h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Sobrescrevem o preço base acima para seções específicas.
          </p>
        </div>
        <SectionRulesTab
          sectionNames={sectionNames}
          sectionMap={sectionMap}
          saving={saving}
          saved={saved}
          onSave={saveSectionRule}
          onDelete={(name: string) =>
            setConfirmDelete({
              label: `ajuste de seção "${name}"`,
              action: () => deleteSectionRule(name),
            })
          }
        />
      </section>

      {/* 3. Descontos por volume */}
      <section className="mb-8">
        <div className="mb-4">
          <h2 className="text-base font-bold tracking-tight">
            <span className="text-zinc-500 font-mono mr-2">3.</span>Descontos por volume
          </h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Aplicado no total do carrinho do cliente.
          </p>
        </div>
        <QuantityTiersTab
          tiers={data.quantityTiers}
          saving={saving}
          saved={saved}
          albumSlug={albumSlug}
          onSave={saveTier}
          onDelete={(qty: number) =>
            setConfirmDelete({
              label: `faixa de desconto a partir de ${qty} un.`,
              action: () => deleteTier(qty),
            })
          }
        />
      </section>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Remover regra?"
        description={`Tem certeza que deseja remover ${confirmDelete?.label || "esta regra"}?`}
        confirmLabel="Remover"
        variant="danger"
        onConfirm={() => {
          confirmDelete?.action();
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

// ── Sub-componente: Regras por Seção ──

function SectionRulesTab({
  sectionNames,
  sectionMap,
  saving,
  saved,
  onSave,
  onDelete,
}: {
  sectionNames: string[];
  sectionMap: Map<string, SectionPriceRule>;
  saving: string | null;
  saved: string | null;
  onSave: (name: string, type: string, value: number) => void;
  onDelete: (name: string) => void;
}) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editType, setEditType] = useState<"FLAT" | "OFFSET">("FLAT");
  const [editValue, setEditValue] = useState("");

  function startEdit(name: string) {
    const existing = sectionMap.get(name);
    setEditingSection(name);
    setEditType((existing?.adjustType as "FLAT" | "OFFSET") || "FLAT");
    setEditValue(existing ? existing.value.toString() : "");
  }

  function handleSave(name: string) {
    const val = Number.parseFloat(editValue);
    if (Number.isNaN(val)) return;
    if (editType === "FLAT" && val <= 0) return;
    onSave(name, editType, val);
    setEditingSection(null);
  }

  return (
    <div className="space-y-2">
      {sectionNames.map((name) => {
        const rule = sectionMap.get(name);
        const isEditing = editingSection === name;
        const key = `section-${name}`;

        return (
          <div
            key={name}
            className={`p-3 rounded-xl border transition-all ${
              rule
                ? "border-amber-500/20 bg-amber-500/5"
                : "border-[var(--border)] bg-[var(--card)]"
            }`}
          >
            {isEditing ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold">{name}</p>
                <div className="flex gap-2">
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as "FLAT" | "OFFSET")}
                    className="px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white"
                  >
                    <option value="FLAT">Preço fixo (R$)</option>
                    <option value="OFFSET">Ajuste (+/−R$)</option>
                  </select>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-zinc-400">
                      {editType === "FLAT" ? "R$" : "+/−R$"}
                    </span>
                    <input
                      type="number"
                      step="0.50"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave(name);
                      }}
                      placeholder={editType === "FLAT" ? "5.00" : "1.00"}
                      className="!w-20 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-[family-name:var(--font-geist-mono)] text-amber-400 font-semibold"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(name)}
                    className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditingSection(null)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold">{name}</p>
                  {rule && (
                    <p className="text-[10px] text-amber-400 font-[family-name:var(--font-geist-mono)] mt-0.5">
                      {rule.adjustType === "FLAT"
                        ? `R$${rule.value.toFixed(2).replace(".", ",")} fixo`
                        : `${rule.value >= 0 ? "+" : ""}R$${rule.value.toFixed(2).replace(".", ",")} ajuste`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {saving === key && (
                    <span className="text-[10px] text-[var(--accent)] pulse-dot">Salvando</span>
                  )}
                  {saved === key && <span className="text-[10px] text-[var(--success)]">✓</span>}
                  <button
                    onClick={() => startEdit(name)}
                    className="px-2 py-1 rounded-lg text-[10px] font-semibold text-zinc-400 hover:text-amber-400 border border-zinc-700 hover:border-amber-500/30 transition-all"
                  >
                    {rule ? "Editar" : "Definir"}
                  </button>
                  {rule && (
                    <button
                      onClick={() => onDelete(name)}
                      className="w-6 h-6 rounded flex items-center justify-center text-zinc-600 hover:text-red-400 transition-colors"
                      title="Remover regra"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {sectionNames.length === 0 && (
        <div className="p-5 rounded-2xl border border-dashed border-[var(--border)] text-center">
          <p className="text-xs text-[var(--muted)]">Este álbum não possui seções definidas.</p>
        </div>
      )}

      {/* Info */}
      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] mt-4">
        <p className="text-[10px] text-zinc-600 leading-relaxed">
          <strong>Fixo</strong> = preço final substitui o preço base.{" "}
          <strong>Ajuste</strong> = soma/subtrai sobre o preço base. Ex: "Brasil = +R$1,00" faz
          figurinhas brasileiras custarem R$1 a mais.
        </p>
      </div>
    </div>
  );
}

// ── Sub-componente: Faixas de Quantidade ──

function QuantityTiersTab({
  tiers,
  saving,
  saved,
  albumSlug,
  onSave,
  onDelete,
}: {
  tiers: QuantityTierData[];
  saving: string | null;
  saved: string | null;
  albumSlug: string;
  onSave: (minQty: number, discount: number) => void;
  onDelete: (minQty: number) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newMinQty, setNewMinQty] = useState("");
  const [newDiscount, setNewDiscount] = useState("");

  function handleAdd() {
    const qty = Number.parseInt(newMinQty, 10);
    const disc = Number.parseFloat(newDiscount);
    if (Number.isNaN(qty) || qty <= 0 || Number.isNaN(disc) || disc < 0 || disc > 99) return;
    onSave(qty, disc);
    setNewMinQty("");
    setNewDiscount("");
    setAdding(false);
  }

  return (
    <div className="space-y-3">
      {tiers.length === 0 && !adding ? (
        <div className="p-5 rounded-2xl border border-dashed border-[var(--border)] text-center">
          <p className="text-xs text-[var(--muted)] mb-2">Nenhuma faixa de desconto configurada.</p>
          <button
            onClick={() => setAdding(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-all"
          >
            + Adicionar faixa
          </button>
        </div>
      ) : (
        <>
          {/* Tabela de faixas */}
          <div className="rounded-2xl border border-[var(--border)] overflow-hidden overflow-x-auto">
            {/* Header */}
            <div className="grid grid-cols-3 px-4 py-2 bg-zinc-900/50 border-b border-[var(--border)]">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                A partir de
              </span>
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider text-center">
                Desconto
              </span>
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider text-right">
                Ações
              </span>
            </div>

            {tiers.map((tier) => {
              const key = `tier-${tier.minQuantity}`;
              return (
                <div
                  key={tier.minQuantity}
                  className="grid grid-cols-3 items-center px-4 py-3 border-t border-[var(--border)] first:border-t-0"
                >
                  <span className="text-sm font-[family-name:var(--font-geist-mono)]">
                    {tier.minQuantity} figurinhas
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="99"
                      defaultValue={tier.discount}
                      onBlur={(e) => {
                        const val = Number.parseFloat(e.target.value);
                        if (!Number.isNaN(val) && val >= 0 && val <= 99 && val !== tier.discount) {
                          onSave(tier.minQuantity, val);
                        }
                      }}
                      className="!w-14 text-center font-[family-name:var(--font-geist-mono)] text-amber-400 font-semibold text-sm py-1 px-2 rounded-lg bg-zinc-900 border border-zinc-700 focus:border-amber-500/40 focus:outline-none transition-colors"
                    />
                    <span className="text-xs text-zinc-500">%</span>
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    {saving === key && (
                      <span className="text-[10px] text-[var(--accent)] pulse-dot">...</span>
                    )}
                    {saved === key && <span className="text-[10px] text-[var(--success)]">✓</span>}
                    <button
                      onClick={() => onDelete(tier.minQuantity)}
                      className="w-6 h-6 rounded flex items-center justify-center text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botão adicionar mais */}
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="w-full py-2 rounded-xl border border-dashed border-zinc-700 text-xs text-zinc-500 hover:text-amber-400 hover:border-amber-500/30 transition-all"
            >
              + Adicionar faixa
            </button>
          )}
        </>
      )}

      {/* Form nova faixa */}
      {adding && (
        <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
          <p className="text-xs font-semibold text-amber-400 mb-3">Nova faixa de desconto</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] text-zinc-500 mb-1 block">A partir de (qtd)</label>
              <input
                type="number"
                min="1"
                value={newMinQty}
                onChange={(e) => setNewMinQty(e.target.value)}
                placeholder="Ex: 11"
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm font-[family-name:var(--font-geist-mono)] text-white placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 mb-1 block">Desconto (%)</label>
              <input
                type="number"
                min="0"
                max="99"
                value={newDiscount}
                onChange={(e) => setNewDiscount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
                placeholder="Ex: 10"
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm font-[family-name:var(--font-geist-mono)] text-amber-400 font-semibold placeholder:text-zinc-600"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newMinQty || !newDiscount}
              className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-semibold transition-colors"
            >
              Adicionar
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-4 py-2 rounded-lg border border-zinc-700 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] mt-2">
        <p className="text-[10px] text-zinc-600 leading-relaxed">
          Ex: 1-10 = 0%, 11-50 = 10%, 51+ = 20%. Se o cliente pedir 15 figurinhas deste álbum,
          ganha 10% de desconto no preço unitário.
        </p>
      </div>
    </div>
  );
}
