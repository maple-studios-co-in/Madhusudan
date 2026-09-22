import Link from "next/link";
import { FOOTER, SITE } from "@/data/navigation";
import styles from "./site-footer.module.css";

/**
 * Site footer — Figma SMCAGRI 119:773 (1430 × 236).
 * Brand name, two link columns, the contact block (the page's `#contact` target),
 * LinkedIn, and a bottom row with the copyright, legal links and credit.
 */
export default function SiteFooter() {
  return (
    <footer className={styles.shell}>
      <div className={styles.footer}>
        <Link href="/" className={styles.logo} aria-label={`${SITE.name} home`}>
          {SITE.name}
        </Link>

        <nav className={styles.nav} aria-label="Footer">
          {FOOTER.groups.map((group) => (
            <div key={group.links[0].label} className={styles.group}>
              {group.title && <p className={styles.groupTitle}>{group.title}</p>}
              <ul className={styles.links}>
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className={styles.link}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div id="contact" className={styles.contact}>
          <p className={styles.note}>
            {FOOTER.contactNote[0]}
            <br />
            {FOOTER.contactNote[1]}
          </p>
          <a href="#contact" className={`${styles.link} ${styles.email}`}>
            Contact us
          </a>
        </div>

        <ul className={styles.social}>
          {FOOTER.social.map((link) => (
            <li key={link.label}>
              <a href={link.href} className={styles.link}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <p className={styles.copyright}>
          © {new Date().getFullYear()} {SITE.legalName}.
        </p>

        <ul className={styles.legal}>
          {FOOTER.legal.map((link) => (
            <li key={link.label}>
              <a href={link.href} className={styles.link}>
                {link.label}
              </a>
            </li>
          ))}
          <li className={styles.credit}>
            <a href={FOOTER.credit.href} className={styles.link}>
              {FOOTER.credit.label}
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
