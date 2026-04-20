"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import CartDrawer from "@/components/cart-drawer";
import StickerPanel from "@/components/sticker-panel";
import { useCart } from "@/lib/cart-context";
import { imgUrl } from "@/lib/images";

type AlbumViewerProps = {
  year: number;
  host: string;
  pages: readonly string[];
  prevYear: number | null;
  nextYear: number | null;
  allYears: readonly number[];
};

// ─── Lupa interativa ───
function Magnifier({
  src,
  containerRef,
  zoom = 2.5,
  size = 180,
}: {
  src: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  zoom?: number;
  size?: number;
}) {
  const [pos, setPos] = useState({ x: 0, y: 0, bgX: 0, bgY: 0, visible: false });
  const _imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        setPos((p) => ({ ...p, visible: false }));
        return;
      }

      // Posição relativa em percentual
      const pctX = (x / rect.width) * 100;
      const pctY = (y / rect.height) * 100;

      setPos({
        x: e.clientX,
        y: e.clientY,
        bgX: pctX,
        bgY: pctY,
        visible: true,
      });
    };

    const handleLeave = () => setPos((p) => ({ ...p, visible: false }));

    container.addEventListener("mousemove", handleMove);
    container.addEventListener("mouseleave", handleLeave);
    return () => {
      container.removeEventListener("mousemove", handleMove);
      container.removeEventListener("mouseleave", handleLeave);
    };
  }, [containerRef]);

  if (!pos.visible) return null;

  return (
    <div
      className="fixed pointer-events-none z-[300]"
      style={{
        left: pos.x - size / 2,
        top: pos.y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        border: "3px solid rgba(245, 158, 11, 0.6)",
        boxShadow:
          "0 0 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(245, 158, 11, 0.2)",
        overflow: "hidden",
        backgroundImage: `url(${src})`,
        backgroundSize: `${zoom * 100}%`,
        backgroundPosition: `${pos.bgX}% ${pos.bgY}%`,
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Reflexo de vidro na lupa */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.15), transparent 60%)",
        }}
      />
      {/* Crosshair central */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3 h-[1px] bg-amber-500/30" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-3 w-[1px] bg-amber-500/30" />
      </div>
    </div>
  );
}

