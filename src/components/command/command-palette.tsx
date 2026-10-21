"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Note } from "@/lib/storage/schema";
import {
  Archive,
  BarChart3,
  Bold,
  CalendarDays,
  Clock,
  Columns2,
  Copy,
  Download,
  Eye,
  Feather,
  FileText,
  Hash,
  HelpCircle,
  History,
  Italic,
  Keyboard,
  Laptop,
  LayoutTemplate,
  Link2,
  List,
  ListChecks,
  ListTodo,
  ListTree,
  Maximize2,
  Moon,
  Network,
  PanelLeft,
  PenLine,
  Pin,
  PinOff,
  Plus,
  Printer,
  Redo2,
  Search,
  Settings,
  Sparkles,
  Star,
  Sun,
  Target,
  Trash2,
  Undo2,
  Upload,
  Wand2,
  X,
  Tags,
} from "lucide-react";
import { Corners } from "@/components/frame";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useIsMobileShell } from "@/hooks/useMediaQuery";
import { hapticTap } from "@/lib/ui/haptics";
import { useOverlayLayer } from "@/lib/ui/overlayStack";
import { NOTE_TEMPLATES, type NoteTemplate } from "@/lib/templates/noteTemplates";
import { AI_ACTIONS } from "@/lib/ai/useAIActions";
import type { AIAction } from "@/lib/ai/types";
import type { EditorCommand } from "@/lib/editor/editorCommands";

type ViewMode = "editor" | "split" | "preview";
type Panel = "all" | "favorites" | "trash" | "settings";

/** Top-level grouping of results. Order is fixed by {@link GROUP_ORDER}. */
type ItemGroup = "notes" | "actions" | "navigation" | "settings";
type ItemKind = "note" | "tag" | "command";

interface PaletteItem {
  /** Stable identity — also the key used to remember "recent commands". */
  id: string;
  kind: ItemKind;
  group: ItemGroup;
  title: string;
  subtitle?: string;
  /** Extra searchable text (synonyms, categories) that is never displayed. */
  keywords?: string;
  icon: React.ElementType;
  /** Keyboard shortcut hint shown on the right. */
  shortcut?: string;
  /** Trailing mono chip, e.g. `#tag` or `template`. */
  chip?: string;
  /** Small badge such as `CURRENT`. */
  badge?: string;
  /** Present for note results. */
  note?: Note;
  /** Extra tags shown as chips (note results). */
  tags?: string[];
  disabled?: boolean;
  run: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  activeNote?: Note;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onTogglePin: (id: string) => void;
  onExportNote: () => void;
  onImportMarkdown: () => void;
  onBackupNotes: () => void;
  onRestoreBackup: () => void;
  onOpenHistory?: () => void;
  onPrintNote?: () => void;
  onFindReplace?: () => void;
  onOpenTemplates?: () => void;
  onToggleZen?: () => void;
  onDuplicateActiveNote?: () => void;
  onOpenGraph?: () => void;
  onOpenToc?: () => void;
  onOpenInsights?: () => void;
  onOpenWelcome?: () => void;
  onOpenAIStatus?: () => void;
  onViewModeChange?: (mode: ViewMode) => void;
  currentViewMode?: ViewMode;
  onToggleSidebar?: () => void;
  onSetWritingGoal?: (goal: number) => void;
  writingGoal?: number;
  onSelectPanel?: (panel: Panel) => void;
  /** Every tag in the library (used by the `#` prefix and free-text search). */
  tags?: string[];
  onSelectTag?: (tag: string) => void;
  /** Create a note from one of the built-in templates. */
  onCreateFromTemplate?: (template: NoteTemplate) => void;
  /** Run an offline-AI action against the active note. */
  onRunAIAction?: (action: AIAction) => void;
  aiBusy?: boolean;
  typewriter?: boolean;
  onToggleTypewriter?: () => void;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onMoveActiveToTrash?: () => void;
  /** Runs editor-local commands (formatting, undo/redo) via the command bridge. */
  onEditorCommand?: (command: EditorCommand) => void;
  /** Open the cross-note task list. */
  onOpenTasks?: () => void;
  /** Open the tag manager (rename / merge tags across the vault). */
  onOpenTagManager?: () => void;
  /** Open (or create) today's daily note. */
  onOpenDailyNote?: () => void;
  /** Open the keyboard shortcut reference. */
  onOpenShortcuts?: () => void;
  /** True while a markdown editor is mounted somewhere in the tree. */
  editorMounted?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
}

const GROUP_ORDER: ItemGroup[] = ["notes", "actions", "navigation", "settings"];
const GROUP_LABEL: Record<ItemGroup, string> = {
  notes: "Notes",
  actions: "Actions",
  navigation: "Navigation",
  settings: "Settings",
};

const RECENT_KEY = "quill_recent_commands_v1";
const RECENT_MAX = 5;
const NOTE_LIMIT = 8;

type Prefix = "" | ">" | "#" | "@";

/* ------------------------------- Fuzzy search ------------------------------ */

