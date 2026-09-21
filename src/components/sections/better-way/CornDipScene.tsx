"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { CornDipRenderer, type DipCorn, type DipFilm, type DipLayout, type DipMotion } from "@/lib/corn-dip-renderer";
import { useScrollProgress } from "@/lib/use-scroll-progress";
import styles from "./corn-dip-scene.module.css";

/*
 * The dip clip from frame 26 (every 2nd), graded to the section's lime; the
 * first 23 frames also exist with the clip's corn painted out above the water.
 * surface: the water line per frame (it climbs as the clip's camera follows the
 *          corn down)
 * corn:    the clip corn's kernel-body bottom and axis per painted frame: its
 *          drop by phase correlation, its tilt (about its middle) from the
 *          kernel mask. See README → "How much could you grow".
 */
const FILM: DipFilm = {
  base: "/frames/corn-dip-v4",
  width: 1280,
  height: 720,
  frames: 96,
  painted: 23,
  start: 4,
  surface: [
    468, 468, 468, 468, 468, 468, 468, 468, 468, 467, 465, 461, 457, 453, 450, 448, 445, 442, 439, 435, 430, 425,
    420, 413, 406, 398, 390, 382, 372, 363, 353, 343, 334, 327, 322, 313, 301, 289, 280, 271, 262, 254, 245, 236,
    228, 221, 213, 205, 197, 189, 182, 175, 169, 162, 156, 150, 144, 138, 133, 128, 122, 118, 113, 108, 104, 100,
    96, 92, 89, 85, 82, 79, 76, 74, 75, 76, 76, 74, 71, 67, 60, 52, 46, 41, 38, 35, 31, 27, 23, 19, 16, 13, 9, 6,
    2, 0,
  ],
  corn: [
    [643.6, 310.3, -1.09], [644.2, 335.1, -0.99], [644.6, 359.2, -0.91], [645.1, 384, -0.83],
    [645.8, 408.1, -0.7], [646.6, 432.5, -0.55], [647, 456.5, -0.49], [646.7, 480.4, -0.53],
    [645.9, 503.3, -0.68], [644.4, 525.8, -0.95], [642.2, 547.3, -1.36], [639, 568, -1.92],
    [635.3, 587.4, -2.6], [631.9, 605.9, -3.24], [629.3, 623.7, -3.69], [628.1, 640.2, -3.93],
    [627.2, 655.9, -4.09], [626.3, 670.6, -4.26], [625, 684.2, -4.5], [623.2, 696.8, -4.83],
    [620.7, 708.3, -5.29], [617.6, 718.5, -5.86], [613.6, 727.2, -6.6],
  ],
  handover: [16, 21],
  cornKernelWidth: 171.2,
  feather: [90, 40, 60],
  skyFade: 420,
};

/* The Figma corn (better-way/corn-cob.png, 1024 × 1536): kernel-body bottom,
   axis and kernel width in the image; stretched 6.4% along its axis to the
   clip's kernel length (642.7 vs 1223 × 171.2 / 346.7). */
const CORN: Omit<DipCorn, "src"> = {
  width: 1024,
  height: 1536,
  anchor: [173.1, 1392.1],
  axis: -27.8,
  kernelWidth: 346.7,
  stretch: 1.064,
  layoutRotate: -26.07,
};

/* The corn falls 8% of the screen onto the water, from rest and gathering
   speed; the clip carries on at that speed. Once it sinks the camera settles
   its middle (clip y ≈ 500) at 55% of the screen. The last frame is reached at
   94% of the film's scroll, the scrub easing out to half speed. */
const MOTION: DipMotion = { approachDrop: 0.08, settleY: 0.55, sunkY: 500, filmEnd: 0.94, endRate: 0.5 };

/* Mirrors better-way.module.css: --u1 = min(100cqw / 1430, 100svh / 1045),
   .corn box 819.72 tall at the top centre, image 458.754 wide. */
const LAYOUT: DipLayout = { unitWidth: 1430, unitHeight: 1045, boxTop: 0, boxHeight: 819.72, imageWidth: 458.754 };

/** share of the pinned scroll spent before the clip takes over (copy leaves, water rises) */
const APPROACH_END = 0.4;
const TRACK = { from: [0, 0], to: [1, 1] } as const;
const DESKTOP = "(min-width: 1024px)";

type Props = {
  /** the Figma corn image (static import src) — drawn crisp throughout */
  cornSrc: string;
  /** extra class for the sticky stage (the section's background goes here) */
  stageClassName?: string;
  /** layer that rises with the water (the wordmark band) */
  wordmark?: ReactNode;
  /** the section's copy and cards (and the laid-out corn); they travel up and away */
  children: ReactNode;
};

/**
 * "How much could you grow" as one pinned screen (desktop): while the page is
 * held, the copy and cards travel up and off the screen, the water rises, and
 * the crisp Figma corn falls into it; the dip clip, scrubbed by the scroll in
 * both directions, then drowns it. Phones get the static layout (see BetterWay).
 */
export default function CornDipScene({ cornSrc, stageClassName, wordmark, children }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CornDipRenderer | null>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const view = viewRef.current;
    const track = trackRef.current;
    if (!canvas || !stage || !view || !track) return;
    const mq = window.matchMedia(DESKTOP);
    let io: IntersectionObserver | null = null;
    let ro: ResizeObserver | null = null;

    const stop = () => {
      io?.disconnect();
      ro?.disconnect();
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };

    const start = () => {
      stop();
      if (!mq.matches) return;
      const renderer = new CornDipRenderer(canvas, stage, view, LAYOUT, FILM, { ...CORN, src: cornSrc }, MOTION, APPROACH_END);
      rendererRef.current = renderer;
      renderer.setProgress(progressRef.current);
      ro = new ResizeObserver(() => renderer.resize());
      ro.observe(view);
      // fetch a couple of screens ahead of the section
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            renderer.load();
            io?.disconnect();
          }
        },
        { rootMargin: "200% 0px 200% 0px" },
      );
      io.observe(track);
    };

    start();
    mq.addEventListener("change", start);
    return () => {
      mq.removeEventListener("change", start);
      stop();
    };
  }, [cornSrc]);

  const onProgress = useCallback((p: number) => {
    progressRef.current = p;
    const renderer = rendererRef.current;
    if (renderer) renderer.setProgress(p);
    else {
      stageRef.current?.style.setProperty("--a", "0");
      stageRef.current?.style.setProperty("--w", "0");
    }
  }, []);
  useScrollProgress(trackRef, TRACK, onProgress);

  return (
    <div ref={trackRef} className={styles.track}>
      <div ref={stageRef} className={`${styles.stage} ${stageClassName ?? ""}`}>
        <div ref={viewRef} className={styles.view}>
          <canvas ref={canvasRef} className={styles.film} aria-hidden />
          <div className={styles.band} aria-hidden>
            {wordmark}
          </div>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
