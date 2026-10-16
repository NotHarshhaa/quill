"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  LayoutTemplate,
  ListTree,
  History,
  Search as SearchIcon,
  Download,
  Printer,
  Maximize2,
  Headphones,
  Target,
  Sun,
  Moon,
  Laptop,
  MoreHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Corners } from "@/components/frame";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AmbientSoundPlayer } from "@/components/audio/ambient-sound-player";
import { Note } from "@/lib/storage/schema";
import { cn } from "@/lib/utils";

export interface MoreMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeNote?: Note;
  onOpenTemplates?: () => void;
  onOpenOutline?: () => void;
  onOpenHistory?: () => void;
  onFindReplace?: () => void;
  onExportNote?: () => void;
  onPrintNote?: () => void;
  onToggleZen?: () => void;
  writingGoal?: number;
  onSetWritingGoal?: (goal: number) => void;
}

const GOAL_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "None (Free Write)" },
  { value: 250, label: "250 words (Quick Note)" },
  { value: 500, label: "500 words (Standard Reflection)" },
  { value: 1000, label: "1,000 words (Deep Essay)" },
];

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

const itemClass = "gap-2.5 cursor-pointer normal-case tracking-normal font-sans";

/**
 * App-level "More" surface. Holds SECONDARY (used-sometimes) actions only.
 * Formatting lives in the editor toolbar; tertiary actions live in the
 * Command Palette + Settings. Renders a dropdown on >=640px and a bottom
 * sheet on phones.
 */
