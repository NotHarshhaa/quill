import React from "react";
import { BlockNode, InlineNode, TableAlignment } from "@/lib/markdown/types";
import { Corners } from "@/components/frame";
import { Info, Lightbulb, AlertTriangle, ShieldAlert, Flame } from "lucide-react";

export function RenderInline({
  node,
  onNavigateWikiLink,
}: {
  node: InlineNode;
  onNavigateWikiLink?: (target: string) => void;
}): React.ReactNode {
  switch (node.type) {
    case "text":
      return node.value;
    case "bold":
      return (
        <strong className="font-semibold text-foreground">
          {node.children.map((child, i) => (
            <RenderInline key={i} node={child} onNavigateWikiLink={onNavigateWikiLink} />
          ))}
        </strong>
      );
    case "italic":
      return (
        <em className="italic">
          {node.children.map((child, i) => (
            <RenderInline key={i} node={child} onNavigateWikiLink={onNavigateWikiLink} />
          ))}
        </em>
      );
    case "strike":
      return (
        <del className="line-through text-muted-foreground">
          {node.children.map((child, i) => (
            <RenderInline key={i} node={child} onNavigateWikiLink={onNavigateWikiLink} />
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
            <RenderInline key={i} node={child} onNavigateWikiLink={onNavigateWikiLink} />
          ))}
        </a>
      );
    case "wikilink":
      return (
        <span
          onClick={() => onNavigateWikiLink?.(node.target)}
          className="inline-flex items-baseline px-1.5 py-0.2 mx-0.5 border-b border-dashed border-primary text-primary font-medium hover:border-solid hover:bg-primary/10 transition-colors cursor-pointer select-none"
          title={`Jump to note "${node.target}"`}
        >
          [[{node.label}]]
        </span>
      );
  }
}

export function RenderBlock({
  block,
  onToggleTask,
  onNavigateWikiLink,
}: {
  block: BlockNode;
  onToggleTask?: (taskIndex: number) => void;
  onNavigateWikiLink?: (target: string) => void;
}): React.ReactNode {
  switch (block.type) {
    case "heading": {
      const headingText = (
        <>
          {block.children.map((child, i) => (
            <RenderInline key={i} node={child} onNavigateWikiLink={onNavigateWikiLink} />
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
            <RenderInline key={i} node={child} onNavigateWikiLink={onNavigateWikiLink} />
          ))}
        </p>
      );

    case "blockquote":
      return (
        <blockquote className="border-l-2 border-primary/40 pl-4 my-4 italic text-foreground/80 font-sans">
          {block.children.map((child, i) => (
            <RenderBlock key={i} block={child} onToggleTask={onToggleTask} onNavigateWikiLink={onNavigateWikiLink} />
          ))}
        </blockquote>
      );

    case "callout": {
      const config = {
        note: {
          icon: Info,
          title: "Note",
          border: "border-blue-500/50 dark:border-blue-400/50",
          bg: "bg-blue-500/5 dark:bg-blue-950/20",
          text: "text-blue-700 dark:text-blue-300",
        },
        tip: {
          icon: Lightbulb,
          title: "Tip",
          border: "border-emerald-500/50 dark:border-emerald-400/50",
          bg: "bg-emerald-500/5 dark:bg-emerald-950/20",
          text: "text-emerald-700 dark:text-emerald-300",
        },
        warning: {
          icon: AlertTriangle,
          title: "Warning",
          border: "border-amber-500/50 dark:border-amber-400/50",
          bg: "bg-amber-500/5 dark:bg-amber-950/20",
          text: "text-amber-700 dark:text-amber-300",
        },
        important: {
          icon: ShieldAlert,
          title: "Important",
          border: "border-purple-500/50 dark:border-purple-400/50",
          bg: "bg-purple-500/5 dark:bg-purple-950/20",
          text: "text-purple-700 dark:text-purple-300",
        },
        caution: {
          icon: Flame,
          title: "Caution",
          border: "border-rose-500/50 dark:border-rose-400/50",
          bg: "bg-rose-500/5 dark:bg-rose-950/20",
          text: "text-rose-700 dark:text-rose-300",
        },
      }[block.variant];

      const IconComponent = config.icon;
      return (
        <div className={`relative my-4 border ${config.border} ${config.bg} p-3.5 sm:p-4 shadow-xs font-sans`}>
          <Corners size="sm" offset="border" weight="thin" light />
          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider mb-2 select-none">
            <IconComponent className={`size-4 ${config.text}`} />
            <span className={config.text}>{block.title || config.title}</span>
          </div>
          <div className="text-[15px] leading-relaxed text-foreground/90 space-y-1">
            {block.children.map((child, i) => (
              <RenderBlock key={i} block={child} onToggleTask={onToggleTask} onNavigateWikiLink={onNavigateWikiLink} />
            ))}
          </div>
        </div>
      );
    }

    case "table": {
      const getAlignClass = (align: TableAlignment) => {
        if (align === "center") return "text-center";
        if (align === "right") return "text-right";
        return "text-left";
      };

      return (
        <div className="relative my-6 overflow-x-auto border border-border/80 bg-card/60 shadow-xs">
          <Corners size="sm" offset="border" weight="thin" light />
          <table className="w-full text-left text-sm font-sans border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/60 font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                {block.headers.map((head, idx) => (
                  <th
                    key={idx}
                    className={`px-3.5 py-2.5 font-medium border-r border-border/60 last:border-r-0 ${getAlignClass(
                      head.align
                    )}`}
                  >
                    {head.children.map((child, i) => (
                      <RenderInline key={i} node={child} onNavigateWikiLink={onNavigateWikiLink} />
                    ))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="border-b border-border/40 last:border-b-0 hover:bg-muted/20 transition-colors"
                >
                  {row.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className={`px-3.5 py-2 border-r border-border/40 last:border-r-0 ${getAlignClass(
                        cell.align
                      )}`}
                    >
                      {cell.children.map((child, i) => (
                        <RenderInline key={i} node={child} onNavigateWikiLink={onNavigateWikiLink} />
                      ))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

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
                  <RenderInline key={i} node={child} onNavigateWikiLink={onNavigateWikiLink} />
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
