"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, X, SkipForward, ArrowRight, ArrowLeft } from "lucide-react";

const TOUR_KEY = "quill_layout_tour_v1";

interface Step {
  /** CSS selector for the spotlight target. Null/undefined means centered. */
  target?: string;
  title: string;
  body: string;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function LayoutTour({
  open,
  onDone,
}: {
  open: boolean;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const steps = useMemo<Step[]>(
    () =>
      isMobile
        ? [
            {
              target: '[data-tour="tabbar"]',
              title: "Bottom tabs",
              body: "Notes, Write, AI and More — your primary actions always within thumb reach.",
            },
            {
              target: '[data-tour="search"]',
              title: "Search everything",
              body: "Tap the search icon to open one palette for notes, actions, tags and settings.",
            },
            {
              target: '[data-tour="canvas"]',
              title: "Write here",
              body: "Compose in Markdown, preview live, and stay in the flow.",
            },
          ]
        : [
            {
              target: '[data-tour="sidebar"]',
              title: "Your library",
              body: "All notes, favorites, trash and filters live in the left rail. Collapse it for focus.",
            },
            {
              target: '[data-tour="search"]',
              title: "Single entry point",
              body: "Everything lives in the palette: ⌘K / Ctrl+K. Actions, notes, tags, templates.",
            },
            {
              target: '[data-tour="ai"]',
              title: "Offline AI",
              body: "Run local ML summarizing, polishing and tagging — no cloud calls.",
            },
          ],
    [isMobile]
  );

  const measure = useCallback(() => {
    const s = steps[step];
    if (!s?.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(s.target) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    });
  }, [step, steps]);

  useEffect(() => {
    if (!open) return;
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, measure]);

  const finish = (persist = true) => {
    if (persist) {
      try {
        localStorage.setItem(TOUR_KEY, "done");
      } catch {}
    }
    onDone();
  };

  const next = () => {
    if (step < steps.length - 1) setStep((s) => s + 1);
    else finish(true);
  };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  if (!open) return null;

  const s = steps[step];
  const pad = 8;
  const tipStyle: React.CSSProperties = rect
    ? {
        top: Math.min(window.innerHeight - 200, rect.top + rect.height + pad),
        left: Math.max(12, Math.min(window.innerWidth - 340, rect.left)),
      }
    : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Layout tour"
      className="fixed inset-0 z-[140] flex items-stretch justify-stretch"
      style={{ background: "transparent" }}
    >
      {/* Dimmed overlay with a cutout for the spotlight target. */}
      <svg
        aria-hidden
        className="fixed inset-0 size-full"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - pad}
                y={rect.top - pad}
                width={rect.width + pad * 2}
                height={rect.height + pad * 2}
                rx="4"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="black"
          fillOpacity={0.52}
          mask="url(#tour-mask)"
          style={{ pointerEvents: "auto" }}
          onClick={() => finish(true)}
        />
      </svg>

      {/* Spotlight ring on the target. */}
      {rect && (
        <div
          aria-hidden
          className="fixed pointer-events-none rounded-sm"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 2px var(--brand), 0 0 24px var(--brand)",
          }}
        />
      )}

      {/* Tooltip card. */}
      <div
        className="fixed w-[320px] max-w-[calc(100vw-2rem)] rounded-none bg-card text-card-foreground shadow-soft-lg p-4"
        style={{ ...tipStyle }}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="text-xs font-semibold text-foreground">
            {s.title}
          </div>
          <button
            type="button"
            onClick={() => finish(true)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close tour"
          >
            <X className="size-icon-sm" />
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {s.body}
        </p>

        <div className="flex items-center justify-between mt-3">
          <div className="text-[10px] font-mono text-muted-foreground/60">
            {step + 1} / {steps.length}
          </div>
          <div className="flex gap-1.5">
            <Button
              size="xs"
              variant="ghost"
              disabled={step === 0}
              onClick={prev}
              className="h-7 px-2 text-[10.5px] normal-case tracking-normal"
            >
              <ArrowLeft className="size-3.5" />
              Back
            </Button>
            <Button
              size="xs"
              variant="default"
              onClick={next}
              className="h-7 px-2.5 text-[10.5px] normal-case tracking-normal"
            >
              {step === steps.length - 1 ? "Done" : "Next"}
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => finish(true)}
          className="mt-2 text-[10px] text-muted-foreground/60 hover:text-foreground flex items-center gap-1"
        >
          <SkipForward className="size-3" />
          Skip tour
        </button>
      </div>
    </div>
  );
}

export function hasSeenLayoutTour(): boolean {
  try {
    return localStorage.getItem(TOUR_KEY) === "done";
  } catch {
    return true;
  }
}