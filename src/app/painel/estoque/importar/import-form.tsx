"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseStickersInput } from "@/lib/custom-albums";
import { useToast } from "@/lib/toast-context";

export default function ImportForm({ albums }: { albums: { slug: string; title: string }[] }) {
  const router = useRouter();
  const toast = useToast();
  const [albumSlug, setAlbumSlug] = useState("");
  const [stickersText, setStickersText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const parsedCodes = stickersText.trim() ? parseStickersInput(stickersText).map(s => s.code) : [];
  
  // Agrupa os códigos repetidos e conta
  const parsedMap = new Map<string, number>();
  for (const code of parsedCodes) {
    parsedMap.set(code, (parsedMap.get(code) || 0) + 1);
  }
  
  const totalQuantity = parsedCodes.length;
  const uniqueStickersCount = parsedMap.size;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!albumSlug) {
      setError("Selecione um álbum.");
      return;
    }
    if (totalQuantity === 0) {
      setError("Informe pelo menos uma figurinha.");
      return;
    }

    const items = Array.from(parsedMap.entries()).map(([code, quantity]) => ({
      stickerCode: code,
      quantity,
    }));

    setSaving(true);
    try {
      const res = await fetch("/api/inventory/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumSlug, items }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || data.error || "Erro ao importar figurinhas");
        setSaving(false);
        return;
      }

      toast.success("Estoque atualizado com sucesso!");
      router.push(`/painel/estoque/${albumSlug}`);
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
          <h1 className="text-2xl font-bold tracking-tight">Importação em Massa</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Cole uma lista de figurinhas para adicionar ao seu estoque rapidamente.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Álbum */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Álbum destino</label>
          <select
            value={albumSlug}
            onChange={(e) => setAlbumSlug(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
          >
            <option value="" disabled>Selecione um álbum...</option>
            {albums.map(a => (
              <option key={a.slug} value={a.slug}>{a.title}</option>
            ))}
          </select>
        </div>

        {/* Figurinhas */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Lista de Figurinhas</label>
          <p className="text-xs text-zinc-500 mb-2">
            Digite um intervalo (ex: <code className="text-zinc-400 bg-zinc-800 px-1 rounded">1-50</code>) ou cole os códigos separados por vírgula, espaço ou linhas (ex: <code className="text-zinc-400 bg-zinc-800 px-1 rounded">1, 2, 3, FWC1</code>). Valores duplicados serão somados ao estoque (ex: &quot;1, 1&quot; = 2 unidades).
          </p>
          <textarea
            value={stickersText}
            onChange={(e) => setStickersText(e.target.value)}
            placeholder={"Cole aqui sua lista..."}
            rows={8}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm font-[family-name:var(--font-geist-mono)] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all resize-none placeholder:text-zinc-600"
          />
          {totalQuantity > 0 && (
            <p className="text-xs text-zinc-400 mt-1.5 font-[family-name:var(--font-geist-mono)]">
              Serão adicionadas <span className="text-green-400 font-bold">+{totalQuantity} unidades</span> no total, divididas em <span className="text-amber-400 font-bold">{uniqueStickersCount} códigos diferentes</span>.
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
            disabled={saving || !albumSlug || totalQuantity === 0}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-black font-bold text-sm transition-colors"
          >
            {saving ? "Adicionando..." : "Adicionar ao Estoque"}
          </button>
        </div>
      </form>
    </div>
  );
}
