import { Fragment, type CSSProperties } from "react";
import styles from "./split-words.module.css";

type Props = {
  /** text already broken into the design's lines */
  lines: string[];
  /** delay of the first word, seconds */
  start?: number;
  /** extra delay per word, seconds */
  step?: number;
  lineClassName?: string;
};

/**
 * Word-by-word rise, keyed off the nearest `[data-inview]` ancestor
 * (RevealOnScroll). Lines keep the design's breaks; spaces sit outside the
 * clipped word boxes so they never collapse. Text stays plain for readers.
 */
export default function SplitWords({ lines, start = 0, step = 0.02, lineClassName }: Props) {
  let index = 0;
  return (
    <>
      {lines.map((line, li) => (
        <span key={`${li}-${line}`} className={`${styles.line} ${lineClassName ?? ""}`}>
          {line.split(" ").map((word, wi) => {
            const delay = { "--d": `${start + index++ * step}s` } as CSSProperties;
            return (
              <Fragment key={`${wi}-${word}`}>
                <span className={styles.word}>
                  <span className={styles.wordInner} style={delay}>
                    {word}
                  </span>
                </span>{" "}
              </Fragment>
            );
          })}
        </span>
      ))}
    </>
  );
}
