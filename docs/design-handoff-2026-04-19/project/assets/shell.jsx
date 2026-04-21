// Shared UI helpers: Icon, Sidebar, Topbar, Toast, Modal
const { useState, useEffect, useMemo, useRef, useCallback } = React;

const Icon = ({ name, size = 16, stroke = 1.75 }) => {
  const paths = {
    home: <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V10z" />,
    layers: (
      <>
        <path d="M12 2 2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </>
    ),
    tag: (
      <>
        <path d="M20.59 13.41 13 21a2 2 0 0 1-2.83 0l-7-7A2 2 0 0 1 2.59 12L3 4l8-.41a2 2 0 0 1 1.41.59l8.17 8.17a2 2 0 0 1 0 2.83z" />
        <circle cx="7.5" cy="7.5" r="1.5" />
      </>
    ),
    receipt: (
      <>
        <path d="M4 2h16v20l-3-2-3 2-3-2-3 2-3-2-1 2V2z" />
        <path d="M8 7h8M8 11h8M8 15h5" />
      </>
    ),
    store: (
      <>
        <path d="M3 9l1-5h16l1 5" />
        <path d="M4 9v11h16V9" />
        <path d="M9 22V12h6v10" />
      </>
    ),
    sparkle: (
      <>
        <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
        <path d="M19 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
      </>
    ),
    bell: (
      <>
        <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16z" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </>
    ),
    chart: (
      <>
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 4 4 5-6" />
      </>
    ),
    cam: (
      <>
        <path d="M4 7h3l2-3h6l2 3h3v13H4z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
    zap: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
    whats: (
      <>
        <path d="M20 12a8 8 0 1 1-3-6.24L20 4l-1 3.3A8 8 0 0 1 20 12z" />
        <path d="M8 10c1 3 3 5 6 6l1.5-1.5a1 1 0 0 1 1-.25l2 .5a1 1 0 0 1 .75 1V17a2 2 0 0 1-2 2C11 19 5 13 5 8a2 2 0 0 1 2-2h1.2a1 1 0 0 1 1 .75l.5 2a1 1 0 0 1-.25 1L8 10z" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </>
    ),
    x: (
      <>
        <path d="M18 6 6 18M6 6l12 12" />
      </>
    ),
    check: <path d="M5 12l4.5 4.5L19 7" />,
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="M13 5l7 7-7 7" />
      </>
    ),
    card: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </>
    ),
    gear: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a7.97 7.97 0 0 0 0-6l2-1.2-2-3.5-2.3.8a8 8 0 0 0-5.2-3L11.5 0h-4l-.4 2.3a8 8 0 0 0-5.2 3L-.4 4.3l-2 3.5 2 1.2a7.97 7.97 0 0 0 0 6l-2 1.2 2 3.5 2.3-.8a8 8 0 0 0 5.2 3l.4 2.3h4l.4-2.3a8 8 0 0 0 5.2-3l2.3.8 2-3.5z" />
      </>
    ),
    wallet: (
      <>
        <rect x="2" y="6" width="20" height="14" rx="2" />
        <path d="M16 13h2" />
        <path d="M2 10h20" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M17 4H7v6a5 5 0 0 0 10 0V4z" />
        <path d="M17 6h3a2 2 0 0 1-2 4" />
        <path d="M7 6H4a2 2 0 0 0 2 4" />
      </>
    ),
    fire: (
      <path d="M12 2s4 4 4 8a4 4 0 1 1-8 0c0-1.5.5-2.5 1-3.5C7 9 4 11 4 15a8 8 0 0 0 16 0c0-5-4-8-8-13z" />
    ),
    flame: (
      <path d="M12 2s4 4 4 8a4 4 0 1 1-8 0c0-1.5.5-2.5 1-3.5C7 9 4 11 4 15a8 8 0 0 0 16 0c0-5-4-8-8-13z" />
    ),
    qr: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3M21 14v7h-7M17 21h4" />
      </>
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
        <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
      </>
    ),
    menu: (
      <>
        <path d="M3 12h18" />
        <path d="M3 6h18" />
        <path d="M3 18h18" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
};

