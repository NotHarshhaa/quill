"use client";

import { cn } from "@/lib/utils";
import { SaveStatus } from "@/hooks/useAutosave";

interface StatusBarProps {
  saveStatus: SaveStatus;
  wordCount: number;
  activeNoteTitle?: string;
  tags?: string[];
  writingGoal?: number;
  selectedTag?: string | null;
  onSelectTag?: (tag: string | null) => void;
}

export function StatusBar({
  saveStatus,
  wordCount,
}: StatusBarProps) {
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <footer
      className="max-md:hidden shrink-0 select-none flex items-center"
      style={{
        height: "var(--statusbar-h)",
        paddingInline: "var(--space-4)",
        paddingBottom: "var(--safe-bottom)",
        backgroundColor:
          "color-mix(in oklab, var(--muted) 55%, transparent)",
        boxShadow: "var(--elevation-soft)",
      }}
    >
      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground w-full">
        <span
          className={cn(
            "flex items-center gap-1.5",
            saveStatus === "saving" && "text-amber-600 dark:text-amber-400"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              saveStatus === "saving" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
            )}
          />
          {saveStatus === "saving" ? "Saving..." : "Saved"}
        </span>

        <span aria-hidden className="text-muted-foreground/40">·</span>

        <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>

        <span aria-hidden className="text-muted-foreground/40 hidden sm:inline">·</span>

        <span className="hidden sm:inline">~{readingTime} min read</span>
      </div>
    </footer>
  );
}