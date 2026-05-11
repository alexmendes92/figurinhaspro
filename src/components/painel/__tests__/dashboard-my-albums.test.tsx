// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DashboardMyAlbums, {
  type MyAlbumItem,
} from "@/components/painel/dashboard-my-albums";

const albumIncompleto: MyAlbumItem = {
  slug: "panini_fifa_world_cup_2022",
  title: "Copa do Mundo Qatar 2022",
  year: "2022",
  flag: "🏆",
  totalStickers: 670,
  inStock: 134,
  totalUnits: 200,
  isComplete: false,
};

const albumCompleto: MyAlbumItem = {
  slug: "custom_meu_album",
  title: "Meu Álbum",
  year: "",
  flag: "",
  totalStickers: 50,
  inStock: 50,
  totalUnits: 75,
  isComplete: true,
};

describe("DashboardMyAlbums", () => {
  it("mostra empty state quando lista esta vazia", () => {
    render(<DashboardMyAlbums albums={[]} />);
    expect(screen.getByText(/ainda nao criou albuns/i)).toBeInTheDocument();
  });

  it("nao renderiza nada se lista esta vazia e showEmpty=false", () => {
    const { container } = render(<DashboardMyAlbums albums={[]} showEmpty={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renderiza um card por album quando lista nao esta vazia", () => {
    render(<DashboardMyAlbums albums={[albumIncompleto, albumCompleto]} />);
    expect(screen.getByText("Copa do Mundo Qatar 2022")).toBeInTheDocument();
    expect(screen.getByText("Meu Álbum")).toBeInTheDocument();
  });

  it("album completo mostra badge 1x completo", () => {
    render(<DashboardMyAlbums albums={[albumCompleto]} />);
    expect(screen.getByText("1x")).toBeInTheDocument();
    expect(screen.getByText("completo")).toBeInTheDocument();
  });

  it("album incompleto nao mostra badge completo", () => {
    render(<DashboardMyAlbums albums={[albumIncompleto]} />);
    expect(screen.queryByText("1x")).not.toBeInTheDocument();
  });

  it("mostra titulo da secao Meus albuns", () => {
    render(<DashboardMyAlbums albums={[albumIncompleto]} />);
    expect(screen.getByText(/meus albuns/i)).toBeInTheDocument();
  });
});
