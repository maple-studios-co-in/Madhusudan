"use client";

import { useEffect, useRef, type VideoHTMLAttributes } from "react";

type Props = Omit<VideoHTMLAttributes<HTMLVideoElement>, "autoPlay" | "loop" | "muted" | "preload"> & {
  src: string;
  poster?: string;
};

/**
 * Background footage that never stops: muted, looping, started about a screen
 * before it scrolls into view and kept running from then on. Any pause the
 * page did not ask for (tab switches, autoplay refusals, decoder hiccups) is
 * recovered on the next visibility change, interaction or watchdog tick.
 * Reduced-motion users get the poster.
 */
export default function LoopVideo({ src, poster, ...rest }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    video.muted = true;
    let started = false;
    const play = () => {
      if (!started || document.hidden) return;
      const p = video.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        near.disconnect();
        started = true;
        video.preload = "auto";
        play();
      },
      { rootMargin: "100% 0px 100% 0px" },
    );
    near.observe(video);

    const onPause = () => window.setTimeout(play, 120);
    const watchdog = window.setInterval(() => {
      if (started && video.paused && !document.hidden) play();
    }, 1500);
    video.addEventListener("pause", onPause);
    document.addEventListener("visibilitychange", play);
    window.addEventListener("pointerdown", play);
    window.addEventListener("keydown", play);
    window.addEventListener("touchstart", play, { passive: true });

    return () => {
      near.disconnect();
      window.clearInterval(watchdog);
      video.removeEventListener("pause", onPause);
      document.removeEventListener("visibilitychange", play);
      window.removeEventListener("pointerdown", play);
      window.removeEventListener("keydown", play);
      window.removeEventListener("touchstart", play);
    };
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
      disableRemotePlayback
      {...rest}
    />
  );
}
