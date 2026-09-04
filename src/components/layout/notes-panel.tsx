"use client";

import { useState } from "react";
import { Note } from "@/lib/storage/schema";
import { cn, formatDate } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, X, Pin, PinOff, Copy, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Corners } from "@/components/frame";

interface NotesPanelProps {
  notes: Note[];
  activeNoteId: string;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDuplicateNote: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

function getSnippet(content: string, maxLength = 60): string {
  if (!content.trim()) return "Empty note";
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (!line.startsWith("#") && !line.startsWith("-") && !line.startsWith("!")) {
      return line.slice(0, maxLength) + (line.length > maxLength ? "..." : "");
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

export function NotesPanel({
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onTogglePin,
  onDuplicateNote,
  searchQuery,
  onSearchChange,
}: NotesPanelProps) {
  const [showSearch, setShowSearch] = useState(false);

  const filteredNotes = searchQuery.trim()
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes;

  const groupedNotes = groupNotesByDate(filteredNotes);

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="px-3 py-2 border-b border-border/40">
        <div className="relative">
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

      {/* Notes List */}
      <ScrollArea className="flex-1">
        <div className="px-2 py-2 space-y-4">
          {groupedNotes.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground px-4">
              <p>{searchQuery ? "No matching notes found" : "No notes yet"}</p>
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
          ) : (
            groupedNotes.map((group) => (
              <div key={group.label}>
                {/* Group Label */}
                <div className="px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {group.label}
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  {group.notes.map((note) => {
                    const isActive = note.id === activeNoteId;
                    const snippet = getSnippet(note.content);

                    return (
                      <div
                        key={note.id}
                        onClick={() => onSelectNote(note.id)}
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

                          {/* Actions */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                  {note.isPinned ? (
                                    <PinOff className="size-3.5" />
                                  ) : (
                                    <Pin className="size-3.5" />
                                  )}
                                  <span>{note.isPinned ? "Unpin" : "Pin"}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDuplicateNote(note.id);
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
                                    onDeleteNote(note.id);
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
                        <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5 pl-0">
                          {snippet}
                        </p>

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
                        <div className="text-[9px] text-muted-foreground/50 mt-1">
                          {formatDate(note.updatedAt)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
