import Image from "next/image";
import type { HeroProduct } from "@/data/products";
import styles from "./hero.module.css";

export type Slot = {
  product: HeroProduct;
  /** product animating out of this slot after a swap */
  leaving?: HeroProduct;
};

type Props = {
  slot: Slot;
  side: "left" | "right";
  disabled: boolean;
  /** receives the pressed button so the reveal can grow from it */
  onSelect: (button: HTMLElement) => void;
};

/** One thumbnail of the picker. Pressing it plays that product. */
export default function ProductSlot({ slot, side, disabled, onSelect }: Props) {
  const { product, leaving } = slot;
  return (
    <div className={`${styles.slotEnter} ${side === "left" ? styles.slotLeft : styles.slotRight}`}>
      <div className={styles.productWrap}>
        <button
          type="button"
          className={styles.product}
          onClick={(e) => onSelect(e.currentTarget)}
          aria-disabled={disabled}
          aria-label={`Play ${product.name}`}
          title={product.name}
        >
          <Image
            key={product.id}
            src={product.thumb.src}
            alt=""
            width={product.thumb.width}
            height={product.thumb.height}
            sizes="(min-width: 1024px) 7vw, 66px"
            className={`${styles.productImg} ${leaving ? styles.thumbIn : ""}`}
          />
          {leaving && (
            <Image
              key={`${leaving.id}-out`}
              src={leaving.thumb.src}
              alt=""
              width={leaving.thumb.width}
              height={leaving.thumb.height}
              sizes="(min-width: 1024px) 7vw, 66px"
              className={`${styles.productImg} ${styles.thumbOut}`}
              aria-hidden
            />
          )}
        </button>
        <span className={styles.productName} aria-hidden>
          {product.name}
        </span>
      </div>
    </div>
  );
}
