"use client";

import { useTheme } from "next-themes";
import { Download, Moon, Sun, Laptop } from "lucide-react";
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
}

export function Header({ activeNote, wordCount, saveStatus }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const handleExport = () => {
    if (!activeNote) return;
    notesRepository.exportNote(activeNote);
    toast.success(`Exported "${activeNote.title || 'Untitled'}.md"`);
  };

  return (
    <header className="w-full h-12 border-b border-border/70 px-4 sm:px-6 flex items-center justify-between bg-background/80 backdrop-blur-xs select-none font-sans">
      {/* Left: Logo */}
      <QuillLogo />

      {/* Right: Word count, status, export, theme */}
      <div className="flex items-center gap-3 text-xs tracking-wider">
        <Badge
          variant="outline"
          className="gap-1.5 font-mono text-[10.5px] px-2 py-0.5 border border-border tracking-wider"
        >
          <span>
            {wordCount} {wordCount === 1 ? "WORD" : "WORDS"}
          </span>
          <span className="opacity-40">·</span>
          <span
            className={
              saveStatus === "saving"
                ? "text-amber-600 dark:text-amber-400 animate-pulse font-medium"
                : "text-muted-foreground"
            }
          >
            {saveStatus === "saving" ? "SAVING..." : "AUTOSAVED"}
          </span>
        </Badge>

        <Separator orientation="vertical" className="h-3.5" />

        <TooltipProvider>
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
