import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const seller = await getSession();
  if (!seller) return null;

  const [inventoryCount, totalQty, orderCount, quoteCount, recentOrders] = await Promise.all([
    db.inventory.count({ where: { sellerId: seller.id, quantity: { gt: 0 } } }),
    db.inventory.aggregate({ where: { sellerId: seller.id, quantity: { gt: 0 } }, _sum: { quantity: true } }),
    db.order.count({ where: { sellerId: seller.id } }),
    db.order.count({ where: { sellerId: seller.id, status: "QUOTE" } }),
    db.order.findMany({ where: { sellerId: seller.id }, orderBy: { createdAt: "desc" }, take: 6, include: { items: true } }),
  ]);

  const revenue = await db.order.aggregate({
    where: { sellerId: seller.id, status: { in: ["CONFIRMED", "PAID", "SHIPPED", "DELIVERED"] } },
    _sum: { totalPrice: true },
  });

  const statusBadge: Record<string, string> = {
    QUOTE: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    CONFIRMED: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    PAID: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    SHIPPED: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    DELIVERED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    CANCELLED: "bg-red-500/15 text-red-400 border-red-500/20",
  };
  const statusLabel: Record<string, string> = {
    QUOTE: "Orçamento", CONFIRMED: "Confirmado", PAID: "Pago",
    SHIPPED: "Enviado", DELIVERED: "Entregue", CANCELLED: "Cancelado",
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl slide-up">
      {/* Boas vindas */}
      <div className="mb-8">
        <p className="text-gray-500 text-sm">Bem-vindo de volta,</p>
        <h1 className="text-3xl font-black tracking-tight text-white mt-0.5">
          {seller.name.split(" ")[0]}
          <span className="text-amber-400">.</span>
        </h1>
      </div>

      {/* Métricas — cards com gradiente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/painel/estoque" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/10 p-5 hover:border-amber-500/20 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <p className="text-[11px] text-amber-400/70 font-semibold uppercase tracking-wider mb-3">Figurinhas</p>
          <p className="text-3xl font-black text-white font-[family-name:var(--font-geist-mono)]">{inventoryCount}</p>
          <p className="text-[11px] text-gray-500 mt-1">
            {inventoryCount > 0
              ? `${totalQty._sum.quantity || 0} unidades no estoque`
              : "Comece adicionando seu estoque →"}
          </p>
        </Link>

        <Link href="/painel/pedidos" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/10 p-5 hover:border-blue-500/20 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <p className="text-[11px] text-blue-400/70 font-semibold uppercase tracking-wider mb-3">Pedidos</p>
          <p className="text-3xl font-black text-white font-[family-name:var(--font-geist-mono)]">{orderCount}</p>
          <p className="text-[11px] text-gray-500 mt-1">
            {orderCount === 0
              ? "Compartilhe sua vitrine →"
              : quoteCount > 0
                ? `${quoteCount} aguardando resposta`
                : "Nenhum pendente"}
          </p>
        </Link>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/10 p-5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <p className="text-[11px] text-purple-400/70 font-semibold uppercase tracking-wider mb-3">Faturamento</p>
          <p className="text-3xl font-black text-white font-[family-name:var(--font-geist-mono)]">
            R${(revenue._sum.totalPrice || 0).toFixed(0)}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            {(revenue._sum.totalPrice || 0) > 0 ? "Total confirmado" : "Aguardando primeiras vendas"}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/10 p-5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <p className="text-[11px] text-amber-400/70 font-semibold uppercase tracking-wider mb-3">Catálogo</p>
          <p className="text-3xl font-black text-white font-[family-name:var(--font-geist-mono)]">7.122</p>
          <p className="text-[11px] text-gray-500 mt-1">Figurinhas em 13 Copas</p>
        </div>
      </div>

      {/* Link vitrine + Ações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Vitrine */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0f1219] border border-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-white">Sua vitrine</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Compartilhe com seus clientes</p>
            </div>
            <Link href={`/loja/${seller.shopSlug}`} target="_blank" className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-lg shadow-amber-500/20">
              Abrir vitrine
            </Link>
          </div>
          <div className="px-4 py-3 rounded-xl bg-black/30 border border-white/[0.04] font-[family-name:var(--font-geist-mono)] text-sm text-amber-400">
            /loja/{seller.shopSlug}
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="rounded-2xl bg-[#0f1219] border border-white/[0.06] p-5">
          <p className="text-sm font-bold text-white mb-4">Ações rápidas</p>
          <div className="space-y-2">
            {[
              { href: "/painel/estoque", label: "Gerenciar estoque", color: "text-amber-400" },
              { href: "/painel/precos", label: "Editar preços", color: "text-blue-400" },
              { href: "/painel/pedidos", label: "Ver pedidos", color: "text-purple-400" },
            ].map((a) => (
              <Link key={a.href} href={a.href} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-all group">
                <span className={`text-[13px] font-medium ${a.color}`}>{a.label}</span>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Pedidos recentes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-white">Pedidos recentes</p>
          <Link href="/painel/pedidos" className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold transition-colors">
            Ver todos →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="rounded-2xl bg-[#0f1219] border border-white/[0.06] p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">Nenhum pedido ainda</p>
            <p className="text-[11px] text-gray-600 mt-1">Compartilhe sua vitrine para receber pedidos</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#0f1219] border border-white/[0.06] overflow-hidden">
            {recentOrders.map((order, i) => (
              <div key={order.id} className={`px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors ${i > 0 ? "border-t border-white/[0.04]" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-[11px] font-bold text-gray-300">
                    {order.customerName[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white">{order.customerName}</p>
                    <p className="text-[11px] text-gray-500 font-[family-name:var(--font-geist-mono)]">
                      {order.items.length} fig. · {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge[order.status] || ""}`}>
                    {statusLabel[order.status] || order.status}
                  </span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-sm font-bold text-white">
                    R${order.totalPrice.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
