"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ALBUM_OPTIONS = [
  { year: 2022, host: "Qatar", slug: "panini_fifa_world_cup_2022", emoji: "🏆" },
  { year: 2018, host: "Rússia", slug: "panini_fifa_world_cup_2018", emoji: "⚽" },
  { year: 2014, host: "Brasil", slug: "panini_fifa_world_cup_2014", emoji: "🇧🇷" },
  { year: 2010, host: "África do Sul", slug: "panini_fifa_world_cup_2010", emoji: "🎺" },
  { year: 2006, host: "Alemanha", slug: "panini_fifa_world_cup_2006", emoji: "🦁" },
  { year: 2002, host: "Coreia/Japão", slug: "panini_fifa_world_cup_2002", emoji: "🎌" },
  { year: 1998, host: "França", slug: "panini_fifa_world_cup_1998", emoji: "🐓" },
  { year: 1994, host: "EUA", slug: "panini_fifa_world_cup_1994", emoji: "🗽" },
  { year: 1990, host: "Itália", slug: "panini_fifa_world_cup_1990", emoji: "🛵" },
  { year: 1986, host: "México", slug: "panini_fifa_world_cup_1986", emoji: "🌵" },
  { year: 1982, host: "Espanha", slug: "panini_fifa_world_cup_1982", emoji: "☀️" },
  { year: 1978, host: "Argentina", slug: "panini_fifa_world_cup_1978", emoji: "🧉" },
  { year: 1974, host: "Alemanha Ocidental", slug: "panini_fifa_world_cup_1974", emoji: "🏰" },
];

const STEPS = [
  { label: "Boas-vindas", hint: "Comece por aqui" },
  { label: "Sua loja", hint: "Nome e contato" },
  { label: "Álbum ativo", hint: "Escolha seu primeiro" },
  { label: "Preços iniciais", hint: "Valores por tipo" },
  { label: "Tudo pronto", hint: "Link compartilhável" },
];

interface SellerData {
  name: string;
  shopName: string;
  shopSlug: string;
  phone: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string>("");
  const [prices, setPrices] = useState({ regular: "1.50", foil: "4.00", shiny: "10.00" });
  const [setupError, setSetupError] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

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