const BOUNDARY_RE = /[\s\-_/·:.,[\](){}|"'#@]/;

/**
 * Score `needle` against `haystack`. Returns `null` when there is no match, a
 * larger number for a better match. Exact substring hits (especially at a word
 * boundary) beat loose subsequence hits such as "nwnt" → "New Note".
 */
function scoreText(haystack: string, needle: string): number | null {
  if (!needle) return null;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (!h) return null;

  const direct = h.indexOf(n);
  if (direct !== -1) {
    const atStart = direct === 0;
    const atBoundary = !atStart && BOUNDARY_RE.test(h[direct - 1]);
    return (
      1000 +
      (atStart ? 300 : atBoundary ? 120 : 0) -
      direct * 2 -
      h.length * 0.5
    );
  }

  // Subsequence fallback: every query char must appear in order.
  let cursor = 0;
  let score = 0;
  let streak = 0;
  let firstIndex = -1;

  for (let i = 0; i < n.length; i++) {
    const found = h.indexOf(n[i], cursor);
    if (found === -1) return null;
    if (firstIndex === -1) firstIndex = found;

    if (i > 0) {
      if (found === cursor) {
        streak += 1;
        score += 26 + streak * 10;
      } else {
        streak = 0;
        score += 7;
      }
    }
    if (found === 0 || BOUNDARY_RE.test(h[found - 1])) score += 16;
    cursor = found + 1;
  }

  return score + 240 - Math.min(firstIndex, 30) * 3 - h.length * 0.2;
}

/** Best weighted score across an item's displayable/searchable fields. */
function scoreItem(item: PaletteItem, term: string): number | null {
  let best: number | null = null;
  const consider = (value: string | undefined, weight: number) => {
    if (!value) return;
    const s = scoreText(value, term);
    if (s === null) return;
    const weighted = s * weight;
    if (best === null || weighted > best) best = weighted;
  };

  consider(item.title, 1);
  // Note snippets are note *content*, so they must match as real substrings
  // (handled below) — a loose subsequence over a body would rank noise above
  // the genuine hits.
  if (item.kind !== "note") consider(item.subtitle, 0.65);
  consider(item.keywords, 0.55);
  if (item.tags) item.tags.forEach((t) => consider(t, 0.5));

  // Note bodies (and their displayed snippet) are matched by plain substring.
  if (item.note) {
    const body = item.note.content.toLowerCase();
    const idx = body.indexOf(term.toLowerCase());
    if (idx !== -1) {
      const s = 260 - idx * 0.05 - body.length * 0.01;
      if (best === null || s > best) best = s;
    }
  }

  return best;
}

/** Indices of `term` inside `text` for match highlighting. */
function matchIndices(text: string, term: string): number[] {
  if (!term) return [];
  const h = text.toLowerCase();
  const n = term.toLowerCase();

  const direct = h.indexOf(n);
  if (direct !== -1) {
    return Array.from({ length: n.length }, (_, i) => direct + i);
  }

  const out: number[] = [];
  let cursor = 0;
  for (const ch of n) {
    const found = h.indexOf(ch, cursor);
    if (found === -1) return [];
    out.push(found);
    cursor = found + 1;
  }
  return out;
}

function parseQuery(raw: string): { prefix: Prefix; term: string } {
  const trimmed = raw.replace(/^\s+/, "");
  const first = trimmed[0];
  if (first === ">" || first === "#" || first === "@") {
    return { prefix: first, term: trimmed.slice(1).trim() };
  }
  return { prefix: "", term: trimmed.trim() };
}

/* ------------------------------ Recent commands ----------------------------- */

function readRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeRecents(ids: string[]): void {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable — recents are a nicety, never fatal */
  }
}

/* ---------------------------------- Dialog --------------------------------- */

/**
 * The single surface where every Quill action lives: quick switcher, command
 * runner, tag filter and settings index in one fuzzy-searchable list.
 *
 * - `>` scopes to commands, `#` to tags, `@` to notes.
 * - On phones it opens as a full-screen search sheet (keyboard inset aware).
 */
