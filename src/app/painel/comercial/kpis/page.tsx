import { db } from "@/lib/db";
import { addKpiSnapshot } from "../actions";

const UNIT_FORMAT: Record<string, (v: number) => string> = {
  COUNT: (v) => v.toFixed(0),
  CURRENCY: (v) => `R$ ${v.toFixed(0)}`,
  PERCENT: (v) => `${v.toFixed(1)}%`,
  DAYS: (v) => `${v.toFixed(0)}d`,
};

const CATEGORY_COLOR: Record<string, string> = {
  REVENUE: "border-emerald-500/30",
  GROWTH: "border-blue-500/30",
  CONVERSION: "border-amber-500/30",
  ENGAGEMENT: "border-violet-500/30",
  COST: "border-red-500/30",
};

const inputClass =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-500/40 focus:outline-none";

export default async function KpisPage() {
  const kpis = await db.bizKpi.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: {
      snapshots: {
        orderBy: { recordedAt: "desc" },
        take: 10,
      },
    },
  });

  // Group by category
  const categories = new Map<string, typeof kpis>();
  for (const kpi of kpis) {
    const cat = kpi.category;
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(kpi);
  }

  return (
    <div className="space-y-6">
      {kpis.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">
            Nenhum KPI configurado. Use o botao &quot;Popular dados iniciais&quot; no
            Dashboard.
          </p>
        </div>
      ) : (
        Array.from(categories.entries()).map(([category, categoryKpis]) => (
          <div key={category}>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              {category}
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoryKpis.map((kpi) => {
                const fmt = UNIT_FORMAT[kpi.unit] || UNIT_FORMAT.COUNT;
                const latest = kpi.snapshots[0];
                const previous = kpi.snapshots[1];
                const currentValue = latest?.value ?? kpi.baseline ?? 0;
                const delta =
                  latest && previous
                    ? latest.value - previous.value
                    : null;
                const progressPct =
                  kpi.target && kpi.baseline !== null
                    ? Math.min(
                        100,
                        Math.max(
                          0,
                          ((currentValue - (kpi.baseline || 0)) /
                            ((kpi.target || 1) - (kpi.baseline || 0))) *
                            100
                        )
                      )
                    : null;
                const borderColor =
                  CATEGORY_COLOR[category] || "border-white/[0.06]";

                return (
                  <div
                    key={kpi.id}
                    className={`bg-white/[0.03] border-l-2 ${borderColor} border border-white/[0.06] rounded-xl p-4`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-gray-500">{kpi.name}</p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-xl font-bold text-white">
                            {fmt(currentValue)}
                          </span>
                          {delta !== null && (
                            <span
                              className={`text-xs font-medium ${
                                delta > 0
                                  ? "text-emerald-400"
                                  : delta < 0
                                    ? "text-red-400"
                                    : "text-gray-500"
                              }`}
                            >
                              {delta > 0 ? "+" : ""}
                              {fmt(delta)}
                            </span>
                          )}
                        </div>
                      </div>
                      {kpi.target && (
                        <div className="text-right">
                          <p className="text-[10px] text-gray-600">Meta</p>
                          <p className="text-xs text-gray-400">
                            {fmt(kpi.target)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    {progressPct !== null && (
                      <div className="mt-3">
                        <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              progressPct >= 80
                                ? "bg-emerald-500"
                                : progressPct >= 40
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-600 mt-1">
                          {progressPct.toFixed(0)}% da meta
                        </p>
                      </div>
                    )}

                    {/* Mini history */}
                    {kpi.snapshots.length > 1 && (
                      <div className="flex items-end gap-0.5 mt-3 h-6">
                        {[...kpi.snapshots]
                          .reverse()
                          .slice(-8)
                          .map((s, i) => {
                            const max = Math.max(
                              ...kpi.snapshots.map((x) => x.value),
                              1
                            );
                            const h = (s.value / max) * 100;
                            return (
                              <div
                                key={i}
                                className="flex-1 bg-white/[0.08] rounded-t"
                                style={{ height: `${Math.max(h, 8)}%` }}
                                title={`${fmt(s.value)} - ${s.recordedAt.toLocaleDateString("pt-BR")}`}
                              />
                            );
                          })}
                      </div>
                    )}

                    {/* Add snapshot */}
                    <form
                      action={addKpiSnapshot}
                      className="mt-3 flex gap-2"
                    >
                      <input type="hidden" name="kpiId" value={kpi.id} />
                      <input
                        name="value"
                        type="number"
                        step="0.01"
                        placeholder="Novo valor"
                        required
                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-xs text-white placeholder-gray-600 focus:border-amber-500/40 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-2 py-1 text-xs bg-white/[0.06] text-gray-400 rounded hover:bg-white/[0.1] hover:text-white transition-colors"
                      >
                        +
                      </button>
                    </form>

                    {kpi.description && (
                      <p className="text-[10px] text-gray-600 mt-2">
                        {kpi.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
