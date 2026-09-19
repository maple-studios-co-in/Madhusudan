"use client";

import { useEffect, useRef, type VideoHTMLAttributes } from "react";

type Props = Omit<VideoHTMLAttributes<HTMLVideoElement>, "autoPlay" | "loop" | "muted" | "preload"> & {
  src: string;
  poster?: string;
  /** share of the video that must be visible before it plays */
  threshold?: number;
  /** keep playing in a loop instead of holding the last frame */
  loop?: boolean;
};

/**
 * Footage that plays when it scrolls into view. By default a one-shot moment:
 * plays from the start, holds its last frame, and rewinds once it has fully left
 * the viewport so it plays again on the next visit; with `loop` it keeps cycling
 * while visible (and still restarts from the top on the next visit).
 * Buffering starts about a screen before it arrives rather than with the page.
 * Pauses in hidden tabs; reduced-motion users get the poster.
 */
export default function InViewVideo({ src, poster, threshold = 0.45, loop = false, ...rest }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    video.muted = true;
    let visible = false;
    const play = () => {
      const p = video.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    const warm = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        video.preload = "auto";
        warm.disconnect();
      },
      { rootMargin: "100% 0px 100% 0px" },
    );
    warm.observe(video);

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio >= threshold && !visible) {
            visible = true;
            if (video.ended) video.currentTime = 0;
            play();
          } else if (entry.intersectionRatio === 0) {
            visible = false;
            video.pause();
            video.currentTime = 0;
          } else if (entry.intersectionRatio < threshold && visible) {
            visible = false;
            video.pause();
          }
        }
      },
      { threshold: [0, threshold] },
    );
    io.observe(video);

    const onVisibility = () => {
      if (document.hidden) video.pause();
      else if (visible && !video.ended) play();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      warm.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [threshold]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop={loop}
      playsInline
      preload="none"
      disablePictureInPicture
      disableRemotePlayback
      {...rest}
    />
  );
}