export function MoreMenu({
  open,
  onOpenChange,
  activeNote,
  onOpenTemplates,
  onOpenOutline,
  onOpenHistory,
  onFindReplace,
  onExportNote,
  onPrintNote,
  onToggleZen,
  writingGoal = 0,
  onSetWritingGoal,
}: MoreMenuProps) {
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();
  const [ambientExpanded, setAmbientExpanded] = useState(false);

  const close = () => onOpenChange(false);
  const run = (fn?: () => void) => () => {
    fn?.();
    close();
  };

  const trigger = (
    <Button
      variant="ghost"
      size="xs"
      className="relative h-7 px-1.5 sm:px-2 border border-border/70 bg-card/40 hover:bg-muted/50 hover:border-border text-muted-foreground hover:text-foreground rounded-none shadow-2xs gap-1.5 group shrink-0"
      aria-label="More actions"
    >
      <Corners
        size="sm"
        weight="thin"
        light
        className="opacity-30 group-hover:opacity-100 transition-opacity"
      />
      <MoreHorizontal className="size-3.5" />
      <span className="hidden 2xl:inline font-sans text-xs normal-case tracking-normal">
        More
      </span>
    </Button>
  );

  /* ---------------------------------- Mobile: bottom sheet ---------------------------------- */
  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="fixed left-0 right-0 bottom-0 top-auto z-50 w-full max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-t border-border/80 bg-card p-0 font-sans"
          style={{ top: "auto", bottom: 0, maxHeight: "85dvh", paddingBottom: "var(--safe-bottom)" }}
        >
          <DialogTitle className="sr-only">More actions</DialogTitle>

          <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 shrink-0">
            <div className="flex items-center gap-2">
              <MoreHorizontal className="size-4 text-primary" />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                More
              </span>
              {activeNote && (
                <span className="text-[10.5px] font-mono text-muted-foreground truncate max-w-[160px]">
                  · {activeNote.title || "Untitled"}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={close}
              aria-label="Close menu"
              className="size-7 rounded-none text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="overflow-y-auto px-1 py-1.5">
            <SheetRow icon={LayoutTemplate} label="Templates" onClick={run(onOpenTemplates)} />
            <SheetRow icon={ListTree} label="Document outline" onClick={run(onOpenOutline)} />
            <SheetRow icon={History} label="Version history" onClick={run(onOpenHistory)} />
            <SheetRow icon={SearchIcon} label="Find & replace" hint="Ctrl+F" onClick={run(onFindReplace)} />

            <div className="h-px bg-border/60 my-1.5" />

            <SheetRow icon={Download} label="Export .md" onClick={run(onExportNote)} />
            <SheetRow icon={Printer} label="Print / PDF" onClick={run(onPrintNote)} />

            <div className="h-px bg-border/60 my-1.5" />

            <SheetRow icon={Maximize2} label="Zen focus mode" hint="Ctrl+Shift+F" onClick={run(onToggleZen)} />

            {/* Ambient soundscapes (inline expandable player) */}
            <button
              type="button"
              onClick={() => setAmbientExpanded((v) => !v)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-sans text-foreground hover:bg-muted/50 transition-colors"
            >
              <Headphones className="size-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 text-left">Ambient sound & timer</span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {ambientExpanded ? "–" : "+"}
              </span>
            </button>
            {ambientExpanded && (
              <div className="px-2 pb-2 overflow-x-auto">
                <AmbientSoundPlayer />
              </div>
            )}

            {/* Writing goal */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-sans text-foreground">
              <Target className="size-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1">Writing goal</span>
            </div>
            <div className="flex flex-wrap gap-1 px-3 pb-2">
              {GOAL_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  size="xs"
                  variant={writingGoal === opt.value ? "default" : "outline"}
                  onClick={() => {
                    onSetWritingGoal?.(opt.value);
                    close();
                  }}
                  className="text-[10.5px] h-7 px-2 font-mono rounded-none normal-case tracking-normal"
                >
                  {opt.value === 0 ? "Free" : `${opt.value}w`}
                </Button>
              ))}
            </div>

            {/* Theme */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-sans text-foreground">
              <Sun className="size-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1">Theme</span>
            </div>
            <div className="flex items-center gap-1 px-3 pb-2">
              <ThemeButton value="light" current={theme} onSelect={setTheme} icon={Sun} label="Light" />
              <ThemeButton value="dark" current={theme} onSelect={setTheme} icon={Moon} label="Dark" />
              <ThemeButton value="system" current={theme} onSelect={setTheme} icon={Laptop} label="Auto" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  /* ---------------------------------- Desktop / tablet: dropdown ---------------------------------- */
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="font-sans text-xs">
          <p>More actions</p>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        align="end"
        className="w-64 min-w-64 font-sans text-xs rounded-none border border-border/80 bg-card/95 shadow-md p-1"
      >
        <DropdownMenuLabel className="normal-case tracking-normal text-[10px] font-mono text-muted-foreground">
          Document
        </DropdownMenuLabel>
        {onOpenTemplates && (
          <DropdownMenuItem className={itemClass} onClick={run(onOpenTemplates)}>
            <LayoutTemplate className="size-3.5 text-muted-foreground" />
            <span>Templates</span>
          </DropdownMenuItem>
        )}
        {onOpenOutline && (
          <DropdownMenuItem className={itemClass} onClick={run(onOpenOutline)}>
            <ListTree className="size-3.5 text-muted-foreground" />
            <span>Document outline</span>
          </DropdownMenuItem>
        )}
        {onOpenHistory && (
          <DropdownMenuItem className={itemClass} onClick={run(onOpenHistory)}>
            <History className="size-3.5 text-muted-foreground" />
            <span>Version history</span>
          </DropdownMenuItem>
        )}
        {onFindReplace && (
          <DropdownMenuItem className={itemClass} onClick={run(onFindReplace)}>
            <SearchIcon className="size-3.5 text-muted-foreground" />
            <span className="flex-1">Find &amp; replace</span>
            <span className="text-[9.5px] font-mono text-muted-foreground">Ctrl+F</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="border-border/50" />

        <DropdownMenuLabel className="normal-case tracking-normal text-[10px] font-mono text-muted-foreground">
          Share
        </DropdownMenuLabel>
        {onExportNote && (
          <DropdownMenuItem className={itemClass} disabled={!activeNote} onClick={run(onExportNote)}>
            <Download className="size-3.5 text-muted-foreground" />
            <span>Export .md</span>
          </DropdownMenuItem>
        )}
        {onPrintNote && (
          <DropdownMenuItem className={itemClass} onClick={run(onPrintNote)}>
            <Printer className="size-3.5 text-muted-foreground" />
            <span>Print / PDF</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="border-border/50" />

        <DropdownMenuLabel className="normal-case tracking-normal text-[10px] font-mono text-muted-foreground">
          Focus
        </DropdownMenuLabel>
        {onToggleZen && (
          <DropdownMenuItem className={itemClass} onClick={run(onToggleZen)}>
            <Maximize2 className="size-3.5 text-muted-foreground" />
            <span className="flex-1">Zen focus mode</span>
            <span className="text-[9.5px] font-mono text-muted-foreground">Ctrl+Shift+F</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className={cn(itemClass, "flex")}>
            <Headphones className="size-3.5 text-muted-foreground" />
            <span>Ambient sound &amp; timer</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="p-0 border-none bg-transparent shadow-none w-auto">
            <AmbientSoundPlayer />
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {onSetWritingGoal && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className={cn(itemClass, "flex")}>
              <Target
                className={cn(
                  "size-3.5",
                  writingGoal > 0 ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span className="flex-1">Writing goal</span>
              {writingGoal > 0 && (
                <span className="text-[9.5px] font-mono text-primary font-semibold mr-1">
                  {writingGoal}w
                </span>
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="font-sans text-xs rounded-none border border-border/80 bg-card/95 min-w-56">
              <DropdownMenuRadioGroup
                value={String(writingGoal)}
                onValueChange={(v) => onSetWritingGoal(Number(v))}
              >
                {GOAL_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem
                    key={opt.value}
                    value={String(opt.value)}
                    className={itemClass}
                  >
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        <DropdownMenuSeparator className="border-border/50" />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className={cn(itemClass, "flex")}>
            <Sun className="size-3.5 text-muted-foreground" />
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="font-sans text-xs rounded-none border border-border/80 bg-card/95">
            <DropdownMenuRadioGroup value={theme || "system"} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light" className={itemClass}>
                <Sun className="size-3.5" /> Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark" className={itemClass}>
                <Moon className="size-3.5" /> Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system" className={itemClass}>
                <Laptop className="size-3.5" /> System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SheetRow({
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-sans text-foreground hover:bg-muted/50 transition-colors"
    >
      <Icon className="size-3.5 text-muted-foreground shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {hint && <span className="text-[9.5px] font-mono text-muted-foreground">{hint}</span>}
    </button>
  );
}

function ThemeButton({
  value,
  current,
  onSelect,
  icon: Icon,
  label,
}: {
  value: string;
  current?: string;
  onSelect: (v: string) => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Button
      size="xs"
      variant={current === value ? "default" : "secondary"}
      onClick={() => onSelect(value)}
      className="flex-1 text-[10.5px] h-7 rounded-none gap-1 normal-case tracking-normal"
    >
      <Icon className="size-3" />
      {label}
    </Button>
  );
}
