import { notFound } from "next/navigation";
import { albums } from "@/lib/albums-data";
import AlbumViewer from "./album-viewer";

type Props = {
  params: Promise<{ year: string }>;
};

export async function generateStaticParams() {
  return albums.map((album) => ({ year: String(album.year) }));
}

export async function generateMetadata({ params }: Props) {
  const { year } = await params;
  const album = albums.find((a) => String(a.year) === year);
  if (!album) return {};
  return {
    title: `Panini World Cup ${album.year} — ${album.host}`,
    description: `Álbum digital completo da Copa do Mundo ${album.year} (${album.host}) — ${album.pageCount} páginas`,
  };
}

export default async function AlbumPage({ params }: Props) {
  const { year } = await params;
  const albumIndex = albums.findIndex((a) => String(a.year) === year);
  if (albumIndex === -1) notFound();

  const album = albums[albumIndex];
  const prevYear = albumIndex > 0 ? albums[albumIndex - 1].year : null;
  const nextYear = albumIndex < albums.length - 1 ? albums[albumIndex + 1].year : null;
  const allYears = albums.map((a) => a.year);

  return (
    <AlbumViewer
      year={album.year}
      host={album.host}
      pages={album.pages}
      prevYear={prevYear}
      nextYear={nextYear}
      allYears={allYears}
    />
  );
}
