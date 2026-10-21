"use client";

import { cn } from "@/lib/utils";
import { SaveStatus } from "@/hooks/useAutosave";

interface MobileStatusStripProps {
  saveStatus: SaveStatus;
  wordCount: number;
  /** Writing goal for the session — shows the live percentage when set. */
  writingGoal?: number;
  className?: string;
}

/**
 * Phone counterpart of the desktop status bar. The desktop bar is hidden
 * below 768px, which left phones without any save/word feedback — this thin
 * strip (22px) restores it right under the mobile header.
 */
export function MobileStatusStrip({
  saveStatus,
  wordCount,
  writingGoal = 0,
  className,
}: MobileStatusStripProps) {
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const goalPct =
    writingGoal > 0 ? Math.min(100, Math.round((wordCount / writingGoal) * 100)) : 0;

  return (
    <div
      className={cn(
        "md:hidden h-[22px] shrink-0 select-none flex items-center gap-2 px-3",
        "text-[10px] font-mono text-muted-foreground bg-muted/30",
        className
      )}
    >
      <span className="flex items-center gap-1.5">
        <span
          className={cn(
            "size-1.5 rounded-full",
            saveStatus === "saving" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
          )}
        />
        {saveStatus === "saving" ? "Saving" : "Saved"}
      </span>

      <span aria-hidden className="opacity-40">·</span>
      <span>
        {wordCount} {wordCount === 1 ? "word" : "words"}
      </span>

      <span aria-hidden className="opacity-40">·</span>
      <span>~{readingTime} min</span>

      {writingGoal > 0 && (
        <span className="ml-auto flex items-center gap-1 text-brand font-semibold">
          <span className="h-1 w-8 bg-muted rounded-full overflow-hidden">
            <span
              className="block h-full bg-brand"
              style={{ width: `${goalPct}%` }}
            />
          </span>
          {goalPct}%
        </span>
      )}
    </div>
  );
}
