"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { PouchTurnRenderer } from "@/lib/pouch-turn";
import { useScrollProgress } from "@/lib/use-scroll-progress";
import styles from "./freeze-fast.module.css";

const TRACK = { from: [0, 0], to: [1, 1] } as const;

/* Figma 103:4340 in product-box units (564.28 × 696): image 25 (bag) at x 42,
   464 × 696; image 26 (pack) at 0, 564.28 × 674. The bodies are the photos'
   alpha bounds (u from–to, v from–to, v up). Same window as the CSS turn. */
const BOX: [number, number] = [564.28, 696];
const BAG = { rect: [42, 0, 464, 696], body: [0.018, 0.981, 0.043, 0.945] } as const;
const PACK = { rect: [0, 0, 564.28, 674], body: [0.085, 0.899, 0.01, 0.979] } as const;
const LOOK = { bulge: 56, distance: 2600, lift: 18, tilt: 7, turn: [0.18, 0.68] as [number, number] };

/**
 * The bag → pack turn as a real 3D pouch (WebGL, src/lib/pouch-turn.ts).
 *
 * Sits inside .product next to the CSS turn, which stays as the fallback: once
 * three.js is loaded (a couple of screens ahead) and both photos are decoded,
 * `data-gl="on"` on .product swaps the canvas in. The photos are the files the
 * laid-out <img>s already loaded ([data-pouch-front] / [data-pouch-back]), so
 * nothing is downloaded twice. Progress comes from the pinned track (data-flight-track).
 * The canvas is also hidden by PackFlight while the pack is in flight.
 */
export default function PouchTurn() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackRef = useRef<HTMLElement | null>(null);
  const rendererRef = useRef<PouchTurnRenderer | null>(null);
  const progressRef = useRef(0);

  // the track is an ancestor; find it before the progress hook subscribes
  useLayoutEffect(() => {
    trackRef.current = canvasRef.current?.closest<HTMLElement>("[data-flight-track]") ?? null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const product = canvas?.parentElement;
    const bag = product?.querySelector<HTMLImageElement>("[data-pouch-front]");
    const pack = product?.querySelector<HTMLImageElement>("[data-pouch-back]");
    if (!canvas || !product || !bag || !pack) return;

    let disposed = false;
    let ro: ResizeObserver | null = null;

    // WebGL sizes a texture from an <img>'s width/height attributes, which on the
    // page are the layout size, not the srcset file's; a detached copy of the
    // chosen file (from the cache) has its real size
    const photo = async (el: HTMLImageElement) => {
      await el.decode();
      const copy = new Image();
      copy.src = el.currentSrc || el.src;
      await copy.decode();
      return copy;
    };

    const start = async () => {
      try {
        const [{ PouchTurnRenderer }, front, back] = await Promise.all([
          import("@/lib/pouch-turn"),
          photo(bag),
          photo(pack),
        ]);
        if (disposed) return;
        const renderer = new PouchTurnRenderer(canvas, product, {
          box: BOX,
          front: { image: front, rect: [...BAG.rect], body: [...BAG.body] },
          back: { image: back, rect: [...PACK.rect], body: [...PACK.body] },
          ...LOOK,
        });
        rendererRef.current = renderer;
        renderer.setProgress(progressRef.current);
        ro = new ResizeObserver(() => renderer.resize());
        ro.observe(canvas);
        product.dataset.gl = "on";
      } catch {
        // no WebGL (or a photo failed): the CSS turn stays
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        void start();
      },
      { rootMargin: "150% 0px 150% 0px" },
    );
    io.observe(product);

    const onLost = () => delete product.dataset.gl;
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      disposed = true;
      io.disconnect();
      ro?.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      rendererRef.current?.dispose();
      rendererRef.current = null;
      delete product.dataset.gl;
    };
  }, []);

  const onProgress = useCallback((p: number) => {
    progressRef.current = p;
    rendererRef.current?.setProgress(p);
  }, []);
  useScrollProgress(trackRef, TRACK, onProgress);

  return <canvas ref={canvasRef} className={styles.gl} aria-hidden data-flight-hide />;
}
