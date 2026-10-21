"use client";

import React, { useState } from "react";
import { useTheme } from "next-themes";
import {
  Search as SearchIcon,
  Command,
  LayoutTemplate,
  Star,
  Trash2,
  Settings,
  Network,
  BarChart3,
  Headphones,
  ListTree,
  History,
  Download,
  Maximize,
  Minimize,
  Feather,
  Sun,
  Moon,
  Laptop,
  MoreHorizontal,
  ListTodo,
  CalendarDays,
  Tags,
  Keyboard,
} from "lucide-react";
import { BottomSheet, SheetLabel, SheetRow } from "@/components/ui/bottom-sheet";
import { AmbientSoundPlayer } from "@/components/audio/ambient-sound-player";
import { Note } from "@/lib/storage/schema";
import { hapticTap } from "@/lib/ui/haptics";
import { cn } from "@/lib/utils";

export interface MobileMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeNote?: Note;
  onOpenSearch: () => void;
  onOpenCommandPalette: () => void;
  onOpenTemplates: () => void;
  onOpenFavorites: () => void;
  onOpenTrash: () => void;
  onOpenSettings: () => void;
  onOpenGraph: () => void;
  onOpenInsights: () => void;
  onOpenOutline: () => void;
  onOpenHistory: () => void;
  onFindReplace: () => void;
  /** Opens the shared Export sheet (download / print / backup). */
  onOpenExport: () => void;
  onToggleZen: () => void;
  onToggleFullscreen: () => void;
  fullscreen?: boolean;
  onToggleTypewriter: () => void;
  typewriter?: boolean;
  onOpenTasks?: () => void;
  onOpenTagManager?: () => void;
  onOpenDailyNote?: () => void;
  onOpenShortcuts?: () => void;
}

/**
 * Phone "More" bottom sheet — the secondary surface for every action that does
 * not fit in the bottom tab bar. Mirrors the desktop ⋯ popover so no feature is
 * lost when the top bar collapses on small screens.
 */
