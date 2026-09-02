import React from "react";
import { BlockNode, InlineNode } from "@/lib/markdown/types";

export function RenderInline({ node }: { node: InlineNode }): React.ReactNode {
  switch (node.type) {
    case "text":
      return node.value;
    case "bold":
      return (
        <strong className="font-semibold text-foreground">
          {node.children.map((child, i) => (
            <RenderInline key={i} node={child} />
          ))}
        </strong>
      );
    case "italic":
      return (
        <em className="italic">
          {node.children.map((child, i) => (
            <RenderInline key={i} node={child} />
          ))}
        </em>
      );
    case "strike":
      return (
        <del className="line-through text-muted-foreground">
          {node.children.map((child, i) => (
            <RenderInline key={i} node={child} />
          ))}
        </del>
      );
    case "code":
      return (
        <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[0.85em] border border-border">
          {node.value}
        </code>
      );
    case "link":
      return (
        <a
          href={node.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground transition-colors"
        >
          {node.children.map((child, i) => (
            <RenderInline key={i} node={child} />
          ))}
        </a>
      );
  }
}

export function RenderBlock({
  block,
  onToggleTask,
}: {
  block: BlockNode;
  onToggleTask?: (taskIndex: number) => void;
}): React.ReactNode {
  switch (block.type) {
    case "heading": {
      const headingText = (
        <>
          {block.children.map((child, i) => (
            <RenderInline key={i} node={child} />
          ))}
        </>
      );

      switch (block.level) {
        case 1:
          return (
            <h1 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-6">
              {headingText}
            </h1>
          );
        case 2:
          return (
            <h2 className="font-sans text-2xl font-semibold tracking-tight text-foreground mt-7 mb-2">
              {headingText}
            </h2>
          );
        case 3:
          return (
            <h3 className="font-sans text-xl font-semibold tracking-tight text-foreground mt-6 mb-2">
              {headingText}
            </h3>
          );
        case 4:
          return (
            <h4 className="font-sans text-lg font-medium text-foreground mt-4 mb-2">
              {headingText}
            </h4>
          );
        default:
          return (
            <h5 className="font-sans text-base font-medium text-foreground mt-4 mb-1">
              {headingText}
            </h5>
          );
      }
    }

    case "paragraph":
      return (
        <p className="font-sans text-[15px] leading-relaxed text-foreground/90 my-3 sm:text-[16px]">
          {block.children.map((child, i) => (
            <RenderInline key={i} node={child} />
          ))}
        </p>
      );

    case "blockquote":
      return (
        <blockquote className="border-l-2 border-primary/40 pl-4 my-4 italic text-foreground/80 font-sans">
          {block.children.map((child, i) => (
            <RenderBlock key={i} block={child} onToggleTask={onToggleTask} />
          ))}
        </blockquote>
      );

    case "code_block":
      return (
        <div className="my-4 rounded border border-border bg-muted/60 p-4 font-mono text-xs overflow-x-auto">
          {block.language && (
            <div className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider mb-2">
              {block.language}
            </div>
          )}
          <pre className="text-foreground leading-relaxed">
            <code>{block.code}</code>
          </pre>
        </div>
      );

    case "list": {
      const ListTag = block.ordered ? "ol" : "ul";
      return (
        <ListTag
          className={
            block.ordered
              ? "list-decimal list-inside my-3 space-y-1.5 font-sans text-[15px]"
              : "list-none my-3 space-y-1.5 font-sans text-[15px]"
          }
        >
          {block.items.map((item, idx) => (
            <li key={idx} className="flex items-baseline gap-2 group/task">
              {item.checked !== undefined ? (
                <span className="inline-flex items-center select-none pt-0.5">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => {
                      if (item.taskIndex !== undefined && onToggleTask) {
                        onToggleTask(item.taskIndex);
                      }
                    }}
                    className="size-3.5 rounded-xs border-border/80 accent-primary text-primary cursor-pointer transition-transform active:scale-90 hover:border-foreground/60"
                  />
                </span>
              ) : !block.ordered ? (
                <span className="text-muted-foreground select-none">•</span>
              ) : null}
              <span
                onClick={() => {
                  if (item.checked !== undefined && item.taskIndex !== undefined && onToggleTask) {
                    onToggleTask(item.taskIndex);
                  }
                }}
                className={
                  item.checked !== undefined
                    ? item.checked
                      ? "line-through text-muted-foreground/70 transition-colors cursor-pointer select-none"
                      : "text-foreground/90 transition-colors cursor-pointer select-none"
                    : "text-foreground/90"
                }
              >
                {item.children.map((child, i) => (
                  <RenderInline key={i} node={child} />
                ))}
              </span>
            </li>
          ))}
        </ListTag>
      );
    }

    case "thematic_break":
      return <hr className="my-6 border-border/70" />;
  }
}
