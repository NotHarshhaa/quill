"use client";

import { useEffect, useRef, useState } from "react";
import { Note } from "@/lib/storage/schema";
import { cn, formatDate } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  X,
  Pin,
  PinOff,
  Copy,
  Trash2,
  MoreVertical,
  RotateCcw,
  Star,
  Network,
  BarChart3,
  Settings,
  FileText,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Corners } from "@/components/frame";
import { QuillIcon } from "./quill-logo";

export type SidebarPanel = "all" | "favorites" | "trash" | "settings";

const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 480;
const SIDEBAR_DEFAULT_WIDTH = 260;
const SIDEBAR_WIDTH_KEY = "quill.sidebar.width";

function clampSidebarWidth(value: number): number {
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(value)));
}

function getSnippet(content: string, maxLength = 160): string {
  if (!content.trim()) return "Empty note";
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (!line.startsWith("#") && !line.startsWith("-") && !line.startsWith("!")) {
      // Generous pool; the row's CSS `truncate` ellipsizes at the live sidebar width
      return line.slice(0, maxLength);
    }
  }
  return lines[0]?.slice(0, maxLength) || "No preview";
}

function groupNotesByDate(notes: Note[]): { label: string; notes: Note[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const weekAgo = today - 7 * 86400000;

  const groups: { label: string; notes: Note[] }[] = [
    { label: "Pinned", notes: [] },
    { label: "Today", notes: [] },
    { label: "Yesterday", notes: [] },
    { label: "Previous 7 Days", notes: [] },
    { label: "Older", notes: [] },
  ];

  notes.forEach((note) => {
    if (note.isPinned) {
      groups[0].notes.push(note);
    } else if (note.updatedAt >= today) {
      groups[1].notes.push(note);
    } else if (note.updatedAt >= yesterday) {
      groups[2].notes.push(note);
    } else if (note.updatedAt >= weekAgo) {
      groups[3].notes.push(note);
    } else {
      groups[4].notes.push(note);
    }
  });

  return groups.filter((g) => g.notes.length > 0);
}

function FooterButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          aria-label={label}
          className={cn(
            "flex items-center justify-center size-8 rounded-none transition-colors",
            active
              ? "text-foreground bg-muted/80"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="font-sans text-[11px]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

interface NoteRowProps {
  note: Note;
  isActive: boolean;
  onSelect: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

function NoteRow({ note, isActive, onSelect, onTogglePin, onDuplicate, onDelete }: NoteRowProps) {
  const snippet = getSnippet(note.content);

  return (
    <div
      onClick={() => onSelect(note.id)}
      className={cn(
        "group relative w-full text-left p-2.5 rounded-md transition-colors cursor-pointer",
        isActive
          ? "bg-muted/50 border border-border"
          : "hover:bg-muted/40 border border-transparent hover:border-border/40"
      )}
    >
      {isActive && <Corners size="sm" offset="border" weight="thin" light />}

      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {note.isPinned && (
            <Pin className="size-3 text-amber-600 dark:text-amber-400 fill-current shrink-0" />
          )}
          <h3
            className={cn(
              "text-xs truncate",
              isActive ? "text-foreground font-semibold" : "text-foreground/90 font-medium"
            )}
          >
            {note.title || "Untitled"}
          </h3>
        </div>

        {/* Actions (always visible on touch devices and for the active note) */}
        <div
          className={cn(
            "flex items-center gap-0.5 transition-opacity",
            isActive
              ? "opacity-100"
              : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => e.stopPropagation()}
                className="size-6 text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(note.id);
                }}
                className="gap-2 text-xs"
              >
                {note.isPinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                <span>{note.isPinned ? "Unpin" : "Pin"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(note.id);
                }}
                className="gap-2 text-xs"
              >
                <Copy className="size-3.5" />
                <span>Duplicate</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note.id);
                }}
                className="gap-2 text-xs text-destructive focus:text-destructive"
              >
                <Trash2 className="size-3.5" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Snippet */}
      <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{snippet}</p>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          {note.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-mono text-muted-foreground/70 bg-muted/50 px-1.5 py-0.5"
            >
              #{tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-[9px] font-mono text-muted-foreground/50">
              +{note.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Date */}
      <div className="text-[9px] text-muted-foreground/50 mt-1">{formatDate(note.updatedAt)}</div>
    </div>
  );
}

export interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
  activePanel: SidebarPanel;
  onSelectPanel: (panel: SidebarPanel) => void;
  notes: Note[];
  trashedNotes: Note[];
  activeNoteId: string;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDuplicateNote: (id: string) => void;
  onRestoreNote: (id: string) => void;
  onEmptyTrash: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenGraph: () => void;
  onOpenInsights: () => void;
  writingGoal: number;
  onWritingGoalChange: (goal: number) => void;
  onExportAll: () => void;
  onImportBackup: () => void;
}

const libraryTabs: { id: SidebarPanel; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All", icon: FileText },
  { id: "favorites", label: "Favorites", icon: Star },
  { id: "trash", label: "Trash", icon: Trash2 },
];

/**
 * Unified library sidebar: brand header, New Note, library tabs
 * (All / Favorites / Trash), search, and the live note list in one
 * always-visible column. On desktop it docks in-flow with a draggable
 * right edge (width persisted, double-click the edge to reset) and
 * collapses to zero width when hidden; on small screens it becomes an
 * off-canvas drawer with a backdrop.
 */
export function AppSidebar({
  open,
  onClose,
  activePanel,
  onSelectPanel,
  notes,
  trashedNotes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onTogglePin,
  onDuplicateNote,
  onRestoreNote,
  onEmptyTrash,
  searchQuery,
  onSearchChange,
  onOpenGraph,
  onOpenInsights,
  writingGoal,
  onWritingGoalChange,
  onExportAll,
  onImportBackup,
}: AppSidebarProps) {
  const asideRef = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  // Restore persisted width (client only, after hydration)
  useEffect(() => {
    const stored = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
    if (Number.isFinite(stored) && stored > 0) {
      setWidth(clampSidebarWidth(stored));
    }
  }, []);

  const handleResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsResizing(true);
  };

  const handleResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing || !asideRef.current) return;
    const left = asideRef.current.getBoundingClientRect().left;
    setWidth(clampSidebarWidth(e.clientX - left));
  };

  const handleResizeEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    setIsResizing(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width));
  };

  const commitWidth = (next: number) => {
    setWidth(next);
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(next));
  };

  const query = searchQuery.trim().toLowerCase();
  const matchesQuery = (note: Note) =>
    !query ||
    note.title.toLowerCase().includes(query) ||
    note.content.toLowerCase().includes(query);

  const allNotes = activePanel === "all" ? notes.filter(matchesQuery) : [];
  const favoriteNotes =
    activePanel === "favorites" ? notes.filter((n) => n.isPinned && matchesQuery(n)) : [];
  const showSearch = activePanel === "all" || activePanel === "favorites";

  const renderRow = (note: Note) => (
    <NoteRow
      key={note.id}
      note={note}
      isActive={note.id === activeNoteId}
      onSelect={onSelectNote}
      onTogglePin={onTogglePin}
      onDuplicate={onDuplicateNote}
      onDelete={onDeleteNote}
    />
  );

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/25 transition-opacity duration-200 md:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      <aside
        ref={asideRef}
        aria-label="Library"
        aria-hidden={!open}
        inert={!open}
        style={{ "--sidebar-w": `${width}px` } as React.CSSProperties}
        className={cn(
          "relative flex flex-col h-full bg-card border-r border-border/70 shrink-0 overflow-hidden select-none",
          // Freeze the width animation while dragging the resize handle
          isResizing
            ? "transition-none"
            : "transition-[width,transform] duration-200 ease-out",
          // Mobile: off-canvas drawer
          "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50",
          "max-md:w-[min(300px,calc(100vw-3rem))]",
          open ? "max-md:translate-x-0 max-md:shadow-2xl" : "max-md:-translate-x-full",
          // Desktop: in-flow dock, width collapse when hidden
          open ? "md:w-[var(--sidebar-w)]" : "md:w-0 md:border-r-0"
        )}
      >
        <div className="flex flex-col h-full w-full md:w-[var(--sidebar-w)] shrink-0 min-w-0">
          {/* Brand header */}
          <div className="flex h-12 items-center gap-2 px-3 shrink-0">
            <QuillIcon className="size-5 shrink-0" />
            <span className="flex-1 text-sm font-semibold tracking-tight text-foreground truncate">
              Quill
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onClose}
              aria-label="Close sidebar"
              className="size-7 text-muted-foreground hover:text-foreground md:hidden"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Composer */}
          <div className="px-2 pb-1 shrink-0">
            <button
              onClick={onCreateNote}
              aria-label="New Note (Ctrl+N)"
              className="w-full h-9 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs font-semibold"
            >
              <Plus className="size-4 shrink-0" />
              New Note
            </button>
          </div>

          {/* Library tabs */}
          <div className="relative flex items-center gap-0.5 mx-2 mt-1 p-0.5 bg-muted/40 border border-border/50 shrink-0">
            <Corners size="sm" weight="thin" light />
            {libraryTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectPanel(tab.id)}
                  aria-current={activePanel === tab.id ? "page" : undefined}
                  className={cn(
                    "flex-1 h-7 flex items-center justify-center gap-1 text-[10px] font-mono uppercase tracking-wider transition-colors",
                    activePanel === tab.id
                      ? "bg-card text-foreground shadow-xs border border-border/60"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                  {tab.id === "trash" && trashedNotes.length > 0 && (
                    <span className="text-[9px] font-medium text-destructive">
                      {trashedNotes.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search (All / Favorites) */}
          {showSearch && (
            <div className="px-2 py-2 border-b border-border/40 shrink-0">
              <div className="relative">
                <Corners size="sm" weight="thin" light />
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground/60" />
                <Input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-8 pr-7 h-7 text-xs bg-background/70 font-sans"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onSearchChange("")}
                    className="absolute right-1.5 top-1 text-muted-foreground/60 hover:text-foreground size-5"
                  >
                    <X className="size-3" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <ScrollArea className="flex-1 min-h-0">
            {activePanel === "all" && (
              <div className="px-2 py-2 space-y-4">
                {(() => {
                  const grouped = groupNotesByDate(allNotes);
                  if (grouped.length === 0) {
                    return (
                      <div className="py-12 text-center text-xs text-muted-foreground px-4">
                        <p>{query ? "No matching notes found" : "No notes yet"}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onCreateNote}
                          className="mt-2 text-xs text-primary"
                        >
                          <Plus className="size-3 mr-1" />
                          Create your first note
                        </Button>
                      </div>
                    );
                  }
                  return grouped.map((group) => (
                    <div key={group.label}>
                      <div className="px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground/60">
                        {group.label}
                      </div>
                      <div className="space-y-1">{group.notes.map(renderRow)}</div>
                    </div>
                  ));
                })()}
              </div>
            )}

            {activePanel === "favorites" && (
              <div className="px-2 py-2 space-y-1">
                {favoriteNotes.length === 0 ? (
                  <div className="py-12 text-center">
                    <Star className="size-8 text-muted-foreground/25 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {query ? "No matching favorites" : "No favorites yet"}
                    </p>
                    {!query && (
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        Pin notes to add them here
                      </p>
                    )}
                  </div>
                ) : (
                  favoriteNotes.map(renderRow)
                )}
              </div>
            )}

            {activePanel === "trash" && (
              <div className="flex flex-col h-full">
                {trashedNotes.length > 0 && (
                  <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/40">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
                      {trashedNotes.length} deleted
                    </span>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={onEmptyTrash}
                      className="text-[10px] text-destructive hover:text-destructive h-6"
                    >
                      Empty Trash
                    </Button>
                  </div>
                )}
                <div className="p-2 space-y-1">
                  {trashedNotes.length === 0 ? (
                    <div className="py-12 text-center">
                      <Trash2 className="size-8 text-muted-foreground/25 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Trash is empty</p>
                    </div>
                  ) : (
                    trashedNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-2.5 rounded-none border border-border/50 bg-muted/20"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-medium text-foreground truncate flex-1">
                            {note.title || "Untitled"}
                          </span>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => onRestoreNote(note.id)}
                            className="size-6 text-muted-foreground hover:text-foreground"
                            title="Restore"
                          >
                            <RotateCcw className="size-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activePanel === "settings" && (
              <div className="p-3 space-y-3">
                <div className="border border-border/50 p-3 rounded-none bg-muted/20">
                  <h4 className="text-xs font-semibold text-foreground mb-2">Writing Goal</h4>
                  <div className="flex flex-wrap gap-1">
                    {[0, 250, 500, 1000].map((goal) => (
                      <Button
                        key={goal}
                        size="xs"
                        variant={writingGoal === goal ? "default" : "outline"}
                        onClick={() => onWritingGoalChange(goal)}
                        className="text-[10px] h-6 px-2"
                      >
                        {goal === 0 ? "None" : goal}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="border border-border/50 p-3 rounded-none bg-muted/20">
                  <h4 className="text-xs font-semibold text-foreground mb-2">Data</h4>
                  <div className="flex flex-col gap-1">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={onExportAll}
                      className="text-[10px] h-7 justify-start"
                    >
                      <FileText className="size-3 mr-1.5" />
                      Export All Notes
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={onImportBackup}
                      className="text-[10px] h-7 justify-start"
                    >
                      <FileText className="size-3 mr-1.5" />
                      Import Backup
                    </Button>
                  </div>
                </div>

                <div className="border border-border/50 p-3 rounded-none bg-muted/20">
                  <h4 className="text-xs font-semibold text-foreground mb-2">About</h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Quill v1.5.0 — Offline-first markdown notes
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Footer tools */}
          <div className="border-t border-border/50 px-2 py-1.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-0.5">
              <FooterButton label="Graph View" onClick={onOpenGraph}>
                <Network className="size-4" />
              </FooterButton>
              <FooterButton label="Writing Insights" onClick={onOpenInsights}>
                <BarChart3 className="size-4" />
              </FooterButton>
            </div>
            <FooterButton
              label="Settings"
              active={activePanel === "settings"}
              onClick={() => onSelectPanel(activePanel === "settings" ? "all" : "settings")}
            >
              <Settings className="size-4" />
            </FooterButton>
          </div>
        </div>

        {/* Desktop resize handle (drag, double-click to reset, arrow keys to adjust) */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          aria-valuenow={width}
          aria-valuemin={SIDEBAR_MIN_WIDTH}
          aria-valuemax={SIDEBAR_MAX_WIDTH}
          tabIndex={open ? 0 : -1}
          onPointerDown={handleResizeStart}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
          onLostPointerCapture={() => setIsResizing(false)}
          onDoubleClick={() => commitWidth(SIDEBAR_DEFAULT_WIDTH)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              commitWidth(clampSidebarWidth(width + (e.key === "ArrowLeft" ? -24 : 24)));
            }
          }}
          className={cn(
            "absolute inset-y-0 right-0 z-20 hidden w-1.5 -mr-px cursor-col-resize touch-none md:block",
            "after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-transparent after:transition-colors",
            "hover:after:bg-primary/40 focus-visible:after:bg-primary/60 focus-visible:outline-none",
            isResizing && "after:w-0.5 after:bg-primary/60"
          )}
        />
      </aside>
    </>
  );
}
