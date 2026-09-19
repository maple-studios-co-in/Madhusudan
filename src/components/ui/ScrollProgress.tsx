"use client";

import { useCallback, useRef, type HTMLAttributes, type ReactNode } from "react";
import { useScrollProgress, type ScrollEdge } from "@/lib/use-scroll-progress";

type Props = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  /** see ScrollRange: [element fraction, viewport fraction] */
  from: ScrollEdge;
  to: ScrollEdge;
  /** custom property written on the root (default `--p`) */
  property?: string;
};

/**
 * Writes the element's scroll progress through [from, to] to a custom property
 * (0…1, clamped, scrubbed in both directions). CSS drives the effect from it;
 * give the property a fallback for the no-JS state.
 */
export default function ScrollProgress({ children, from, to, property = "--p", ...rest }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const write = useCallback(
    (p: number) => {
      ref.current?.style.setProperty(property, p.toFixed(4));
    },
    [property],
  );
  useScrollProgress(ref, { from, to }, write);

  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  );
}
