import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import PainelShell from "@/components/painel/painel-shell";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
  );
}
