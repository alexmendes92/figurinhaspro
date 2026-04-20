import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { albums } from "@/lib/albums";
import Link from "next/link";
import CopyLinkButton from "@/components/painel/copy-link-button";
import GettingStarted from "@/components/painel/getting-started";
import { Spark } from "@/components/painel/spark";
import {
  DashboardAlerts,
  type DashboardAlert,
} from "@/components/painel/dashboard-alerts";
import {
  DashboardHot,
  type HotItem,
} from "@/components/painel/dashboard-hot";

const totalCatalog = albums.reduce((s, a) => s + a.totalStickers, 0);
const BR_DATE = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const statusBadge: Record<string, string> = {
  QUOTE: "bg-amber-500/[0.08] text-amber-400 border-amber-500/20",
  CONFIRMED: "bg-blue-500/[0.08] text-blue-400 border-blue-500/20",
  PAID: "bg-emerald-500/[0.08] text-emerald-400 border-emerald-500/20",
  SHIPPED: "bg-purple-500/[0.08] text-purple-400 border-purple-500/20",
  DELIVERED: "bg-emerald-500/[0.08] text-emerald-400 border-emerald-500/20",
  CANCELLED: "bg-red-500/[0.08] text-red-400 border-red-500/20",
};
const statusLabel: Record<string, string> = {
  QUOTE: "Orçamento",
  CONFIRMED: "Confirmado",
  PAID: "Pago",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

const CONFIRMED_STATUSES = ["CONFIRMED", "PAID", "SHIPPED", "DELIVERED"] as const;

function brl(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function greeting(hour: number): string {
  if (hour < 5) return "boa madrugada";
  if (hour < 12) return "bom dia";
  if (hour < 18) return "boa tarde";
  return "boa noite";
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number): Date {
  const x = startOfDay(new Date());
  x.setDate(x.getDate() - n);
  return x;
}

function startOfMonth(): Date {
  const x = new Date();
  return new Date(x.getFullYear(), x.getMonth(), 1);
}

export default async function DashboardPage() {
  const seller = await getSession();
  if (!seller) return null;

  const now = new Date();
  const today = startOfDay(now);
  const yesterday = daysAgo(1);
  const twoDaysAgo = daysAgo(2);
  const monthStart = startOfMonth();
  const sixteenDaysAgo = daysAgo(15);

  const [
    inventoryCount,
    totalQtyAgg,
    orderCount,
    openOrders,
    recentOrders,
    priceRuleCount,
    customAlbumCount,
    todayOrders,
    yesterdayOrders,
    monthRevenue,
    revenueBuckets,
    recentItems,
    lowStock,
  ] = await Promise.all([
    db.inventory.count({ where: { sellerId: seller.id, quantity: { gt: 0 } } }),
    db.inventory.aggregate({
      where: { sellerId: seller.id, quantity: { gt: 0 } },
      _sum: { quantity: true },
    }),
    db.order.count({ where: { sellerId: seller.id } }),
    db.order.findMany({
      where: { sellerId: seller.id, status: "QUOTE" },
      orderBy: { createdAt: "asc" },
      select: { id: true, createdAt: true, totalPrice: true },
    }),
    db.order.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { items: { select: { id: true } } },
    }),
    db.priceRule.count({ where: { sellerId: seller.id } }),
    db.customAlbum.count({ where: { sellerId: seller.id } }),
    db.order.aggregate({
      where: {
        sellerId: seller.id,
        status: { in: [...CONFIRMED_STATUSES] },
        createdAt: { gte: today },
      },
      _sum: { totalPrice: true },
      _count: { _all: true },
    }),
    db.order.aggregate({
      where: {
        sellerId: seller.id,
        status: { in: [...CONFIRMED_STATUSES] },
        createdAt: { gte: yesterday, lt: today },
      },
      _sum: { totalPrice: true },
    }),
    db.order.aggregate({
      where: {
        sellerId: seller.id,
        status: { in: [...CONFIRMED_STATUSES] },
        createdAt: { gte: monthStart },
      },
      _sum: { totalPrice: true },
    }),
    db.order.findMany({
      where: {
        sellerId: seller.id,
        status: { in: [...CONFIRMED_STATUSES] },
        createdAt: { gte: sixteenDaysAgo },
      },
      select: { totalPrice: true, createdAt: true },
    }),
    db.orderItem.findMany({
      where: {
        order: {
          sellerId: seller.id,
          status: { in: [...CONFIRMED_STATUSES] },
          createdAt: { gte: twoDaysAgo },
        },
      },
      select: {
        albumSlug: true,
        stickerCode: true,
        stickerName: true,
        quantity: true,
        order: { select: { createdAt: true } },
      },
    }),
    db.inventory.findMany({
      where: { sellerId: seller.id, quantity: { gt: 0, lte: 2 } },
      select: { id: true, albumSlug: true, stickerCode: true, quantity: true },
      take: 5,
    }),
  ]);

  const storeUrl = `/loja/${seller.shopSlug}`;
  const firstName = seller.name.split(" ")[0];
  const totalQty = totalQtyAgg._sum.quantity || 0;
  const todayRevenue = todayOrders._sum.totalPrice || 0;
  const yesterdayRevenue = yesterdayOrders._sum.totalPrice || 0;
  const revenueMonth = monthRevenue._sum.totalPrice || 0;
  const albumCount = customAlbumCount || albums.length;

  const deltaPct =
    yesterdayRevenue > 0
      ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
      : todayRevenue > 0
        ? 100
        : 0;

  const buckets = Array(15).fill(0) as number[];
  for (const o of revenueBuckets) {
    const diffDays = Math.floor(
      (today.getTime() - startOfDay(o.createdAt).getTime()) / 86400000,
    );
    const idx = 14 - diffDays;
    if (idx >= 0 && idx < 15) buckets[idx] += o.totalPrice;
  }

  const expiringSoon = openOrders.filter((o) => {
    const ageHours = (now.getTime() - o.createdAt.getTime()) / 3600000;
    return ageHours >= 23;
  }).length;

  const hotMap = new Map<
    string,
    { stickerName: string; albumSlug: string; stickerCode: string; sales: number; recent: number; older: number }
  >();
  for (const item of recentItems) {
    const key = `${item.albumSlug}:${item.stickerCode}`;
    const current = hotMap.get(key) || {
      stickerName: item.stickerName,
      albumSlug: item.albumSlug,
      stickerCode: item.stickerCode,
      sales: 0,
      recent: 0,
      older: 0,
    };
    current.sales += item.quantity;
    const ageHours = (now.getTime() - item.order.createdAt.getTime()) / 3600000;
    if (ageHours < 24) current.recent += item.quantity;
    else current.older += item.quantity;
    hotMap.set(key, current);
  }
  const hot: HotItem[] = Array.from(hotMap.values())
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 6)
    .map((it) => ({
      albumSlug: it.albumSlug,
      stickerCode: it.stickerCode,
      stickerName: it.stickerName,
      sales: it.sales,
      values: [it.older, Math.max(1, it.older + 1), it.sales, it.sales + 1, it.recent + it.sales],
    }));

  const alerts: DashboardAlert[] = [];
  if (expiringSoon > 0) {
    alerts.push({
      kind: "expiring",
      title: `${expiringSoon} orçamento${expiringSoon > 1 ? "s" : ""} prest${expiringSoon > 1 ? "es" : "e"} a expirar`,
      detail: "Confirme ou entre em contato com o comprador",
      severity: "high",
      href: "/painel/pedidos",
      cta: "Abrir pedidos",
    });
  }
  if (lowStock.length > 0) {
    alerts.push({
      kind: "low-stock",
      title: `${lowStock.length} figurinha${lowStock.length > 1 ? "s" : ""} com estoque baixo`,
      detail: "≤ 2 unidades restantes — reabasteça para não perder vendas",
      severity: "med",
      href: "/painel/estoque",
      cta: "Ver estoque",
    });
  }
  if (priceRuleCount === 0 && inventoryCount > 0) {
    alerts.push({
      kind: "no-prices",
      title: "Você ainda não configurou preços",
      detail: "Defina valores por tipo de figurinha no painel de preços",
      severity: "med",
      href: "/painel/precos",
      cta: "Configurar",
    });
  }
  if (!seller.phone) {
    alerts.push({
      kind: "no-phone",
      title: "Adicione seu WhatsApp",
      detail: "Compradores conseguem te contatar direto pela vitrine",
      severity: "info",
      href: "/painel/loja",
      cta: "Adicionar",
    });
  }

  const setupComplete = inventoryCount > 0 && priceRuleCount > 0 && !!seller.phone;
  const salute = greeting(now.getHours());
  const openOrdersCount = openOrders.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1280px] slide-up">
      {/* Saudação editorial */}
      <div className="mb-6 sm:mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">
            {BR_DATE.format(now)} · {salute}
          </p>
          <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-white mt-1.5 leading-[1.05]">
            Olá, {firstName}.
            {todayRevenue > 0 ? (
              <>
                {" "}Seu dia rende{" "}
                <span className="text-amber-400 font-[family-name:var(--font-geist-mono)]">
                  R$ {brl(todayRevenue)}
                </span>{" "}
                <span className="text-gray-500 font-normal">até agora.</span>
              </>
            ) : openOrdersCount > 0 ? (
              <>
                {" "}Você tem{" "}
                <span className="text-amber-400 font-[family-name:var(--font-geist-mono)]">
                  {openOrdersCount} pedido{openOrdersCount > 1 ? "s" : ""}
                </span>{" "}
                <span className="text-gray-500 font-normal">aguardando confirmação.</span>
              </>
            ) : (
              <>
                {" "}<span className="text-gray-500 font-normal">Bora vender hoje?</span>
              </>
            )}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            href="/painel/estoque"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-xs font-semibold text-white transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <path d="M4 7h3l2-3h6l2 3h3v13H4z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Scanner
            <span className="ml-0.5 px-1.5 py-0.5 rounded bg-white/[0.06] text-[9px] font-mono text-gray-400">em breve</span>
          </Link>
          <Link
            href="/painel/estoque"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-xs font-semibold text-white transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <path d="M20 12a8 8 0 1 1-3-6.24L20 4l-1 3.3A8 8 0 0 1 20 12z" />
              <path d="M8 10c1 3 3 5 6 6l1.5-1.5a1 1 0 0 1 1-.25l2 .5a1 1 0 0 1 .75 1V17a2 2 0 0 1-2 2C11 19 5 13 5 8a2 2 0 0 1 2-2h1.2a1 1 0 0 1 1 .75l.5 2a1 1 0 0 1-.25 1L8 10z" />
            </svg>
            Colar WhatsApp
          </Link>
          <Link
            href="/painel/estoque"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Marcar figurinha
          </Link>
        </div>
      </div>

      {!setupComplete && (
        <GettingStarted
          hasStock={inventoryCount > 0}
          hasPrices={priceRuleCount > 0}
          hasPhone={!!seller.phone}
          storeUrl={storeUrl}
        />
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="rounded-2xl border border-white/[0.06] bg-[#0f1219] p-4 sm:p-5">
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Vendas hoje</p>
          <p className="text-xl sm:text-2xl font-black text-white font-[family-name:var(--font-geist-mono)] mt-2">
            R$ {brl(todayRevenue)}
          </p>
          <div className="flex items-center gap-2 mt-2 text-[11px]">
            {deltaPct !== 0 && (
              <span
                className={`px-1.5 py-0.5 rounded font-semibold font-[family-name:var(--font-geist-mono)] ${
                  deltaPct > 0
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {deltaPct > 0 ? "+" : ""}{deltaPct}%
              </span>
            )}
            <span className="text-gray-500">vs ontem</span>
          </div>
        </div>

        <Link
          href="/painel/pedidos"
          className="rounded-2xl border border-white/[0.06] bg-[#0f1219] p-4 sm:p-5 hover:border-white/[0.12] transition-all"
        >
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Pedidos abertos</p>
          <p className="text-xl sm:text-2xl font-black text-white font-[family-name:var(--font-geist-mono)] mt-2">
            {openOrdersCount}
          </p>
          <p className="text-[11px] mt-2 truncate">
            {expiringSoon > 0 ? (
              <span className="text-red-400 font-semibold">
                {expiringSoon} expira{expiringSoon > 1 ? "m" : ""} em breve
              </span>
            ) : openOrdersCount === 0 ? (
              <span className="text-gray-500">Nenhum pendente</span>
            ) : (
              <span className="text-gray-500">Aguardando confirmação</span>
            )}
          </p>
        </Link>

        <Link
          href="/painel/estoque"
          className="rounded-2xl border border-white/[0.06] bg-[#0f1219] p-4 sm:p-5 hover:border-white/[0.12] transition-all"
        >
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Figurinhas em estoque</p>
          <p className="text-xl sm:text-2xl font-black text-white font-[family-name:var(--font-geist-mono)] mt-2">
            {totalQty.toLocaleString("pt-BR")}
          </p>
          <p className="text-[11px] text-gray-500 mt-2 truncate">
            {inventoryCount} tipos · {albumCount} {albumCount === 1 ? "álbum" : "álbuns"}
          </p>
        </Link>

        <div className="rounded-2xl border border-white/[0.06] bg-[#0f1219] p-4 sm:p-5">
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Faturamento do mês</p>
          <p className="text-xl sm:text-2xl font-black text-white font-[family-name:var(--font-geist-mono)] mt-2">
            R$ {brl(revenueMonth)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Spark values={buckets} color="#fbbf24" width={68} height={20} fill />
            <span className="text-[11px] text-gray-500">15 dias</span>
          </div>
        </div>
      </div>

      {/* Alertas + Em alta */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-6">
        <div className="lg:col-span-3">
          <DashboardAlerts alerts={alerts} />
        </div>
        <div className="lg:col-span-2">
          <DashboardHot items={hot} />
        </div>
      </div>

      {/* Vitrine compacta */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0f1219] p-4 sm:p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] text-amber-400/70 font-semibold uppercase tracking-wider">Sua vitrine</p>
            <p className="text-sm font-bold text-white mt-0.5">Compartilhe com seus compradores</p>
          </div>
          <div className="flex items-center gap-2 min-w-0 sm:min-w-[380px]">
            <div className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-black/30 border border-white/[0.04] font-[family-name:var(--font-geist-mono)] text-xs text-amber-400 truncate">
              {storeUrl}
            </div>
            <CopyLinkButton path={storeUrl} />
            <Link
              href={storeUrl}
              target="_blank"
              className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold transition-all shadow-lg shadow-amber-500/20 shrink-0"
            >
              Abrir ↗
            </Link>
          </div>
        </div>
      </div>

      {/* Pedidos recentes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-white">Pedidos recentes</p>
          <Link
            href="/painel/pedidos"
            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold transition-colors"
          >
            Ver todos →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-[#0f1219] p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">Nenhum pedido ainda</p>
            <p className="text-[11px] text-gray-600 mt-1">Compartilhe sua vitrine para receber pedidos</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-[#0f1219] overflow-hidden">
            {recentOrders.map((order, i) => (
              <div
                key={order.id}
                className={`px-4 sm:px-5 py-3.5 flex items-center justify-between gap-2 hover:bg-white/[0.02] transition-colors ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-[11px] font-bold text-gray-300 shrink-0">
                    {order.customerName[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate">{order.customerName}</p>
                    <p className="text-[11px] text-gray-500 font-[family-name:var(--font-geist-mono)]">
                      {order.items.length} fig. · {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge[order.status] || ""}`}
                  >
                    {statusLabel[order.status] || order.status}
                  </span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-sm font-bold text-white">
                    R$ {brl(order.totalPrice)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-gray-600 mt-8 text-center font-[family-name:var(--font-geist-mono)]">
        {orderCount} pedidos no total · catálogo com {totalCatalog.toLocaleString("pt-BR")} figurinhas
      </p>
    </div>
  );
}
