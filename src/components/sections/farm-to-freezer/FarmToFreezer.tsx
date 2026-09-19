import Image from "next/image";
import type { CSSProperties } from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import ScrollProgress from "@/components/ui/ScrollProgress";
import bareCob from "@/assets/sections/better-way/corn-cob.png";
import cornCob from "@/assets/sections/farm-to-freezer/corn-cob.png";
import farmLineart from "@/assets/sections/farm-to-freezer/farm-lineart.png";
import styles from "./farm-to-freezer.module.css";

const delay = (seconds: number) => ({ "--d": `${seconds}s` }) as CSSProperties;

/**
 * "From Farm To Freezer" — Figma SMCAGRI, the section below the hero
 * (nodes 65:3505 eyebrow, 63:3467 title, 65:3507 lede, 65:3503 line art,
 * 65:3494 corn cob, 66:3515 glass card).
 */
export default function FarmToFreezer() {
  return (
    <div className={styles.shell}>
      <section className={styles.section} aria-labelledby="farm-to-freezer-title">
        <RevealOnScroll className={styles.intro}>
          <p className={styles.eyebrow}>Good food starts before the factory.</p>
          <h2 id="farm-to-freezer-title" className={styles.title}>
            <span className={styles.line}>
              <span className={styles.lineInner} style={delay(0.1)}>
                From Farm
              </span>
            </span>
            <span className={styles.line}>
              <span className={styles.lineInner} style={delay(0.22)}>
                To Freezer
              </span>
            </span>
          </h2>
          <p className={styles.lede}>
            It starts with the crop. With the soil. With the harvest. With knowing when something is
            ready. We begin with carefully selected produce — because no amount of processing can fix a
            bad beginning.
          </p>
        </RevealOnScroll>

        <RevealOnScroll className={styles.scene} threshold={0.15}>
          <div className={styles.lineartWrap}>
            <div className={styles.lineartDrift}>
              <Image
                src={farmLineart}
                alt="Line drawing of a corn field at harvest: a combine harvester loads a tractor trailer"
                sizes="116vw"
                className={styles.lineart}
              />
            </div>
          </div>

          {/* The corn sheds its leaves and drops into the next section as the scene
              scrolls away (and climbs back on the way up). --p: 0 with the scene's
              top at the top of the screen, 1 when its bottom is 15% from the top. */}
          <ScrollProgress className={styles.journey} from={[0, 0]} to={[1, 0.15]}>
            <div className={styles.cob}>
              <div className={styles.cobDrop}>
                <div className={styles.cobGroup}>
                  <div className={styles.bareTurn}>
                    <Image src={bareCob} alt="" sizes="31vw" className={styles.bare} />
                  </div>
                  <Image src={cornCob} alt="" sizes="31vw" className={styles.husk} />
                </div>
              </div>
            </div>
          </ScrollProgress>

          <div className={styles.card}>
            <p className={styles.cardTitle}>Just drop it</p>
            <p className={styles.cardBody}>
              No new equipment needed. Just drop it into water — it dissolves evenly on its own.
            </p>
          </div>
        </RevealOnScroll>
      </section>
    </div>
  );
}
