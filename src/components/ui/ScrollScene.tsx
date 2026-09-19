"use client";

import { useCallback, useRef, type HTMLAttributes, type ReactNode } from "react";
import { useScrollProgress } from "@/lib/use-scroll-progress";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

const TRACK = { from: [0, 0], to: [1, 1] } as const;

/**
 * A scroll track for a pinned scene. Writes its progress to `--progress` on the
 * root: 0 while its top is at or below the top of the viewport, 1 once its bottom
 * reaches the bottom of the viewport. Give it a height taller than the screen and
 * a `position: sticky` child, then drive the child's styles from the variable.
 * Without JS the variable stays unset (use a fallback in CSS).
 */
export default function ScrollScene({ children, ...rest }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const write = useCallback((p: number) => {
    ref.current?.style.setProperty("--progress", p.toFixed(4));
  }, []);
  useScrollProgress(ref, TRACK, write);

  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  );
}
