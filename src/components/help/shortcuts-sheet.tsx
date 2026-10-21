"use client";

import React from "react";
import { Keyboard } from "lucide-react";

import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { cn } from "@/lib/utils";

interface ShortcutGroup {
  title: string;
  items: { keys: string[]; label: string }[];
}

const GROUPS: ShortcutGroup[] = [
  {
    title: "Navigate",
    items: [
      { keys: ["Ctrl", "K"], label: "Command palette — every action" },
      { keys: ["Ctrl", "N"], label: "New note" },
      { keys: ["Ctrl", "Shift", "D"], label: "Open today's daily note" },
      { keys: ["Ctrl", "B"], label: "Toggle the library (outside the editor)" },
      { keys: ["Esc"], label: "Close a sheet · leave Zen · back to notes" },
    ],
  },
  {
    title: "Write",
    items: [
      { keys: ["Ctrl", "B"], label: "Bold" },
      { keys: ["Ctrl", "I"], label: "Italic" },
      { keys: ["Ctrl", "F"], label: "Find & replace" },
      { keys: ["Ctrl", "Z"], label: "Undo" },
      { keys: ["Ctrl", "Y"], label: "Redo" },
      { keys: ["/"], label: "Slash command menu" },
      { keys: ["Tab"], label: "Indent" },
      { keys: ["[["], label: "Wiki-link to another note" },
    ],
  },
  {
    title: "View",
    items: [
      { keys: ["Ctrl", "1"], label: "Write mode" },
      { keys: ["Ctrl", "2"], label: "Split mode" },
      { keys: ["Ctrl", "3"], label: "Preview mode" },
      { keys: ["Ctrl", "Shift", "F"], label: "Zen focus desk" },
    ],
  },
];

/**
 * Every keyboard shortcut in one place. On phones the sheet doubles as a
 * discoverability aid — the same actions are reachable from the More sheet
 * and the command palette.
 */
export function ShortcutsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Keyboard Shortcuts"
      icon={<Keyboard className="size-icon text-brand shrink-0" strokeWidth={1.75} />}
      drawerWidth="sm"
      snapPoints={["half", "full"]}
      bodyClassName="px-0 py-0"
    >
      <div className="px-4 py-3">
        {GROUPS.map((group) => (
          <section key={group.title} className="mb-4 last:mb-0">
            <h3 className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.title}
            </h3>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li
                  key={item.label + item.keys.join()}
                  className="flex items-center justify-between gap-3 py-1"
                >
                  <span className="min-w-0 flex-1 text-[12px] text-foreground">
                    {item.label}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {item.keys.map((key, i) => (
                      <kbd
                        key={key + i}
                        className={cn(
                          "flex h-6 min-w-6 items-center justify-center px-1.5 font-mono text-[10px]",
                          "bg-muted/70 text-foreground shadow-soft"
                        )}
                      >
                        {key}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </ResponsiveSheet>
  );
}
