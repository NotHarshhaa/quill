"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  ListTree,
  History,
  Search as SearchIcon,
  Download,
  Printer,
  Maximize2,
  Maximize,
  Minimize,
  Headphones,
  Network,
  BarChart3,
  Sun,
  Moon,
  Laptop,
  MoreHorizontal,
  X,
  Command,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AmbientSoundPlayer } from "@/components/audio/ambient-sound-player";
import { Note } from "@/lib/storage/schema";
import { topBarButtonClass, TopBarGlyph } from "@/components/layout/top-bar";
import { cn } from "@/lib/utils";

export interface MoreMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeNote?: Note;
  onOpenOutline?: () => void;
  onOpenHistory?: () => void;
  onFindReplace?: () => void;
  onExportNote?: () => void;
  onPrintNote?: () => void;
  onToggleZen?: () => void;
  onToggleFullscreen?: () => void;
  fullscreen?: boolean;
  onOpenGraph?: () => void;
  onOpenInsights?: () => void;
  onOpenCommandPalette?: () => void;
}

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

const groupLabelClass =
  "px-3 pt-2 pb-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground/70";
const itemClass =
  "gap-2.5 cursor-pointer normal-case tracking-normal font-sans focus:bg-muted focus:text-foreground";
const shortcutClass =
  "ml-auto font-mono text-[10px] tracking-normal text-muted-foreground/60 group-focus/dropdown-menu-item:text-foreground";

/**
 * App-level "⋯" overflow menu. Holds SECONDARY actions only (formatting lives
 * in the editor toolbar; tertiary actions live in the Command Palette +
 * Settings). Renders a keyboard-navigable popover on >=640px and a bottom
 * sheet on phones. Radix supplies arrow-key navigation, Esc-to-close, focus
 * trapping and outside-click dismissal.
 */
