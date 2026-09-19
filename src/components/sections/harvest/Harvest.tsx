import Image from "next/image";
import { Fragment, type CSSProperties } from "react";
import LoopVideo from "@/components/ui/LoopVideo";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import ScrollProgress from "@/components/ui/ScrollProgress";
import plantFillLeaves from "@/assets/sections/harvest/plant-fill-leaves.svg";
import plantFill from "@/assets/sections/harvest/plant-fill.svg";
import plantOutline from "@/assets/sections/harvest/plant-outline.svg";
import styles from "./harvest.module.css";

const delay = (seconds: number): CSSProperties => ({ "--d": `${seconds}s` }) as CSSProperties;

/** Figma line breaks of the small print (node 66:3526), one entry per line. */
const BODY_LINES = [
  "Most of what you apply never reaches your crops. It",
  "evaporates, washes away, or gets locked in the soil —",
  "leaving you with lower yields, more spraying, and",
  "higher costs.",
];

/**
 * "Harvest" — Figma SMCAGRI node 66:3523.
 * Left: field footage with an overlaid statement. Right: eyebrow, title and a
 * plant drawing whose filled part rises as the section scrolls through.
 */
export default function Harvest() {
  let wordIndex = 0;

  return (
    <div className={styles.shell}>
      <section className={styles.section} aria-labelledby="harvest-title">
        <div className={styles.media}>
          <div className={styles.mediaMotion}>
            {/* farm montage: farmer in the field, spraying, drones, irrigation, greenhouse, pasture */}
            <LoopVideo
              src="/video/farm-montage-v1-1080.mp4"
              poster="/video/farm-montage-v1-poster.jpg"
              className={styles.mediaVideo}
              aria-hidden
              tabIndex={-1}
            />
          </div>
          <div className={styles.scrim} aria-hidden />

          <RevealOnScroll className={styles.mediaCopy} threshold={0.4}>
            <p className={styles.mediaTitle}>
              <span className={styles.line}>
                <span className={styles.lineInner} style={delay(0)}>
                  Most fertilizers never
                </span>
              </span>
              <span className={styles.line}>
                <span className={styles.lineInner} style={delay(0.1)}>
                  make it to your plants
                </span>
              </span>
            </p>
            <p className={styles.mediaBody}>
              {BODY_LINES.map((line) => (
                <span key={line} className={styles.bodyLine}>
                  {line.split(" ").map((word, i) => {
                    const d = 0.25 + wordIndex++ * 0.018;
                    // the space must sit outside the clipped inline-block or it collapses
                    return (
                      <Fragment key={`${word}-${i}`}>
                        <span className={styles.word}>
                          <span className={styles.wordInner} style={delay(d)}>
                            {word}
                          </span>
                        </span>{" "}
                      </Fragment>
                    );
                  })}
                </span>
              ))}
            </p>
          </RevealOnScroll>
        </div>

        <RevealOnScroll className={styles.aside} threshold={0.25}>
          <p className={styles.eyebrow}>Harvest</p>
          <h2 id="harvest-title" className={styles.title}>
            <span className={styles.line}>
              <span className={styles.lineInner} style={delay(0.08)}>
                Right when the crop has
              </span>
            </span>
            <span className={styles.line}>
              <span className={styles.lineInner} style={delay(0.18)}>
                something worth keeping.
              </span>
            </span>
          </h2>

          {/* the green rises to Figma's level as the plant comes up the screen
              (--p: 0 with its foot at the bottom edge, 1 at 55% of the height) */}
          <ScrollProgress className={styles.plant} from={[1, 1]} to={[1, 0.55]} aria-hidden>
            <Image src={plantOutline} alt="" className={styles.plantOutline} unoptimized />
            <div className={styles.plantFillLayer}>
              <Image src={plantFill} alt="" className={styles.plantFillA} unoptimized />
              <Image src={plantFillLeaves} alt="" className={styles.plantFillB} unoptimized />
            </div>
          </ScrollProgress>
        </RevealOnScroll>
      </section>
    </div>
  );
}
