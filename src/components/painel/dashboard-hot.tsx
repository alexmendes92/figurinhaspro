import { Spark } from "./spark";

export interface HotItem {
  albumSlug: string;
  stickerCode: string;
  stickerName: string;
  sales: number;
  values: number[];
}

export function DashboardHot({ items }: { items: HotItem[] }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#0f1219] p-5 min-h-[280px] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            className="w-5 h-5 text-gray-500"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L4 14h7l-1 8 9-12h-7z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-white">Sem vendas nas últimas 48h</p>
        <p className="text-[11px] text-gray-500 mt-1">Compartilhe sua vitrine para aparecer aqui</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0f1219] p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] text-amber-400/70 font-semibold uppercase tracking-wider">
            Tendências 48h
          </p>
          <p className="text-base font-bold text-white mt-0.5">Em alta agora</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={`${item.albumSlug}-${item.stickerCode}`} className="flex items-center gap-3">
            <div className="w-9 h-11 rounded-md bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/10 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold font-[family-name:var(--font-geist-mono)] text-amber-400">
                {item.stickerCode.slice(0, 3)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white truncate">{item.stickerName}</p>
              <p className="text-[11px] text-gray-500 truncate">
                {item.sales} {item.sales === 1 ? "venda" : "vendas"} nas últimas 48h
              </p>
            </div>
            <Spark values={item.values} color="#34d399" width={64} height={22} />
          </div>
        ))}
      </div>
    </div>
  );
}
