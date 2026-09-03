"use client";

import React, { useMemo } from "react";
import { ListTree, Hash, X, ChevronRight } from "lucide-react";
import { Corners } from "@/components/frame";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/markdown/parser";

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onJumpToHeading?: (id: string) => void;
}

export function TableOfContents({
  isOpen,
  onClose,
  content,
  onJumpToHeading,
}: TableOfContentsProps) {
  // Extract all headings from markdown
  const headings = useMemo(() => {
    const lines = content.replace(/\r\n/g, "\n").split("\n");
    const list: TocHeading[] = [];
    const counts = new Map<string, number>();

    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim().replace(/[*_~`]/g, "");
        if (text) {
          const baseSlug = slugify(text);
          const count = counts.get(baseSlug) || 0;
          counts.set(baseSlug, count + 1);
          const id = count === 0 ? baseSlug : `${baseSlug}-${count}`;
          list.push({ id, text, level });
        }
      }
    }
    return list;
  }, [content]);

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
        }, 1500);
      }
    }
    // On small screens, close after jump
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] bg-card/95 backdrop-blur-md border-l border-border/80 shadow-2xl flex flex-col font-sans select-none animate-in slide-in-from-right duration-200">
      <Corners size="sm" offset="border" weight="thin" light />

      {/* Header */}
      <div className="h-12 px-4 border-b border-border/70 flex items-center justify-between bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <ListTree className="size-4 text-primary" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
            Document Outline
          </span>
          <span className="text-[10.5px] font-mono text-muted-foreground">
            ({headings.length})
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
          className="h-7 w-7 rounded-none text-muted-foreground hover:text-foreground"
          aria-label="Close Outline"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Headings List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {headings.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground/60 p-4">
            <Hash className="size-8 mb-2 opacity-30" />
            <p className="text-xs">No headings found in this document.</p>
            <p className="text-[11px] text-muted-foreground/50 mt-1">
              Add headings with #, ##, or ### to generate an outline.
            </p>
          </div>
        ) : (
          headings.map((heading, idx) => {
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
                className={`w-full flex items-center gap-2 py-1.5 pr-2 rounded-none text-left text-xs transition-colors hover:bg-muted/80 group ${indentClass}`}
              >
                <span className="font-mono text-[10px] text-muted-foreground/50 shrink-0 group-hover:text-primary">
                  H{heading.level}
                </span>
                <span className="truncate flex-1 font-sans">{heading.text}</span>
                <ChevronRight className="size-3 opacity-0 group-hover:opacity-60 shrink-0 text-muted-foreground" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
