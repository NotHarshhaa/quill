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
  activeNoteTitle,
  tags = [],
  writingGoal = 0,
  selectedTag,
  onSelectTag,
}: StatusBarProps) {
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const goalPct = writingGoal > 0 ? Math.min(100, Math.round((wordCount / writingGoal) * 100)) : 0;

  return (
    <footer
      className="bg-muted/30 border-t border-border/60 shrink-0 select-none"
      style={{
        paddingBottom: "var(--safe-bottom)",
      }}
    >
      <div className="h-7 px-3 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          {/* Save Status */}
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

          {/* Word Count */}
          <span>
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>

          {/* Reading Time */}
          <span className="hidden sm:inline">
            ~{readingTime} min read
          </span>

          {/* Writing Goal progress badge if set */}
          {writingGoal > 0 && (
            <span className="hidden xs:inline-flex items-center gap-1 text-primary font-semibold">
              <span>·</span>
              <span>Target: {goalPct}% ({wordCount}/{writingGoal}w)</span>
            </span>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Tags (Clickable to filter) */}
          {tags.length > 0 && (
            <div className="hidden md:flex items-center gap-1">
              {tags.slice(0, 3).map((tag) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onSelectTag?.(isSelected ? null : tag)}
                    className={cn(
                      "px-1.5 py-0.2 transition-colors border text-[9.5px]",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary font-semibold"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground border-border/50 hover:border-border"
                    )}
                    title={`Filter by #${tag}`}
                  >
                    #{tag}
                  </button>
                );
              })}
              {tags.length > 3 && (
                <span className="text-muted-foreground/60 text-[9px]">+{tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Note Title */}
          {activeNoteTitle && (
            <span className="hidden lg:inline text-muted-foreground/60 truncate max-w-[220px]">
              {activeNoteTitle}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
