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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomSheet, SheetLabel, SheetRow } from "@/components/ui/bottom-sheet";
import { AmbientSoundPlayer } from "@/components/audio/ambient-sound-player";
import { Note } from "@/lib/storage/schema";
import { hapticTap } from "@/lib/ui/haptics";

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
      icon={<MoreHorizontal className="size-4 text-primary shrink-0" strokeWidth={1.75} />}
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
      <SheetRow icon={Network} label="Knowledge Graph" onClick={run(onOpenGraph)} />
      <SheetRow icon={BarChart3} label="Writing Analytics" onClick={run(onOpenInsights)} />
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
      <div className="flex items-center gap-1 px-3 pb-3 pt-1">
        <ThemeButton value="light" current={theme} onSelect={setTheme} icon={Sun} label="Light" />
        <ThemeButton value="dark" current={theme} onSelect={setTheme} icon={Moon} label="Dark" />
        <ThemeButton value="system" current={theme} onSelect={setTheme} icon={Laptop} label="Auto" />
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
  return (
    <Button
      size="xs"
      variant={current === value ? "default" : "secondary"}
      onClick={() => {
        hapticTap();
        onSelect(value);
      }}
      className="h-9 flex-1 gap-1 rounded-none text-[10.5px] normal-case tracking-normal"
    >
      <Icon className="size-3" strokeWidth={1.75} />
      {label}
    </Button>
  );
}
