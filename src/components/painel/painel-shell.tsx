"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface SellerInfo {
  id: string;
  name: string;
  shopName: string;
  shopSlug: string;
  plan: string;
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  FREE: { label: "Starter", color: "text-gray-400" },
  PRO: { label: "Pro", color: "text-amber-400" },
  UNLIMITED: { label: "Ilimitado", color: "text-emerald-400" },
};

const nav = [
  {
    href: "/painel",
    label: "Início",
    exact: true,
    icon: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  },
  {
    href: "/painel/estoque",
    label: "Estoque",
    icon: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
  },
  {
    href: "/painel/precos",
    label: "Preços",
    icon: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z",
  },
  {
    href: "/painel/pedidos",
    label: "Pedidos",
    icon: "M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184",
  },
  {
    href: "/painel/loja",
    label: "Loja",
    icon: "M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z",
  },
  {
    href: "/painel/planos",
    label: "Planos",
    icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z",
  },
];

const mobileNav = [nav[0], nav[1], nav[2], nav[3], nav[4]];

export default function PainelShell({
  seller,
  children,
  pendingOrders = 0,
  isAdmin = false,
}: {
  seller: SellerInfo;
  children: React.ReactNode;
  pendingOrders?: number;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = isAdmin
    ? [
        ...nav,
        {
          href: "/painel/comercial",
          label: "Comercial",
          icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
        },
        {
          href: "/painel/admin/revendedores",
          label: "Revendedores",
          icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
        },
      ]
    : nav;

  const initials = seller.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const plan = PLAN_LABELS[seller.plan] || PLAN_LABELS.FREE;

  const segments = pathname.replace("/painel/estoque/", "").split("/");
  const isStockDetail = pathname.startsWith("/painel/estoque/") && segments[0] !== "";
  const collapsed = isStockDetail;

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#0b0e14]">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-[#0f1219] border-r border-white/[0.06] flex flex-col shrink-0 transition-all duration-300 ${
          collapsed ? "w-[60px]" : "w-[220px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand */}
        <div
          className={`h-16 flex items-center border-b border-white/[0.06] ${collapsed ? "px-3 justify-center" : "px-5 gap-3"}`}
        >
          <Link
            href="/painel"
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0 hover:shadow-amber-500/30 transition-shadow hover:scale-105 active:scale-95"
          >
            <span className="text-white text-sm font-black font-[family-name:var(--font-geist-mono)]">
              F
            </span>
          </Link>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-white leading-tight truncate">
                {seller.shopName}
              </p>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${plan.color}`}>
                {plan.label}
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 py-4 space-y-1 ${collapsed ? "px-1.5" : "px-3"}`}>
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`relative group flex items-center rounded-xl font-medium transition-all ${
                  collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
                } text-[13px] ${
                  active
                    ? "bg-amber-500/10 text-amber-400"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {/* Active indicator bar */}
                {active && !collapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-amber-400" />
                )}
                <svg
                  className={`w-[18px] h-[18px] shrink-0 transition-colors ${active ? "text-amber-400" : "text-gray-500 group-hover:text-gray-300"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {!collapsed && (
                  <>
                    {item.label}
                    {item.href === "/painel/pedidos" && pendingOrders > 0 && (
                      <span className="ml-auto px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none min-w-[18px] text-center animate-pulse">
                        {pendingOrders > 99 ? "99+" : pendingOrders}
                      </span>
                    )}
                  </>
                )}
                {/* Collapsed badge */}
                {collapsed && item.href === "/painel/pedidos" && pendingOrders > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center animate-pulse">
                    {pendingOrders > 9 ? "9+" : pendingOrders}
                  </span>
                )}
                {/* Tooltip no modo colapsado */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-gray-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`border-t border-white/[0.06] space-y-1 ${collapsed ? "p-1.5" : "p-3"}`}>
          {!collapsed && (
            <Link
              href={`/loja/${seller.shopSlug}`}
              target="_blank"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] text-gray-500 hover:text-amber-400 hover:bg-amber-500/5 transition-all group"
            >
              <svg
                className="w-4 h-4 group-hover:rotate-[-12deg] transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
              Ver vitrine
            </Link>
          )}
          <div
            className={`flex items-center ${collapsed ? "justify-center py-2" : "gap-2.5 px-3 py-2"}`}
          >
            <div
              className={`rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-white shadow-md shrink-0 ${collapsed ? "w-8 h-8 text-[10px]" : "w-8 h-8 text-[11px]"}`}
            >
              {initials}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-300 truncate">{seller.name}</p>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                  aria-label="Sair"
                >
                  {loggingOut ? (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
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
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                      />
                    </svg>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-white/[0.06] bg-[#0b0e14]/80 backdrop-blur-xl flex items-center px-4 sm:px-5 gap-3 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-gray-400 active:bg-white/5 hover:border-white/20 transition-colors"
            aria-label="Abrir menu"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[12px] text-gray-500 min-w-0"
          >
            <Link href="/painel" className="hover:text-white transition-colors shrink-0">
              Painel
            </Link>
            {pathname
              .replace("/painel", "")
              .split("/")
              .filter(Boolean)
              .map((seg, i, arr) => (
                <span key={i} className="flex items-center gap-1.5 min-w-0">
                  <span className="text-gray-700 shrink-0" aria-hidden="true">
                    /
                  </span>
                  <span
                    className={`truncate ${i === arr.length - 1 ? "text-white font-medium" : ""}`}
                    aria-current={i === arr.length - 1 ? "page" : undefined}
                  >
                    {seg.charAt(0).toUpperCase() + seg.slice(1)}
                  </span>
                </span>
              ))}
          </nav>
          {/* Quick action - ver vitrine */}
          <Link
            href={`/loja/${seller.shopSlug}`}
            target="_blank"
            className="ml-auto hidden sm:flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-amber-400 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
            Vitrine
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto pb-[72px] lg:pb-0">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#0f1219]/95 backdrop-blur-xl border-t border-white/[0.06] safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {mobileNav.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors active:bg-white/5 ${
                  active ? "text-amber-400" : "text-gray-500"
                }`}
              >
                <div className="relative">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={active ? 2 : 1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.href === "/painel/pedidos" && pendingOrders > 0 && (
                    <span className="absolute -top-1.5 -right-2 px-1 py-0.5 rounded-full bg-red-500 text-white text-[8px] font-bold leading-none min-w-[14px] text-center animate-pulse">
                      {pendingOrders > 9 ? "9+" : pendingOrders}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
                {/* Active dot indicator */}
                {active && <div className="absolute top-1 w-1 h-1 rounded-full bg-amber-400" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
