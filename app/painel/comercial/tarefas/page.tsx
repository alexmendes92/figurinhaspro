import { db } from "@/lib/db";
import { createTask, toggleTask } from "../actions";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  TODO: { label: "A fazer", color: "bg-gray-500" },
  IN_PROGRESS: { label: "Em andamento", color: "bg-blue-500" },
  DONE: { label: "Concluido", color: "bg-emerald-500" },
  CANCELLED: { label: "Cancelado", color: "bg-red-500" },
};

const PRIORITY_BADGE: Record<string, string> = {
  HIGH: "bg-red-500/10 text-red-400",
  MEDIUM: "bg-amber-500/10 text-amber-400",
  LOW: "bg-gray-500/10 text-gray-400",
};

const inputClass =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-500/40 focus:outline-none";

export default async function TarefasPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await searchParamsPromise;
  const showNew = searchParams?.new === "1";
  const statusFilter = (searchParams?.status as string) || "";

  const tasks = await db.bizTask.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: [{ status: "asc" }, { priority: "asc" }, { createdAt: "desc" }],
    include: {
      lead: { select: { name: true } },
      initiative: { select: { title: true } },
      experiment: { select: { hypothesis: true } },
    },
  });

  const [leads, initiatives, experiments] = await Promise.all([
    db.bizLead.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.bizInitiative.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    db.bizExperiment.findMany({
      select: { id: true, hypothesis: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const todoCount = tasks.filter(
    (t) => t.status === "TODO" || t.status === "IN_PROGRESS"
  ).length;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {[
              { value: "", label: `Todas (${tasks.length})` },
              { value: "TODO", label: "A fazer" },
              { value: "IN_PROGRESS", label: "Em andamento" },
              { value: "DONE", label: "Concluidas" },
            ].map((s) => {
              const active = statusFilter === s.value;
              const href = s.value
                ? `/painel/comercial/tarefas?status=${s.value}`
                : "/painel/comercial/tarefas";
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
          <span className="text-xs text-gray-600">
            {todoCount} pendentes / {doneCount} concluidas
          </span>
        </div>
        <Link
          href="/painel/comercial/tarefas?new=1"
          className="px-3 py-1.5 bg-amber-500 text-black text-xs font-medium rounded-lg hover:bg-amber-400 transition-colors flex-shrink-0"
        >
          + Nova Tarefa
        </Link>
      </div>

      {/* Create form */}
      {showNew && (
        <form
          action={createTask}
          className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3"
        >
          <h3 className="text-sm font-medium text-white">Nova Tarefa</h3>
          <input
            name="title"
            placeholder="Titulo *"
            required
            className={inputClass}
          />
          <textarea
            name="description"
            placeholder="Descricao"
            rows={2}
            className={inputClass}
          />
          <div className="grid sm:grid-cols-3 gap-3">
            <select name="priority" className={inputClass}>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM" selected>
                Media
              </option>
              <option value="LOW">Baixa</option>
            </select>
            <input name="deadline" type="date" className={inputClass} />
            <select name="leadId" className={inputClass}>
              <option value="">Sem lead</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <select name="initiativeId" className={inputClass}>
              <option value="">Sem iniciativa</option>
              {initiatives.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title}
                </option>
              ))}
            </select>
            <select name="experimentId" className={inputClass}>
              <option value="">Sem experimento</option>
              {experiments.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.hypothesis.slice(0, 60)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 text-black text-sm font-medium rounded-lg hover:bg-amber-400 transition-colors"
            >
              Criar tarefa
            </button>
            <Link
              href="/painel/comercial/tarefas"
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      )}

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">Nenhuma tarefa encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.TODO;
            return (
              <div
                key={task.id}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-start gap-3"
              >
                <form action={toggleTask.bind(null, task.id)}>
                  <button
                    type="submit"
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      task.status === "DONE"
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-gray-600 hover:border-amber-500"
                    }`}
                  >
                    {task.status === "DONE" && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </form>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm ${task.status === "DONE" ? "text-gray-500 line-through" : "text-white"}`}
                    >
                      {task.title}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_BADGE[task.priority] || ""}`}
                    >
                      {task.priority}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium bg-white/[0.04] text-gray-400`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-600 flex-wrap">
                    {task.lead && <span>Lead: {task.lead.name}</span>}
                    {task.initiative && (
                      <span>Iniciativa: {task.initiative.title}</span>
                    )}
                    {task.experiment && (
                      <span>
                        Exp: {task.experiment.hypothesis.slice(0, 30)}...
                      </span>
                    )}
                    {task.deadline && (
                      <span>
                        Prazo:{" "}
                        {task.deadline.toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
