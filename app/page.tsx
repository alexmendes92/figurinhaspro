import Link from "next/link";

const features = [
  { icon: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z", title: "Estoque visual", desc: "Grid com imagens reais. Clique para marcar, quantidade por figurinha.", color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-500/10" },
  { icon: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z", title: "Preços flexíveis", desc: "Regular, foil, shiny — ou preço individual por figurinha.", color: "from-blue-500 to-blue-600", bg: "bg-blue-500/10" },
  { icon: "M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349", title: "Vitrine online", desc: "Link exclusivo. Clientes veem só o disponível.", color: "from-purple-500 to-purple-600", bg: "bg-purple-500/10" },
  { icon: "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z", title: "WhatsApp", desc: "Orçamento formatado direto no WhatsApp.", color: "from-green-500 to-green-600", bg: "bg-green-500/10" },
  { icon: "M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184", title: "Pedidos", desc: "Workflow completo: orçamento → pago → enviado.", color: "from-amber-500 to-amber-600", bg: "bg-amber-500/10" },
  { icon: "M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872", title: "13 Copas", desc: "De 1970 a 2022. +7.000 figurinhas catalogadas.", color: "from-rose-500 to-rose-600", bg: "bg-rose-500/10" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0e14]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0b0e14]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <span className="text-white font-black text-xs font-[family-name:var(--font-geist-mono)]">F</span>
            </div>
            <span className="font-black text-sm text-white">Figurinhas<span className="text-emerald-400">Pro</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors font-medium">Entrar</Link>
            <Link href="/registro" className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-500/20">Criar conta</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-28 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-bold mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Para revendedores de figurinhas Panini
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            <span className="text-white">Venda figurinhas</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">como um profissional</span>
          </h1>

          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Estoque visual, preços customizados, vitrine online e orçamentos via WhatsApp. Tudo numa plataforma feita para quem vende figurinhas avulsas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/registro" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-2xl shadow-emerald-500/25 text-center">
              Começar grátis →
            </Link>
            <Link href="#features" className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/10 text-gray-300 font-semibold text-sm hover:bg-white/[0.04] hover:border-white/20 transition-all text-center">
              Ver funcionalidades
            </Link>
          </div>

          <div className="flex items-center justify-center gap-12 mt-20">
            {[{ v: "7.122", l: "figurinhas" }, { v: "13", l: "Copas do Mundo" }, { v: "1970–2022", l: "cobertura total" }].map((s) => (
              <div key={s.l} className="text-center">
                <p className="text-2xl font-black font-[family-name:var(--font-geist-mono)] text-white">{s.v}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">Funcionalidades</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Tudo para sua revenda</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="group p-6 rounded-2xl bg-[#0f1219] border border-white/[0.06] hover:border-white/[0.12] transition-all">
                <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-5`}>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-[13px] text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-24 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">Planos</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Simples e transparente</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { name: "Starter", price: "0", period: "grátis", features: ["100 figurinhas", "10 pedidos/mês", "1 álbum", "Vitrine básica"], highlight: false },
              { name: "Pro", price: "29", period: "/mês", features: ["1.000 figurinhas", "100 pedidos/mês", "Todos os álbuns", "WhatsApp integrado", "Preços custom"], highlight: true },
              { name: "Ilimitado", price: "59", period: "/mês", features: ["Sem limites", "Pedidos ilimitados", "Todos os álbuns", "Relatórios", "Suporte prioritário"], highlight: false },
            ].map((plan) => (
              <div key={plan.name} className={`relative p-7 rounded-2xl border transition-all ${plan.highlight ? "border-emerald-500/30 bg-emerald-500/[0.03] shadow-2xl shadow-emerald-500/10" : "border-white/[0.06] bg-[#0f1219]"}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-emerald-500/30">
                    Popular
                  </div>
                )}
                <p className="text-sm font-bold text-white mb-5">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-sm text-gray-500">R$</span>
                  <span className="text-5xl font-black text-white font-[family-name:var(--font-geist-mono)] tracking-tighter">{plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-[13px] text-gray-300">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/registro" className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.highlight ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20" : "border border-white/10 text-gray-300 hover:bg-white/[0.04]"}`}>
                  Começar
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <span className="text-white text-[7px] font-black font-[family-name:var(--font-geist-mono)]">F</span>
            </div>
            <span className="text-xs text-gray-500">FigurinhasPro</span>
          </div>
          <span className="text-[10px] text-gray-600 font-[family-name:var(--font-geist-mono)]">7.122 figurinhas · 13 Copas</span>
        </div>
      </footer>
    </div>
  );
}
