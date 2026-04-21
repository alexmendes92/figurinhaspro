import { Bebas_Neue, Manrope } from "next/font/google";
import { redirect } from "next/navigation";
import PainelShell from "@/components/painel/painel-shell";
import { isAdmin } from "@/lib/admin";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const seller = await getSession();

  if (!seller) {
    redirect("/login");
  }

  if (seller.onboardingStep < 4) {
    redirect("/onboarding");
  }

  const pendingOrders = await db.order.count({
    where: { sellerId: seller.id, status: "QUOTE" },
  });

  return (
    <div className={`${bebas.variable} ${manrope.variable}`}>
      <PainelShell
        seller={{
          id: seller.id,
          name: seller.name,
          shopName: seller.shopName,
          shopSlug: seller.shopSlug,
          plan: seller.plan,
        }}
        pendingOrders={pendingOrders}
        isAdmin={isAdmin(seller.email)}
      >
        {children}
      </PainelShell>
    </div>
  );
}
