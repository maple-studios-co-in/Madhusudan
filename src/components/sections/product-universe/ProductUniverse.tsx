import Image from "next/image";
import type { CSSProperties } from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { CATALOGUE } from "@/data/catalogue";
import styles from "./product-universe.module.css";

const cssVars = (vars: Record<string, string | number>) => vars as CSSProperties;

/** Figma 119:640 — the ↗ in the card's corner tile (colour follows the tile) */
function ArrowIcon() {
  return (
    <svg className={styles.arrowIcon} viewBox="0 0 10.36 11.2138" aria-hidden focusable="false">
      <path
        d="M10.1509 9.97211H8.94293V2.8043L1.348 10.3993L0.493816 9.54503L8.08875 1.95012H0.920905V0.74214H10.1509V9.97211Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * "Product universe" — Figma SMCAGRI 119:627 (inside 1:3), with its eyebrow
 * 119:771 and title 119:769. Eight product cards in three columns; each pack
 * breaks out of the top of its card. Rows rise in as they arrive; hovering a
 * card lifts its pack and fills the arrow tile.
 */
export default function ProductUniverse() {
  return (
    <div className={styles.shell}>
      <section id="products" className={styles.section} aria-labelledby="products-title">
        <RevealOnScroll className={styles.head} threshold={0.5}>
          <p className={styles.eyebrow}>Product universe</p>
          <h2 id="products-title" className={styles.title}>
            <span className={styles.line}>
              <span className={`${styles.lineInner} ${styles.strong}`} style={cssVars({ "--d": "0.08s" })}>
                Goodness,
              </span>
            </span>
            <span className={styles.line}>
              <span className={styles.lineInner} style={cssVars({ "--d": "0.18s" })}>
                Ready when you are
              </span>
            </span>
          </h2>
        </RevealOnScroll>

        <ul className={styles.grid}>
          {CATALOGUE.map((product, i) => (
            <li key={product.id} className={styles.item}>
              <RevealOnScroll
                className={styles.card}
                threshold={0.35}
                style={cssVars({
                  "--d": `${(i % 3) * 0.09}s`,
                  "--pw": product.packSize.width,
                  "--ph": product.packSize.height,
                })}
              >
                <div className={styles.packSlot}>
                  <Image
                    src={product.pack}
                    alt={`Madhusudan ${product.name} pack`}
                    sizes="(min-width: 1024px) 19vw, 60vw"
                    className={styles.pack}
                  />
                </div>
                <h3 className={styles.name}>{product.name}</h3>
                <p className={styles.blurb}>
                  <span className={styles.hook}>{product.hook}</span>
                  {product.lines.map((line) => (
                    <span key={line} className={styles.blurbLine}>
                      {line}
                    </span>
                  ))}
                </p>
                <span className={styles.arrow} aria-hidden>
                  <ArrowIcon />
                </span>
              </RevealOnScroll>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
