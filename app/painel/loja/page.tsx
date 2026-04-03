import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import LojaEditor from "@/components/painel/loja-editor";

export default async function MinhaLojaPage() {
  const seller = await getSession();
  if (!seller) return null;

  const [inStockCount, orderCount, priceRules] = await Promise.all([
    db.inventory.count({ where: { sellerId: seller.id, quantity: { gt: 0 } } }),
    db.order.count({ where: { sellerId: seller.id } }),
    db.priceRule.findMany({ where: { sellerId: seller.id, albumSlug: null } }),
  ]);

  const priceMap = new Map<string, number>(
    priceRules.map((r: { stickerType: string; price: number }) => [r.stickerType, r.price])
  );

  return (
    <div className="p-6 lg:p-8 max-w-2xl slide-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Minha Loja</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Configurações da sua vitrine pública</p>
      </div>

      {/* Link da loja */}
      <div className="p-5 rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-dim)] mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-[var(--accent)]">Link da sua vitrine</p>
            <p className="text-[10px] text-amber-400/60 mt-0.5">Compartilhe com seus clientes</p>
          </div>
          <Link
            href={`/loja/${seller.shopSlug}`}
            target="_blank"
            className="btn-primary !py-1.5 !px-3 !text-xs flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Abrir vitrine
          </Link>
        </div>
        <div className="px-4 py-3 rounded-xl bg-black/20 border border-amber-500/10 font-[family-name:var(--font-geist-mono)] text-sm text-[var(--accent)]">
          /loja/{seller.shopSlug}
        </div>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Figurinhas", value: inStockCount, color: "text-blue-400" },
          { label: "Pedidos", value: orderCount, color: "text-green-400" },
          { label: "Álbuns", value: "13", color: "text-[var(--accent)]" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-center">
            <p className={`text-xl font-bold font-[family-name:var(--font-geist-mono)] ${s.color}`}>
              {typeof s.value === "number" ? s.value.toLocaleString("pt-BR") : s.value}
            </p>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Info da loja - agora editável */}
      <LojaEditor
        shopName={seller.shopName}
        phone={seller.phone}
        email={seller.email}
        plan={seller.plan}
      />

      {/* Preços atuais */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <p className="text-xs font-semibold text-[var(--muted)]">Preços na vitrine</p>
          <Link href="/painel/precos" className="text-[10px] text-[var(--accent)] hover:underline font-medium">
            Editar
          </Link>
        </div>
        {["regular", "foil", "shiny"].map((type, i) => (
          <div
            key={type}
            className={`px-5 py-3 flex items-center justify-between ${
              i > 0 ? "border-t border-[var(--border)]" : ""
            }`}
          >
            <span className="text-xs text-[var(--muted)] capitalize">{type}</span>
            <span className="font-[family-name:var(--font-geist-mono)] text-sm text-[var(--accent)] font-semibold">
              R${(priceMap.get(type) || (type === "foil" ? 5 : type === "shiny" ? 4 : 2.5)).toFixed(2).replace(".", ",")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
