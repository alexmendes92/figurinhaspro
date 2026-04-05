// ============================================================
// Dados MOCKADOS para o Admin Dashboard de Revendedores.
// Quando for hora de plugar o banco, basta trocar as importações
// neste arquivo por queries reais ao Prisma.
// ============================================================

export interface MockSeller {
  id: string;
  name: string;
  email: string;
  phone: string;
  shopName: string;
  shopSlug: string;
  status: "ACTIVE" | "INACTIVE";
  plan: "FREE" | "PRO" | "UNLIMITED";
  albumCount: number;
  clientCount: number;
  totalTransacted: number;
  createdAt: string;
}

export interface MockAlbum {
  id: string;
  name: string;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  stickerCount: number;
  salesCount: number;
  createdAt: string;
}

export interface MockTransaction {
  id: string;
  date: string;
  value: number;
  type: "SUBSCRIPTION" | "SALE" | "REFUND";
  status: "PAID" | "PENDING" | "FAILED";
  description: string;
}

export interface MockClient {
  id: string;
  name: string;
  email: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string;
  joinedAt: string;
}

// --- Revendedores ---

export const mockSellers: MockSeller[] = [
  { id: "rv-001", name: "João Silva", email: "joao@figurinhas.com", phone: "(11) 99988-7766", shopName: "Figurinhas do João", shopSlug: "joao", status: "ACTIVE", plan: "PRO", albumCount: 5, clientCount: 128, totalTransacted: 15400, createdAt: "2025-03-15" },
  { id: "rv-002", name: "Maria Santos", email: "maria@colecoes.com", phone: "(21) 98877-6655", shopName: "Coleções da Maria", shopSlug: "maria", status: "ACTIVE", plan: "UNLIMITED", albumCount: 12, clientCount: 342, totalTransacted: 48900, createdAt: "2025-01-20" },
  { id: "rv-003", name: "Carlos Oliveira", email: "carlos@stickers.com", phone: "(31) 97766-5544", shopName: "Stickers BR", shopSlug: "stickers-br", status: "ACTIVE", plan: "FREE", albumCount: 2, clientCount: 34, totalTransacted: 2100, createdAt: "2025-06-10" },
  { id: "rv-004", name: "Ana Paula Ferreira", email: "ana@albummania.com", phone: "(41) 96655-4433", shopName: "Album Mania", shopSlug: "album-mania", status: "ACTIVE", plan: "PRO", albumCount: 7, clientCount: 215, totalTransacted: 22800, createdAt: "2025-02-28" },
  { id: "rv-005", name: "Ricardo Mendes", email: "ricardo@colefig.com", phone: "(51) 95544-3322", shopName: "ColeFig", shopSlug: "colefig", status: "ACTIVE", plan: "PRO", albumCount: 4, clientCount: 89, totalTransacted: 9600, createdAt: "2025-04-05" },
  { id: "rv-006", name: "Fernanda Costa", email: "fernanda@fig.com", phone: "(61) 94433-2211", shopName: "Fernanda Figurinhas", shopSlug: "fernanda", status: "INACTIVE", plan: "FREE", albumCount: 1, clientCount: 12, totalTransacted: 800, createdAt: "2025-07-22" },
  { id: "rv-007", name: "Pedro Almeida", email: "pedro@megafig.com", phone: "(71) 93322-1100", shopName: "MegaFig", shopSlug: "megafig", status: "ACTIVE", plan: "UNLIMITED", albumCount: 15, clientCount: 567, totalTransacted: 72300, createdAt: "2024-11-10" },
  { id: "rv-008", name: "Juliana Souza", email: "juliana@souzafig.com", phone: "(81) 92211-0099", shopName: "Souza Figurinhas", shopSlug: "souza-fig", status: "ACTIVE", plan: "PRO", albumCount: 6, clientCount: 178, totalTransacted: 18200, createdAt: "2025-05-14" },
  { id: "rv-009", name: "Marcos Lima", email: "marcos@limacard.com", phone: "(85) 91100-9988", shopName: "Lima Cards", shopSlug: "lima-cards", status: "ACTIVE", plan: "FREE", albumCount: 3, clientCount: 45, totalTransacted: 3400, createdAt: "2025-08-01" },
  { id: "rv-010", name: "Patrícia Rocha", email: "patricia@rochafig.com", phone: "(91) 90099-8877", shopName: "Rocha Figurinhas", shopSlug: "rocha-fig", status: "INACTIVE", plan: "PRO", albumCount: 4, clientCount: 156, totalTransacted: 14700, createdAt: "2025-03-01" },
  { id: "rv-011", name: "Gabriel Santos", email: "gabriel@gsantos.com", phone: "(47) 99988-7700", shopName: "G Santos", shopSlug: "gsantos", status: "ACTIVE", plan: "FREE", albumCount: 1, clientCount: 8, totalTransacted: 450, createdAt: "2025-09-15" },
  { id: "rv-012", name: "Camila Nunes", email: "camila@nunescards.com", phone: "(27) 98877-6600", shopName: "Nunes Cards", shopSlug: "nunes-cards", status: "ACTIVE", plan: "UNLIMITED", albumCount: 9, clientCount: 289, totalTransacted: 38500, createdAt: "2025-01-05" },
];

// --- Álbuns por revendedor (gerado deterministicamente) ---

