"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import styles from "./painel-shell.module.css";
import { MobileNav } from "./shell/mobile-nav";
import type { NavItem } from "./shell/nav-types";
import { Sidebar } from "./shell/sidebar";
import { TopBar } from "./shell/topbar";

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
  toolsNav[1],
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  async function confirmLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className={styles.root}>
      <Sidebar
        seller={seller}
        pathname={pathname}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        pendingOrders={pendingOrders}
        isAdmin={isAdmin}
        operationNav={operationNav}
        toolsNav={toolsNav}
        adminNav={adminNav}
        initials={initials}
        planLabel={planLabel}
        loggingOut={loggingOut}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={() => setShowLogoutConfirm(true)}
      />

      {mobileOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={styles.main}>
        <TopBar
          pathname={pathname}
          shopSlug={seller.shopSlug}
          onOpenMenu={() => setMobileOpen(true)}
        />
        <main className={styles.content}>{children}</main>
      </div>

      <MobileNav items={mobileNav} pathname={pathname} pendingOrders={pendingOrders} />

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Confirmar saída"
        description="Deseja sair da sua conta?"
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
