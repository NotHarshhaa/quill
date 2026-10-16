"use client";

import { useCallback, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

export interface HorizontalSwipeOptions {
  /** Master switch — gestures are ignored while false. */
  enabled?: boolean;
  /** Minimum |dx| on release for the swipe to commit (px). */
  threshold?: number;
  /** How far the surface visually follows the finger (px). */
  maxDrag?: number;
  /** |dx| must exceed |dy| × ratio before a gesture is claimed. */
  ratio?: number;
  /** Minimum |dx| before the gesture is claimed at all (px). */
  slop?: number;
  /**
   * When false the hook never publishes a live offset, so the owning component
   * is not re-rendered on every pointer move (used by the full-screen editor
   * panes, where a re-render would be costly).
   */
  trackOffset?: boolean;
  /** Skip gestures that start inside a matching element (e.g. nested buttons). */
  ignoreSelector?: string;
  /** Skip gestures that start inside the focused editing surface. */
  ignoreFocusedEditable?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

export interface HorizontalSwipeState {
  /** Live horizontal offset to render (0 when idle). */
  dx: number;
  dragging: boolean;
  /** Spread onto the surface that owns the gesture. */
  bind: {
    onPointerDown: (e: ReactPointerEvent) => void;
    onPointerMove: (e: ReactPointerEvent) => void;
    onPointerUp: (e: ReactPointerEvent) => void;
    onPointerCancel: (e: ReactPointerEvent) => void;
  };
  /**
   * `true` when the last gesture actually moved the surface. Click handlers on
   * the same element should bail out (and reset the flag) to avoid turning a
   * swipe into a tap.
   */
  swipedRef: React.RefObject<boolean>;
}

const EDITABLE_TAGS = new Set(["TEXTAREA", "INPUT", "SELECT"]);

/**
 * Pointer-based horizontal swipe recogniser shared by the note rows (reveal
 * actions) and the editor panes (Write ↔ Preview). Vertical movement always
 * wins so in-surface scrolling keeps working; mouse pointers are ignored so
 * desktop drag interactions are never hijacked.
 */
export function useHorizontalSwipe(options: HorizontalSwipeOptions): HorizontalSwipeState {
  const {
    enabled = true,
    threshold = 64,
    maxDrag = 112,
    ratio = 1.4,
    slop = 10,
    trackOffset = true,
    ignoreSelector,
    ignoreFocusedEditable = false,
    onSwipeLeft,
    onSwipeRight,
    onSwipeStart,
    onSwipeEnd,
  } = options;

  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const swipedRef = useRef(false);
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    dx: number;
    active: boolean;
  } | null>(null);

  const releasePointer = (target: HTMLElement, id: number) => {
    try {
      if (target.hasPointerCapture?.(id)) target.releasePointerCapture(id);
    } catch {
      /* ignore */
    }
  };

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      swipedRef.current = false;
      if (!enabled) return;
      // Touch / pen only — never hijack a desktop mouse drag.
      if (e.pointerType === "mouse") return;
      if (e.isPrimary === false) return;

      const target = e.target as HTMLElement | null;
      if (ignoreSelector && target?.closest(ignoreSelector)) return;
      if (ignoreFocusedEditable) {
        const editable = target?.closest("textarea, input, [contenteditable='true']");
        if (editable && editable === document.activeElement) return;
      }

      gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, active: false };
    },
    [enabled, ignoreFocusedEditable, ignoreSelector]
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      const g = gesture.current;
      if (!g || g.id !== e.pointerId) return;

      g.dx = e.clientX - g.x;
      const dy = e.clientY - g.y;

      if (!g.active) {
        if (Math.abs(g.dx) < slop) return;
        // Let the surface scroll vertically unless the gesture is clearly horizontal.
        if (Math.abs(g.dx) < Math.abs(dy) * ratio) {
          gesture.current = null;
          return;
        }
        g.active = true;
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        setDragging(true);
        onSwipeStart?.();
      }

      if (trackOffset) {
        setDx(Math.max(-maxDrag, Math.min(maxDrag, g.dx)));
      }
    },
    [maxDrag, onSwipeStart, ratio, slop, trackOffset]
  );

  const finish = useCallback(
    (e: ReactPointerEvent) => {
      const g = gesture.current;
      gesture.current = null;
      if (!g || g.id !== e.pointerId) return;
      releasePointer(e.currentTarget as HTMLElement, e.pointerId);
      if (!g.active) return;

      const value = Math.max(-maxDrag, Math.min(maxDrag, g.dx));
      swipedRef.current = true;
      setDragging(false);
      setDx(0);
      onSwipeEnd?.();
      if (value <= -threshold) onSwipeLeft?.();
      else if (value >= threshold) onSwipeRight?.();
    },
    [maxDrag, onSwipeEnd, onSwipeLeft, onSwipeRight, threshold]
  );

  /**
   * The browser cancelled the pointer (it claimed the gesture for scrolling).
   * Never commit an action from a cancelled gesture.
   */
  const cancel = useCallback((e: ReactPointerEvent) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.id !== e.pointerId) return;
    releasePointer(e.currentTarget as HTMLElement, e.pointerId);
    if (!g.active) return;
    swipedRef.current = true;
    setDragging(false);
    setDx(0);
    onSwipeEnd?.();
  }, [onSwipeEnd]);

  return {
    dx,
    dragging,
    swipedRef,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: cancel,
    },
  };
}
