"use client";

import { cn } from "@/lib/utils";
import {
  FileText,
  Star,
  Trash2,
  Network,
  BarChart3,
  Settings,
  Plus,
  PanelLeft,
  Command,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { QuillIcon } from "./quill-logo";

export type SidebarPanel = "notes" | "favorites" | "trash" | "settings";

interface NavItem {
  id: SidebarPanel;
  icon: React.ElementType;
  label: string;
}

const libraryItems: NavItem[] = [
  { id: "notes", icon: FileText, label: "All Notes" },
  { id: "favorites", icon: Star, label: "Favorites" },
  { id: "trash", icon: Trash2, label: "Trash" },
];

function RailButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8} className="font-sans text-[11px]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

interface VerticalSidebarProps {
  activePanel: SidebarPanel | null;
  onSelectPanel: (panel: SidebarPanel | null) => void;
  onNewNote: () => void;
  onSearch: () => void;
  onOpenGraph: () => void;
  onOpenInsights: () => void;
  trashCount: number;
  dockOpen: boolean;
}

export function VerticalSidebar({
  activePanel,
  onSelectPanel,
  onNewNote,
  onSearch,
  onOpenGraph,
  onOpenInsights,
  trashCount,
  dockOpen,
}: VerticalSidebarProps) {
  const handleLibraryClick = (id: SidebarPanel) => {
    onSelectPanel(activePanel === id ? null : id);
  };

  return (
    <nav
      aria-label="Primary"
      className="h-full w-12 bg-card border-r border-border/70 flex flex-col items-center gap-1 py-2 shrink-0 select-none"
    >
      {/* Brand */}
      <div className="flex items-center justify-center w-full h-9" aria-hidden>
        <QuillIcon className="size-5 shrink-0" />
      </div>

      {/* Composer */}
      <RailButton label="New Note (Ctrl+N)">
        <button
          onClick={onNewNote}
          aria-label="New Note"
          className="flex items-center justify-center size-9 rounded-none bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" />
        </button>
      </RailButton>

      {/* Command palette */}
      <RailButton label="Command palette (Ctrl+K)">
        <button
          onClick={onSearch}
          aria-label="Open Command Palette"
          className="flex items-center justify-center size-9 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
        >
          <Command className="size-4" />
        </button>
      </RailButton>

      {/* Library group */}
      <div className="w-full px-1.5 pt-1.5">
        <div className="h-px bg-border/50" />
      </div>

      <div className="flex flex-col items-center gap-1 w-full px-1.5">
        {libraryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePanel === item.id;
          const badge = item.id === "trash" ? trashCount : undefined;
          return (
            <RailButton key={item.id} label={item.label}>
              <button
                onClick={() => handleLibraryClick(item.id)}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex items-center justify-center size-9 rounded-none transition-colors",
                  isActive
                    ? "text-foreground bg-muted/70"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r" />
                )}
                <Icon className="size-[16px] shrink-0" />
                {badge && badge > 0 && (
                  <span className="absolute -top-px -right-px min-w-3 h-3 px-0.5 grid place-items-center text-[8px] font-medium bg-destructive/15 text-destructive border border-destructive/20 rounded-none">
                    {badge}
                  </span>
                )}
              </button>
            </RailButton>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Tools group */}
      <div className="flex flex-col items-center gap-1 w-full px-1.5 pt-1.5 border-t border-border/50">
        <RailButton label="Knowledge Graph">
          <button
            onClick={onOpenGraph}
            aria-label="Knowledge Graph"
            className="flex items-center justify-center size-9 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <Network className="size-4" />
          </button>
        </RailButton>

        <RailButton label="Writing Insights">
          <button
            onClick={onOpenInsights}
            aria-label="Writing Insights"
            className="flex items-center justify-center size-9 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <BarChart3 className="size-4" />
          </button>
        </RailButton>

        <RailButton label="Settings">
          <button
            onClick={() => handleLibraryClick("settings")}
            aria-label="Settings"
            aria-current={activePanel === "settings" ? "page" : undefined}
            className={cn(
              "relative flex items-center justify-center size-9 rounded-none transition-colors",
              activePanel === "settings"
                ? "text-foreground bg-muted/70"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            {activePanel === "settings" && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r" />
            )}
            <Settings className="size-4" />
          </button>
        </RailButton>

        {/* Dock toggle */}
        <RailButton label={dockOpen ? "Hide panel (Ctrl+B)" : "Show notes (Ctrl+B)"}>
          <button
            onClick={() => onSelectPanel(dockOpen ? null : activePanel ?? "notes")}
            aria-label={dockOpen ? "Hide panel" : "Show notes panel"}
            className="flex items-center justify-center size-9 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <PanelLeft
              className={cn("size-4 transition-transform duration-150", dockOpen ? "" : "rotate-180")}
            />
          </button>
        </RailButton>
      </div>
    </nav>
  );
}