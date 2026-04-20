export default function DashboardLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Saudação */}
      <div className="mb-8">
        <div className="h-4 w-32 rounded-lg bg-zinc-800 shimmer" />
        <div className="h-9 w-48 rounded-lg bg-zinc-800 shimmer mt-2" />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-[#0f1219] border border-white/[0.06] p-5 h-[120px] shimmer"
          />
        ))}
      </div>

      {/* Vitrine + Ações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2 rounded-2xl bg-[#0f1219] border border-white/[0.06] p-5 h-[140px] shimmer" />
        <div className="rounded-2xl bg-[#0f1219] border border-white/[0.06] p-5 h-[140px] shimmer" />
      </div>

      {/* Pedidos recentes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-32 rounded-lg bg-zinc-800 shimmer" />
          <div className="h-3 w-20 rounded-lg bg-zinc-800 shimmer" />
        </div>
        <div className="rounded-2xl bg-[#0f1219] border border-white/[0.06] overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`px-5 py-4 h-[68px] shimmer ${i > 1 ? "border-t border-white/[0.04]" : ""}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
