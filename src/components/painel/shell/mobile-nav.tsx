"use client";

import Link from "next/link";
import styles from "../painel-shell.module.css";
import type { NavItem } from "./nav-types";

interface MobileNavProps {
  items: NavItem[];
  pathname: string;
  pendingOrders: number;
}

function isActive(item: NavItem, pathname: string): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export function MobileNav({ items, pathname, pendingOrders }: MobileNavProps) {
  return (
    <nav className={styles.mobileNav} aria-label="Navegação rápida">
      <div className={styles.mobileNavRow}>
        {items.map((item) => {
          const active = isActive(item, pathname);
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
  );
}
