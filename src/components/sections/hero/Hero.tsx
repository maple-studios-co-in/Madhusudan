"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import SiteHeader from "@/components/layout/SiteHeader";
import {
  HERO_PRODUCTS,
  INITIAL_PRODUCT_ID,
  otherProducts,
  productById,
  type HeroProductId,
} from "@/data/products";
import HeroVideo, { type SwitchRequest } from "./HeroVideo";
import PartnerStrip from "./PartnerStrip";
import ProductSlot, { type Slot } from "./ProductSlot";
import styles from "./hero.module.css";

const SWAP_MS = 520;
const delay = (seconds: number) => ({ "--d": `${seconds}s` }) as CSSProperties;

function initialSlots(activeId: HeroProductId): [Slot, Slot] {
  const [left, right] = otherProducts(activeId);
  return [{ product: left }, { product: right }];
}

/**
 * Landing hero (Figma 58:410, full-viewport composition).
 *
 * The footage fills the hero edge to edge. The picker beside EXPLORE always
 * shows the products that are *not* playing; pressing one reveals its footage
 * in a circle growing from that thumbnail, and the product that was playing
 * takes its place in the slot.
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [request, setRequest] = useState<SwitchRequest>({ id: INITIAL_PRODUCT_ID, seq: 0 });
  const [shownId, setShownId] = useState<HeroProductId>(INITIAL_PRODUCT_ID);
  const [slots, setSlots] = useState<[Slot, Slot]>(() => initialSlots(INITIAL_PRODUCT_ID));
  const [busy, setBusy] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  // Phones: the footage is centred on the stage placeholder in the column layout.
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const update = () => {
      if (stage.offsetHeight === 0) section.style.removeProperty("--stage-cy");
      else section.style.setProperty("--stage-cy", `${stage.offsetTop + stage.offsetHeight / 2}px`);
    };
    const ro = new ResizeObserver(update);
    ro.observe(section);
    ro.observe(stage);
    update();
    return () => ro.disconnect();
  }, []);

  const handleSwitchStart = useCallback((id: HeroProductId) => setShownId(id), []);
  const handleSwitchEnd = useCallback(() => setBusy(false), []);

  const select = useCallback(
    (index: 0 | 1, button: HTMLElement) => {
      if (busy) return;
      const next = slots[index].product;
      const previous = productById(request.id);
      const section = sectionRef.current;
      let origin: SwitchRequest["origin"];
      if (section) {
        const s = section.getBoundingClientRect();
        const b = button.getBoundingClientRect();
        origin = { x: b.left + b.width / 2 - s.left, y: b.top + b.height / 2 - s.top };
      }
      setBusy(true);
      setRequest((prev) => ({ id: next.id, origin, seq: prev.seq + 1 }));
      setSlots((prev) => {
        const out: [Slot, Slot] = [{ ...prev[0] }, { ...prev[1] }];
        out[index] = { product: previous, leaving: next };
        return out;
      });
      timers.current.push(
        window.setTimeout(() => {
          setSlots((prev) => {
            const out: [Slot, Slot] = [{ ...prev[0] }, { ...prev[1] }];
            out[index] = { product: out[index].product };
            return out;
          });
        }, SWAP_MS),
      );
    },
    [busy, slots, request.id],
  );

  const shown = productById(shownId);

  return (
    <div className={styles.shell}>
      <section
        ref={sectionRef}
        className={styles.hero}
        style={{ backgroundColor: shown.surround }}
        data-product={shown.id}
        aria-labelledby="hero-heading"
      >
        <SiteHeader />

        <div className={styles.media}>
          <HeroVideo
            request={request}
            catalogue={HERO_PRODUCTS}
            onSwitchStart={handleSwitchStart}
            onSwitchEnd={handleSwitchEnd}
          />
        </div>

        <div className={styles.gradient} aria-hidden />

        <h1 id="hero-heading" className={styles.headline}>
          <span className={styles.line}>
            <span className={styles.lineInner} style={delay(0.15)}>
              Picked at their peak.
            </span>
          </span>
          <span className={styles.line}>
            <span className={styles.lineInner} style={delay(0.27)}>
              Locked in at their best.
            </span>
          </span>
        </h1>

        {/* phones: reserves the space the footage's ring and pack occupy */}
        <div ref={stageRef} className={styles.stage} aria-hidden />

        <p className={styles.tagline}>
          <span className={styles.line}>
            <span className={styles.lineInner} style={delay(0.45)}>
              The Vegetable
            </span>
          </span>
          <span className={styles.line}>
            <span className={styles.lineInner} style={delay(0.55)}>
              Revolution
            </span>
          </span>
        </p>

        <p className={styles.blurb}>
          Madhusudan brings the highest quality frozen vegetables from its farms
          to your table, carrying forward a{" "}
          <strong>legacy of agricultural excellence since 1991.</strong>
        </p>

        <nav className={styles.cta} aria-label="More products" aria-busy={busy}>
          <ProductSlot slot={slots[0]} side="left" disabled={busy} onSelect={(el) => select(0, el)} />

          <a href="#products" className={styles.explore}>
            <span className={styles.ringWrap} aria-hidden>
              <Image src="/hero/explore-ring.svg" alt="" width={207} height={207} className={styles.ring} />
            </span>
            <span className={styles.discWrap} aria-hidden>
              <Image src="/hero/explore-disc.svg" alt="" width={132} height={132} className={styles.disc} />
            </span>
            <span className={styles.exploreLabel}>Explore</span>
          </a>

          <ProductSlot slot={slots[1]} side="right" disabled={busy} onSelect={(el) => select(1, el)} />
        </nav>

        <PartnerStrip />
      </section>
    </div>
  );
}
