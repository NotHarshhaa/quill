"use client";

import React from "react";
import { FileText, PenLine, Plus, Sparkles, Menu } from "lucide-react";
import { Corners } from "@/components/frame";
import { cn } from "@/lib/utils";
import { hapticTap } from "@/lib/ui/haptics";

export type MobileTab = "notes" | "editor" | "ai" | "more";

interface MobileTabBarProps {
  /** Currently selected screen (or the sheet that is open). */
  active: MobileTab;
  onNavigate: (tab: MobileTab) => void;
  onNewNote: () => void;
  className?: string;
}

/**
 * Bottom navigation for phone-sized viewports (< 768px / the Android APK).
 * Five items with a raised centre action; the active item gets the accent
 * colour plus a subtle indicator pill. Height is 56px with 44px+ touch
 * targets; the safe-area inset is applied by the parent shell.
 */
export function MobileTabBar({ active, onNavigate, onNewNote, className }: MobileTabBarProps) {
  const go = (tab: MobileTab) => () => {
    hapticTap();
    onNavigate(tab);
  };

  const create = () => {
    hapticTap("medium");
    onNewNote();
  };

  return (
    <nav
      aria-label="Primary"
      data-tour="tabbar"
      className={cn(
        "h-14 flex items-stretch bg-card/95 backdrop-blur-sm select-none",
        className
      )}
      style={{ boxShadow: "0 -1px 0 color-mix(in oklab, var(--foreground) 6%, transparent), var(--elevation-soft)" }}
    >
      <TabItem
        id="notes"
        label="Notes"
        icon={FileText}
        active={active === "notes"}
        onClick={go("notes")}
      />
      <TabItem
        id="editor"
        label="Editor"
        icon={PenLine}
        active={active === "editor"}
        onClick={go("editor")}
      />

      {/* Centre: raised New Note action */}
      <div className="relative flex-1 min-w-0">
        <button
          type="button"
          onClick={create}
          aria-label="New note"
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex size-12 items-center justify-center bg-brand text-brand-foreground shadow-lg ring-4 ring-background rounded-none transition-transform motion-reduce:transition-none active:scale-95"
        >
          <Corners size="sm" weight="thin" light />
          <Plus className="size-icon-lg" strokeWidth={1.75} />
        </button>
        <span className="absolute inset-x-0 bottom-1.5 text-center text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
          New
        </span>
      </div>

      <TabItem
        id="ai"
        label="AI"
        icon={Sparkles}
        active={active === "ai"}
        onClick={go("ai")}
        haspopup
      />
      <TabItem
        id="more"
        label="More"
        icon={Menu}
        active={active === "more"}
        onClick={go("more")}
        haspopup
      />
    </nav>
  );
}

function TabItem({
  id,
  label,
  icon: Icon,
  active,
  onClick,
  haspopup,
}: {
  id: MobileTab;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active: boolean;
  onClick: () => void;
  haspopup?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-haspopup={haspopup ? "dialog" : undefined}
      aria-expanded={haspopup ? active : undefined}
      data-tab={id}
      className="relative flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 min-h-[44px] px-1 transition-colors motion-reduce:transition-none"
    >
      {/* Subtle active indicator pill */}
      <span
        aria-hidden
        className={cn(
          "absolute top-0 h-0.5 w-8 rounded-full bg-brand transition-opacity motion-reduce:transition-none",
          active ? "opacity-100" : "opacity-0"
        )}
      />
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full transition-colors motion-reduce:transition-none",
          active ? "bg-brand/12 text-brand" : "text-muted-foreground"
        )}
      >
        <Icon className="size-icon-lg" strokeWidth={1.75} />
      </span>
      <span
        className={cn(
          "text-[10px] font-mono uppercase tracking-wide transition-colors motion-reduce:transition-none",
          active ? "text-brand font-semibold" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </button>
  );
}
