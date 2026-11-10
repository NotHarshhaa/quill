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
  Copy,
  Printer,
  BarChart2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Corners } from "@/components/frame";
import { extractHeadings } from "@/lib/markdown/outline";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
 * document outline, linked mentions/backlinks, detailed document statistics,
 * quick export actions, and version history.
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

  const stats = useMemo(() => {
    const chars = content.length;
    const lines = content ? content.split("\n").length : 0;
    const paragraphs = content
      ? content.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length
      : 0;
    return { chars, lines, paragraphs };
  }, [content]);

  const handleHeadingClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("bg-primary/10", "transition-colors", "duration-500");
    setTimeout(() => el.classList.remove("bg-primary/10"), 1500);
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Markdown copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleCopyPlainText = async () => {
    try {
      // Strip common markdown markers
      const plain = content
        .replace(/^#+\s+/gm, "")
        .replace(/[*_~`]/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\[\[([^\]]+)\]\]/g, "$1");
      await navigator.clipboard.writeText(plain);
      toast.success("Plain text copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <aside
      aria-label="Document panel"
      className={cn(
        "relative flex flex-col h-full w-72 xl:w-80 shrink-0 border-l border-border/80 bg-card/60 overflow-hidden select-none font-sans shadow-soft",
        className
      )}
    >
      <Corners size="sm" offset="border" weight="thin" light />

      {/* Header */}
      <div className="h-12 px-3 border-b border-border/70 flex items-center justify-between shrink-0 bg-background/50">
        <div className="flex items-center gap-2 min-w-0">
          <ListTree className="size-4 text-primary shrink-0" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground truncate">
            Document Inspector
          </span>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            aria-label="Hide document panel"
            className="size-7 rounded-none text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 p-3">
        {/* Document Outline */}
        <div className="space-y-1.5">
          <div className="px-1 flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground/75">
            <span>Outline</span>
            <span className="font-normal opacity-60 font-mono">({headings.length})</span>
          </div>
          {headings.length === 0 ? (
            <div className="px-2 py-4 text-center text-xs text-muted-foreground/60 font-sans bg-muted/20 border border-border/40">
              <Hash className="size-4 mx-auto mb-1.5 opacity-40" />
              Add # headings in markdown to build an outline.
            </div>
          ) : (
            <div className="space-y-0.5 max-h-56 overflow-y-auto pr-1">
              {headings.map((heading, idx) => {
                const indentClass =
                  heading.level === 1
                    ? "pl-2 font-semibold text-foreground"
                    : heading.level === 2
                    ? "pl-4 text-foreground/90 font-medium"
                    : heading.level === 3
                    ? "pl-6 text-foreground/80"
                    : "pl-8 text-muted-foreground";
                return (
                  <button
                    key={`${heading.id}-${idx}`}
                    type="button"
                    onClick={() => handleHeadingClick(heading.id)}
                    className={cn(
                      "w-full flex items-center gap-2 py-1 pr-2 rounded-none text-left text-xs transition-colors hover:bg-muted/70 group",
                      indentClass
                    )}
                  >
                    <span className="font-mono text-[9.5px] text-muted-foreground/50 shrink-0 group-hover:text-primary">
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

        <div className="h-px bg-border/50" />

        {/* Linked Mentions / Backlinks */}
        <div className="space-y-1.5">
          <div className="px-1 flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground/75">
            <Link2 className="size-3 text-primary" />
            <span>Linked mentions</span>
            <span className="font-normal opacity-60 font-mono">({backlinks.length})</span>
          </div>
          {backlinks.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground/60 font-sans bg-muted/20 border border-border/40 text-center">
              No notes link here yet. Use [[Note Title]] to link notes.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
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

        <div className="h-px bg-border/50" />

        {/* Document Stats Card */}
        <div className="space-y-2">
          <div className="px-1 flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground/75">
            <BarChart2 className="size-3 text-primary" />
            <span>Document Metrics</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
            <div className="p-2 bg-muted/30 border border-border/50 rounded-none flex flex-col">
              <span className="text-[9.5px] uppercase text-muted-foreground/70">Words</span>
              <span className="font-semibold text-foreground text-sm tabular-nums">{wordCount}</span>
            </div>
            <div className="p-2 bg-muted/30 border border-border/50 rounded-none flex flex-col">
              <span className="text-[9.5px] uppercase text-muted-foreground/70">Characters</span>
              <span className="font-semibold text-foreground text-sm tabular-nums">{stats.chars}</span>
            </div>
            <div className="p-2 bg-muted/30 border border-border/50 rounded-none flex flex-col">
              <span className="text-[9.5px] uppercase text-muted-foreground/70">Read Time</span>
              <span className="font-semibold text-foreground text-sm tabular-nums">~{readingTime} min</span>
            </div>
            <div className="p-2 bg-muted/30 border border-border/50 rounded-none flex flex-col">
              <span className="text-[9.5px] uppercase text-muted-foreground/70">Paragraphs</span>
              <span className="font-semibold text-foreground text-sm tabular-nums">{stats.paragraphs}</span>
            </div>
          </div>
        </div>

        <div className="h-px bg-border/50" />

        {/* Quick Actions */}
        <div className="space-y-1.5">
          <div className="px-1 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground/75">
            Quick Actions
          </div>
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant="outline"
              size="xs"
              onClick={handleCopyMarkdown}
              className="text-[11px] h-7 rounded-none justify-start font-sans"
            >
              <Copy className="size-3 mr-1 text-muted-foreground" />
              Copy MD
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={handleCopyPlainText}
              className="text-[11px] h-7 rounded-none justify-start font-sans"
            >
              <FileText className="size-3 mr-1 text-muted-foreground" />
              Plain Text
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={handlePrint}
              className="text-[11px] h-7 rounded-none justify-start font-sans col-span-2"
            >
              <Printer className="size-3 mr-1 text-muted-foreground" />
              Print / Save PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Footer: Version History */}
      {onOpenHistory && (
        <div className="border-t border-border/70 shrink-0 p-2 bg-background/50">
          <button
            type="button"
            onClick={onOpenHistory}
            className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-sans text-muted-foreground hover:text-foreground hover:bg-muted/70 border border-border/60 transition-colors rounded-none"
          >
            <History className="size-3.5 shrink-0 text-primary" />
            <span>Version History</span>
          </button>
        </div>
      )}
    </aside>
  );
}