export function CommandPalette({
  isOpen,
  onClose,
  notes,
  activeNote,
  onSelectNote,
  onCreateNote,
  onTogglePin,
  onExportNote,
  onImportMarkdown,
  onBackupNotes,
  onRestoreBackup,
  onOpenHistory,
  onPrintNote,
  onFindReplace,
  onOpenTemplates,
  onToggleZen,
  onDuplicateActiveNote,
  onOpenGraph,
  onOpenToc,
  onOpenInsights,
  onOpenWelcome,
  onOpenAIStatus,
  onViewModeChange,
  currentViewMode,
  onToggleSidebar,
  onSetWritingGoal,
  writingGoal = 0,
  onSelectPanel,
  tags = [],
  onSelectTag,
  onCreateFromTemplate,
  onRunAIAction,
  aiBusy = false,
  typewriter = false,
  onToggleTypewriter,
  fullscreen = false,
  onToggleFullscreen,
  onMoveActiveToTrash,
  onEditorCommand,
  editorMounted = false,
  canUndo = false,
  canRedo = false,
  onOpenTasks,
  onOpenTagManager,
  onOpenDailyNote,
  onOpenShortcuts,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobileShell();

  // Own Escape / Android back while open, so shell navigation waits its turn.
  useOverlayLayer(isOpen, onClose);

  // Reset on open + hydrate the recent-command history
  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setSelectedIndex(0);
    setRecentIds(readRecents());

    // Focus the field immediately, then re-assert once more: when the palette is
    // opened from a sheet/drawer, that layer's exit animation restores focus to
    // its trigger a beat later and would otherwise steal the caret (and the
    // on-screen keyboard) from the search field.
    const grabFocus = () => {
      const el = inputRef.current;
      if (!el || document.activeElement === el) return;
      el.focus();
    };
    const timers = [
      window.setTimeout(grabFocus, 40),
      window.setTimeout(grabFocus, 320),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [isOpen]);

  const remember = useCallback((id: string) => {
    setRecentIds((prev) => {
      const next = [id, ...prev.filter((v) => v !== id)].slice(0, RECENT_MAX);
      writeRecents(next);
      return next;
    });
  }, []);

  /* ------------------------------ Command items ------------------------------ */

  const commands = useMemo<PaletteItem[]>(() => {
    const list: PaletteItem[] = [];
    const activeTitle = activeNote?.title || "Untitled";

    /* Actions — change the document / the library */
    list.push({
      id: "action-new",
      kind: "command",
      group: "actions",
      title: "Create New Note",
      subtitle: "Start a blank note",
      keywords: "add note new create write",
      icon: Plus,
      shortcut: "Ctrl+N",
      run: onCreateNote,
    });

    if (activeNote) {
      list.push({
        id: "action-pin",
        kind: "command",
        group: "actions",
        title: activeNote.isPinned ? "Unpin Active Note" : "Pin Active Note",
        subtitle: activeTitle,
        keywords: "favorite star pin top",
        icon: activeNote.isPinned ? PinOff : Pin,
        run: () => onTogglePin(activeNote.id),
      });
    }

    if (activeNote && onDuplicateActiveNote) {
      list.push({
        id: "action-duplicate",
        kind: "command",
        group: "actions",
        title: "Duplicate Active Note",
        subtitle: `Copy of “${activeTitle}”`,
        keywords: "clone copy",
        icon: Copy,
        run: onDuplicateActiveNote,
      });
    }

    if (activeNote && onMoveActiveToTrash) {
      list.push({
        id: "action-trash",
        kind: "command",
        group: "actions",
        title: "Move Active Note to Trash",
        subtitle: `“${activeTitle}” — undoable`,
        keywords: "delete remove bin archive",
        icon: Trash2,
        run: onMoveActiveToTrash,
      });
    }

    if (onExportNote) {
      list.push({
        id: "action-export-md",
        kind: "command",
        group: "actions",
        title: "Export Note as Markdown",
        subtitle: activeNote ? `Download “${activeTitle}.md”` : "Download the active note",
        keywords: "save download md file",
        icon: Download,
        run: onExportNote,
      });
    }

    if (onPrintNote) {
      list.push({
        id: "action-print",
        kind: "command",
        group: "actions",
        title: "Print / Export as PDF",
        subtitle: "Open the print preview for the active note",
        keywords: "pdf paper printer",
        icon: Printer,
        run: onPrintNote,
      });
    }

    list.push({
      id: "action-import-md",
      kind: "command",
      group: "actions",
      title: "Import Markdown File",
      subtitle: "Load a .md or .txt file as a new note",
      keywords: "upload load open file",
      icon: Upload,
      run: onImportMarkdown,
    });

    list.push({
      id: "action-backup",
      kind: "command",
      group: "actions",
      title: "Backup All Notes (JSON)",
      subtitle: `Download an archive of ${notes.length} note${notes.length === 1 ? "" : "s"}`,
      keywords: "export save archive data json",
      icon: Archive,
      run: onBackupNotes,
    });

    list.push({
      id: "action-restore",
      kind: "command",
      group: "actions",
      title: "Restore from JSON Backup",
      subtitle: "Import a previous backup file",
      keywords: "import load data json restore",
      icon: Upload,
      run: onRestoreBackup,
    });

    if (onOpenTemplates) {
      list.push({
        id: "action-templates-browse",
        kind: "command",
        group: "actions",
        title: "Browse All Templates…",
        subtitle: "Preview and pick from the template gallery",
        keywords: "template new note boilerplate",
        icon: LayoutTemplate,
        run: onOpenTemplates,
      });
    }

    if (onCreateFromTemplate) {
      NOTE_TEMPLATES.forEach((tmpl) => {
        list.push({
          id: `template:${tmpl.id}`,
          kind: "command",
          group: "actions",
          title: `New Note: ${tmpl.title}`,
          subtitle: tmpl.description,
          keywords: `template ${tmpl.tags.join(" ")} scaffold`,
          icon: LayoutTemplate,
          chip: "template",
          run: () => onCreateFromTemplate(tmpl),
        });
      });
    }

    if (onFindReplace) {
      list.push({
        id: "action-find",
        kind: "command",
        group: "actions",
        title: "Find & Replace",
        subtitle: "Search inside the active note",
        keywords: "search replace in note ctrl f",
        icon: Search,
        shortcut: "Ctrl+F",
        run: onFindReplace,
      });
    }

    if (onEditorCommand && editorMounted) {
      const editorCommands: {
        id: string;
        command: EditorCommand;
        title: string;
        subtitle: string;
        keywords: string;
        icon: React.ElementType;
        shortcut?: string;
        show?: boolean;
      }[] = [
        {
          id: "editor-bold",
          command: "bold",
          title: "Bold",
          subtitle: "Wrap the selection in **",
          keywords: "bold strong weight emphasis format",
          icon: Bold,
        },
        {
          id: "editor-italic",
          command: "italic",
          title: "Italic",
          subtitle: "Wrap the selection in *",
          keywords: "italic emphasis slanted format",
          icon: Italic,
        },
        {
          id: "editor-bullet",
          command: "bullet",
          title: "Bullet List",
          subtitle: "Turn the current line into a “- ” item",
          keywords: "bullet unordered list format",
          icon: List,
        },
        {
          id: "editor-checklist",
          command: "checklist",
          title: "Checklist",
          subtitle: "Turn the current line into a “- [ ]” task",
          keywords: "checkbox task todo checklist format",
          icon: ListChecks,
        },
        {
          id: "editor-link",
          command: "link",
          title: "Insert Link",
          subtitle: "Add a [text](url) link",
          keywords: "link url href hyperlink format",
          icon: Link2,
        },
        {
          id: "editor-undo",
          command: "undo",
          title: "Undo",
          subtitle: "Step back one edit",
          keywords: "undo revert back format",
          icon: Undo2,
          show: canUndo,
        },
        {
          id: "editor-redo",
          command: "redo",
          title: "Redo",
          subtitle: "Step forward one edit",
          keywords: "redo repeat forward format",
          icon: Redo2,
          show: canRedo,
        },
      ];

      editorCommands
        .filter((entry) => entry.show !== false)
        .forEach((entry) => {
          list.push({
            id: entry.id,
            kind: "command",
            group: "actions",
            title: entry.title,
            subtitle: entry.subtitle,
            keywords: entry.keywords,
            icon: entry.icon,
            shortcut: entry.shortcut,
            chip: "editor",
            run: () => onEditorCommand(entry.command),
          });
        });
    }

    if (activeNote && onRunAIAction) {
      AI_ACTIONS.forEach((descriptor) => {
        list.push({
          id: `ai:${descriptor.action}`,
          kind: "command",
          group: "actions",
          title: descriptor.title,
          subtitle: descriptor.description,
          keywords: `ai assistant offline webgpu ${descriptor.action.replace("_", " ")}`,
          icon: Wand2,
          chip: "AI",
          disabled: aiBusy,
          run: () => onRunAIAction(descriptor.action),
        });
      });
    }

    /* Navigation — go somewhere / change what you are looking at */
    if (onSelectPanel) {
      list.push({
        id: "nav-all",
        kind: "command",
        group: "navigation",
        title: "All Notes",
        subtitle: "Browse the full library",
        keywords: "library home list notes",
        icon: FileText,
        run: () => onSelectPanel("all"),
      });
      list.push({
        id: "nav-favorites",
        kind: "command",
        group: "navigation",
        title: "Pinned / Favorites",
        subtitle: "Jump to your pinned notes",
        keywords: "star pinned favorite bookmarks",
        icon: Star,
        run: () => onSelectPanel("favorites"),
      });
      list.push({
        id: "nav-trash",
        kind: "command",
        group: "navigation",
        title: "Trash",
        subtitle: "Restore or permanently delete notes",
        keywords: "deleted bin restore purge",
        icon: Trash2,
        run: () => onSelectPanel("trash"),
      });
      list.push({
        id: "nav-settings-panel",
        kind: "command",
        group: "navigation",
        title: "Preferences & Data",
        subtitle: "Writing goal, backups and about",
        keywords: "settings options panel preferences",
        icon: Settings,
        run: () => onSelectPanel("settings"),
      });
    }

    if (onOpenToc) {
      list.push({
        id: "nav-outline",
        kind: "command",
        group: "navigation",
        title: "Document Outline",
        subtitle: "Jump between headings in the active note",
        keywords: "toc table of contents headings sections",
        icon: ListTree,
        run: onOpenToc,
      });
    }

    if (onOpenHistory) {
      list.push({
        id: "nav-history",
        kind: "command",
        group: "navigation",
        title: "Version History",
        subtitle: "Browse and restore previous revisions",
        keywords: "snapshot revisions undo restore",
        icon: History,
        run: onOpenHistory,
      });
    }

    if (onOpenGraph) {
      list.push({
        id: "nav-graph",
        kind: "command",
        group: "navigation",
        title: "Knowledge Graph",
        subtitle: "Interactive map of notes and wiki-links",
        keywords: "links network graph connections",
        icon: Network,
        run: onOpenGraph,
      });
    }

    if (onOpenInsights) {
      list.push({
        id: "nav-insights",
        kind: "command",
        group: "navigation",
        title: "Writing Insights",
        subtitle: "Heatmap, readability and vault statistics",
        keywords: "analytics stats heatmap activity",
        icon: BarChart3,
        run: onOpenInsights,
      });
    }

    if (onOpenWelcome) {
      list.push({
        id: "nav-welcome",
        kind: "command",
        group: "navigation",
        title: "Welcome & Quick Guide",
        subtitle: "Feature tour and shortcuts",
        keywords: "help guide about onboarding docs",
        icon: HelpCircle,
        run: onOpenWelcome,
      });
    }

    if (onOpenTasks) {
      list.push({
        id: "nav-tasks",
        kind: "command",
        group: "navigation",
        title: "Open Tasks",
        subtitle: "Every checklist item across your notes",
        keywords: "todo to-do checklist tasks checkboxes pending",
        icon: ListTodo,
        run: onOpenTasks,
      });
    }

    if (onOpenShortcuts) {
      list.push({
        id: "nav-shortcuts",
        kind: "command",
        group: "navigation",
        title: "Keyboard Shortcuts",
        subtitle: "Every shortcut in one list",
        keywords: "help keys hotkeys shortcuts reference",
        icon: Keyboard,
        run: onOpenShortcuts,
      });
    }

    if (onOpenDailyNote) {
      list.push({
        id: "act-daily-note",
        kind: "command",
        group: "actions",
        title: "Open Today's Note",
        subtitle: "Jump to (or start) today's daily note",
        keywords: "daily journal today diary date",
        icon: CalendarDays,
        shortcut: "Ctrl+Shift+D",
        run: onOpenDailyNote,
      });
    }

    if (onOpenTagManager) {
      list.push({
        id: "set-tag-manager",
        kind: "command",
        group: "settings",
        title: "Manage Tags",
        subtitle: "Rename or merge tags across every note",
        keywords: "tags organise organize rename merge labels",
        icon: Tags,
        run: onOpenTagManager,
      });
    }

    if (onViewModeChange) {
      list.push({
        id: "nav-view-editor",
        kind: "command",
        group: "navigation",
        title: "Switch to Write Mode",
        subtitle: currentViewMode === "editor" ? "Currently active" : "Single focused editor pane",
        keywords: "view mode editor write",
        icon: PenLine,
        shortcut: "Ctrl+1",
        badge: currentViewMode === "editor" ? "CURRENT" : undefined,
        run: () => onViewModeChange("editor"),
      });
      list.push({
        id: "nav-view-split",
        kind: "command",
        group: "navigation",
        title: "Switch to Split Mode",
        subtitle: currentViewMode === "split" ? "Currently active" : "Editor and preview side by side",
        keywords: "view mode split columns",
        icon: Columns2,
        shortcut: "Ctrl+2",
        badge: currentViewMode === "split" ? "CURRENT" : undefined,
        run: () => onViewModeChange("split"),
      });
      list.push({
        id: "nav-view-preview",
        kind: "command",
        group: "navigation",
        title: "Switch to Preview Mode",
        subtitle: currentViewMode === "preview" ? "Currently active" : "Rendered markdown reading view",
        keywords: "view mode preview read rendered",
        icon: Eye,
        shortcut: "Ctrl+3",
        badge: currentViewMode === "preview" ? "CURRENT" : undefined,
        run: () => onViewModeChange("preview"),
      });
    }

    if (onToggleZen) {
      list.push({
        id: "nav-zen",
        kind: "command",
        group: "navigation",
        title: "Toggle Zen Focus Mode",
        subtitle: "Distraction-free writing desk",
        keywords: "focus zen fullscreen distraction",
        icon: Maximize2,
        shortcut: "Ctrl+Shift+F",
        run: onToggleZen,
      });
    }

    if (onToggleFullscreen) {
      list.push({
        id: "nav-fullscreen",
        kind: "command",
        group: "navigation",
        title: fullscreen ? "Exit Fullscreen" : "Enter Fullscreen",
        subtitle: "Use the whole display",
        keywords: "fullscreen display window maximize",
        icon: Maximize2,
        badge: fullscreen ? "ON" : undefined,
        run: onToggleFullscreen,
      });
    }

    if (onToggleSidebar) {
      list.push({
        id: "nav-sidebar",
        kind: "command",
        group: "navigation",
        title: "Toggle Library Sidebar",
        subtitle: "Show or hide the notes library",
        keywords: "sidebar panel library toggle",
        icon: PanelLeft,
        shortcut: "Ctrl+B",
        run: onToggleSidebar,
      });
    }

    if (onSelectTag) {
      tags.forEach((tag) => {
        list.push({
          id: `tag:${tag}`,
          kind: "tag",
          group: "navigation",
          title: tag,
          subtitle: "Filter the library by this tag",
          keywords: `tag #${tag} filter`,
          icon: Hash,
          chip: `#${tag}`,
          run: () => onSelectTag(tag),
        });
      });
    }

    /* Settings — preferences */
    const themeOptions: { value: string; label: string; icon: React.ElementType; keywords: string }[] = [
      { value: "light", label: "Light", icon: Sun, keywords: "theme light day bright" },
      { value: "dark", label: "Dark", icon: Moon, keywords: "theme dark night dim" },
      { value: "system", label: "System", icon: Laptop, keywords: "theme system auto device os" },
    ];
    themeOptions.forEach((option) => {
      list.push({
        id: `setting-theme-${option.value}`,
        kind: "command",
        group: "settings",
        title: `Theme: ${option.label}`,
        subtitle: "Appearance",
        keywords: option.keywords,
        icon: option.icon,
        badge: theme === option.value ? "CURRENT" : undefined,
        run: () => setTheme(option.value),
      });
    });

    if (onSetWritingGoal) {
      const goals: { value: number; label: string; keywords: string }[] = [
        { value: 0, label: "None (Free Write)", keywords: "goal target none off clear" },
        { value: 250, label: "250 words", keywords: "goal target quick short" },
        { value: 500, label: "500 words", keywords: "goal target standard" },
        { value: 1000, label: "1,000 words", keywords: "goal target deep essay long" },
      ];
      goals.forEach((goal) => {
        list.push({
          id: `setting-goal-${goal.value}`,
          kind: "command",
          group: "settings",
          title: `Session Goal: ${goal.label}`,
          subtitle: "Tracked in the status bar",
          keywords: goal.keywords,
          icon: Target,
          badge: writingGoal === goal.value ? "CURRENT" : undefined,
          run: () => onSetWritingGoal(goal.value),
        });
      });
    }

    if (onToggleTypewriter) {
      list.push({
        id: "setting-typewriter",
        kind: "command",
        group: "settings",
        title: "Typewriter Scrolling",
        subtitle: "Keep the caret vertically centred",
        keywords: "typewriter scrolling caret centre center focus",
        icon: Feather,
        badge: typewriter ? "ON" : undefined,
        run: onToggleTypewriter,
      });
    }

    if (onOpenAIStatus) {
      list.push({
        id: "setting-ai-engine",
        kind: "command",
        group: "settings",
        title: "Offline AI Engine",
        subtitle: "WebGPU acceleration and on-device models",
        keywords: "ai assistant engine webgpu model settings local offline",
        icon: Sparkles,
        run: onOpenAIStatus,
      });
    }

    return list.filter((item) => !item.disabled);
  }, [
    activeNote,
    notes.length,
    tags,
    theme,
    writingGoal,
    typewriter,
    fullscreen,
    currentViewMode,
    aiBusy,
    setTheme,
    onCreateNote,
    onCreateFromTemplate,
    onTogglePin,
    onDuplicateActiveNote,
    onMoveActiveToTrash,
    onExportNote,
    onPrintNote,
    onFindReplace,
    onImportMarkdown,
    onBackupNotes,
    onRestoreBackup,
    onOpenTemplates,
    onOpenToc,
    onOpenHistory,
    onOpenGraph,
    onOpenInsights,
    onOpenWelcome,
    onOpenTasks,
    onOpenShortcuts,
    onOpenDailyNote,
    onOpenTagManager,
    onViewModeChange,
    onToggleZen,
    onToggleFullscreen,
    onToggleSidebar,
    onSelectPanel,
    onSelectTag,
    onSetWritingGoal,
    onToggleTypewriter,
    onOpenAIStatus,
    onRunAIAction,
    onEditorCommand,
    editorMounted,
    canUndo,
    canRedo,
  ]);

  const noteItems = useMemo<PaletteItem[]>(
    () =>
      notes.map((note) => ({
        id: `note:${note.id}`,
        kind: "note",
        group: "notes",
        title: note.title || "Untitled",
        subtitle: note.content
          ? note.content.replace(/^[#\s\-*[\]xX>]+/gm, "").slice(0, 90)
          : undefined,
        icon: FileText,
        note,
        tags: note.tags,
        run: () => onSelectNote(note.id),
      })),
    [notes, onSelectNote]
  );

  const allItems = useMemo(
    () => [...noteItems, ...commands],
    [noteItems, commands]
  );

  const { prefix, term } = useMemo(() => parseQuery(query), [query]);

  const hasQuery = query.trim().length > 0;

  /* ------------------------------ Grouping/ranking ---------------------------- */

  const sections = useMemo(() => {
    const out: { key: string; label: string; items: PaletteItem[] }[] = [];

    // Prefix scoping: `>` commands, `#` tags, `@` notes.
    const visible = allItems.filter((item) => {
      if (prefix === ">") return item.kind === "command";
      if (prefix === "#") return item.kind === "tag";
      if (prefix === "@") return item.kind === "note";
      return true;
    });

    // Recent commands — pinned to the very top of the empty state.
    const recentItems =
      !term && recentIds.length > 0
        ? recentIds
            .map((id) => allItems.find((item) => item.id === id))
            .filter((item): item is PaletteItem => !!item)
        : [];
    const recentSet = new Set(recentItems.map((item) => item.id));

    // Ranking: fuzzy score when searching, authored order (pinned/updated notes
    // first) when the query is empty.
    let ranked: PaletteItem[];
    if (term) {
      ranked = visible
        .map((item) => ({ item, score: scoreItem(item, term) }))
        .filter(
          (entry): entry is { item: PaletteItem; score: number } => entry.score !== null
        )
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.item);
    } else {
      const notesRanked = visible
        .filter((item) => item.kind === "note")
        .sort((a, b) => {
          const pinA = a.note?.isPinned ? 1 : 0;
          const pinB = b.note?.isPinned ? 1 : 0;
          if (pinA !== pinB) return pinB - pinA;
          return (b.note?.updatedAt ?? 0) - (a.note?.updatedAt ?? 0);
        });
      const others = visible.filter((item) => item.kind !== "note");
      ranked = [...notesRanked, ...others];
    }

    if (recentItems.length > 0) {
      out.push({ key: "recent", label: "Recent", items: recentItems });
    }

    GROUP_ORDER.forEach((group) => {
      let items = ranked.filter((item) => item.group === group);
      if (recentItems.length > 0) {
        items = items.filter((item) => !recentSet.has(item.id));
      }
      if (group === "notes") items = items.slice(0, NOTE_LIMIT);
      if (items.length > 0) {
        // Tag results live in the Navigation group; relabel when scoped with `#`.
        const label =
          prefix === "#" && items.every((item) => item.kind === "tag")
            ? "Tags"
            : GROUP_LABEL[group];
        out.push({ key: group, label, items });
      }
    });

    return out;
  }, [allItems, prefix, term, recentIds]);

  const flat = useMemo(() => sections.flatMap((section) => section.items), [sections]);

  const indexOf = useMemo(() => {
    const map = new Map<string, number>();
    flat.forEach((item, index) => map.set(item.id, index));
    return map;
  }, [flat]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (selectedIndex > flat.length - 1) setSelectedIndex(0);
  }, [flat.length, selectedIndex]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  /* --------------------------------- Execution -------------------------------- */

  const executeItem = useCallback(
    (item: PaletteItem) => {
      hapticTap();
      if (item.kind !== "note") remember(item.id);
      onClose();
      // Run after closing so dialogs opened by the command stack cleanly.
      setTimeout(() => item.run(), 0);
    },
    [onClose, remember]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flat.length) setSelectedIndex((prev) => (prev + 1) % flat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flat.length) setSelectedIndex((prev) => (prev - 1 + flat.length) % flat.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[selectedIndex];
      if (item) executeItem(item);
    }
  };

  const placeholder =
    prefix === ">"
      ? "Run a command…"
      : prefix === "#"
      ? "Filter by tag…"
      : prefix === "@"
      ? "Jump to a note…"
      : "Search notes, actions, tags, settings…";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        style={
          isMobile
            ? {
                top: 0,
                height: "var(--app-h, 100dvh)",
                maxHeight: "var(--app-h, 100dvh)",
              }
            : undefined
        }
        className={cn(
          "p-0 gap-0 overflow-hidden border border-border/80 bg-background/95 backdrop-blur-md shadow-2xl rounded-none font-sans flex flex-col",
          isMobile
            ? "left-0 w-screen max-w-none translate-x-0 translate-y-0 border-x-0 border-b-0"
            : "w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] sm:max-w-xl md:max-w-2xl max-h-[85vh]"
        )}
      >
        <DialogTitle className="sr-only">Command Palette</DialogTitle>

        <div
          className="relative flex flex-col h-full min-h-0 w-full overflow-hidden"
          style={
            isMobile
              ? {
                  paddingTop: "var(--safe-top, 0px)",
                  paddingBottom: "var(--safe-bottom, 0px)",
                }
              : undefined
          }
        >
          <Corners size="sm" offset="border" weight="thin" light />

          {/* Search header */}
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border/60 shrink-0 bg-background/50">
            <Search className="size-4 text-muted-foreground/70 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              role="combobox"
              aria-expanded
              aria-controls="command-palette-results"
              aria-label="Search commands, notes, tags and settings"
              autoComplete="off"
              spellCheck={false}
              className="flex-1 min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none font-sans"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge
                variant="outline"
                className="hidden sm:inline-flex font-mono text-[9.5px] tracking-wider px-1.5 py-0.5 text-muted-foreground"
              >
                ESC
              </Badge>
              <button
                type="button"
                onClick={onClose}
                className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors motion-reduce:transition-none rounded-none"
                aria-label="Close command palette"
                title="Close (Esc)"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Prefix legend — teaches `>` / `#` / `@` at a glance */}
          {!hasQuery && (
            <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border-b border-border/40 shrink-0 overflow-x-auto">
              {(
                [
                  { prefix: ">" as Prefix, label: "Commands" },
                  { prefix: "#" as Prefix, label: "Tags" },
                  { prefix: "@" as Prefix, label: "Notes" },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.prefix}
                  type="button"
                  onClick={() => {
                    setQuery(`${chip.prefix}`);
                    inputRef.current?.focus();
                  }}
                  className="flex items-center gap-1 shrink-0 border border-border/60 bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors motion-reduce:transition-none hover:border-border hover:text-foreground rounded-none"
                >
                  <span className="font-semibold text-foreground">{chip.prefix}</span>
                  {chip.label}
                </button>
              ))}
              <span className="ml-auto hidden shrink-0 pl-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 sm:inline">
                Every action lives here
              </span>
            </div>
          )}

          {/* Results */}
          <div
            id="command-palette-results"
            ref={listRef}
            role="listbox"
            aria-label="Results"
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-1 font-sans"
          >
            {flat.length === 0 ? (
              <div className="px-6 py-12 text-center text-xs text-muted-foreground">
                {prefix === "#"
                  ? "No tags match that search."
                  : prefix === "@"
                  ? "No notes match that search."
                  : prefix === ">"
                  ? "No commands match that search."
                  : "No results. Try “> commands”, “# tags” or “@ notes”."}
              </div>
            ) : (
              sections.map((section) => (
                <div key={section.key} className="pb-1">
                  <div
                    className={cn(
                      "sticky top-0 z-10 flex items-center gap-1.5 px-3 sm:px-4 py-1.5",
                      "bg-background/95 backdrop-blur-xs text-[10px] font-mono uppercase tracking-wider text-muted-foreground"
                    )}
                  >
                    {section.key === "recent" && <Clock className="size-3" />}
                    <span>{section.label}</span>
                    <span className="text-muted-foreground/50">{section.items.length}</span>
                  </div>

                  {section.items.map((item) => {
                    const index = indexOf.get(item.id) ?? 0;
                    const isSelected = index === selectedIndex;
                    return (
                      <PaletteRow
                        key={item.id}
                        item={item}
                        term={term}
                        index={index}
                        selected={isSelected}
                        activeNoteId={activeNote?.id}
                        onHover={() => setSelectedIndex(index)}
                        onRun={() => executeItem(item)}
                      />
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="hidden md:flex px-3 sm:px-4 py-2 bg-muted/30 border-t border-border/50 items-center justify-between text-[10px] text-muted-foreground font-mono gap-2 shrink-0">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="font-semibold text-foreground">↑↓</kbd> navigate
              </span>
              <span>
                <kbd className="font-semibold text-foreground">↵</kbd> select
              </span>
              <span>
                <kbd className="font-semibold text-foreground">esc</kbd> close
              </span>
              <span className="hidden lg:inline">
                <kbd className="font-semibold text-foreground">&gt;</kbd>{" "}
                <kbd className="font-semibold text-foreground">#</kbd>{" "}
                <kbd className="font-semibold text-foreground">@</kbd> scopes
              </span>
            </div>
            <span className="text-[9.5px] tracking-wider uppercase shrink-0">Quill Command</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------- Rows ----------------------------------- */

function Highlight({ text, term }: { text: string; term: string }) {
  const indices = useMemo(() => new Set(matchIndices(text, term)), [text, term]);
  if (!term || indices.size === 0) return <>{text}</>;

  return (
    <>
      {Array.from(text).map((char, i) =>
        indices.has(i) ? (
          <span key={i} className="font-semibold text-foreground">
            {char}
          </span>
        ) : (
          <React.Fragment key={i}>{char}</React.Fragment>
        )
      )}
    </>
  );
}

function PaletteRow({
  item,
  term,
  index,
  selected,
  activeNoteId,
  onHover,
  onRun,
}: {
  item: PaletteItem;
  term: string;
  index: number;
  selected: boolean;
  activeNoteId?: string;
  onHover: () => void;
  onRun: () => void;
}) {
  const Icon = item.icon;
  const isActiveNote = item.kind === "note" && item.note?.id === activeNoteId;
  const isPinned = item.kind === "note" && item.note?.isPinned;

  return (
    <div
      role="option"
      aria-selected={selected}
      data-index={index}
      onClick={onRun}
      onMouseEnter={onHover}
      className={cn(
        "mx-1 flex min-h-[44px] cursor-pointer items-center justify-between gap-2 px-2.5 py-2 text-xs transition-colors motion-reduce:transition-none rounded-none sm:px-3",
        selected ? "bg-muted/80 text-foreground" : "text-foreground/80 hover:bg-muted/40"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
        <div
          className={cn(
            "flex size-6 shrink-0 items-center justify-center border border-border/60 rounded-xs",
            item.kind === "command" ? "bg-muted/70" : "bg-transparent"
          )}
        >
          <Icon
            className={cn(
              "size-3",
              item.kind === "tag" ? "text-muted-foreground" : "text-foreground"
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[12.5px] font-medium text-foreground sm:text-[13px]">
              <Highlight text={item.title} term={term} />
            </span>
            {isPinned && (
              <Pin className="size-2.5 shrink-0 fill-current text-amber-600 dark:text-amber-400" />
            )}
            {isActiveNote && (
              <Badge
                variant="outline"
                className="shrink-0 border-border/60 px-1 py-0 font-mono text-[8.5px] text-muted-foreground sm:text-[9px]"
              >
                CURRENT
              </Badge>
            )}
            {item.badge && (
              <Badge
                variant="outline"
                className="shrink-0 border-border/60 px-1 py-0 font-mono text-[8.5px] text-muted-foreground sm:text-[9px]"
              >
                {item.badge}
              </Badge>
            )}
          </div>
          {item.subtitle && (
            <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground sm:text-[11px]">
              {item.kind === "note" ? item.subtitle : <Highlight text={item.subtitle} term={term} />}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {item.kind === "note" && item.tags && item.tags.length > 0 && (
          <div className="hidden items-center gap-1 sm:flex">
            {item.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="max-w-20 truncate border border-border/50 bg-muted/60 px-1.5 py-0.5 font-mono text-[9.5px] text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {item.chip && item.kind !== "note" && (
          <span className="border border-border/50 bg-muted/60 px-1.5 py-0.5 font-mono text-[9.5px] text-muted-foreground">
            {item.chip}
          </span>
        )}

        {item.shortcut && (
          <Badge
            variant="outline"
            className="shrink-0 border-border/60 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground sm:text-[9.5px]"
          >
            {item.shortcut}
          </Badge>
        )}
      </div>
    </div>
  );
}
