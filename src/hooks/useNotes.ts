"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Note } from "@/lib/storage/schema";
import { notesRepository } from "@/lib/storage/notesRepository";

function extractTags(content?: string | null): string[] {
  if (!content || typeof content !== "string") return [];
  const matches = content.match(/(?:^|\s)#([a-zA-Z0-9_\-]+)\b/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.trim().replace(/^#/, "").toLowerCase())));
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Initialize from storage on mount
  useEffect(() => {
    const loadedNotes = notesRepository.getNotes();
    setNotes(loadedNotes);
    const initialActive = notesRepository.getActiveNoteId(
      loadedNotes[0]?.id || ""
    );
    setActiveNoteId(initialActive);
    setIsLoaded(true);
  }, []);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];

  const handleSelectNote = useCallback((id: string) => {
    setActiveNoteId(id);
    notesRepository.saveActiveNoteId(id);
  }, []);

  const createNote = useCallback((initialData?: Partial<Note>) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: initialData?.title || "Untitled",
      content: initialData?.content || "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: initialData?.isPinned ?? false,
      tags: initialData?.tags || (initialData?.content ? extractTags(initialData.content) : []),
    };

    setNotes((prev) => {
      const updated = [newNote, ...prev];
      notesRepository.saveNotes(updated);
      return updated;
    });
    setActiveNoteId(newNote.id);
    notesRepository.saveActiveNoteId(newNote.id);
    return newNote;
  }, []);

  const updateNote = useCallback((id: string, partial: Partial<Pick<Note, "title" | "content" | "isPinned">>) => {
    setNotes((prev) => {
      const updated = prev.map((note) => {
        if (note.id !== id) return note;

        let derivedTitle = partial.title !== undefined ? partial.title : note.title;
        // If content changed and title is empty or Untitled, auto-derive title from first heading or line
        if (partial.content !== undefined && (note.title === "Untitled" || !note.title.trim())) {
          const match = partial.content.match(/^#+\s*(.*)$/m);
          if (match && match[1].trim()) {
            derivedTitle = match[1].trim();
          }
        }

        const nextContent = partial.content !== undefined ? partial.content : note.content;
        const nextTags = extractTags(nextContent);

        return {
          ...note,
          ...partial,
          title: derivedTitle,
          tags: nextTags,
          updatedAt: Date.now(),
        };
      });
      notesRepository.saveNotes(updated);
      return updated;
    });
  }, []);

  const togglePinNote = useCallback((id: string) => {
    setNotes((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n));
      notesRepository.saveNotes(updated);
      return updated;
    });
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => {
      const filtered = prev.filter((n) => n.id !== id);
      const toPersist = filtered.length > 0 ? filtered : [];
      notesRepository.saveNotes(toPersist);

      if (activeNoteId === id) {
        const nextActive = toPersist[0]?.id || "";
        setActiveNoteId(nextActive);
        notesRepository.saveActiveNoteId(nextActive);
      }
      return filtered;
    });
  }, [activeNoteId]);

  const importNotes = useCallback((newNotes: Note[]) => {
    if (newNotes.length === 0) return;
    setNotes((prev) => {
      const updated = [...newNotes, ...prev];
      notesRepository.saveNotes(updated);
      return updated;
    });
    // Select the first imported note
    if (newNotes[0]) {
      setActiveNoteId(newNotes[0].id);
      notesRepository.saveActiveNoteId(newNotes[0].id);
    }
  }, []);

  const restoreBackup = useCallback((restoredNotes: Note[]) => {
    if (restoredNotes.length === 0) return;
    setNotes(restoredNotes);
    notesRepository.saveNotes(restoredNotes);
    if (restoredNotes[0]) {
      setActiveNoteId(restoredNotes[0].id);
      notesRepository.saveActiveNoteId(restoredNotes[0].id);
    }
  }, []);

  // Compute all unique tags across notes
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((n) => {
      if (Array.isArray(n.tags)) {
        n.tags.forEach((t) => tagSet.add(t));
      }
      extractTags(n.content).forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }, [notes]);

  // Filter and sort notes:
  // 1. Match search query (title or content)
  // 2. Match selected tag (if any)
  // 3. Sort: pinned first, then by updatedAt descending
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        // Tag filter
        if (selectedTag) {
          const noteTags = (Array.isArray(n.tags) ? n.tags : []).concat(extractTags(n.content));
          if (!noteTags.includes(selectedTag.toLowerCase())) {
            return false;
          }
        }

        // Search query filter
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          (n.title || "").toLowerCase().includes(query) ||
          (n.content || "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        // Pinned notes always come first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
  }, [notes, searchQuery, selectedTag]);

  return {
    notes: filteredNotes,
    allRawNotes: notes,
    allNotesCount: notes.length,
    activeNote,
    activeNoteId,
    isLoaded,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    allTags,
    selectNote: handleSelectNote,
    createNote,
    updateNote,
    togglePinNote,
    deleteNote,
    importNotes,
    restoreBackup,
  };
}