function Logo({ size = 22 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: size + 2,
          height: size + 2,
          borderRadius: 8,
          background: "linear-gradient(135deg,#E8571C,#F9C846)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#0B1410",
          fontWeight: 800,
          fontFamily: "var(--font-display)",
          fontSize: 16,
        }}
      >
        F
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: size, letterSpacing: "-0.01em" }}>
        Figurinhas<span style={{ color: "var(--accent)" }}>Pro</span>
      </div>
    </div>
  );
}

function Sidebar({ route, setRoute, badges = {} }) {
  const items = [
    { id: "dashboard", label: "Início", icon: "home" },
    { id: "estoque", label: "Estoque", icon: "layers" },
    { id: "precos", label: "Preços", icon: "tag" },
    { id: "pedidos", label: "Pedidos", icon: "receipt" },
    { id: "financeiro", label: "Financeiro", icon: "wallet" },
    { id: "alertas", label: "Alertas", icon: "bell" },
    { id: "scanner", label: "Scanner", icon: "cam" },
    { id: "whats", label: "Importar WhatsApp", icon: "whats" },
    { id: "loja", label: "Vitrine", icon: "store" },
  ];
  return (
    <aside className="sidebar">
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
        <Logo size={16} />
      </div>
      <nav style={{ padding: 8, display: "flex", flexDirection: "column", gap: 2 }}>
        <div className="eyebrow" style={{ padding: "12px 12px 4px" }}>
          Operação
        </div>
        {items.slice(0, 6).map((it) => (
          <a
            key={it.id}
            className={route === it.id ? "active" : ""}
            onClick={() => setRoute(it.id)}
          >
            <Icon name={it.icon} size={15} />
            <span>{it.label}</span>
            {badges[it.id] && (
              <span className="chip danger" style={{ marginLeft: "auto", padding: "1px 6px" }}>
                {badges[it.id]}
              </span>
            )}
          </a>
        ))}
        <div className="eyebrow" style={{ padding: "14px 12px 4px" }}>
          Ferramentas
        </div>
        {items.slice(6).map((it) => (
          <a
            key={it.id}
            className={route === it.id ? "active" : ""}
            onClick={() => setRoute(it.id)}
          >
            <Icon name={it.icon} size={15} />
            <span>{it.label}</span>
          </a>
        ))}
      </nav>
      <div style={{ marginTop: "auto", padding: 12, borderTop: "1px solid var(--border)" }}>
        <div className="card" style={{ padding: 10, background: "var(--surface-2)" }}>
          <div className="row" style={{ alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#E8571C,#F9C846)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#111",
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              AM
            </div>
            <div style={{ fontSize: 12 }}>
              <div style={{ fontWeight: 600 }}>Alex Mendes</div>
              <div style={{ color: "var(--fg-mute)", fontSize: 11 }}>Plano Pro · Loja do Alex</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ title, crumbs = [], actions, search }) {
  return (
    <div className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            <span style={{ color: "var(--fg-mute)", fontSize: 13 }}>{c}</span>
            <span style={{ color: "var(--fg-mute)" }}>/</span>
          </React.Fragment>
        ))}
        <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
      </div>
      <div style={{ flex: 1 }} />
      {search && (
        <div style={{ position: "relative", width: 340 }}>
          <div style={{ position: "absolute", left: 10, top: 8, color: "var(--fg-mute)" }}>
            <Icon name="search" size={15} />
          </div>
          <input
            placeholder="Buscar figurinha, time, pedido…  ⌘K"
            style={{
              width: "100%",
              padding: "7px 10px 7px 32px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--fg)",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>{actions}</div>
    </div>
  );
}

function Spark({ values, color = "var(--accent)" }) {
  const w = 80;
  const h = 22;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (w - 2) + 1;
    const y = h - 2 - ((v - min) / Math.max(1, max - min)) * (h - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const d = `M${pts.join(" L")}`;
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path
        d={d}
        stroke={color}
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Kbd({ children }) {
  return <kbd>{children}</kbd>;
}

function Toast({ text, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--grass-deep)",
        color: "#fff",
        padding: "10px 16px",
        borderRadius: 10,
        fontSize: 13,
        zIndex: 100,
        boxShadow: "var(--shadow-lg)",
        border: "1px solid rgba(255,255,255,.1)",
      }}
    >
      {text}
    </div>
  );
}

Object.assign(window, { Icon, Logo, Sidebar, Topbar, Spark, Kbd, Toast });
