import { db } from "@/lib/db";
import {
  createExperiment,
  updateExperimentStatus,
  saveExperimentResult,
} from "../actions";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PLANNED: { label: "Planejado", color: "bg-gray-500" },
  RUNNING: { label: "Rodando", color: "bg-blue-500" },
  COMPLETED: { label: "Concluido", color: "bg-emerald-500" },
  KILLED: { label: "Cancelado", color: "bg-red-500" },
};

const PRIORITY_BADGE: Record<string, string> = {
  HIGH: "bg-red-500/10 text-red-400",
  MEDIUM: "bg-amber-500/10 text-amber-400",
  LOW: "bg-gray-500/10 text-gray-400",
};

const inputClass =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-500/40 focus:outline-none";

export default async function ExperimentosPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await searchParamsPromise;
  const showNew = searchParams?.new === "1";
  const statusFilter = (searchParams?.status as string) || "";

  const experiments = await db.bizExperiment.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { tasks: true } } },
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {[
            { value: "", label: "Todos" },
            { value: "PLANNED", label: "Planejados" },
            { value: "RUNNING", label: "Rodando" },
            { value: "COMPLETED", label: "Concluidos" },
            { value: "KILLED", label: "Cancelados" },
          ].map((s) => {
            const active = statusFilter === s.value;
            const href = s.value
              ? `/painel/comercial/experimentos?status=${s.value}`
              : "/painel/comercial/experimentos";
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
          href="/painel/comercial/experimentos?new=1"
          className="px-3 py-1.5 bg-amber-500 text-black text-xs font-medium rounded-lg hover:bg-amber-400 transition-colors flex-shrink-0"
        >
          + Novo Experimento
        </Link>
      </div>

      {/* Create form */}
      {showNew && (
        <form
          action={createExperiment}
          className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3"
        >
          <h3 className="text-sm font-medium text-white">Novo Experimento</h3>
          <textarea
            name="hypothesis"
            placeholder="Hipotese: Se fizermos X, esperamos Y *"
            required
            rows={2}
            className={inputClass}
          />
          <div className="grid sm:grid-cols-3 gap-3">
            <input
              name="channel"
              placeholder="Canal (Instagram, WhatsApp...)"
              className={inputClass}
            />
            <select name="priority" className={inputClass}>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Media</option>
              <option value="LOW">Baixa</option>
            </select>
            <input
              name="effort"
              placeholder="Esforco (1h, 2d, 1sem)"
              className={inputClass}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              name="cost"
              type="number"
              step="0.01"
              placeholder="Custo estimado (R$)"
              className={inputClass}
            />
            <input
              name="expectedResult"
              placeholder="Resultado esperado"
              className={inputClass}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 text-black text-sm font-medium rounded-lg hover:bg-amber-400 transition-colors"
            >
              Criar experimento
            </button>
            <Link
              href="/painel/comercial/experimentos"
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      )}

      {/* Experiments list */}
      {experiments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">Nenhum experimento cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {experiments.map((exp) => {
            const cfg = STATUS_CONFIG[exp.status] || STATUS_CONFIG.PLANNED;
            return (
              <div
                key={exp.id}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cfg.color} text-white`}
                      >
                        {cfg.label}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_BADGE[exp.priority] || ""}`}
                      >
                        {exp.priority}
                      </span>
                      {exp.channel && (
                        <span className="text-xs text-gray-600">
                          {exp.channel}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white mt-1.5">
                      {exp.hypothesis}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-600 flex-wrap">
                      {exp.effort && <span>Esforco: {exp.effort}</span>}
                      {exp.cost !== null && exp.cost > 0 && (
                        <span>Custo: R$ {exp.cost.toFixed(0)}</span>
                      )}
                      {exp.expectedResult && (
                        <span>Esperado: {exp.expectedResult}</span>
                      )}
                      {exp._count.tasks > 0 && (
                        <span>{exp._count.tasks} tarefas</span>
                      )}
                    </div>
                  </div>

                  {/* Status actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    {exp.status === "PLANNED" && (
                      <form
                        action={updateExperimentStatus.bind(
                          null,
                          exp.id,
                          "RUNNING"
                        )}
                      >
                        <button
                          type="submit"
                          className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-colors"
                        >
                          Iniciar
                        </button>
                      </form>
                    )}
                    {exp.status === "RUNNING" && (
                      <>
                        <form
                          action={updateExperimentStatus.bind(
                            null,
                            exp.id,
                            "COMPLETED"
                          )}
                        >
                          <button
                            type="submit"
                            className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20 transition-colors"
                          >
                            Concluir
                          </button>
                        </form>
                        <form
                          action={updateExperimentStatus.bind(
                            null,
                            exp.id,
                            "KILLED"
                          )}
                        >
                          <button
                            type="submit"
                            className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors"
                          >
                            Cancelar
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>

                {/* Results (for completed) */}
                {(exp.status === "COMPLETED" || exp.status === "KILLED") && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    {exp.actualResult || exp.learning || exp.decision ? (
                      <div className="space-y-1">
                        {exp.actualResult && (
                          <p className="text-xs text-gray-400">
                            <span className="text-gray-500">Resultado:</span>{" "}
                            {exp.actualResult}
                          </p>
                        )}
                        {exp.learning && (
                          <p className="text-xs text-gray-400">
                            <span className="text-gray-500">Aprendizado:</span>{" "}
                            {exp.learning}
                          </p>
                        )}
                        {exp.decision && (
                          <p className="text-xs text-gray-400">
                            <span className="text-gray-500">Decisao:</span>{" "}
                            {exp.decision}
                          </p>
                        )}
                      </div>
                    ) : (
                      <form
                        action={saveExperimentResult.bind(null, exp.id)}
                        className="space-y-2"
                      >
                        <input
                          name="actualResult"
                          placeholder="Resultado real"
                          className={inputClass}
                        />
                        <input
                          name="learning"
                          placeholder="O que aprendemos?"
                          className={inputClass}
                        />
                        <input
                          name="decision"
                          placeholder="Decisao: escalar / pivotar / matar"
                          className={inputClass}
                        />
                        <button
                          type="submit"
                          className="text-xs px-3 py-1.5 bg-white/[0.06] text-white rounded hover:bg-white/[0.1] transition-colors"
                        >
                          Salvar resultados
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
