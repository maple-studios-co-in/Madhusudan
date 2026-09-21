"use client";

import Image from "next/image";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import pack from "@/assets/products/sweet-corn.png";
import styles from "./freeze-fast.module.css";

/** the pack lands once its card's pack slot is this far down the screen */
const LANDING = 0.58;

/* the two drop shadows as a share of the pack's width:
   Freeze fast 0 26 34 blue-grey (564.28 wide) → Product universe 0 16 20 olive (238.605 wide) */
const SHADOW_FROM = { y: 26 / 564.28, blur: 34 / 564.28, rgba: [17, 58, 84, 0.24] };
const SHADOW_TO = { y: 16 / 238.605, blur: 20 / 238.605, rgba: [64, 79, 29, 0.16] };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const noSubscription = () => () => {};
/** false while rendering on the server and hydrating, true after */
const useIsClient = () =>
  useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );

/**
 * The sweet corn pack's trip from "Freeze fast" into "Product universe".
 *
 * Three elements take part, found by data attribute: the pinned scene's track
 * ([data-flight-track]), the pack on the back of the turning bag
 * ([data-flight-source]; anything marked [data-flight-hide] hides with it) and
 * the pack in the first product card
 * ([data-flight-target]) — the same image. Once the scene unpins, a copy of the
 * pack (fixed, portalled to <body> so no containing block traps it) takes the
 * place of the source and travels to the target, following both live
 * positions: it leaves moving with the scene, drops and shrinks into the card,
 * and arrives moving with the card, which then shows its own pack. Driven by
 * the scroll, so it runs backwards too. Reduced motion: no flight, both packs
 * stay where they are.
 */
export default function PackFlight() {
  const client = useIsClient();
  const flyerRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const flyer = flyerRef.current;
    const track = document.querySelector<HTMLElement>("[data-flight-track]");
    const source = document.querySelector<HTMLElement>("[data-flight-source]");
    const target = document.querySelector<HTMLElement>("[data-flight-target]");
    if (!flyer || !track || !source || !target) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // whatever draws the pack in the scene steps aside with it (PouchTurn's canvas)
    const away = [source, ...document.querySelectorAll<HTMLElement>("[data-flight-hide]")];

    let raf = 0;
    let shown = "";
    let baseW = 0;
    let baseH = 0;

    /**
     * phase 0: the pack is in the scene; 1: flying; 2: in the card. The copy
     * flies above everything, while in the scene the pack sits under the glass
     * cards — so for the first stretch of the flight (`fade` 0→1, the pack has
     * hardly moved) the scene's pack cross-fades into the copy instead of
     * jumping in front of the cards.
     */
    const show = (phase: number, fade = 1) => {
      const key = `${phase}:${fade.toFixed(3)}`;
      if (key === shown) return;
      shown = key;
      const gone = phase === 2 || (phase === 1 && fade >= 1);
      for (const el of away) {
        el.style.visibility = gone ? "hidden" : "";
        el.style.opacity = phase === 1 && !gone ? String(1 - fade) : "";
      }
      target.style.visibility = phase === 2 ? "" : "hidden";
      flyer.style.visibility = phase === 1 ? "visible" : "hidden";
      flyer.style.opacity = phase === 1 ? String(fade) : "";
    };

    const frame = () => {
      raf = 0;
      const vh = window.innerHeight;
      // scroll since the scene unpinned
      const past = vh - track.getBoundingClientRect().bottom;
      if (past <= 0) {
        show(0);
        return;
      }
      const a = source.getBoundingClientRect();
      const b = target.getBoundingClientRect();
      // scroll from unpinning until the card's pack reaches the landing line
      const span = b.top + b.height / 2 + past - LANDING * vh;
      const t = span > 1 ? Math.min(1, past / span) : 1;
      if (t >= 1) {
        show(2);
        return;
      }
      const e = t * t * (3 - 2 * t);
      // a gentle arc: across and down to size a little ahead of down, so it is
      // set into the card from above
      const ex = 1 - (1 - e) * (1 - e);
      if (!baseW) {
        baseW = a.width;
        baseH = a.height;
        flyer.style.width = `${baseW}px`;
        flyer.style.height = `${baseH}px`;
      }
      const x = lerp(a.left, b.left, ex);
      const y = lerp(a.top, b.top, e);
      const sx = lerp(a.width, b.width, ex) / baseW;
      const sy = lerp(a.height, b.height, ex) / baseH;
      // the shadow is set in the copy's own pixels, before its scale
      const oy = lerp(SHADOW_FROM.y, SHADOW_TO.y, ex) * baseW;
      const blur = lerp(SHADOW_FROM.blur, SHADOW_TO.blur, ex) * baseW;
      const [r, g, bl, al] = SHADOW_FROM.rgba.map((v, k) => lerp(v, SHADOW_TO.rgba[k], ex));
      flyer.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${sx}, ${sy})`;
      flyer.style.filter = `drop-shadow(0 ${oy.toFixed(1)}px ${blur.toFixed(1)}px rgba(${r | 0}, ${g | 0}, ${bl | 0}, ${al.toFixed(3)}))`;
      const f = Math.min(1, t / 0.1);
      show(1, f * f * (3 - 2 * f));
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onResize = () => {
      baseW = 0;
      schedule();
    };
    // on phones the product cards scroll sideways
    const row = target.closest("ul");
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    row?.addEventListener("scroll", schedule, { passive: true });
    frame();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      row?.removeEventListener("scroll", schedule);
      for (const el of away) {
        el.style.visibility = "";
        el.style.opacity = "";
      }
      target.style.visibility = "";
    };
  }, [client]);

  if (!client) return null;
  return createPortal(
    <Image
      ref={flyerRef}
      src={pack}
      alt=""
      aria-hidden
      sizes="(min-width: 1024px) 31vw, 60vw"
      loading="eager"
      fetchPriority="low"
      className={styles.flyer}
    />,
    document.body,
  );
}