// ─── Componente Principal ───
export default function AlbumViewer({
  year,
  host,
  pages,
  prevYear,
  nextYear,
  allYears,
}: AlbumViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipProgress, setFlipProgress] = useState(0); // 0 a 1
  const [flipDir, setFlipDir] = useState<"next" | "prev">("next");
  const [magnifierActive, setMagnifierActive] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);
  const [stickerPanelOpen, setStickerPanelOpen] = useState(false);

  const { totalItems, setIsOpen: setCartOpen } = useCart();

  const bookRef = useRef<HTMLDivElement>(null);
  const leftPageRef = useRef<HTMLDivElement>(null);
  const rightPageRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Organizar em spreads
  const spreads: Array<[string, string | null]> = [];
  spreads.push([pages[0], null]); // capa
  for (let i = 1; i < pages.length; i += 2) {
    spreads.push([pages[i], pages[i + 1] ?? null]);
  }
  const totalSpreads = spreads.length;

  const getPageLabel = (path: string) => {
    const filename = path.split("/").pop() || "";
    return (
      filename
        .replace(/^\d+_/, "")
        .replace(/Panini-World-Cup-\d+-?/, "")
        .replace(/\.webp$|\.jpg$|\.png$/i, "")
        .replace(/-/g, " ")
        .trim() || "Capa"
    );
  };

  // Animação de flip com requestAnimationFrame
  const flipTo = useCallback(
    (targetPage: number, dir: "next" | "prev") => {
      if (isFlipping || targetPage < 0 || targetPage >= totalSpreads) return;
      setIsFlipping(true);
      setFlipDir(dir);

      let start: number | null = null;
      const duration = 600;

      const animate = (ts: number) => {
        if (!start) start = ts;
        const elapsed = ts - start;
        const progress = Math.min(elapsed / duration, 1);
        // Easing: ease-in-out
        const eased = progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;
        setFlipProgress(eased);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCurrentPage(targetPage);
          setFlipProgress(0);
          setIsFlipping(false);
        }
      };
      requestAnimationFrame(animate);
    },
    [isFlipping, totalSpreads]
  );

  const goNext = useCallback(() => flipTo(currentPage + 1, "next"), [currentPage, flipTo]);
  const goPrev = useCallback(() => flipTo(currentPage - 1, "prev"), [currentPage, flipTo]);

  // Auto-play
  useEffect(() => {
    if (autoPlay) {
      autoPlayRef.current = setInterval(() => {
        setCurrentPage((prev) => {
          if (prev >= totalSpreads - 1) {
            setAutoPlay(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [autoPlay, totalSpreads]);

  // Teclado
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Home") {
        setCurrentPage(0);
      } else if (e.key === "End") {
        setCurrentPage(totalSpreads - 1);
      } else if (e.key === "m") setMagnifierActive((v) => !v);
      else if (e.key === "h") setShowUI((v) => !v);
      else if (e.key === "p") setAutoPlay((v) => !v);
      else if (e.key === "n") setShowMinimap((v) => !v);
      else if (e.key === "s") setStickerPanelOpen((v) => !v);
      else if (e.key === "c") setCartOpen(true);
      else if (e.key === "Escape") {
        setMagnifierActive(false);
        setShowMinimap(false);
        setAutoPlay(false);
        setStickerPanelOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, totalSpreads, setCartOpen]);

  // Swipe
  useEffect(() => {
    const el = bookRef.current;
    if (!el) return;
    let startX = 0;
    let startY = 0;
    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onEnd = (e: TouchEvent) => {
      const dx = startX - e.changedTouches[0].clientX;
      const dy = Math.abs(startY - e.changedTouches[0].clientY);
      if (Math.abs(dx) > 60 && dy < 100) {
        if (dx > 0) goNext();
        else goPrev();
      }
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
    };
  }, [goNext, goPrev]);

  const currentLeft = spreads[currentPage]?.[0];
  const currentRight = spreads[currentPage]?.[1];
  const isCover = currentPage === 0;
  const progress = ((currentPage + 1) / totalSpreads) * 100;

  // Calcular página que está sendo virada (para mostrar durante animação)
  const flipTargetPage = flipDir === "next" ? currentPage + 1 : currentPage - 1;
  const flipTarget =
    flipTargetPage >= 0 && flipTargetPage < totalSpreads ? spreads[flipTargetPage] : null;

  // Ângulo da página durante o flip
  const flipAngle = flipDir === "next" ? flipProgress * 180 : -flipProgress * 180;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#040406] relative select-none">
      {/* ─── Fundo ambiente ─── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Spotlight no livro */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.03)_0%,transparent_70%)]" />
        {/* Vinheta */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)]" />
        {/* Textura sutil */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/* ─── Header (oculta em modo cinema) ─── */}
      {showUI && (
        <header className="relative z-40 shrink-0 bg-transparent">
          <div className="max-w-7xl mx-auto px-4 h-11 flex items-center justify-between">
            <Link
              href="/albuns"
              className="flex items-center gap-2 text-zinc-600 hover:text-zinc-300 transition-colors text-xs"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Álbuns
            </Link>

            {/* Timeline */}
            <div className="flex items-center gap-0.5">
              {allYears.map((y) => (
                <Link
                  key={y}
                  href={`/albuns/${y}`}
                  className={`relative px-1.5 py-1 rounded text-[10px] font-[family-name:var(--font-geist-mono)] transition-all ${
                    y === year ? "text-amber-400 font-bold" : "text-zinc-700 hover:text-zinc-400"
                  }`}
                >
                  {String(y).slice(2)}
                  {y === year && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500" />
                  )}
                </Link>
              ))}
            </div>

            {/* Controles */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMagnifierActive((v) => !v)}
                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all text-[10px] ${
                  magnifierActive
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    : "text-zinc-700 hover:text-zinc-400"
                }`}
                title="Lupa (M)"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                  />
                </svg>
              </button>
              <button
                onClick={() => setAutoPlay((v) => !v)}
                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                  autoPlay
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    : "text-zinc-700 hover:text-zinc-400"
                }`}
                title="Auto-play (P)"
              >
                {autoPlay ? (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
                    />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setShowMinimap((v) => !v)}
                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                  showMinimap
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    : "text-zinc-700 hover:text-zinc-400"
                }`}
                title="Minimap (N)"
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
                    d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                  />
                </svg>
              </button>
              {/* Botão figurinhas */}
              <button
                onClick={() => setStickerPanelOpen((v) => !v)}
                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all text-[10px] ${
                  stickerPanelOpen
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    : "text-zinc-700 hover:text-zinc-400"
                }`}
                title="Figurinhas (S)"
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
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                  />
                </svg>
              </button>
              {/* Botão carrinho com badge */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative w-7 h-7 rounded-md flex items-center justify-center text-zinc-700 hover:text-zinc-400 transition-all"
                title="Carrinho (C)"
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
                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full bg-amber-500 text-black text-[8px] font-bold flex items-center justify-center px-0.5">
                    {totalItems}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowUI(false)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-700 hover:text-zinc-400 transition-all"
                title="Modo cinema (H)"
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
                    d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                  />
                </svg>
              </button>
            </div>
          </div>
          {/* Barra de progresso */}
          <div className="h-[1px] bg-zinc-900/30">
            <div
              className="h-full bg-gradient-to-r from-amber-600/80 to-amber-400/80 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>
      )}

      {/* Botão para mostrar UI no modo cinema */}
      {!showUI && (
        <button
          onClick={() => setShowUI(true)}
          className="fixed top-3 right-3 z-50 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-zinc-500 hover:text-white transition-all opacity-0 hover:opacity-100"
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
              d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
            />
          </svg>
        </button>
      )}

      {/* ─── Área do livro ─── */}
      <main className="flex-1 flex items-center justify-center relative z-10 px-4" ref={bookRef}>
        {/* Seta esquerda */}
        <button
          onClick={goPrev}
          disabled={currentPage === 0 || isFlipping}
          className="absolute left-4 sm:left-8 z-20 w-12 h-12 rounded-full flex items-center justify-center text-zinc-700 hover:text-white disabled:opacity-0 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-white/0 group-hover:bg-white/5 flex items-center justify-center transition-all">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </div>
        </button>

        {/* ─── O livro ─── */}
        <div
          className="relative flex justify-center"
          style={{ perspective: "2500px", perspectiveOrigin: "center center" }}
        >
          {/* Sombra do livro na mesa */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-8 bg-[radial-gradient(ellipse,rgba(0,0,0,0.5)_0%,transparent_70%)] blur-sm" />

          <div
            className={`flex ${isCover ? "w-[420px] max-w-[90vw]" : "w-[900px] max-w-[95vw]"} transition-all duration-500`}
          >
            {/* ── Página Esquerda ── */}
            <div
              ref={leftPageRef}
              className={`relative bg-[#1a1a1a] overflow-hidden ${isCover ? "w-full rounded-xl" : "w-1/2 rounded-l-lg"} group`}
              style={{
                aspectRatio: "3/4",
                boxShadow: isCover
                  ? "0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)"
                  : "-8px 0 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02)",
                cursor: magnifierActive ? "none" : "default",
              }}
            >
              <Image
                src={imgUrl(currentLeft)}
                alt={getPageLabel(currentLeft)}
                fill
                className="object-contain"
                sizes={isCover ? "420px" : "450px"}
                priority
              />
              {/* Textura de papel envelhecido */}
              <div
                className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.04]"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
                }}
              />
              {/* Sombra da lombada (direita) */}
              {!isCover && (
                <div
                  className="absolute top-0 right-0 bottom-0 w-12 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to left, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 30%, transparent 100%)",
                  }}
                />
              )}
              {/* Label no hover */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur text-[10px] text-zinc-300 font-[family-name:var(--font-geist-mono)]">
                  {getPageLabel(currentLeft)}
                </span>
              </div>
            </div>

            {/* ── Lombada ── */}
            {!isCover && (
              <div
                className="w-[3px] bg-gradient-to-b from-zinc-800 via-zinc-700 to-zinc-800 shrink-0 relative z-10"
                style={{ boxShadow: "0 0 8px rgba(0,0,0,0.5)" }}
              />
            )}

            {/* ── Página Direita ── */}
            {!isCover && currentRight && (
              <div
                ref={rightPageRef}
                className="relative w-1/2 bg-[#1a1a1a] overflow-hidden rounded-r-lg group"
                style={{
                  aspectRatio: "3/4",
                  boxShadow: "8px 0 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02)",
                  cursor: magnifierActive ? "none" : "default",
                }}
              >
                <Image
                  src={imgUrl(currentRight)}
                  alt={getPageLabel(currentRight)}
                  fill
                  className="object-contain"
                  sizes="450px"
                />
                {/* Textura de papel */}
                <div
                  className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.04]"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
                  }}
                />
                {/* Sombra da lombada (esquerda) */}
                <div
                  className="absolute top-0 left-0 bottom-0 w-12 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to right, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 30%, transparent 100%)",
                  }}
                />
                {/* Label no hover */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur text-[10px] text-zinc-300 font-[family-name:var(--font-geist-mono)]">
                    {getPageLabel(currentRight)}
                  </span>
                </div>
              </div>
            )}

            {/* Página sem par (última ímpar) */}
            {!isCover && !currentRight && (
              <div
                className="relative w-1/2 rounded-r-lg"
                style={{
                  aspectRatio: "3/4",
                  background: "linear-gradient(135deg, #111 0%, #0a0a0a 100%)",
                  boxShadow: "8px 0 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02)",
                }}
              >
                {/* Página vazia com textura */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-zinc-800 text-xs italic">Fim do álbum</p>
                </div>
              </div>
            )}

            {/* ── Página virando (overlay animado) ── */}
            {isFlipping && flipTarget && (
              <div
                className="absolute top-0 right-0 h-full overflow-hidden pointer-events-none"
                style={{
                  width: isCover ? "100%" : "50%",
                  transformOrigin: "left center",
                  transform:
                    flipDir === "next"
                      ? `rotateY(${-flipAngle}deg)`
                      : `rotateY(${180 + flipAngle}deg)`,
                  zIndex: 30,
                  backfaceVisibility: "hidden",
                }}
              >
                <div className="relative w-full h-full bg-[#1a1a1a]">
                  <Image
                    src={imgUrl(
                      flipDir === "next" ? flipTarget[0] : flipTarget[1] || flipTarget[0]
                    )}
                    alt="Flipping page"
                    fill
                    className="object-contain"
                    sizes="450px"
                  />
                  {/* Sombra durante o flip */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to ${flipDir === "next" ? "right" : "left"}, rgba(0,0,0,${0.4 * flipProgress}), transparent)`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seta direita */}
        <button
          onClick={goNext}
          disabled={currentPage === totalSpreads - 1 || isFlipping}
          className="absolute right-4 sm:right-8 z-20 w-12 h-12 rounded-full flex items-center justify-center text-zinc-700 hover:text-white disabled:opacity-0 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-white/0 group-hover:bg-white/5 flex items-center justify-center transition-all">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </button>

        {/* Lupa */}
        {magnifierActive && currentLeft && (
          <Magnifier src={imgUrl(currentLeft)} containerRef={leftPageRef} zoom={3} size={200} />
        )}
        {magnifierActive && currentRight && rightPageRef.current && (
          <Magnifier src={imgUrl(currentRight)} containerRef={rightPageRef} zoom={3} size={200} />
        )}
      </main>

      {/* ─── Minimap ─── */}
      {showMinimap && showUI && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 bg-[#0a0a0c]/95 backdrop-blur-xl rounded-2xl border border-zinc-800/30 p-3 shadow-2xl shadow-black/50 max-w-[90vw]">
          <div
            className="flex items-center gap-1 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#27272a transparent" }}
          >
            {spreads.map((pair, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentPage(i);
                  setShowMinimap(false);
                }}
                className={`shrink-0 flex rounded-md overflow-hidden border transition-all hover:scale-105 ${
                  i === currentPage
                    ? "border-amber-500 shadow-md shadow-amber-500/20 ring-1 ring-amber-500/30"
                    : "border-zinc-800/40 hover:border-zinc-600 opacity-50 hover:opacity-100"
                }`}
                style={{ height: "56px" }}
              >
                <div className="relative h-full" style={{ width: i === 0 ? "42px" : "42px" }}>
                  <Image src={imgUrl(pair[0])} alt="" fill className="object-cover" sizes="42px" />
                </div>
                {pair[1] && i > 0 && (
                  <div className="relative h-full" style={{ width: "42px" }}>
                    <Image
                      src={imgUrl(pair[1])}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="42px"
                    />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Barra inferior ─── */}
      {showUI && (
        <footer className="relative z-40 shrink-0 bg-transparent px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            {/* Álbum anterior */}
            {prevYear ? (
              <Link
                href={`/albuns/${prevYear}`}
                className="flex items-center gap-1 text-zinc-700 hover:text-zinc-400 transition-colors text-[11px]"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
                <span className="font-[family-name:var(--font-geist-mono)]">{prevYear}</span>
              </Link>
            ) : (
              <div className="w-12" />
            )}

            {/* Info central */}
            <div className="flex items-center gap-4">
              <span className="text-amber-400/80 font-bold text-sm font-[family-name:var(--font-geist-mono)]">
                {year}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-700 font-[family-name:var(--font-geist-mono)]">
                  {isCover ? "Capa" : `${currentPage * 2}–${currentPage * 2 + 1}`}
                </span>
                <div className="w-32 h-1 rounded-full bg-zinc-900 overflow-hidden">
                  <div
                    className="h-full bg-amber-500/60 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-700 font-[family-name:var(--font-geist-mono)]">
                  {pages.length}
                </span>
              </div>
              <span className="text-[10px] text-zinc-800">{host}</span>
            </div>

            {/* Próximo álbum */}
            {nextYear ? (
              <Link
                href={`/albuns/${nextYear}`}
                className="flex items-center gap-1 text-zinc-700 hover:text-zinc-400 transition-colors text-[11px]"
              >
                <span className="font-[family-name:var(--font-geist-mono)]">{nextYear}</span>
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </Link>
            ) : (
              <div className="w-12" />
            )}
          </div>

          {/* Atalhos */}
          <div className="text-center mt-1">
            <p className="text-[9px] text-zinc-800 font-[family-name:var(--font-geist-mono)] tracking-wide">
              <kbd className="px-1 py-0.5 rounded bg-zinc-900/50 text-zinc-700">←→</kbd> virar
              <span className="text-zinc-900 mx-1.5">·</span>
              <kbd className="px-1 py-0.5 rounded bg-zinc-900/50 text-zinc-700">M</kbd> lupa
              <span className="text-zinc-900 mx-1.5">·</span>
              <kbd className="px-1 py-0.5 rounded bg-zinc-900/50 text-zinc-700">P</kbd> auto
              <span className="text-zinc-900 mx-1.5">·</span>
              <kbd className="px-1 py-0.5 rounded bg-zinc-900/50 text-zinc-700">N</kbd> mapa
              <span className="text-zinc-900 mx-1.5">·</span>
              <kbd className="px-1 py-0.5 rounded bg-zinc-900/50 text-zinc-700">H</kbd> cinema
              <span className="text-zinc-900 mx-1.5">·</span>
              <kbd className="px-1 py-0.5 rounded bg-zinc-900/50 text-zinc-700">S</kbd> figurinhas
              <span className="text-zinc-900 mx-1.5">·</span>
              <kbd className="px-1 py-0.5 rounded bg-zinc-900/50 text-zinc-700">C</kbd> carrinho
            </p>
          </div>
        </footer>
      )}

      {/* ─── Painel de Figurinhas ─── */}
      <StickerPanel
        isOpen={stickerPanelOpen}
        onClose={() => setStickerPanelOpen(false)}
        pagePath={currentLeft}
        albumYear={year}
      />

      {/* ─── Carrinho ─── */}
      <CartDrawer />

      {/* ─── Botão flutuante do carrinho (visível em modo cinema) ─── */}
      {!showUI && totalItems > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 hover:bg-amber-400 transition-all hover:scale-105 active:scale-95"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full bg-black text-amber-400 text-[10px] font-bold flex items-center justify-center px-1 border-2 border-amber-500">
            {totalItems}
          </span>
        </button>
      )}
    </div>
  );
}
