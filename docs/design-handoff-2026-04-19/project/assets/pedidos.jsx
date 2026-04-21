// Pedidos, Preços, Financeiro, Alertas, Scanner, WhatsApp, Loja pública
const { useState: uS_P, useEffect: uE_P, useMemo: uM_P, useRef: uR_P } = React;

/* ============ PEDIDOS ============ */
function Pedidos({ pushToast }) {
  const [tab, setTab] = uS_P("todos");
  const [sel, setSel] = uS_P(window.FP_DATA.orders[0]);
  const list = window.FP_DATA.orders;
  return (
    <div style={{ padding: 24 }}>
      <div className="between" style={{ marginBottom: 14 }}>
        <div>
          <div className="eyebrow">Pedidos</div>
          <h2 className="h2">Tudo que entra, em um lugar só</h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn sm">
            <Icon name="whats" size={14} /> Colar do WhatsApp
          </button>
          <button className="btn primary sm">
            <Icon name="plus" size={14} /> Novo pedido manual
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {[
          ["todos", "Todos · 14"],
          ["orcamento", "Orçamentos · 3"],
          ["aguardando-pix", "Aguardando Pix · 5"],
          ["pago", "Pagos · 4"],
          ["enviado", "Enviados · 2"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`btn sm ${tab === k ? "primary" : ""}`}
          >
            {l}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 14 }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>Comprador</th>
                <th>Itens</th>
                <th>Origem</th>
                <th>Tempo</th>
                <th style={{ textAlign: "right" }}>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setSel(o)}
                  style={{
                    cursor: "pointer",
                    background: sel?.id === o.id ? "var(--surface-2)" : "transparent",
                  }}
                >
                  <td className="mono">{o.id}</td>
                  <td>{o.buyer}</td>
                  <td className="num-tab">{o.items}</td>
                  <td>
                    <span className="chip">{o.origin}</span>
                  </td>
                  <td style={{ color: "var(--fg-mute)" }}>{o.time}</td>
                  <td style={{ textAlign: "right" }} className="num-tab">
                    R$ {o.total.toFixed(2)}
                  </td>
                  <td>
                    <OrderStatus s={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <OrderDetail o={sel} pushToast={pushToast} />
      </div>
    </div>
  );
}

function OrderDetail({ o, pushToast }) {
  if (!o)
    return (
      <div className="card" style={{ padding: 20 }}>
        Selecione um pedido
      </div>
    );
  const items = uM_P(() => window.FP_DATA.stickers.slice(0, Math.min(10, o.items)), [o.id]);
  return (
    <div className="card" style={{ padding: 18, alignSelf: "start", position: "sticky", top: 74 }}>
      <div className="between">
        <div>
          <div className="eyebrow">{o.origin}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24 }}>Pedido {o.id}</div>
          <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>
            {o.buyer} · há {o.time}
          </div>
        </div>
        <OrderStatus s={o.status} />
      </div>
      <div className="hr" />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxHeight: 220,
          overflow: "auto",
        }}
      >
        {items.map((s) => (
          <div key={s.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 32 }}>
              <Sticker s={s} qty={1} showBadge={false} />
            </div>
            <div style={{ flex: 1, fontSize: 13 }}>
              {s.label} · {s.team}{" "}
              <span style={{ color: "var(--fg-mute)" }}>#{String(s.num).padStart(3, "0")}</span>
            </div>
            <span className="mono" style={{ fontSize: 12 }}>
              R$ {window.FP_DATA.prices[s.id].toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      <div className="hr" />
      <div className="between" style={{ fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: "var(--fg-dim)" }}>Subtotal</span>
        <span className="mono">R$ {(o.total - 5).toFixed(2)}</span>
      </div>
      <div className="between" style={{ fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: "var(--fg-dim)" }}>Envio</span>
        <span className="mono">R$ 5,00</span>
      </div>
      <div className="between" style={{ fontSize: 15, fontWeight: 600, marginTop: 8 }}>
        <span>Total</span>
        <span className="mono">R$ {o.total.toFixed(2)}</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          className="btn primary"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={() => pushToast("Link de pagamento enviado")}
        >
          <Icon name="whats" size={14} /> Enviar Pix
        </button>
        <button className="btn" onClick={() => pushToast("Pedido marcado como enviado")}>
          Enviar
        </button>
      </div>
      {o.status === "reservado" && (
        <div className="chip warn" style={{ marginTop: 10 }}>
          ⏱ Expira em 28 min
        </div>
      )}
    </div>
  );
}

/* ============ PREÇOS ============ */
function Precos({ pushToast }) {
  const [margin, setMargin] = uS_P(20);
  const [autoAdjust, setAutoAdjust] = uS_P(true);
  const samples = uM_P(
    () => window.FP_DATA.stickers.filter((s) => s.rarity !== "common").slice(0, 8),
    []
  );
  return (
    <div style={{ padding: 24 }}>
      <div className="between" style={{ marginBottom: 20 }}>
        <div>
          <div className="eyebrow">Preços</div>
          <h2 className="h2">Regras globais, exceções quando precisar</h2>
        </div>
        <button className="btn primary sm">Aplicar em todo estoque</button>
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}
      >
        {[
          { k: "common", l: "Comum", v: "R$ 0,80", d: "base" },
          { k: "rare", l: "Raro", v: "R$ 2,80", d: "+ 250%" },
          { k: "legend", l: "Lendário", v: "R$ 9,60", d: "+ 1100%" },
        ].map((x) => (
          <div key={x.k} className="card" style={{ padding: 16 }}>
            <div className="between">
              <div className="eyebrow">
                <span className={`rdot ${x.k}`} style={{ marginRight: 6 }} />
                {x.l}
              </div>
              <button className="btn ghost sm">editar</button>
            </div>
            <div className="display" style={{ fontSize: 32, marginTop: 8 }}>
              {x.v}
            </div>
            <div style={{ fontSize: 11, color: "var(--fg-mute)" }}>{x.d}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="between" style={{ marginBottom: 14 }}>
          <div>
            <div className="eyebrow">Inteligência</div>
            <div className="h3">Sugestão automática baseada no mercado</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "var(--fg-dim)" }}>Ajustar sozinho a cada 24h</span>
            <div
              className={`switch ${autoAdjust ? "on" : ""}`}
              onClick={() => setAutoAdjust(!autoAdjust)}
            />
          </div>
        </div>
        <label style={{ fontSize: 12, color: "var(--fg-dim)" }}>
          Margem mínima sobre o mercado:{" "}
          <b className="mono" style={{ color: "var(--fg)" }}>
            +{margin}%
          </b>
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={margin}
          onChange={(e) => setMargin(+e.target.value)}
          style={{ width: "100%", marginTop: 8, accentColor: "var(--accent)" }}
        />
        <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 6 }}>
          Com +{margin}%: estima R$ {(420 + margin * 8).toFixed(0)}/mês extra sobre o volume atual.
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div className="h3">Figurinhas com preço desalinhado</div>
          <span className="chip warn">8 itens sugeridos</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th />
              <th>Figurinha</th>
              <th>Raridade</th>
              <th>Seu preço</th>
              <th>Mercado</th>
              <th>Sugerido</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {samples.map((s) => {
              const yours = window.FP_DATA.prices[s.id];
              const market = yours * (1 + Math.random() * 0.4 + 0.1);
              const sug = market * (1 + margin / 100);
              return (
                <tr key={s.id}>
                  <td style={{ width: 56 }}>
                    <div style={{ width: 36 }}>
                      <Sticker s={s} qty={1} showBadge={false} />
                    </div>
                  </td>
                  <td>
                    {s.label}{" "}
                    <span style={{ color: "var(--fg-mute)" }}>
                      · {s.team} #{String(s.num).padStart(3, "0")}
                    </span>
                  </td>
                  <td>
                    <span className={"chip"}>
                      <span className={`rdot ${s.rarity}`} />
                      &nbsp;{s.rarity}
                    </span>
                  </td>
                  <td className="num-tab mono">R$ {yours.toFixed(2)}</td>
                  <td className="num-tab mono" style={{ color: "var(--fg-dim)" }}>
                    R$ {market.toFixed(2)}
                  </td>
                  <td
                    className="num-tab mono"
                    style={{ color: "var(--accent-2)", fontWeight: 600 }}
                  >
                    R$ {sug.toFixed(2)}
                  </td>
                  <td>
                    <button
                      className="btn sm"
                      onClick={() => pushToast(`Preço atualizado: R$ ${sug.toFixed(2)}`)}
                    >
                      Aplicar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============ FINANCEIRO ============ */
function Financeiro() {
  const topStickers = uM_P(
    () => window.FP_DATA.stickers.filter((s) => s.rarity !== "common").slice(0, 6),
    []
  );
  return (
    <div style={{ padding: 24 }}>
      <div className="between" style={{ marginBottom: 20 }}>
        <div>
          <div className="eyebrow">Financeiro</div>
          <h2 className="h2">Onde está o seu lucro, de verdade</h2>
        </div>
        <select className="btn sm" style={{ appearance: "none" }}>
          <option>Últimos 30 dias</option>
          <option>Este mês</option>
          <option>Ano</option>
        </select>
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}
      >
        {[
          { l: "Faturamento", v: "R$ 12.847", c: "+18%" },
          { l: "Lucro real", v: "R$ 4.382", c: "+22%" },
          { l: "Ticket médio", v: "R$ 74,20", c: "+4%" },
          { l: "Giro de estoque", v: "2.1×", c: "bom" },
        ].map((x) => (
          <div key={x.l} className="kpi">
            <div className="l">{x.l}</div>
            <div className="v num-tab">{x.v}</div>
            <div className="d">
              <span className="chip ok" style={{ padding: "1px 6px" }}>
                {x.c}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="h3" style={{ marginBottom: 12 }}>
            Vendas por dia
          </div>
          <BarChart />
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="h3" style={{ marginBottom: 12 }}>
            Top 6 vendedoras
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topStickers.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="mono" style={{ color: "var(--fg-mute)", width: 18 }}>
                  {i + 1}
                </span>
                <div style={{ width: 30 }}>
                  <Sticker s={s} qty={1} showBadge={false} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13 }}>
                    {s.label} · {s.team}
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: "var(--surface-2)",
                      borderRadius: 99,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${90 - i * 10}%`,
                        background: "var(--accent)",
                      }}
                    />
                  </div>
                </div>
                <span className="mono" style={{ fontSize: 12 }}>
                  R$ {(320 - i * 40).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card" style={{ padding: 18, marginTop: 12 }}>
        <div className="between" style={{ marginBottom: 12 }}>
          <div className="h3">Estoque parado (>60 dias sem giro)</div>
          <span className="chip warn">R$ 840 em 124 unidades</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--fg-dim)", marginBottom: 10 }}>
          Sugestão: criar uma promoção "pacote com 10 figurinhas" por R$ 9,90 e escoar em 7 dias.
        </div>
        <button className="btn sm primary">Gerar promoção automática</button>
      </div>
    </div>
  );
}

function BarChart() {
  const data = [40, 52, 48, 65, 72, 58, 80, 94, 76, 88, 102, 120, 95, 110, 140];
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 160 }}>
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: i === data.length - 1 ? "var(--accent)" : "var(--grass)",
            height: `${(v / max) * 100}%`,
            borderRadius: "4px 4px 0 0",
            opacity: 0.6 + (i / data.length) * 0.4,
          }}
        />
      ))}
    </div>
  );
}

/* ============ ALERTAS ============ */
function Alertas() {
  const alerts = [
    ...window.FP_DATA.alerts,
    {
      tipo: "falta",
      titulo: "Argentina #007 esgotou há 2h",
      detalhe: "Top 5 da semana. Reponha para não perder o cliente Caio M.",
      severity: "high",
    },
    {
      tipo: "preco",
      titulo: "Brasil Holo: você tem único estoque do país",
      detalhe: "Pode cobrar +40% sem afetar conversão.",
      severity: "med",
    },
    {
      tipo: "tendencia",
      titulo: "Eurocopa 24 subindo na vitrine",
      detalhe: "38 views nas últimas 24h. Arquivada?",
      severity: "info",
    },
    {
      tipo: "pedido",
      titulo: "Rodrigo S. deixou o carrinho há 12min",
      detalhe: "R$ 298 · 47 itens. Mandar um lembrete?",
      severity: "med",
    },
  ];
  return (
    <div style={{ padding: 24 }}>
      <div className="between" style={{ marginBottom: 14 }}>
        <div>
          <div className="eyebrow">Central de alertas</div>
          <h2 className="h2">A gente pensa junto com você</h2>
        </div>
        <button className="btn sm">Marcar tudo como lido</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {alerts.map((a, i) => {
          const icon =
            a.tipo === "falta"
              ? "flame"
              : a.tipo === "preco"
                ? "tag"
                : a.tipo === "pedido"
                  ? "receipt"
                  : "chart";
          const c =
            a.severity === "high"
              ? "var(--danger)"
              : a.severity === "med"
                ? "var(--accent-2)"
                : "var(--info)";
          return (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 14,
                padding: 16,
                borderBottom: i === alerts.length - 1 ? "none" : "1px solid var(--border)",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "var(--surface-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: c,
                }}
              >
                <Icon name={icon} size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{a.titulo}</div>
                <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>{a.detalhe}</div>
              </div>
              <button className="btn sm">Resolver</button>
              <button className="btn ghost sm">
                <Icon name="x" size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ SCANNER (mobile-first) ============ */
function ScannerFull({ pushToast }) {
  const stickers = uM_P(() => window.FP_DATA.stickers.slice(0, 40), []);
  const [captured, setCaptured] = uS_P([]);
  const [mode, setMode] = uS_P("single"); // single | batch
  const [flash, setFlash] = uS_P(false);
  const [zoom, setZoom] = uS_P("1x");
  const [_sheetOpen, setSheetOpen] = uS_P(false);
  const [lastDetected, setLastDetected] = uS_P(null);
  const [detecting, setDetecting] = uS_P(false);

  // Auto-detect cycle for realism
  uE_P(() => {
    const t = setInterval(() => setDetecting((d) => !d), 1800);
    return () => clearInterval(t);
  }, []);

  const snap = () => {
    if (mode === "batch") {
      const batch = stickers.slice(captured.length, captured.length + 6);
      setCaptured([...captured, ...batch]);
      setLastDetected(batch[batch.length - 1]);
      setSheetOpen(true);
      setFlash(true);
      setTimeout(() => setFlash(false), 180);
      pushToast(`+${batch.length} figurinhas capturadas`);
    } else {
      const s = stickers[captured.length % stickers.length];
      setCaptured([...captured, s]);
      setLastDetected(s);
      setFlash(true);
      setTimeout(() => setFlash(false), 180);
      pushToast(`+1 · ${s.label}`);
    }
  };

  return (
    <div
      style={{
        padding: "32px 24px",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background:
          "radial-gradient(ellipse at 30% 0%, rgba(194,140,86,0.08), transparent 60%), var(--bg)",
      }}
    >
      <div style={{ maxWidth: 1100, width: "100%" }}>
        <div className="between" style={{ marginBottom: 24 }}>
          <div>
            <div className="eyebrow">Scanner · feito para o seu celular</div>
            <h2 className="h2" style={{ marginTop: 8 }}>
              Aponte. Capture. Estoque atualizado.
            </h2>
            <p
              style={{
                color: "var(--fg-dim)",
                fontSize: 14,
                maxWidth: 520,
                marginTop: 10,
                lineHeight: 1.5,
              }}
            >
              O scanner vive no app mobile do FigurinhasPro. Aqui você vê um espelho da experiência
              — aponte pela câmera, detectamos número, time e raridade em menos de 300ms.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="chip ok">
              <span className="rdot" style={{ background: "#6FCB8F" }} /> App conectado · iPhone 15
            </span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: 40,
            alignItems: "start",
            justifyContent: "center",
          }}
        >
          {/* Phone frame */}
          <div style={{ position: "relative" }}>
            <PhoneScannerMock
              mode={mode}
              setMode={setMode}
              flash={flash}
              zoom={zoom}
              setZoom={setZoom}
              captured={captured}
              detecting={detecting}
              onSnap={snap}
              onOpenSheet={() => setSheetOpen(true)}
              lastDetected={lastDetected}
            />
            {/* hint labels */}
            <div
              style={{
                position: "absolute",
                left: -160,
                top: 80,
                fontSize: 11,
                color: "var(--fg-mute)",
                fontFamily: "var(--font-mono)",
                textAlign: "right",
                maxWidth: 140,
                lineHeight: 1.4,
              }}
            >
              Detecção multi-objeto
              <br />
              em tempo real
              <br />
              <span style={{ color: "var(--accent)" }}>— 98.2% precisão</span>
            </div>
            <div
              style={{
                position: "absolute",
                right: -180,
                top: 260,
                fontSize: 11,
                color: "var(--fg-mute)",
                fontFamily: "var(--font-mono)",
                maxWidth: 160,
                lineHeight: 1.4,
              }}
            >
              Botão do volume
              <br />
              funciona como
              <br />
              disparador físico
            </div>
            <div
              style={{
                position: "absolute",
                left: -180,
                bottom: 140,
                fontSize: 11,
                color: "var(--fg-mute)",
                fontFamily: "var(--font-mono)",
                textAlign: "right",
                maxWidth: 160,
                lineHeight: 1.4,
              }}
            >
              Modo Pilha escaneia até
              <br />
              12 figurinhas de uma vez
              <br />
              no mesmo clique
            </div>
          </div>

          {/* Side panel with session + CTA */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 40 }}>
            <div className="card" style={{ padding: 18 }}>
              <div className="between">
                <div className="eyebrow">Sessão ao vivo</div>
                <span className="chip ok">{captured.length} adicionadas</span>
              </div>
              <div
                className="display"
                style={{ fontSize: 64, color: "var(--accent)", margin: "8px 0 4px" }}
              >
                {String(captured.length).padStart(3, "0")}
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-dim)" }}>
                figurinhas nesta sessão · {mode === "batch" ? "modo Pilha" : "modo Unitário"}
              </div>
              <div className="hr" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
                {captured
                  .slice(-9)
                  .reverse()
                  .map((s, i) => (
                    <div key={i} className="slide-up">
                      <Sticker s={s} qty={1} showBadge={false} />
                    </div>
                  ))}
                {captured.length === 0 &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        aspectRatio: "3/4",
                        border: "1px dashed var(--border-strong)",
                        borderRadius: 8,
                        background: "var(--surface-2)",
                      }}
                    />
                  ))}
              </div>
              <button
                className="btn primary lg"
                style={{ width: "100%", justifyContent: "center", marginTop: 14 }}
                disabled={captured.length === 0}
              >
                Salvar {captured.length} no estoque →
              </button>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                Atalhos do scanner
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                <div className="between">
                  <span style={{ color: "var(--fg-dim)" }}>Tocar na figurinha</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--fg-mute)" }}>
                    Adiciona +1
                  </span>
                </div>
                <div className="between">
                  <span style={{ color: "var(--fg-dim)" }}>Segurar</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--fg-mute)" }}>
                    Abre inspetor
                  </span>
                </div>
                <div className="between">
                  <span style={{ color: "var(--fg-dim)" }}>Arrastar p/ cima</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--fg-mute)" }}>
                    Remove
                  </span>
                </div>
                <div className="between">
                  <span style={{ color: "var(--fg-dim)" }}>Volume ↑ / ↓</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--fg-mute)" }}>
                    Disparador
                  </span>
                </div>
              </div>
            </div>

            <div
              className="card"
              style={{
                padding: 16,
                background: "linear-gradient(135deg, rgba(194,140,86,0.12), transparent)",
              }}
            >
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                Não tem o app ainda?
              </div>
              <div
                style={{ fontSize: 14, lineHeight: 1.5, color: "var(--fg-dim)", marginBottom: 12 }}
              >
                Baixe o FigurinhasPro no seu celular — scanner funciona offline, sincroniza quando
                voltar o Wi-Fi.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn sm" style={{ flex: 1, justifyContent: "center" }}>
                  <Icon name="qr" size={14} /> App Store
                </button>
                <button className="btn sm" style={{ flex: 1, justifyContent: "center" }}>
                  <Icon name="qr" size={14} /> Play
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneScannerMock({
  mode,
  setMode,
  flash,
  zoom,
  setZoom,
  captured,
  detecting,
  onSnap,
  onOpenSheet,
  lastDetected,
}) {
  const W = 340;
  const H = 720;
  return (
    <div
      style={{
        width: W,
        height: H,
        borderRadius: 44,
        overflow: "hidden",
        position: "relative",
        background: "#000",
        boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 10px #1a1a1a, 0 0 0 11px #2a2a2a",
      }}
    >
      {/* Dynamic island */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          width: 110,
          height: 32,
          borderRadius: 20,
          background: "#000",
          zIndex: 50,
          border: "1px solid #1a1a1a",
        }}
      />
      {/* Status bar */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 22,
          right: 22,
          display: "flex",
          justifyContent: "space-between",
          zIndex: 40,
          color: "#fff",
          fontFamily: "-apple-system, system-ui",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        <span style={{ marginRight: 160 }}>9:41</span>
        <span style={{ fontSize: 12, letterSpacing: 1 }}>●●●●</span>
      </div>

      {/* Camera viewfinder */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 40%, #2a2319 0%, #0a0603 70%)",
        }}
      />

      {/* Fake environment — scattered stickers seen through camera */}
      <ViewfinderStickers captured={captured} detecting={detecting} mode={mode} />

      {/* Detection frame */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 30,
          right: 30,
          bottom: 260,
          pointerEvents: "none",
        }}
      >
        {/* Corner brackets */}
        {[
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ].map(([x, y], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              [x ? "right" : "left"]: 0,
              [y ? "bottom" : "top"]: 0,
              width: 28,
              height: 28,
              borderTop: y ? "none" : "2.5px solid var(--accent-2)",
              borderBottom: y ? "2.5px solid var(--accent-2)" : "none",
              borderLeft: x ? "none" : "2.5px solid var(--accent-2)",
              borderRight: x ? "2.5px solid var(--accent-2)" : "none",
            }}
          />
        ))}
        {/* Laser line */}
        <div
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            top: "50%",
            height: 2,
            background: "linear-gradient(90deg, transparent, var(--accent-2), transparent)",
            boxShadow: "0 0 8px rgba(233,183,122,0.6)",
            animation: "laser 2.2s ease-in-out infinite",
          }}
        />
      </div>

      {/* Top chrome pills */}
      <div
        style={{
          position: "absolute",
          top: 58,
          left: 16,
          right: 16,
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          zIndex: 30,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            padding: "6px 12px",
            borderRadius: 999,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#fff",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
          }}
        >
          <span
            className="rdot"
            style={{ background: "#F56565", animation: "pulse 1.4s infinite" }}
          />{" "}
          REC
        </div>
        <div
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#fff",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
          }}
        >
          Copa 2026 · 670 figs
        </div>
      </div>

      {/* Mode toggle (segmented control, iOS style) */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 2,
          padding: 3,
          borderRadius: 999,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.08)",
          zIndex: 30,
        }}
      >
        {[
          ["single", "Unitário"],
          ["batch", "Pilha"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setMode(k)}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: 0,
              cursor: "pointer",
              background: mode === k ? "var(--accent)" : "transparent",
              color: mode === k ? "#1a1510" : "rgba(255,255,255,0.75)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 0.02,
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Zoom selector */}
      <div
        style={{
          position: "absolute",
          bottom: 180,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 4,
          padding: 4,
          borderRadius: 999,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(10px)",
          zIndex: 30,
        }}
      >
        {["0.5x", "1x", "2x"].map((z) => (
          <button
            key={z}
            onClick={() => setZoom(z)}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: 0,
              cursor: "pointer",
              background: zoom === z ? "#fff" : "transparent",
              color: zoom === z ? "#000" : "#E9B77A",
              fontSize: zoom === z ? 11 : 10,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
            }}
          >
            {z}
          </button>
        ))}
      </div>

      {/* Last detected chip */}
      {lastDetected && (
        <div
          key={lastDetected.id + captured.length}
          className="slide-up"
          style={{
            position: "absolute",
            top: 150,
            left: 16,
            right: 16,
            zIndex: 25,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: "rgba(194,140,86,0.92)",
              color: "#1a1510",
              padding: "10px 14px",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ width: 36 }}>
              <Sticker s={lastDetected} qty={1} showBadge={false} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                #{String(lastDetected.num).padStart(3, "0")} · {lastDetected.label}
              </div>
              <div style={{ fontSize: 11, opacity: 0.75 }}>
                {lastDetected.team} · detectada com 98% confiança
              </div>
            </div>
            <Icon name="check" size={16} />
          </div>
        </div>
      )}

      {/* Bottom camera controls */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 160,
          background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.85) 40%)",
          zIndex: 20,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          zIndex: 30,
        }}
      >
        {/* Thumbnail of last captures */}
        <button
          onClick={onOpenSheet}
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            padding: 0,
            border: "2px solid #fff",
            cursor: "pointer",
            background: captured.length ? "transparent" : "rgba(255,255,255,0.06)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {captured.slice(-1).map((s, i) => (
            <div key={i} style={{ position: "absolute", inset: 0 }}>
              <Sticker s={s} qty={1} showBadge={false} />
            </div>
          ))}
          {captured.length > 1 && (
            <div
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                minWidth: 20,
                height: 20,
                padding: "0 5px",
                borderRadius: 10,
                background: "var(--accent)",
                color: "#1a1510",
                fontSize: 10,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {captured.length}
            </div>
          )}
        </button>

        {/* Shutter */}
        <button
          onClick={onSnap}
          style={{
            width: 76,
            height: 76,
            borderRadius: "50%",
            padding: 0,
            border: "4px solid #fff",
            cursor: "pointer",
            background: "transparent",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              background: mode === "batch" ? "var(--accent)" : "#fff",
              transition: "transform .1s",
            }}
          />
          {mode === "batch" && (
            <div
              style={{
                position: "absolute",
                bottom: -22,
                fontSize: 10,
                color: "#E9B77A",
                fontFamily: "var(--font-mono)",
                letterSpacing: 0.08,
              }}
            >
              PILHA
            </div>
          )}
        </button>

        {/* Flip */}
        <button
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            padding: 0,
            border: 0,
            cursor: "pointer",
            background: "rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 20,
          }}
        >
          ⟲
        </button>
      </div>

      {/* Home indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: "50%",
          transform: "translateX(-50%)",
          width: 120,
          height: 4,
          borderRadius: 99,
          background: "rgba(255,255,255,0.7)",
          zIndex: 60,
        }}
      />

      {/* Flash overlay */}
      {flash && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.85)",
            zIndex: 80,
            animation: "flashFade .18s ease-out forwards",
          }}
        />
      )}
    </div>
  );
}

function ViewfinderStickers({ captured, detecting, mode }) {
  // Fixed positions of fake in-frame stickers (like you pointed camera at a pile)
  const sample = uM_P(() => window.FP_DATA.stickers.slice(0, 12), []);
  const positions = [
    { x: 36, y: 200, w: 68, h: 90, r: -8, o: 0.6 },
    { x: 130, y: 185, w: 72, h: 96, r: 4, o: 0.9 },
    { x: 225, y: 195, w: 68, h: 90, r: 12, o: 0.75 },
    { x: 60, y: 310, w: 74, h: 98, r: -4, o: 0.85 },
    { x: 170, y: 320, w: 70, h: 94, r: 7, o: 0.7 },
    { x: 90, y: 420, w: 60, h: 80, r: -15, o: 0.5 },
    { x: 200, y: 410, w: 64, h: 84, r: 8, o: 0.65 },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}>
      {positions.map((p, i) => {
        const s = sample[i % sample.length];
        const isDetected = mode === "batch" ? detecting && i < 5 : detecting && i === 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              width: p.w,
              height: p.h,
              transform: `rotate(${p.r}deg)`,
              opacity: p.o,
              transition: "opacity .3s",
            }}
          >
            <Sticker s={s} qty={1} showBadge={false} />
            {isDetected && (
              <div
                style={{
                  position: "absolute",
                  inset: -4,
                  border: "2px solid var(--accent-2)",
                  borderRadius: 10,
                  boxShadow: "0 0 12px rgba(233,183,122,0.6)",
                  animation: "detectPulse 1.2s ease-in-out infinite",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -18,
                    left: 0,
                    fontSize: 9,
                    color: "var(--accent-2)",
                    fontFamily: "var(--font-mono)",
                    background: "rgba(0,0,0,0.7)",
                    padding: "1px 5px",
                    borderRadius: 3,
                    whiteSpace: "nowrap",
                  }}
                >
                  #{String(s.num).padStart(3, "0")} · {Math.round(92 + Math.random() * 6)}%
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ============ WHATSAPP IMPORT ============ */
function WhatsImport({ pushToast }) {
  const [text, setText] = uS_P(
    "Oi! Quero as seguintes:\n#012 Brasil, #034, #56 (2x)\nBrasil Vini #10\nArgentina Messi HOLO\nTotal até 200 reais"
  );
  const [parsed, setParsed] = uS_P([]);
  const parse = () => {
    const ids = [...text.matchAll(/#(\d{1,3})/g)].map((m) => +m[1]);
    const found = ids
      .map((id) => window.FP_DATA.stickers.find((s) => s.num === id))
      .filter(Boolean);
    // add two random
    found.push(window.FP_DATA.stickers[45], window.FP_DATA.stickers[78]);
    setParsed(found);
    pushToast(`${found.length} figurinhas identificadas`);
  };
  const total = parsed.reduce((sum, s) => sum + (window.FP_DATA.prices[s.id] || 0), 0);
  return (
    <div style={{ padding: 24 }}>
      <div className="between" style={{ marginBottom: 14 }}>
        <div>
          <div className="eyebrow">Importador WhatsApp · IA</div>
          <h2 className="h2">Cole a mensagem. Nós fazemos o resto.</h2>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Mensagem do cliente
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              width: "100%",
              minHeight: 260,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 14,
              color: "var(--fg)",
              fontSize: 13,
              fontFamily: "var(--font-mono)",
              outline: "none",
              resize: "vertical",
            }}
          />
          <div className="between" style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: "var(--fg-mute)" }}>
              Aceita texto, print screen colado e áudio transcrito
            </div>
            <button className="btn primary" onClick={parse}>
              <Icon name="sparkle" size={14} /> Identificar figurinhas
            </button>
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="between" style={{ marginBottom: 10 }}>
            <div className="eyebrow">Pedido identificado</div>
            <span className="chip ok">{parsed.length} itens</span>
          </div>
          {parsed.length === 0 ? (
            <div
              style={{
                color: "var(--fg-mute)",
                fontSize: 13,
                padding: "40px 20px",
                textAlign: "center",
              }}
            >
              Clique em "Identificar figurinhas" para ver o pedido estruturado aqui.
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  maxHeight: 240,
                  overflow: "auto",
                }}
              >
                {parsed.map((s, i) => (
                  <div
                    key={i}
                    className="slide-up"
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      padding: 8,
                      background: "var(--surface-2)",
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ width: 30 }}>
                      <Sticker s={s} qty={1} showBadge={false} />
                    </div>
                    <div style={{ flex: 1, fontSize: 13 }}>
                      <div style={{ fontWeight: 500 }}>
                        {s.label} · {s.team}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--fg-mute)" }} className="mono">
                        #{String(s.num).padStart(3, "0")} · {s.rarity}
                      </div>
                    </div>
                    <span className="mono" style={{ fontSize: 12 }}>
                      R$ {window.FP_DATA.prices[s.id].toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="hr" />
              <div className="between">
                <span>Total</span>
                <span className="mono" style={{ fontSize: 18, fontWeight: 600 }}>
                  R$ {total.toFixed(2)}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  className="btn primary"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => pushToast("Pedido #2842 criado")}
                >
                  Criar pedido
                </button>
                <button className="btn" onClick={() => pushToast("Pix gerado e enviado")}>
                  <Icon name="whats" size={14} /> Enviar Pix
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ LOJA PÚBLICA ============ */
function LojaAdmin({ pushToast }) {
  return (
    <div style={{ padding: 24 }}>
      <div className="between" style={{ marginBottom: 14 }}>
        <div>
          <div className="eyebrow">Vitrine pública</div>
          <h2 className="h2">figurinhaspro.com/alex</h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn sm">
            <Icon name="qr" size={14} /> Baixar QR
          </button>
          <button className="btn sm" onClick={() => pushToast("Link copiado")}>
            <Icon name="link" size={14} /> Copiar link
          </button>
          <button className="btn primary sm">Ver minha vitrine →</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 16 }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="h3" style={{ marginBottom: 12 }}>
            Aparência
          </div>
          <label style={{ fontSize: 12, color: "var(--fg-dim)" }}>Nome da vitrine</label>
          <input
            defaultValue="Loja do Alex · Figurinhas"
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--fg)",
              fontSize: 13,
              marginTop: 6,
              outline: "none",
            }}
          />
          <label style={{ fontSize: 12, color: "var(--fg-dim)", marginTop: 12, display: "block" }}>
            Cor principal
          </label>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            {["#E8571C", "#1E6B3B", "#0A3D91", "#7A1E75", "#F9C846", "#0B1410"].map((c) => (
              <div
                key={c}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: c,
                  border: "2px solid transparent",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
          <label style={{ fontSize: 12, color: "var(--fg-dim)", marginTop: 16, display: "block" }}>
            O que mostrar
          </label>
          {[
            'Badge "FALTA" ao lado da figurinha',
            "Preços",
            "Raridade",
            "Avatares de compradores recentes",
          ].map((o) => (
            <div key={o} className="between" style={{ padding: "8px 0" }}>
              <span style={{ fontSize: 13 }}>{o}</span>
              <div className="switch on" />
            </div>
          ))}
          <div className="hr" />
          <div className="h3" style={{ marginBottom: 10 }}>
            Comportamento
          </div>
          <div className="between" style={{ padding: "8px 0" }}>
            <div>
              <div style={{ fontSize: 13 }}>Reserva com expiração</div>
              <div style={{ fontSize: 11, color: "var(--fg-mute)" }}>
                Libera o item se não pagar em 30min
              </div>
            </div>
            <div className="switch on" />
          </div>
          <div className="between" style={{ padding: "8px 0" }}>
            <div>
              <div style={{ fontSize: 13 }}>Chat integrado (WhatsApp)</div>
              <div style={{ fontSize: 11, color: "var(--fg-mute)" }}>
                Botão flutuante para dúvidas
              </div>
            </div>
            <div className="switch on" />
          </div>
        </div>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "8px 12px",
              background: "var(--bg-2)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F56565" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F9C846" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4ADE80" }} />
            <span
              style={{ marginLeft: 10, fontSize: 11, color: "var(--fg-mute)" }}
              className="mono"
            >
              figurinhaspro.com/alex
            </span>
          </div>
          <LojaPreview mini />
        </div>
      </div>
    </div>
  );
}

function LojaPreview({ mini }) {
  const [cart, setCart] = uS_P([]);
  const [filter, setFilter] = uS_P("todas");
  const stickers = uM_P(() => window.FP_DATA.stickers.slice(0, mini ? 30 : 60), [mini]);
  const addToCart = (s) => setCart([...cart, s]);
  const total = cart.reduce((sum, s) => sum + window.FP_DATA.prices[s.id], 0);

  return (
    <div
      style={{
        background: "#F6F1E8",
        color: "#0F1B16",
        minHeight: mini ? 600 : "100vh",
        position: "relative",
      }}
    >
      <div
        style={{
          background: "#0F3D2E",
          color: "#F6F1E8",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "#E8571C",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 22,
          }}
        >
          A
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "-0.01em" }}
          >
            Loja do Alex · Figurinhas
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            ⭐ 4.9 · 342 pedidos · São Paulo · envio Brasil todo
          </div>
        </div>
        <button className="btn" style={{ background: "#E8571C", color: "#fff", border: "none" }}>
          <Icon name="card" size={14} /> Carrinho {cart.length > 0 && `· ${cart.length}`}
        </button>
      </div>
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {[
            ["todas", "Todas"],
            ["falta", "Só as que te faltam ✨"],
            ["holo", "Holográficas"],
            ["brasil", "Brasil"],
            ["argentina", "Argentina"],
            ["super", "Super-raras"],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: "1px solid rgba(15,61,46,0.18)",
                background: filter === k ? "#0F3D2E" : "#FFFFFF",
                color: filter === k ? "#F6F1E8" : "#0F1B16",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="sticker-grid" style={{ "--sticker-size": mini ? "88px" : "120px" }}>
          {stickers.map((s) => (
            <div key={s.id} style={{ position: "relative" }}>
              <Sticker
                s={s}
                qty={window.FP_DATA.stock[s.id]}
                showBadge
                onClick={() => addToCart(s)}
              />
              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  textAlign: "center",
                  color: "#0F3D2E",
                }}
                className="mono"
              >
                R$ {window.FP_DATA.prices[s.id].toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 14,
              left: 20,
              right: 20,
              background: "#0F1B16",
              color: "#F6F1E8",
              borderRadius: 12,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>
                {cart.length} figurinhas · reservado por 30min
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22 }} className="num-tab">
                R$ {total.toFixed(2)}
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <button
              className="btn"
              style={{ background: "#E8571C", color: "#fff", border: "none" }}
            >
              Pagar com Pix <Icon name="arrow" size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, {
  Pedidos,
  Precos,
  Financeiro,
  Alertas,
  ScannerFull,
  WhatsImport,
  LojaAdmin,
  LojaPreview,
});
