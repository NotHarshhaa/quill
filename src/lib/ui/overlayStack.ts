"use client";

import { useEffect, useRef } from "react";

interface OverlayEntry {
  id: symbol;
  close: () => void;
}

/**
 * LIFO registry of the overlays that are currently open (bottom sheets, side
 * drawers, …). The Android hardware back button drains this before it falls
 * back to shell navigation, so the newest layer always closes first.
 */
const stack: OverlayEntry[] = [];

/** Close the top-most registered overlay. Returns false when the stack is empty. */
export function closeTopOverlay(): boolean {
  const top = stack[stack.length - 1];
  if (!top) return false;
  stack.pop();
  top.close();
  return true;
}

/** Number of overlays currently registered (useful for diagnostics/tests). */
export function overlayDepth(): number {
  return stack.length;
}

/**
 * Register `close` on the overlay stack while `open` is true. `close` is read
 * through a ref so callers can pass an inline arrow without re-ordering the
 * stack on every render.
 */
export function useOverlayLayer(open: boolean, close: () => void): void {
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!open) return;
    const entry: OverlayEntry = {
      id: Symbol("overlay"),
      close: () => closeRef.current(),
    };
    stack.push(entry);
    return () => {
      const index = stack.indexOf(entry);
      if (index >= 0) stack.splice(index, 1);
    };
  }, [open]);
}
