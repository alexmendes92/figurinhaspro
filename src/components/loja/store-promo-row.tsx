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
      <button type="button" className={`${styles.promo} ${styles.promoBtn}`} onClick={onOpenImport}>
        <div className={styles.promoIco} aria-hidden="true">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 12h6M9 16h4" />
          </svg>
        </div>
        <div className={styles.promoT}>Cole a lista que falta</div>
        <div className={styles.promoP}>Te mostro o que tenho na hora.</div>
        <div className={styles.promoL}>
          Importar lista <span className={styles.promoHi}>→</span>
        </div>
      </button>

      {/* Card 2: Combo desconto — só renderiza se quantityTiers.length > 0 */}
      {quantityTiers.length > 0 &&
        (() => {
          const sortedTiers = [...quantityTiers].sort((a, b) => a.minQuantity - b.minQuantity);
          const firstTier = sortedTiers[0];
          return (
            <div className={styles.promo}>
              <div className={styles.promoIco} aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <div className={styles.promoT}>Combo desconto</div>
              <div className={styles.promoP}>
                A partir de <strong>{firstTier.minQuantity}</strong> figurinhas você ganha{" "}
                <strong>{firstTier.discount}%</strong> off.
              </div>
              <div className={styles.promoL}>
                Quanto mais leva, mais desconta <span className={styles.promoHi}>↓</span>
              </div>
            </div>
          );
        })()}

      {/* Card 3: Horário + pagamento — só renderiza se houver pelo menos um dos dois */}
      {(sellerBusinessHours || sellerPaymentMethods) && (
        <div className={styles.promo}>
          <div className={styles.promoIco} aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="6" width="18" height="13" rx="2" />
              <path d="M3 10h18M7 15h4" />
            </svg>
          </div>
          <div className={styles.promoT}>{sellerBusinessHours ? "Atendimento" : "Pagamento"}</div>
          <div className={styles.promoP}>{sellerBusinessHours || sellerPaymentMethods}</div>
          {sellerBusinessHours && sellerPaymentMethods && (
            <div className={styles.promoL}>{sellerPaymentMethods}</div>
          )}
        </div>
      )}
    </section>
  );
}
