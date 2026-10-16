"use client";

import React from "react";
import { ArrowLeft, PenLine, Eye, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { InlineEditableTitle } from "@/components/layout/top-bar";
import { hapticTap } from "@/lib/ui/haptics";

interface MobileHeaderProps {
  title?: string;
  onRename: (title: string) => void;
  /** Back arrow → return to the Notes list. */
  onBack: () => void;
  viewMode: "editor" | "preview";
  onViewModeChange: (mode: "editor" | "preview") => void;
  onOpenMore: () => void;
  className?: string;
}

/**
 * Slim phone top bar for the editor screen: back · title · Write/Preview
 * toggle (no Split on mobile) · ⋯ menu. 44px+ touch targets throughout.
 */
export function MobileHeader({
  title,
  onRename,
  onBack,
  viewMode,
  onViewModeChange,
  onOpenMore,
  className,
}: MobileHeaderProps) {
  return (
    <header
      className={cn(
        "md:hidden border-b border-border/80 shrink-0 bg-background/95 backdrop-blur-xs select-none",
        className
      )}
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <div className="h-14 px-1 flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => {
            hapticTap();
            onBack();
          }}
          aria-label="Back to notes"
          className="flex size-11 shrink-0 items-center justify-center text-muted-foreground transition-colors motion-reduce:transition-none hover:text-foreground active:bg-muted rounded-none"
        >
          <ArrowLeft className="size-[18px]" strokeWidth={1.75} />
        </button>

        <InlineEditableTitle
          value={title}
          onCommit={onRename}
          className="flex-1 max-w-none"
        />

        <div
          role="group"
          aria-label="View mode"
          className="flex shrink-0 items-center gap-0.5 bg-muted/40 p-0.5"
        >
          <ViewToggleButton
            active={viewMode === "editor"}
            icon={PenLine}
            label="Write"
            onClick={() => onViewModeChange("editor")}
          />
          <ViewToggleButton
            active={viewMode === "preview"}
            icon={Eye}
            label="Preview"
            onClick={() => onViewModeChange("preview")}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            hapticTap();
            onOpenMore();
          }}
          aria-label="More actions"
          aria-haspopup="dialog"
          className="flex size-11 shrink-0 items-center justify-center text-muted-foreground transition-colors motion-reduce:transition-none hover:text-foreground active:bg-muted rounded-none"
        >
          <MoreHorizontal className="size-[18px]" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}

function ViewToggleButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        hapticTap();
        onClick();
      }}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-11 w-11 items-center justify-center transition-colors motion-reduce:transition-none rounded-none",
        active ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
      )}
    >
      <Icon className="size-[18px]" strokeWidth={1.75} />
    </button>
  );
}
