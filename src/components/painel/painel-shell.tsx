"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./painel-shell.module.css";

interface SellerInfo {
  id: string;
  name: string;
  shopName: string;
  shopSlug: string;
  plan: string;
}

const PLAN_LABELS: Record<string, string> = {
  FREE: "Plano Starter",
  PRO: "Plano Pro",
  UNLIMITED: "Plano Ilimitado",
};

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  icon: (props: { className?: string }) => React.ReactElement;
};

const I = {
  home: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V10z" />
    </svg>
  ),
  layers: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2 2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  tag: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.59 13.41 13 21a2 2 0 0 1-2.83 0l-7-7A2 2 0 0 1 2.59 12L3 4l8-.41a2 2 0 0 1 1.41.59l8.17 8.17a2 2 0 0 1 0 2.83z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  ),
  receipt: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 2h16v20l-3-2-3 2-3-2-3 2-3-2-1 2V2z" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  ),
  store: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l1-5h16l1 5" />
      <path d="M4 9v11h16V9" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
  sparkle: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
      <path d="M19 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
    </svg>
  ),
  chart: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 4 4 5-6" />
    </svg>
  ),
  users: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  external: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  ),
  menu: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  ),
  logout: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  ),
  spinner: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
      <path d="M4 12a8 8 0 018-8" fill="currentColor" opacity="0.75" />
    </svg>
  ),
};

const operationNav: NavItem[] = [
  { href: "/painel", label: "Início", exact: true, icon: I.home },
  { href: "/painel/estoque", label: "Estoque", icon: I.layers },
  { href: "/painel/precos", label: "Preços", icon: I.tag },
  { href: "/painel/pedidos", label: "Pedidos", icon: I.receipt },
];

const toolsNav: NavItem[] = [
  { href: "/painel/loja", label: "Vitrine", icon: I.store },
  { href: "/painel/planos", label: "Planos", icon: I.sparkle },
];

const adminNav: NavItem[] = [
  { href: "/painel/comercial", label: "Comercial", icon: I.chart },
  { href: "/painel/admin/revendedores", label: "Revendedores", icon: I.users },
];

const mobileNav: NavItem[] = [
  operationNav[0],
  operationNav[1],
  operationNav[2],
  operationNav[3],
  toolsNav[0],
];

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

  const initials = seller.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const planLabel = PLAN_LABELS[seller.plan] ?? PLAN_LABELS.FREE;

  const segments = pathname.replace("/painel/estoque/", "").split("/");
  const isStockDetail = pathname.startsWith("/painel/estoque/") && segments[0] !== "";
  const collapsed = isStockDetail;

  const sidebarClass = [
    styles.sidebar,
    collapsed ? styles.sidebarNarrow : "",
    mobileOpen ? styles.sidebarOpen : "",
  ]
    .filter(Boolean)
    .join(" ");

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function renderNavItem(item: NavItem) {
    const active = isActive(item);
    const showBadge = item.href === "/painel/pedidos" && pendingOrders > 0;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
      >
        <item.icon className={styles.navIcon} />
        <span className={styles.navLabel}>{item.label}</span>
        {showBadge && (
          <span className={styles.navBadge}>{pendingOrders > 99 ? "99+" : pendingOrders}</span>
        )}
        {collapsed && <span className={styles.navTooltip}>{item.label}</span>}
      </Link>
    );
  }

  const crumbSegments = pathname
    .replace("/painel", "")
    .split("/")
    .filter(Boolean);

  return (
    <div className={styles.root}>
      <aside className={sidebarClass} aria-label="Navegação principal">
        <div className={styles.sidebarBrand}>
          <Link href="/painel" className={styles.brandLogo} aria-label="Início do painel">
            F
          </Link>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div className={styles.brandText}>
                Figurinhas<span className={styles.brandTextAccent}>Pro</span>
              </div>
              <div className={styles.brandSub}>{seller.shopName}</div>
            </div>
          )}
        </div>

        <nav className={styles.sidebarNav}>
          <div className={styles.sectionLabel}>Operação</div>
          {operationNav.map(renderNavItem)}

          <div className={styles.sectionLabel}>Ferramentas</div>
          {toolsNav.map(renderNavItem)}

          {isAdmin && (
            <>
              <div className={styles.sectionLabel}>Admin</div>
              {adminNav.map(renderNavItem)}
            </>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          {!collapsed && (
            <Link
              href={`/loja/${seller.shopSlug}`}
              target="_blank"
              className={styles.vitrineLink}
            >
              <I.external className={styles.vitrineIcon} />
              <span>Ver vitrine pública</span>
            </Link>
          )}
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>{initials}</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{seller.name}</div>
              <div className={styles.userMeta}>{planLabel}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className={styles.logoutBtn}
              aria-label="Sair"
            >
              {loggingOut ? (
                <I.spinner className="" />
              ) : (
                <I.logout className="" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className={styles.menuBtn}
            aria-label="Abrir menu"
          >
            <I.menu className="" />
          </button>

          <nav aria-label="Breadcrumb" className={styles.crumbs}>
            <Link href="/painel" className={styles.crumbHome}>
              Painel
            </Link>
            {crumbSegments.map((seg, i) => {
              const isLast = i === crumbSegments.length - 1;
              return (
                <span key={`${seg}-${i}`} className={styles.crumbSeg}>
                  <span className={styles.crumbSep}>/</span>{" "}
                  <span
                    className={isLast ? styles.crumbCurrent : ""}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {seg.charAt(0).toUpperCase() + seg.slice(1)}
                  </span>
                </span>
              );
            })}
          </nav>

          <div className={styles.topbarSpacer} />

          <Link
            href={`/loja/${seller.shopSlug}`}
            target="_blank"
            className={styles.topbarLink}
          >
            <I.external className={styles.topbarLinkIcon} />
            Vitrine
          </Link>
        </header>

        <main className={styles.content}>{children}</main>
      </div>

      <nav className={styles.mobileNav} aria-label="Navegação rápida">
        <div className={styles.mobileNavRow}>
          {mobileNav.map((item) => {
            const active = isActive(item);
            const showBadge = item.href === "/painel/pedidos" && pendingOrders > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.mobileNavItem} ${active ? styles.mobileNavActive : ""}`}
              >
                <item.icon className={styles.mobileNavIcon} />
                <span className={styles.mobileNavLabel}>{item.label}</span>
                {showBadge && (
                  <span className={styles.mobileNavBadge}>
                    {pendingOrders > 9 ? "9+" : pendingOrders}
                  </span>
                )}
                {active && <span className={styles.mobileNavDot} />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
