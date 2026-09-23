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
  LayoutTemplate,
  Headphones,
  HelpCircle,
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
import { AmbientSoundPlayer } from "@/components/audio/ambient-sound-player";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { CURRENT_APP_VERSION } from "@/lib/updater/update-checker";

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
  onSelectTag,
  selectedTag,
}: NoteRowProps) {
  const snippet = getSnippet(note.content);

  return (
    <div
      onClick={() => onSelect(note.id)}
      className={cn(
        "group relative w-full min-w-0 max-w-full text-left p-3 rounded-none transition-all cursor-pointer font-sans select-none box-border",
        isActive
          ? "bg-card shadow-xs border border-border text-foreground"
          : "bg-card/40 hover:bg-muted/40 text-foreground/80 hover:text-foreground border border-border/60 hover:border-border/90"
      )}
    >
      <Corners
        size="sm"
        offset="border"
        weight="thin"
        light={!isActive}
        className={cn(
          "transition-opacity",
          isActive ? "border-primary opacity-100" : "opacity-40 group-hover:opacity-100"
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => e.stopPropagation()}
                className="size-5.5 rounded-none text-muted-foreground hover:text-foreground"
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
        </div>
      </div>

      {/* Snippet preview - multi-line wrapped */}
      <p className="text-[11px] text-muted-foreground/75 line-clamp-2 mt-1.5 leading-relaxed font-sans block w-full min-w-0 break-words">
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
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTag?.(selectedTag === tag ? null : tag);
                }}
                className={cn(
                  "text-[9.5px] font-mono px-1.5 py-0.2 rounded-none transition-colors border truncate max-w-[80px]",
                  selectedTag === tag
                    ? "bg-primary text-primary-foreground border-primary font-semibold"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground border-border/40 hover:border-border"
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
  onOpenGraph: () => void;
  onOpenInsights: () => void;
  onOpenWelcome?: () => void;
  onOpen?: () => void;
  writingGoal: number;
  onWritingGoalChange: (goal: number) => void;
  onExportAll: () => void;
  onImportBackup: () => void;
  onImportMarkdown?: () => void;
}

export function AppSidebar({
  open,
  onClose,
  onOpen,
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
  onOpenGraph,
  onOpenInsights,
  onOpenWelcome,
  writingGoal,
  onWritingGoalChange,
  onExportAll,
  onImportBackup,
  onImportMarkdown,
}: AppSidebarProps) {
  const asideRef = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const { theme, setTheme } = useTheme();

  // Restore persisted width
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

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-200 md:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      <aside
        ref={asideRef}
        aria-label="Library"
        style={{ "--sidebar-w": `${width}px` } as React.CSSProperties}
        className={cn(
          "relative flex flex-col h-full bg-card/95 border-r border-border/80 shrink-0 overflow-hidden select-none font-sans",
          isResizing
            ? "transition-none"
            : "transition-[width,transform] duration-200 ease-out",
          // Mobile: off-canvas drawer
          "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:h-[100dvh]",
          "max-md:w-[min(320px,calc(100vw-2.5rem))]",
          open ? "max-md:translate-x-0 max-md:shadow-2xl" : "max-md:-translate-x-full",
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
                  className="relative size-8 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-none border border-primary shadow-xs cursor-pointer group mb-1.5 shrink-0"
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

            {/* Divider */}
            <div className="w-5 h-px bg-border/60 my-1.5 shrink-0" />

            {/* Tools / Features */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              {onOpenGraph && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={onOpenGraph}
                      className="size-8 text-muted-foreground hover:text-foreground rounded-none"
                      aria-label="Knowledge Graph"
                    >
                      <Network className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8} className="font-sans text-xs">
                    Knowledge Graph (Ctrl+G)
                  </TooltipContent>
                </Tooltip>
              )}

              {onOpenInsights && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={onOpenInsights}
                      className="size-8 text-muted-foreground hover:text-foreground rounded-none"
                      aria-label="Writing Analytics"
                    >
                      <BarChart3 className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8} className="font-sans text-xs">
                    Writing Analytics & Insights
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Ambient Soundscapes in Rail */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="size-8 text-muted-foreground hover:text-foreground rounded-none"
                        aria-label="Ambient Soundscapes"
                      >
                        <Headphones className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8} className="font-sans text-xs">
                    Ambient Soundscapes & Focus
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent side="right" align="start" className="p-0 border-none bg-transparent shadow-none w-auto">
                  <AmbientSoundPlayer />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Flexible Spacer */}
            <div className="flex-1 min-h-2" />

            {/* Bottom Utilities */}
            <div className="flex flex-col items-center gap-1 shrink-0 pt-2 border-t border-border/60 w-full">
              {/* Vault Preferences & Data */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPanel(activePanel === "settings" ? "all" : "settings");
                      onOpen?.();
                    }}
                    className={cn(
                      "relative size-8 flex items-center justify-center rounded-none transition-colors cursor-pointer",
                      activePanel === "settings"
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                    aria-label="Vault Preferences & Data"
                  >
                    {activePanel === "settings" && <Corners size="sm" weight="thin" light />}
                    <Settings className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="font-sans text-xs">
                  Vault Preferences & Data
                </TooltipContent>
              </Tooltip>

              {/* Quick Guide */}
              {onOpenWelcome && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={onOpenWelcome}
                      className="size-8 text-muted-foreground hover:text-foreground rounded-none"
                      aria-label="Quick Guide"
                    >
                      <HelpCircle className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8} className="font-sans text-xs">
                    Quick Guide & Launchpad
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Expand Library Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onOpen}
                    className="size-8 text-primary hover:text-primary hover:bg-primary/10 rounded-none transition-colors"
                    aria-label="Expand library"
                  >
                    <PanelLeftOpen className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="font-sans text-xs">
                  Expand Library (Ctrl+B)
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        ) : (
          /* Expanded Sidebar Content */
          <div className="flex flex-col h-full w-full min-w-0 overflow-hidden box-border">
            {/* Brand header (Unified h-12 height + safe area top) */}
            <div
              className="border-b border-border/80 shrink-0 bg-background/50 select-none"
              style={{
                paddingTop: "var(--safe-top)",
              }}
            >
              <div className="h-12 px-3 flex items-center justify-between gap-2 shrink-0">
                <QuillLogo />

              <div className="flex items-center gap-1 shrink-0">
                {onOpenWelcome && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={onOpenWelcome}
                        aria-label="Quick Guide"
                        className="size-7 rounded-none text-muted-foreground hover:text-foreground"
                      >
                        <HelpCircle className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-sans text-xs">
                      Quick Guide & Launchpad
                    </TooltipContent>
                  </Tooltip>
                )}

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

          {/* Primary Actions: New Note + Templates Combo */}
          <div className="p-2.5 pb-2 shrink-0 flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleNewNoteClick}
              aria-label="New Note (Ctrl+N)"
              className="relative flex-1 h-8 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs font-semibold rounded-none border border-primary shadow-xs"
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

          {/* Library Tabs (All / Favorites / Trash) */}
          <div className="relative flex items-center gap-1 mx-2.5 p-1 bg-card/60 border border-border/80 shrink-0 shadow-xs">
            <Corners size="sm" weight="thin" light />
            <button
              type="button"
              onClick={() => onSelectPanel("all")}
              aria-current={activePanel === "all" ? "page" : undefined}
              className={cn(
                "flex-1 h-7.5 flex items-center justify-center gap-1.5 text-xs font-mono uppercase tracking-wider transition-all rounded-none cursor-pointer",
                activePanel === "all"
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <FileText className="size-3.5 shrink-0" />
              <span>ALL</span>
              <span className={cn("text-[10px] font-mono", activePanel === "all" ? "text-primary-foreground/90 font-bold" : "opacity-70")}>({notes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectPanel("favorites")}
              aria-current={activePanel === "favorites" ? "page" : undefined}
              className={cn(
                "flex-1 h-7.5 flex items-center justify-center gap-1.5 text-xs font-mono uppercase tracking-wider transition-all rounded-none cursor-pointer",
                activePanel === "favorites"
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Star className={cn("size-3.5 shrink-0", activePanel === "favorites" ? "fill-current text-primary-foreground" : "text-amber-500")} />
              <span>FAVS</span>
              <span className={cn("text-[10px] font-mono", activePanel === "favorites" ? "text-primary-foreground/90 font-bold" : "opacity-70")}>({pinnedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectPanel("trash")}
              aria-current={activePanel === "trash" ? "page" : undefined}
              className={cn(
                "flex-1 h-7.5 flex items-center justify-center gap-1.5 text-xs font-mono uppercase tracking-wider transition-all rounded-none cursor-pointer",
                activePanel === "trash"
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Trash2 className="size-3.5 shrink-0" />
              <span>TRASH</span>
              {trashedNotes.length > 0 && (
                <span className={cn("text-[10px] font-mono font-bold", activePanel === "trash" ? "text-primary-foreground" : "text-destructive")}>
                  ({trashedNotes.length})
                </span>
              )}
            </button>
          </div>

          {/* Search bar (Available in All, Favorites, and Trash) */}
          {activePanel !== "settings" && (
            <div className="px-2.5 pt-2 pb-1.5 shrink-0">
              <div className="relative">
                <Corners size="sm" weight="thin" light />
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground/60" />
                <Input
                  type="text"
                  placeholder={
                    activePanel === "trash"
                      ? "Search in trash..."
                      : "Search notes or tags..."
                  }
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-8 pr-7 h-8 text-xs bg-background/80 font-sans rounded-none border-border/80 shadow-xs focus-visible:ring-1"
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

          {/* Dynamic Tag Filter Strip */}
          {activePanel !== "settings" && activePanel !== "trash" && allTags.length > 0 && (
            <div className="px-2.5 py-1 shrink-0 w-full min-w-0 overflow-hidden">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none w-full touch-pan-x [mask-image:linear-gradient(to_right,black_calc(100%-16px),transparent_100%)]">
                <button
                  type="button"
                  onClick={() => onSelectTag?.(null)}
                  className={cn(
                    "text-[10px] font-mono uppercase px-2 py-0.5 rounded-none whitespace-nowrap transition-colors border shrink-0",
                    !selectedTag
                      ? "bg-primary text-primary-foreground font-semibold border-primary"
                      : "bg-muted/40 text-muted-foreground hover:text-foreground border-border/40 hover:border-border"
                  )}
                >
                  All
                </button>
                {allTags.map((tag) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onSelectTag?.(isSelected ? null : tag)}
                      className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded-none whitespace-nowrap transition-colors border shrink-0",
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold border-primary"
                          : "bg-muted/40 text-muted-foreground hover:text-foreground border-border/40 hover:border-border"
                      )}
                    >
                      #{tag}
                    </button>
                  );
                })}
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
                            onDelete={onDeleteNote}
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
                      onDelete={onDeleteNote}
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
                        className="group relative p-2.5 rounded-none border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors w-full min-w-0 max-w-full box-border"
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
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/20">
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
                  <div className="border border-border/70 p-3 rounded-none bg-card/60 shadow-xs space-y-2 relative">
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
                  <div className="border border-border/70 p-3 rounded-none bg-card/60 shadow-xs space-y-2 relative">
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
                  <div className="border border-border/70 p-3 rounded-none bg-card/60 shadow-xs space-y-2 relative">
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
                  <div className="border border-border/70 p-3 rounded-none bg-card/60 shadow-xs space-y-1.5 relative">
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

          {/* Footer Tools (Graph, Insights, Soundscapes, Settings) */}
          <div
            className="border-t border-border/80 px-2 shrink-0 bg-background/50 font-sans select-none"
            style={{
              paddingBottom: "var(--safe-bottom)",
            }}
          >
            <div className="h-10 flex items-center justify-between">
              <div className="flex items-center gap-0.5">
                {/* Graph View */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={onOpenGraph}
                      aria-label="Knowledge Graph"
                      className="size-7 rounded-none text-muted-foreground hover:text-foreground"
                    >
                      <Network className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="font-sans text-xs">
                    Interactive Knowledge Graph
                  </TooltipContent>
                </Tooltip>

                {/* Writing Insights */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={onOpenInsights}
                      aria-label="Writing Insights"
                      className="size-7 rounded-none text-muted-foreground hover:text-foreground"
                    >
                      <BarChart3 className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="font-sans text-xs">
                    Writing Insights & Activity
                  </TooltipContent>
                </Tooltip>

                {/* Ambient Soundscapes & Pomodoro */}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Ambient Soundscapes"
                          className="size-7 rounded-none text-muted-foreground hover:text-foreground"
                        >
                          <Headphones className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="font-sans text-xs">
                      Ambient Soundscapes & Pomodoro
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent
                    side="top"
                    align="start"
                    className="p-0 border-none bg-transparent shadow-none w-auto"
                  >
                    <AmbientSoundPlayer />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

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
    </>
  );
}
