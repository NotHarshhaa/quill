"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe `window.matchMedia` hook. Returns `defaultValue` on the server and
 * on the first client render so markup stays stable, then syncs to the real
 * media query state from an effect.
 */
export function useMediaQuery(query: string, defaultValue = false): boolean {
  const [matches, setMatches] = useState(defaultValue);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);

  return matches;
}

/** True on phone-sized viewports (< 768px), where the mobile shell takes over. */
export function useIsMobileShell(): boolean {
  return useMediaQuery("(max-width: 767px)");
}
