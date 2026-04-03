"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ALBUM_OPTIONS = [
  { year: 2022, host: "Qatar", slug: "qatar-2022" },
  { year: 2018, host: "Russia", slug: "russia-2018" },
  { year: 2014, host: "Brazil", slug: "brazil-2014" },
  { year: 2010, host: "South Africa", slug: "south-africa-2010" },
  { year: 2006, host: "Germany", slug: "germany-2006" },
  { year: 2002, host: "Korea/Japan", slug: "korea-japan-2002" },
  { year: 1998, host: "France", slug: "france-1998" },
  { year: 1994, host: "USA", slug: "usa-1994" },
  { year: 1990, host: "Italy", slug: "italy-1990" },
  { year: 1986, host: "Mexico", slug: "mexico-1986" },
  { year: 1982, host: "Spain", slug: "spain-1982" },
  { year: 1978, host: "Argentina", slug: "argentina-1978" },
  { year: 1974, host: "West Germany", slug: "west-germany-1974" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seller, setSeller] = useState<{ name: string; shopName: string; shopSlug: string; phone: string } | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string>("");

  useEffect(() => {
    fetch("/api/seller")
      .then((r) => r.json())
      .then((data) => {
        if (data.onboardingStep >= 4) {
          router.replace("/painel");
          return;
        }
        setSeller(data);
        setStep(data.onboardingStep || 0);
        setLoading(false);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function advanceStep(nextStep: number) {
    setSaving(true);
    await fetch("/api/seller", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingStep: nextStep }),
    });
    if (nextStep >= 4) {
      router.replace("/painel");
    } else {
      setStep(nextStep);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0e14]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 animate-pulse flex items-center justify-center">
          <span className="text-white font-black text-xs font-[family-name:var(--font-geist-mono)]">F</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex-1 flex items-center gap-2">
              <div className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "bg-amber-500" : "bg-white/[0.06]"}`} />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#0f1219] p-8">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-amber-500/20">
                  <span className="text-white text-2xl font-black font-[family-name:var(--font-geist-mono)]">F</span>
                </div>
                <h1 className="text-2xl font-black text-white mb-2">Bem-vindo, {seller?.name.split(" ")[0]}!</h1>
                <p className="text-sm text-gray-400">Vamos configurar sua loja em menos de 2 minutos.</p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <span className="text-amber-400 text-sm font-bold font-[family-name:var(--font-geist-mono)]">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Confirme seus dados</p>
                    <p className="text-xs text-gray-500">Nome da loja e contato</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <span className="text-amber-400 text-sm font-bold font-[family-name:var(--font-geist-mono)]">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Escolha seu primeiro album</p>
                    <p className="text-xs text-gray-500">13 Copas do Mundo disponiveis</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <span className="text-amber-400 text-sm font-bold font-[family-name:var(--font-geist-mono)]">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Configure seus precos</p>
                    <p className="text-xs text-gray-500">Defina valores por tipo de figurinha</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => advanceStep(1)}
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {saving ? "..." : "Vamos comecar →"}
              </button>
            </div>
          )}

          {/* Step 1: Confirm shop info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white mb-1">Dados da sua loja</h2>
                <p className="text-sm text-gray-400">Confirme as informacoes e ajuste se necessario.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nome da loja</label>
                  <div className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm">
                    {seller?.shopName}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Link da vitrine</label>
                  <div className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-amber-400 text-sm font-[family-name:var(--font-geist-mono)]">
                    /loja/{seller?.shopSlug}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">WhatsApp</label>
                  <div className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm">
                    {seller?.phone ? (
                      <span className="text-white">{seller.phone}</span>
                    ) : (
                      <span className="text-gray-600">Nao informado — voce pode adicionar depois</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="px-6 py-3 rounded-xl border border-white/10 text-gray-400 text-sm font-medium hover:bg-white/[0.04] transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={() => advanceStep(2)}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {saving ? "..." : "Tudo certo, continuar →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Choose album */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white mb-1">Escolha seu primeiro album</h2>
                <p className="text-sm text-gray-400">Qual Copa voce mais vende? Voce pode adicionar mais depois.</p>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {ALBUM_OPTIONS.map((album) => (
                  <button
                    key={album.slug}
                    onClick={() => setSelectedAlbum(album.slug)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedAlbum === album.slug
                        ? "border-amber-500/40 bg-amber-500/10 ring-1 ring-amber-500/20"
                        : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                    }`}
                  >
                    <p className="text-lg font-black font-[family-name:var(--font-geist-mono)] text-white">{album.year}</p>
                    <p className="text-[11px] text-gray-400 truncate">{album.host}</p>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl border border-white/10 text-gray-400 text-sm font-medium hover:bg-white/[0.04] transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={() => advanceStep(3)}
                  disabled={saving || !selectedAlbum}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {saving ? "..." : "Continuar →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Pricing tips + finish */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white mb-1">Dicas de precos</h2>
                <p className="text-sm text-gray-400">Sugestoes baseadas no mercado. Voce personaliza depois no painel.</p>
              </div>

              <div className="space-y-3">
                {[
                  { type: "Regular", price: "R$ 1,00 – R$ 2,00", desc: "Figurinhas comuns" },
                  { type: "Especial / Foil", price: "R$ 3,00 – R$ 5,00", desc: "Brilhantes e holograficas" },
                  { type: "Lendaria", price: "R$ 8,00 – R$ 15,00", desc: "Raras, bordless, extra" },
                ].map((tip) => (
                  <div key={tip.type} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div>
                      <p className="text-sm font-medium text-white">{tip.type}</p>
                      <p className="text-xs text-gray-500">{tip.desc}</p>
                    </div>
                    <span className="text-sm font-bold font-[family-name:var(--font-geist-mono)] text-amber-400">{tip.price}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/20">
                <p className="text-sm text-amber-400 font-medium">Voce pode definir precos por album, por tipo ou individualmente na pagina de Precos do painel.</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl border border-white/10 text-gray-400 text-sm font-medium hover:bg-white/[0.04] transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={() => advanceStep(4)}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {saving ? "Preparando seu painel..." : "Abrir meu painel →"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Passo {step + 1} de 4
        </p>
      </div>
    </div>
  );
}
