"use client";

import styles from "./store-album-view.module.css";

interface StoreFooterProps {
  sellerName: string;
  sellerPhone: string | null;
}

export default function StoreFooter({ sellerName, sellerPhone }: StoreFooterProps) {
  return (
    <footer className={styles.storeFoot}>
      <div className={styles.footBrand}>
        <div className={styles.footH}>Sobre a loja</div>
        <p>{sellerName} — Vendedor independente de figurinhas oficiais Copa do Mundo.</p>
      </div>

      <div>
        <div className={styles.footH}>Pagamento</div>
        <ul className={styles.footList}>
          <li>
            <span className={styles.footPay}>PIX</span> — instantâneo
          </li>
          <li>
            <span className={styles.footPay}>Dinheiro</span> — combinar
          </li>
          <li>Combine pelo WhatsApp</li>
        </ul>
      </div>

      <div>
        <div className={styles.footH}>Ajuda</div>
        <ul className={styles.footList}>
          <li>Como completar o álbum</li>
          <li>Combine envios e troque</li>
          <li>Dúvidas? Chama no WhatsApp</li>
        </ul>
      </div>

      <div>
        <div className={styles.footH}>Vendedor</div>
        <ul className={styles.footList}>
          <li>{sellerName}</li>
          {sellerPhone && (
            <li>
              <a
                className={styles.footLink}
                href={`https://wa.me/55${sellerPhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </li>
          )}
        </ul>
        <div className={styles.footNote}>Vendas independentes — não afiliado oficial.</div>
      </div>
    </footer>
  );
}
