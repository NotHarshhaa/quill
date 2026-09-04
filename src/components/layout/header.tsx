"use client";

import { useTheme } from "next-themes";
import {
  Download,
  Moon,
  Sun,
  Laptop,
  Command,
  Pin,
  PanelLeft,
  Edit3,
  Eye,
  Columns,
  History,
  Printer,
  Maximize2,
  Target,
  Menu,
  Network,
  ListTree,
  BarChart3,
  Headphones,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QuillLogo } from "./quill-logo";
import { Corners } from "@/components/frame";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { notesRepository } from "@/lib/storage/notesRepository";
import { Note } from "@/lib/storage/schema";
import { SaveStatus } from "@/hooks/useAutosave";
import { AmbientSoundPlayer } from "@/components/audio/ambient-sound-player";
import { toast } from "sonner";

export type ViewMode = "editor" | "split" | "preview";

interface HeaderProps {
  activeNote?: Note;
  wordCount: number;
  saveStatus: SaveStatus;
  onOpenCommandPalette?: () => void;
  onTogglePin?: (id: string) => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onOpenHistory?: () => void;
  onPrintNote?: () => void;
  onToggleZen?: () => void;
  writingGoal?: number;
  onSetWritingGoal?: (goal: number) => void;
  onOpenGraph?: () => void;
  onOpenToc?: () => void;
  onOpenInsights?: () => void;
  onOpenWelcome?: () => void;
}

