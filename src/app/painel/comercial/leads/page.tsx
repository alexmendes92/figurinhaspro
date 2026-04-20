import { db } from "@/lib/db";
import { createLead } from "../actions";
import Link from "next/link";

const STAGES = [
  { value: "", label: "Todos" },
  { value: "PROSPECT", label: "Prospect" },
  { value: "CONTACT", label: "Contato" },
  { value: "DEMO", label: "Demo" },
  { value: "NEGOTIATION", label: "Negociacao" },
  { value: "WON", label: "Ganho" },
  { value: "LOST", label: "Perdido" },
];

const STAGE_COLOR: Record<string, string> = {
  PROSPECT: "bg-gray-500",
  CONTACT: "bg-blue-500",
  DEMO: "bg-violet-500",
  NEGOTIATION: "bg-amber-500",
  WON: "bg-emerald-500",
  LOST: "bg-red-500",
};

const PRIORITY_BADGE: Record<string, string> = {
  HIGH: "bg-red-500/10 text-red-400",
  MEDIUM: "bg-amber-500/10 text-amber-400",
  LOW: "bg-gray-500/10 text-gray-400",
};

const inputClass =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-500/40 focus:outline-none";

export default async function LeadsPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await searchParamsPromise;
  const stageFilter = (searchParams?.stage as string) || "";
  const showNew = searchParams?.new === "1";

  const leads = await db.bizLead.findMany({
    where: stageFilter ? { stage: stageFilter } : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { activities: true, tasks: true } } },
  });

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {STAGES.map((s) => {
            const active = stageFilter === s.value;
            const href = s.value
              ? `/painel/comercial/leads?stage=${s.value}`
              : "/painel/comercial/leads";
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
          href="/painel/comercial/leads?new=1"
          className="px-3 py-1.5 bg-amber-500 text-black text-xs font-medium rounded-lg hover:bg-amber-400 transition-colors flex-shrink-0"
        >
          + Novo Lead
        </Link>
      </div>

      {/* Create form */}
      {showNew && (
        <form
          action={createLead}
          className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3"
        >
          <h3 className="text-sm font-medium text-white">Novo Lead</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              name="name"
              placeholder="Nome *"
              required
              className={inputClass}
            />
            <input
              name="phone"
              placeholder="Telefone"
              className={inputClass}
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              className={inputClass}
            />
            <select name="source" className={inputClass}>
              <option value="DIRETO">Direto</option>
              <option value="INDICACAO">Indicacao</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="GOOGLE">Google</option>
              <option value="EVENTO">Evento</option>
              <option value="OUTRO">Outro</option>
            </select>
            <input
              name="potentialValue"
              type="number"
              step="0.01"
              placeholder="Valor potencial (R$)"
              className={inputClass}
            />
            <select name="priority" className={inputClass}>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Media</option>
              <option value="LOW">Baixa</option>
            </select>
          </div>
          <input
            name="nextStep"
            placeholder="Proximo passo"
            className={inputClass}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 text-black text-sm font-medium rounded-lg hover:bg-amber-400 transition-colors"
            >
              Criar lead
            </button>
            <Link
              href="/painel/comercial/leads"
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      )}

      {/* Leads list */}
      {leads.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">Nenhum lead encontrado</p>
          <Link
            href="/painel/comercial/leads?new=1"
            className="text-amber-400 text-sm mt-2 inline-block hover:underline"
          >
            Cadastrar primeiro lead
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/painel/comercial/leads/${lead.id}`}
              className="block bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:ring-1 hover:ring-amber-500/30 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${STAGE_COLOR[lead.stage] || "bg-gray-500"}`}
                    />
                    <span className="text-sm font-medium text-white truncate">
                      {lead.name}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_BADGE[lead.priority] || "bg-gray-500/10 text-gray-400"}`}
                    >
                      {lead.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                    <span>{lead.source}</span>
                    {lead.potentialValue && (
                      <span>R$ {lead.potentialValue.toFixed(0)}</span>
                    )}
                    {lead._count.activities > 0 && (
                      <span>{lead._count.activities} atividades</span>
                    )}
                    {lead._count.tasks > 0 && (
                      <span>{lead._count.tasks} tarefas</span>
                    )}
                  </div>
                  {lead.nextStep && (
                    <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">
                      Proximo: {lead.nextStep}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-gray-600 flex-shrink-0">
                  {lead.createdAt.toLocaleDateString("pt-BR")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
