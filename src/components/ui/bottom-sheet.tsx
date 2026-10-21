"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { hapticTap } from "@/lib/ui/haptics";
import { useOverlayLayer } from "@/lib/ui/overlayStack";

export type SheetSnap = "half" | "full";

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accessible title — rendered in the sheet header. */
  title: React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  /** Extra actions rendered between the title and the close button. */
  headerActions?: React.ReactNode;
  /** Snap heights offered, lowest first. Defaults to half + full. */
  snapPoints?: SheetSnap[];
  initialSnap?: SheetSnap;
  /** Sticky footer below the scrollable body. */
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

const SNAP_MAX_HEIGHT: Record<SheetSnap, string> = {
  half: "min(58dvh, 32rem)",
  full: "90dvh",
};

/** Drag past this (px) and the sheet dismisses. */
const DISMISS_DISTANCE = 120;
/** Drag past this (px) and the sheet changes snap point. */
const SNAP_DISTANCE = 64;
/** px/ms — a quick flick beats the distance thresholds. */
const FLICK_VELOCITY = 0.55;
const TRANSITION_MS = 220;

const SHEET_TRANSITION =
  "transform 220ms cubic-bezier(0.32, 0.72, 0, 1), max-height 220ms cubic-bezier(0.32, 0.72, 0, 1)";

type DragState = "idle" | "dragging" | "closing";

