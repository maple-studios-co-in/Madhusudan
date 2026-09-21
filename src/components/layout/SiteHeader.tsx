import Image from "next/image";
import Link from "next/link";
import madhusudanLogo from "@/assets/brand/madhusudan-logo.png";
import { NAVIGATION } from "@/data/navigation";
import styles from "./site-header.module.css";

/** Madhusudan brand mark; "Since - 1992" and ® set in the hero's cream (see README). */
function BrandLogo() {
  return (
    <Link href="/" className={styles.logo}>
      <Image
        src={madhusudanLogo}
        alt="Madhusudan home"
        sizes="(min-width: 1024px) 14vw, 120px"
        loading="eager"
        fetchPriority="high"
        className={styles.logoImg}
      />
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
