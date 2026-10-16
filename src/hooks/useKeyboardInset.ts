"use client";

import { useEffect, useState } from "react";

/**
 * Height (px) of the on-screen keyboard, used to hide the mobile tab bar and
 * dock the keyboard accessory bar right above the keys.
 *
 * Two sources, in priority order:
 *  1. Native Android shell (`MainActivity`) writes `--kb-height` on
 *     `<html>` (API 30+). We observe the style attribute and read it back.
 *  2. Browser / iOS: `visualViewport` shrinks when the keyboard opens. We
 *     mirror the native contract by writing `--kb-height` ourselves so the
 *     app shell (`calc(100dvh - var(--kb-height))`) shrinks identically.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const visualViewport = window.visualViewport;
    const isNative = !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
      .Capacitor?.isNativePlatform?.();

    // --- Native path: trust the height injected by the Android shell ---------
    if (isNative) {
      const read = () => {
        const raw = getComputedStyle(root).getPropertyValue("--kb-height");
        const px = Number.parseFloat(raw) || 0;
        setInset(px > 0 ? Math.round(px) : 0);
      };
      read();
      const observer = new MutationObserver(read);
      observer.observe(root, { attributes: true, attributeFilter: ["style"] });
      return () => observer.disconnect();
    }

    // --- Web path: derive the inset from visualViewport ----------------------
    if (!visualViewport) return;
    let frame = 0;

    const measure = () => {
      const gap = Math.max(
        0,
        window.innerHeight - visualViewport.height - visualViewport.offsetTop
      );
      // Ignore browser chrome (address bar) which only accounts for a few px;
      // a real keyboard covers well over a third of the viewport.
      const next = gap > 150 ? Math.round(gap) : 0;
      root.style.setProperty("--kb-height", `${next}px`);
      setInset(next);
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    measure();
    visualViewport.addEventListener("resize", schedule);
    visualViewport.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      visualViewport.removeEventListener("resize", schedule);
      visualViewport.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      root.style.setProperty("--kb-height", "0px");
    };
  }, []);

  return inset;
}