/**
 * Mobile bottom sheet primitive.
 *
 * Radix Dialog supplies the focus trap, Esc-to-close and outside-click
 * dismissal; on top of that this adds a drag handle with live follow, half/full
 * snap points and swipe-down-to-dismiss. The sheet is registered on the overlay
 * stack so the Android hardware back button closes it before it exits the app.
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  icon,
  badge,
  headerActions,
  snapPoints = ["half", "full"],
  initialSnap,
  footer,
  children,
  className,
  bodyClassName,
}: BottomSheetProps) {
  const baseSnap = initialSnap ?? snapPoints[0] ?? "half";
  const [snap, setSnap] = React.useState<SheetSnap>(baseSnap);
  const [dragY, setDragY] = React.useState(0);
  const [dragState, setDragState] = React.useState<DragState>("idle");
  const contentRef = React.useRef<HTMLDivElement>(null);
  const closingRef = React.useRef(false);
  const gesture = React.useRef<{
    startY: number;
    lastY: number;
    lastTime: number;
    velocity: number;
  } | null>(null);

  const onOpenChangeRef = React.useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  // Collapse to the initial snap each time the sheet is opened.
  React.useEffect(() => {
    if (open) {
      setSnap(baseSnap);
      setDragY(0);
      setDragState("idle");
      closingRef.current = false;
    }
  }, [open, baseSnap]);

  /** Animate the sheet off-screen, then hand the close back to the parent. */
  const requestClose = React.useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setDragState("closing");
    setDragY(contentRef.current?.offsetHeight ?? 640);
    window.setTimeout(() => {
      closingRef.current = false;
      setDragY(0);
      setDragState("idle");
      onOpenChangeRef.current(false);
    }, TRANSITION_MS - 20);
  }, []);

  useOverlayLayer(open, requestClose);

  const canSnapUp = snapPoints.includes("full");
  const canSnapDown = snapPoints.length > 1;
  const isFull = snap === "full";

  const handleRadixOpenChange = (next: boolean) => {
    if (next) {
      onOpenChangeRef.current(true);
      return;
    }
    requestClose();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (dragState === "closing") return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    gesture.current = {
      startY: e.clientY,
      lastY: e.clientY,
      lastTime: performance.now(),
      velocity: 0,
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    setDragState("dragging");
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || dragState !== "dragging") return;
    const now = performance.now();
    const dt = Math.max(1, now - g.lastTime);
    g.velocity = (e.clientY - g.lastY) / dt;
    g.lastY = e.clientY;
    g.lastTime = now;

    let next = e.clientY - g.startY;
    // Resist pulling up once the sheet is already at its tallest snap.
    if (next < 0 && (isFull || !canSnapUp)) next *= 0.25;
    setDragY(next);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g || dragState !== "dragging") return;
    try {
      if ((e.currentTarget as HTMLElement).hasPointerCapture?.(e.pointerId)) {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      }
    } catch {
      /* ignore */
    }

    const dy = dragY;
    const v = g.velocity;
    setDragState("idle");

    const wantUp = canSnapUp && !isFull && (dy < -SNAP_DISTANCE || v < -FLICK_VELOCITY);
    const wantDown = dy > SNAP_DISTANCE || v > FLICK_VELOCITY;

    if (wantUp) {
      hapticTap();
      setSnap("full");
      setDragY(0);
      return;
    }

    if (wantDown && dy > DISMISS_DISTANCE) {
      if (isFull && canSnapDown) {
        hapticTap();
        setSnap(snapPoints[0]);
        setDragY(0);
        return;
      }
      hapticTap("medium");
      requestClose();
      return;
    }

    if (wantDown && isFull && canSnapDown) {
      hapticTap();
      setSnap(snapPoints[0]);
      setDragY(0);
      return;
    }

    setDragY(0);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleRadixOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-slot="bottom-sheet-overlay"
          className="fixed inset-0 z-50 bg-black/40 duration-200 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <DialogPrimitive.Content
          ref={contentRef}
          data-slot="bottom-sheet-content"
          aria-describedby={undefined}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-xl border-t border-border/80 bg-card text-popover-foreground shadow-2xl outline-none font-sans",
            "data-open:animate-in data-open:slide-in-from-bottom motion-reduce:animate-none",
            className
          )}
          style={{
            maxHeight: SNAP_MAX_HEIGHT[snap],
            transform: `translateY(${dragY}px)`,
            transition: dragState === "dragging" ? "none" : SHEET_TRANSITION,
            paddingBottom: "var(--safe-bottom)",
          }}
        >
          {/* Drag handle + header */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="shrink-0 touch-none select-none cursor-grab active:cursor-grabbing"
          >
            <div className="flex justify-center pt-2 pb-1" aria-hidden>
              <span className="h-1 w-9 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="flex items-center justify-between gap-2 px-4 pb-3 ds-hairline-b">
              <div className="flex min-w-0 items-center gap-2">
                {icon}
                <DialogPrimitive.Title className="truncate font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                  {title}
                </DialogPrimitive.Title>
                {badge}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {headerActions}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={requestClose}
                  aria-label="Close"
                  className="size-9 rounded-none text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {description && (
            <DialogPrimitive.Description className="shrink-0 px-4 pt-2 text-[11px] leading-relaxed text-muted-foreground">
              {description}
            </DialogPrimitive.Description>
          )}

          {/* Scrollable body */}
          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto overscroll-contain py-1.5",
              bodyClassName
            )}
          >
            {children}
          </div>

          {footer && (
            <div className="shrink-0 ds-hairline-t px-4 py-3">{footer}</div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Rounded row used by the sheet menus (≥44px touch target). */
export function SheetRow({
  icon: Icon,
  label,
  description,
  hint,
  disabled,
  destructive,
  onClick,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: React.ReactNode;
  description?: React.ReactNode;
  hint?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-destructive={destructive ? "true" : undefined}
      className="flex min-h-[44px] w-full items-center gap-3 px-4 py-2.5 text-left font-sans text-xs text-foreground transition-colors hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none data-[destructive=true]:text-destructive data-[destructive=true]:hover:bg-destructive/10"
    >
      {Icon && <Icon className="size-icon shrink-0 text-muted-foreground" strokeWidth={1.75} />}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{label}</span>
        {description && (
          <span className="truncate text-[10.5px] font-normal text-muted-foreground">
            {description}
          </span>
        )}
      </span>
      {hint && (
        <span className="shrink-0 font-mono text-[9.5px] text-muted-foreground">{hint}</span>
      )}
    </button>
  );
}

/** Group heading inside a sheet body. */
export function SheetLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-3 pb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
      {children}
    </div>
  );
}
