"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Note } from "@/lib/storage/schema";
import {
  Search,
  FileText,
  Plus,
  Pin,
  PinOff,
  Download,
  Upload,
  Archive,
  Sun,
  Moon,
  Laptop,
  History,
  Printer,
  Maximize2,
  Sparkles,
  Copy,
} from "lucide-react";
import { Corners } from "@/components/frame";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

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
  onOpenTemplates?: () => void;
  onToggleZen?: () => void;
  onDuplicateActiveNote?: () => void;
}

type ActionItem = {
  id: string;
  type: "action";
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  handler: () => void;
  shortcut?: string;
};

type NoteItem = {
  id: string;
  type: "note";
  note: Note;
};

type PaletteItem = NoteItem | ActionItem;

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
  onOpenTemplates,
  onToggleZen,
  onDuplicateActiveNote,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  // Reset query and selection when dialog opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Actions list
  const actions: ActionItem[] = useMemo(() => {
    const list: ActionItem[] = [
      {
        id: "action-new",
        type: "action",
        title: "Create New Note",
        subtitle: "Start writing a new note",
        icon: Plus,
        handler: () => {
          onCreateNote();
          onClose();
        },
        shortcut: "Ctrl+N",
      },
      {
        id: "action-export",
        type: "action",
        title: "Export Note as Markdown",
        subtitle: activeNote ? `Export "${activeNote.title || "Untitled"}.md"` : "Export active note",
        icon: Download,
        handler: () => {
          onExportNote();
          onClose();
        },
      },
      {
        id: "action-import",
        type: "action",
        title: "Import Markdown File",
        subtitle: "Load .md or .txt file as a new note",
        icon: Upload,
        handler: () => {
          onImportMarkdown();
          onClose();
        },
      },
      {
        id: "action-backup",
        type: "action",
        title: "Backup All Notes (JSON)",
        subtitle: `Download full archive of ${notes.length} notes`,
        icon: Archive,
        handler: () => {
          onBackupNotes();
          onClose();
        },
      },
      {
        id: "action-restore",
        type: "action",
        title: "Restore from Backup (JSON)",
        subtitle: "Import a previous JSON backup file",
        icon: Upload,
        handler: () => {
          onRestoreBackup();
          onClose();
        },
      },
    ];

    if (onOpenHistory) {
      list.push({
        id: "action-history",
        type: "action",
        title: "Version History & Snapshots",
        subtitle: "View and restore previous revisions of this note",
        icon: History,
        handler: () => {
          onOpenHistory();
          onClose();
        },
      });
    }

    if (onPrintNote) {
      list.push({
        id: "action-print",
        type: "action",
        title: "Print / Export as PDF",
        subtitle: "Open print preview for active note",
        icon: Printer,
        handler: () => {
          onPrintNote();
          onClose();
        },
      });
    }

    if (onToggleZen) {
      list.push({
        id: "action-zen",
        type: "action",
        title: "Toggle Zen Focus Mode",
        subtitle: "Fullscreen distraction-free writing desk",
        icon: Maximize2,
        shortcut: "Ctrl+Shift+F",
        handler: () => {
          onToggleZen();
          onClose();
        },
      });
    }

    if (onOpenTemplates) {
      list.push({
        id: "action-templates",
        type: "action",
        title: "New Note from Template...",
        subtitle: "Start from Meeting, Daily Journal, Spec, or Review",
        icon: Sparkles,
        handler: () => {
          onOpenTemplates();
          onClose();
        },
      });
    }

    if (activeNote && onDuplicateActiveNote) {
      list.push({
        id: "action-duplicate",
        type: "action",
        title: "Duplicate Active Note",
        subtitle: `Create a copy of "${activeNote.title || "Untitled"}"`,
        icon: Copy,
        handler: () => {
          onDuplicateActiveNote();
          onClose();
        },
      });
    }

    if (activeNote) {
      list.unshift({
        id: "action-pin",
        type: "action",
        title: activeNote.isPinned ? "Unpin Active Note" : "Pin Active Note to Top",
        subtitle: `"${activeNote.title || "Untitled"}"`,
        icon: activeNote.isPinned ? PinOff : Pin,
        handler: () => {
          onTogglePin(activeNote.id);
          onClose();
        },
      });
    }

    // Theme switcher action
    list.push({
      id: "action-theme",
      type: "action",
      title: `Switch Theme (Current: ${theme || "system"})`,
      subtitle: "Cycle between Light, Dark, and System",
      icon: theme === "dark" ? Moon : theme === "light" ? Sun : Laptop,
      handler: () => {
        const next = theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
        setTheme(next);
        onClose();
      },
    });

    return list;
  }, [
    activeNote,
    notes.length,
    theme,
    onCreateNote,
    onExportNote,
    onImportMarkdown,
    onBackupNotes,
    onRestoreBackup,
    onTogglePin,
    setTheme,
    onClose,
  ]);

  // Filter notes & actions based on query
  const filteredItems = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();

    const matchedNotes: NoteItem[] = notes
      .filter((note) => {
        if (!q) return true;
        const inTitle = note.title.toLowerCase().includes(q);
        const inContent = note.content.toLowerCase().includes(q);
        const inTags = (note.tags || []).some((t) => t.toLowerCase().includes(q));
        return inTitle || inContent || inTags;
      })
      .slice(0, 8)
      .map((note) => ({ id: note.id, type: "note", note }));

    const matchedActions: ActionItem[] = actions.filter((act) => {
      if (!q) return true;
      return (
        act.title.toLowerCase().includes(q) ||
        (act.subtitle && act.subtitle.toLowerCase().includes(q))
      );
    });

    return [...matchedNotes, ...matchedActions];
  }, [query, notes, actions]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) {
        executeItem(current);
      }
    }
  };

  const executeItem = (item: PaletteItem) => {
    if (item.type === "note") {
      onSelectNote(item.note.id);
      onClose();
    } else if (item.type === "action") {
      item.handler();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="p-0 max-w-xl overflow-hidden border-border/80 bg-background/95 backdrop-blur-md shadow-2xl rounded-none font-sans"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <div className="relative">
          <Corners size="sm" offset="border" weight="thin" light />

          {/* Search Header Bar */}
          <div className="flex items-center px-4 py-3 border-b border-border/60 gap-3">
            <Search className="size-4 text-muted-foreground/70 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type to search notes or run actions..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none font-sans"
            />
            <Badge variant="outline" className="font-mono text-[10px] tracking-wider px-1.5 py-0.5">
              ESC
            </Badge>
          </div>

          {/* Results List */}
          <div
            ref={listRef}
            className="max-h-84 overflow-y-auto p-2 divide-y divide-border/20 font-sans"
          >
            {filteredItems.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground font-sans">
                No matching notes or actions found.
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;

                if (item.type === "note") {
                  const note = item.note;
                  const isActive = activeNote?.id === note.id;

                  return (
                    <div
                      key={item.id}
                      data-index={idx}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 cursor-pointer text-xs transition-colors rounded-none",
                        isSelected
                          ? "bg-muted/80 text-foreground"
                          : "text-foreground/80 hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <FileText className="size-3.5 text-muted-foreground/60 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground truncate text-[13px]">
                              {note.title || "Untitled"}
                            </span>
                            {note.isPinned && (
                              <Pin className="size-2.5 text-amber-600 dark:text-amber-400 fill-current shrink-0" />
                            )}
                            {isActive && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 font-mono text-muted-foreground border-border/60 shrink-0"
                              >
                                CURRENT
                              </Badge>
                            )}
                          </div>
                          {note.content && (
                            <p className="text-[11px] text-muted-foreground truncate max-w-sm mt-0.5">
                              {note.content.replace(/^[#\s\-*\[\]xX]+/gm, "").slice(0, 60)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Note tags */}
                      {note.tags && note.tags.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1 shrink-0 ml-2">
                          {note.tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 border border-border/50"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                // Action item
                const ActionIcon = item.icon;
                return (
                  <div
                    key={item.id}
                    data-index={idx}
                    onClick={() => executeItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 cursor-pointer text-xs transition-colors rounded-none",
                      isSelected
                        ? "bg-muted/80 text-foreground"
                        : "text-foreground/80 hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-6 flex items-center justify-center rounded-xs bg-muted/70 border border-border/60 shrink-0">
                        <ActionIcon className="size-3 text-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-[13px] text-foreground">
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div className="text-[11px] text-muted-foreground truncate">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    {item.shortcut && (
                      <Badge
                        variant="outline"
                        className="font-mono text-[9.5px] px-1.5 py-0.5 text-muted-foreground border-border/60 shrink-0"
                      >
                        {item.shortcut}
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts Guide */}
          <div className="px-4 py-2 bg-muted/30 border-t border-border/50 flex items-center justify-between text-[10.5px] text-muted-foreground font-mono">
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
            </div>
            <span className="text-[10px] tracking-wider uppercase">Quill Command</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
