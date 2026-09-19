"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** share of the element that must be visible before it reveals */
  threshold?: number;
};

/**
 * Marks its root with `data-inview="false"` once hydrated and flips it to
 * `"true"` the first time the element scrolls into view. Styles key their
 * entrance animations off that attribute, so server-rendered HTML (and users
 * without JS) always see the content, and reduced-motion users get it at once.
 */
export default function RevealOnScroll({ children, threshold = 0.2, ...rest }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      el.dataset.inview = "true";
      return;
    }
    el.dataset.inview = "false";
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.inview = "true";
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  );
}
