"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthError } from "@/components/auth/auth-error";

const ALBUM_OPTIONS = [
  { year: 2022, host: "Qatar", slug: "panini_fifa_world_cup_2022" },
  { year: 2018, host: "Rússia", slug: "panini_fifa_world_cup_2018" },
  { year: 2014, host: "Brasil", slug: "panini_fifa_world_cup_2014" },
  { year: 2010, host: "África do Sul", slug: "panini_fifa_world_cup_2010" },
  { year: 2006, host: "Alemanha", slug: "panini_fifa_world_cup_2006" },
  { year: 2002, host: "Coreia/Japão", slug: "panini_fifa_world_cup_2002" },
  { year: 1998, host: "França", slug: "panini_fifa_world_cup_1998" },
  { year: 1994, host: "EUA", slug: "panini_fifa_world_cup_1994" },
  { year: 1990, host: "Itália", slug: "panini_fifa_world_cup_1990" },
  { year: 1986, host: "México", slug: "panini_fifa_world_cup_1986" },
  { year: 1982, host: "Espanha", slug: "panini_fifa_world_cup_1982" },
  { year: 1978, host: "Argentina", slug: "panini_fifa_world_cup_1978" },
  { year: 1974, host: "Alemanha Ocidental", slug: "panini_fifa_world_cup_1974" },
];

