import { albums } from "@/lib/albums";
import { getSession } from "@/lib/auth";
import { customAlbumToAlbum } from "@/lib/custom-albums";
import { db } from "@/lib/db";
import ImportForm from "./import-form";

export default async function BulkImportPage() {
  const seller = await getSession();
  if (!seller) return null;

  const customAlbumsDb = await db.customAlbum.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
  });
  
  const customAlbumsList = customAlbumsDb.map(customAlbumToAlbum);
  
  const sortedStaticAlbums = [...albums].sort(
    (a, b) => Number.parseInt(b.year, 10) - Number.parseInt(a.year, 10)
  );
  
  const allAlbums = [...sortedStaticAlbums, ...customAlbumsList];

  const albumOptions = allAlbums.map(a => ({
    slug: a.slug,
    title: a.title || `Copa ${a.year}`
  }));

  return <ImportForm albums={albumOptions} />;
}
