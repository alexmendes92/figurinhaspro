"use client";

import { useState, useEffect } from "react";

const plans = [
  {
    key: "FREE",
    name: "Starter",
    price: "0",
    period: "gratis",
    features: [
      "100 figurinhas no estoque",
      "10 pedidos/mes",
      "1 album",
      "Vitrine basica",
    ],
    limits: "100 figurinhas · 10 pedidos · 1 album",
  },
  {
    key: "PRO",
    name: "Pro",
    price: "29",
    period: "/mes",
    popular: true,
    features: [
      "1.000 figurinhas no estoque",
      "100 pedidos/mes",
      "Todos os 13 albuns",
      "WhatsApp integrado",
      "Precos custom por album",
    ],
    limits: "1.000 figurinhas · 100 pedidos · 13 albuns",
  },
  {
    key: "UNLIMITED",
    name: "Ilimitado",
    price: "59",
    period: "/mes",
    features: [
      "Figurinhas ilimitadas",
      "Pedidos ilimitados",
      "Todos os 13 albuns",
      "Relatorios avancados",
      "Suporte prioritario",
    ],
    limits: "Sem limites",
  },
];

export default function PlanosPage() {
  const [currentPlan, setCurrentPlan] = useState<string>("FREE");
  const [loading, setLoading] = useState<string | null>(null);
  const [usage, setUsage] = useState({ stickers: 0, orders: 0, albums: 0 });

  useEffect(() => {
    fetch("/api/seller")
      .then((r) => r.json())
      .then((data) => {
        if (data.plan) setCurrentPlan(data.plan);
      })
      .catch(() => {});

    // Buscar uso atual
    Promise.all([
      fetch("/api/inventory").then((r) => r.json()),
      fetch("/api/orders").then((r) => r.json()),
    ])
      .then(([inv, orders]) => {
        const activeStickers = Array.isArray(inv)
          ? inv.filter((i: { quantity: number }) => i.quantity > 0).length
          : 0;
        const albumSlugs = new Set(
          Array.isArray(inv)
            ? inv
                .filter((i: { quantity: number }) => i.quantity > 0)
                .map((i: { albumSlug: string }) => i.albumSlug)
            : []
        );
        const monthOrders = Array.isArray(orders)
          ? orders.filter((o: { createdAt: string }) => {
              const d = new Date(o.createdAt);
              const now = new Date();
              return (
                d.getMonth() === now.getMonth() &&
                d.getFullYear() === now.getFullYear()
              );
            }).length
          : 0;
        setUsage({
          stickers: activeStickers,
          orders: monthOrders,
          albums: albumSlugs.size,
        });
      })
      .catch(() => {});
  }, []);

  async function handleUpgrade(plan: string) {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Erro ao criar checkout");
      }
    } catch {
      alert("Erro de conexao");
    } finally {
      setLoading(null);
    }
  }

  async function handleManageBilling() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Erro ao abrir portal");
      }
    } catch {
      alert("Erro de conexao");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-white">Planos e Assinatura</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Gerencie seu plano e acompanhe seu uso
        </p>
      </div>

      {/* Uso atual */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: "Figurinhas", value: usage.stickers, color: "amber" },
          { label: "Pedidos/mes", value: usage.orders, color: "blue" },
          { label: "Albuns", value: usage.albums, color: "emerald" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800"
          >
            <p className="text-xs text-zinc-500">{stat.label}</p>
            <p className="text-2xl font-bold font-[family-name:var(--font-geist-mono)] text-white mt-1">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Planos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          const isDowngrade =
            (currentPlan === "UNLIMITED" && plan.key !== "UNLIMITED") ||
            (currentPlan === "PRO" && plan.key === "FREE");

          return (
            <div
              key={plan.key}
              className={`relative p-6 rounded-2xl border transition-all ${
                isCurrent
                  ? "border-amber-500/40 bg-amber-500/[0.04] ring-1 ring-amber-500/20"
                  : plan.popular
                  ? "border-amber-500/20 bg-zinc-900/60"
                  : "border-zinc-800 bg-zinc-900/40"
              }`}
            >
              {plan.popular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider">
                  Popular
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider">
                  Atual
                </div>
              )}

              <p className="text-sm font-bold text-white mb-4">{plan.name}</p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-xs text-zinc-500">R$</span>
                <span className="text-4xl font-black text-white font-[family-name:var(--font-geist-mono)] tracking-tighter">
                  {plan.price}
                </span>
                <span className="text-xs text-zinc-500">{plan.period}</span>
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-[13px] text-zinc-300"
                  >
                    <svg
                      className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                currentPlan !== "FREE" ? (
                  <button
                    onClick={handleManageBilling}
                    disabled={loading === "portal"}
                    className="w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-medium hover:border-zinc-500 hover:text-white transition-all disabled:opacity-50"
                  >
                    {loading === "portal"
                      ? "Abrindo..."
                      : "Gerenciar assinatura"}
                  </button>
                ) : (
                  <div className="w-full py-2.5 rounded-xl border border-zinc-800 text-zinc-600 text-sm font-medium text-center">
                    Plano atual
                  </div>
                )
              ) : isDowngrade ? (
                <button
                  onClick={handleManageBilling}
                  disabled={loading === "portal"}
                  className="w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-medium hover:border-zinc-500 hover:text-white transition-all disabled:opacity-50"
                >
                  Alterar plano
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={loading === plan.key}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                    plan.popular
                      ? "bg-amber-500 hover:bg-amber-400 text-black"
                      : "bg-white/10 hover:bg-white/15 text-white"
                  }`}
                >
                  {loading === plan.key ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Redirecionando...
                    </span>
                  ) : (
                    `Assinar ${plan.name}`
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="mt-12 space-y-4">
        <h3 className="text-sm font-bold text-white">Perguntas frequentes</h3>
        {[
          {
            q: "Posso cancelar a qualquer momento?",
            a: "Sim, sem multa. O acesso continua ate o fim do periodo pago.",
          },
          {
            q: "O que acontece se eu atingir o limite?",
            a: "Voce recebe um aviso e pode fazer upgrade instantaneamente.",
          },
          {
            q: "Aceita quais formas de pagamento?",
            a: "Cartao de credito (Visa, Mastercard, Elo) e PIX via Stripe.",
          },
        ].map((faq) => (
          <div
            key={faq.q}
            className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800"
          >
            <p className="text-sm font-medium text-white">{faq.q}</p>
            <p className="text-xs text-zinc-400 mt-1">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
