import { getSession } from "@/lib/auth";
import PedidosClient from "./pedidos-client";

export default async function PedidosPage() {
  const seller = await getSession();
  if (!seller) return null;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://album-digital-ashen.vercel.app";
  const shopUrl = `${baseUrl}/loja/${seller.shopSlug}`;

  return <PedidosClient shopUrl={shopUrl} />;
}
