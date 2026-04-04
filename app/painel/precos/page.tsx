import { getSession } from "@/lib/auth";
import { albums } from "@/lib/albums";
import PrecosEditor from "@/components/painel/precos-editor";

export default async function PrecosPage() {
  const seller = await getSession();
  if (!seller) return null;

  // Passa só metadados leves pro client — albums.ts tem 1.4MB
  const albumList = albums.map((a) => ({
    slug: a.slug,
    year: a.year,
    flag: a.flag,
  }));

  return <PrecosEditor sellerPlan={seller.plan} albumList={albumList} />;
}
