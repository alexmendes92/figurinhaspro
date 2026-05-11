// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DashboardQuickActions from "@/components/painel/dashboard-quick-actions";

describe("DashboardQuickActions", () => {
  it("renderiza os 5 botoes esperados", () => {
    render(<DashboardQuickActions storeUrl="/loja/fernandos" />);
    expect(screen.getByText("Scanner")).toBeInTheDocument();
    expect(screen.getByText("Colar WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Marcar figurinha")).toBeInTheDocument();
    expect(screen.getByText("Criar album")).toBeInTheDocument();
    expect(screen.getByText("Ver vitrine")).toBeInTheDocument();
  });

  it("Scanner mantem badge em breve", () => {
    render(<DashboardQuickActions storeUrl="/loja/fernandos" />);
    expect(screen.getByText("em breve")).toBeInTheDocument();
  });

  it("Ver vitrine abre em nova aba com rel noopener", () => {
    render(<DashboardQuickActions storeUrl="/loja/fernandos" />);
    const link = screen.getByText("Ver vitrine").closest("a");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link?.getAttribute("rel") ?? "").toContain("noopener");
    expect(link).toHaveAttribute("href", "/loja/fernandos");
  });

  it("Criar album aponta para /painel/estoque/novo", () => {
    render(<DashboardQuickActions storeUrl="/loja/fernandos" />);
    const link = screen.getByText("Criar album").closest("a");
    expect(link).toHaveAttribute("href", "/painel/estoque/novo");
  });
});
