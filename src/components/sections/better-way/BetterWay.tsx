import Image from "next/image";
import type { CSSProperties } from "react";
import DotLink from "@/components/ui/DotLink";
import InViewVideo from "@/components/ui/InViewVideo";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import SplitWords from "@/components/ui/SplitWords";
import cardIcon from "@/assets/sections/better-way/card-icon.svg";
import cornCob from "@/assets/sections/better-way/corn-cob.png";
import CornDipScene from "./CornDipScene";
import styles from "./better-way.module.css";

const delay = (seconds: number): CSSProperties => ({ "--d": `${seconds}s` }) as CSSProperties;

/* Line breaks as in Figma (68:3809); line lengths kept close to the design's so the
   reveal timing and wrapping hold. */
const TITLE = ["What if the harvest", "arrived exactly as it", "was picked?"];
const PITCH_TITLE = ["We found a", "better way"];
const PITCH_BODY = [
  "Individually quick freezing locks",
  "each piece within hours of harvest —",
  "the taste, colour and nutrition of the",
  "field, kept until you need them.",
];
const CARDS = [
  {
    title: ["Frozen in hours"],
    body: ["Picked, cleaned and frozen at the", "plant while the crop is still at its", "best."],
  },
  {
    title: ["No added preservatives"],
    body: ["Cold is the only preservative. Nothing", "is added to keep it fresh, because it", "never had the chance to go stale."],
  },
  {
    title: ["Ready when", "you are"],
    body: ["No washing, peeling or chopping. From", "freezer to pan in minutes, any day of the year."],
  },
];

/** the brand wordmark in Figma's band (Figma sets "smcagri"; the brand is Madhusudan) */
function Wordmark() {
  return (
    <div className={styles.wordmarkBand}>
      <span className={styles.wordmark}>madhusudan</span>
    </div>
  );
}

/**
 * "How much could you grow" — Figma SMCAGRI 68:3808 / 68:3809.
 *
 * Desktop: one pinned screen (CornDipScene). The title, pitch and cards travel
 * up and away while the corn hangs still, the water and the Madhusudan wordmark
 * rise, and the corn-dip film — scrubbed by the scroll — drops the corn in.
 * Phones: the two-screen layout (title/corn/pitch/cards, then the film).
 */
export default function BetterWay() {
  return (
    <div className={styles.shell}>
      <section className={styles.section} aria-labelledby="better-way-title">
        <CornDipScene cornSrc={cornCob.src} stageClassName={styles.stage} wordmark={<Wordmark />}>
          <RevealOnScroll className={styles.content} threshold={0.2}>
            <h2 id="better-way-title" className={styles.title}>
              {TITLE.map((line, i) => (
                <span key={line} className={styles.line}>
                  <span className={styles.lineInner} style={delay(0.08 + i * 0.1)}>
                    {line}
                  </span>
                </span>
              ))}
            </h2>

            {/* Figma image 24. On desktop the scene's canvas takes this corn over as
                soon as it loads (same pose) and carries it down into the water. */}
            <div className={styles.corn}>
              <Image
                src={cornCob}
                alt="A ripe sweet corn cob"
                sizes="(min-width: 1024px) 34vw, 60vw"
                className={styles.cornImg}
              />
            </div>

            <div className={styles.pitch}>
              <h3 className={styles.pitchTitle}>
                <SplitWords lines={PITCH_TITLE} start={0.3} step={0.05} />
              </h3>
              <p className={styles.pitchBody}>
                <SplitWords lines={PITCH_BODY} start={0.45} step={0.015} />
              </p>
              <div className={styles.learnMore}>
                <DotLink href="#contact">Learn more</DotLink>
              </div>
            </div>

            <ul className={styles.cards}>
              {CARDS.map((card, i) => (
                <li key={card.title.join(" ")} className={styles.card} style={delay(0.2 + i * 0.12)}>
                  <Image src={cardIcon} alt="" className={styles.cardIcon} unoptimized />
                  <div className={styles.cardText}>
                    <h3 className={styles.cardTitle}>
                      <SplitWords lines={card.title} start={0.35 + i * 0.12} step={0.04} />
                    </h3>
                    <p className={styles.cardBody}>
                      <SplitWords lines={card.body} start={0.5 + i * 0.12} step={0.012} />
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </RevealOnScroll>
        </CornDipScene>

        {/* phones only: the film plays once in view */}
        <RevealOnScroll className={styles.dip} threshold={0.35}>
          <div className={styles.dipBlend}>
            <InViewVideo
              src="/video/corn-dip-v1-1080.mp4"
              poster="/video/corn-dip-v1-poster.jpg"
              className={styles.dipVideo}
              aria-hidden
              tabIndex={-1}
            />
            <Wordmark />
          </div>
        </RevealOnScroll>
      </section>
    </div>
  );
}
