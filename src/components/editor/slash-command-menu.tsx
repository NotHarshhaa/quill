"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Heading1,
  Heading2,
  Heading3,
  ListTodo,
  List,
  ListOrdered,
  Table,
  Code,
  Quote,
  Minus,
  Info,
  Lightbulb,
  AlertTriangle,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import { Corners } from "@/components/frame";

export interface SlashCommand {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  snippet: string;
  placeholder?: string;
  action?: () => void;
}

interface SlashCommandMenuProps {
  isOpen: boolean;
  query: string;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

export function SlashCommandMenu({
  isOpen,
  query,
  onSelect,
  onClose,
  position,
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const commands: SlashCommand[] = [
    {
      id: "h1",
      title: "Heading 1",
      description: "Large section title",
      icon: Heading1,
      snippet: "# ",
      placeholder: "Heading 1",
    },
    {
      id: "h2",
      title: "Heading 2",
      description: "Medium section subheading",
      icon: Heading2,
      snippet: "## ",
      placeholder: "Heading 2",
    },
    {
      id: "h3",
      title: "Heading 3",
      description: "Small subsection header",
      icon: Heading3,
      snippet: "### ",
      placeholder: "Heading 3",
    },
    {
      id: "todo",
      title: "Task Checklist",
      description: "Interactive todo checkbox",
      icon: ListTodo,
      snippet: "- [ ] ",
      placeholder: "New task",
    },
    {
      id: "bullet",
      title: "Bullet List",
      description: "Simple bulleted list item",
      icon: List,
      snippet: "- ",
      placeholder: "List item",
    },
    {
      id: "ordered",
      title: "Numbered List",
      description: "Sequential numbered list",
      icon: ListOrdered,
      snippet: "1. ",
      placeholder: "First item",
    },
    {
      id: "table",
      title: "Data Table",
      description: "Ledger-style table with columns",
      icon: Table,
      snippet: "\n| Column 1 | Column 2 |\n| :--- | :--- |\n| Row 1 | Data |\n| Row 2 | Data |\n",
    },
    {
      id: "callout-note",
      title: "Note Callout",
      description: "GitHub-style blue note alert",
      icon: Info,
      snippet: "> [!NOTE]\n> Useful context or reminder.\n",
    },
    {
      id: "callout-tip",
      title: "Tip Callout",
      description: "Green helpful advice block",
      icon: Lightbulb,
      snippet: "> [!TIP]\n> Pro-tip or best practice recommendation.\n",
    },
    {
      id: "callout-warning",
      title: "Warning Callout",
      description: "Amber warning caution alert",
      icon: AlertTriangle,
      snippet: "> [!WARNING]\n> Critical notice or caution.\n",
    },
    {
      id: "code",
      title: "Code Block",
      description: "Fenced code block with syntax tag",
      icon: Code,
      snippet: "```typescript\n// Write code here\n```\n",
    },
    {
      id: "quote",
      title: "Blockquote",
      description: "Styled citation or quote block",
      icon: Quote,
      snippet: "> ",
      placeholder: "Quoted insight...",
    },
    {
      id: "divider",
      title: "Thematic Divider",
      description: "Horizontal break rule",
      icon: Minus,
      snippet: "\n---\n\n",
    },
    {
      id: "date",
      title: "Current Date",
      description: "Insert today's formatted timestamp",
      icon: Calendar,
      snippet: new Date().toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      }) + " ",
    },
    {
      id: "image",
      title: "Image Placeholder",
      description: "Insert markdown image syntax",
      icon: ImageIcon,
      snippet: "![Image caption](https://) ",
    },
  ];

  // Filter commands by query
  const filtered = commands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.id.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard events when menu is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filtered, onSelect, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (!containerRef.current) return;
    const selectedEl = containerRef.current.children[selectedIndex] as HTMLElement;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen || filtered.length === 0) return null;

  return (
    <div
      className="absolute z-50 w-72 bg-card/95 backdrop-blur-md border border-border/80 shadow-2xl overflow-hidden font-sans select-none animate-in fade-in zoom-in-95 duration-150"
      style={{
        top: position ? `${position.top}px` : "50px",
        left: position ? `${position.left}px` : "20px",
      }}
    >
      <Corners size="sm" offset="border" weight="thin" light />
      <div className="px-3 py-1.5 border-b border-border/60 bg-muted/40 flex items-center justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
        <span>Insert Element</span>
        <span>Esc to close</span>
      </div>

      <div ref={containerRef} className="max-h-60 overflow-y-auto p-1 space-y-0.5">
        {filtered.map((cmd, idx) => {
          const Icon = cmd.icon;
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={cmd.id}
              type="button"
              onClick={() => onSelect(cmd)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left text-xs transition-colors rounded-none ${
                isSelected
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-foreground hover:bg-muted/80"
              }`}
            >
              <Icon className={`size-3.5 shrink-0 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
              <div className="flex-1 min-w-0">
                <div className="truncate font-sans leading-tight">{cmd.title}</div>
                <div className={`text-[10.5px] truncate font-sans ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground/70"}`}>
                  {cmd.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
