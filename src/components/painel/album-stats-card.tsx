"use client";

import { useState } from "react";
import { getStickerTypeConfig } from "@/lib/sticker-types";

interface Blocker {
  code: string;
  name: string;
  type: string;
}

interface AlbumStatsCardProps {
  albumSlug: string;
  albumTitle: string;
  albumYear: string;
  albumFlag: string;
  isCustom: boolean;
  totalStickers: number;
  inStock: number;
  totalUnits: number;
  coveragePercent: number;
  completedAlbums: number;
  blockers: Blocker[];
}

export default function AlbumStatsCard({
  albumTitle,
  albumFlag,
  isCustom,
  totalStickers,
  inStock,
  totalUnits,
  coveragePercent,
  completedAlbums,
  blockers,
}: AlbumStatsCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const progressColor =
    coveragePercent >= 80
      ? "bg-emerald-500"
      : coveragePercent >= 30
        ? "bg-amber-500"
        : "bg-zinc-500";

  const progressTextColor =
    coveragePercent >= 80
      ? "text-emerald-400"
      : coveragePercent >= 30
        ? "text-amber-400"
        : "text-zinc-400";

  const missing = totalStickers - inStock;

  async function copyBlockers() {
    const text = blockers.map((b) => b.code).join(", ");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all ${
        isCustom
          ? "border-amber-500/20 bg-amber-500/[0.02]"
          : "border-white/[0.06] bg-white/[0.02]"
      }`}
    >
      {/* Header do card */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate flex items-center gap-2">
              <span className="text-lg">{albumFlag}</span>
              {albumTitle}
              {isCustom && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20 shrink-0">
                  CUSTOM
                </span>
              )}
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5 font-[family-name:var(--font-geist-mono)]">
              {totalStickers} figurinhas · {totalUnits} unidades em estoque
            </p>
          </div>

          {/* Badge de álbuns completos */}
          {completedAlbums > 0 && (
            <div className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs font-bold text-emerald-400 font-[family-name:var(--font-geist-mono)]">
                {completedAlbums}x
              </span>
              <span className="text-[10px] text-emerald-500/70 ml-1">
                {completedAlbums === 1 ? "completo" : "completos"}
              </span>
            </div>
          )}
        </div>

        {/* Radial progress + métricas */}
        <div className="flex items-center gap-5">
          {/* Radial */}
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-white/[0.06]"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={`${(coveragePercent / 100) * 175.93} 175.93`}
                strokeLinecap="round"
                className={progressTextColor}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-bold font-[family-name:var(--font-geist-mono)] ${progressTextColor}`}>
                {coveragePercent}%
              </span>
            </div>
          </div>

          {/* Métricas */}
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Em estoque</p>
              <p className="text-sm font-bold text-white font-[family-name:var(--font-geist-mono)]">{inStock}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Faltam</p>
              <p className="text-sm font-bold text-white font-[family-name:var(--font-geist-mono)]">{missing}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Unidades</p>
              <p className="text-sm font-bold text-white font-[family-name:var(--font-geist-mono)]">{totalUnits}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Completos</p>
              <p className="text-sm font-bold text-white font-[family-name:var(--font-geist-mono)]">{completedAlbums}</p>
            </div>
          </div>
        </div>

        {/* Barra de progresso linear */}
        <div className="mt-4">
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
              style={{ width: `${coveragePercent}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-1.5">
            {inStock} de {totalStickers} figurinhas distintas em estoque ({coveragePercent}% cobertura)
          </p>
        </div>
      </div>

      {/* Blockers — figurinhas faltantes para próximo completo */}
      {blockers.length > 0 && (
        <div className="border-t border-white/[0.06]">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 sm:px-5 py-3 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
          >
            <span className="text-xs text-gray-400">
              Faltam <span className="font-bold text-white">{blockers.length}</span> para o próximo completo
            </span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expanded && (
            <div className="px-4 sm:px-5 pb-4 space-y-2">
              {/* Botão copiar */}
              <button
                onClick={copyBlockers}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-gray-400 hover:text-white hover:border-white/10 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                {copied ? "Copiado!" : "Copiar lista"}
              </button>

              {/* Lista de blockers */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {blockers.map((b) => {
                  const typeConf = getStickerTypeConfig(b.type);
                  return (
                    <div
                      key={b.code}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.04]"
                    >
                      <span className="text-[10px] font-bold text-gray-400 font-[family-name:var(--font-geist-mono)]">
                        {b.code}
                      </span>
                      {b.type !== "regular" && (
                        <span className={`px-1 py-0.5 rounded text-[7px] font-bold ${typeConf.badgeClass}`}>
                          {typeConf.shortLabel}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
