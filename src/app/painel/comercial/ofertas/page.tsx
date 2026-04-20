import Link from "next/link";
import { db } from "@/lib/db";
import { createOffer, toggleOfferStatus } from "../actions";

const PRICE_TYPE_LABEL: Record<string, string> = {
  ONE_TIME: "Unico",
  MONTHLY: "Mensal",
  ANNUAL: "Anual",
  PACKAGE: "Pacote",
};

const inputClass =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-500/40 focus:outline-none";

export default async function OfertasPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await searchParamsPromise;
  const showNew = searchParams?.new === "1";

  const offers = await db.bizOffer.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const totalRevenue = offers.reduce((sum, o) => sum + o.revenue, 0);
  const totalSales = offers.reduce((sum, o) => sum + o.salesCount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">
            {offers.length} ofertas | {totalSales} vendas | R$ {totalRevenue.toFixed(0)} receita
          </span>
        </div>
        <Link
          href="/painel/comercial/ofertas?new=1"
          className="px-3 py-1.5 bg-amber-500 text-black text-xs font-medium rounded-lg hover:bg-amber-400 transition-colors flex-shrink-0"
        >
          + Nova Oferta
        </Link>
      </div>

      {/* Create form */}
      {showNew && (
        <form
          action={createOffer}
          className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3"
        >
          <h3 className="text-sm font-medium text-white">Nova Oferta</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <input name="name" placeholder="Nome da oferta *" required className={inputClass} />
            <div className="grid grid-cols-2 gap-3">
              <input
                name="price"
                type="number"
                step="0.01"
                placeholder="Preco (R$) *"
                required
                className={inputClass}
              />
              <select name="priceType" className={inputClass}>
                <option value="ONE_TIME">Unico</option>
                <option value="MONTHLY">Mensal</option>
                <option value="ANNUAL">Anual</option>
                <option value="PACKAGE">Pacote</option>
              </select>
            </div>
          </div>
          <textarea name="description" placeholder="Descricao" rows={2} className={inputClass} />
          <textarea
            name="includes"
            placeholder="O que inclui (1 item por linha)"
            rows={3}
            className={inputClass}
          />
          <input name="validUntil" type="date" className={inputClass} />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 text-black text-sm font-medium rounded-lg hover:bg-amber-400 transition-colors"
            >
              Criar oferta
            </button>
            <Link
              href="/painel/comercial/ofertas"
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      )}

      {/* Offers grid */}
      {offers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">Nenhuma oferta cadastrada</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`bg-white/[0.03] border rounded-xl p-4 ${
                offer.status === "ACTIVE" ? "border-amber-500/20" : "border-white/[0.06] opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-medium text-white">{offer.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold text-amber-400">
                      R$ {offer.price.toFixed(0)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {PRICE_TYPE_LABEL[offer.priceType] || offer.priceType}
                    </span>
                  </div>
                </div>
                <form action={toggleOfferStatus.bind(null, offer.id)}>
                  <button
                    type="submit"
                    className={`text-[10px] px-2 py-1 rounded font-medium transition-colors ${
                      offer.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        : "bg-gray-500/10 text-gray-400 hover:bg-gray-500/20"
                    }`}
                  >
                    {offer.status === "ACTIVE" ? "Ativa" : "Pausada"}
                  </button>
                </form>
              </div>
              {offer.description && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{offer.description}</p>
              )}
              {offer.includes && (
                <div className="mt-2 space-y-0.5">
                  {offer.includes.split("\n").map((item, i) => (
                    <p key={i} className="text-xs text-gray-400">
                      &bull; {item}
                    </p>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-600">
                <span>{offer.salesCount} vendas</span>
                <span>R$ {offer.revenue.toFixed(0)}</span>
                {offer.validUntil && (
                  <span>Ate {offer.validUntil.toLocaleDateString("pt-BR")}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
