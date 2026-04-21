// FigurinhasPro — mock data (original, não usa IP de terceiros)
// Paleta de acento por "pack" — vamos gerar figurinhas procedurais

window.FP_DATA = (() => {
  const teams = [
    { code: "BRA", name: "Brasil", c1: "#F9C846", c2: "#1E6B3B", hue: 45 },
    { code: "ARG", name: "Argentina", c1: "#7EC8E3", c2: "#0B3D91", hue: 210 },
    { code: "FRA", name: "França", c1: "#1F3A93", c2: "#B82B2B", hue: 225 },
    { code: "ESP", name: "Espanha", c1: "#E63946", c2: "#F4A100", hue: 10 },
    { code: "ENG", name: "Inglaterra", c1: "#F3F3F3", c2: "#C92A2A", hue: 0 },
    { code: "GER", name: "Alemanha", c1: "#111111", c2: "#FFCC00", hue: 50 },
    { code: "POR", name: "Portugal", c1: "#006847", c2: "#C8102E", hue: 145 },
    { code: "ITA", name: "Itália", c1: "#0B6BA8", c2: "#FFFFFF", hue: 205 },
    { code: "NED", name: "Holanda", c1: "#F07620", c2: "#0A1E3F", hue: 25 },
    { code: "BEL", name: "Bélgica", c1: "#DE1F26", c2: "#111111", hue: 0 },
    { code: "URU", name: "Uruguai", c1: "#55B4E6", c2: "#0B0B0B", hue: 200 },
    { code: "CRO", name: "Croácia", c1: "#E11D1D", c2: "#FFFFFF", hue: 0 },
    { code: "MEX", name: "México", c1: "#006341", c2: "#CE1126", hue: 150 },
    { code: "JPN", name: "Japão", c1: "#BC002D", c2: "#111111", hue: 0 },
    { code: "KOR", name: "Coreia", c1: "#E63946", c2: "#1D3B7F", hue: 350 },
    { code: "MAR", name: "Marrocos", c1: "#006233", c2: "#C1272D", hue: 145 },
    { code: "USA", name: "EUA", c1: "#1D3B7F", c2: "#E63946", hue: 220 },
    { code: "CAN", name: "Canadá", c1: "#D80621", c2: "#FFFFFF", hue: 0 },
    { code: "SUI", name: "Suíça", c1: "#DA291C", c2: "#FFFFFF", hue: 0 },
    { code: "SEN", name: "Senegal", c1: "#00853F", c2: "#FDEF42", hue: 130 },
  ];

  // Gera 670 figurinhas com raridade/status variado
  const RARITY = [
    { key: "common", label: "Comum", weight: 100, mult: 1 },
    { key: "rare", label: "Raro", weight: 22, mult: 3.5 },
    { key: "legend", label: "Lendário", weight: 5, mult: 12 },
    { key: "holo", label: "Holo", weight: 3, mult: 18 },
  ];

  function rngFrom(seed) {
    let s = seed | 0;
    if (!s) s = 1;
    return () => {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return ((s >>> 0) % 100000) / 100000;
    };
  }
  const rnd = rngFrom(42);

  const roles = ["GOL", "ZAG", "LAT", "VOL", "MEI", "ATA"];
  const firstNames = [
    "A. Silva",
    "R. Costa",
    "M. Souza",
    "J. Almeida",
    "L. Pereira",
    "F. Oliveira",
    "B. Torres",
    "E. Navas",
    "K. Müller",
    "P. Rossi",
    "S. Tanaka",
    "H. Kim",
    "O. Hassan",
    "D. Laurent",
    "V. Novak",
    "T. Andersen",
    "G. De Luca",
    "N. Okafor",
    "C. Sánchez",
    "Y. Khelif",
  ];

  const stickers = [];
  let id = 1;
  for (const team of teams) {
    // Capa + escudo + 18 jogadores + 2 raros = 20 por time
    stickers.push({
      id: id++,
      team: team.code,
      type: "logo",
      label: "Escudo",
      num: stickers.length + 1,
      rarity: "rare",
    });
    for (let i = 0; i < 18; i++) {
      let r;
      const roll = rnd();
      if (roll < 0.03) r = "holo";
      else if (roll < 0.08) r = "legend";
      else if (roll < 0.25) r = "rare";
      else r = "common";
      stickers.push({
        id: id++,
        team: team.code,
        type: "player",
        label: firstNames[Math.floor(rnd() * firstNames.length)],
        role: roles[Math.floor(rnd() * roles.length)],
        num: stickers.length + 1,
        rarity: r,
      });
    }
    stickers.push({
      id: id++,
      team: team.code,
      type: "team",
      label: "Seleção",
      num: stickers.length + 1,
      rarity: "legend",
    });
  }
  // topo até 670
  while (stickers.length < 670) {
    const t = teams[Math.floor(rnd() * teams.length)];
    stickers.push({
      id: id++,
      team: t.code,
      type: "player",
      label: firstNames[Math.floor(rnd() * firstNames.length)],
      role: roles[Math.floor(rnd() * roles.length)],
      num: stickers.length + 1,
      rarity: "common",
    });
  }

  // Estoque inicial (quantidade por id)
  const stock = {};
  for (const s of stickers) {
    const roll = rnd();
    let q = 0;
    if (roll < 0.15) q = 0;
    else if (roll < 0.55) q = Math.floor(rnd() * 4) + 1;
    else if (roll < 0.85) q = Math.floor(rnd() * 10) + 4;
    else q = Math.floor(rnd() * 30) + 15;
    if (s.rarity === "holo") q = Math.min(q, 1);
    if (s.rarity === "legend") q = Math.min(q, 3);
    stock[s.id] = q;
  }

  // Preço base
  function priceFor(sticker) {
    const r = RARITY.find((x) => x.key === sticker.rarity);
    return Math.round(0.8 * r.mult * 100) / 100; // em R$
  }
  const prices = {};
  stickers.forEach((s) => {
    prices[s.id] = priceFor(s);
  });

  // Álbuns do revendedor
  const albums = [
    { id: "copa26", name: "Copa 2026", emoji: "🏆", total: 670, active: true, color: "#E8571C" },
    { id: "copa22", name: "Copa 2022", emoji: "🇶🇦", total: 670, active: true, color: "#7A1E75" },
    {
      id: "brasil26",
      name: "Brasileirão 2026",
      emoji: "⚽",
      total: 480,
      active: true,
      color: "#1E6B3B",
    },
    {
      id: "libert",
      name: "Libertadores 26",
      emoji: "🏟️",
      total: 420,
      active: true,
      color: "#0A3D91",
    },
    { id: "euro24", name: "Eurocopa 24", emoji: "🇪🇺", total: 520, active: false, color: "#1F3A93" },
  ];

  // Pedidos mock
  const orders = [
    {
      id: "#2841",
      buyer: "Caio M.",
      items: 34,
      total: 187.5,
      status: "pago",
      origin: "WhatsApp",
      time: "2min",
    },
    {
      id: "#2840",
      buyer: "Larissa P.",
      items: 12,
      total: 64.0,
      status: "reservado",
      origin: "Vitrine",
      time: "14min",
    },
    {
      id: "#2839",
      buyer: "Rodrigo S.",
      items: 47,
      total: 298.0,
      status: "aguardando-pix",
      origin: "Instagram",
      time: "28min",
    },
    {
      id: "#2838",
      buyer: "Marina L.",
      items: 8,
      total: 42.0,
      status: "pago",
      origin: "Vitrine",
      time: "1h",
    },
    {
      id: "#2837",
      buyer: "Pedro H.",
      items: 21,
      total: 112.3,
      status: "enviado",
      origin: "WhatsApp",
      time: "3h",
    },
    {
      id: "#2836",
      buyer: "Juliana T.",
      items: 56,
      total: 345.0,
      status: "pago",
      origin: "Vitrine",
      time: "5h",
    },
  ];

  const alerts = [
    {
      tipo: "falta",
      titulo: "12 figurinhas acabaram",
      detalhe: "Top vendedoras — reponha hoje",
      severity: "high",
    },
    {
      tipo: "preco",
      titulo: "Seu preço está 18% abaixo do mercado",
      detalhe: "Categoria: Holográficas Copa 2026",
      severity: "med",
    },
    {
      tipo: "pedido",
      titulo: "3 reservas expiram em 40min",
      detalhe: "R$ 203,40 em jogo",
      severity: "high",
    },
    {
      tipo: "tendencia",
      titulo: "Brasil #10 em alta",
      detalhe: "+320% de buscas nas últimas 48h",
      severity: "info",
    },
  ];

  return { teams, stickers, stock, prices, albums, orders, alerts, RARITY };
})();
