"use client";

import Image from "next/image";
import Link from "next/link";
import { Album, Sticker } from "@/lib/albums";
import { imgUrl } from "@/lib/images";
import styles from "./store-album-view.module.css";

interface StoreHeroProps {
  album: Album;
  sellerName: string;
  sellerPhone: string | null;
  sellerSlug: string;
  totalAvailable: number;
  minPrice: number;
  heroStickers: Sticker[];
  cartCount: number;
  onScrollToGrid: () => void;
  onOpenImport: () => void;
  onOpenCart: () => void;
}

export default function StoreHero({
  album,
  sellerName,
  sellerSlug,
  totalAvailable,
  minPrice,
  heroStickers,
  cartCount,
  onScrollToGrid,
  onOpenImport,
  onOpenCart,
}: StoreHeroProps) {
  return (
    <header className={styles.hero}>
      <nav className={styles.nav}>
        <Link href={`/loja/${sellerSlug}?browse=true`} className={styles.shopBrand}>
          <div className={styles.shopLogo}>{sellerName.charAt(0).toUpperCase()}</div>
          <div>
            <div className={styles.shopName}>{sellerName}</div>
            <div className={styles.shopTag}>Figurinhas Copa {album.year}</div>
          </div>
        </Link>
        <div className={styles.navRight}>
          <button onClick={onOpenCart} className={styles.cartBtn} aria-label="Carrinho">
            <svg
              className={styles.navIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {cartCount > 0 && <span className={styles.cartCount}>{cartCount}</span>}
          </button>
        </div>
      </nav>

      <div className={styles.heroBody}>
        <div className={styles.heroLeft}>
          <div className={styles.heroChips}>
            <span className={styles.chip}>
              <span className={styles.chipDot} /> Em estoque agora
            </span>
            <span className={styles.chip}>
              {album.flag} {album.host}
            </span>
          </div>
          <h1 className={styles.heroTitle}>
            Complete<br />seu álbum{" "}
            <span className={styles.heroTitleAcc}>Copa {album.year}</span>
          </h1>
          <p className={styles.heroSub}>
            {totalAvailable} figurinhas disponíveis a partir de R${" "}
            {minPrice.toFixed(2).replace(".", ",")} cada.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <div className={styles.heroStatV}>{totalAvailable}</div>
              <div className={styles.heroStatL}>em estoque</div>
            </div>
            <div className={styles.heroStat}>
              <div className={styles.heroStatV}>{album.sections.length}</div>
              <div className={styles.heroStatL}>seções</div>
            </div>
            <div className={styles.heroStat}>
              <div className={styles.heroStatV}>R${minPrice.toFixed(2).replace(".", ",")}</div>
              <div className={styles.heroStatL}>desde</div>
            </div>
          </div>
          <div className={styles.heroCtas}>
            <button onClick={onScrollToGrid} className={`${styles.btn} ${styles.btnPrimary}`}>
              Ver figurinhas →
            </button>
            <button onClick={onOpenImport} className={`${styles.btn} ${styles.btnGhost}`}>
              Colar minha lista
            </button>
          </div>
        </div>

        <div className={styles.heroRight}>
          {heroStickers.slice(0, 5).map((s, i) => (
            <div key={s.code} className={`${styles.heroStk} ${styles[`s${i + 1}` as keyof typeof styles]}`}>
              <Image
                src={imgUrl(s.image)}
                alt={s.name}
                width={170}
                height={238}
                className={styles.heroStkImg}
                unoptimized
              />
              <div className={styles.heroStkTxt}>
                <div className={styles.heroStkCode}>{s.code}</div>
                <div className={styles.heroStkName}>{s.name}</div>
              </div>
              <div className={styles.heroStkShine} />
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
