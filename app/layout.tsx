import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import { ToastProvider } from "@/lib/toast-context";
import "./globals.css";

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
  maximumScale: 1,
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
      </body>
    </html>
  );
}
