"use client";

import Link from "next/link";
import { formatCrumbSegment } from "@/lib/format-breadcrumb";
import styles from "../painel-shell.module.css";

interface TopBarProps {
  pathname: string;
  shopSlug: string;
  onOpenMenu: () => void;
}

function IconMenu() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
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

export function TopBar({ pathname, shopSlug, onOpenMenu }: TopBarProps) {
  const crumbSegments = pathname.replace("/painel", "").split("/").filter(Boolean);

  return (
    <header className={styles.topbar}>
      <button
        type="button"
        onClick={onOpenMenu}
        className={styles.menuBtn}
        aria-label="Abrir menu"
      >
        <IconMenu />
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
                {formatCrumbSegment(seg)}
              </span>
            </span>
          );
        })}
      </nav>

      <div className={styles.topbarSpacer} />

      <Link href={`/loja/${shopSlug}`} target="_blank" className={styles.topbarLink}>
        <IconExternal className={styles.topbarLinkIcon} />
        Vitrine
      </Link>
    </header>
  );
}