export function MobileMoreSheet({
  open,
  onOpenChange,
  activeNote,
  onOpenSearch,
  onOpenCommandPalette,
  onOpenTemplates,
  onOpenFavorites,
  onOpenTrash,
  onOpenSettings,
  onOpenGraph,
  onOpenInsights,
  onOpenOutline,
  onOpenHistory,
  onFindReplace,
  onOpenExport,
  onToggleZen,
  onToggleFullscreen,
  fullscreen = false,
  onToggleTypewriter,
  typewriter = false,
  onOpenTasks,
  onOpenTagManager,
  onOpenDailyNote,
  onOpenShortcuts,
}: MobileMoreSheetProps) {
  const { theme, setTheme } = useTheme();
  const [ambientExpanded, setAmbientExpanded] = useState(false);

  const close = () => onOpenChange(false);
  const run = (fn?: () => void) => () => {
    hapticTap();
    fn?.();
    close();
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="More"
      icon={<MoreHorizontal className="size-icon text-brand shrink-0" strokeWidth={1.75} />}
      badge={
        activeNote ? (
          <span className="truncate font-mono text-[10.5px] text-muted-foreground">
            · {activeNote.title || "Untitled"}
          </span>
        ) : undefined
      }
      snapPoints={["half", "full"]}
      initialSnap="half"
      bodyClassName="px-1"
    >
      <SheetRow icon={SearchIcon} label="Search Notes" onClick={run(onOpenSearch)} />
      <SheetRow
        icon={Command}
        label="Command Palette"
        hint="Ctrl+K"
        onClick={run(onOpenCommandPalette)}
      />

      <SheetLabel>Library</SheetLabel>
      <SheetRow icon={LayoutTemplate} label="Templates" onClick={run(onOpenTemplates)} />
      <SheetRow icon={Star} label="Favorites" onClick={run(onOpenFavorites)} />
      <SheetRow icon={Trash2} label="Trash" onClick={run(onOpenTrash)} />
      <SheetRow icon={Settings} label="Settings" onClick={run(onOpenSettings)} />

      <SheetLabel>Tools</SheetLabel>
      {onOpenTasks && (
        <SheetRow
          icon={ListTodo}
          label="Open Tasks"
          description="Every checklist item across your notes"
          onClick={run(onOpenTasks)}
        />
      )}
      {onOpenDailyNote && (
        <SheetRow
          icon={CalendarDays}
          label="Today's Note"
          description="Jump to (or start) today's daily note"
          onClick={run(onOpenDailyNote)}
        />
      )}
      {onOpenTagManager && (
        <SheetRow
          icon={Tags}
          label="Manage Tags"
          description="Rename or merge tags across every note"
          onClick={run(onOpenTagManager)}
        />
      )}
      <SheetRow icon={Network} label="Knowledge Graph" onClick={run(onOpenGraph)} />
      <SheetRow icon={BarChart3} label="Writing Analytics" onClick={run(onOpenInsights)} />
      {onOpenShortcuts && (
        <SheetRow
          icon={Keyboard}
          label="Keyboard Shortcuts"
          description="Every shortcut in one list"
          onClick={run(onOpenShortcuts)}
        />
      )}
      <button
        type="button"
        onClick={() => {
          hapticTap();
          setAmbientExpanded((v) => !v);
        }}
        aria-expanded={ambientExpanded}
        className="flex min-h-[44px] w-full items-center gap-3 px-4 py-2.5 text-xs font-sans text-foreground transition-colors hover:bg-muted/50 motion-reduce:transition-none"
      >
        <Headphones className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        <span className="flex-1 text-left">Ambient Sounds</span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {ambientExpanded ? "–" : "+"}
        </span>
      </button>
      {ambientExpanded && (
        <div className="overflow-x-auto px-2 pb-2">
          <AmbientSoundPlayer />
        </div>
      )}

      <SheetLabel>Document</SheetLabel>
      <SheetRow icon={ListTree} label="Outline" onClick={run(onOpenOutline)} />
      <SheetRow
        icon={SearchIcon}
        label="Find & Replace"
        hint="Ctrl+F"
        onClick={run(onFindReplace)}
      />
      <SheetRow icon={History} label="Version history" onClick={run(onOpenHistory)} />
      <SheetRow
        icon={Download}
        label="Export…"
        description="Markdown, PDF or full JSON backup"
        disabled={!activeNote}
        onClick={run(onOpenExport)}
      />

      <SheetLabel>View</SheetLabel>
      <SheetRow
        icon={ListTree}
        label="Zen Focus Mode"
        hint="Ctrl+Shift+F"
        onClick={run(onToggleZen)}
      />
      <SheetRow
        icon={fullscreen ? Minimize : Maximize}
        label={fullscreen ? "Exit Fullscreen" : "Fullscreen"}
        onClick={run(onToggleFullscreen)}
      />
      <SheetRow
        icon={Feather}
        label="Typewriter scrolling"
        hint={typewriter ? "ON" : undefined}
        onClick={run(onToggleTypewriter)}
      />

      <SheetLabel>Theme</SheetLabel>
      <div className="px-3 pb-3 pt-1">
        <div
          role="group"
          aria-label="Theme"
          className="flex items-center gap-0.5 bg-muted/60 p-0.5"
        >
          <ThemeButton value="light" current={theme} onSelect={setTheme} icon={Sun} label="Light" />
          <ThemeButton value="dark" current={theme} onSelect={setTheme} icon={Moon} label="Dark" />
          <ThemeButton value="system" current={theme} onSelect={setTheme} icon={Laptop} label="Auto" />
        </div>
      </div>
    </BottomSheet>
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
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => {
        hapticTap();
        onSelect(value);
      }}
      aria-pressed={active}
      className={cn(
        "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-none text-[11px] transition-colors motion-reduce:transition-none",
        active
          ? "bg-background text-foreground shadow-soft font-semibold"
          : "text-muted-foreground"
      )}
    >
      <Icon className="size-icon-sm" strokeWidth={1.75} />
      {label}
    </button>
  );
}
