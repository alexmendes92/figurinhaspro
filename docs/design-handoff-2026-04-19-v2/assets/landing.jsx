// Landing page + Onboarding
const { useState: uS_L, useEffect: uE_L, useMemo: uM_L } = React;

function Landing({ goApp }) {
  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* Sticky header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(10px)",
          background: "color-mix(in srgb, var(--bg) 85%, transparent)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "14px 32px",
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <Logo />
          <nav style={{ display: "flex", gap: 20, marginLeft: 24 }}>
            <a style={{ fontSize: 13, color: "var(--fg-dim)", cursor: "pointer" }}>
              Funcionalidades
            </a>
            <a style={{ fontSize: 13, color: "var(--fg-dim)", cursor: "pointer" }}>Planos</a>
            <a style={{ fontSize: 13, color: "var(--fg-dim)", cursor: "pointer" }}>Casos reais</a>
            <a style={{ fontSize: 13, color: "var(--fg-dim)", cursor: "pointer" }}>Ajuda</a>
          </nav>
          <div style={{ flex: 1 }} />
          <button className="btn ghost sm" onClick={goApp}>
            Entrar
          </button>
          <button className="btn primary sm" onClick={goApp}>
            Abrir minha loja
          </button>
        </div>
      </header>

      {/* Hero */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 70% 20%, rgba(232,87,28,0.18), transparent 55%), radial-gradient(ellipse at 10% 80%, rgba(15,61,46,0.35), transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "72px 32px 60px",
            display: "grid",
            gridTemplateColumns: "1.05fr 1fr",
            gap: 48,
            alignItems: "center",
            position: "relative",
          }}
        >
          <div>
            <div className="chip" style={{ marginBottom: 18 }}>
              <span className="rdot holo" /> Copa 2026 · pré-venda aberta
            </div>
            <h1 className="display" style={{ fontSize: 112, margin: 0 }}>
              Complete seu <span style={{ color: "var(--accent)" }}>álbum</span>.<br />
              Venda sem esforço.
            </h1>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.55,
                color: "var(--fg-dim)",
                maxWidth: 520,
                marginTop: 24,
                fontWeight: 500,
              }}
            >
              FigurinhasPro transforma o caos do WhatsApp em uma operação profissional. Scanner por
              câmera, preços inteligentes, vitrine que converte e um painel que antecipa cada
              decisão.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
              <button className="btn primary lg" onClick={goApp}>
                Começar grátis <Icon name="arrow" size={14} />
              </button>
              <button className="btn lg" onClick={goApp}>
                Ver demonstração · 90s
              </button>
            </div>
            <div
              style={{
                display: "flex",
                gap: 22,
                marginTop: 28,
                color: "var(--fg-mute)",
                fontSize: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <Icon name="check" size={12} /> 14 dias grátis, sem cartão
              </div>
              <div>
                <Icon name="check" size={12} /> Importa seu estoque atual em 3 min
              </div>
              <div>
                <Icon name="check" size={12} /> Pix, MP e Stripe
              </div>
            </div>
          </div>
          <HeroCollage />
        </div>

        {/* ticker */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-2)",
          }}
        >
          <div
            style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 32px", overflow: "hidden" }}
          >
            <div className="ticker" style={{ animation: "ticker 40s linear infinite" }}>
              <span>Ao vivo agora:</span>
              <span>
                <b>+R$ 2.847</b> vendidos nas últimas 24h pela rede
              </span>
              <span>·</span>
              <span>
                <b>1.204</b> figurinhas escaneadas hoje
              </span>
              <span>·</span>
              <span>
                <b>87</b> novas lojas esta semana
              </span>
              <span>·</span>
              <span>
                Brasil #10 subiu <b>+34%</b> em demanda
              </span>
              <span>·</span>
              <span>
                <b>492</b> pedidos fechados hoje
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Dor + solução */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "72px 32px" }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          A rotina que FigurinhasPro elimina
        </div>
        <h2 className="display" style={{ fontSize: 72, margin: "0 0 36px", maxWidth: 900 }}>
          83 mensagens no WhatsApp.
          <br />
          <span style={{ color: "var(--accent)" }}>Zero</span> precisam da sua atenção.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            {
              pain: "Planilha de 670 figurinhas",
              fix: "Scanner por câmera marca tudo em segundos",
              icon: "cam",
            },
            {
              pain: "Preço errado, prejuízo certo",
              fix: "Sugestão inteligente por raridade + demanda",
              icon: "tag",
            },
            {
              pain: '"Tem a do Vini Jr.?" 47 vezes',
              fix: "Vitrine pública com link curto e QR",
              icon: "store",
            },
            { pain: "Reserva que nunca paga", fix: "Expiração automática em 30min", icon: "zap" },
            {
              pain: "Cadê o lucro real?",
              fix: "Painel financeiro com top vendedoras + giro",
              icon: "chart",
            },
            {
              pain: "Lançou álbum novo, e agora?",
              fix: "Catálogo importado automaticamente em 1 clique",
              icon: "sparkle",
            },
          ].map((c, i) => (
            <div key={i} className="card hover" style={{ padding: 20 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: "var(--accent)",
                  marginBottom: 10,
                }}
              >
                <Icon name={c.icon} size={16} />
                <span className="eyebrow">Antes → Depois</span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--fg-mute)",
                  textDecoration: "line-through",
                  marginBottom: 6,
                }}
              >
                {c.pain}
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.35 }}>{c.fix}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Product showcase */}
      <section
        style={{
          background: "var(--bg-2)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "72px 32px" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            Um painel, toda a operação
          </div>
          <h2 className="display" style={{ fontSize: 64, margin: "0 0 36px", maxWidth: 800 }}>
            Feito para colecionadores que viraram empresários.
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: 32,
              alignItems: "center",
            }}
          >
            <ShowcaseMockup />
            <div>
              {[
                {
                  t: "Modo Rápido",
                  d: "Bata 100 figurinhas em 40s com teclado numérico ou câmera. As mãos acompanham o cérebro.",
                },
                {
                  t: "Preço que se mexe",
                  d: "Raridade × demanda × seu histórico. Toda noite, uma sugestão. Você aceita ou ignora.",
                },
                {
                  t: "Vitrine que vende",
                  d: "Link curto, QR, tema custom. Comprador filtra por falta, reserva e paga sem você digitar nada.",
                },
                {
                  t: "Alertas que importam",
                  d: '"Figurinha X é sua top 3 e acabou." Não é notificação, é gerência.',
                },
              ].map((f, i) => (
                <div key={i} style={{ padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 22,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {f.t}
                  </div>
                  <div
                    style={{ color: "var(--fg-dim)", fontSize: 14, marginTop: 4, lineHeight: 1.5 }}
                  >
                    {f.d}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "72px 32px" }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Planos
        </div>
        <h2 className="display" style={{ fontSize: 64, margin: "0 0 36px" }}>
          Pague pelo que gera,
          <br />
          não pelo que promete.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            {
              n: "Hobby",
              p: "Grátis",
              t: "para sempre",
              feat: [
                "1 álbum ativo",
                "50 figurinhas em vitrine",
                "Link público com QR",
                "Pedidos via WhatsApp",
              ],
              cta: "Começar",
            },
            {
              n: "Pro",
              p: "R$ 39",
              t: "/mês",
              hi: true,
              feat: [
                "Álbuns ilimitados",
                "Scanner por câmera",
                "Preço inteligente",
                "Financeiro completo",
                "Domínio custom",
              ],
              cta: "Iniciar 14 dias grátis",
            },
            {
              n: "Loja",
              p: "R$ 99",
              t: "/mês",
              feat: [
                "Até 3 vendedores",
                "API + webhook",
                "Gateway próprio",
                "Suporte prioritário",
                "Whitelabel parcial",
              ],
              cta: "Falar com vendas",
            },
          ].map((p, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: 24,
                position: "relative",
                borderColor: p.hi ? "var(--accent)" : "var(--border)",
                background: p.hi
                  ? "linear-gradient(180deg, rgba(232,87,28,0.08), transparent)"
                  : "var(--surface)",
              }}
            >
              {p.hi && (
                <div
                  style={{
                    position: "absolute",
                    top: -10,
                    right: 16,
                    background: "var(--accent)",
                    color: "#111",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 999,
                    letterSpacing: "0.08em",
                  }}
                >
                  MAIS ESCOLHIDO
                </div>
              )}
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 26,
                  letterSpacing: "-0.01em",
                }}
              >
                {p.n}
              </div>
              <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 6 }}>
                <span className="display" style={{ fontSize: 44 }}>
                  {p.p}
                </span>
                <span style={{ color: "var(--fg-mute)", fontSize: 13 }}>{p.t}</span>
              </div>
              <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                {p.feat.map((f, j) => (
                  <div
                    key={j}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      fontSize: 13,
                      color: "var(--fg-dim)",
                    }}
                  >
                    <Icon name="check" size={14} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <button
                className={`btn ${p.hi ? "primary" : ""} lg`}
                style={{ width: "100%", marginTop: 22, justifyContent: "center" }}
                onClick={goApp}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          background: "var(--grass-deep)",
          color: "#F6F1E8",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 20% 80%, rgba(232,87,28,0.4), transparent 60%)",
          }}
        />
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            padding: "80px 32px",
            textAlign: "center",
            position: "relative",
          }}
        >
          <h2 className="display" style={{ fontSize: 96, margin: 0 }}>
            O próximo álbum
            <br />é seu.
          </h2>
          <p
            style={{
              fontSize: 17,
              color: "rgba(246,241,232,0.7)",
              maxWidth: 500,
              margin: "18px auto 28px",
            }}
          >
            Seus concorrentes ainda estão digitando no WhatsApp. Você já pode estar dormindo.
          </p>
          <button className="btn primary lg" onClick={goApp} style={{ padding: "14px 28px" }}>
            Abrir minha loja agora <Icon name="arrow" size={14} />
          </button>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--border)" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "24px 32px",
            display: "flex",
            alignItems: "center",
            gap: 24,
            color: "var(--fg-mute)",
            fontSize: 12,
          }}
        >
          <Logo size={14} />
          <span style={{ marginLeft: 12 }}>© 2026 FigurinhasPro</span>
          <span style={{ marginLeft: "auto" }}>Feito para colecionadores, por colecionadores.</span>
        </div>
      </footer>
    </div>
  );
}

