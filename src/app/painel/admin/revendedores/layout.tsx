import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";

export default async function RevendedoresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const seller = await getSession();
  if (!seller || !isAdmin(seller.email)) {
    redirect("/painel");
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Admin — Revendedores</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestao centralizada de todos os revendedores da plataforma
        </p>
      </div>
      <div>{children}</div>
    </div>
  );
}
