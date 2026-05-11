"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
    <Button
      type="button"
      variant="primary"
      onClick={handleSeed}
      disabled={loading}
    >
      {loading ? "Populando..." : "Popular dados iniciais"}
    </Button>
  );
}
