"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Fades and lifts its children into place the first time they scroll into
 * view.
 *
 * Two rules keep this from being decoration for its own sake:
 *
 *  - It only ever runs once per element. Content that re-animates every time
 *    it crosses the viewport is exhausting to scroll past twice.
 *  - Content starts visible and is hidden by an effect, not by the server
 *    output. If the JavaScript never runs, the page still reads — an animation
 *    should never be load-bearing for whether text can be seen.
 *
 * `prefers-reduced-motion` disables the movement entirely.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  /** Milliseconds, for staggering siblings. Keep under ~200. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Anything already on screen at load stays put — animating the hero out
    // from under someone who has just arrived reads as a broken page.
    if (node.getBoundingClientRect().top < window.innerHeight) return;

    setShown(false);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      // Fires a little before the element's edge, so the movement finishes
      // about when it reaches comfortable reading position.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none",
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
