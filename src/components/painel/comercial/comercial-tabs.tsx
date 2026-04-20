"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/painel/comercial", label: "Dashboard", exact: true },
  { href: "/painel/comercial/leads", label: "Leads" },
  { href: "/painel/comercial/tarefas", label: "Tarefas" },
  { href: "/painel/comercial/ofertas", label: "Ofertas" },
  { href: "/painel/comercial/experimentos", label: "Experimentos" },
  { href: "/painel/comercial/iniciativas", label: "Iniciativas" },
  { href: "/painel/comercial/kpis", label: "KPIs" },
];

export function ComercialTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-white/[0.06] pb-px -mb-px scrollbar-none">
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 py-2 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors ${
              active
                ? "text-amber-400 border-amber-400"
                : "text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-600"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
