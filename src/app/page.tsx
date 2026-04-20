import Link from "next/link";

const painPairs = [
  { pain: "Planilha com 670 linhas que você mesmo digitou", fix: "Scanner por câmera marca tudo em segundos, sem digitar uma linha" },
  { pain: "Preço errado = prejuízo certo no final do mês", fix: "Sugestão inteligente por raridade, demanda e seu histórico real" },
  { pain: '"Tem a do Vini Jr.?" 47 vezes no mesmo dia', fix: "Vitrine pública com link curto, QR e filtro por falta do cliente" },
  { pain: "Reserva no WhatsApp que nunca paga e some do grupo", fix: "Expiração automática em 30min + confirmação por Pix ou cartão" },
  { pain: "Cadê o lucro real? Só vejo entradas e saídas soltas", fix: "Financeiro com top vendedoras, giro por álbum e margem mensal" },
  { pain: "Lançou álbum novo — e agora reimportar tudo de novo?", fix: "Catálogo das 13 Copas já pronto. Copa 2026 chega automaticamente" },
];

const features = [
  { title: "Modo rápido", desc: "Bata 100 figurinhas em 40s com teclado numérico ou câmera. As mãos acompanham o cérebro." },
  { title: "Preço que se mexe", desc: "Raridade × demanda × seu histórico. Toda noite, uma sugestão. Você aceita ou ignora." },
  { title: "Vitrine que converte", desc: "Link curto, QR, tema custom. Comprador filtra por falta, reserva e paga sem você digitar nada." },
  { title: "Alertas que importam", desc: '"Figurinha X é sua top 3 e acabou." Não é notificação — é gerência da sua revenda.' },
];

const steps = [
  { num: "01", title: "Crie sua conta", desc: "Cadastro em 30 segundos. Escolha o nome da sua loja e pronto." },
  { num: "02", title: "Monte seu estoque", desc: "Selecione os álbuns, marque as figurinhas disponíveis e defina seus preços." },
  { num: "03", title: "Compartilhe a vitrine", desc: "Envie o link da sua loja. Clientes montam o pedido e você recebe no WhatsApp." },
];

const testimonials = [
  { name: "Rafael M.", city: "São Paulo, SP", text: "Vendia figurinhas pelo Excel. Com o FigurinhasPro, meu controle ficou 10x mais rápido e profissional.", stickers: "800+" },
  { name: "Camila S.", city: "Curitiba, PR", text: "Meus clientes adoram a vitrine. Montam o pedido sozinhos e eu só confirmo. Economizo horas por semana.", stickers: "1.200+" },
  { name: "Diego L.", city: "Belo Horizonte, MG", text: "Comecei no plano grátis e em 2 semanas fiz upgrade pro Pro. O investimento se paga no primeiro dia.", stickers: "500+" },
];

