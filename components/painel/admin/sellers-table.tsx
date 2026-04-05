"use client";

import Link from "next/link";
import { useState } from "react";
import type { MockSeller } from "@/app/painel/admin/revendedores/mock-data";

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  ACTIVE: { label: "Ativo", class: "bg-emerald-500/10 text-emerald-400" },
  INACTIVE: { label: "Inativo", class: "bg-red-500/10 text-red-400" },
};

const PLAN_BADGE: Record<string, { label: string; class: string }> = {
  FREE: { label: "Free", class: "bg-gray-500/10 text-gray-400" },
  PRO: { label: "Pro", class: "bg-amber-500/10 text-amber-400" },
  UNLIMITED: { label: "Unlimited", class: "bg-violet-500/10 text-violet-400" },
};

const PAGE_SIZE = 8;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function SellersTable({ sellers }: { sellers: MockSeller[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const filtered = sellers.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.shopName.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(0);
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome, email ou loja..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-500/40 focus:outline-none transition-colors"
          />
        </div>
        <span className="text-xs text-gray-500">
          {filtered.length} revendedor{filtered.length !== 1 ? "es" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06] text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Revendedor</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Plano</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell text-right">Albums</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell text-right">Clientes</th>
                <th className="px-4 py-3 font-medium text-right">Transacionado</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500 text-sm">
                    Nenhum revendedor encontrado
                  </td>
                </tr>
              ) : (
                paged.map((seller) => {
                  const status = STATUS_BADGE[seller.status] || STATUS_BADGE.ACTIVE;
                  const plan = PLAN_BADGE[seller.plan] || PLAN_BADGE.FREE;
                  return (
                    <tr
                      key={seller.id}
                      className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/painel/admin/revendedores/${seller.id}`}
                          className="block"
                        >
                          <p className="text-sm text-white font-medium group-hover:text-amber-400 transition-colors">
                            {seller.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {seller.email}
                          </p>
                          {/* Mobile-only badges */}
                          <div className="flex items-center gap-2 mt-1.5 sm:hidden">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${status.class}`}>
                              {status.label}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${plan.class}`}>
                              {plan.label}
                            </span>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-[11px] px-2 py-1 rounded-lg font-medium ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`text-[11px] px-2 py-1 rounded-lg font-medium ${plan.class}`}>
                          {plan.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-right">
                        <span className="text-sm text-gray-300">{seller.albumCount}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-right">
                        <span className="text-sm text-gray-300">{seller.clientCount}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/painel/admin/revendedores/${seller.id}`}
                          className="text-sm text-gray-300 font-medium group-hover:text-amber-400 transition-colors"
                        >
                          {formatCurrency(seller.totalTransacted)}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            Anterior
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${
                  i === safePage
                    ? "bg-amber-500/15 text-amber-400"
                    : "text-gray-500 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage === totalPages - 1}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            Proximo
          </button>
        </div>
      )}
    </div>
  );
}
