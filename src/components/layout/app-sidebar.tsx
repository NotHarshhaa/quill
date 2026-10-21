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
  Settings,
  FileText,
  LayoutTemplate,
  ArrowLeft,
  Upload,
  Download,
  Database,
  Check,
  Target,
  Sun,
  Moon,
  Laptop,
  PanelLeftClose,
  PanelLeftOpen,
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
import { QuillLogo, QuillIcon } from "./quill-logo";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { CURRENT_APP_VERSION } from "@/lib/updater/update-checker";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";
import { useIsMobileShell } from "@/hooks/useMediaQuery";
import { hapticTap } from "@/lib/ui/haptics";
import { NoteActionsSheet } from "./note-actions-sheet";

export type SidebarPanel = "all" | "favorites" | "trash" | "settings";

const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 480;
const SIDEBAR_DEFAULT_WIDTH = 270;
const SIDEBAR_WIDTH_KEY = "quill.sidebar.width";

function clampSidebarWidth(value: number): number {
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(value)));
}

function getSnippet(content: string, maxLength = 260): string {
  if (!content.trim()) return "Empty note";
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  const collected: string[] = [];
  for (const line of lines) {
    if (!line.startsWith("#") && !line.startsWith("!")) {
      const cleaned = line.replace(/^[-*]\s*(\[[ xX]\]\s*)?/, "").replace(/^>\s*/, "").trim();
      if (cleaned) {
        collected.push(cleaned);
        if (collected.join(" ").length >= maxLength) break;
      }
    }
  }
  return collected.join(" ").slice(0, maxLength) || lines[0]?.slice(0, maxLength) || "Empty note";
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

interface NoteRowProps {
  note: Note;
  isActive: boolean;
  onSelect: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  /** Touch devices: open the "···" actions in a bottom sheet instead. */
  onRequestActions?: (note: Note) => void;
  onSelectTag?: (tag: string | null) => void;
  selectedTag?: string | null;
}

function NoteRow({
  note,
  isActive,
  onSelect,
  onTogglePin,
  onDuplicate,
  onDelete,
  onRequestActions,
  onSelectTag,
  selectedTag,
}: NoteRowProps) {
  const snippet = getSnippet(note.content);
  const isMobileShell = useIsMobileShell();

  const handlePinSwipe = () => {
    const wasPinned = !!note.isPinned;
    hapticTap();
    onTogglePin(note.id);
    toast(wasPinned ? "Unpinned" : "Pinned to top", {
      duration: 5000,
      action: { label: "Undo", onClick: () => onTogglePin(note.id) },
    });
  };

  const handleTrashSwipe = () => {
    hapticTap("medium");
    onDelete(note.id);
  };

  const swipe = useHorizontalSwipe({
    threshold: 72,
    maxDrag: 104,
    ignoreSelector: "[data-swipe-ignore]",
    onSwipeLeft: handleTrashSwipe,
    onSwipeRight: handlePinSwipe,
  });

  const revealOpacity = (value: number) => Math.min(1, Math.max(0, value / 64));

  const handleRowClick = () => {
    // A committed swipe should never double as a tap-to-open
    if (swipe.swipedRef.current) {
      swipe.swipedRef.current = false;
      return;
    }
    onSelect(note.id);
  };

  return (
    <div className="relative w-full min-w-0 max-w-full overflow-hidden">
      {/* Swipe reveal layers (only visible while dragging) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 flex w-1/2 items-center gap-1.5 bg-amber-500/15 pl-3 text-amber-700 dark:text-amber-400"
        style={{ opacity: revealOpacity(swipe.dx) }}
      >
        {note.isPinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">
          {note.isPinned ? "Unpin" : "Pin"}
        </span>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 flex w-1/2 items-center justify-end gap-1.5 bg-destructive/15 pr-3 text-destructive"
        style={{ opacity: revealOpacity(-swipe.dx) }}
      >
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">
          Trash
        </span>
        <Trash2 className="size-3.5" />
      </div>

      <div
        {...swipe.bind}
        onClick={handleRowClick}
        style={{
          transform: swipe.dx ? `translateX(${swipe.dx}px)` : undefined,
          transition: swipe.dragging
            ? "none"
            : "transform 200ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        className={cn(
          "group relative w-full min-w-0 max-w-full text-left p-3 rounded-none transition-all cursor-pointer font-sans select-none box-border touch-pan-y",
          isActive
            ? "bg-card shadow-soft-md text-foreground ds-hairline-t"
            : "bg-card/40 hover:bg-muted/40 text-foreground/80 hover:text-foreground"
        )}
      >
      <Corners
        size="sm"
        offset="border"
        weight="thin"
        light={!isActive}
        className={cn(
          "transition-opacity",
          isActive ? "border-brand opacity-100" : "opacity-40 group-hover:opacity-100"
        )}
      />

      <div className="flex items-start justify-between gap-1.5 w-full min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
          {note.isPinned && (
            <Pin className="size-3 text-amber-600 dark:text-amber-400 fill-current shrink-0" />
          )}
          <h3
            className={cn(
              "text-xs truncate font-sans tracking-tight block w-full min-w-0",
              isActive ? "text-foreground font-semibold" : "text-foreground/90 font-medium"
            )}
          >
            {note.title || "Untitled"}
          </h3>
        </div>

        {/* Action dropdown */}
        <div
          className={cn(
            "flex items-center gap-0.5 shrink-0 transition-opacity",
            isActive
              ? "opacity-100"
              : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
          )}
        >
          {isMobileShell && onRequestActions ? (
            <Button
              variant="ghost"
              size="icon-xs"
              data-swipe-ignore
              onClick={(e) => {
                e.stopPropagation();
                onRequestActions(note);
              }}
              className="size-7 rounded-none text-muted-foreground hover:text-foreground"
              aria-label="Note options"
            >
              <MoreVertical className="size-3" />
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  data-swipe-ignore
                  onClick={(e) => e.stopPropagation()}
                  className="size-7 md:size-5.5 rounded-none text-muted-foreground hover:text-foreground"
                  aria-label="Note options"
                >
                  <MoreVertical className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 font-sans text-xs rounded-none border-border/80">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(note.id);
                  }}
                  className="gap-2 text-xs cursor-pointer"
                >
                  {note.isPinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                  <span>{note.isPinned ? "Unpin" : "Pin to Top"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(note.id);
                  }}
                  className="gap-2 text-xs cursor-pointer"
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
                  className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                  <span>Move to Trash</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Snippet preview - multi-line wrapped */}
      {/* NOTE: no `block` here — `line-clamp` sets the display itself, and a
          competing `display:block` silently disables the clamp. */}
      <p className="text-[11px] text-muted-foreground/75 line-clamp-2 mt-1.5 leading-relaxed font-sans w-full min-w-0 break-words">
        {snippet}
      </p>

      {/* Tags and Date */}
      <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-1.5 border-t border-border/30 w-full min-w-0">
        <div className="flex items-center gap-1 flex-wrap min-w-0 flex-1 overflow-hidden">
          {note.tags && note.tags.length > 0 ? (
            note.tags.slice(0, 3).map((tag) => (
              <button
                key={tag}
                type="button"
                data-swipe-ignore
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTag?.(selectedTag === tag ? null : tag);
                }}
                className={cn(
                  "text-[9.5px] font-mono px-1.5 py-0.2 rounded-none transition-colors truncate max-w-[80px]",
                  selectedTag === tag
                    ? "bg-brand-soft text-brand font-semibold"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground"
                )}
                title={`Filter by #${tag}`}
              >
                #{tag}
              </button>
            ))
          ) : (
            <span className="text-[9px] font-mono text-muted-foreground/40">#none</span>
          )}
          {note.tags && note.tags.length > 3 && (
            <span className="text-[9px] font-mono text-muted-foreground/60 shrink-0">
              +{note.tags.length - 3}
            </span>
          )}
        </div>

        <span className="text-[9.5px] font-mono text-muted-foreground/50 shrink-0">
          {formatDate(note.updatedAt)}
        </span>
      </div>
      </div>
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
  onOpenTemplates?: () => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDuplicateNote: (id: string) => void;
  onRestoreNote: (id: string) => void;
  onPurgeNote?: (id: string) => void;
  onEmptyTrash: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTag?: string | null;
  onSelectTag?: (tag: string | null) => void;
  allTags?: string[];
  onOpen?: () => void;
  writingGoal: number;
  onWritingGoalChange: (goal: number) => void;
  onExportAll: () => void;
  onImportBackup: () => void;
  onImportMarkdown?: () => void;
  /** Phone shell: true while this sidebar is the active full-screen "Notes" page. */
  mobilePage?: boolean;
  /** Increment to move focus into the search field (used by the phone More sheet). */
  searchFocusSignal?: number;
}