export function Header({
  activeNote,
  wordCount,
  saveStatus,
  onOpenCommandPalette,
  onTogglePin,
  onToggleSidebar,
  isSidebarOpen,
  viewMode,
  onViewModeChange,
  onOpenHistory,
  onPrintNote,
  onToggleZen,
  writingGoal = 0,
  onSetWritingGoal,
  onOpenGraph,
  onOpenToc,
  onOpenInsights,
  onOpenWelcome,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const handleExport = () => {
    if (!activeNote) return;
    notesRepository.exportNote(activeNote);
    toast.success(`Exported "${activeNote.title || 'Untitled'}.md"`);
  };

  return (
    <header className="w-full h-12 border-b border-border/70 px-2 sm:px-4 md:px-6 flex items-center justify-between bg-background/80 backdrop-blur-xs select-none font-sans shrink-0 gap-1.5 sm:gap-2">
      {/* Left: Sidebar Toggle, Logo & Quick Command Palette Trigger */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink-0">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onToggleSidebar}
            className={`h-7 w-7 rounded-none shrink-0 transition-colors ${
              isSidebarOpen
                ? "text-foreground hover:text-foreground hover:bg-muted/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <PanelLeft className="size-4" />
          </Button>
        )}

        <QuillLogo />

        {onOpenCommandPalette && (
          <Button
            variant="outline"
            size="xs"
            onClick={onOpenCommandPalette}
            className="relative items-center gap-1.5 h-7 px-1.5 sm:px-2 text-xs font-sans text-muted-foreground hover:text-foreground bg-background/60 border border-border/80 shadow-xs shrink-0 rounded-none"
            title="Open Command Palette (Ctrl+K)"
          >
            <Corners size="sm" offset="border" weight="thin" light />
            <Command className="size-3" />
            <span className="hidden lg:inline text-[11px]">Command</span>
            <kbd className="hidden lg:inline-block font-mono text-[9.5px] px-1 py-0.2 rounded-xs bg-muted border border-border/60 text-muted-foreground">
              ⌘K
            </kbd>
          </Button>
        )}
      </div>

      {/* Center: View Mode Switcher */}
      {viewMode && onViewModeChange && (
        <div className="relative flex items-center bg-card/80 p-0.5 border border-border/80 shadow-xs gap-0.5 shrink-0 select-none">
          <Corners size="sm" offset="border" weight="thin" light />
          <Button
            size="xs"
            variant={viewMode === "editor" ? "default" : "ghost"}
            onClick={() => onViewModeChange("editor")}
            className="h-6 px-1.5 sm:px-2 text-[11px] font-sans gap-1 rounded-none"
            title="Write mode"
          >
            <Edit3 className="size-3" />
            <span className="hidden lg:inline">Write</span>
          </Button>
          <Button
            size="xs"
            variant={viewMode === "split" ? "default" : "ghost"}
            onClick={() => onViewModeChange("split")}
            className="hidden md:inline-flex h-6 px-1.5 sm:px-2 text-[11px] font-sans gap-1 rounded-none"
            title="Split mode"
          >
            <Columns className="size-3" />
            <span className="hidden lg:inline">Split</span>
          </Button>
          <Button
            size="xs"
            variant={viewMode === "preview" ? "default" : "ghost"}
            onClick={() => onViewModeChange("preview")}
            className="h-6 px-1.5 sm:px-2 text-[11px] font-sans gap-1 rounded-none"
            title="Preview mode"
          >
            <Eye className="size-3" />
            <span className="hidden lg:inline">Preview</span>
          </Button>
        </div>
      )}

      {/* Right: Word count, status, tools & options */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs tracking-wider shrink-0">
        <Badge
          variant="outline"
          className="relative gap-1 sm:gap-1.5 font-mono text-[9.5px] sm:text-[10.5px] px-1.5 sm:px-2 py-0.5 border border-border tracking-wider rounded-none shadow-xs"
        >
          <Corners size="sm" offset="border" weight="thin" light />
          <span>
            {wordCount} <span className="hidden xs:inline">{wordCount === 1 ? "WORD" : "WORDS"}</span>
            <span className="xs:hidden">W</span>
          </span>
          <span className="opacity-40 hidden md:inline">·</span>
          <span className="hidden md:inline text-muted-foreground/80">
            ~{Math.max(1, Math.ceil(wordCount / 200))} MIN READ
          </span>
          {writingGoal > 0 && (
            <>
              <span className="opacity-40">·</span>
              <span className="text-primary font-semibold">
                GOAL: {Math.min(100, Math.round((wordCount / writingGoal) * 100))}%
              </span>
            </>
          )}
          <span className="opacity-40">·</span>
          <span
            className={
              saveStatus === "saving"
                ? "text-amber-600 dark:text-amber-400 animate-pulse font-medium"
                : "text-muted-foreground"
            }
          >
            {saveStatus === "saving" ? (
              <>
                <span className="hidden xs:inline">SAVING...</span>
                <span className="xs:hidden">SAVING</span>
              </>
            ) : (
              <>
                <span className="hidden xs:inline">AUTOSAVED</span>
                <span className="xs:hidden">SAVED</span>
              </>
            )}
          </span>
        </Badge>

        <Separator orientation="vertical" className="h-3.5 hidden sm:block" />

        {/* Desktop Action Buttons with Blueprint Corners */}
        <div className="relative hidden sm:flex items-center bg-card/80 p-0.5 border border-border/80 shadow-xs gap-0.5 shrink-0 select-none">
          <Corners size="sm" offset="border" weight="thin" light />
            {/* Table of Contents / Document Outline */}
            {onOpenToc && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onOpenToc}
                    className="text-muted-foreground hover:text-foreground rounded-none"
                    aria-label="Table of Contents Outline"
                  >
                    <ListTree className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-sans">
                  <p>Document Outline (Table of Contents)</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Interactive Knowledge Graph */}
            {onOpenGraph && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onOpenGraph}
                    className="text-muted-foreground hover:text-foreground rounded-none"
                    aria-label="Knowledge Graph"
                  >
                    <Network className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-sans">
                  <p>Interactive Knowledge Graph View</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Ambient Soundscape & Pomodoro Player Dropdown */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-foreground rounded-none"
                      aria-label="Ambient Sound & Pomodoro"
                    >
                      <Headphones className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-sans">
                  <p>Ambient Soundscapes & Pomodoro Timer</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="p-0 border-none bg-transparent shadow-none">
                <AmbientSoundPlayer />
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Writing Insights & Analytics */}
            {onOpenInsights && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onOpenInsights}
                    className="text-muted-foreground hover:text-foreground rounded-none"
                    aria-label="Writing Insights"
                  >
                    <BarChart3 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-sans">
                  <p>Writing Insights & Activity Heatmap</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Welcome & Quick Guide */}
            {onOpenWelcome && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onOpenWelcome}
                    className="text-muted-foreground hover:text-foreground rounded-none"
                    aria-label="Welcome & Guide"
                  >
                    <HelpCircle className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-sans">
                  <p>Welcome & Quick Guide</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Toggle Pin on Active Note */}
            {activeNote && onTogglePin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onTogglePin(activeNote.id)}
                    className={
                      activeNote.isPinned
                        ? "text-amber-600 dark:text-amber-400 hover:text-amber-500 rounded-none"
                        : "text-muted-foreground hover:text-foreground rounded-none"
                    }
                    aria-label={activeNote.isPinned ? "Unpin Note" : "Pin Note"}
                  >
                    {activeNote.isPinned ? (
                      <Pin className="size-3.5 fill-current" />
                    ) : (
                      <Pin className="size-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-sans">
                  <p>{activeNote.isPinned ? "Unpin note from top" : "Pin note to top"}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Session Writing Goal Menu */}
            {onSetWritingGoal && (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className={
                          writingGoal > 0
                            ? "text-primary hover:text-primary rounded-none"
                            : "text-muted-foreground hover:text-foreground rounded-none"
                        }
                        aria-label="Set Writing Goal"
                      >
                        <Target className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-sans">
                    <p>{writingGoal > 0 ? `Goal: ${writingGoal} words` : "Set session word goal"}</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="font-sans text-xs">
                  <div className="px-2 py-1.5 font-semibold text-[11px] text-muted-foreground font-mono uppercase">
                    Session Word Goal
                  </div>
                  <DropdownMenuItem onClick={() => onSetWritingGoal(0)}>
                    None (Free Write)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSetWritingGoal(250)}>
                    250 words (Quick Note)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSetWritingGoal(500)}>
                    500 words (Standard Reflection)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSetWritingGoal(1000)}>
                    1,000 words (Deep Essay)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Zen Mode Button */}
            {onToggleZen && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onToggleZen}
                    className="text-muted-foreground hover:text-foreground rounded-none"
                    aria-label="Zen Focus Mode"
                  >
                    <Maximize2 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-sans">
                  <p>Zen focus mode (Ctrl+Shift+F)</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Version history */}
            {onOpenHistory && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onOpenHistory}
                    className="text-muted-foreground hover:text-foreground rounded-none"
                    aria-label="Version History"
                  >
                    <History className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-sans">
                  <p>Version history & snapshots</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Print / PDF Export */}
            {onPrintNote && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onPrintNote}
                    className="hidden sm:inline-flex text-muted-foreground hover:text-foreground rounded-none"
                    aria-label="Print or Save PDF"
                  >
                    <Printer className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-sans">
                  <p>Print or Export as PDF</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Download note */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleExport}
                  className="hidden sm:inline-flex text-muted-foreground hover:text-foreground rounded-none"
                  aria-label="Export Markdown"
                >
                  <Download className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans">
                <p>Export note as .md</p>
              </TooltipContent>
            </Tooltip>

            {/* Theme switcher */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-foreground rounded-none"
                      aria-label="Change Theme"
                    >
                      <Sun className="size-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute size-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-sans">
                  <p>Toggle theme</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="font-sans">
                <DropdownMenuItem onClick={() => setTheme("light")} className="text-xs">
                  <Sun className="mr-2 size-3.5" /> Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="text-xs">
                  <Moon className="mr-2 size-3.5" /> Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="text-xs">
                  <Laptop className="mr-2 size-3.5" /> System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>

        {/* Mobile Dropdown Menu with Matching Blueprint Corners */}
        <div className="sm:hidden flex items-center shrink-0 select-none">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon-xs"
                className="relative h-7 w-7 rounded-none bg-card/80 border border-border/80 shadow-xs text-muted-foreground hover:text-foreground"
                aria-label="Menu"
              >
                <Corners size="sm" offset="border" weight="thin" light />
                <Menu className="size-3.5" />
                {activeNote?.isPinned && (
                  <span className="absolute top-1 right-1 size-1.5 rounded-full bg-amber-500 ring-1 ring-background" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 font-sans text-xs rounded-none border border-border/80 bg-card/95 shadow-md p-1"
            >
              {/* Note Title Header */}
              {activeNote && (
                <div className="px-2 py-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/50 truncate mb-1">
                  {activeNote.title || "Untitled Note"}
                </div>
              )}

              {/* Table of Contents */}
              {onOpenToc && (
                <DropdownMenuItem onClick={onOpenToc} className="gap-2 cursor-pointer">
                  <ListTree className="size-3.5 text-muted-foreground" />
                  <span>Document Outline</span>
                </DropdownMenuItem>
              )}

              {/* Knowledge Graph */}
              {onOpenGraph && (
                <DropdownMenuItem onClick={onOpenGraph} className="gap-2 cursor-pointer">
                  <Network className="size-3.5 text-muted-foreground" />
                  <span>Knowledge Graph View</span>
                </DropdownMenuItem>
              )}

              {/* Writing Insights */}
              {onOpenInsights && (
                <DropdownMenuItem onClick={onOpenInsights} className="gap-2 cursor-pointer">
                  <BarChart3 className="size-3.5 text-muted-foreground" />
                  <span>Writing Insights & Heatmap</span>
                </DropdownMenuItem>
              )}

              {/* Welcome & Guide */}
              {onOpenWelcome && (
                <DropdownMenuItem onClick={onOpenWelcome} className="gap-2 cursor-pointer">
                  <HelpCircle className="size-3.5 text-muted-foreground" />
                  <span>Welcome & Quick Guide</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="my-1 border-border/50" />

              {/* Pin Note */}
              {activeNote && onTogglePin && (
                <DropdownMenuItem
                  onClick={() => onTogglePin(activeNote.id)}
                  className="gap-2 cursor-pointer"
                >
                  <Pin
                    className={`size-3.5 ${
                      activeNote.isPinned ? "text-amber-600 fill-current" : "text-muted-foreground"
                    }`}
                  />
                  <span>{activeNote.isPinned ? "Unpin Note" : "Pin Note to Top"}</span>
                </DropdownMenuItem>
              )}

              {/* Zen Focus Mode */}
              {onToggleZen && (
                <DropdownMenuItem onClick={onToggleZen} className="gap-2 cursor-pointer">
                  <Maximize2 className="size-3.5 text-muted-foreground" />
                  <span>Zen Focus Mode</span>
                </DropdownMenuItem>
              )}

              {/* Writing Goal Submenu */}
              {onSetWritingGoal && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2 cursor-pointer">
                    <Target className={`size-3.5 ${writingGoal > 0 ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="flex-1">Writing Goal</span>
                    {writingGoal > 0 && (
                      <span className="text-[10px] font-mono text-primary font-semibold">
                        {writingGoal}w
                      </span>
                    )}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="font-sans text-xs rounded-none border border-border/80 bg-card/95">
                    <DropdownMenuItem onClick={() => onSetWritingGoal(0)}>
                      None (Free Write)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSetWritingGoal(250)}>
                      250 words (Quick Note)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSetWritingGoal(500)}>
                      500 words (Standard Reflection)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSetWritingGoal(1000)}>
                      1,000 words (Deep Essay)
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}

              {/* Version History */}
              {onOpenHistory && (
                <DropdownMenuItem onClick={onOpenHistory} className="gap-2 cursor-pointer">
                  <History className="size-3.5 text-muted-foreground" />
                  <span>Version History</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="my-1 border-border/50" />

              {/* Print / PDF Export */}
              {onPrintNote && (
                <DropdownMenuItem onClick={onPrintNote} className="gap-2 cursor-pointer">
                  <Printer className="size-3.5 text-muted-foreground" />
                  <span>Print or PDF</span>
                </DropdownMenuItem>
              )}

              {/* Download note */}
              <DropdownMenuItem onClick={handleExport} className="gap-2 cursor-pointer">
                <Download className="size-3.5 text-muted-foreground" />
                <span>Export Markdown (.md)</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 border-border/50" />

              {/* Theme Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2 cursor-pointer">
                  <Sun className="size-3.5 text-muted-foreground dark:hidden" />
                  <Moon className="size-3.5 text-muted-foreground hidden dark:block" />
                  <span>Theme</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="font-sans text-xs rounded-none border border-border/80 bg-card/95">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="mr-2 size-3.5" /> Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="mr-2 size-3.5" /> Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Laptop className="mr-2 size-3.5" /> System
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
