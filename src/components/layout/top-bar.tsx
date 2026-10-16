"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type TopBarIcon = React.ComponentType<{ className?: string; strokeWidth?: number }>;

/** Shared geometry for every desktop top-bar icon button: 36px, no border, subtle hover. */
export const topBarButtonClass =
  "size-9 rounded-none text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0";

/** Consistent lucide stroke width so every top-bar glyph matches. */
export const TOP_BAR_STROKE = 1.75;

export function TopBarGlyph({
  icon: Icon,
  className,
}: {
  icon: TopBarIcon;
  className?: string;
}) {
  return <Icon className={cn("size-icon", className)} strokeWidth={TOP_BAR_STROKE} />;
}

/**
 * A 36px, borderless, subtly-hovering icon button with a tooltip. Optionally
 * renders a keyboard-shortcut hint in the tooltip so the bar stays minimal but
 * the shortcuts stay discoverable.
 */
export function TopBarButton({
  label,
  shortcut,
  side = "bottom",
  active = false,
  className,
  children,
  ...props
}: {
  label: string;
  shortcut?: string;
  side?: "top" | "bottom";
  active?: boolean;
  children?: React.ReactNode;
} & Omit<React.ComponentProps<typeof Button>, "aria-label">) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          aria-pressed={active || undefined}
          className={cn(topBarButtonClass, active && "bg-muted text-foreground", className)}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side} className="font-sans text-xs">
        <span>{label}</span>
        {shortcut && <kbd className="ml-0.5 font-mono text-[10px] opacity-70">{shortcut}</kbd>}
      </TooltipContent>
    </Tooltip>
  );
}

export interface ViewSegment {
  value: string;
  label: string;
  icon: TopBarIcon;
  shortcut: string;
}

/**
 * Segmented view-mode control. Labels collapse to icon-only on narrower
 * widths; tooltips (with shortcuts) are always available.
 */
export function TopBarSegmentedControl({
  value,
  onChange,
  segments,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  segments: ViewSegment[];
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="View mode"
      className={cn("flex items-center gap-0.5 bg-muted/40 p-0.5", className)}
    >
      {segments.map((seg) => {
        const isActive = value === seg.value;
        const Icon = seg.icon;
        return (
          <Tooltip key={seg.value}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onChange(seg.value)}
                aria-pressed={isActive}
                aria-label={seg.label}
                className={cn(
                  "flex h-8 items-center justify-center gap-1.5 px-2.5 lg:px-3 text-xs font-medium rounded-none transition-colors",
                  isActive
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-4" strokeWidth={TOP_BAR_STROKE} />
                <span className="hidden lg:inline">{seg.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-sans text-xs">
              <span>{seg.label}</span>
              <kbd className="ml-0.5 font-mono text-[10px] opacity-70">{seg.shortcut}</kbd>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

/**
 * Inline-editable note title. Renders as a quiet text button; click to rename
 * in place. Enter/blur commits, Escape cancels. Purely renames the note — it
 * never touches the body content.
 */
export function InlineEditableTitle({
  value,
  onCommit,
  className,
}: {
  value?: string;
  onCommit: (title: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value || "");
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== (value || "")) onCommit(next);
    else if (!next) setDraft(value || "");
    setEditing(false);
  };

  const widthClass = "min-w-0 max-w-[min(40vw,20rem)]";

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            setDraft(value || "");
            setEditing(false);
          }
        }}
        aria-label="Note title"
        className={cn(
          widthClass,
          "bg-background px-2 py-1 text-sm font-medium text-foreground rounded-none outline-none ring-1 ring-ring/60",
          className
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Click to rename"
      className={cn(
        widthClass,
        "truncate px-2 py-1 text-left text-sm font-medium text-foreground rounded-none hover:bg-muted/60 transition-colors",
        className
      )}
    >
      {value || "Untitled"}
    </button>
  );
}
