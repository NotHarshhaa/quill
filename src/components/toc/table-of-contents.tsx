"use client";

import React, { useMemo } from "react";
import { ListTree, Hash, ChevronRight } from "lucide-react";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { extractHeadings, type TocHeading } from "@/lib/markdown/outline";
import { cn } from "@/lib/utils";

export type { TocHeading };

interface TableOfContentsProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onJumpToHeading?: (id: string) => void;
}

/**
 * Document outline. Bottom sheet on phones and a right-side drawer on tablets
 * (desktop ≥1024px docks the persistent DocumentPanel instead).
 */
export function TableOfContents({
  isOpen,
  onClose,
  content,
  onJumpToHeading,
}: TableOfContentsProps) {
  // Extract all headings from markdown
  const headings = useMemo(() => extractHeadings(content), [content]);

  const handleHeadingClick = (id: string) => {
    if (onJumpToHeading) {
      onJumpToHeading(id);
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.add("bg-primary/10", "transition-colors", "duration-500");
        setTimeout(() => {
          el.classList.remove("bg-primary/10");
        }, 1200);
      }
    }
    // On small screens, close after jump so the note is visible again
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <ResponsiveSheet
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Document Outline"
      icon={<ListTree className="size-4 shrink-0 text-primary" strokeWidth={1.75} />}
      badge={
        <span className="shrink-0 font-mono text-[10.5px] text-muted-foreground">
          ({headings.length})
        </span>
      }
      drawerWidth="md"
      snapPoints={["half", "full"]}
      initialSnap="half"
      bodyClassName="p-3"
    >
      {headings.length === 0 ? (
        <div className="flex h-full min-h-[8rem] flex-col items-center justify-center p-4 text-center text-muted-foreground/60">
          <Hash className="mb-2 size-8 opacity-30" />
          <p className="text-xs">No headings found in this document.</p>
          <p className="mt-1 text-[11px] text-muted-foreground/50">
            Add headings with #, ##, or ### to generate an outline.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {headings.map((heading, idx) => {
            const indentClass =
              heading.level === 1
                ? "pl-2 font-semibold text-foreground"
                : heading.level === 2
                  ? "pl-5 text-foreground/90 font-medium"
                  : heading.level === 3
                    ? "pl-8 text-foreground/80"
                    : "pl-11 text-muted-foreground";

            return (
              <button
                key={`${heading.id}-${idx}`}
                type="button"
                onClick={() => handleHeadingClick(heading.id)}
                className={cn(
                  "group flex w-full items-center gap-2 rounded-none py-1.5 pr-2 text-left text-xs transition-colors hover:bg-muted/80",
                  indentClass
                )}
              >
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50 group-hover:text-primary">
                  H{heading.level}
                </span>
                <span className="flex-1 truncate font-sans">{heading.text}</span>
                <ChevronRight className="size-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-60" />
              </button>
            );
          })}
        </div>
      )}
    </ResponsiveSheet>
  );
}