export function AppSidebar({
  open,
  onClose,
  onOpen,
  mobilePage = false,
  searchFocusSignal = 0,
  activePanel,
  onSelectPanel,
  notes,
  trashedNotes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onOpenTemplates,
  onDeleteNote,
  onTogglePin,
  onDuplicateNote,
  onRestoreNote,
  onPurgeNote,
  onEmptyTrash,
  searchQuery,
  onSearchChange,
  selectedTag,
  onSelectTag,
  allTags = [],
  writingGoal,
  onWritingGoalChange,
  onExportAll,
  onImportBackup,
  onImportMarkdown,
}: AppSidebarProps) {
  const asideRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [width, setWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  /** Note whose "···" actions are open in the touch bottom sheet. */
  const [actionsNote, setActionsNote] = useState<Note | null>(null);
  /** Tag strip: collapsed hides tags beyond the first 6 behind "+N more". */
  const [allTagsExpanded, setAllTagsExpanded] = useState(false);
  const { theme, setTheme } = useTheme();

  // Restore persisted width
  useEffect(() => {
    const stored = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
    if (Number.isFinite(stored) && stored > 0) {
      setWidth(clampSidebarWidth(stored));
    }
  }, []);

  // Focus the search field when the mobile shell asks for it
  useEffect(() => {
    if (searchFocusSignal > 0) {
      searchInputRef.current?.focus();
    }
  }, [searchFocusSignal]);

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

  // Note filtering
  const query = searchQuery.trim().toLowerCase();
  const matchesQueryAndTag = (note: Note) => {
    const matchesSearch =
      !query ||
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.tags?.some((t) => t.toLowerCase().includes(query));

    const matchesTag = !selectedTag || (note.tags && note.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  };

  const allNotes = activePanel === "all" ? notes.filter(matchesQueryAndTag) : [];
  const favoriteNotes =
    activePanel === "favorites" ? notes.filter((n) => n.isPinned && matchesQueryAndTag(n)) : [];
  const filteredTrashNotes =
    activePanel === "trash" ? trashedNotes.filter((n) => !query || n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query)) : [];

  const pinnedCount = notes.filter((n) => n.isPinned).length;

  const handleNoteClick = (id: string) => {
    onSelectNote(id);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      onClose();
    }
  };

  const handleNewNoteClick = () => {
    onCreateNote();
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      onClose();
    }
  };

  const handleDuplicate = (id: string) => {
    onDuplicateNote(id);
    toast.success("Note duplicated");
  };

  const handleMoveToTrash = (id: string) => {
    onDeleteNote(id);
    toast("Moved to Trash", {
      duration: 6000,
      action: { label: "Undo", onClick: () => onRestoreNote(id) },
    });
  };

  return (
    <>
      <aside
        ref={asideRef}
        data-tour="sidebar"
        aria-label="Library"
        style={{ "--sidebar-w": `${width}px` } as React.CSSProperties}
        className={cn(
          "relative flex flex-col h-full bg-card/95 shrink-0 overflow-hidden select-none font-sans",
          "shadow-soft",
          isResizing
            ? "transition-none"
            : "transition-[transform,width] duration-200 ease-out motion-reduce:transition-none",
          // Phone (<768px): a full-screen "Notes" page that slides over the editor
          "max-md:absolute max-md:inset-0 max-md:z-30 max-md:h-full max-md:w-full max-md:border-r-0 max-md:bg-background",
          mobilePage
            ? "max-md:translate-x-0 max-md:opacity-100"
            : "max-md:pointer-events-none max-md:-translate-x-full max-md:opacity-0",
          // Desktop: in-flow dock (Full width when open, sleek 48px icon rail when closed)
          open ? "md:w-[var(--sidebar-w)]" : "md:w-12"
        )}
      >
        {!open ? (
          /* Collapsed Mini Rail (Desktop) */
          <div
            className="hidden md:flex flex-col h-full w-12 items-center py-2 shrink-0 select-none overflow-y-auto no-scrollbar"
            style={{
              paddingTop: "var(--safe-top)",
              paddingBottom: "var(--safe-bottom)",
            }}
          >
            {/* Brand Logo / Monogram */}
            <div className="h-10 flex items-center justify-center shrink-0 mb-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="p-1.5 hover:bg-muted/60 text-foreground transition-all rounded-none cursor-pointer group"
                    aria-label="Expand library (Ctrl+B)"
                  >
                    <QuillIcon className="size-5 transition-transform group-hover:scale-110" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="font-sans text-xs">
                  Quill — Expand Library (Ctrl+B)
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Quick Action: New Note Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleNewNoteClick}
                  className="relative size-8 flex items-center justify-center bg-brand text-brand-foreground hover:bg-brand/90 transition-colors rounded-none shadow-soft cursor-pointer group mb-1.5 shrink-0"
                  aria-label="New Note (Ctrl+N)"
                >
                  <Corners size="sm" weight="thin" light />
                  <Plus className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8} className="font-sans text-xs">
                New Note (Ctrl+N)
              </TooltipContent>
            </Tooltip>

            {/* Templates picker button */}
            {onOpenTemplates && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onOpenTemplates}
                    className="size-8 text-muted-foreground hover:text-foreground rounded-none shrink-0 mb-1"
                    aria-label="Note Templates"
                  >
                    <LayoutTemplate className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="font-sans text-xs">
                  Note Templates
                </TooltipContent>
              </Tooltip>
            )}

            {/* Divider */}
            <div className="w-5 h-px bg-border/60 my-1.5 shrink-0" />

            {/* Navigation Panels */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              {/* All Notes */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPanel("all");
                      onOpen?.();
                    }}
                    className={cn(
                      "relative size-8 flex items-center justify-center rounded-none transition-colors cursor-pointer",
                      activePanel === "all"
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                    aria-label={`All Notes (${notes.length})`}
                  >
                    {activePanel === "all" && <Corners size="sm" weight="thin" light />}
                    <FileText className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="font-sans text-xs">
                  All Notes ({notes.length})
                </TooltipContent>
              </Tooltip>

              {/* Favorites / Pinned */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPanel("favorites");
                      onOpen?.();
                    }}
                    className={cn(
                      "relative size-8 flex items-center justify-center rounded-none transition-colors cursor-pointer",
                      activePanel === "favorites"
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                    aria-label={`Pinned Notes (${pinnedCount})`}
                  >
                    {activePanel === "favorites" && <Corners size="sm" weight="thin" light />}
                    <Pin className={cn("size-3.5", activePanel === "favorites" ? "fill-current text-primary-foreground" : (pinnedCount > 0 && "text-amber-500 fill-current"))} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="font-sans text-xs">
                  Pinned Notes ({pinnedCount})
                </TooltipContent>
              </Tooltip>

              {/* Trash */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPanel("trash");
                      onOpen?.();
                    }}
                    className={cn(
                      "relative size-8 flex items-center justify-center rounded-none transition-colors cursor-pointer",
                      activePanel === "trash"
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                    aria-label={`Trash (${trashedNotes.length})`}
                  >
                    {activePanel === "trash" && <Corners size="sm" weight="thin" light />}
                    <Trash2 className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="font-sans text-xs">
                  Trash ({trashedNotes.length})
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Flexible Spacer */}
            <div className="flex-1 min-h-2" />

            {/* Bottom: single Tools & Settings menu — graph/insights/ambient now
                also live in the Command Palette. */}
            <div className="flex flex-col items-center gap-1 shrink-0 pt-2 ds-hairline-t w-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "size-8 flex items-center justify-center rounded-none transition-colors cursor-pointer",
                          activePanel === "settings"
                            ? "bg-brand-soft text-brand"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                        aria-label="Tools & Settings"
                      >
                        <Settings className="size-icon-sm" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" className="w-52 font-sans text-xs rounded-none border border-border/60 bg-card shadow-soft-md p-1">
                      <DropdownMenuItem className="gap-2.5 py-2 normal-case tracking-normal font-sans cursor-pointer" onClick={() => onSelectPanel(activePanel === "settings" ? "all" : "settings")}>
                        <Settings className="size-3.5 text-muted-foreground" />
                        <span>Settings & Data</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border/50" />
                      <DropdownMenuItem className="gap-2.5 py-2 normal-case tracking-normal font-sans cursor-pointer" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                        {theme === "dark" ? <Sun className="size-3.5 text-muted-foreground" /> : <Moon className="size-3.5 text-muted-foreground" />}
                        <span>Toggle theme</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border/50" />
                      <DropdownMenuItem className="gap-2.5 py-2 normal-case tracking-normal font-sans cursor-pointer" onClick={onOpen}>
                        <PanelLeftOpen className="size-3.5 text-muted-foreground" />
                        <span>Expand library</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="font-sans text-xs">
                  Tools & Settings
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        ) : (
          /* Expanded Sidebar Content */
          <div className="flex flex-col h-full w-full min-w-0 overflow-hidden box-border">
            {/* Brand header (Unified h-12 height + safe area top) */}
            <div
              className="shrink-0 bg-background/50 select-none ds-hairline-b"
              style={{
                paddingTop: "var(--safe-top)",
              }}
            >
              <div className="h-12 px-3 flex items-center justify-between gap-2 shrink-0">
                <QuillLogo />

              <div className="flex items-center gap-1 shrink-0">
                {/* Desktop collapse button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={onClose}
                      aria-label="Collapse library"
                      className="size-7 rounded-none text-muted-foreground hover:text-foreground hidden md:inline-flex"
                    >
                      <PanelLeftClose className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-sans text-xs">
                    Collapse to Rail (Ctrl+B)
                  </TooltipContent>
                </Tooltip>

                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={onClose}
                  aria-label="Close sidebar"
                  className="size-7 rounded-none text-muted-foreground hover:text-foreground md:hidden"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Primary Actions: New Note + Templates Combo.
              On the phone library the bottom-nav FAB creates notes and the
              More sheet holds Templates, so this row is redundant there —
              skipping it gives the list another 40px of screen. */}
          {!mobilePage && (
          <div className="p-2.5 pb-2 shrink-0 flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleNewNoteClick}
              aria-label="New Note (Ctrl+N)"
              className="relative flex-1 h-8 flex items-center justify-center gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90 transition-colors text-xs font-semibold rounded-none shadow-soft"
            >
              <Corners size="sm" weight="thin" light />
              <Plus className="size-3.5 shrink-0" />
              <span>New Note</span>
            </button>

            {onOpenTemplates && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="xs"
                    onClick={onOpenTemplates}
                    aria-label="Note Templates"
                    className="relative h-8 px-2.5 rounded-none text-primary-foreground text-xs gap-1 font-mono tracking-tight shrink-0 shadow-xs"
                  >
                    <Corners size="sm" weight="thin" light />
                    <LayoutTemplate className="size-3.5" />
                    <span className="text-[11px]">Templates</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-sans text-xs">
                  Choose from Note Templates
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          )}

          {/* Library Tabs (All / Favorites / Trash) — segmented control.
              The active segment carries the single brand accent; the track is a
              tinted, borderless surface. On the phone library the scope and the
              tag filters share one scrollable row instead. */}
          {!mobilePage && (
          <div
            className="relative flex items-center gap-0.5 mx-2.5 p-0.5 shrink-0 bg-muted/60 rounded-none"
            role="tablist"
            aria-label="Library view"
            style={{ boxShadow: "var(--elevation-soft)" }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={activePanel === "all"}
              onClick={() => onSelectPanel("all")}
              className={cn(
                "flex-1 h-7.5 flex items-center justify-center gap-1.5 text-xs font-mono uppercase tracking-wider transition-all rounded-none cursor-pointer",
                activePanel === "all"
                  ? "bg-brand text-brand-foreground shadow-soft font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText className="size-icon-sm shrink-0" />
              <span>ALL</span>
              <span className={cn("text-[10px] font-mono", activePanel === "all" ? "text-brand-foreground/80" : "opacity-70")}>({notes.length})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activePanel === "favorites"}
              onClick={() => onSelectPanel("favorites")}
              className={cn(
                "flex-1 h-7.5 flex items-center justify-center gap-1.5 text-xs font-mono uppercase tracking-wider transition-all rounded-none cursor-pointer",
                activePanel === "favorites"
                  ? "bg-brand text-brand-foreground shadow-soft font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Star className={cn("size-icon-sm shrink-0", activePanel === "favorites" ? "fill-current text-brand-foreground" : "text-amber-500")} />
              <span>FAVS</span>
              <span className={cn("text-[10px] font-mono", activePanel === "favorites" ? "text-brand-foreground/80" : "opacity-70")}>({pinnedCount})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activePanel === "trash"}
              onClick={() => onSelectPanel("trash")}
              className={cn(
                "flex-1 h-7.5 flex items-center justify-center gap-1.5 text-xs font-mono uppercase tracking-wider transition-all rounded-none cursor-pointer",
                activePanel === "trash"
                  ? "bg-brand text-brand-foreground shadow-soft font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Trash2 className="size-icon-sm shrink-0" />
              <span>TRASH</span>
              {trashedNotes.length > 0 && (
                <span className={cn("text-[10px] font-mono font-bold", activePanel === "trash" ? "text-brand-foreground" : "text-destructive")}>
                  ({trashedNotes.length})
                </span>
              )}
            </button>
          </div>
          )}

          {/* Search bar (Available in All, Favorites, and Trash) */}
          {activePanel !== "settings" && (
            <div className="px-2.5 pt-2 pb-1.5 shrink-0">
              <div className="relative">
                <Corners size="sm" weight="thin" light />
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground/60" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder={
                    activePanel === "trash"
                      ? "Search in trash..."
                      : "Search notes or tags..."
                  }
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-8 pr-7 h-9 text-xs bg-muted/50 font-sans rounded-none border-transparent shadow-soft focus-visible:ring-1 focus-visible:bg-background"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange("")}
                    className="absolute right-2 top-2 text-muted-foreground hover:text-foreground size-4 flex items-center justify-center"
                    aria-label="Clear search"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Phone library: scope (All / Favourites / Trash) and tag filters
              share ONE horizontally scrollable chip row, so the list gets the
              screen instead of three stacked control bars. */}
          {mobilePage && activePanel !== "settings" && (
            <div className="shrink-0 w-full min-w-0 overflow-x-auto horizontal-toolbar-scroll">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 w-max">
                <FilterChip
                  active={activePanel === "all"}
                  onClick={() => onSelectPanel("all")}
                  icon={FileText}
                >
                  All
                  <span className="opacity-60">{notes.length}</span>
                </FilterChip>
                <FilterChip
                  active={activePanel === "favorites"}
                  onClick={() => onSelectPanel("favorites")}
                  icon={Star}
                >
                  Favourites
                  <span className="opacity-60">{pinnedCount}</span>
                </FilterChip>
                <FilterChip
                  active={activePanel === "trash"}
                  onClick={() => onSelectPanel("trash")}
                  icon={Trash2}
                  count={trashedNotes.length}
                >
                  Trash
                </FilterChip>
                {allTags.map((tag) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <FilterChip
                      key={tag}
                      active={isSelected}
                      onClick={() => onSelectTag?.(isSelected ? null : tag)}
                    >
                      #{tag}
                    </FilterChip>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic Tag Filter Strip — single horizontally scrollable row
              with a "+N more" affordance past 6 tags. */}
          {!mobilePage && activePanel !== "settings" && activePanel !== "trash" && allTags.length > 0 && (
            <div className="px-2.5 py-1 shrink-0 w-full min-w-0">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none w-full touch-pan-x">
                <button
                  type="button"
                  onClick={() => onSelectTag?.(null)}
                  className={cn(
                    "text-[10px] font-mono uppercase px-2 py-0.5 rounded-none whitespace-nowrap shrink-0 transition-colors",
                    !selectedTag
                      ? "bg-brand-soft text-brand font-semibold"
                      : "bg-muted/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  All
                </button>
                {(allTagsExpanded ? allTags : allTags.slice(0, 6)).map((tag) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onSelectTag?.(isSelected ? null : tag)}
                      className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded-none whitespace-nowrap shrink-0 transition-colors",
                        isSelected
                          ? "bg-brand-soft text-brand font-semibold"
                          : "bg-muted/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      #{tag}
                    </button>
                  );
                })}
                {!allTagsExpanded && allTags.length > 6 && (
                  <button
                    type="button"
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    onClick={() => setAllTagsExpanded(true)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-none whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground bg-muted/40"
                  >
                    +{allTags.length - 6} more
                  </button>
                )}
                {allTagsExpanded && allTags.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setAllTagsExpanded(false)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-none whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground bg-muted/40"
                  >
                    Show less
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <ScrollArea className="flex-1 min-h-0 w-full min-w-0 overflow-hidden">
            {/* All Notes Panel */}
            {activePanel === "all" && (
              <div className="p-2.5 space-y-2.5 w-full min-w-0">
                {(() => {
                  const grouped = groupNotesByDate(allNotes);
                  if (grouped.length === 0) {
                    return (
                      <div className="py-12 text-center text-xs text-muted-foreground px-4 font-sans">
                        <FileText className="size-7 mx-auto mb-2 opacity-30" />
                        <p>{query || selectedTag ? "No matching notes found" : "No notes yet"}</p>
                        {selectedTag && (
                          <Button
                            variant="link"
                            size="xs"
                            onClick={() => onSelectTag?.(null)}
                            className="text-xs text-primary mt-1"
                          >
                            Clear #{selectedTag} filter
                          </Button>
                        )}
                        {!query && !selectedTag && (
                          <Button
                            variant="default"
                            size="xs"
                            onClick={handleNewNoteClick}
                            className="mt-3 text-xs rounded-none shadow-xs"
                          >
                            <Plus className="size-3 mr-1" />
                            Create your first note
                          </Button>
                        )}
                      </div>
                    );
                  }
                  return grouped.map((group) => (
                    <div key={group.label} className="space-y-1 w-full min-w-0">
                      <div className="px-1 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center justify-between">
                        <span>{group.label}</span>
                        <span className="text-[9px] font-normal opacity-60">({group.notes.length})</span>
                      </div>
                      <div className="space-y-1.5 w-full min-w-0">
                        {group.notes.map((note) => (
                          <NoteRow
                            key={note.id}
                            note={note}
                            isActive={note.id === activeNoteId}
                            onSelect={handleNoteClick}
                            onTogglePin={onTogglePin}
                            onDuplicate={handleDuplicate}
                            onDelete={handleMoveToTrash}
                            onRequestActions={setActionsNote}
                            onSelectTag={onSelectTag}
                            selectedTag={selectedTag}
                          />
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}

            {/* Favorites Panel */}
            {activePanel === "favorites" && (
              <div className="p-2.5 space-y-1.5 w-full min-w-0">
                {favoriteNotes.length === 0 ? (
                  <div className="py-12 text-center font-sans">
                    <Star className="size-8 text-amber-500/20 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {query || selectedTag ? "No matching favorites" : "No pinned notes yet"}
                    </p>
                    {!query && !selectedTag && (
                      <p className="text-[10.5px] text-muted-foreground/60 mt-1">
                        Pin important notes to keep them here
                      </p>
                    )}
                  </div>
                ) : (
                  favoriteNotes.map((note) => (
                    <NoteRow
                      key={note.id}
                      note={note}
                      isActive={note.id === activeNoteId}
                      onSelect={handleNoteClick}
                      onTogglePin={onTogglePin}
                      onDuplicate={handleDuplicate}
                      onDelete={handleMoveToTrash}
                      onRequestActions={setActionsNote}
                      onSelectTag={onSelectTag}
                      selectedTag={selectedTag}
                    />
                  ))
                )}
              </div>
            )}

            {/* Trash Panel */}
            {activePanel === "trash" && (
              <div className="flex flex-col h-full">
                {trashedNotes.length > 0 && (
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-destructive/5">
                    <span className="text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground">
                      {trashedNotes.length} deleted note{trashedNotes.length === 1 ? "" : "s"}
                    </span>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={onEmptyTrash}
                      className="text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10 h-6 rounded-none px-2"
                    >
                      Empty Trash
                    </Button>
                  </div>
                )}
                <div className="p-2.5 space-y-1.5 w-full min-w-0">
                  {filteredTrashNotes.length === 0 ? (
                    <div className="py-12 text-center font-sans">
                      <Trash2 className="size-8 text-muted-foreground/25 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {query ? "No matching trashed notes" : "Trash is empty"}
                      </p>
                    </div>
                  ) : (
                    filteredTrashNotes.map((note) => (
                      <div
                        key={note.id}
                        className="group relative p-2.5 rounded-none bg-muted/20 hover:bg-muted/40 transition-colors w-full min-w-0 max-w-full box-border shadow-soft"
                      >
                        <Corners size="sm" offset="border" weight="thin" light className="opacity-40 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-medium text-foreground truncate flex-1">
                            {note.title || "Untitled"}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon-xs"
                                  variant="default"
                                  onClick={() => onRestoreNote(note.id)}
                                  className="size-6 rounded-none"
                                  aria-label="Restore note"
                                >
                                  <RotateCcw className="size-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs font-sans">
                                Restore note
                              </TooltipContent>
                            </Tooltip>

                            {onPurgeNote && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon-xs"
                                    variant="ghost"
                                    onClick={() => onPurgeNote(note.id)}
                                    className="size-6 rounded-none text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    aria-label="Delete permanently"
                                  >
                                    <Trash2 className="size-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs font-sans">
                                  Delete permanently
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                        <p className="text-[10.5px] text-muted-foreground/75 line-clamp-2 mt-1.5 leading-relaxed">
                          {getSnippet(note.content, 120)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Dedicated Settings & Library Data View */}
            {activePanel === "settings" && (
              <div className="flex flex-col h-full font-sans">
                {/* Header with back button */}
                <div className="flex items-center justify-between px-3 py-2 bg-muted/20 ds-hairline-b">
                  <span className="text-xs font-semibold tracking-tight text-foreground">
                    Preferences & Data
                  </span>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => onSelectPanel("all")}
                    className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground rounded-none"
                  >
                    <ArrowLeft className="size-3" />
                    <span>Back to Notes</span>
                  </Button>
                </div>

                <div className="p-3 space-y-3">
                  {/* Session Writing Goal */}
                  <div className="rounded-none bg-card/60 p-3 shadow-soft-md space-y-2 relative">
                    <Corners size="sm" weight="thin" light />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Target className="size-3.5 text-primary" />
                        <h4 className="text-xs font-semibold text-foreground">Session Word Goal</h4>
                      </div>
                      {writingGoal > 0 && (
                        <span className="text-[10px] font-mono text-primary font-bold">
                          {writingGoal}w active
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-muted-foreground">
                      Track your writing target for this session with a live progress indicator.
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {[0, 250, 500, 1000].map((goal) => (
                        <Button
                          key={goal}
                          size="xs"
                          variant={writingGoal === goal ? "default" : "outline"}
                          onClick={() => onWritingGoalChange(goal)}
                          className="text-[10.5px] h-6 px-2 font-mono rounded-none"
                        >
                          {goal === 0 ? "Free Write" : `${goal}w`}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Data Management */}
                  <div className="rounded-none bg-card/60 p-3 shadow-soft-md space-y-2 relative">
                    <Corners size="sm" weight="thin" light />
                    <div className="flex items-center gap-1.5">
                      <Database className="size-3.5 text-primary" />
                      <h4 className="text-xs font-semibold text-foreground">Data & Backups</h4>
                    </div>
                    <p className="text-[10.5px] text-muted-foreground">
                      100% offline data. Export your vault or import notes anytime.
                    </p>
                    <div className="flex flex-col gap-1.5 pt-1">
                      {onImportMarkdown && (
                        <Button
                          size="xs"
                          variant="default"
                          onClick={onImportMarkdown}
                          className="text-[11px] h-7.5 justify-start rounded-none"
                        >
                          <Upload className="size-3.5 mr-2" />
                          Import Markdown (.md)
                        </Button>
                      )}
                      <Button
                        size="xs"
                        variant="default"
                        onClick={onExportAll}
                        className="text-[11px] h-7.5 justify-start rounded-none"
                      >
                        <Download className="size-3.5 mr-2" />
                        Backup All Notes (.json)
                      </Button>
                      <Button
                        size="xs"
                        variant="default"
                        onClick={onImportBackup}
                        className="text-[11px] h-7.5 justify-start rounded-none"
                      >
                        <Database className="size-3.5 mr-2" />
                        Restore JSON Backup
                      </Button>
                    </div>
                  </div>

                  {/* Theme & Appearance */}
                  <div className="rounded-none bg-card/60 p-3 shadow-soft-md space-y-2 relative">
                    <Corners size="sm" weight="thin" light />
                    <div className="flex items-center gap-1.5">
                      <Sun className="size-3.5 text-primary" />
                      <h4 className="text-xs font-semibold text-foreground">Theme & Display</h4>
                    </div>
                    <div className="flex items-center gap-1 pt-1">
                      <Button
                        size="xs"
                        variant={theme === "light" ? "default" : "secondary"}
                        onClick={() => setTheme("light")}
                        className="flex-1 text-[10.5px] h-6 rounded-none gap-1"
                      >
                        <Sun className="size-3" />
                        Light
                      </Button>
                      <Button
                        size="xs"
                        variant={theme === "dark" ? "default" : "secondary"}
                        onClick={() => setTheme("dark")}
                        className="flex-1 text-[10.5px] h-6 rounded-none gap-1"
                      >
                        <Moon className="size-3" />
                        Dark
                      </Button>
                      <Button
                        size="xs"
                        variant={theme === "system" ? "default" : "secondary"}
                        onClick={() => setTheme("system")}
                        className="flex-1 text-[10.5px] h-6 rounded-none gap-1"
                      >
                        <Laptop className="size-3" />
                        Auto
                      </Button>
                    </div>
                  </div>

                  {/* About Section */}
                  <div className="rounded-none bg-card/60 p-3 shadow-soft-md space-y-1.5 relative">
                    <Corners size="sm" weight="thin" light />
                    <h4 className="text-xs font-semibold text-foreground">About Quill</h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Quill v{CURRENT_APP_VERSION} — Offline-first Markdown desk with client-side indexing, revision histories, and zero telemetry.
                    </p>
                    <div className="flex items-center gap-2 pt-1 font-mono text-[9.5px] text-muted-foreground/80">
                      <span>Total Notes: {notes.length}</span>
                      <span>·</span>
                      <span>Trash: {trashedNotes.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Footer: single Settings utility entry (Graph/Insights/Ambient now live in the More menu + Command Palette) */}
          <div className="px-2 shrink-0 bg-background/50 font-sans select-none ds-hairline-t">
            <div className="h-10 flex items-center justify-end">
              {/* Settings Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onSelectPanel(activePanel === "settings" ? "all" : "settings")}
                    aria-label="Library Settings"
                    className={cn(
                      "size-7 rounded-none transition-colors",
                      activePanel === "settings"
                        ? "text-primary bg-muted/80"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Settings className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="font-sans text-xs">
                  {activePanel === "settings" ? "Back to Notes" : "Settings & Data"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      )}

        {/* Desktop Resize Handle (only visible when expanded) */}
        {open && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            aria-valuenow={width}
            aria-valuemin={SIDEBAR_MIN_WIDTH}
            aria-valuemax={SIDEBAR_MAX_WIDTH}
            tabIndex={0}
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
              "hover:after:bg-primary/50 focus-visible:after:bg-primary/70 focus-visible:outline-none",
              isResizing && "after:w-0.5 after:bg-primary"
            )}
          />
        )}
      </aside>

      {/* Touch devices: the note "···" actions open as a bottom sheet */}
      <NoteActionsSheet
        open={!!actionsNote}
        onOpenChange={(next) => {
          if (!next) setActionsNote(null);
        }}
        note={actionsNote ?? undefined}
        onTogglePin={onTogglePin}
        onDuplicate={handleDuplicate}
        onMoveToTrash={handleMoveToTrash}
      />
    </>
  );
}

/**
 * Compact, tappable filter chip for the phone library. 32px tall, 44px wide
 * touch target on the axis it scrolls, and it never wraps — the row scrolls.
 */
function FilterChip({
  active,
  onClick,
  icon: Icon,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-none px-3 text-[11px] font-medium transition-colors motion-reduce:transition-none",
        active
          ? "bg-brand-soft text-brand font-semibold"
          : "bg-muted/50 text-muted-foreground hover:text-foreground active:bg-muted"
      )}
    >
      {Icon && <Icon className="size-3.5 shrink-0" />}
      {children}
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "font-mono text-[10px]",
            active ? "text-brand/70" : "text-muted-foreground/70"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
