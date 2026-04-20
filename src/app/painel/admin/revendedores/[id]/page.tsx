import Link from "next/link";
import { notFound } from "next/navigation";
import type { MockAlbum, MockClient, MockTransaction } from "../mock-data";
import {
  getResellerAlbums,
  getResellerClients,
  getResellerTransactions,
  getSellerById,
} from "../mock-data";

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  ACTIVE: { label: "Ativo", class: "bg-emerald-500/10 text-emerald-400" },
  INACTIVE: { label: "Inativo", class: "bg-red-500/10 text-red-400" },
};

const PLAN_BADGE: Record<string, { label: string; class: string }> = {
  FREE: { label: "Free", class: "bg-gray-500/10 text-gray-400" },
  PRO: { label: "Pro", class: "bg-amber-500/10 text-amber-400" },
  UNLIMITED: { label: "Unlimited", class: "bg-violet-500/10 text-violet-400" },
};

const ALBUM_STATUS: Record<string, { label: string; class: string }> = {
  ACTIVE: { label: "Ativo", class: "bg-emerald-500/10 text-emerald-400" },
  DRAFT: { label: "Rascunho", class: "bg-amber-500/10 text-amber-400" },
  ARCHIVED: { label: "Arquivado", class: "bg-gray-500/10 text-gray-400" },
};

const TX_TYPE: Record<string, { label: string; class: string }> = {
  SUBSCRIPTION: { label: "Assinatura", class: "text-violet-400" },
  SALE: { label: "Venda", class: "text-emerald-400" },
  REFUND: { label: "Reembolso", class: "text-red-400" },
};

const TX_STATUS: Record<string, { label: string; class: string }> = {
  PAID: { label: "Pago", class: "bg-emerald-500/10 text-emerald-400" },
  PENDING: { label: "Pendente", class: "bg-amber-500/10 text-amber-400" },
  FAILED: { label: "Falhou", class: "bg-red-500/10 text-red-400" },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR");
}

type Tab = "albums" | "transacoes" | "clientes";

const TABS: { key: Tab; label: string }[] = [
  { key: "albums", label: "Albums" },
  { key: "transacoes", label: "Transacoes" },
  { key: "clientes", label: "Clientes" },
];

export default async function SellerDetailPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await paramsPromise;
  const searchParams = await searchParamsPromise;
  const tab = (searchParams?.tab as Tab) || "albums";

  const seller = getSellerById(id);
  if (!seller) notFound();

  const albums = getResellerAlbums(id);
  const transactions = getResellerTransactions(id);
  const clients = getResellerClients(id);

  const status = STATUS_BADGE[seller.status] || STATUS_BADGE.ACTIVE;
  const plan = PLAN_BADGE[seller.plan] || PLAN_BADGE.FREE;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/painel/admin/revendedores"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-400 transition-colors"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Voltar para lista
      </Link>

      {/* Seller Header */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-amber-500/20 shrink-0">
            {seller.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white">{seller.name}</h2>
              <span className={`text-[11px] px-2 py-0.5 rounded-lg font-medium ${status.class}`}>
                {status.label}
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-lg font-medium ${plan.class}`}>
                {plan.label}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{seller.shopName}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">Email</p>
                <p className="text-xs text-gray-300 mt-0.5 truncate">{seller.email}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">Telefone</p>
                <p className="text-xs text-gray-300 mt-0.5">{seller.phone}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">Slug</p>
                <p className="text-xs text-gray-300 mt-0.5 font-mono">{seller.shopSlug}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">Desde</p>
                <p className="text-xs text-gray-300 mt-0.5">{formatDate(seller.createdAt)}</p>
              </div>
            </div>

            {/* Mini KPIs */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/[0.04]">
              <div>
                <span className="text-lg font-bold text-amber-400">{seller.albumCount}</span>
                <span className="text-xs text-gray-500 ml-1.5">albums</span>
              </div>
              <div>
                <span className="text-lg font-bold text-emerald-400">{seller.clientCount}</span>
                <span className="text-xs text-gray-500 ml-1.5">clientes</span>
              </div>
              <div>
                <span className="text-lg font-bold text-violet-400">
                  {formatCurrency(seller.totalTransacted)}
                </span>
                <span className="text-xs text-gray-500 ml-1.5">transacionado</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none">
        {TABS.map((t) => {
          const active = tab === t.key;
          const count =
            t.key === "albums"
              ? albums.length
              : t.key === "transacoes"
                ? transactions.length
                : clients.length;
          return (
            <Link
              key={t.key}
              href={`/painel/admin/revendedores/${id}?tab=${t.key}`}
              className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                active
                  ? "bg-white/[0.08] text-white"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]"
              }`}
            >
              {t.label}
              <span className={`ml-1.5 ${active ? "text-amber-400" : "text-gray-600"}`}>
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {tab === "albums" && <AlbumsTab albums={albums} />}
        {tab === "transacoes" && <TransacoesTab transactions={transactions} />}
        {tab === "clientes" && <ClientesTab clients={clients} />}
      </div>
    </div>
  );
}

/* ─── Albums Tab ──────────────────────────── */

function AlbumsTab({ albums }: { albums: MockAlbum[] }) {
  if (albums.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">Nenhum album encontrado</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {albums.map((album) => {
        const st = ALBUM_STATUS[album.status] || ALBUM_STATUS.ACTIVE;
        return (
          <div
            key={album.id}
            className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-white">{album.name}</p>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${st.class}`}
              >
                {st.label}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span>{album.stickerCount} figurinhas</span>
              <span>{album.salesCount} vendas</span>
            </div>
            <p className="text-[10px] text-gray-600 mt-2">
              Criado em {formatDate(album.createdAt)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Transacoes Tab ──────────────────────── */

function TransacoesTab({ transactions }: { transactions: MockTransaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">Nenhuma transacao encontrada</p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/[0.06] text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Descricao</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Tipo</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Status</th>
              <th className="px-4 py-3 font-medium text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => {
              const type = TX_TYPE[tx.type] || TX_TYPE.SALE;
              const txStatus = TX_STATUS[tx.status] || TX_STATUS.PAID;
              const isNegative = tx.value < 0;
              return (
                <tr key={tx.id} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-4 py-3 text-xs text-gray-400">{formatDate(tx.date)}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-300">{tx.description}</p>
                    <span className={`text-[10px] sm:hidden ${type.class}`}>{type.label}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-xs font-medium ${type.class}`}>{type.label}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-lg font-medium ${txStatus.class}`}
                    >
                      {txStatus.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-sm font-medium ${isNegative ? "text-red-400" : "text-emerald-400"}`}
                    >
                      {isNegative ? "- " : "+ "}
                      {formatCurrency(Math.abs(tx.value))}
                    </span>
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

/* ─── Clientes Tab ────────────────────────── */

function ClientesTab({ clients }: { clients: MockClient[] }) {
  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">Nenhum cliente encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/[0.06] text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell text-right">Pedidos</th>
              <th className="px-4 py-3 font-medium text-right">Gasto Total</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Ultimo Pedido</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-white/[0.04] last:border-0">
                <td className="px-4 py-3">
                  <p className="text-sm text-white font-medium">{client.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{client.email}</p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-right">
                  <span className="text-sm text-gray-300">{client.ordersCount}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm text-emerald-400 font-medium">
                    {formatCurrency(client.totalSpent)}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-gray-500">{formatDate(client.lastOrderAt)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