const STEPS = [
  { label: "Boas-vindas", icon: "M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" },
  { label: "Dados", icon: "M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349" },
  { label: "Álbum", icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" },
  { label: "Preços", icon: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seller, setSeller] = useState<{ name: string; shopName: string; shopSlug: string; phone: string } | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string>("");
  const [prices, setPrices] = useState({ regular: "1.50", foil: "4.00", shiny: "10.00" });
  const [setupError, setSetupError] = useState("");

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
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 animate-pulse flex items-center justify-center">
            <span className="text-white font-black text-sm font-[family-name:var(--font-geist-mono)]">F</span>
          </div>
          <p className="text-xs text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Progress Bar Segmentada */}
        <div className="flex items-center gap-0 mb-10 px-4">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <div className="flex flex-col items-center relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    i < step
                      ? "bg-amber-500 border-amber-500 shadow-lg shadow-amber-500/30"
                      : i === step
                      ? "bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/20"
                      : "bg-white/[0.03] border-white/[0.08]"
                  }`}
                >
                  {i < step ? (
                    <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg
                      className={`w-4 h-4 ${i === step ? "text-amber-400" : "text-gray-500"}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                    </svg>
                  )}
                </div>
                <span
                  className={`text-[10px] mt-2 font-semibold tracking-wider uppercase whitespace-nowrap ${
                    i <= step ? "text-amber-400" : "text-gray-600"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 mt-[-18px] rounded-full overflow-hidden bg-white/[0.06]">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-700 ease-out"
                    style={{ width: i < step ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#0f1219] p-8 slide-up" key={step}>
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <AuthLogo size="md" />
                <h1 className="text-2xl font-black text-white mb-2 mt-5">Bem-vindo, {seller?.name.split(" ")[0]}!</h1>
                <p className="text-sm text-gray-400">Vamos configurar sua loja em menos de 2 minutos.</p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { n: "1", title: "Confirme seus dados", desc: "Nome da loja e contato" },
                  { n: "2", title: "Escolha seu primeiro álbum", desc: "13 Copas do Mundo disponíveis" },
                  { n: "3", title: "Configure seus preços", desc: "Defina valores por tipo de figurinha" },
                ].map((item) => (
                  <div key={item.n} className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <span className="text-amber-400 text-sm font-bold font-[family-name:var(--font-geist-mono)]">{item.n}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <AuthButton onClick={() => advanceStep(1)} loading={saving}>
                Vamos começar →
              </AuthButton>
            </div>
          )}

          {/* Step 1: Confirm shop info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white mb-1">Dados da sua loja</h2>
                <p className="text-sm text-gray-400">Confirme as informações e ajuste se necessário.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Nome da loja</label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                    <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349" />
                    </svg>
                    <span className="text-white text-sm">{seller?.shopName}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Link da vitrine</label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-amber-500/20">
                    <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-1.822a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.94 8.586" />
                    </svg>
                    <span className="text-amber-400 text-sm font-[family-name:var(--font-geist-mono)]">/loja/{seller?.shopSlug}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-2">WhatsApp</label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                    <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    {seller?.phone ? (
                      <span className="text-white text-sm">{seller.phone}</span>
                    ) : (
                      <span className="text-gray-600 text-sm">Não informado — você pode adicionar depois</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <AuthButton variant="ghost" onClick={() => setStep(0)} className="w-auto px-6">
                  Voltar
                </AuthButton>
                <AuthButton onClick={() => advanceStep(2)} loading={saving} className="flex-1">
                  Tudo certo, continuar →
                </AuthButton>
              </div>
            </div>
          )}

          {/* Step 2: Choose album */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white mb-1">Escolha seu primeiro álbum</h2>
                <p className="text-sm text-gray-400">Qual Copa você mais vende? Você pode adicionar mais depois.</p>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                {ALBUM_OPTIONS.map((album) => (
                  <button
                    key={album.slug}
                    onClick={() => setSelectedAlbum(album.slug)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedAlbum === album.slug
                        ? "border-amber-500/40 bg-amber-500/10 ring-1 ring-amber-500/20 shadow-lg shadow-amber-500/10"
                        : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                    }`}
                  >
                    <p className="text-lg font-black font-[family-name:var(--font-geist-mono)] text-white">{album.year}</p>
                    <p className="text-[11px] text-gray-400 truncate">{album.host}</p>
                  </button>
                ))}
              </div>

              <AuthError message={setupError} />

              <div className="flex gap-3">
                <AuthButton variant="ghost" onClick={() => setStep(1)} className="w-auto px-6">
                  Voltar
                </AuthButton>
                <AuthButton
                  className="flex-1"
                  loading={saving}
                  disabled={!selectedAlbum}
                  onClick={async () => {
                    setSaving(true);
                    setSetupError("");
                    try {
                      const albumData = ALBUM_OPTIONS.find((a) => a.slug === selectedAlbum);
                      if (albumData) {
                        const res = await fetch("/api/inventory/setup", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ albumSlug: selectedAlbum }),
                        });
                        if (!res.ok) {
                          const err = await res.json().catch(() => ({}));
                          setSetupError(err.error || "Erro ao configurar álbum");
                          setSaving(false);
                          return;
                        }
                      }
                      advanceStep(3);
                    } catch {
                      setSetupError("Erro de conexão. Tente novamente.");
                      setSaving(false);
                    }
                  }}
                >
                  {saving ? "Configurando álbum..." : "Continuar →"}
                </AuthButton>
              </div>
            </div>
          )}

          {/* Step 3: Pricing */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white mb-1">Defina seus preços</h2>
                <p className="text-sm text-gray-400">Valores iniciais por tipo de figurinha. Ajuste depois no painel.</p>
              </div>

              <div className="space-y-3">
                {[
                  { key: "regular" as const, label: "Normal", desc: "Figurinhas comuns", emoji: "📄" },
                  { key: "foil" as const, label: "Especial (Foil)", desc: "Brilhantes e holográficas", emoji: "✨" },
                  { key: "shiny" as const, label: "Brilhante (Shiny)", desc: "Raras, borderless, extra", emoji: "💎" },
                ].map((tip) => (
                  <div key={tip.key} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{tip.emoji}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{tip.label}</p>
                        <p className="text-xs text-gray-500">{tip.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">R$</span>
                      <input
                        type="number"
                        step="0.50"
                        min="0.01"
                        value={prices[tip.key]}
                        onChange={(e) => setPrices((p) => ({ ...p, [tip.key]: e.target.value }))}
                        className="w-20 text-right font-[family-name:var(--font-geist-mono)] text-amber-400 font-bold text-sm py-1.5 px-2 rounded-lg bg-white/[0.04] border border-white/[0.08] focus:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/10 transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 flex items-start gap-3">
                <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <p className="text-[13px] text-amber-400/80">Você pode ajustar por álbum, por seção ou por figurinha individual depois no painel.</p>
              </div>

              <div className="flex gap-3">
                <AuthButton variant="ghost" onClick={() => setStep(2)} className="w-auto px-6">
                  Voltar
                </AuthButton>
                <AuthButton
                  className="flex-1"
                  loading={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      for (const [type, val] of Object.entries(prices)) {
                        const price = parseFloat(val);
                        if (price > 0) {
                          await fetch("/api/prices", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ stickerType: type, price }),
                          });
                        }
                      }
                      advanceStep(4);
                    } catch {
                      setSaving(false);
                    }
                  }}
                >
                  {saving ? "Salvando preços..." : "Abrir meu painel →"}
                </AuthButton>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6 font-[family-name:var(--font-geist-mono)]">
          Passo {step + 1} de 4
        </p>
      </div>
    </div>
  );
}
