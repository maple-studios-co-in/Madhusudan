import type { CSSProperties } from "react";
import DotLink from "@/components/ui/DotLink";
import InViewVideo from "@/components/ui/InViewVideo";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import SplitWords from "@/components/ui/SplitWords";
import styles from "./move-fast.module.css";

const delay = (seconds: number): CSSProperties => ({ "--d": `${seconds}s` }) as CSSProperties;

/* Figma 103:4253, with its line breaks. Still the reference site's copy
   ("Farm Minerals", fertilisers) — replace with SMC's before launch. */
const LEAD = ["Most ag companies pay to offset their emissions."];
const BODY = [
  "With Farm Minerals, you don’t have to. Our fertilizers",
  "are made clean from the start — so you can lower",
  "your footprint without buying credits or paying",
  "compliance fees.",
];

/**
 * "Then we move fast" — Figma SMCAGRI 103:4250.
 * Left: title, statement and Learn more on the cream panel. Right: the IQF line
 * footage (frozen vegetables pouring onto the conveyor), looping while in view;
 * its first frame is the Figma still.
 */
export default function MoveFast() {
  return (
    <div className={styles.shell}>
      <section className={styles.section} aria-labelledby="move-fast-title">
        <RevealOnScroll className={styles.copy} threshold={0.3}>
          <h2 id="move-fast-title" className={styles.title}>
            <span className={styles.line}>
              <span className={styles.lineInner} style={delay(0.05)}>
                Then we
              </span>
            </span>
            <span className={styles.line}>
              <span className={styles.lineInner} style={delay(0.15)}>
                move fast.
              </span>
            </span>
          </h2>

          <div className={styles.body}>
            <p>
              <SplitWords lines={LEAD} start={0.3} step={0.02} />
            </p>
            <p>
              <SplitWords lines={BODY} start={0.45} step={0.012} />
            </p>
          </div>

          <div className={styles.cta}>
            <DotLink href="#contact">Learn more</DotLink>
          </div>
        </RevealOnScroll>

        {/* the reveal clip sits inside the observed box: Chrome's IntersectionObserver
            counts an element's own clip-path, so a fully clipped root never "enters" */}
        <RevealOnScroll className={styles.media} threshold={0.3}>
          <div className={styles.reveal}>
            <div className={styles.frame}>
              <InViewVideo
                loop
                src="/video/iqf-line-v1-1080.mp4"
                poster="/video/iqf-line-v1-poster.jpg"
                className={styles.video}
                aria-hidden
                tabIndex={-1}
              />
            </div>
          </div>
        </RevealOnScroll>
      </section>
    </div>
  );
}