const faqs = [
  { q: "Preciso pagar para começar?", a: "Não. O plano Starter é 100% grátis com 100 figurinhas, 10 pedidos/mês e 1 álbum. Faça upgrade quando quiser." },
  { q: "Como meus clientes fazem pedidos?", a: "Você compartilha o link da sua vitrine. Eles escolhem as figurinhas, montam o carrinho e enviam o orçamento direto pelo WhatsApp." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim, sem multa e sem burocracia. O acesso continua até o fim do período pago." },
  { q: "A Copa 2026 vai estar disponível?", a: "Sim. O álbum da Copa 2026 será adicionado assim que a Panini lançar oficialmente — seu estoque já estará pronto para receber." },
  { q: "Quais formas de pagamento aceita?", a: "Cartão de crédito (Visa, Mastercard, Elo) e PIX, processados via Stripe com total segurança." },
];

function StickerMini({ rot, num, team, name, rarity, qty }: { rot: string; num: string; team: string; name: string; rarity?: "holo" | "legend"; qty?: number }) {
  const bg =
    rarity === "holo"
      ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 30%, #92400e 60%, #fbbf24 100%)"
      : rarity === "legend"
      ? "linear-gradient(160deg, #fbbf24, #78350f)"
      : "linear-gradient(160deg, #1a1f2e, #0b0e14)";
  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 float-slow"
      style={{ aspectRatio: "3/4", transform: `rotate(${rot})`, background: bg, ["--r" as string]: rot }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.3),transparent_50%)]" />
      <div className="absolute top-1.5 left-2 font-[family-name:var(--font-geist-mono)] text-[9px] font-bold text-white bg-black/40 backdrop-blur px-1.5 py-0.5 rounded">{num}</div>
      <div className="absolute top-1.5 right-2 font-[family-name:var(--font-geist-mono)] text-[8px] font-bold text-white/90 tracking-wider">{team}</div>
      <div className="absolute inset-x-2 bottom-1.5 text-white">
        <div className="text-[9px] font-bold leading-tight drop-shadow">{name}</div>
      </div>
      {qty !== undefined && qty > 0 && (
        <div className="absolute bottom-1 right-1 min-w-[18px] h-[18px] px-1 rounded bg-black border border-white/20 font-[family-name:var(--font-geist-mono)] text-[9px] font-bold text-white flex items-center justify-center">×{qty}</div>
      )}
      {qty === 0 && <div className="absolute inset-0 bg-black/50 border-2 border-dashed border-white/20 rounded-xl" />}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0e14]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0b0e14]/85 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <span className="text-black font-black text-sm font-[family-name:var(--font-geist-mono)]">F</span>
            </div>
            <span className="font-black text-sm text-white tracking-tight">Figurinhas<span className="text-amber-400">Pro</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <Link href="#funciona" className="px-3 py-2 text-[13px] text-gray-400 hover:text-white transition-colors font-medium">Como funciona</Link>
            <Link href="#features" className="px-3 py-2 text-[13px] text-gray-400 hover:text-white transition-colors font-medium">Funcionalidades</Link>
            <Link href="#planos" className="px-3 py-2 text-[13px] text-gray-400 hover:text-white transition-colors font-medium">Planos</Link>
            <Link href="#faq" className="px-3 py-2 text-[13px] text-gray-400 hover:text-white transition-colors font-medium">Ajuda</Link>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/login" className="px-3 sm:px-4 py-2 text-[13px] text-gray-300 hover:text-white transition-colors font-medium">Entrar</Link>
            <Link href="/registro" className="px-4 sm:px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs sm:text-sm font-bold transition-all shadow-lg shadow-amber-500/20">Abrir minha loja</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(251,191,36,0.10),transparent_55%),radial-gradient(ellipse_at_10%_90%,rgba(34,197,94,0.06),transparent_60%)] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-20 grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
          <div className="slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/25 bg-amber-500/[0.06] text-amber-400 text-[11px] font-bold mb-6 sm:mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 pulse-dot" />
              Copa 2026 · pré-venda aberta
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-[84px] font-black tracking-tight leading-[0.95] text-white mb-6">
              Complete seu <span className="text-amber-400">álbum</span>.
              <br />
              Venda sem esforço.
            </h1>

            <p className="text-[15px] sm:text-base lg:text-lg text-gray-400 leading-relaxed max-w-xl mb-8">
              FigurinhasPro transforma o caos do WhatsApp em operação profissional. Scanner por câmera, preços inteligentes, vitrine que converte e um painel que antecipa cada decisão.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link href="/registro" className="px-6 sm:px-7 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all shadow-lg shadow-amber-500/25 text-center inline-flex items-center justify-center gap-2">
                Começar grátis <span aria-hidden>→</span>
              </Link>
              <Link href="#funciona" className="px-6 sm:px-7 py-3.5 rounded-xl border border-white/10 text-gray-200 font-semibold text-sm hover:bg-white/[0.04] hover:border-white/20 transition-all text-center">
                Ver demonstração · 90s
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-8 text-[12px] text-gray-500">
              <span className="inline-flex items-center gap-1.5"><span className="text-amber-400">✓</span> 14 dias grátis, sem cartão</span>
              <span className="inline-flex items-center gap-1.5"><span className="text-amber-400">✓</span> Importa seu estoque em 3 min</span>
              <span className="inline-flex items-center gap-1.5"><span className="text-amber-400">✓</span> PIX, cartão e Stripe</span>
            </div>
          </div>

          {/* Hero collage — mini-painel flutuante + stickers */}
          <div className="relative h-[460px] sm:h-[500px] lg:h-[540px] hidden lg:block">
            {/* Mock panel card */}
            <div className="absolute top-10 right-0 w-[420px] z-10 rounded-2xl bg-[#0f1219] border border-white/[0.08] shadow-2xl shadow-black/60 p-5 slide-up">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-amber-400 font-bold mb-1">Hoje</p>
                  <p className="text-[34px] font-black tracking-tight text-white leading-none font-[family-name:var(--font-geist-mono)]">R$ 847,20</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">+32% vs ontem</span>
                  <div className="mt-2 flex items-end gap-0.5 h-[22px] justify-end">
                    {[12, 14, 13, 18, 22, 19, 24, 28, 34].map((v, i) => (
                      <span key={i} className="w-1 bg-amber-400/70 rounded-sm" style={{ height: `${(v / 34) * 100}%` }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="h-px bg-white/[0.06] my-3" />
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2 text-gray-300"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Brasil #10 acabou</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20">Repor</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2 text-gray-300">3 pedidos aguardando Pix</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">28min</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2 text-gray-300">Caio M. pediu 34 figurinhas</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">Auto</span>
                </div>
              </div>
            </div>

            {/* Stickers flutuantes — posicionados ao redor do painel, sem cobrir KPI */}
            <div className="absolute -top-2 left-0 w-[104px]">
              <StickerMini rot="-8deg" num="BRA10" team="BRA" name="Vini Jr." qty={3} />
            </div>
            <div className="absolute top-[260px] -left-4 w-[116px]">
              <StickerMini rot="6deg" num="ARG09" team="ARG" name="Messi" rarity="holo" qty={1} />
            </div>
            <div className="absolute bottom-2 left-28 w-[112px]">
              <StickerMini rot="-3deg" num="FRA07" team="FRA" name="Mbappé" rarity="legend" qty={2} />
            </div>
            <div className="absolute bottom-6 right-6 w-[92px]">
              <StickerMini rot="9deg" num="POR07" team="POR" name="Cristiano" qty={0} />
            </div>
          </div>
        </div>

        {/* Ticker — live activity strip */}
        <div className="relative border-t border-white/[0.06] bg-white/[0.015] overflow-hidden">
          <div className="max-w-6xl mx-auto py-3 overflow-hidden">
            <div className="ticker-track font-[family-name:var(--font-geist-mono)] text-[12px] text-gray-400">
              {[0, 1].map((k) => (
                <div key={k} className="inline-flex items-center gap-12 pr-12" aria-hidden={k === 1}>
                  <span className="text-amber-400 font-bold">AO VIVO</span>
                  <span><b className="text-emerald-400 font-bold">+R$ 2.847</b> vendidos nas últimas 24h pela rede</span>
                  <span className="text-gray-600">·</span>
                  <span><b className="text-emerald-400 font-bold">1.204</b> figurinhas escaneadas hoje</span>
                  <span className="text-gray-600">·</span>
                  <span><b className="text-emerald-400 font-bold">87</b> novas lojas esta semana</span>
                  <span className="text-gray-600">·</span>
                  <span>Brasil #10 subiu <b className="text-emerald-400 font-bold">+34%</b> em demanda</span>
                  <span className="text-gray-600">·</span>
                  <span><b className="text-emerald-400 font-bold">492</b> pedidos fechados hoje</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Antes → Depois */}
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-amber-400 text-[11px] font-bold uppercase tracking-[0.18em] mb-3">A rotina que some</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[0.95] text-white mb-12 max-w-4xl">
            83 mensagens no WhatsApp.
            <br />
            <span className="text-amber-400">Zero</span> precisam da sua atenção.
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {painPairs.map((p, i) => (
              <div key={i} className="group p-6 rounded-2xl bg-[#0f1219] border border-white/[0.06] hover:border-amber-500/25 hover:bg-amber-500/[0.02] transition-all">
                <p className="text-amber-400 text-[10px] font-bold uppercase tracking-[0.18em] mb-3">Antes → Depois</p>
                <p className="text-[13px] text-gray-500 line-through leading-snug mb-2">{p.pain}</p>
                <p className="text-[15px] text-gray-100 font-medium leading-snug">{p.fix}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product showcase */}
      <section id="funciona" className="px-4 sm:px-6 py-16 sm:py-24 border-t border-white/[0.06] bg-[#0d1017]">
        <div className="max-w-6xl mx-auto">
          <p className="text-amber-400 text-[11px] font-bold uppercase tracking-[0.18em] mb-3">Um painel, toda a operação</p>
          <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-black tracking-tight leading-[0.95] text-white mb-12 max-w-3xl">
            Feito para colecionadores
            <br />
            que viraram empresários.
          </h2>

          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 items-center">
            {/* Painel mockup */}
            <div className="rounded-2xl bg-[#0f1219] border border-white/[0.08] shadow-2xl shadow-black/50 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-amber-400 font-bold mb-1">Copa 2026 · Argentina</p>
                  <p className="text-[15px] font-bold text-white">20 figurinhas · 14 em estoque</p>
                </div>
                <div className="flex gap-1.5">
                  <span className="px-2 py-1 rounded-lg bg-white/5 text-gray-400 text-[11px] border border-white/[0.06]">Ordenar: nº</span>
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] border border-emerald-500/20">Scanner</span>
                </div>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-8 gap-1.5">
                {Array.from({ length: 24 }).map((_, i) => {
                  const rarity = i === 3 ? "holo" : i === 9 ? "legend" : undefined;
                  const bg = rarity === "holo"
                    ? "linear-gradient(135deg, #fbbf24, #f59e0b, #92400e, #fbbf24)"
                    : rarity === "legend"
                    ? "linear-gradient(160deg, #fbbf24, #78350f)"
                    : "linear-gradient(160deg, #1a1f2e, #0b0e14)";
                  const qty = [2, 0, 1, 4, 1, 0, 3, 2, 1, 1, 0, 5, 2, 1, 0, 3, 1, 0, 2, 1, 0, 2, 3, 1][i];
                  return (
                    <div key={i} className="relative rounded-md overflow-hidden border border-white/10" style={{ aspectRatio: "3/4", background: bg }}>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.25),transparent_45%)]" />
                      <div className="absolute top-0.5 left-1 font-[family-name:var(--font-geist-mono)] text-[7px] font-bold text-white/80">#{i + 1}</div>
                      {qty === 0 && <div className="absolute inset-0 bg-black/60 border border-dashed border-white/20 rounded-md" />}
                      {qty > 0 && (
                        <div className="absolute bottom-0.5 right-0.5 min-w-[12px] h-[12px] px-0.5 rounded bg-black/80 border border-white/20 font-[family-name:var(--font-geist-mono)] text-[7px] font-bold text-white flex items-center justify-center">{qty}</div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="h-px bg-white/[0.06] my-4" />

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-gray-400">
                <span>Completude <b className="text-white">68%</b></span>
                <span className="text-gray-600">·</span>
                <span>Faltam <b className="text-white">7</b> para completar o time</span>
                <span className="text-gray-600">·</span>
                <span className="text-amber-400">Preço sugerido: <b>R$ 0,85</b></span>
              </div>
            </div>

            {/* Feature list */}
            <div>
              {features.map((f) => (
                <div key={f.title} className="py-5 border-b border-white/[0.06]">
                  <h3 className="text-[22px] sm:text-2xl font-black tracking-tight text-white mb-2">{f.title}</h3>
                  <p className="text-[14px] text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona — 3 passos */}
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-amber-400 text-[11px] font-bold uppercase tracking-[0.18em] mb-3">3 passos simples</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-12">Em 3 minutos, sua loja no ar.</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-amber-500/30 to-transparent -translate-x-4" aria-hidden />
                )}
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mb-5">
                  <span className="text-xl font-black font-[family-name:var(--font-geist-mono)] text-amber-400">{step.num}</span>
                </div>
                <h3 className="font-bold text-white mb-2 text-lg">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features (extra) */}
      <section id="features" className="px-4 sm:px-6 py-16 sm:py-24 border-t border-white/[0.06] bg-[#0d1017]">
        <div className="max-w-6xl mx-auto">
          <p className="text-amber-400 text-[11px] font-bold uppercase tracking-[0.18em] mb-3">Funcionalidades</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-12">Tudo para sua revenda.</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Estoque visual", desc: "Grid com imagens reais de cada figurinha. Clique para marcar, controle quantidade por unidade." },
              { title: "Preços flexíveis", desc: "Defina preços por tipo (normal, especial, brilhante) ou individualmente por figurinha." },
              { title: "Vitrine online", desc: "Link exclusivo da sua loja. Clientes veem só o que está disponível e montam o pedido." },
              { title: "WhatsApp integrado", desc: "Orçamento formatado vai direto pro WhatsApp do cliente com todos os detalhes." },
              { title: "Gestão de pedidos", desc: "Workflow completo: orçamento, pagamento, envio. Tudo rastreado num só lugar." },
              { title: "13 Copas + Copa 2026", desc: "De 1970 a 2022 catalogadas. Álbum da Copa 2026 será adicionado assim que lançar." },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-2xl bg-[#0f1219] border border-white/[0.06] hover:border-amber-500/25 transition-all">
                <h3 className="font-bold text-white mb-2 text-[15px]">{f.title}</h3>
                <p className="text-[13px] text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-amber-400 text-[11px] font-bold uppercase tracking-[0.18em] mb-3">Depoimentos</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-12">Quem usa, recomenda.</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl bg-[#0f1219] border border-white/[0.06]">
                <div className="flex items-center gap-1 mb-4" aria-label="5 estrelas">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-200 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.city}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-[11px] font-bold font-[family-name:var(--font-geist-mono)] border border-amber-500/20">
                    {t.stickers} figs
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="px-4 sm:px-6 py-16 sm:py-24 border-t border-white/[0.06] bg-[#0d1017]">
        <div className="max-w-5xl mx-auto">
          <p className="text-amber-400 text-[11px] font-bold uppercase tracking-[0.18em] mb-3">Planos</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-[0.95] text-white mb-3">
            Pague pelo que gera,
            <br />
            não pelo que promete.
          </h2>
          <p className="text-sm text-gray-500 mb-12">Comece grátis. Faça upgrade quando sua revenda crescer.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { name: "Starter", price: "0", period: "grátis", features: ["100 figurinhas", "10 pedidos/mês", "1 álbum", "Vitrine básica"], highlight: false, cta: "Começar grátis" },
              { name: "Pro", price: "29", period: "/mês", features: ["1.000 figurinhas", "100 pedidos/mês", "Todos os 13 álbuns", "WhatsApp integrado", "Preços custom por álbum"], highlight: true, cta: "Iniciar 14 dias grátis" },
              { name: "Ilimitado", price: "59", period: "/mês", features: ["Figurinhas ilimitadas", "Pedidos ilimitados", "Todos os 13 álbuns", "Relatórios avançados", "Suporte prioritário"], highlight: false, cta: "Começar grátis" },
            ].map((plan) => (
              <div key={plan.name} className={`relative p-7 rounded-2xl border transition-all ${plan.highlight ? "border-amber-500/40 bg-gradient-to-b from-amber-500/[0.06] to-transparent shadow-2xl shadow-amber-500/10 ring-1 ring-amber-500/20" : "border-white/[0.06] bg-[#0f1219]"}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-[0.14em] shadow-lg shadow-amber-500/30">
                    Mais escolhido
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
                    <li key={f} className="flex items-start gap-2.5 text-[13px] text-gray-300">
                      <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-2.5 h-2.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/registro" className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.highlight ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20" : "border border-white/10 text-gray-200 hover:bg-white/[0.04] hover:border-white/20"}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-amber-400 text-[11px] font-bold uppercase tracking-[0.18em] mb-3">Dúvidas</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-12">Perguntas frequentes.</h2>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group p-5 rounded-2xl bg-[#0f1219] border border-white/[0.06] open:border-amber-500/25 transition-all">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="text-sm font-bold text-white">{faq.q}</span>
                  <span className="text-amber-400 text-xl leading-none transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="text-[13px] text-gray-400 leading-relaxed mt-3">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-4 sm:px-6 py-20 sm:py-28 border-t border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(251,191,36,0.12),transparent_60%)] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] text-white mb-5">
            O próximo álbum
            <br />
            <span className="text-amber-400">é seu.</span>
          </h2>
          <p className="text-base text-gray-400 mb-10 max-w-xl mx-auto">
            Seus concorrentes ainda estão digitando no WhatsApp. Você já pode estar dormindo.
          </p>
          <Link href="/registro" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all shadow-2xl shadow-amber-500/30">
            Abrir minha loja agora <span aria-hidden>→</span>
          </Link>
          <p className="text-[11px] text-gray-600 mt-5 font-[family-name:var(--font-geist-mono)]">7.122 figurinhas · 13 Copas · 1970–2026</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <span className="text-black text-[9px] font-black font-[family-name:var(--font-geist-mono)]">F</span>
            </div>
            <span className="text-xs text-gray-500">© 2026 FigurinhasPro</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
            <Link href="#features" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Funcionalidades</Link>
            <Link href="#planos" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Planos</Link>
            <Link href="#faq" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Ajuda</Link>
            <Link href="/termos" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Termos</Link>
            <Link href="/privacidade" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Privacidade</Link>
          </div>
          <span className="text-[11px] text-gray-600 italic">Feito para colecionadores, por colecionadores.</span>
        </div>
      </footer>
    </div>
  );
}
