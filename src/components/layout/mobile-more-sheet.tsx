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
  Printer,
  Maximize,
  Minimize,
  Feather,
  Sun,
  Moon,
  Laptop,
  MoreHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
  onExportNote: () => void;
  onPrintNote: () => void;
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
  onExportNote,
  onPrintNote,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="fixed left-0 right-0 bottom-0 top-auto z-50 w-full max-w-none sm:max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-t border-border/80 bg-card p-0 font-sans"
        style={{ top: "auto", bottom: 0, maxHeight: "85dvh", paddingBottom: "var(--safe-bottom)" }}
      >
        <DialogTitle className="sr-only">More actions</DialogTitle>

        <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <MoreHorizontal className="size-4 text-primary shrink-0" strokeWidth={1.75} />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider">More</span>
            {activeNote && (
              <span className="text-[10.5px] font-mono text-muted-foreground truncate">
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
          <SheetRow icon={SearchIcon} label="Search" onClick={run(onOpenSearch)} />
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
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-sans text-foreground hover:bg-muted/50 transition-colors motion-reduce:transition-none"
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
            label="Download .md"
            disabled={!activeNote}
            onClick={run(onExportNote)}
          />
          <SheetRow icon={Printer} label="Print/PDF" hint="Ctrl+P" onClick={run(onPrintNote)} />

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
        </div>
      </DialogContent>
    </Dialog>
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
      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-sans text-foreground hover:bg-muted/50 transition-colors motion-reduce:transition-none disabled:opacity-40 disabled:pointer-events-none min-h-[44px]"
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
      onClick={() => {
        hapticTap();
        onSelect(value);
      }}
      className="flex-1 text-[10.5px] h-9 rounded-none gap-1 normal-case tracking-normal"
    >
      <Icon className="size-3" strokeWidth={1.75} />
      {label}
    </Button>
  );
}
