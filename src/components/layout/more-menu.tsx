"use client";

import React from "react";
import {
  ListTree,
  History,
  Search as SearchIcon,
  Download,
  Maximize2,
  Maximize,
  Minimize,
  Feather,
  Headphones,
  Network,
  BarChart3,
  MoreHorizontal,
  ListTodo,
  CalendarDays,
  Tags,
  Keyboard,
  ArrowDownToLine,
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
  /** Opens the shared Export sheet (download / print / backup). */
  onOpenExport?: () => void;
  onToggleZen?: () => void;
  onToggleFullscreen?: () => void;
  fullscreen?: boolean;
  onOpenGraph?: () => void;
  onOpenInsights?: () => void;
  onToggleTypewriter?: () => void;
  typewriter?: boolean;
  onOpenTasks?: () => void;
  onOpenTagManager?: () => void;
  onOpenDailyNote?: () => void;
  onOpenShortcuts?: () => void;
  onCheckForUpdates?: () => void;
}

const groupLabelClass =
  "px-3 pt-2 pb-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground/70";
const itemClass =
  "gap-2.5 cursor-pointer normal-case tracking-normal font-sans focus:bg-muted focus:text-foreground";
const shortcutClass =
  "ml-auto font-mono text-[10px] tracking-normal text-muted-foreground/60 group-focus/dropdown-menu-item:text-foreground";

/**
 * App-level "⋯" overflow popover for desktop and tablet (≥768px). Holds
 * SECONDARY actions only — formatting lives in the editor toolbar, tertiary
 * actions live in the Command Palette + Settings. Phones get the same action
 * set from the bottom-sheet variant. Radix supplies arrow-key navigation,
 * Esc-to-close, focus trapping and outside-click dismissal.
 */
export function MoreMenu({
  open,
  onOpenChange,
  activeNote,
  onOpenOutline,
  onOpenHistory,
  onFindReplace,
  onOpenExport,
  onToggleZen,
  onToggleFullscreen,
  fullscreen = false,
  onOpenGraph,
  onOpenInsights,
  onToggleTypewriter,
  typewriter = false,
  onOpenTasks,
  onOpenTagManager,
  onOpenDailyNote,
  onOpenShortcuts,
  onCheckForUpdates,
}: MoreMenuProps) {
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
        <MenuItem
          icon={Feather}
          label="Typewriter scrolling"
          hint={typewriter ? "ON" : undefined}
          onSelect={run(onToggleTypewriter)}
        />

        <DropdownMenuSeparator className="border-border/50" />

        <DropdownMenuLabel className={groupLabelClass}>Note</DropdownMenuLabel>
        <MenuItem icon={History} label="Version history" onSelect={run(onOpenHistory)} />
        <MenuItem icon={SearchIcon} label="Find & Replace" hint="Ctrl+F" onSelect={run(onFindReplace)} />

        <DropdownMenuSeparator className="border-border/50" />

        <DropdownMenuLabel className={groupLabelClass}>Export</DropdownMenuLabel>
        <MenuItem
          icon={Download}
          label="Export…"
          disabled={!activeNote}
          onSelect={run(onOpenExport)}
        />

        <DropdownMenuSeparator className="border-border/50" />

        <DropdownMenuLabel className={groupLabelClass}>Organise</DropdownMenuLabel>
        {onOpenTasks && (
          <MenuItem icon={ListTodo} label="Open Tasks" onSelect={run(onOpenTasks)} />
        )}
        {onOpenDailyNote && (
          <MenuItem
            icon={CalendarDays}
            label="Today's Note"
            hint="Ctrl+Shift+D"
            onSelect={run(onOpenDailyNote)}
          />
        )}
        {onOpenTagManager && (
          <MenuItem icon={Tags} label="Manage Tags" onSelect={run(onOpenTagManager)} />
        )}

        <DropdownMenuSeparator className="border-border/50" />

        <DropdownMenuLabel className={groupLabelClass}>Tools</DropdownMenuLabel>
        <MenuItem icon={Network} label="Knowledge Graph" onSelect={run(onOpenGraph)} />
        <MenuItem icon={BarChart3} label="Writing Analytics" onSelect={run(onOpenInsights)} />
        {onOpenShortcuts && (
          <MenuItem icon={Keyboard} label="Keyboard Shortcuts" onSelect={run(onOpenShortcuts)} />
        )}
        {onCheckForUpdates && (
          <MenuItem
            icon={ArrowDownToLine}
            label="Check for Updates"
            onSelect={run(onCheckForUpdates)}
          />
        )}

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
