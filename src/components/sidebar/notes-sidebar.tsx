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
  RotateCcw,
  Copy,
  Sparkles,
  PenLine,
  Download,
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
  trashedNotes?: Note[];
  onRestoreFromTrash?: (id: string) => void;
  onPurgeNote?: (id: string) => void;
  onEmptyTrash?: () => void;
  onDuplicateNote?: (id: string) => void;
  onOpenTemplates?: () => void;
  onExportNote?: (note: Note) => void;
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
  trashedNotes = [],
  onRestoreFromTrash,
  onPurgeNote,
  onEmptyTrash,
  onDuplicateNote,
  onOpenTemplates,
  onExportNote,
}: NotesSidebarProps) {
  const [activeTab, setActiveTab] = useState<"notes" | "trash">("notes");
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const [purgingNote, setPurgingNote] = useState<Note | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const confirmDelete = () => {
    if (deletingNote) {
      onDeleteNote(deletingNote.id);
      setDeletingNote(null);
    }
  };

  const confirmPurge = () => {
    if (purgingNote && onPurgeNote) {
      onPurgeNote(purgingNote.id);
      setPurgingNote(null);
    }
  };

  return (
    <aside className="w-72 sm:w-80 max-w-[85vw] border-r border-border/70 flex flex-col h-full bg-background shadow-2xl lg:shadow-none select-none shrink-0 relative font-sans">
      {/* Sidebar Header */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-border/40">
        <div className="relative flex items-center gap-1 bg-card/80 p-0.5 border border-border/80 shadow-xs">
          <Corners size="sm" offset="border" weight="thin" light />
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onToggleCollapse}
              className="text-muted-foreground/60 hover:text-foreground inline-flex rounded-none"
              title="Close sidebar"
            >
              <PanelLeftClose className="size-3.5" />
            </Button>
          )}
          <Badge variant="outline" className="text-[10px] tracking-widest font-mono font-semibold px-1.5 py-0.5 border-0 rounded-none">
            NOTES
          </Badge>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setShowSearch(!showSearch)}
            className="text-muted-foreground/60 hover:text-foreground rounded-none"
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
                className="text-muted-foreground/60 hover:text-foreground rounded-none"
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

        {/* New Note & Template Action Group */}
        <div className="flex items-center gap-1.5">
          {onOpenTemplates && (
            <Button
              size="xs"
              variant="outline"
              onClick={onOpenTemplates}
              className="relative border border-border shadow-xs rounded-none gap-1 px-2 h-7"
              title="New from Template..."
            >
              <Corners size="sm" offset="border" weight="thin" light />
              <Sparkles className="size-3 text-primary" />
              <span className="hidden xs:inline text-[11px]">Template</span>
            </Button>
          )}

          <Button
            size="xs"
            variant="default"
            onClick={() => {
              setActiveTab("notes");
              onCreateNote();
            }}
            className="relative border border-primary/40 shadow-xs rounded-none h-7 px-2.5"
          >
            <Corners size="sm" offset="border" weight="thin" light />
            <Plus className="size-3.5" />
            <span>New</span>
          </Button>
        </div>
      </div>

      {/* View Tabs: Active Notes vs Trash */}
      <div className="px-3 py-1.5 border-b border-border/30 flex items-center justify-between text-xs bg-muted/10 select-none">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("notes")}
            className={cn(
              "px-2 py-0.5 text-xs font-sans transition-colors border",
              activeTab === "notes"
                ? "bg-card text-foreground font-semibold border-border/80 shadow-xs"
                : "bg-transparent text-muted-foreground hover:text-foreground border-transparent"
            )}
          >
            All Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab("trash")}
            className={cn(
              "px-2 py-0.5 text-xs font-sans transition-colors border flex items-center gap-1",
              activeTab === "trash"
                ? "bg-card text-foreground font-semibold border-border/80 shadow-xs"
                : "bg-transparent text-muted-foreground hover:text-foreground border-transparent"
            )}
          >
            <Trash2 className="size-3" />
            <span>Trash</span>
            {trashedNotes.length > 0 && (
              <span className="text-[10px] font-mono px-1 bg-destructive/15 text-destructive font-semibold">
                {trashedNotes.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "trash" && trashedNotes.length > 0 && onEmptyTrash && (
          <button
            onClick={onEmptyTrash}
            className="text-[11px] text-destructive hover:underline font-sans"
            title="Permanently remove all trashed notes"
          >
            Empty All
          </button>
        )}
      </div>

      {/* Search Input when toggled */}
      {showSearch && activeTab === "notes" && (
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
      {allTags.length > 0 && onSelectTag && activeTab === "notes" && (
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

      {/* Notes / Trash List wrapped in ScrollArea */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-1.5">
          {activeTab === "trash" ? (
            trashedNotes.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground px-4 font-sans">
                <Trash2 className="size-6 mx-auto mb-2 opacity-30" />
                Trash is empty.
              </div>
            ) : (
              trashedNotes.map((note) => {
                const snippet = getSnippet(note.content);
                return (
                  <div
                    key={note.id}
                    className="p-2.5 bg-card/60 border border-border/70 shadow-xs space-y-1 relative"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                        {note.title || "Untitled"}
                      </h4>
                      <div className="flex items-center gap-1">
                        {onRestoreFromTrash && (
                          <Button
                            variant="outline"
                            size="icon-xs"
                            onClick={() => onRestoreFromTrash(note.id)}
                            title="Restore note"
                            className="size-6 text-foreground hover:text-primary"
                          >
                            <RotateCcw className="size-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setPurgingNote(note)}
                          title="Permanently delete"
                          className="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground/75 truncate font-sans">
                      {snippet}
                    </p>
                  </div>
                );
              })
            )
          ) : notes.length === 0 ? (
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

                    {/* Action buttons & Three-dot menu */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      {/* Desktop Quick Actions (Pin, Duplicate, Delete on hover) */}
                      <div className="hidden lg:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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

                        {onDuplicateNote && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicateNote(note.id);
                            }}
                            title="Duplicate note"
                            className="size-6 text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="size-3" />
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

                      {/* Three-Dot Menu: Always visible on Mobile & Tablet, and also available on Desktop */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              "size-6 text-muted-foreground hover:text-foreground rounded-none transition-opacity",
                              "opacity-80 hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 data-[state=open]:opacity-100"
                            )}
                            title="More note options"
                          >
                            <MoreVertical className="size-3.5" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-44 rounded-none border border-border/80 bg-background/95 backdrop-blur-md shadow-xl font-sans"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem
                            onClick={() => onSelectNote(note.id)}
                            className="gap-2 text-xs cursor-pointer rounded-none"
                          >
                            <PenLine className="size-3.5 text-muted-foreground" />
                            <span>Edit Note</span>
                          </DropdownMenuItem>

                          {onDuplicateNote && (
                            <DropdownMenuItem
                              onClick={() => onDuplicateNote(note.id)}
                              className="gap-2 text-xs cursor-pointer rounded-none"
                            >
                              <Copy className="size-3.5 text-muted-foreground" />
                              <span>Duplicate</span>
                            </DropdownMenuItem>
                          )}

                          {onTogglePin && (
                            <DropdownMenuItem
                              onClick={() => onTogglePin(note.id)}
                              className="gap-2 text-xs cursor-pointer rounded-none"
                            >
                              {note.isPinned ? (
                                <>
                                  <PinOff className="size-3.5 text-amber-600 dark:text-amber-400" />
                                  <span>Unpin Note</span>
                                </>
                              ) : (
                                <>
                                  <Pin className="size-3.5 text-muted-foreground" />
                                  <span>Pin to Top</span>
                                </>
                              )}
                            </DropdownMenuItem>
                          )}

                          {onExportNote && (
                            <DropdownMenuItem
                              onClick={() => onExportNote(note)}
                              className="gap-2 text-xs cursor-pointer rounded-none"
                            >
                              <Download className="size-3.5 text-muted-foreground" />
                              <span>Export Markdown</span>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => setDeletingNote(note)}
                            className="gap-2 text-xs cursor-pointer rounded-none text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5" />
                            <span>Delete Note</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Move to Trash Confirmation Dialog */}
      <Dialog
        open={Boolean(deletingNote)}
        onOpenChange={(open) => !open && setDeletingNote(null)}
      >
        <DialogContent className="font-sans border border-border bg-background shadow-2xl rounded-none">
          <Corners size="sm" offset="border" weight="thin" light />
          <DialogHeader>
            <DialogTitle className="font-sans font-semibold">Move to Trash?</DialogTitle>
            <DialogDescription className="font-sans">
              Move &ldquo;{deletingNote?.title || "Untitled"}&rdquo; to Trash? You can restore it anytime from the Trash tab.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 font-sans">
            <Button
              variant="outline"
              size="sm"
              className="rounded-none"
              onClick={() => setDeletingNote(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-none"
              onClick={confirmDelete}
            >
              Move to Trash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanently Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(purgingNote)}
        onOpenChange={(open) => !open && setPurgingNote(null)}
      >
        <DialogContent className="font-sans border border-border bg-background shadow-2xl rounded-none">
          <Corners size="sm" offset="border" weight="thin" light />
          <DialogHeader>
            <DialogTitle className="font-sans font-semibold text-destructive">Delete Permanently?</DialogTitle>
            <DialogDescription className="font-sans">
              Are you sure you want to permanently delete &ldquo;{purgingNote?.title || "Untitled"}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 font-sans">
            <Button
              variant="outline"
              size="sm"
              className="rounded-none"
              onClick={() => setPurgingNote(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-none"
              onClick={confirmPurge}
            >
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

