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
  ChevronLeft,
  ChevronRight,
  Command,
  PanelLeftClose,
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

function RailTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10} className="font-sans text-[11px]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

interface RowProps {
  label: string;
  icon: React.ElementType;
  active?: boolean;
  badge?: number;
  expanded: boolean;
  onClick: () => void;
}

/** Icon + label row that drops the label in collapsed mode. */
function SidebarRow({ label, icon, active, badge, expanded, onClick }: RowProps) {
  const Icon = icon;
  return (
    <RailTooltip label={label}>
      <button
        onClick={onClick}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex items-center gap-2.5 h-9 rounded-none text-left transition-colors group/row",
          expanded ? "w-full px-2.5" : "w-9 justify-center mx-auto",
          active
            ? "text-foreground bg-muted/80"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r" />
        )}
        <Icon className="size-[16px] shrink-0" />
        {expanded && (
          <>
            <span className="text-xs font-medium truncate flex-1">{label}</span>
            {badge && badge > 0 && (
              <span className="min-w-4 h-4 px-1 grid place-items-center text-[9px] font-medium bg-destructive/15 text-destructive border border-destructive/20 rounded-none">
                {badge}
              </span>
            )}
          </>
        )}
      </button>
    </RailTooltip>
  );
}

/** Compact icon-only control used at the bottom of the rail. */
function RailControl({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <RailTooltip label={label}>
      <button
        onClick={onClick}
        aria-label={label}
        className="flex items-center justify-center size-9 mx-auto rounded-none text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
      >
        {children}
      </button>
    </RailTooltip>
  );
}

interface GroupLabelProps {
  expanded: boolean;
  children: React.ReactNode;
}

function GroupLabel({ expanded, children }: GroupLabelProps) {
  if (!expanded) {
    return (
      <div className="w-full my-1 px-3">
        <div className="h-px bg-border/50" />
      </div>
    );
  }
  return (
    <div className="w-full px-2.5 pt-2 pb-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">
      {children}
    </div>
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
  expanded: boolean;
  onToggleExpand: () => void;
  onHide: () => void;
}

export function VerticalSidebar({
  activePanel,
  onSelectPanel,
  onNewNote,
  onSearch,
  onOpenGraph,
  onOpenInsights,
  trashCount,
  expanded,
  onToggleExpand,
  onHide,
}: VerticalSidebarProps) {
  const handleLibraryClick = (id: SidebarPanel) => {
    onSelectPanel(activePanel === id ? null : id);
  };

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "h-full bg-card border-r border-border/70 flex flex-col shrink-0 select-none overflow-hidden transition-[width] duration-200 ease-out",
        expanded ? "w-56" : "w-12"
      )}
    >
      {/* Brand header */}
      <div className="flex h-12 items-center shrink-0 gap-2 px-2.5">
        <div
          className={cn(
            "flex items-center gap-2 min-w-0",
            expanded ? "w-full" : "mx-auto"
          )}
        >
          <QuillIcon className="size-5 shrink-0" />
          {expanded && (
            <span className="text-sm font-semibold tracking-tight text-foreground truncate">
              Quill
            </span>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 px-0">
        <RailTooltip label="New Note (Ctrl+N)">
          <button
            onClick={onNewNote}
            aria-label="New Note"
            className={cn(
              "relative flex items-center gap-2 h-9 rounded-none bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full overflow-hidden",
              expanded ? "px-2.5 justify-start" : "justify-center"
            )}
          >
            <Plus className="size-4 shrink-0" />
            {expanded && <span className="text-xs font-semibold">New Note</span>}
          </button>
        </RailTooltip>
      </div>

      {/* Command */}
      <div className="mt-1 shrink-0">
        <SidebarRow
          label="Command palette (Ctrl+K)"
          icon={Command}
          expanded={expanded}
          onClick={onSearch}
        />
      </div>

      {/* Library */}
      <GroupLabel expanded={expanded}>Library</GroupLabel>
      <div className="flex flex-col gap-0.5">
        {libraryItems.map((item) => (
          <SidebarRow
            key={item.id}
            label={item.label}
            icon={item.icon}
            expanded={expanded}
            active={activePanel === item.id}
            badge={item.id === "trash" ? trashCount : undefined}
            onClick={() => handleLibraryClick(item.id)}
          />
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Tools */}
      <GroupLabel expanded={expanded}>Tools</GroupLabel>
      <div className="flex flex-col gap-0.5">
        <SidebarRow label="Graph View" icon={Network} expanded={expanded} onClick={onOpenGraph} />
        <SidebarRow label="Insights" icon={BarChart3} expanded={expanded} onClick={onOpenInsights} />
      </div>

      {/* Footer */}
      <div className="border-t border-border/50 py-1.5 flex flex-col gap-0.5">
        <SidebarRow
          label="Settings"
          icon={Settings}
          expanded={expanded}
          active={activePanel === "settings"}
          onClick={() => handleLibraryClick("settings")}
        />
        {expanded ? (
          <div className="flex items-center justify-between h-8 px-1.5 text-[10px] text-muted-foreground/50">
            <span className="font-mono uppercase tracking-wider">Sidebar</span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={onToggleExpand}
                aria-label="Collapse sidebar (Ctrl+B)"
                title="Collapse sidebar (Ctrl+B)"
                className="size-6 grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-none transition-colors"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <button
                onClick={onHide}
                aria-label="Hide sidebar"
                title="Hide sidebar"
                className="size-6 grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-none transition-colors"
              >
                <PanelLeftClose className="size-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            <RailControl label="Expand sidebar (Ctrl+B)" onClick={onToggleExpand}>
              <ChevronRight className="size-4" />
            </RailControl>
          </div>
        )}
      </div>
    </nav>
  );
}