import Image from "next/image";
import { PARTNERS } from "@/data/partners";
import styles from "./hero.module.css";

/** "Available on" row along the bottom of the hero: static, centred. */
export default function PartnerStrip() {
  return (
    <ul className={styles.partners} aria-label="Available on">
      {PARTNERS.map((partner) => (
        <li key={partner.id} className={styles.partnerItem}>
          {partner.logo ? (
            <Image
              src={partner.logo.src}
              alt={partner.name}
              width={partner.logo.width}
              height={partner.logo.height}
              className={styles.partnerLogo}
            />
          ) : (
            <span className={styles.partnerWordmark}>{partner.name}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
