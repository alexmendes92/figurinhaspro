import { db } from "@/lib/db";
import { SeedButton } from "@/components/painel/comercial/seed-button";
import Link from "next/link";

const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  PROSPECT: { label: "Prospects", color: "bg-gray-500" },
  CONTACT: { label: "Contato", color: "bg-blue-500" },
  DEMO: { label: "Demo", color: "bg-violet-500" },
  NEGOTIATION: { label: "Negociacao", color: "bg-amber-500" },
  WON: { label: "Ganhos", color: "bg-emerald-500" },
  LOST: { label: "Perdidos", color: "bg-red-500" },
};

function Card({
  title,
  children,
  href,
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
}) {
  const content = (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
  if (href)
    return (
      <Link href={href} className="block hover:ring-1 hover:ring-amber-500/30 rounded-xl transition-all">
        {content}
      </Link>
    );
  return content;
}

export default async function ComercialDashboard() {
  const [
    totalSellers,
    proSellers,
    unlimitedSellers,
    ordersThisMonth,
    kpiCount,
    prospectCount,
    contactCount,
    demoCount,
    negotiationCount,
    wonCount,
    lostCount,
    urgentTasks,
    recentLeads,
    runningExperiments,
    activeInitiatives,
    activeOffers,
    pendingTasks,
  ] = await Promise.all([
    db.seller.count(),
    db.seller.count({ where: { plan: "PRO" } }),
    db.seller.count({ where: { plan: "UNLIMITED" } }),
    db.order.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    db.bizKpi.count(),
    db.bizLead.count({ where: { stage: "PROSPECT" } }),
    db.bizLead.count({ where: { stage: "CONTACT" } }),
    db.bizLead.count({ where: { stage: "DEMO" } }),
    db.bizLead.count({ where: { stage: "NEGOTIATION" } }),
    db.bizLead.count({ where: { stage: "WON" } }),
    db.bizLead.count({ where: { stage: "LOST" } }),
    db.bizTask.findMany({
      where: { status: { in: ["TODO", "IN_PROGRESS"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.bizLead.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.bizExperiment.count({ where: { status: "RUNNING" } }),
    db.bizInitiative.count({ where: { phase: "IN_PROGRESS" } }),
    db.bizOffer.count({ where: { status: "ACTIVE" } }),
    db.bizTask.count({ where: { status: { in: ["TODO", "IN_PROGRESS"] } } }),
  ]);

  const mrr = proSellers * 39 + unlimitedSellers * 79;
  const pipeline = { PROSPECT: prospectCount, CONTACT: contactCount, DEMO: demoCount, NEGOTIATION: negotiationCount, WON: wonCount, LOST: lostCount };
  const totalPipeline = Object.values(pipeline).reduce((a, b) => a + b, 0) || 1;

  const PRIORITY_COLOR: Record<string, string> = {
    HIGH: "text-red-400",
    MEDIUM: "text-amber-400",
    LOW: "text-gray-400",
  };

  return (
    <div className="space-y-6">
      {/* Seed banner */}
      {kpiCount === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-400">
              Cockpit vazio
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Popule com os dados da analise estrategica para comecar.
            </p>
          </div>
          <SeedButton />
        </div>
      )}

      {/* Product metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Sellers", value: totalSellers },
          { label: "MRR", value: `R$ ${mrr}` },
          { label: "PRO", value: proSellers },
          { label: "Pedidos/mes", value: ordersThisMonth },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4"
          >
            <p className="text-xs text-gray-500">{m.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <Card title="Pipeline de vendas">
        <div className="flex rounded-lg overflow-hidden h-8">
          {Object.entries(pipeline).map(([stage, count]) => {
            const cfg = STAGE_CONFIG[stage];
            const pct = (count / totalPipeline) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={stage}
                className={`${cfg.color} flex items-center justify-center text-xs font-medium text-white min-w-[24px]`}
                style={{ width: `${pct}%` }}
                title={`${cfg.label}: ${count}`}
              >
                {count > 0 && count}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {Object.entries(pipeline).map(([stage, count]) => {
            const cfg = STAGE_CONFIG[stage];
            return (
              <div key={stage} className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className={`w-2 h-2 rounded-full ${cfg.color}`} />
                {cfg.label}: {count}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Two columns */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Urgent tasks */}
        <Card title="Tarefas urgentes" href="/painel/comercial/tarefas">
          {urgentTasks.length === 0 ? (
            <p className="text-sm text-gray-600">Nenhuma tarefa pendente</p>
          ) : (
            <ul className="space-y-2">
              {urgentTasks.map((t) => (
                <li key={t.id} className="flex items-start gap-2">
                  <span
                    className={`text-xs mt-0.5 ${PRIORITY_COLOR[t.priority] || "text-gray-400"}`}
                  >
                    {t.priority === "HIGH" ? "!!!" : t.priority === "MEDIUM" ? "!!" : "!"}
                  </span>
                  <span className="text-sm text-gray-300 line-clamp-1">
                    {t.title}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent leads */}
        <Card title="Leads recentes" href="/painel/comercial/leads">
          {recentLeads.length === 0 ? (
            <p className="text-sm text-gray-600">Nenhum lead cadastrado</p>
          ) : (
            <ul className="space-y-2">
              {recentLeads.map((l) => (
                <li key={l.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${STAGE_CONFIG[l.stage]?.color || "bg-gray-500"}`}
                    />
                    <span className="text-sm text-gray-300 truncate">
                      {l.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600 flex-shrink-0 ml-2">
                    {l.source}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Cockpit summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Experimentos ativos",
            value: runningExperiments,
            href: "/painel/comercial/experimentos",
          },
          {
            label: "Iniciativas em progresso",
            value: activeInitiatives,
            href: "/painel/comercial/iniciativas",
          },
          {
            label: "Ofertas ativas",
            value: activeOffers,
            href: "/painel/comercial/ofertas",
          },
          {
            label: "Tarefas pendentes",
            value: pendingTasks,
            href: "/painel/comercial/tarefas",
          },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:ring-1 hover:ring-amber-500/30 transition-all"
          >
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
