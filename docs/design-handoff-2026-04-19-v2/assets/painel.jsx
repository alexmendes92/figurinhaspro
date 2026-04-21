// App — painel (dashboard + sub-rotas)
const { useState: uS_A, useEffect: uE_A, useMemo: uM_A, useCallback: uC_A, useRef: uR_A } = React;

function Dashboard({ setRoute }) {
  const daily = [12, 14, 13, 18, 22, 19, 24, 28, 34, 31, 37, 42, 48, 44, 52];
  const hot = uM_A(
    () => window.FP_DATA.stickers.filter((s) => s.rarity !== "common").slice(0, 6),
    []
  );
  return (
    <div style={{ padding: 24 }}>
      <div className="between" style={{ marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>
            Quarta, 19 de abril · boa tarde
          </div>
          <h1
            className="display"
            style={{ fontSize: 36, margin: "4px 0 0", letterSpacing: "-0.015em" }}
          >
            Olá, Alex. Seu dia rende <span style={{ color: "var(--accent)" }}>R$ 847</span> até
            agora.
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn sm" onClick={() => setRoute("scanner")}>
            <Icon name="cam" size={14} /> Scanner
          </button>
          <button className="btn sm" onClick={() => setRoute("whats")}>
            <Icon name="whats" size={14} /> Colar WhatsApp
          </button>
          <button className="btn primary sm" onClick={() => setRoute("estoque")}>
            <Icon name="plus" size={14} /> Marcar figurinha
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div className="kpi">
          <div className="l">Vendas hoje</div>
          <div className="v num-tab">R$ 847,20</div>
          <div className="d">
            <span className="chip ok" style={{ padding: "1px 6px" }}>
              +32%
            </span>
            <span>vs ontem</span>
          </div>
        </div>
        <div className="kpi">
          <div className="l">Pedidos abertos</div>
          <div className="v num-tab">14</div>
          <div className="d">
            <span style={{ color: "var(--danger)" }}>3 expiram em 40min</span>
          </div>
        </div>
        <div className="kpi">
          <div className="l">Figurinhas em estoque</div>
          <div className="v num-tab">2.847</div>
          <div className="d">
            <span>em 4 álbuns ativos</span>
          </div>
        </div>
        <div className="kpi">
          <div className="l">Lucro do mês</div>
          <div className="v num-tab">R$ 4.382</div>
          <div className="d">
            <Spark values={daily} />
            <span style={{ marginLeft: 6 }}>meta 78%</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
        {/* Alertas */}
        <div className="card" style={{ padding: 18 }}>
          <div className="between" style={{ marginBottom: 12 }}>
            <div>
              <div className="eyebrow">Antecipamos</div>
              <div className="h3">Precisa da sua atenção</div>
            </div>
            <button className="btn ghost sm" onClick={() => setRoute("alertas")}>
              Ver todos <Icon name="arrow" size={12} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {window.FP_DATA.alerts.map((a, i) => {
              const icon =
                a.tipo === "falta"
                  ? "flame"
                  : a.tipo === "preco"
                    ? "tag"
                    : a.tipo === "pedido"
                      ? "receipt"
                      : "chart";
              const color =
                a.severity === "high" ? "danger" : a.severity === "med" ? "warn" : "info";
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: 12,
                    borderRadius: 10,
                    background: "var(--surface-2)",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: "var(--bg-2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color:
                        color === "danger"
                          ? "var(--danger)"
                          : color === "warn"
                            ? "var(--accent-2)"
                            : "var(--info)",
                    }}
                  >
                    <Icon name={icon} size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.titulo}</div>
                    <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>{a.detalhe}</div>
                  </div>
                  <button className="btn sm">Resolver</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Em alta */}
        <div className="card" style={{ padding: 18 }}>
          <div className="between" style={{ marginBottom: 12 }}>
            <div>
              <div className="eyebrow">Tendências 48h</div>
              <div className="h3">Em alta agora</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {hot.map((s, i) => (
              <div key={s.id} className="between" style={{ gap: 10 }}>
                <div style={{ width: 36 }}>
                  <Sticker s={s} qty={window.FP_DATA.stock[s.id]} showBadge={false} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {s.label} · {s.team}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--fg-mute)" }}>
                    Buscas +{120 + i * 40}% · seu preço R$ {window.FP_DATA.prices[s.id].toFixed(2)}
                  </div>
                </div>
                <Spark values={[3, 4, 6, 5, 8, 9, 12, 14, 18, 22]} color="var(--ok)" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="between" style={{ marginBottom: 12 }}>
            <div className="h3">Pedidos recentes</div>
            <button className="btn ghost sm" onClick={() => setRoute("pedidos")}>
              Abrir <Icon name="arrow" size={12} />
            </button>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Comprador</th>
                <th>Origem</th>
                <th style={{ textAlign: "right" }}>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {window.FP_DATA.orders.slice(0, 5).map((o) => (
                <tr key={o.id}>
                  <td className="mono">{o.id}</td>
                  <td>{o.buyer}</td>
                  <td>
                    <span className="chip">{o.origin}</span>
                  </td>
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
        <div className="card" style={{ padding: 18 }}>
          <div className="between" style={{ marginBottom: 12 }}>
            <div className="h3">Seus álbuns</div>
            <button className="btn ghost sm" onClick={() => setRoute("estoque")}>
              Gerenciar
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {window.FP_DATA.albums
              .filter((a) => a.active)
              .map((a) => {
                const pct = Math.round(40 + Math.random() * 45);
                return (
                  <div key={a.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div
                      style={{
                        width: 38,
                        height: 48,
                        borderRadius: 6,
                        background: `linear-gradient(160deg, ${a.color}, #0a0a0a)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                      }}
                    >
                      {a.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="between" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</span>
                        <span className="mono" style={{ fontSize: 11, color: "var(--fg-mute)" }}>
                          {Math.round((a.total * pct) / 100)}/{a.total}
                        </span>
                      </div>
                      <div className="prog">
                        <span style={{ width: `${pct}%`, background: a.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderStatus({ s }) {
  const map = {
    pago: ["ok", "Pago"],
    reservado: ["warn", "Reservado"],
    "aguardando-pix": ["warn", "Aguardando Pix"],
    enviado: ["info", "Enviado"],
  };
  const [cls, label] = map[s] || ["", "—"];
  return <span className={`chip ${cls}`}>{label}</span>;
}

// Estoque
function EstoqueHome({ setRoute, setAlbum }) {
  return (
    <div style={{ padding: 24 }}>
      <div className="between" style={{ marginBottom: 20 }}>
        <div>
          <div className="eyebrow">Estoque</div>
          <h2 className="h2">Selecione um álbum para gerenciar</h2>
        </div>
        <button className="btn primary sm">
          <Icon name="plus" size={14} /> Importar novo álbum
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 14,
        }}
      >
        {window.FP_DATA.albums.map((a) => {
          const pct = Math.round(40 + Math.random() * 45);
          return (
            <div
              key={a.id}
              className="card hover"
              style={{ padding: 18, cursor: "pointer" }}
              onClick={() => {
                setAlbum(a.id);
                setRoute("album");
              }}
            >
              <div
                style={{
                  height: 100,
                  borderRadius: 8,
                  background: `linear-gradient(160deg, ${a.color}, #0a0a0a)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 44,
                  marginBottom: 12,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ fontSize: 52, filter: "drop-shadow(0 4px 12px rgba(0,0,0,.4))" }}>
                  {a.emoji}
                </div>
                {!a.active && (
                  <span className="chip" style={{ position: "absolute", top: 8, right: 8 }}>
                    Arquivado
                  </span>
                )}
              </div>
              <div className="between" style={{ marginBottom: 6 }}>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 22,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {a.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--fg-mute)" }}>{a.total} figurinhas</div>
                </div>
                <span className="mono" style={{ fontSize: 12, color: "var(--fg-dim)" }}>
                  {pct}%
                </span>
              </div>
              <div className="prog">
                <span style={{ width: `${pct}%`, background: a.color }} />
              </div>
              <div
                className="between"
                style={{ marginTop: 10, fontSize: 11, color: "var(--fg-mute)" }}
              >
                <span>R$ {(Math.random() * 2000 + 400).toFixed(0)} em estoque</span>
                <span>· {Math.round(Math.random() * 12)} pedidos pendentes</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AlbumEstoque({ albumId, setRoute, layout, density, pushToast }) {
  const album = window.FP_DATA.albums.find((a) => a.id === albumId) || window.FP_DATA.albums[0];
  const all = uM_A(() => window.FP_DATA.stickers, []);
  const [filterTeam, setFilterTeam] = uS_A("ALL");
  const [filterStatus, setFilterStatus] = uS_A("ALL"); // ALL | faltando | repetidas
  const [rarityFilter, setRarityFilter] = uS_A("ALL");
  const [selectedId, setSelectedId] = uS_A(null);
  const [stock, setStock] = uS_A({ ...window.FP_DATA.stock });
  const [tallied, setTallied] = uS_A(null);
  const [quickMode, setQuickMode] = uS_A(false);
  const [quickInput, setQuickInput] = uS_A("");
  const quickRef = uR_A();

  const filtered = all.filter((s) => {
    if (filterTeam !== "ALL" && s.team !== filterTeam) return false;
    if (rarityFilter !== "ALL" && s.rarity !== rarityFilter) return false;
    if (filterStatus === "faltando" && stock[s.id] > 0) return false;
    if (filterStatus === "repetidas" && stock[s.id] < 2) return false;
    return true;
  });

  const totals = uM_A(() => {
    let t = 0;
    let f = 0;
    let r = 0;
    let units = 0;
    for (const s of all) {
      t++;
      units += stock[s.id];
      if (stock[s.id] === 0) f++;
      if (stock[s.id] >= 2) r++;
    }
    return { t, f, r, units };
  }, [stock, all]);

  const inc = (s, d = 1) => {
    setStock((prev) => ({ ...prev, [s.id]: Math.max(0, (prev[s.id] || 0) + d) }));
    setTallied(s.id);
    setTimeout(() => setTallied(null), 600);
  };

  // Quick mode: digit number + enter
  uE_A(() => {
    if (quickMode && quickRef.current) quickRef.current.focus();
  }, [quickMode]);

  const onQuickSubmit = (e) => {
    e.preventDefault();
    const num = Number.parseInt(quickInput, 10);
    if (!num) return;
    const s = all.find((x) => x.num === num);
    if (!s) {
      pushToast(`Figurinha #${num} não existe`);
      setQuickInput("");
      return;
    }
    inc(s, 1);
    pushToast(`+1 · ${s.label} (${s.team}) · #${String(s.num).padStart(3, "0")}`);
    setQuickInput("");
  };

  const teamsList = ["ALL", ...Array.from(new Set(all.map((s) => s.team)))];

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div className="between" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button className="btn ghost sm" onClick={() => setRoute("estoque")}>
            ← Voltar
          </button>
          <div
            style={{
              width: 42,
              height: 54,
              borderRadius: 8,
              background: `linear-gradient(160deg, ${album.color}, #0a0a0a)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            {album.emoji}
          </div>
          <div>
            <div
              style={{ fontFamily: "var(--font-display)", fontSize: 26, letterSpacing: "-0.01em" }}
            >
              {album.name}
            </div>
            <div style={{ fontSize: 12, color: "var(--fg-mute)" }} className="mono">
              {totals.t - totals.f}/{totals.t} tipos · {totals.units} unidades · {totals.r}{" "}
              repetidas
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={`btn sm ${quickMode ? "primary" : ""}`}
            onClick={() => setQuickMode(!quickMode)}
          >
            <Icon name="zap" size={14} /> Modo rápido <Kbd>Q</Kbd>
          </button>
          <button className="btn sm" onClick={() => setRoute("scanner")}>
            <Icon name="cam" size={14} /> Scanner
          </button>
          <button className="btn sm">
            <Icon name="gear" size={14} />
          </button>
        </div>
      </div>

      {/* Quick mode strip */}
      {quickMode && (
        <div
          className="card slide-up"
          style={{
            padding: 14,
            marginBottom: 14,
            background: "linear-gradient(90deg, rgba(232,87,28,0.1), transparent)",
            borderColor: "var(--accent)",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <Icon name="zap" size={18} />
          <form
            onSubmit={onQuickSubmit}
            style={{ display: "flex", gap: 10, alignItems: "center", flex: 1 }}
          >
            <span style={{ color: "var(--fg-mute)", fontSize: 13 }}>Digite o número:</span>
            <input
              ref={quickRef}
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value.replace(/[^0-9]/g, ""))}
              style={{
                flex: 1,
                background: "var(--bg-2)",
                border: "1px solid var(--border-strong)",
                padding: "10px 14px",
                fontSize: 20,
                borderRadius: 8,
                color: "var(--fg)",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                outline: "none",
              }}
              placeholder="ex: 247"
            />
            <button className="btn primary" type="submit">
              Adicionar <Kbd>Enter</Kbd>
            </button>
          </form>
          <div style={{ fontSize: 11, color: "var(--fg-mute)", maxWidth: 180 }}>
            Cole uma lista: <span className="mono">12, 34, 056, 247</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div
        className="card"
        style={{
          padding: 10,
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 4 }}>
          {[
            ["ALL", "Todas"],
            ["faltando", "Faltando"],
            ["repetidas", "Repetidas"],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilterStatus(k)}
              className={`btn sm ${filterStatus === k ? "primary" : ""}`}
            >
              {l}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 22, background: "var(--border)" }} />
        <select
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          style={{
            padding: "6px 10px",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--fg)",
            borderRadius: 8,
            fontSize: 12,
          }}
        >
          {teamsList.map((t) => (
            <option key={t} value={t}>
              {t === "ALL" ? "Todos os times" : t}
            </option>
          ))}
        </select>
        <select
          value={rarityFilter}
          onChange={(e) => setRarityFilter(e.target.value)}
          style={{
            padding: "6px 10px",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--fg)",
            borderRadius: 8,
            fontSize: 12,
          }}
        >
          <option value="ALL">Todas raridades</option>
          <option value="common">Comum</option>
          <option value="rare">Raro</option>
          <option value="legend">Lendário</option>
          <option value="holo">Holográfica</option>
        </select>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "var(--fg-mute)" }}>{filtered.length} figurinhas</span>
      </div>

      {/* Main */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: layout === "split" ? "1fr 360px" : "1fr",
          gap: 16,
        }}
      >
        <div>
          {layout === "teams" ? (
            <TeamsLayout
              stickers={filtered}
              stock={stock}
              inc={inc}
              setSelectedId={setSelectedId}
              tallied={tallied}
              density={density}
            />
          ) : (
            <div className="sticker-grid" style={{ "--sticker-size": densityPx(density) }}>
              {filtered.map((s) => (
                <div key={s.id} onClick={() => setSelectedId(s.id)}>
                  <Sticker
                    s={s}
                    qty={stock[s.id]}
                    tallied={tallied === s.id}
                    onClick={() => inc(s, 1)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        {layout === "split" && (
          <StickerInspector
            sticker={all.find((s) => s.id === selectedId) || all[0]}
            stock={stock}
            inc={inc}
          />
        )}
      </div>
    </div>
  );
}

function densityPx(d) {
  return d === "compact" ? "80px" : d === "large" ? "140px" : "108px";
}

function TeamsLayout({ stickers, stock, inc, tallied, density, setSelectedId }) {
  const byTeam = uM_A(() => {
    const m = {};
    for (const s of stickers) {
      (m[s.team] = m[s.team] || []).push(s);
    }
    return m;
  }, [stickers]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {Object.entries(byTeam).map(([team, list]) => {
        const owned = list.filter((s) => stock[s.id] > 0).length;
        const info = window.FP_DATA.teams.find((t) => t.code === team) || {};
        return (
          <div key={team} className="card" style={{ padding: 14 }}>
            <div className="between" style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: `linear-gradient(135deg, ${info.c1}, ${info.c2})`,
                  }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>{info.name || team}</div>
                  <div style={{ fontSize: 11, color: "var(--fg-mute)" }} className="mono">
                    {owned}/{list.length} em estoque
                  </div>
                </div>
              </div>
              <div className="prog" style={{ width: 140 }}>
                <span
                  style={{
                    width: `${(owned / list.length) * 100}%`,
                    background: info.c1 || "var(--accent)",
                  }}
                />
              </div>
            </div>
            <div className="sticker-grid" style={{ "--sticker-size": densityPx(density) }}>
              {list.map((s) => (
                <Sticker
                  key={s.id}
                  s={s}
                  qty={stock[s.id]}
                  tallied={tallied === s.id}
                  onClick={() => inc(s, 1)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StickerInspector({ sticker, stock, inc }) {
  if (!sticker) return null;
  const qty = stock[sticker.id];
  const price = window.FP_DATA.prices[sticker.id];
  const suggested = Math.round(price * 1.15 * 100) / 100;
  return (
    <div
      className="card"
      style={{
        padding: 20,
        position: "sticky",
        top: 74,
        maxHeight: "calc(100vh - 90px)",
        overflow: "auto",
      }}
    >
      <div className="eyebrow">Detalhes</div>
      <div style={{ margin: "12px 0 16px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: 180 }}>
          <Sticker s={sticker} qty={qty} showBadge />
        </div>
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 24 }}>{sticker.label}</div>
      <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>
        #{String(sticker.num).padStart(3, "0")} · {sticker.team} · {sticker.role || sticker.type}
      </div>
      <div className="hr" />
      <div className="between" style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: "var(--fg-dim)" }}>Estoque</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="btn sm" onClick={() => inc(sticker, -1)}>
            −
          </button>
          <span className="mono" style={{ fontWeight: 700, minWidth: 28, textAlign: "center" }}>
            {qty}
          </span>
          <button className="btn primary sm" onClick={() => inc(sticker, 1)}>
            +
          </button>
        </div>
      </div>
      <div className="between" style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: "var(--fg-dim)" }}>Seu preço</span>
        <span className="mono">R$ {price.toFixed(2)}</span>
      </div>
      <div className="between" style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: "var(--fg-dim)" }}>Sugerido (mercado)</span>
        <span className="chip warn">R$ {suggested.toFixed(2)} · +15%</span>
      </div>
      <button
        className="btn primary sm"
        style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
      >
        Aplicar preço sugerido
      </button>
      <div className="hr" />
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        Demanda (30d)
      </div>
      <Spark values={[3, 5, 4, 8, 10, 12, 18, 22, 20, 28, 34, 42]} />
      <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 6 }}>
        12 pedidos · 8 vendas · 2 no carrinho agora
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard, EstoqueHome, AlbumEstoque });
