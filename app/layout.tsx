import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { CartProvider } from "@/lib/cart-context";
import { ToastProvider } from "@/lib/toast-context";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const UMAMI_WEBSITE_ID =
  process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? "946ed723-8d29-41c5-84a1-49fdcc13d0c0";
const UMAMI_SRC =
  process.env.NEXT_PUBLIC_UMAMI_SRC ?? "https://analytics.arenacards.com.br/script.js";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0e14",
};

export const metadata: Metadata = {
  title: "FigurinhasPro — Plataforma #1 para revendedores de figurinhas",
  description:
    "Gerencie estoque, preços e pedidos de figurinhas avulsas. Vitrine online, orçamentos via WhatsApp e 13 Copas do Mundo catalogadas. Comece grátis.",
  keywords: [
    "figurinhas panini",
    "vender figurinhas",
    "estoque figurinhas",
    "figurinhas avulsas",
    "copa do mundo 2026",
    "album panini",
    "revenda figurinhas",
  ],
  openGraph: {
    title: "FigurinhasPro — Venda figurinhas como um profissional",
    description:
      "Estoque visual, preços customizados, vitrine online e orçamentos via WhatsApp. A plataforma feita para quem vende figurinhas avulsas.",
    type: "website",
    locale: "pt_BR",
    siteName: "FigurinhasPro",
  },
  twitter: {
    card: "summary_large_image",
    title: "FigurinhasPro — Plataforma para revendedores de figurinhas",
    description:
      "Gerencie estoque, preços e pedidos. Copa 2026 chegando — prepare-se agora.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <ToastProvider>{children}</ToastProvider>
        </CartProvider>
        <Analytics />
        <SpeedInsights />
        {UMAMI_WEBSITE_ID && (
          <Script
            async
            defer
            strategy="afterInteractive"
            src={UMAMI_SRC}
            data-website-id={UMAMI_WEBSITE_ID}
          />
        )}
      </body>
    </html>
  );
}
