"use client";

import Link from "next/link";
import styles from "../painel-shell.module.css";
import type { NavItem } from "./nav-types";

interface SidebarSeller {
  name: string;
  shopName: string;
  shopSlug: string;
  plan: string;
}

interface SidebarProps {
  seller: SidebarSeller;
  pathname: string;
  collapsed: boolean;
  mobileOpen: boolean;
  pendingOrders: number;
  isAdmin: boolean;
  operationNav: NavItem[];
  toolsNav: NavItem[];
  adminNav: NavItem[];
  initials: string;
  planLabel: string;
  loggingOut: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

function IconExternal({ className }: { className?: string }) {
  return (
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
  );
}

function IconLogout() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
      <path d="M4 12a8 8 0 018-8" fill="currentColor" opacity="0.75" />
    </svg>
  );
}

function isActive(item: NavItem, pathname: string): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export function Sidebar({
  seller,
  pathname,
  collapsed,
  mobileOpen,
  pendingOrders,
  isAdmin,
  operationNav,
  toolsNav,
  adminNav,
  initials,
  planLabel,
  loggingOut,
  onCloseMobile,
  onLogout,
}: SidebarProps) {
  const sidebarClass = [
    styles.sidebar,
    collapsed ? styles.sidebarNarrow : "",
    mobileOpen ? styles.sidebarOpen : "",
  ]
    .filter(Boolean)
    .join(" ");

  function renderNavItem(item: NavItem) {
    const active = isActive(item, pathname);
    const showBadge = item.href === "/painel/pedidos" && pendingOrders > 0;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onCloseMobile}
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

  return (
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
            <IconExternal className={styles.vitrineIcon} />
            <span>Ver vitrine pública</span>
          </Link>
        )}
        <div className={styles.userCard}>
          <div className={styles.userAvatar}>{initials}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{seller.name}</div>
            {seller.plan === "FREE" ? (
              <Link href="/painel/planos" className={styles.userMeta}>
                {planLabel} • ver planos
              </Link>
            ) : (
              <div className={styles.userMeta}>{planLabel}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className={styles.logoutBtn}
            aria-label="Sair"
          >
            {loggingOut ? <IconSpinner /> : <IconLogout />}
          </button>
        </div>
      </div>
    </aside>
  );
}
