"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SeedButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSeed() {
    setLoading(true);
    try {
      const res = await fetch("/api/comercial/seed", { method: "POST" });
      if (!res.ok) throw new Error("Seed failed");
      router.refresh();
    } catch {
      alert("Erro ao popular dados. Verifique o console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSeed}
      disabled={loading}
      className="px-4 py-2 bg-amber-500 text-black text-sm font-medium rounded-lg hover:bg-amber-400 disabled:opacity-50 transition-colors"
    >
      {loading ? "Populando..." : "Popular dados iniciais"}
    </button>
  );
}