const ALBUM_NAMES = [
  "Copa do Mundo 2026", "Euro 2024", "Premier League 24/25",
  "Brasileirão 2025", "Champions League 25/26", "Copa América 2024",
  "Serie A 24/25", "Bundesliga 25/26", "La Liga 24/25",
  "Ligue 1 25/26", "MLS 2025", "Copa do Brasil 2025",
  "Libertadores 2025", "Sul-Americana 2025", "Olympics 2028",
];

const STICKER_COUNTS = [670, 400, 500, 300, 550, 450, 380, 620, 350, 480];

export function getResellerAlbums(sellerId: string): MockAlbum[] {
  const seller = mockSellers.find((s) => s.id === sellerId);
  if (!seller) return [];
  const seed = parseInt(sellerId.replace("rv-", ""), 10) || 1;
  const count = Math.min(seller.albumCount, 8);

  return Array.from({ length: count }, (_, i) => ({
    id: `alb-${seed}-${i + 1}`,
    name: ALBUM_NAMES[(seed + i) % ALBUM_NAMES.length],
    status: (i === count - 1 && count > 1 ? "DRAFT" : i > count - 2 ? "ARCHIVED" : "ACTIVE") as MockAlbum["status"],
    stickerCount: STICKER_COUNTS[(seed + i) % STICKER_COUNTS.length],
    salesCount: Math.floor((seller.clientCount / count) * (i === 0 ? 1.4 : 0.9)),
    createdAt: `2025-0${((i + seed) % 9) + 1}-${((seed * 3 + i * 7) % 28) + 1}`,
  }));
}

// --- Transações por revendedor ---

const TX_DESCRIPTIONS = [
  "Assinatura mensal Pro", "Assinatura mensal Unlimited",
  "Venda figurinha avulsa", "Pedido #1042", "Pedido #1089",
  "Pedido #1123", "Reembolso parcial", "Pedido #1201",
];

export function getResellerTransactions(sellerId: string): MockTransaction[] {
  const seller = mockSellers.find((s) => s.id === sellerId);
  if (!seller) return [];
  const seed = parseInt(sellerId.replace("rv-", ""), 10) || 1;
  const count = 6 + (seed % 4);

  return Array.from({ length: count }, (_, i) => {
    const isRefund = i === count - 1 && seed % 3 === 0;
    const isSub = i < 2;
    return {
      id: `tx-${seed}-${i + 1}`,
      date: `2025-${String(((seed + i) % 12) + 1).padStart(2, "0")}-${String(((i * 5 + seed) % 28) + 1).padStart(2, "0")}`,
      value: isRefund ? -(50 + seed * 3) : isSub ? (seller.plan === "UNLIMITED" ? 79 : 39) : (80 + seed * 10 + i * 15),
      type: (isRefund ? "REFUND" : isSub ? "SUBSCRIPTION" : "SALE") as MockTransaction["type"],
      status: (isRefund ? "PAID" : i === count - 2 ? "PENDING" : "PAID") as MockTransaction["status"],
      description: isRefund ? "Reembolso parcial" : TX_DESCRIPTIONS[(seed + i) % TX_DESCRIPTIONS.length],
    };
  });
}

// --- Clientes por revendedor ---

const CLIENT_NAMES = [
  "Lucas Barbosa", "Amanda Reis", "Felipe Gonçalves", "Beatriz Martins",
  "Thiago Correia", "Larissa Pinto", "Diego Nascimento", "Isabela Cardoso",
  "Renato Araújo", "Priscila Teixeira", "Vinícius Moura", "Carolina Lopes",
];

export function getResellerClients(sellerId: string): MockClient[] {
  const seller = mockSellers.find((s) => s.id === sellerId);
  if (!seller) return [];
  const seed = parseInt(sellerId.replace("rv-", ""), 10) || 1;
  const count = Math.min(8, Math.max(3, Math.floor(seller.clientCount / 20)));

  return Array.from({ length: count }, (_, i) => {
    const nameIdx = (seed + i) % CLIENT_NAMES.length;
    const firstName = CLIENT_NAMES[nameIdx].split(" ")[0].toLowerCase();
    return {
      id: `cli-${seed}-${i + 1}`,
      name: CLIENT_NAMES[nameIdx],
      email: `${firstName}${seed}${i}@email.com`,
      ordersCount: 1 + ((seed + i * 3) % 8),
      totalSpent: 50 + (seed * 20 + i * 35),
      lastOrderAt: `2025-${String(((i + seed) % 12) + 1).padStart(2, "0")}-${String(((i * 4 + seed * 2) % 28) + 1).padStart(2, "0")}`,
      joinedAt: `2025-0${((seed + i) % 9) + 1}-${((seed + i * 5) % 28) + 1}`,
    };
  });
}

// --- KPIs agregados ---

export function getKpis() {
  const active = mockSellers.filter((s) => s.status === "ACTIVE");
  const totalAlbums = mockSellers.reduce((sum, s) => sum + s.albumCount, 0);
  const totalClients = mockSellers.reduce((sum, s) => sum + s.clientCount, 0);
  const proCount = mockSellers.filter((s) => s.plan === "PRO" && s.status === "ACTIVE").length;
  const unlimitedCount = mockSellers.filter((s) => s.plan === "UNLIMITED" && s.status === "ACTIVE").length;
  const mrr = proCount * 39 + unlimitedCount * 79;

  return {
    totalSellers: mockSellers.length,
    activeSellers: active.length,
    totalAlbums,
    totalClients,
    mrr,
  };
}

// --- Lookup ---

export function getSellerById(id: string): MockSeller | undefined {
  return mockSellers.find((s) => s.id === id);
}
