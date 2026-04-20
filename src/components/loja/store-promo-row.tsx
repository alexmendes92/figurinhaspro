"use client";

import styles from "./store-album-view.module.css";

interface StorePromoRowProps {
  onOpenImport: () => void;
  quantityTiers: { minQuantity: number; discount: number }[];
  sellerBusinessHours?: string | null;
  sellerPaymentMethods?: string | null;
}

export default function StorePromoRow({
  onOpenImport,
  quantityTiers,
  sellerBusinessHours,
  sellerPaymentMethods,
}: StorePromoRowProps) {
  return (
    <section className={styles.promoRow}>
      {/* Card 1: Cole lista — sempre exibido */}
      <button type="button" className={styles.promo} onClick={onOpenImport}>
        <div className={styles.promoIco}>📋</div>
        <div className={styles.promoT}>Cole a lista que falta</div>
        <div className={styles.promoP}>Te mostro o que tenho na hora.</div>
        <div className={styles.promoL}>
          Importar lista <span className={styles.promoHi}>→</span>
        </div>
      </button>

      {/* Card 2: Combo desconto — só renderiza se quantityTiers.length > 0 */}
      {quantityTiers.length > 0 &&
        (() => {
          const sortedTiers = [...quantityTiers].sort(
            (a, b) => a.minQuantity - b.minQuantity,
          );
          const firstTier = sortedTiers[0];
          return (
            <div className={styles.promo}>
              <div className={styles.promoIco}>🎯</div>
              <div className={styles.promoT}>Combo desconto</div>
              <div className={styles.promoP}>
                A partir de <strong>{firstTier.minQuantity}</strong> figurinhas
                você ganha <strong>{firstTier.discount}%</strong> off.
              </div>
              <div className={styles.promoL}>
                Quanto mais leva, mais desconta{" "}
                <span className={styles.promoHi}>↓</span>
              </div>
            </div>
          );
        })()}

      {/* Card 3: Horário + pagamento — só renderiza se houver pelo menos um dos dois */}
      {(sellerBusinessHours || sellerPaymentMethods) && (
        <div className={styles.promo}>
          <div className={styles.promoIco}>💳</div>
          <div className={styles.promoT}>
            {sellerBusinessHours ? "Atendimento" : "Pagamento"}
          </div>
          <div className={styles.promoP}>
            {sellerBusinessHours || sellerPaymentMethods}
          </div>
          {sellerBusinessHours && sellerPaymentMethods && (
            <div className={styles.promoL}>{sellerPaymentMethods}</div>
          )}
        </div>
      )}
    </section>
  );
}