function HeroCollage() {
  const picks = uM_L(() => {
    const s = window.FP_DATA.stickers;
    return [s[5], s[12], s[32], s[60], s[88], s[120]];
  }, []);
  return (
    <div style={{ position: "relative", height: 480 }}>
      {/* Mock panel */}
      <div
        className="card slide-up"
        style={{
          position: "absolute",
          top: 40,
          right: 0,
          width: 440,
          padding: 18,
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div className="between" style={{ marginBottom: 12 }}>
          <div>
            <div className="eyebrow">Hoje</div>
            <div className="display" style={{ fontSize: 32 }}>
              R$ 847,20
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="chip ok">+32% vs ontem</div>
            <div style={{ marginTop: 8 }}>
              <Spark values={[12, 14, 13, 18, 22, 19, 24, 28, 34]} />
            </div>
          </div>
        </div>
        <div className="hr" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="between" style={{ fontSize: 13 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="rdot holo" />
              <span>Brasil #10 acabou</span>
            </div>
            <span className="chip danger">Repor</span>
          </div>
          <div className="between" style={{ fontSize: 13 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Icon name="receipt" size={14} />
              <span>3 pedidos aguardando Pix</span>
            </div>
            <span className="chip warn">28min</span>
          </div>
          <div className="between" style={{ fontSize: 13 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Icon name="whats" size={14} />
              <span>Caio M. pediu 34 figurinhas</span>
            </div>
            <span className="chip ok">Auto-importado</span>
          </div>
        </div>
      </div>
      {/* Stickers floating */}
      <div
        style={{ position: "absolute", top: 0, left: 40, width: 120, transform: "rotate(-8deg)" }}
      >
        {picks[0] && <Sticker s={picks[0]} qty={3} />}
      </div>
      <div
        style={{ position: "absolute", top: 160, left: -20, width: 130, transform: "rotate(6deg)" }}
      >
        {picks[1] && <Sticker s={{ ...picks[1], rarity: "holo" }} qty={1} />}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 90,
          width: 120,
          transform: "rotate(-3deg)",
        }}
      >
        {picks[2] && <Sticker s={{ ...picks[2], rarity: "legend" }} qty={2} />}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 260,
          width: 100,
          transform: "rotate(9deg)",
        }}
      >
        {picks[3] && <Sticker s={picks[3]} qty={0} />}
      </div>
    </div>
  );
}

function ShowcaseMockup() {
  const s = window.FP_DATA.stickers.slice(40, 76);
  return (
    <div className="card" style={{ padding: 18, boxShadow: "var(--shadow-lg)" }}>
      <div className="between" style={{ marginBottom: 14 }}>
        <div>
          <div className="eyebrow">Copa 2026 · Argentina</div>
          <div className="h3">20 figurinhas · 14 em estoque</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <div className="chip">Ordenar: nº</div>
          <div className="chip ok">
            <Icon name="cam" size={11} /> Scanner
          </div>
        </div>
      </div>
      <div className="sticker-grid" style={{ "--sticker-size": "70px", gap: 6 }}>
        {s.map((x) => (
          <Sticker key={x.id} s={x} qty={window.FP_DATA.stock[x.id]} showBadge={false} />
        ))}
      </div>
      <div className="hr" />
      <div className="between" style={{ fontSize: 12, color: "var(--fg-dim)" }}>
        <span>
          Completude <b style={{ color: "var(--fg)" }}>68%</b>
        </span>
        <span>•</span>
        <span>Faltam 7 para completar o time</span>
        <span>•</span>
        <span style={{ color: "var(--accent)" }}>Preço sugerido: R$ 0,85</span>
      </div>
    </div>
  );
}

// Onboarding
function Onboarding({ goApp }) {
  const [step, setStep] = uS_L(0);
  const [chosenAlbum, setChosenAlbum] = uS_L("copa26");
  const [scanned, setScanned] = uS_L(0);
  const steps = ["Boas-vindas", "Sua loja", "Álbum ativo", "Scanner de figurinhas", "Tudo pronto"];

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg)" }}>
      <aside
        style={{
          width: 320,
          padding: "28px 28px",
          borderRight: "1px solid var(--border)",
          background: "var(--bg-2)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Logo />
        <div className="eyebrow" style={{ marginTop: 40, marginBottom: 16 }}>
          Setup em 3 minutos
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {steps.map((s, i) => (
            <div
              key={i}
              onClick={() => setStep(i)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                background: step === i ? "var(--surface-2)" : "transparent",
                boxShadow: step === i ? "inset 2px 0 0 var(--accent)" : "none",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background:
                    i < step ? "var(--accent)" : i === step ? "var(--surface)" : "transparent",
                  border: i === step ? "1px solid var(--accent)" : "1px solid var(--border-strong)",
                  color: i < step ? "#111" : "var(--fg-dim)",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i < step ? <Icon name="check" size={12} /> : i + 1}
              </div>
              <span style={{ fontSize: 13, color: step === i ? "var(--fg)" : "var(--fg-dim)" }}>
                {s}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", fontSize: 11, color: "var(--fg-mute)" }}>
          Dica: você pode pular qualquer passo. Tudo é editável depois.
        </div>
      </aside>
      <main style={{ flex: 1, padding: "60px 80px", overflow: "auto" }}>
        {step === 0 && (
          <div className="slide-up">
            <div className="eyebrow" style={{ marginBottom: 14 }}>
              Bem-vindo
            </div>
            <h1 className="display" style={{ fontSize: 96, margin: 0 }}>
              Oi, Alex.
              <br />
              <span style={{ color: "var(--accent)" }}>Bora montar sua loja?</span>
            </h1>
            <p
              style={{
                fontSize: 16,
                color: "var(--fg-dim)",
                maxWidth: 540,
                marginTop: 20,
                lineHeight: 1.5,
              }}
            >
              Vamos configurar seu estoque, sua vitrine e seu primeiro álbum. Em 3 minutos você terá
              um link pronto para compartilhar — e seu WhatsApp pode descansar.
            </p>
            <div style={{ marginTop: 28, display: "flex", gap: 12 }}>
              <button className="btn primary lg" onClick={() => setStep(1)}>
                Começar <Icon name="arrow" size={14} />
              </button>
              <button className="btn ghost lg">Já tenho conta, entrar</button>
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="slide-up" style={{ maxWidth: 560 }}>
            <div className="eyebrow">Passo 1 de 4</div>
            <h2 className="h2" style={{ margin: "8px 0 8px" }}>
              Qual o nome da sua loja?
            </h2>
            <p style={{ color: "var(--fg-dim)", marginBottom: 20 }}>
              Vira o link público:{" "}
              <span className="mono" style={{ color: "var(--accent)" }}>
                figurinhaspro.com/alex
              </span>
            </p>
            <label
              style={{ display: "block", fontSize: 12, color: "var(--fg-mute)", marginBottom: 6 }}
            >
              NOME DA LOJA
            </label>
            <input
              defaultValue="Loja do Alex"
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                background: "var(--surface)",
                border: "1px solid var(--border-strong)",
                color: "var(--fg)",
                fontSize: 16,
                outline: "none",
              }}
            />
            <label
              style={{
                display: "block",
                fontSize: 12,
                color: "var(--fg-mute)",
                marginTop: 16,
                marginBottom: 6,
              }}
            >
              CIDADE · ESTADO
            </label>
            <input
              defaultValue="São Paulo · SP"
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--fg)",
                fontSize: 16,
                outline: "none",
              }}
            />
            <div style={{ marginTop: 28 }}>
              <button className="btn primary lg" onClick={() => setStep(2)}>
                Próximo <Icon name="arrow" size={14} />
              </button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="slide-up">
            <div className="eyebrow">Passo 2 de 4</div>
            <h2 className="h2" style={{ margin: "8px 0 8px" }}>
              Escolha o álbum que vai vender
            </h2>
            <p style={{ color: "var(--fg-dim)", marginBottom: 20 }}>
              Começamos com um — você adiciona mais quando quiser.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 12,
                maxWidth: 720,
              }}
            >
              {window.FP_DATA.albums.map((a) => (
                <div
                  key={a.id}
                  className="card hover"
                  onClick={() => setChosenAlbum(a.id)}
                  style={{
                    padding: 18,
                    display: "flex",
                    gap: 14,
                    cursor: "pointer",
                    borderColor: chosenAlbum === a.id ? "var(--accent)" : "var(--border)",
                    background:
                      chosenAlbum === a.id
                        ? "linear-gradient(180deg, rgba(232,87,28,0.08), transparent)"
                        : "var(--surface)",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 64,
                      borderRadius: 8,
                      background: `linear-gradient(160deg, ${a.color}, #0a0a0a)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                    }}
                  >
                    {a.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>
                      {a.total} figurinhas
                    </div>
                    {a.active && (
                      <span className="chip ok" style={{ marginTop: 6 }}>
                        Em destaque
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      alignSelf: "center",
                      color: chosenAlbum === a.id ? "var(--accent)" : "var(--fg-mute)",
                    }}
                  >
                    {chosenAlbum === a.id ? (
                      <Icon name="check" size={18} />
                    ) : (
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          border: "1px solid var(--border-strong)",
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 28 }}>
              <button className="btn primary lg" onClick={() => setStep(3)}>
                Próximo <Icon name="arrow" size={14} />
              </button>
            </div>
          </div>
        )}
        {step === 3 && (
          <ScannerOnboarding
            onDone={() => setStep(4)}
            onSkip={() => setStep(4)}
            scanned={scanned}
            setScanned={setScanned}
          />
        )}
        {step === 4 && (
          <div
            className="slide-up"
            style={{ textAlign: "center", maxWidth: 640, margin: "40px auto" }}
          >
            <div style={{ fontSize: 80 }}>🎉</div>
            <h1 className="display" style={{ fontSize: 88, margin: "12px 0" }}>
              Sua loja está no ar.
            </h1>
            <p style={{ color: "var(--fg-dim)", fontSize: 16, lineHeight: 1.5 }}>
              Seu link público é{" "}
              <span className="mono" style={{ color: "var(--accent)" }}>
                figurinhaspro.com/alex
              </span>
              . Compartilhe no Instagram, WhatsApp, onde quiser.
            </p>
            <div
              className="card"
              style={{
                padding: 18,
                margin: "24px 0",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  background: "#fff",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    background: "#111",
                    backgroundImage: "repeating-conic-gradient(#111 0 25%, #fff 0 50%)",
                    backgroundSize: "8px 8px",
                    borderRadius: 4,
                  }}
                />
              </div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>
                  figurinhaspro.com/alex
                </div>
                <div style={{ color: "var(--fg-mute)", fontSize: 12 }}>
                  QR pronto para imprimir e colar na lojinha física
                </div>
              </div>
              <button className="btn sm">
                <Icon name="link" size={12} /> Copiar
              </button>
            </div>
            <button className="btn primary lg" onClick={goApp}>
              Ir para o painel <Icon name="arrow" size={14} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function ScannerOnboarding({ onDone, onSkip, scanned, setScanned }) {
  const stickers = uM_L(() => window.FP_DATA.stickers.slice(0, 30), []);
  const [flash, setFlash] = uS_L(-1);

  const snap = () => {
    const next = scanned;
    if (next >= 12) {
      onDone();
      return;
    }
    setFlash(next);
    setScanned(next + 1);
    setTimeout(() => setFlash(-1), 450);
  };
  return (
    <div className="slide-up">
      <div className="eyebrow">Passo 3 de 4</div>
      <h2 className="h2" style={{ margin: "8px 0 8px" }}>
        Scanner de figurinhas — teste grátis
      </h2>
      <p style={{ color: "var(--fg-dim)", marginBottom: 20 }}>
        Aponte a câmera para uma pilha de figurinhas. Marcamos no estoque sem você digitar nada.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div
          className="card"
          style={{
            padding: 0,
            overflow: "hidden",
            position: "relative",
            aspectRatio: "4/3",
            background: "#050807",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at center, #0F3D2E 0%, #050807 100%)",
            }}
          />
          {/* viewfinder */}
          <div
            style={{
              position: "absolute",
              inset: 28,
              border: "1px dashed rgba(255,255,255,0.3)",
              borderRadius: 12,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 28,
              left: 28,
              right: 28,
              display: "flex",
              justifyContent: "space-between",
              color: "rgba(255,255,255,.7)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
            }}
          >
            <span>● REC</span>
            <span>{scanned} detectadas</span>
          </div>
          {/* laser */}
          <div
            style={{
              position: "absolute",
              left: 32,
              right: 32,
              top: "50%",
              height: 1,
              background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
              boxShadow: "0 0 16px var(--accent)",
              animation: "laser 2.2s ease-in-out infinite",
            }}
          />
          {/* detected box */}
          {flash >= 0 && (
            <div
              style={{
                position: "absolute",
                left: 40 + (flash % 4) * 60,
                top: 70 + (flash % 3) * 60,
                width: 54,
                height: 72,
                border: "2px solid var(--accent)",
                borderRadius: 6,
                boxShadow: "0 0 14px var(--accent)",
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <button onClick={snap} className="btn primary lg" style={{ borderRadius: 999 }}>
              <Icon name="cam" size={14} /> Detectar pilha
            </button>
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Adicionadas ao estoque
          </div>
          <div className="sticker-grid" style={{ "--sticker-size": "68px", gap: 6 }}>
            {stickers.slice(0, scanned).map((s) => (
              <Sticker key={s.id} s={s} qty={1} showBadge={false} />
            ))}
            {Array.from({ length: Math.max(0, 12 - scanned) }).map((_, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: "3/4",
                  borderRadius: 10,
                  border: "1px dashed var(--border-strong)",
                }}
              />
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: "var(--fg-mute)" }}>
            {scanned}/12 para completar — ou pule a qualquer momento.
          </div>
        </div>
      </div>
      <div style={{ marginTop: 28, display: "flex", gap: 12 }}>
        <button className="btn primary lg" onClick={onDone}>
          Continuar <Icon name="arrow" size={14} />
        </button>
        <button className="btn ghost lg" onClick={onSkip}>
          Pular
        </button>
      </div>
      <style>
        {
          "@keyframes laser{0%,100%{transform:translateY(-60px)}50%{transform:translateY(60px)}} @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}"
        }
      </style>
    </div>
  );
}

Object.assign(window, { Landing, Onboarding });
