"use client";

import React from "react";
import { useMarkdownPreview } from "@/hooks/useMarkdownPreview";
import { RenderBlock } from "./preview-elements";
import { FileText } from "lucide-react";
import { Corners } from "@/components/frame";
import { Badge } from "@/components/ui/badge";

interface MarkdownPreviewProps {
  content: string;
  onToggleTask?: (taskIndex: number) => void;
}

export function MarkdownPreview({ content, onToggleTask }: MarkdownPreviewProps) {
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
          <div className="max-w-2xl mx-auto font-sans">
            {ast.map((block, idx) => (
              <RenderBlock key={idx} block={block} onToggleTask={onToggleTask} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
