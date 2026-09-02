"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  FileText,
  PanelLeftClose,
  X,
  Pin,
  PinOff,
  MoreVertical,
  Upload,
  Archive,
  Command,
} from "lucide-react";
import { Note } from "@/lib/storage/schema";
import { cn } from "@/lib/utils";
import { Corners } from "@/components/frame";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NotesSidebarProps {
  notes: Note[];
  activeNoteId: string;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  onTogglePin?: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTag?: string | null;
  onSelectTag?: (tag: string | null) => void;
  allTags?: string[];
  onImportMarkdown?: () => void;
  onBackupNotes?: () => void;
  onRestoreBackup?: () => void;
  onOpenCommandPalette?: () => void;
  onToggleCollapse?: () => void;
}

function getSnippet(content: string): string {
  if (!content.trim()) return "empty";
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (!line.startsWith("#")) {
      return line.slice(0, 42);
    }
  }
  return lines[1] ? lines[1].slice(0, 42) : lines[0].slice(0, 42);
}

export function NotesSidebar({
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onTogglePin,
  searchQuery,
  onSearchChange,
  selectedTag,
  onSelectTag,
  allTags = [],
  onImportMarkdown,
  onBackupNotes,
  onRestoreBackup,
  onOpenCommandPalette,
  onToggleCollapse,
}: NotesSidebarProps) {
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const confirmDelete = () => {
    if (deletingNote) {
      onDeleteNote(deletingNote.id);
      setDeletingNote(null);
    }
  };

  return (
    <aside className="w-64 sm:w-72 border-r border-border/70 flex flex-col h-full bg-background/50 select-none shrink-0 relative font-sans">
      {/* Sidebar Header */}
      <div className="p-4 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-1.5">
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onToggleCollapse}
              className="text-muted-foreground/60 hover:text-foreground hidden lg:inline-flex"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="size-3.5" />
            </Button>
          )}
          <Badge variant="outline" className="text-[10px] tracking-widest font-mono font-semibold px-1.5 py-0.5 border border-border">
            NOTES
          </Badge>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setShowSearch(!showSearch)}
            className="text-muted-foreground/60 hover:text-foreground"
            title="Search notes"
          >
            <Search className="size-3" />
          </Button>

          {/* More actions dropdown: Import, Backup, Restore */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground/60 hover:text-foreground"
                title="Options & Data"
              >
                <MoreVertical className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="font-sans text-xs min-w-44">
              {onOpenCommandPalette && (
                <DropdownMenuItem onClick={onOpenCommandPalette} className="gap-2">
                  <Command className="size-3.5 text-muted-foreground" />
                  <span>Command Palette</span>
                </DropdownMenuItem>
              )}
              {onImportMarkdown && (
                <DropdownMenuItem onClick={onImportMarkdown} className="gap-2">
                  <Upload className="size-3.5 text-muted-foreground" />
                  <span>Import .md File</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onBackupNotes && (
                <DropdownMenuItem onClick={onBackupNotes} className="gap-2">
                  <Archive className="size-3.5 text-muted-foreground" />
                  <span>Backup All (JSON)</span>
                </DropdownMenuItem>
              )}
              {onRestoreBackup && (
                <DropdownMenuItem onClick={onRestoreBackup} className="gap-2">
                  <Upload className="size-3.5 text-muted-foreground" />
                  <span>Restore Backup</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button
          size="xs"
          variant="default"
          onClick={onCreateNote}
        >
          <Plus className="size-3.5" />
          <span>New</span>
        </Button>
      </div>

      {/* Search Input when toggled */}
      {showSearch && (
        <div className="px-3 py-2 border-b border-border/40 animate-in fade-in-50 duration-150">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              type="text"
              placeholder="Search notes..."
              autoFocus
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

      {/* Tag Filtering Bar */}
      {allTags.length > 0 && onSelectTag && (
        <div className="px-3 py-2 border-b border-border/30 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => onSelectTag(null)}
            className={cn(
              "text-[10px] font-mono px-2 py-0.5 whitespace-nowrap transition-colors border",
              !selectedTag
                ? "bg-foreground text-background font-semibold border-foreground"
                : "bg-muted/40 text-muted-foreground hover:text-foreground border-border/50"
            )}
          >
            ALL
          </button>
          {allTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => onSelectTag(isSelected ? null : tag)}
                className={cn(
                  "text-[10px] font-mono px-2 py-0.5 whitespace-nowrap transition-colors border",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold border-primary"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground border-border/50"
                )}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}

      {/* Notes List wrapped in shadcn ScrollArea */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-1.5">
          {notes.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground px-4 font-sans">
              <FileText className="size-6 mx-auto mb-2 opacity-30" />
              {selectedTag
                ? `No notes tagged with #${selectedTag}`
                : searchQuery
                ? "No matching notes found"
                : "No notes found. Click \"+ New\" to create one."}
            </div>
          ) : (
            notes.map((note) => {
              const isActive = note.id === activeNoteId;
              const snippet = getSnippet(note.content);

              return (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note.id)}
                  className={cn(
                    "group relative w-full text-left p-3 rounded-none transition-all cursor-pointer font-sans",
                    isActive
                      ? "bg-card shadow-xs border border-border text-foreground"
                      : "hover:bg-muted/40 text-foreground/80 hover:text-foreground border border-transparent"
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
                          "text-sm truncate font-sans",
                          isActive ? "text-foreground font-semibold" : "text-foreground/90 font-medium"
                        )}
                      >
                        {note.title || "Untitled"}
                      </h3>
                    </div>

                    {/* Action buttons (Pin & Delete) */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onTogglePin && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(note.id);
                          }}
                          title={note.isPinned ? "Unpin note" : "Pin note to top"}
                          className="size-6 text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400"
                        >
                          {note.isPinned ? (
                            <PinOff className="size-3" />
                          ) : (
                            <Pin className="size-3" />
                          )}
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingNote(note);
                        }}
                        title="Delete note"
                        className="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground/75 truncate mt-0.5 font-sans">
                    {snippet}
                  </p>

                  {/* Note tags badges */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          onClick={(e) => {
                            if (onSelectTag) {
                              e.stopPropagation();
                              onSelectTag(selectedTag === tag ? null : tag);
                            }
                          }}
                          className="text-[9.5px] font-mono text-muted-foreground/80 hover:text-foreground bg-muted/50 px-1.5 py-0.2 border border-border/40"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deletingNote)}
        onOpenChange={(open) => !open && setDeletingNote(null)}
      >
        <DialogContent className="font-sans">
          <DialogHeader>
            <DialogTitle className="font-sans font-semibold">Delete Note</DialogTitle>
            <DialogDescription className="font-sans">
              Are you sure you want to delete &ldquo;{deletingNote?.title || "Untitled"}&rdquo;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 font-sans">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingNote(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

