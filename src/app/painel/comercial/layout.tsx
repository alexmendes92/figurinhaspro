import { redirect } from "next/navigation";
import { ComercialTabs } from "@/components/painel/comercial/comercial-tabs";
import { isAdmin } from "@/lib/admin";
import { getSession } from "@/lib/auth";

export default async function ComercialLayout({ children }: { children: React.ReactNode }) {
  const seller = await getSession();
  if (!seller || !isAdmin(seller.email)) {
    redirect("/painel");
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Cockpit Comercial</h1>
        <p className="text-sm text-gray-500 mt-1">
          Operacao, metricas e lancamento do FigurinhasPro
        </p>
      </div>
      <ComercialTabs />
      <div className="mt-6">{children}</div>
    </div>
  );
}
