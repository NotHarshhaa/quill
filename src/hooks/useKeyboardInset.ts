"use client";

import { useEffect, useState } from "react";

/**
 * Height (px) of the on-screen keyboard, plus the height the app shell may
 * actually occupy (`--app-h`).
 *
 * Two sources, in priority order:
 *  1. Native Android shell (`MainActivity`) writes `--kb-height` on
 *     `<html>` (API 30+). We observe the style attribute and read it back.
 *  2. Browser / iOS: `visualViewport` shrinks when the keyboard opens. We
 *     mirror the native contract by writing `--kb-height` ourselves.
 *
 * IMPORTANT — the keyboard height must never be subtracted twice:
 * depending on the OEM, the WebView is *either* resized by the OS for the
 * keyboard (the layout viewport no longer contains it) *or* left at full
 * height with the keyboard drawn on top. Subtracting `--kb-height` in the
 * first case leaves a dead strip at the bottom of the screen where the page
 * background shows through, and it also squeezes the whole shell (the mobile
 * tab bar / keyboard accessory bar) into a tiny band. `--app-h` is therefore
 * computed from what is *actually* visible:
 *
 *   --app-h = visible height of the viewport
 *
 * and the app shell uses `height: var(--app-h, 100dvh)`.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const visualViewport = window.visualViewport;
    const isNative = !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
      .Capacitor?.isNativePlatform?.();

    /**
     * Viewport height observed while no keyboard was on screen. Fallback
     * signal for detecting whether the OS already shrank the viewport.
     */
    let baselineHeight = window.innerHeight;

    const setAppHeight = (height: number) => {
      root.style.setProperty(
        "--app-h",
        `${Math.max(0, Math.round(height))}px`
      );
    };

    // --- Native path: trust the height injected by the Android shell ---------
    if (isNative) {
      const read = () => {
        const raw = getComputedStyle(root).getPropertyValue("--kb-height");
        const kb = Math.max(0, Math.round(Number.parseFloat(raw) || 0));
        const innerH = window.innerHeight;

        if (kb <= 0) {
          // No keyboard — the full viewport is usable again.
          baselineHeight = innerH;
          setAppHeight(innerH);
        } else {
          // Did the OS already resize the WebView for the keyboard?
          //
          // Geometric test that does not depend on the order in which the
          // resize and the `--kb-height` update arrive:
          //   viewport + keyboard <= screen  ->  the viewport already stops
          //   above the keyboard, so the height must NOT be subtracted again.
          // Otherwise the keyboard is drawn on top of a full-height viewport
          // and the height has to be subtracted.
          const screenH = window.screen?.height ?? 0;
          const alreadyResized =
            screenH > 0
              ? innerH + kb <= screenH + 48
              : innerH < baselineHeight - 24;

          const available = alreadyResized ? innerH : Math.max(0, innerH - kb);
          setAppHeight(available);
        }

        setInset(kb);
      };

      read();
      const observer = new MutationObserver(read);
      observer.observe(root, { attributes: true, attributeFilter: ["style"] });
      // The WebView resize can land before or after the CSS variable is
      // written, so re-measure on every viewport resize as well.
      window.addEventListener("resize", read);
      return () => {
        observer.disconnect();
        window.removeEventListener("resize", read);
        root.style.setProperty("--app-h", "100dvh");
      };
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
      // With the keyboard open only the visual viewport is usable; with it
      // closed keep the full layout viewport so the app can scroll under the
      // browser chrome as before.
      setAppHeight(
        next > 0 ? visualViewport.height + visualViewport.offsetTop : window.innerHeight
      );
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
      root.style.setProperty("--app-h", "100dvh");
    };
  }, []);

  return inset;
}
