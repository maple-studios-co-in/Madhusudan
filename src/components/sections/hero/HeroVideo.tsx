"use client";

import { getImageProps } from "next/image";
import { useEffect, useRef, useSyncExternalStore } from "react";
import type { HeroProduct, HeroProductId } from "@/data/products";
import { HeroFootagePlayer, type FootageSource, type RevealOrigin } from "@/lib/hero-footage-player";
import styles from "./hero.module.css";

const DESKTOP_QUERY = "(min-width: 1024px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export type SwitchRequest = { id: HeroProductId; origin?: RevealOrigin; seq: number };

type Props = {
  /** product requested by the picker, with where the tap happened */
  request: SwitchRequest;
  /** every product, so the other clips can be warmed after the first one plays */
  catalogue: HeroProduct[];
  /** the new clip has started its reveal */
  onSwitchStart?: (id: HeroProductId) => void;
  /** the switch is complete */
  onSwitchEnd?: (id: HeroProductId) => void;
};

function subscribeDesktop(onChange: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** Desktop (landscape footage) vs phone/tablet (portrait footage). Server renders desktop. */
function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true,
  );
}

/** Best-effort cache warm-up of the clips the visitor may pick next. */
async function warm(sources: FootageSource[]) {
  for (const s of sources) {
    try {
      const res = await fetch(s.src, { priority: "low" } as RequestInit);
      await res.arrayBuffer();
    } catch {
      /* ignore */
    }
  }
}

/** Art-directed first frame: landscape on desktop, portrait on phones. */
function Poster({ product }: { product: HeroProduct }) {
  const common = { alt: "", sizes: "100vw", fetchPriority: "high" as const, loading: "eager" as const };
  const { landscape, portrait } = product.footage;
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({ ...common, src: landscape.poster, width: landscape.width, height: landscape.height });
  const {
    props: { srcSet: mobileSrcSet, ...rest },
  } = getImageProps({ ...common, src: portrait.poster, width: portrait.width, height: portrait.height });
  return (
    <picture>
      <source media={DESKTOP_QUERY} srcSet={desktopSrcSet} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt="" comes from getImageProps */}
      <img {...rest} srcSet={mobileSrcSet} className={styles.video} />
    </picture>
  );
}

/**
 * Poster + two <video> slides driven by HeroFootagePlayer.
 * Users who prefer reduced motion get the poster only.
 */
export default function HeroVideo({ request, catalogue, onSwitchStart, onSwitchEnd }: Props) {
  const desktop = useIsDesktop();
  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HeroFootagePlayer | null>(null);
  const pickRef = useRef<((p: HeroProduct) => FootageSource) | null>(null);
  const requestRef = useRef(request);
  const catalogueRef = useRef(catalogue);
  const callbacks = useRef({ onSwitchStart, onSwitchEnd });
  const product = catalogue.find((p) => p.id === request.id) ?? catalogue[0];

  useEffect(() => {
    callbacks.current = { onSwitchStart, onSwitchEnd };
  }, [onSwitchStart, onSwitchEnd]);

  useEffect(() => {
    requestRef.current = request;
  }, [request]);

  // (Re)create the player for the current footage variant.
  useEffect(() => {
    const a = aRef.current;
    const b = bRef.current;
    const poster = posterRef.current;
    if (!a || !b) return;
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

    const pick = (p: HeroProduct): FootageSource => {
      const v = desktop ? p.footage.landscape : p.footage.portrait;
      return { id: p.id, src: v.mp4, color: p.surround };
    };
    pickRef.current = pick;

    const first = catalogueRef.current.find((p) => p.id === requestRef.current.id) ?? catalogueRef.current[0];
    const player = new HeroFootagePlayer(a, b, {
      initial: pick(first),
      observe: a.closest("section"),
      onSwitchStart: (s) => callbacks.current.onSwitchStart?.(s.id as HeroProductId),
      onSwitchEnd: (s) => callbacks.current.onSwitchEnd?.(s.id as HeroProductId),
      onFirstFrame: () => {
        // The poster is frame 0; once the footage has faded in it can go.
        window.setTimeout(() => {
          if (poster) poster.style.opacity = "0";
        }, 700);
        const others = catalogueRef.current.filter((p) => p.id !== first.id).map(pick);
        const run = () => void warm(others);
        if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(run);
        else window.setTimeout(run, 2000);
      },
    });
    playerRef.current = player;

    return () => {
      player.dispose();
      playerRef.current = null;
      pickRef.current = null;
      if (poster) poster.style.opacity = "1";
    };
  }, [desktop]);

  // Follow the picker.
  useEffect(() => {
    const player = playerRef.current;
    const pick = pickRef.current;
    const next = catalogueRef.current.find((p) => p.id === request.id);
    if (!next) return;
    if (player && pick) {
      player.switchTo(pick(next), request.origin);
    } else {
      // No player (reduced motion): the poster swaps instantly, so does everything else.
      callbacks.current.onSwitchStart?.(next.id);
      callbacks.current.onSwitchEnd?.(next.id);
    }
  }, [request]);

  return (
    <>
      <div
        ref={posterRef}
        className={`${styles.slide} ${styles.posterSlide}`}
        style={{ backgroundColor: product.surround }}
        aria-hidden
      >
        <Poster product={product} />
      </div>
      <div className={styles.slide} aria-hidden>
        <video
          ref={aRef}
          className={styles.video}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          tabIndex={-1}
        />
      </div>
      <div className={styles.slide} aria-hidden>
        <video
          ref={bRef}
          className={styles.video}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          tabIndex={-1}
        />
      </div>
    </>
  );
}
