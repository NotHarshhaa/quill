"use client";

import { useTheme } from "next-themes";
import { Download, Moon, Sun, Laptop, Command, Pin, PinOff, PanelLeft, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QuillLogo } from "./quill-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { notesRepository } from "@/lib/storage/notesRepository";
import { Note } from "@/lib/storage/schema";
import { SaveStatus } from "@/hooks/useAutosave";
import { toast } from "sonner";

interface HeaderProps {
  activeNote?: Note;
  wordCount: number;
  saveStatus: SaveStatus;
  onOpenCommandPalette?: () => void;
  onTogglePin?: (id: string) => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function Header({
  activeNote,
  wordCount,
  saveStatus,
  onOpenCommandPalette,
  onTogglePin,
  onToggleSidebar,
  isSidebarOpen,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const handleExport = () => {
    if (!activeNote) return;
    notesRepository.exportNote(activeNote);
    toast.success(`Exported "${activeNote.title || 'Untitled'}.md"`);
  };

  return (
    <header className="w-full h-12 border-b border-border/70 px-3 sm:px-6 flex items-center justify-between bg-background/80 backdrop-blur-xs select-none font-sans shrink-0">
      {/* Left: Sidebar Toggle, Logo & Quick Command Palette Trigger */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onToggleSidebar}
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Toggle notes list"
            title="Toggle notes list"
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
            className="items-center gap-1.5 h-7 px-2 text-xs font-sans text-muted-foreground hover:text-foreground bg-background/60 border-border/60 shrink-0"
            title="Open Command Palette (Ctrl+K)"
          >
            <Command className="size-3" />
            <span className="hidden sm:inline text-[11px]">Command</span>
            <kbd className="hidden sm:inline-block font-mono text-[9.5px] px-1 py-0.2 rounded-xs bg-muted border border-border/60 text-muted-foreground">
              ⌘K
            </kbd>
          </Button>
        )}
      </div>

      {/* Right: Word count, status, pin, export, theme */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 text-xs tracking-wider shrink-0">
        <Badge
          variant="outline"
          className="gap-1 sm:gap-1.5 font-mono text-[9.5px] sm:text-[10.5px] px-1.5 sm:px-2 py-0.5 border border-border tracking-wider"
        >
          <span>
            {wordCount} <span className="hidden xs:inline">{wordCount === 1 ? "WORD" : "WORDS"}</span>
            <span className="xs:hidden">W</span>
          </span>
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

        <Separator orientation="vertical" className="h-3.5" />

        <TooltipProvider>
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
                      ? "text-amber-600 dark:text-amber-400 hover:text-amber-500"
                      : "text-muted-foreground hover:text-foreground"
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

          {/* Download note */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleExport}
                className="text-muted-foreground hover:text-foreground"
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
                    className="text-muted-foreground hover:text-foreground"
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
        </TooltipProvider>
      </div>
    </header>
  );
}
