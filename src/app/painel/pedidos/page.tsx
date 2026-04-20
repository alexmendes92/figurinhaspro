"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useToast } from "@/lib/toast-context";

interface OrderItem {
  id: string;
  stickerCode: string;
  stickerName: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  status: string;
  totalPrice: number;
  channel: string;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
}

const statusFlow = ["QUOTE", "CONFIRMED", "PAID", "SHIPPED", "DELIVERED"];

const statusConfig: Record<
  string,
  { label: string; badge: string; next?: string; nextLabel?: string }
> = {
  QUOTE: { label: "Orçamento", badge: "badge-zinc", next: "CONFIRMED", nextLabel: "Confirmar" },
  CONFIRMED: { label: "Confirmado", badge: "badge-blue", next: "PAID", nextLabel: "Marcar pago" },
  PAID: { label: "Pago", badge: "badge-green", next: "SHIPPED", nextLabel: "Marcar enviado" },
  SHIPPED: {
    label: "Enviado",
    badge: "badge-amber",
    next: "DELIVERED",
    nextLabel: "Marcar entregue",
  },
  DELIVERED: { label: "Entregue", badge: "badge-green" },
  CANCELLED: { label: "Cancelado", badge: "badge-red" },
};

const _channelLabels: Record<string, string> = {
  SYSTEM: "Sistema",
  WHATSAPP: "WhatsApp",
  MANUAL: "Manual",
};