export function MoreMenu({
  open,
  onOpenChange,
  activeNote,
  onOpenOutline,
  onOpenHistory,
  onFindReplace,
  onExportNote,
  onPrintNote,
  onToggleZen,
  onToggleFullscreen,
  fullscreen = false,
  onOpenGraph,
  onOpenInsights,
  onOpenCommandPalette,
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
      type="button"
      variant="ghost"
      size="icon"
      aria-label="More actions"
      className={cn(topBarButtonClass, "group")}
    >
      <TopBarGlyph icon={MoreHorizontal} />
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
              <MoreHorizontal className="size-4 text-primary" strokeWidth={1.75} />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider">More</span>
              {activeNote && (
                <span className="text-[10.5px] font-mono text-muted-foreground truncate max-w-[160px]">
                  · {activeNote.title || "Untitled"}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              aria-label="Close menu"
              className="size-9 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="size-4" strokeWidth={1.75} />
            </Button>
          </div>

          <div className="overflow-y-auto px-1 py-1.5">
            <SheetRow icon={Command} label="Command Palette" hint="Ctrl+K" onClick={run(onOpenCommandPalette)} />

            <SheetLabel>View</SheetLabel>
            <SheetRow icon={ListTree} label="Outline" onClick={run(onOpenOutline)} />
            <SheetRow icon={Maximize2} label="Zen Focus Mode" hint="Ctrl+Shift+F" onClick={run(onToggleZen)} />
            <SheetRow
              icon={fullscreen ? Minimize : Maximize}
              label={fullscreen ? "Exit Fullscreen" : "Fullscreen"}
              onClick={run(onToggleFullscreen)}
            />

            <SheetLabel>Note</SheetLabel>
            <SheetRow icon={History} label="Version history" onClick={run(onOpenHistory)} />
            <SheetRow icon={SearchIcon} label="Find & Replace" hint="Ctrl+F" onClick={run(onFindReplace)} />

            <SheetLabel>Export</SheetLabel>
            <SheetRow
              icon={Download}
              label="Download .md"
              disabled={!activeNote}
              onClick={run(onExportNote)}
            />
            <SheetRow icon={Printer} label="Print/PDF" hint="Ctrl+P" onClick={run(onPrintNote)} />

            <SheetLabel>Tools</SheetLabel>
            <SheetRow icon={Network} label="Knowledge Graph" onClick={run(onOpenGraph)} />
            <SheetRow icon={BarChart3} label="Writing Analytics" onClick={run(onOpenInsights)} />
            <button
              type="button"
              onClick={() => setAmbientExpanded((v) => !v)}
              aria-expanded={ambientExpanded}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-sans text-foreground hover:bg-muted/50 transition-colors"
            >
              <Headphones className="size-3.5 text-muted-foreground shrink-0" strokeWidth={1.75} />
              <span className="flex-1 text-left">Ambient Sounds</span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {ambientExpanded ? "–" : "+"}
              </span>
            </button>
            {ambientExpanded && (
              <div className="px-2 pb-2 overflow-x-auto">
                <AmbientSoundPlayer />
              </div>
            )}

            <div className="h-px bg-border/60 my-1.5" />

            {/* Theme (header toggle is hidden on phones) */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-sans text-foreground">
              <Sun className="size-3.5 text-muted-foreground shrink-0" strokeWidth={1.75} />
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

  /* ---------------------------------- Desktop / tablet: popover ---------------------------------- */
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="font-sans text-xs">
          <span>More actions</span>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        align="end"
        aria-label="More actions"
        className="w-60 min-w-60 font-sans text-xs rounded-none border border-border/80 bg-card/95 shadow-md p-1"
      >
        <DropdownMenuLabel className={groupLabelClass}>View</DropdownMenuLabel>
        <MenuItem icon={ListTree} label="Outline" onSelect={run(onOpenOutline)} />
        <MenuItem
          icon={Maximize2}
          label="Zen Focus Mode"
          hint="Ctrl+Shift+F"
          onSelect={run(onToggleZen)}
        />
        <MenuItem
          icon={fullscreen ? Minimize : Maximize}
          label={fullscreen ? "Exit Fullscreen" : "Fullscreen"}
          onSelect={run(onToggleFullscreen)}
        />

        <DropdownMenuSeparator className="border-border/50" />

        <DropdownMenuLabel className={groupLabelClass}>Note</DropdownMenuLabel>
        <MenuItem icon={History} label="Version history" onSelect={run(onOpenHistory)} />
        <MenuItem icon={SearchIcon} label="Find & Replace" hint="Ctrl+F" onSelect={run(onFindReplace)} />

        <DropdownMenuSeparator className="border-border/50" />

        <DropdownMenuLabel className={groupLabelClass}>Export</DropdownMenuLabel>
        <MenuItem
          icon={Download}
          label="Download .md"
          disabled={!activeNote}
          onSelect={run(onExportNote)}
        />
        <MenuItem icon={Printer} label="Print/PDF" hint="Ctrl+P" onSelect={run(onPrintNote)} />

        <DropdownMenuSeparator className="border-border/50" />

        <DropdownMenuLabel className={groupLabelClass}>Tools</DropdownMenuLabel>
        <MenuItem icon={Network} label="Knowledge Graph" onSelect={run(onOpenGraph)} />
        <MenuItem icon={BarChart3} label="Writing Analytics" onSelect={run(onOpenInsights)} />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className={cn(itemClass, "flex")}>
            <Headphones className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
            <span>Ambient Sounds</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="p-0 border-none bg-transparent shadow-none w-auto">
            <AmbientSoundPlayer />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuItem({
  icon: Icon,
  label,
  hint,
  disabled,
  onSelect,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  hint?: string;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem className={itemClass} disabled={disabled} onClick={onSelect}>
      <Icon className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
      <span className="flex-1">{label}</span>
      {hint && <DropdownMenuShortcut className={shortcutClass}>{hint}</DropdownMenuShortcut>}
    </DropdownMenuItem>
  );
}

function SheetLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pt-3 pb-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground/60">
      {children}
    </div>
  );
}

function SheetRow({
  icon: Icon,
  label,
  hint,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  hint?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-sans text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
    >
      <Icon className="size-3.5 text-muted-foreground shrink-0" strokeWidth={1.75} />
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
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <Button
      size="xs"
      variant={current === value ? "default" : "secondary"}
      onClick={() => onSelect(value)}
      className="flex-1 text-[10.5px] h-7 rounded-none gap-1 normal-case tracking-normal"
    >
      <Icon className="size-3" strokeWidth={1.75} />
      {label}
    </Button>
  );
}
