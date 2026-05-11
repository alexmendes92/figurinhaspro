import Link from "next/link";
import AlbumStatsCard from "@/components/painel/album-stats-card";
import { calculateAlbumCoverage } from "@/lib/album-helpers";

export interface MyAlbumItem {
  slug: string;
  title: string;
  year: string;
  flag: string;
  totalStickers: number;
  inStock: number;
  totalUnits: number;
  isComplete: boolean;
}

interface Props {
  albums: MyAlbumItem[];
  showEmpty?: boolean;
}

export default function DashboardMyAlbums({ albums, showEmpty = true }: Props) {
  if (albums.length === 0) {
    if (!showEmpty) return null;
    return (
      <section className="rounded-2xl border border-white/[0.06] bg-card-elevated p-5 min-h-[200px] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-3">
          <svg
            className="w-5 h-5 text-accent-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
        </div>
        <p className="text-sm font-semibold text-white">Voce ainda nao criou albuns</p>
        <p className="text-[11px] text-gray-500 mt-1 mb-3">
          Crie seu primeiro album para comecar a vender
        </p>
        <Link
          href="/painel/estoque/novo"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 text-black text-xs font-bold transition-all shadow-lg shadow-accent-500/20"
        >
          Criar album
        </Link>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-[10px] text-accent-400/70 font-semibold uppercase tracking-wider">
            Meus albuns
          </p>
          <p className="text-base font-bold text-white mt-0.5">
            {albums.length} {albums.length === 1 ? "album ativo" : "albuns ativos"}
          </p>
        </div>
        <Link
          href="/painel/estoque"
          className="text-[11px] text-gray-500 hover:text-accent-400 transition-colors"
        >
          Ver estoque →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {albums.map((a) => {
          const { percent } = calculateAlbumCoverage(a.inStock, a.totalStickers);
          return (
            <AlbumStatsCard
              key={a.slug}
              albumSlug={a.slug}
              albumTitle={a.title}
              albumYear={a.year}
              albumFlag={a.flag}
              isCustom={a.slug.startsWith("custom_")}
              totalStickers={a.totalStickers}
              inStock={a.inStock}
              totalUnits={a.totalUnits}
              coveragePercent={percent}
              completedAlbums={a.isComplete ? 1 : 0}
              blockers={[]}
            />
          );
        })}
      </div>
    </section>
  );
}
