import type { AnchorHTMLAttributes, ReactNode } from "react";
import styles from "./dot-link.module.css";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
};

/**
 * The outlined "• LEARN MORE •" link from the Figma file (e.g. 103:4328).
 * Measurements are Figma px multiplied by `--dl-u`, which the section sets to its
 * own design unit; colours and the per-section size tweaks are `--dl-*` tokens
 * (see dot-link.module.css). Fills with its ink colour on hover and focus.
 */
export default function DotLink({ children, className, ...rest }: Props) {
  return (
    <a className={className ? `${styles.link} ${className}` : styles.link} {...rest}>
      <span className={styles.dot} aria-hidden />
      <span>{children}</span>
      <span className={styles.dot} aria-hidden />
    </a>
  );
}