  async function persistStep(nextStep: number) {
    await fetch("/api/seller", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingStep: nextStep }),
    });
  }

  async function advanceTo(nextStep: number) {
    setSaving(true);
    await persistStep(Math.min(nextStep, 3));
    setStep(nextStep);
    setSaving(false);
  }

  async function finishOnboarding() {
    setSaving(true);
    await persistStep(4);
    router.replace("/painel");
  }

  async function copyShopLink() {
    if (!seller) return;
    const url = `${window.location.origin}/loja/${seller.shopSlug}`;
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
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

  const firstName = seller?.name.split(" ")[0] || "vendedor";
  const shopUrl = seller ? `figurinhaspro.com/loja/${seller.shopSlug}` : "";

  return (
    <div className="min-h-screen bg-[#0b0e14] flex flex-col lg:flex-row">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-80 shrink-0 px-7 py-8 border-r border-white/[0.06] bg-[#0f1219] flex-col">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="text-black font-black text-sm font-[family-name:var(--font-geist-mono)]">F</span>
          </div>
          <div>
            <p className="text-[11px] text-amber-400/70 font-semibold uppercase tracking-wider leading-tight">FigurinhasPro</p>
            <p className="text-[10px] text-gray-500 leading-tight">Setup em 3 minutos</p>
          </div>
        </div>

        <p className="text-[10px] text-amber-400/70 font-semibold uppercase tracking-wider mt-10 mb-3">Progresso</p>
        <nav className="flex flex-col gap-1">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => i <= step && setStep(i)}
                disabled={i > step}
                className={`group flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                  active
                    ? "bg-white/[0.04] border border-white/[0.08] shadow-[inset_2px_0_0_0_rgb(251_191_36)]"
                    : done
                    ? "border border-transparent hover:bg-white/[0.02] cursor-pointer"
                    : "border border-transparent opacity-60 cursor-not-allowed"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold font-[family-name:var(--font-geist-mono)] shrink-0 transition-all ${
                    done
                      ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                      : active
                      ? "bg-amber-500/10 border border-amber-500 text-amber-400"
                      : "bg-white/[0.03] border border-white/[0.08] text-gray-500"
                  }`}
                >
                  {done ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] font-medium truncate ${active ? "text-white" : done ? "text-gray-300" : "text-gray-500"}`}>
                    {s.label}
                  </p>
                  <p className="text-[10px] text-gray-600 truncate">{s.hint}</p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/[0.06]">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            <span className="text-amber-400/70 font-semibold">Dica:</span> tudo é editável depois no painel. Você pode voltar e ajustar quando quiser.
          </p>
        </div>
      </aside>

      {/* Progress mobile */}
      <div className="lg:hidden px-5 pt-6 pb-4 border-b border-white/[0.06] bg-[#0f1219]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
              <span className="text-black font-black text-xs font-[family-name:var(--font-geist-mono)]">F</span>
            </div>
            <p className="text-[13px] font-bold text-white">FigurinhasPro</p>
          </div>
          <p className="text-[10px] text-gray-500 font-[family-name:var(--font-geist-mono)]">
            Passo {step + 1} de {STEPS.length}
          </p>
        </div>
        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <p className="text-[12px] text-amber-400 font-semibold mt-2">{STEPS[step].label}</p>
      </div>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-5 lg:px-20 py-8 lg:py-16" key={step}>
          <div className="slide-up">
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div>
                <p className="text-[11px] text-amber-400/70 font-semibold uppercase tracking-[0.2em]">Bem-vindo</p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mt-4 leading-[1.05]">
                  Oi, {firstName}.
                  <br />
                  <span className="text-amber-400">Bora montar sua loja?</span>
                </h1>
                <p className="text-base text-gray-400 mt-6 max-w-xl leading-relaxed">
                  Vamos configurar seu estoque, sua vitrine e seu primeiro álbum. Em 3 minutos você
                  terá um link pronto para compartilhar — e seu WhatsApp pode descansar.
                </p>

                <div className="mt-10 grid sm:grid-cols-3 gap-3 max-w-2xl">
                  {[
                    { n: "1", title: "Sua loja", desc: "Nome, link e contato" },
                    { n: "2", title: "Álbum", desc: "Copa do Mundo que você vende" },
                    { n: "3", title: "Preços", desc: "Valores por tipo de figurinha" },
                  ].map((item) => (
                    <div key={item.n} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                        <span className="text-amber-400 text-[11px] font-bold font-[family-name:var(--font-geist-mono)]">
                          {item.n}
                        </span>
                      </div>
                      <p className="text-[13px] font-semibold text-white">{item.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-10 flex flex-wrap gap-3">
                  <PrimaryButton onClick={() => advanceTo(1)} loading={saving}>
                    Começar agora
                    <ArrowIcon />
                  </PrimaryButton>
                </div>
              </div>
            )}

            {/* Step 1: Sua loja */}
            {step === 1 && (
              <div className="max-w-xl">
                <p className="text-[11px] text-amber-400/70 font-semibold uppercase tracking-[0.2em]">
                  Passo 1 de 4
                </p>
                <h2 className="text-3xl md:text-4xl font-black text-white mt-3">
                  Confirme os dados da sua loja
                </h2>
                <p className="text-sm text-gray-400 mt-3">
                  Isso vira o link público que você vai compartilhar.
                </p>

                <div className="mt-8 space-y-4">
                  <ReadField
                    label="Nome da loja"
                    value={seller?.shopName || ""}
                    icon={
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349"
                      />
                    }
                  />
                  <ReadField
                    label="Link da sua vitrine"
                    value={shopUrl}
                    accent
                    mono
                    icon={
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-1.822a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.94 8.586"
                      />
                    }
                  />
                  <ReadField
                    label="WhatsApp"
                    value={seller?.phone || "Não informado — adicione depois"}
                    muted={!seller?.phone}
                    icon={
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                      />
                    }
                  />
                </div>

                <StepFooter
                  onBack={() => setStep(0)}
                  onNext={() => advanceTo(2)}
                  loading={saving}
                  nextLabel="Tudo certo, continuar"
                />
              </div>
            )}

            {/* Step 2: Álbum */}
            {step === 2 && (
              <div>
                <p className="text-[11px] text-amber-400/70 font-semibold uppercase tracking-[0.2em]">
                  Passo 2 de 4
                </p>
                <h2 className="text-3xl md:text-4xl font-black text-white mt-3">
                  Escolha o álbum que vai vender
                </h2>
                <p className="text-sm text-gray-400 mt-3">
                  Começamos com um — você adiciona mais quando quiser.
                </p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                  {ALBUM_OPTIONS.map((album) => {
                    const selected = selectedAlbum === album.slug;
                    return (
                      <button
                        key={album.slug}
                        type="button"
                        onClick={() => setSelectedAlbum(album.slug)}
                        className={`group relative p-4 rounded-xl border text-left cursor-pointer transition-all ${
                          selected
                            ? "border-amber-500/40 bg-gradient-to-b from-amber-500/[0.08] to-transparent shadow-[0_0_0_1px_rgb(251_191_36_/_0.15)]"
                            : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-16 rounded-md flex items-center justify-center text-xl shrink-0"
                            style={{
                              background: selected
                                ? "linear-gradient(160deg, rgba(251,191,36,0.2), #0a0a0a)"
                                : "linear-gradient(160deg, rgba(255,255,255,0.04), #0a0a0a)",
                            }}
                          >
                            {album.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold font-[family-name:var(--font-geist-mono)] text-white">
                              {album.year}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">{album.host}</p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                              selected
                                ? "bg-amber-500 border-amber-500"
                                : "border-white/[0.12]"
                            }`}
                          >
                            {selected && (
                              <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {setupError && (
                  <div className="mt-4 p-3 rounded-xl bg-red-500/[0.06] border border-red-500/20 text-[12px] text-red-400">
                    {setupError}
                  </div>
                )}

                <StepFooter
                  onBack={() => setStep(1)}
                  onNext={async () => {
                    setSaving(true);
                    setSetupError("");
                    try {
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
                      advanceTo(3);
                    } catch {
                      setSetupError("Erro de conexão. Tente novamente.");
                      setSaving(false);
                    }
                  }}
                  loading={saving}
                  nextDisabled={!selectedAlbum}
                  nextLabel={saving ? "Configurando álbum..." : "Continuar"}
                />
              </div>
            )}

            {/* Step 3: Preços */}
            {step === 3 && (
              <div className="max-w-xl">
                <p className="text-[11px] text-amber-400/70 font-semibold uppercase tracking-[0.2em]">
                  Passo 3 de 4
                </p>
                <h2 className="text-3xl md:text-4xl font-black text-white mt-3">
                  Defina seus preços base
                </h2>
                <p className="text-sm text-gray-400 mt-3">
                  Valores iniciais por tipo. Você pode ajustar por álbum, seção ou figurinha depois.
                </p>

                <div className="mt-8 space-y-3">
                  {[
                    { key: "regular" as const, label: "Normal", desc: "Figurinhas comuns", emoji: "📄" },
                    { key: "foil" as const, label: "Especial (Foil)", desc: "Brilhantes e holográficas", emoji: "✨" },
                    { key: "shiny" as const, label: "Brilhante (Shiny)", desc: "Raras, borderless, extra", emoji: "💎" },
                  ].map((tip) => (
                    <div
                      key={tip.key}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl shrink-0">{tip.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{tip.label}</p>
                          <p className="text-[11px] text-gray-500 truncate">{tip.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-gray-500">R$</span>
                        <input
                          type="number"
                          step="0.50"
                          min="0.01"
                          value={prices[tip.key]}
                          onChange={(e) =>
                            setPrices((p) => ({ ...p, [tip.key]: e.target.value }))
                          }
                          className="w-24 text-right font-[family-name:var(--font-geist-mono)] text-amber-400 font-bold text-sm py-1.5 px-2 rounded-lg bg-white/[0.04] border border-white/[0.08] focus:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/10 transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 flex items-start gap-3">
                  <svg
                    className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                    />
                  </svg>
                  <p className="text-[12px] text-amber-400/80 leading-relaxed">
                    Ajuste por álbum, seção ou figurinha individual depois no painel — estes são só
                    valores base.
                  </p>
                </div>

                <StepFooter
                  onBack={() => setStep(2)}
                  onNext={async () => {
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
                      await persistStep(3);
                      setStep(4);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  loading={saving}
                  nextLabel={saving ? "Salvando preços..." : "Finalizar setup"}
                />
              </div>
            )}

            {/* Step 4: Tudo pronto */}
            {step === 4 && (
              <div className="max-w-2xl">
                <p className="text-[11px] text-emerald-400/80 font-semibold uppercase tracking-[0.2em]">
                  Setup concluído
                </p>
                <div className="text-5xl mt-4">🎉</div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mt-4 leading-[1.05]">
                  Sua loja está no ar.
                </h1>
                <p className="text-base text-gray-400 mt-6 max-w-xl leading-relaxed">
                  Seu link público é{" "}
                  <span className="text-amber-400 font-[family-name:var(--font-geist-mono)]">
                    {shopUrl}
                  </span>
                  . Compartilhe no Instagram, WhatsApp ou onde quiser — cada clique é uma chance de
                  venda.
                </p>

                <div className="mt-8 p-5 rounded-2xl bg-[#0f1219] border border-white/[0.06] flex items-center gap-4">
                  <div
                    aria-hidden
                    className="w-16 h-16 rounded-lg bg-white flex items-center justify-center shrink-0"
                  >
                    <div
                      className="w-12 h-12 rounded"
                      style={{
                        backgroundColor: "#111",
                        backgroundImage:
                          "repeating-conic-gradient(#111 0 25%, #fff 0 50%)",
                        backgroundSize: "6px 6px",
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold font-[family-name:var(--font-geist-mono)] text-white truncate">
                      {shopUrl}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      QR pronto para imprimir e colar na loja física
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copyShopLink}
                    className="px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-white font-semibold transition-all shrink-0 flex items-center gap-1.5"
                  >
                    {linkCopied ? (
                      <>
                        <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Copiado
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-1.822a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.94 8.586" />
                        </svg>
                        Copiar link
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <PrimaryButton onClick={finishOnboarding} loading={saving}>
                    Abrir meu painel
                    <ArrowIcon />
                  </PrimaryButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  loading,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 text-black text-sm font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} strokeOpacity={0.2} />
          <path
            d="M22 12a10 10 0 01-10 10"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-sm text-white font-semibold transition-all"
    >
      {children}
    </button>
  );
}

function StepFooter({
  onBack,
  onNext,
  loading,
  nextLabel,
  nextDisabled,
}: {
  onBack: () => void;
  onNext: () => void;
  loading?: boolean;
  nextLabel: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-10 flex flex-wrap gap-3">
      <GhostButton onClick={onBack}>Voltar</GhostButton>
      <PrimaryButton onClick={onNext} loading={loading} disabled={nextDisabled}>
        {nextLabel}
        <ArrowIcon />
      </PrimaryButton>
    </div>
  );
}

function ReadField({
  label,
  value,
  icon,
  accent,
  mono,
  muted,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
  mono?: boolean;
  muted?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-[0.18em] mb-2">
        {label}
      </label>
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border ${
          accent ? "border-amber-500/20" : "border-white/[0.08]"
        }`}
      >
        <svg
          className={`w-4 h-4 shrink-0 ${accent ? "text-amber-400" : "text-gray-500"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          {icon}
        </svg>
        <span
          className={`text-sm truncate ${
            muted ? "text-gray-500" : accent ? "text-amber-400" : "text-white"
          } ${mono ? "font-[family-name:var(--font-geist-mono)]" : ""}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}
