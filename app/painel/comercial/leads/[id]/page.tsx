import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { updateLead, addActivity, updateLeadStage } from "../../actions";
import Link from "next/link";

const STAGES = ["PROSPECT", "CONTACT", "DEMO", "NEGOTIATION", "WON", "LOST"];

const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  PROSPECT: { label: "Prospect", color: "bg-gray-500" },
  CONTACT: { label: "Contato", color: "bg-blue-500" },
  DEMO: { label: "Demo", color: "bg-violet-500" },
  NEGOTIATION: { label: "Negociacao", color: "bg-amber-500" },
  WON: { label: "Ganho", color: "bg-emerald-500" },
  LOST: { label: "Perdido", color: "bg-red-500" },
};

const inputClass =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-500/40 focus:outline-none";

function StageButton({
  leadId,
  stage,
  currentStage,
}: {
  leadId: string;
  stage: string;
  currentStage: string;
}) {
  const cfg = STAGE_CONFIG[stage];
  const active = stage === currentStage;
  return (
    <form action={updateLeadStage.bind(null, leadId, stage)}>
      <button
        type="submit"
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
          active
            ? `${cfg.color} text-white`
            : "bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08]"
        }`}
      >
        {cfg.label}
      </button>
    </form>
  );
}

export default async function LeadDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await paramsPromise;

  const lead = await db.bizLead.findUnique({
    where: { id },
    include: {
      activities: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lead) notFound();

  const updateLeadBound = updateLead.bind(null, id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/painel/comercial/leads"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            &larr; Voltar aos leads
          </Link>
          <h2 className="text-lg font-bold text-white mt-1">{lead.name}</h2>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            {lead.phone && <span>{lead.phone}</span>}
            {lead.email && <span>{lead.email}</span>}
            {lead.potentialValue && (
              <span className="text-amber-400">
                R$ {lead.potentialValue.toFixed(0)}
              </span>
            )}
            <span>{lead.source}</span>
          </div>
        </div>
      </div>

      {/* Stage pipeline */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Estagio
        </h3>
        <div className="flex flex-wrap gap-2">
          {STAGES.map((stage) => (
            <StageButton
              key={stage}
              leadId={id}
              stage={stage}
              currentStage={lead.stage}
            />
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Lead info / notes */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Detalhes
          </h3>
          <form action={updateLeadBound} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500">Proximo passo</label>
              <input
                name="nextStep"
                defaultValue={lead.nextStep || ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Objecoes</label>
              <textarea
                name="objections"
                defaultValue={lead.objections || ""}
                rows={2}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Notas</label>
              <textarea
                name="notes"
                defaultValue={lead.notes || ""}
                rows={3}
                className={inputClass}
              />
            </div>
            {lead.stage === "LOST" && (
              <div>
                <label className="text-xs text-gray-500">Motivo da perda</label>
                <input
                  name="lostReason"
                  defaultValue={lead.lostReason || ""}
                  className={inputClass}
                />
              </div>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-white/[0.06] text-white text-sm rounded-lg hover:bg-white/[0.1] transition-colors"
            >
              Salvar
            </button>
          </form>
        </div>

        {/* Add activity */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Registrar atividade
          </h3>
          <form action={addActivity} className="space-y-3">
            <input type="hidden" name="leadId" value={id} />
            <div className="grid grid-cols-2 gap-3">
              <select name="type" className={inputClass}>
                <option value="CALL">Ligacao</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Reuniao</option>
                <option value="DEMO">Demo</option>
                <option value="NOTE">Anotacao</option>
              </select>
              <select name="channel" className={inputClass}>
                <option value="">Canal</option>
                <option value="PHONE">Telefone</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">Email</option>
                <option value="PRESENCIAL">Presencial</option>
                <option value="VIDEO">Video</option>
              </select>
            </div>
            <input
              name="summary"
              placeholder="O que aconteceu? *"
              required
              className={inputClass}
            />
            <input
              name="result"
              placeholder="Resultado / proximo passo"
              className={inputClass}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 text-black text-sm font-medium rounded-lg hover:bg-amber-400 transition-colors"
            >
              Registrar
            </button>
          </form>
        </div>
      </div>

      {/* Activity timeline */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Historico ({lead.activities.length})
        </h3>
        {lead.activities.length === 0 ? (
          <p className="text-sm text-gray-600">Sem atividades registradas</p>
        ) : (
          <div className="space-y-3">
            {lead.activities.map((a) => (
              <div
                key={a.id}
                className="flex gap-3 border-l-2 border-white/[0.06] pl-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-amber-400">
                      {a.type}
                    </span>
                    {a.channel && (
                      <span className="text-xs text-gray-600">{a.channel}</span>
                    )}
                    <span className="text-xs text-gray-600">
                      {a.createdAt.toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mt-0.5">{a.summary}</p>
                  {a.result && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      &rarr; {a.result}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tasks */}
      {lead.tasks.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Tarefas vinculadas ({lead.tasks.length})
          </h3>
          <ul className="space-y-2">
            {lead.tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${t.status === "DONE" ? "bg-emerald-500" : "bg-amber-500"}`}
                />
                <span
                  className={`text-sm ${t.status === "DONE" ? "text-gray-500 line-through" : "text-gray-300"}`}
                >
                  {t.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
