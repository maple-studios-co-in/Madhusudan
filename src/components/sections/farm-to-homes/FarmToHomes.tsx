import Image from "next/image";
import type { CSSProperties } from "react";
import DotLink from "@/components/ui/DotLink";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import SplitWords from "@/components/ui/SplitWords";
import farmerField from "@/assets/sections/farm-to-homes/farmer-field.jpg";
import farmerPortrait from "@/assets/sections/farm-to-homes/farmer-portrait.jpg";
import grain from "@/assets/sections/farm-to-homes/grain.jpg";
import styles from "./farm-to-homes.module.css";

const tile = (vars: Record<string, string | number>) => vars as CSSProperties;

/* Figma 119:847, with the line breaks of the design render (title-cased by the design). */
const BODY = [
  "Since 1991, SMC Agri has built its business around bringing",
  "quality agricultural produce from farm to table — combining",
  "agricultural expertise, processing technology and food-safety",
  "systems.",
];

/**
 * "From one farm to half a million homes" — Figma SMCAGRI 119:843, the green
 * band above the footer. Title, company line and "Talk to our team" (→ the
 * footer's contact block) on the left; a collage of photos and olive "pixels"
 * on the right that snap in tile by tile and drift at different depths.
 */
export default function FarmToHomes() {
  return (
    <div className={styles.shell}>
      <section className={styles.section} aria-labelledby="farm-to-homes-title">
        <RevealOnScroll className={styles.copy} threshold={0.35}>
          <h2 id="farm-to-homes-title" className={styles.title}>
            {["From one farm", "to half a million", "homes."].map((line, i) => (
              <span key={line} className={styles.line}>
                <span className={styles.lineInner} style={tile({ "--d": `${0.06 + i * 0.1}s` })}>
                  {line}
                </span>
              </span>
            ))}
          </h2>
          <p className={styles.body}>
            <SplitWords lines={BODY} start={0.35} step={0.012} />
          </p>
          <div className={styles.cta}>
            <DotLink href="#contact">Talk to our team</DotLink>
          </div>
        </RevealOnScroll>

        {/* Figma container 119:857: 653.18 × 536.36, clipped, flush right */}
        <RevealOnScroll className={styles.collage} threshold={0.3} aria-hidden>
          <span className={`${styles.tile} ${styles.dark}`} style={tile({ "--x": 128.57, "--y": -27.65, "--s": 69.11, "--d": "0s", "--drift": 46 })} />
          <span className={`${styles.tile} ${styles.photo}`} style={tile({ "--x": -2.76, "--y": 40.09, "--s": 131.32, "--d": "0.12s", "--drift": 26 })}>
            <Image src={grain} alt="" sizes="(min-width: 1024px) 10vw, 30vw" className={styles.img} />
          </span>
          <span className={`${styles.tile} ${styles.photo}`} style={tile({ "--x": 472.77, "--y": 26.27, "--s": 145.15, "--d": "0.2s", "--drift": 18 })}>
            <Image src={farmerField} alt="" sizes="(min-width: 1024px) 11vw, 32vw" className={styles.img} />
          </span>
          <span className={`${styles.tile} ${styles.photo}`} style={tile({ "--x": 190.77, "--y": 171.41, "--s": 280.63, "--d": "0.3s", "--drift": 10 })}>
            <Image src={farmerPortrait} alt="" sizes="(min-width: 1024px) 21vw, 60vw" className={styles.img} />
          </span>
          <span className={`${styles.tile} ${styles.light}`} style={tile({ "--x": 120.26, "--y": 452.05, "--s": 69.11, "--d": "0.42s", "--drift": 52 })} />
          <span className={`${styles.tile} ${styles.dark}`} style={tile({ "--x": 548.12, "--y": 385.68, "--s": 150.68, "--d": "0.5s", "--drift": 34 })} />
        </RevealOnScroll>
      </section>
    </div>
  );
}
