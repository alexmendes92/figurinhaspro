import Link from "next/link";

const features = [
  { icon: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z", title: "Estoque visual", desc: "Grid com imagens reais de cada figurinha. Clique para marcar, controle quantidade por unidade." },
  { icon: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z", title: "Precos flexiveis", desc: "Defina precos por tipo (normal, especial, brilhante) ou individualmente por figurinha." },
  { icon: "M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349", title: "Vitrine online", desc: "Link exclusivo da sua loja. Clientes veem so o que esta disponivel e montam o pedido." },
  { icon: "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z", title: "WhatsApp integrado", desc: "Orcamento formatado vai direto pro WhatsApp do cliente com todos os detalhes." },
  { icon: "M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184", title: "Gestao de pedidos", desc: "Workflow completo: orcamento, pagamento, envio. Tudo rastreado num so lugar." },
  { icon: "M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872", title: "13 Copas + Copa 2026", desc: "De 1970 a 2022 catalogadas. Album da Copa 2026 sera adicionado assim que lancar." },
];

const steps = [
  { num: "01", title: "Crie sua conta", desc: "Cadastro em 30 segundos. Escolha o nome da sua loja e pronto." },
  { num: "02", title: "Monte seu estoque", desc: "Selecione os albuns, marque as figurinhas disponiveis e defina seus precos." },
  { num: "03", title: "Compartilhe sua vitrine", desc: "Envie o link da sua loja para clientes. Eles montam o pedido e voce recebe no WhatsApp." },
];

const testimonials = [
  { name: "Rafael M.", city: "Sao Paulo, SP", text: "Vendia figurinhas pelo Excel. Com o FigurinhasPro, meu controle ficou 10x mais rapido e profissional.", stickers: "800+" },
  { name: "Camila S.", city: "Curitiba, PR", text: "Meus clientes adoram a vitrine. Montam o pedido sozinhos e eu so confirmo. Economizo horas por semana.", stickers: "1.200+" },
  { name: "Diego L.", city: "Belo Horizonte, MG", text: "Comecei no plano gratis e em 2 semanas fiz upgrade pro Pro. O investimento se paga no primeiro dia.", stickers: "500+" },
];

const faqs = [
  { q: "Preciso pagar para comecar?", a: "Nao. O plano Starter e 100% gratis com 100 figurinhas, 10 pedidos/mes e 1 album. Faca upgrade quando quiser." },
  { q: "Como meus clientes fazem pedidos?", a: "Voce compartilha o link da sua vitrine. Eles escolhem as figurinhas, montam o carrinho e enviam o orcamento direto pelo WhatsApp." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim, sem multa e sem burocracia. O acesso continua ate o fim do periodo pago." },
  { q: "A Copa 2026 vai estar disponivel?", a: "Sim! O album da Copa 2026 sera adicionado assim que a Panini lancar oficialmente. Voce ja vai estar pronto." },
  { q: "Quais formas de pagamento aceita?", a: "Cartao de credito (Visa, Mastercard, Elo) e PIX, processados via Stripe com total seguranca." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0e14]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0b0e14]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-white font-black text-xs font-[family-name:var(--font-geist-mono)]">F</span>
            </div>
            <span className="font-black text-sm text-white">Figurinhas<span className="text-amber-400">Pro</span></span>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <Link href="#features" className="hidden sm:inline px-3 py-2 text-sm text-gray-500 hover:text-white transition-colors font-medium">Features</Link>
            <Link href="#planos" className="hidden sm:inline px-3 py-2 text-sm text-gray-500 hover:text-white transition-colors font-medium">Planos</Link>
            <Link href="/login" className="px-3 sm:px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors font-medium">Entrar</Link>
            <Link href="/registro" className="px-4 sm:px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs sm:text-sm font-bold transition-all shadow-lg shadow-amber-500/20 active:bg-amber-400">Criar conta</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-20 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(245,158,11,0.06),transparent_60%)]" />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs font-bold mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Copa 2026 esta chegando — prepare sua loja agora
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            <span className="text-white">Venda figurinhas</span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">como um profissional</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Estoque visual, precos customizados, vitrine online e orcamentos via WhatsApp. A plataforma feita para quem vende figurinhas avulsas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/registro" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-2xl shadow-amber-500/25 text-center">
              Comecar gratis →
            </Link>
            <Link href="#como-funciona" className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/10 text-gray-300 font-semibold text-sm hover:bg-white/[0.04] hover:border-white/20 transition-all text-center">
              Como funciona?
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 sm:gap-12 mt-14 sm:mt-20">
            {[
              { v: "7.122", l: "figurinhas" },
              { v: "13", l: "Copas" },
              { v: "1970–2026", l: "cobertura" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <p className="text-xl sm:text-2xl font-black font-[family-name:var(--font-geist-mono)] text-white">{s.v}</p>
                <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-widest mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Copa 2026 Banner */}
      <section className="px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/[0.06] to-transparent p-5 sm:p-8 lg:p-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <span className="text-2xl sm:text-3xl font-black font-[family-name:var(--font-geist-mono)] text-amber-400">26</span>
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">Copa do Mundo 2026 — A maior de todas</h3>
                <p className="text-[13px] sm:text-sm text-gray-400 leading-relaxed">
                  48 selecoes. 3 paises-sede. O album mais esperado da historia. Revendedores que se prepararem agora vao dominar o mercado quando o album lancar. Monte sua loja hoje e esteja pronto.
                </p>
              </div>
              <Link href="/registro" className="w-full sm:w-auto text-center shrink-0 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-all shadow-lg shadow-amber-500/20 active:bg-amber-400">
                Garantir minha loja
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="px-4 sm:px-6 py-16 sm:py-24 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">3 passos simples</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Como funciona</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-amber-500/30 to-transparent -translate-x-4" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
                  <span className="text-xl font-black font-[family-name:var(--font-geist-mono)] text-amber-400">{step.num}</span>
                </div>
                <h3 className="font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 sm:px-6 py-16 sm:py-24 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Funcionalidades</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Tudo para sua revenda</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="group p-6 rounded-2xl bg-[#0f1219] border border-white/[0.06] hover:border-amber-500/20 hover:bg-amber-500/[0.02] transition-all">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center mb-5">
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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

      {/* Social Proof */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Depoimentos</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Quem usa, recomenda</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl bg-[#0f1219] border border-white/[0.06]">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.city}</p>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-[11px] font-bold font-[family-name:var(--font-geist-mono)]">
                    {t.stickers} figs
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="px-4 sm:px-6 py-16 sm:py-24 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Planos</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Simples e transparente</h2>
            <p className="text-sm text-gray-500 mt-3">Comece gratis. Faca upgrade quando sua revenda crescer.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { name: "Starter", price: "0", period: "gratis", features: ["100 figurinhas", "10 pedidos/mes", "1 album", "Vitrine basica"], highlight: false },
              { name: "Pro", price: "29", period: "/mes", features: ["1.000 figurinhas", "100 pedidos/mes", "Todos os 13 albuns", "WhatsApp integrado", "Precos custom por album"], highlight: true },
              { name: "Ilimitado", price: "59", period: "/mes", features: ["Figurinhas ilimitadas", "Pedidos ilimitados", "Todos os 13 albuns", "Relatorios avancados", "Suporte prioritario"], highlight: false },
            ].map((plan) => (
              <div key={plan.name} className={`relative p-7 rounded-2xl border transition-all ${plan.highlight ? "border-amber-500/30 bg-amber-500/[0.04] shadow-2xl shadow-amber-500/10 ring-1 ring-amber-500/20" : "border-white/[0.06] bg-[#0f1219]"}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider shadow-lg shadow-amber-500/30">
                    Mais popular
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
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                        <svg className="w-2.5 h-2.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/registro" className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.highlight ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20" : "border border-white/10 text-gray-300 hover:bg-white/[0.04]"}`}>
                  {plan.highlight ? "Comecar com Pro" : "Comecar gratis"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-4 sm:px-6 py-16 sm:py-24 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Duvidas</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Perguntas frequentes</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="p-5 rounded-2xl bg-[#0f1219] border border-white/[0.06]">
                <p className="text-sm font-bold text-white mb-2">{faq.q}</p>
                <p className="text-[13px] text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 border-t border-white/[0.04]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Pronto para profissionalizar suas vendas?</h2>
          <p className="text-gray-400 mb-8">Crie sua conta em 30 segundos. Sem cartao de credito. Sem compromisso.</p>
          <Link href="/registro" className="inline-flex px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-2xl shadow-amber-500/25">
            Criar minha loja gratis →
          </Link>
          <p className="text-xs text-gray-600 mt-4">Mais de 7.000 figurinhas catalogadas. 13 Copas do Mundo.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                <span className="text-white text-[8px] font-black font-[family-name:var(--font-geist-mono)]">F</span>
              </div>
              <span className="text-xs text-gray-500">FigurinhasPro</span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="#features" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Features</Link>
              <Link href="#planos" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Planos</Link>
              <Link href="#faq" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">FAQ</Link>
              <Link href="/termos" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Termos</Link>
              <Link href="/privacidade" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Privacidade</Link>
            </div>
            <span className="text-[10px] text-gray-600 font-[family-name:var(--font-geist-mono)]">7.122 figurinhas · 13 Copas · 1970–2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
