import Link from "next/link";
import { NAVIGATION, SITE } from "@/data/navigation";
import styles from "./site-header.module.css";

/** Two leaves above the wordmark — placeholder for the supplied brand mark. */
function BrandLogo() {
  return (
    <Link href="/" className={styles.logo} aria-label={`${SITE.name} home`}>
      <svg className={styles.leaves} viewBox="0 0 64 40" aria-hidden focusable="false">
        <path
          d="M31 39C31 22 20 9 3 6c1 17 12 29 28 33Z"
          fill="#6fb43f"
        />
        <path
          d="M33 39c0-17 11-30 28-33-1 17-12 29-28 33Z"
          fill="#2f9bd6"
        />
        <path d="M31 39c-4-10-10-18-18-24M33 39c4-10 10-18 18-24" stroke="rgba(255,255,255,.45)" strokeWidth="1.2" fill="none" />
      </svg>
      <span className={styles.wordmark}>{SITE.shortName}</span>
      <span className={styles.subline}>{SITE.tagline}</span>
    </Link>
  );
}

function MenuIcon() {
  return (
    <svg className={styles.menuIcon} viewBox="0 0 16 16" aria-hidden focusable="false">
      <path
        d="M1.5 1.5 6 6M1.5 1.5H5M1.5 1.5V5M14.5 1.5 10 6M14.5 1.5H11M14.5 1.5V5M1.5 14.5 6 10M1.5 14.5H5M1.5 14.5V11M14.5 14.5 10 10M14.5 14.5H11M14.5 14.5V11"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * Overlay header: menu trigger, centred brand, contact link. Inherits the
 * hero's theme colour so it recolours with the footage.
 */
export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <button type="button" className={styles.menu} aria-haspopup="dialog" aria-expanded={false}>
        <MenuIcon />
        <span>{NAVIGATION.menuLabel}</span>
      </button>
      <BrandLogo />
      <a href={NAVIGATION.contact.href} className={styles.contact}>
        {NAVIGATION.contact.label}
      </a>
    </header>
  );
}
