"use client";

import React, { useMemo } from "react";
import { parseMarkdown } from "@/lib/markdown/parser";
import { BlockNode } from "@/lib/markdown/types";
import { RenderInline } from "@/components/preview/preview-elements";

/**
 * Compact block renderer for GitHub release notes.
 */
function ReleaseNoteBlock({ block }: { block: BlockNode }) {
  switch (block.type) {
    case "heading": {
      const isTop = block.level <= 2;
      return (
        <div
          className={
            isTop
              ? "font-semibold text-xs sm:text-sm text-foreground mt-2.5 mb-1 pt-1 border-t border-border/40 first:border-t-0 first:pt-0"
              : "font-medium text-[11px] uppercase tracking-wider text-muted-foreground mt-2 mb-0.5"
          }
        >
          {block.children.map((child, i) => (
            <RenderInline key={i} node={child} />
          ))}
        </div>
      );
    }

    case "paragraph":
      return (
        <p className="text-[11px] text-muted-foreground leading-relaxed my-1">
          {block.children.map((child, i) => (
            <RenderInline key={i} node={child} />
          ))}
        </p>
      );

    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag
          className={`space-y-1 my-1.5 pl-4 text-[11px] text-muted-foreground marker:text-brand/70 ${
            block.ordered ? "list-decimal" : "list-disc"
          }`}
        >
          {block.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {item.children.map((child, i) => (
                <RenderInline key={i} node={child} />
              ))}
            </li>
          ))}
        </Tag>
      );
    }

    case "thematic_break":
      return <div className="h-px bg-border/50 my-2" />;

    case "code_block":
      return (
        <pre className="p-2 bg-muted/60 text-[10px] font-mono overflow-x-auto my-1.5 rounded-none [scrollbar-width:thin]">
          <code>{block.code}</code>
        </pre>
      );

    case "blockquote":
      return (
        <blockquote className="border-l-2 border-brand/40 pl-2.5 my-1.5 italic text-muted-foreground font-sans text-[11px]">
          {block.children.map((child, i) => (
            <ReleaseNoteBlock key={i} block={child} />
          ))}
        </blockquote>
      );

    default:
      return null;
  }
}

/**
 * Renders raw markdown release notes with the app's own typography.
 */
export function ReleaseNotesMarkdown({ content }: { content: string }) {
  const ast = useMemo(() => {
    try {
      return parseMarkdown(content);
    } catch {
      return [];
    }
  }, [content]);

  if (!ast.length) {
    return (
      <p className="text-[11px] text-muted-foreground italic">
        No release notes provided.
      </p>
    );
  }

  return (
    <div className="space-y-1 text-left font-sans">
      {ast.map((block, idx) => (
        <ReleaseNoteBlock key={idx} block={block} />
      ))}
    </div>
  );
}
