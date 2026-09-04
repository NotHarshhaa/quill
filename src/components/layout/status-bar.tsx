"use client";

import { cn } from "@/lib/utils";
import { SaveStatus } from "@/hooks/useAutosave";

interface StatusBarProps {
  saveStatus: SaveStatus;
  wordCount: number;
  activeNoteTitle?: string;
  tags?: string[];
}

export function StatusBar({
  saveStatus,
  wordCount,
  activeNoteTitle,
  tags = [],
}: StatusBarProps) {
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="h-7 px-3 bg-muted/30 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground font-mono shrink-0">
      {/* Left Side */}
      <div className="flex items-center gap-3">
        {/* Save Status */}
        <span
          className={cn(
            "flex items-center gap-1",
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

        {/* Word Count */}
        <span>
          {wordCount} {wordCount === 1 ? "word" : "words"}
        </span>

        {/* Reading Time */}
        <span className="hidden sm:inline">
          ~{readingTime} min read
        </span>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Tags */}
        {tags.length > 0 && (
          <div className="hidden md:flex items-center gap-1">
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 bg-muted/60 text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
            {tags.length > 2 && (
              <span className="text-muted-foreground/60">+{tags.length - 2}</span>
            )}
          </div>
        )}

        {/* Note Title */}
        {activeNoteTitle && (
          <span className="hidden lg:inline text-muted-foreground/60 truncate max-w-[200px]">
            {activeNoteTitle}
          </span>
        )}
      </div>
    </div>
  );
}
