import Image from "next/image";
import type { CSSProperties } from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import ScrollScene from "@/components/ui/ScrollScene";
import SplitWords from "@/components/ui/SplitWords";
import iqfBag from "@/assets/sections/freeze-fast/iqf-bag.png";
import pack from "@/assets/products/sweet-corn.png";
import styles from "./freeze-fast.module.css";

const delay = (seconds: number): CSSProperties => ({ "--d": `${seconds}s` }) as CSSProperties;

/* Figma 103:4350, with its line breaks (set in title case by the design). */
const PROCESS = [
  "Our IQF process freezes individual",
  "pieces quickly, helping preserve the",
  "taste, texture and nutritional",
  "qualities SMC associates with its",
  "frozen produce.",
];

/**
 * "Freeze fast. Keep more" — Figma SMCAGRI 103:4340.
 *
 * Figma draws two states of one frame: the IQF bag of frozen kernels (image 25)
 * and, 820px lower, the same composition with the branded Madhusudan pack
 * (image 26). Here they are one pinned screen: as the section scrolls, a frost
 * line sweeps down the bag and turns it into the pack. Title, glow, dot grid and
 * the two glass cards stay put, with a little parallax for depth.
 */
export default function FreezeFast() {
  return (
    <div className={styles.shell}>
      <section className={styles.section} aria-labelledby="freeze-fast-title">
        <ScrollScene className={styles.track}>
          <RevealOnScroll className={styles.stage} threshold={0.35}>
            <div className={styles.frame}>
              <div className={styles.grid} aria-hidden />

              <h2 id="freeze-fast-title" className={styles.title}>
                <span className={styles.line}>
                  <span className={styles.lineInner} style={delay(0.05)}>
                    Freeze fast.
                  </span>
                </span>
                <span className={styles.line}>
                  <span className={styles.lineInner} style={delay(0.15)}>
                    Keep more
                  </span>
                </span>
              </h2>

              <div className={styles.product}>
                {/* one shadow for whatever is showing, so it never gets cut by the clips */}
                <div className={styles.cutouts}>
                  <div className={styles.bagLayer}>
                    <Image
                      src={iqfBag}
                      alt="Individually quick frozen sweet corn kernels in a clear bag"
                      sizes="(min-width: 1024px) 26vw, 50vw"
                      className={styles.bag}
                    />
                  </div>
                  <div className={styles.packLayer}>
                    {/* fully clipped until the sweep starts, which lazy loading reads as
                        "never visible" — so fetch it up front, at low priority */}
                    <Image
                      src={pack}
                      alt="Madhusudan Frozen Sweet Corn, 1 kg pack"
                      sizes="(min-width: 1024px) 31vw, 60vw"
                      loading="eager"
                      fetchPriority="low"
                      className={styles.pack}
                    />
                  </div>
                </div>
                <div className={styles.seal} aria-hidden />
              </div>

              <div className={`${styles.card} ${styles.cardStat}`} style={delay(0.35)}>
                <p className={styles.statTitle}>6 IQF lines</p>
                <p className={styles.statRate}>12 MT / hour / line</p>
                {/* Figma placeholder line, kept until the copy is supplied */}
                <p className={styles.statNote}>Small technical statement</p>
                <p className={`${styles.statNote} ${styles.caps}`}>Individually quick frozen</p>
              </div>

              <div className={`${styles.card} ${styles.cardProcess}`} style={delay(0.25)}>
                <p className={styles.processText}>
                  <SplitWords lines={PROCESS} start={0.45} step={0.012} />
                </p>
              </div>
            </div>
          </RevealOnScroll>
        </ScrollScene>
      </section>
    </div>
  );
}
