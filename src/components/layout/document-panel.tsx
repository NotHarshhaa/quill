"use client";

import React, { useMemo } from "react";
import {
  ListTree,
  Hash,
  Link2,
  FileText,
  History,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Corners } from "@/components/frame";
import { extractHeadings } from "@/lib/markdown/outline";
import { cn } from "@/lib/utils";

interface DocumentPanelProps {
  content: string;
  wordCount: number;
  backlinks?: { id: string; title: string }[];
  onNavigateWikiLink?: (target: string) => void;
  onOpenHistory?: () => void;
  onClose?: () => void;
  className?: string;
}

/**
 * Persistent right-side document panel for desktop (>=1024px). Houses the
 * document outline, linked mentions/backlinks, quick stats and a version
 * history entry point. On smaller screens the equivalent surfaces remain
 * drawers opened from the More menu.
 */
export function DocumentPanel({
  content,
  wordCount,
  backlinks = [],
  onNavigateWikiLink,
  onOpenHistory,
  onClose,
  className,
}: DocumentPanelProps) {
  const headings = useMemo(() => extractHeadings(content), [content]);
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleHeadingClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("bg-primary/10", "transition-colors", "duration-500");
    setTimeout(() => el.classList.remove("bg-primary/10"), 1500);
  };

  return (
    <aside
      aria-label="Document panel"
      className={cn(
        "relative flex flex-col h-full w-72 xl:w-80 shrink-0 border-l border-border/80 bg-card/50 overflow-hidden select-none font-sans",
        className
      )}
    >
      <Corners size="sm" offset="border" weight="thin" light />

      {/* Header */}
      <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between shrink-0 bg-background/50">
        <div className="flex items-center gap-2 min-w-0">
          <ListTree className="size-3.5 text-primary shrink-0" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground truncate">
            Document
          </span>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            aria-label="Hide document panel"
            className="size-6 rounded-none text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Outline */}
        <div className="px-2 py-2.5">
          <div className="px-1 pb-1.5 flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground/70">
            <span>Outline</span>
            <span className="font-normal opacity-60">({headings.length})</span>
          </div>
          {headings.length === 0 ? (
            <div className="px-1 py-4 text-center text-[11px] text-muted-foreground/60 font-sans">
              <Hash className="size-4 mx-auto mb-1.5 opacity-30" />
              Add # headings to build an outline.
            </div>
          ) : (
            <div className="space-y-0.5">
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
                      "w-full flex items-center gap-2 py-1.5 pr-2 rounded-none text-left text-xs transition-colors hover:bg-muted/70 group",
                      indentClass
                    )}
                  >
                    <span className="font-mono text-[10px] text-muted-foreground/50 shrink-0 group-hover:text-primary">
                      H{heading.level}
                    </span>
                    <span className="truncate flex-1 font-sans">{heading.text}</span>
                    <ChevronRight className="size-3 opacity-0 group-hover:opacity-60 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-px bg-border/50 mx-2" />

        {/* Linked mentions / backlinks */}
        <div className="px-2 py-2.5">
          <div className="px-1 pb-1.5 flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground/70">
            <Link2 className="size-3 text-primary" />
            <span>Linked mentions</span>
            <span className="font-normal opacity-60">({backlinks.length})</span>
          </div>
          {backlinks.length === 0 ? (
            <p className="px-1 py-1 text-[11px] text-muted-foreground/60 font-sans">
              No notes link here yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5 px-1">
              {backlinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => onNavigateWikiLink?.(link.title)}
                  className="relative text-[11px] px-2 py-1 bg-card/80 border border-border/80 hover:border-primary/60 text-foreground transition-all shadow-xs flex items-center gap-1.5 rounded-none max-w-full"
                >
                  <FileText className="size-3 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">{link.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer: stats + history */}
      <div className="border-t border-border/70 shrink-0">
        <div className="px-3 py-2 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
          <span>
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
          <span className="opacity-40">·</span>
          <span>~{readingTime} min read</span>
        </div>
        {onOpenHistory && (
          <button
            type="button"
            onClick={onOpenHistory}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-sans text-muted-foreground hover:text-foreground hover:bg-muted/50 border-t border-border/50 transition-colors"
          >
            <History className="size-3.5 shrink-0" />
            <span className="flex-1 text-left">Version history</span>
          </button>
        )}
      </div>
    </aside>
  );
}
