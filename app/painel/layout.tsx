import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
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

  return (
    <PainelShell
      seller={{
        id: seller.id,
        name: seller.name,
        shopName: seller.shopName,
        shopSlug: seller.shopSlug,
        plan: seller.plan,
      }}
    >
      {children}
    </PainelShell>
  );
}
