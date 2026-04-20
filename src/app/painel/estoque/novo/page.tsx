"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseStickersInput } from "@/lib/custom-albums";

export default function NovoAlbumPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [stickersText, setStickersText] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const parsedCount = stickersText.trim() ? parseStickersInput(stickersText).length : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Informe o nome do álbum");
      return;
    }
    if (parsedCount === 0) {
      setError("Informe pelo menos uma figurinha");
      return;
    }
    if (parsedCount > 2000) {
      setError("Máximo de 2000 figurinhas por álbum");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), year: year.trim(), stickersText }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao criar álbum");
        setSaving(false);
        return;
      }

      router.push("/painel/estoque");
      router.refresh();
    } catch {
      setError("Erro de conexão");
      setSaving(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/painel/estoque"
          className="w-8 h-8 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cadastrar Álbum</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Crie um álbum personalizado com suas figurinhas
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nome do álbum */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Nome do álbum</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Copa do Mundo 2026, Brasileirão 2025..."
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all placeholder:text-zinc-600"
          />
        </div>

        {/* Ano (opcional) */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Ano <span className="text-zinc-600 font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={year}
            onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="Ex: 2026"
            className="w-32 px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm font-[family-name:var(--font-geist-mono)] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all placeholder:text-zinc-600"
          />
        </div>

        {/* Figurinhas */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Figurinhas</label>
          <p className="text-xs text-zinc-500 mb-2">
            Digite um intervalo (ex:{" "}
            <code className="text-zinc-400 bg-zinc-800 px-1 rounded">1-670</code>) ou cole os
            códigos separados por vírgula, espaço ou um por linha. Também aceita prefixos (ex:{" "}
            <code className="text-zinc-400 bg-zinc-800 px-1 rounded">BRA1-BRA20</code>).
          </p>
          <textarea
            value={stickersText}
            onChange={(e) => setStickersText(e.target.value)}
            placeholder={"Ex: 1-670\n\nOu: 1, 2, 3, FWC1, FWC2, BRA1-BRA25"}
            rows={6}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm font-[family-name:var(--font-geist-mono)] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all resize-none placeholder:text-zinc-600"
          />
          {parsedCount > 0 && (
            <p className="text-xs text-zinc-400 mt-1.5 font-[family-name:var(--font-geist-mono)]">
              <span className="text-amber-400 font-bold">{parsedCount}</span> figurinhas detectadas
            </p>
          )}
        </div>

        {/* Erro */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-3 pt-2">
          <Link
            href="/painel/estoque"
            className="px-5 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors text-center"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || !title.trim() || parsedCount === 0}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-black font-bold text-sm transition-colors"
          >
            {saving ? "Criando..." : `Criar álbum (${parsedCount} figurinhas)`}
          </button>
        </div>
      </form>
    </div>
  );
}
