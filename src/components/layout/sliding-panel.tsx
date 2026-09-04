"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Corners } from "@/components/frame";

interface SlidingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
  headerAction?: React.ReactNode;
}

/**
 * Docked library panel. On desktop it sits to the right of the rail and
 * reflows the document (flex sibling, no backdrop). On small screens it
 * becomes a floating drawer with a backdrop.
 */
export function SlidingPanel({
  isOpen,
  onClose,
  title,
  children,
  width = 340,
  headerAction,
}: SlidingPanelProps) {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 top-0 left-0 bottom-0 right-0 z-40 bg-black/25 transition-opacity duration-200 md:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Dock */}
      <aside
        aria-label={title}
        aria-hidden={!isOpen}
        className={cn(
          "relative flex flex-col h-full overflow-hidden bg-background transition-[width,transform,opacity] duration-200 ease-out",
          // Desktop: in-flow dock that reflows the document
          "md:static md:shrink-0 md:h-full",
          // Mobile: floating drawer that slides in from the left
          "fixed left-12 top-0 bottom-0 z-50 shadow-2xl",
          // Mobile drawer chrome
          "border-r border-border/70 max-md:border-r",
          // Size: fits viewport on mobile (minus collapsed rail), animated on desktop
          "max-md:w-[min(var(--dock-width),calc(100vw-3rem))]",
          isOpen
            ? "md:w-[var(--dock-width)] opacity-100 translate-x-0"
            : "md:w-0 md:border-r-0 opacity-0 -translate-x-full pointer-events-none"
        )}
        style={{ "--dock-width": `${width}px` } as React.CSSProperties}
      >
        <Corners size="sm" weight="thin" light />

        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/50 shrink-0">
          <h2 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground font-sans truncate">
            {title}
          </h2>
          <div className="flex items-center gap-0.5 shrink-0">
            {headerAction}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onClose}
              aria-label={`Close ${title}`}
              className="w-6 h-6 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
      </aside>
    </>
  );
}