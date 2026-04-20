import Link from "next/link";
import { db } from "@/lib/db";
import { createInitiative, updateInitiativePhase } from "../actions";

const PHASE_CONFIG: Record<string, { label: string; color: string }> = {
  BACKLOG: { label: "Backlog", color: "bg-gray-500" },
  PLANNED: { label: "Planejada", color: "bg-blue-500" },
  IN_PROGRESS: { label: "Em progresso", color: "bg-amber-500" },
  DONE: { label: "Concluida", color: "bg-emerald-500" },
  CANCELLED: { label: "Cancelada", color: "bg-red-500" },
};

const CATEGORY_LABEL: Record<string, string> = {
  MONETIZATION: "Monetizacao",
  ACQUISITION: "Aquisicao",
  ACTIVATION: "Ativacao",
  RETENTION: "Retencao",
  PRODUCT: "Produto",
  INFRASTRUCTURE: "Infra",
};

const CATEGORY_COLOR: Record<string, string> = {
  MONETIZATION: "bg-emerald-500/10 text-emerald-400",
  ACQUISITION: "bg-blue-500/10 text-blue-400",
  ACTIVATION: "bg-violet-500/10 text-violet-400",
  RETENTION: "bg-amber-500/10 text-amber-400",
  PRODUCT: "bg-cyan-500/10 text-cyan-400",
  INFRASTRUCTURE: "bg-gray-500/10 text-gray-400",
};

const inputClass =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-500/40 focus:outline-none";

export default async function IniciativasPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await searchParamsPromise;
  const showNew = searchParams?.new === "1";
  const phaseFilter = (searchParams?.phase as string) || "";

  const initiatives = await db.bizInitiative.findMany({
    where: phaseFilter ? { phase: phaseFilter } : undefined,
    orderBy: [{ phase: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      milestones: { orderBy: { targetDate: "asc" } },
      _count: { select: { tasks: true } },
    },
  });

  // Group by phase for kanban-style view
  const phases = ["BACKLOG", "PLANNED", "IN_PROGRESS", "DONE"];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {[
            { value: "", label: "Todas" },
            ...phases.map((p) => ({
              value: p,
              label: PHASE_CONFIG[p]?.label || p,
            })),
          ].map((s) => {
            const active = phaseFilter === s.value;
            const href = s.value
              ? `/painel/comercial/iniciativas?phase=${s.value}`
              : "/painel/comercial/iniciativas";
            return (
              <Link
                key={s.value}
                href={href}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
        <Link
          href="/painel/comercial/iniciativas?new=1"
          className="px-3 py-1.5 bg-amber-500 text-black text-xs font-medium rounded-lg hover:bg-amber-400 transition-colors flex-shrink-0"
        >
          + Nova Iniciativa
        </Link>
      </div>

      {/* Create form */}
      {showNew && (
        <form
          action={createInitiative}
          className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3"
        >
          <h3 className="text-sm font-medium text-white">Nova Iniciativa</h3>
          <input
            name="title"
            placeholder="Titulo da iniciativa *"
            required
            className={inputClass}
          />
          <div className="grid sm:grid-cols-3 gap-3">
            <select name="category" required className={inputClass}>
              <option value="">Categoria *</option>
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select name="impact" className={inputClass}>
              <option value="">Impacto</option>
              <option value="HIGH">Alto</option>
              <option value="MEDIUM">Medio</option>
              <option value="LOW">Baixo</option>
            </select>
            <select name="effort" className={inputClass}>
              <option value="">Esforco</option>
              <option value="HIGH">Alto</option>
              <option value="MEDIUM">Medio</option>
              <option value="LOW">Baixo</option>
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input name="owner" placeholder="Responsavel" className={inputClass} />
            <input name="nextStep" placeholder="Proximo passo" className={inputClass} />
          </div>
          <textarea name="notes" placeholder="Notas" rows={2} className={inputClass} />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 text-black text-sm font-medium rounded-lg hover:bg-amber-400 transition-colors"
            >
              Criar iniciativa
            </button>
            <Link
              href="/painel/comercial/iniciativas"
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      )}

      {/* Kanban-style columns (if no filter) */}
      {!phaseFilter ? (
        <div className="grid md:grid-cols-4 gap-4">
          {phases.map((phase) => {
            const cfg = PHASE_CONFIG[phase];
            const items = initiatives.filter((i) => i.phase === phase);
            return (
              <div key={phase}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
                  <span className="text-xs font-medium text-gray-400">
                    {cfg.label} ({items.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((init) => (
                    <InitiativeCard key={init.id} initiative={init} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {initiatives.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">Nenhuma iniciativa encontrada</p>
            </div>
          ) : (
            initiatives.map((init) => <InitiativeCard key={init.id} initiative={init} />)
          )}
        </div>
      )}
    </div>
  );
}

function InitiativeCard({
  initiative: init,
}: {
  initiative: {
    id: string;
    title: string;
    category: string;
    phase: string;
    impact: string | null;
    effort: string | null;
    owner: string | null;
    nextStep: string | null;
    milestones: { id: string; title: string; status: string; targetDate: Date | null }[];
    _count: { tasks: number };
  };
}) {
  const catCfg = CATEGORY_COLOR[init.category] || "bg-gray-500/10 text-gray-400";
  const phases = ["BACKLOG", "PLANNED", "IN_PROGRESS", "DONE"];
  const currentIdx = phases.indexOf(init.phase);
  const nextPhase = currentIdx < phases.length - 1 ? phases[currentIdx + 1] : null;
  const prevPhase = currentIdx > 0 ? phases[currentIdx - 1] : null;

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${catCfg}`}>
              {CATEGORY_LABEL[init.category] || init.category}
            </span>
            {init.impact && <span className="text-[10px] text-gray-600">Imp: {init.impact}</span>}
          </div>
          <p className="text-sm text-white mt-1">{init.title}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {prevPhase && (
            <form action={updateInitiativePhase.bind(null, init.id, prevPhase)}>
              <button
                type="submit"
                className="text-[10px] px-1.5 py-1 bg-white/[0.04] text-gray-500 rounded hover:bg-white/[0.08] transition-colors"
                title={`Mover para ${PHASE_CONFIG[prevPhase]?.label}`}
              >
                &larr;
              </button>
            </form>
          )}
          {nextPhase && (
            <form action={updateInitiativePhase.bind(null, init.id, nextPhase)}>
              <button
                type="submit"
                className="text-[10px] px-1.5 py-1 bg-white/[0.04] text-gray-500 rounded hover:bg-white/[0.08] transition-colors"
                title={`Mover para ${PHASE_CONFIG[nextPhase]?.label}`}
              >
                &rarr;
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2 text-xs text-gray-600 flex-wrap">
        {init.owner && <span>{init.owner}</span>}
        {init._count.tasks > 0 && <span>{init._count.tasks} tarefas</span>}
      </div>

      {init.nextStep && <p className="text-xs text-gray-500 mt-1.5">Proximo: {init.nextStep}</p>}

      {init.milestones.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/[0.04] space-y-1">
          {init.milestones.map((m) => (
            <div key={m.id} className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  m.status === "DONE"
                    ? "bg-emerald-500"
                    : m.status === "IN_PROGRESS"
                      ? "bg-amber-500"
                      : "bg-gray-600"
                }`}
              />
              <span
                className={`text-xs ${m.status === "DONE" ? "text-gray-500 line-through" : "text-gray-400"}`}
              >
                {m.title}
              </span>
              {m.targetDate && (
                <span className="text-[10px] text-gray-600">
                  {m.targetDate.toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
