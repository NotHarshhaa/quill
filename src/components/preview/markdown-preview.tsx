"use client";

import React from "react";
import { useMarkdownPreview } from "@/hooks/useMarkdownPreview";
import { RenderBlock } from "./preview-elements";
import { FileText, Link2 } from "lucide-react";
import { Corners } from "@/components/frame";
import { Badge } from "@/components/ui/badge";

interface MarkdownPreviewProps {
  content: string;
  onToggleTask?: (taskIndex: number) => void;
  onNavigateWikiLink?: (target: string) => void;
  backlinks?: { id: string; title: string }[];
}

export function MarkdownPreview({
  content,
  onToggleTask,
  onNavigateWikiLink,
  backlinks = [],
}: MarkdownPreviewProps) {
  const ast = useMarkdownPreview(content);

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative font-sans">
      <Corners size="sm" offset="border" weight="thin" light />
      {/* Preview Header Bar */}
      <div className="h-10 px-3 sm:px-6 border-b border-border/70 flex items-center justify-between select-none bg-background/50">
        <Badge variant="outline" className="relative text-[10px] tracking-widest font-mono font-semibold px-1.5 py-0.5 border border-border shadow-xs">
          <Corners size="sm" offset="border" weight="thin" light />
          <span className="hidden sm:inline">PREVIEW · </span>RENDERED
        </Badge>
      </div>

      {/* Rendered Preview Content */}
      <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
        {!content.trim() ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground/50">
            <FileText className="size-8 mb-2 opacity-30" />
            <p className="font-sans italic text-sm">Empty page. Type markdown on the left to see live preview.</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto font-sans pb-12">
            {ast.map((block, idx) => (
              <RenderBlock
                key={idx}
                block={block}
                onToggleTask={onToggleTask}
                onNavigateWikiLink={onNavigateWikiLink}
              />
            ))}

            {/* Linked Mentions / Backlinks Section */}
            {backlinks.length > 0 && (
              <div className="mt-14 pt-6 border-t border-border/60 relative font-sans">
                <div className="flex items-center gap-1.5 mb-3 text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground select-none">
                  <Link2 className="size-3.5 text-primary" />
                  <span>Linked Mentions ({backlinks.length})</span>
                </div>
                <p className="text-xs text-muted-foreground/80 mb-3 font-sans">
                  The following notes reference this document via <code className="text-foreground text-[11px]">[[{`...`}]]</code>:
                </p>
                <div className="flex flex-wrap gap-2">
                  {backlinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => onNavigateWikiLink?.(link.title)}
                      className="relative text-xs px-2.5 py-1.5 bg-card/80 border border-border/80 hover:border-primary/60 text-foreground transition-all shadow-xs flex items-center gap-1.5 cursor-pointer rounded-none"
                    >
                      <Corners size="sm" offset="border" weight="thin" light />
                      <FileText className="size-3 text-muted-foreground" />
                      <span className="font-medium">{link.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
