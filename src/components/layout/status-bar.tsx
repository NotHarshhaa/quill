"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { SaveStatus } from "@/hooks/useAutosave";
import {
  ListTree,
  Network,
  BarChart3,
  Keyboard,
  ArrowUpDown,
  Tag,
  CheckCircle2,
  Target,
  Scroll,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface StatusBarProps {
  saveStatus: SaveStatus;
  wordCount: number;
  charCount?: number;
  lineCount?: number;
  cursorPos?: { line: number; col: number } | null;
  activeNoteTitle?: string;
  tags?: string[];
  writingGoal?: number;
  selectedTag?: string | null;
  onSelectTag?: (tag: string | null) => void;
  onOpenTagManager?: () => void;
  isDocPanelOpen?: boolean;
  onToggleDocPanel?: () => void;
  onOpenGraph?: () => void;
  onOpenInsights?: () => void;
  onOpenShortcuts?: () => void;
  syncScroll?: boolean;
  onToggleSyncScroll?: () => void;
  isSplitView?: boolean;
}

export function StatusBar({
  saveStatus,
  wordCount,
  charCount = 0,
  lineCount,
  cursorPos,
  tags = [],
  writingGoal = 0,
  selectedTag,
  onSelectTag,
  onOpenTagManager,
  isDocPanelOpen,
  onToggleDocPanel,
  onOpenGraph,
  onOpenInsights,
  onOpenShortcuts,
  syncScroll = true,
  onToggleSyncScroll,
  isSplitView = false,
}: StatusBarProps) {
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const goalProgress = writingGoal > 0 ? Math.min(100, Math.round((wordCount / writingGoal) * 100)) : 0;
  const isGoalReached = writingGoal > 0 && wordCount >= writingGoal;

  return (
    <footer
      className="max-md:hidden shrink-0 select-none flex items-center border-t border-border/60 bg-muted/30 px-3 z-10"
      style={{
        height: "var(--statusbar-h, 28px)",
        paddingBottom: "var(--safe-bottom, 0px)",
      }}
    >
      <div className="flex items-center justify-between gap-3 text-[10.5px] font-mono text-muted-foreground w-full">
        {/* Left Section: Save Status, Word Count, Chars, Cursor Position */}
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <span
            className={cn(
              "flex items-center gap-1.5 transition-colors font-sans",
              saveStatus === "saving" ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full transition-all",
                saveStatus === "saving" ? "bg-amber-500 animate-pulse scale-110" : "bg-emerald-500"
              )}
            />
            {saveStatus === "saving" ? "Saving..." : "Saved"}
          </span>

          <span aria-hidden className="text-muted-foreground/30">·</span>

          <span className="tabular-nums">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>

          {charCount > 0 && (
            <>
              <span aria-hidden className="text-muted-foreground/30 hidden lg:inline">·</span>
              <span className="tabular-nums hidden lg:inline text-muted-foreground/75">
                {charCount} chars
              </span>
            </>
          )}

          {cursorPos && (
            <>
              <span aria-hidden className="text-muted-foreground/30 hidden xl:inline">·</span>
              <span className="tabular-nums hidden xl:inline text-muted-foreground/75">
                Ln {cursorPos.line}, Col {cursorPos.col}
              </span>
            </>
          )}

          <span aria-hidden className="text-muted-foreground/30 hidden sm:inline">·</span>
          <span className="hidden sm:inline text-muted-foreground/75">~{readingTime}m read</span>
        </div>

        {/* Center Section: Writing Goal & Active Tags */}
        <div className="flex items-center justify-center gap-2 flex-1 min-w-0 px-2 overflow-hidden">
          {writingGoal > 0 && (
            <div
              className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded-none text-[10px] font-mono border transition-all shrink-0",
                isGoalReached
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "bg-background/80 border-border/80 text-foreground"
              )}
            >
              {isGoalReached ? (
                <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
              ) : (
                <Target className="size-3 text-primary shrink-0" />
              )}
              <span>
                Goal: {wordCount}/{writingGoal}w ({goalProgress}%)
              </span>
              <div className="w-12 h-1.5 bg-muted rounded-none overflow-hidden ml-0.5">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    isGoalReached ? "bg-emerald-500" : "bg-primary"
                  )}
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Active Note Tags */}
          {tags.length > 0 ? (
            <div className="hidden lg:flex items-center gap-1 overflow-hidden shrink-0">
              {tags.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onSelectTag?.(selectedTag === tag ? null : tag)}
                  className={cn(
                    "px-1.5 py-0.2 text-[9.5px] font-mono transition-colors rounded-none truncate max-w-[100px]",
                    selectedTag === tag
                      ? "bg-brand-soft text-brand font-semibold"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground"
                  )}
                  title={`Filter by #${tag}`}
                >
                  #{tag}
                </button>
              ))}
              {tags.length > 3 && (
                <span className="text-[9px] text-muted-foreground/60 shrink-0">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          ) : (
            onOpenTagManager && (
              <button
                type="button"
                onClick={onOpenTagManager}
                className="hidden xl:inline-flex items-center gap-1 text-[9.5px] text-muted-foreground/50 hover:text-foreground transition-colors"
                title="Manage tags"
              >
                <Tag className="size-2.5 opacity-60" />
                <span>Add tags</span>
              </button>
            )
          )}
        </div>

        {/* Right Section: Quick Desktop Toggles & Navigation */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Synchronized Scrolling Toggle (in split view) */}
          {isSplitView && onToggleSyncScroll && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleSyncScroll}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-none text-[10px] transition-colors",
                    syncScroll
                      ? "text-primary hover:bg-muted font-medium"
                      : "text-muted-foreground/50 hover:text-foreground line-through opacity-70"
                  )}
                  aria-label="Toggle sync scrolling"
                >
                  <Scroll className="size-3" />
                  <span className="hidden xl:inline">Sync Scroll</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-sans">
                {syncScroll ? "Synchronized scrolling: On (Click to turn off)" : "Synchronized scrolling: Off (Click to turn on)"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Document Panel Toggle */}
          {onToggleDocPanel && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleDocPanel}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-none text-[10px] transition-colors",
                    isDocPanelOpen
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  aria-label="Document Outline & Info"
                >
                  <ListTree className="size-3" />
                  <span className="hidden lg:inline">Outline</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-sans">
                Document Outline & Backlinks (Ctrl+Shift+O)
              </TooltipContent>
            </Tooltip>
          )}

          {/* Knowledge Graph Quick Trigger */}
          {onOpenGraph && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onOpenGraph}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-none transition-colors"
                  aria-label="Knowledge Graph"
                >
                  <Network className="size-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-sans">
                Knowledge Graph (Ctrl+G)
              </TooltipContent>
            </Tooltip>
          )}

          {/* Writing Insights Quick Trigger */}
          {onOpenInsights && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onOpenInsights}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-none transition-colors"
                  aria-label="Writing Insights"
                >
                  <BarChart3 className="size-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-sans">
                Writing Analytics & Insights
              </TooltipContent>
            </Tooltip>
          )}

          {/* Keyboard Shortcuts Trigger */}
          {onOpenShortcuts && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onOpenShortcuts}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-none transition-colors"
                  aria-label="Keyboard Shortcuts"
                >
                  <Keyboard className="size-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-sans">
                Keyboard Shortcuts (?)
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </footer>
  );
}
