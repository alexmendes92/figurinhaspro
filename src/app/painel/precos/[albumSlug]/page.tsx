import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { albums } from "@/lib/albums";
import { customAlbumToAlbum } from "@/lib/custom-albums";
import { db } from "@/lib/db";
import Link from "next/link";
import PrecosAlbumEditor from "@/components/painel/precos-album-editor";
import type { Album } from "@/lib/albums";

export default async function PrecosAlbumPage({
  params,
}: {
  params: Promise<{ albumSlug: string }>;
}) {
  const seller = await getSession();
  if (!seller) return null;

  const { albumSlug } = await params;

  // Busca álbum (estático ou customizado)
  let album: Album | undefined = albums.find((a) => a.slug === albumSlug);
  if (!album) {
    const custom = await db.customAlbum.findUnique({
      where: { sellerId_slug: { sellerId: seller.id, slug: albumSlug } },
    });
    if (custom) album = customAlbumToAlbum(custom);
  }
  if (!album) notFound();

  // Extrai nomes das seções do álbum (server-only, não envia albums.ts inteiro ao client)
  const sectionNames = album.sections.map((s) => s.name);

  return (
    <div className="slide-up">
      {/* Breadcrumb */}
      <div className="px-4 sm:px-6 lg:px-8 pt-4">
        <Link
          href="/painel/precos"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Preços
        </Link>
      </div>

      <PrecosAlbumEditor
        albumSlug={album.slug}
        albumTitle={album.title}
        albumYear={album.year}
        albumFlag={album.flag}
        sectionNames={sectionNames}
      />
    </div>
  );
}
