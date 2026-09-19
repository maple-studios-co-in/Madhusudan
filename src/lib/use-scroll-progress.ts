"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * A point on the element and a line on the viewport, as fractions of their
 * heights: `[0, 1]` = the element's top meets the viewport's bottom.
 */
export type ScrollEdge = readonly [element: number, viewport: number];

export type ScrollRange = {
  /** progress is 0 while the page is above this alignment */
  from: ScrollEdge;
  /** progress is 1 once the page is past this alignment */
  to: ScrollEdge;
};

/**
 * Calls `onProgress(p)` with the element's scroll progress through `range`
 * (0…1, clamped) on every animation frame in which it changes.
 *
 * The element's document offset is measured on resize only (the element, the
 * body and the window are observed), so scrolling itself never reads layout.
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  range: ScrollRange,
  onProgress: (p: number) => void,
) {
  const cb = useRef(onProgress);
  useEffect(() => {
    cb.current = onProgress;
  }, [onProgress]);

  const [fromEl, fromVp] = range.from;
  const [toEl, toVp] = range.to;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let start = 0;
    let end = 1;
    let frame = 0;
    let last = -1;

    const emit = () => {
      frame = 0;
      const span = end - start;
      const raw = span > 0 ? (window.scrollY - start) / span : window.scrollY >= end ? 1 : 0;
      const p = Math.min(1, Math.max(0, raw));
      if (Math.abs(p - last) < 0.0002) return;
      last = p;
      cb.current(p);
    };

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const vh = window.innerHeight;
      start = top + fromEl * rect.height - fromVp * vh;
      end = top + toEl * rect.height - toVp * vh;
      last = -1;
      emit();
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(emit);
    };

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    measure();

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref, fromEl, fromVp, toEl, toVp]);
}