export default function PedidosPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState<{
    orderId: string;
    customerName: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Erro ao carregar pedidos");
        setLoading(false);
      });
  }, [toast.error]);

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
        toast.success(newStatus === "CANCELLED" ? "Pedido cancelado" : "Status atualizado");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Erro ao atualizar pedido");
      }
    } catch {
      toast.error("Erro de conexão ao atualizar pedido");
    }
    setUpdating(null);
  }

  const filtered = (filter === "all" ? orders : orders.filter((o) => o.status === filter)).filter(
    (o) => !search.trim() || o.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const counts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="p-6 lg:p-8 max-w-5xl slide-up">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            {orders.length} {orders.length === 1 ? "pedido" : "pedidos"} no total
          </p>
        </div>
      </div>

      {/* Filtros por status */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: "all", label: "Todos", count: orders.length },
          ...statusFlow.map((s) => ({
            key: s,
            label: statusConfig[s].label,
            count: counts[s] || 0,
          })),
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
              filter === f.key
                ? "bg-[var(--accent-dim)] text-[var(--accent)] border-[var(--accent-border)]"
                : "text-[var(--muted)] border-[var(--border)] hover:border-[var(--border-hover)] hover:text-white"
            }`}
          >
            {f.label}
            {f.count > 0 && (
              <span className="ml-1.5 font-[family-name:var(--font-geist-mono)]">{f.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Busca por nome */}
      {orders.length > 0 && (
        <div className="mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome do cliente..."
            className="w-full sm:max-w-xs px-4 py-2.5 rounded-xl bg-white/[0.04] border border-[var(--border)] text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-[var(--card)] border border-[var(--border)] shimmer"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859"
              />
            </svg>
          </div>
          <p className="text-sm text-[var(--muted)]">
            {filter === "all" ? "Nenhum pedido ainda" : "Nenhum pedido com esse status"}
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            Compartilhe o link da sua loja para receber pedidos
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const sc = statusConfig[order.status] || statusConfig.QUOTE;
            const isExpanded = expandedId === order.id;
            const isUpdating = updating === order.id;

            return (
              <div
                key={order.id}
                className={`rounded-2xl border overflow-hidden transition-all ${
                  isExpanded
                    ? "border-[var(--border-hover)] bg-[var(--card-hover)]"
                    : "border-[var(--border)] bg-[var(--card)]"
                }`}
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="w-full px-4 sm:px-5 py-4 flex items-center justify-between text-left hover:bg-white/[0.01] transition-colors gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
                      {order.customerName[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{order.customerName}</p>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-zinc-600 font-[family-name:var(--font-geist-mono)]">
                          {order.items.length} fig.
                        </span>
                        <span className="text-zinc-700 hidden sm:inline">·</span>
                        <span className="text-[10px] text-zinc-600 font-[family-name:var(--font-geist-mono)] hidden sm:inline">
                          {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-[10px] text-zinc-600 font-[family-name:var(--font-geist-mono)] sm:hidden">
                          {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className={`badge ${sc.badge}`}>{sc.label}</span>
                    <span className="font-[family-name:var(--font-geist-mono)] text-sm text-[var(--accent)] font-bold">
                      R${order.totalPrice.toFixed(2).replace(".", ",")}
                    </span>
                    <svg
                      className={`w-4 h-4 text-zinc-600 transition-transform hidden sm:block ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Detalhe expandido */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-[var(--border)] fade-in">
                    {/* Info cliente */}
                    <div className="flex flex-wrap gap-4 py-3">
                      {order.customerPhone && (
                        <a
                          href={`https://wa.me/55${order.customerPhone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-green-400 hover:underline"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                          </svg>
                          {order.customerPhone}
                        </a>
                      )}
                      {order.customerEmail && (
                        <span className="text-xs text-[var(--muted)]">{order.customerEmail}</span>
                      )}
                    </div>

                    {order.notes && (
                      <p className="text-xs text-zinc-500 italic mb-3 px-3 py-2 rounded-xl bg-zinc-800/30 border border-zinc-800/50">
                        &ldquo;{order.notes}&rdquo;
                      </p>
                    )}

                    {/* Status workflow */}
                    <div className="flex items-center gap-1 mb-4 py-3">
                      {statusFlow.map((s, i) => {
                        const idx = statusFlow.indexOf(order.status);
                        const done = i <= idx;
                        return (
                          <div key={s} className="flex items-center gap-1 flex-1">
                            <div
                              className={`w-full h-1 rounded-full ${done ? "bg-[var(--accent)]" : "bg-zinc-800"}`}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Figurinhas */}
                    <div className="rounded-xl border border-[var(--border)] overflow-hidden mb-4">
                      {order.items.map((item, i) => (
                        <div
                          key={item.id}
                          className={`px-3 sm:px-4 py-2.5 flex items-center justify-between text-xs gap-2 ${
                            i > 0 ? "border-t border-[var(--border)]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-[family-name:var(--font-geist-mono)] text-zinc-500 shrink-0">
                              {item.stickerCode}
                            </span>
                            <span className="text-zinc-300 truncate">{item.stickerName}</span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <span className="text-zinc-500">x{item.quantity}</span>
                            <span className="font-[family-name:var(--font-geist-mono)] text-[var(--accent)] font-medium text-right">
                              R${(item.unitPrice * item.quantity).toFixed(2).replace(".", ",")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex gap-2">
                        {sc.next && (
                          <button
                            onClick={() => updateStatus(order.id, sc.next!)}
                            disabled={isUpdating}
                            className="btn-primary !py-2.5 !px-4 !text-xs"
                          >
                            {isUpdating ? "..." : sc.nextLabel}
                          </button>
                        )}
                        {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                          <button
                            onClick={() =>
                              setCancelConfirm({
                                orderId: order.id,
                                customerName: order.customerName,
                              })
                            }
                            disabled={isUpdating}
                            className="btn-ghost !py-2.5 !px-4 !text-xs !text-red-400 !border-red-500/15 hover:!bg-red-500/5"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                      <span className="font-[family-name:var(--font-geist-mono)] text-lg text-[var(--accent)] font-bold shrink-0">
                        R${order.totalPrice.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!cancelConfirm}
        title="Cancelar pedido?"
        description={`O pedido de ${cancelConfirm?.customerName || ""} será cancelado permanentemente.`}
        confirmLabel="Cancelar pedido"
        variant="danger"
        onConfirm={() => {
          if (cancelConfirm) updateStatus(cancelConfirm.orderId, "CANCELLED");
          setCancelConfirm(null);
        }}
        onCancel={() => setCancelConfirm(null)}
      />
    </div>
  );
}
