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

  const activeNotes = useMemo(() => notes.filter((n) => !n.isDeleted), [notes]);
  const trashedNotes = useMemo(() => notes.filter((n) => n.isDeleted), [notes]);

  const activeNote = activeNotes.find((n) => n.id === activeNoteId) || activeNotes[0];

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
      isDeleted: false,
      revisions: [],
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

  const updateNote = useCallback((id: string, partial: Partial<Pick<Note, "title" | "content" | "isPinned">>, recordRevision = false) => {
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

        let nextRevisions = note.revisions || [];
        if (recordRevision && partial.content !== undefined && partial.content !== note.content) {
          const words = nextContent.trim().split(/\s+/).filter(Boolean).length;
          nextRevisions = notesRepository.createRevision(nextContent, words, nextRevisions);
        }

        return {
          ...note,
          ...partial,
          title: derivedTitle,
          tags: nextTags,
          updatedAt: Date.now(),
          revisions: nextRevisions,
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

  // Soft delete: move note to Trash
  const moveToTrash = useCallback((id: string) => {
    setNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, isDeleted: true, deletedAt: Date.now(), isPinned: false } : n
      );
      notesRepository.saveNotes(updated);

      if (activeNoteId === id) {
        const remaining = updated.filter((n) => !n.isDeleted && n.id !== id);
        const nextActive = remaining[0]?.id || "";
        setActiveNoteId(nextActive);
        notesRepository.saveActiveNoteId(nextActive);
      }
      return updated;
    });
  }, [activeNoteId]);

  // Restore note from Trash
  const restoreFromTrash = useCallback((id: string) => {
    setNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, isDeleted: false, deletedAt: undefined } : n
      );
      notesRepository.saveNotes(updated);
      setActiveNoteId(id);
      notesRepository.saveActiveNoteId(id);
      return updated;
    });
  }, []);

  // Permanently delete a single note
  const purgeNote = useCallback((id: string) => {
    setNotes((prev) => {
      const filtered = prev.filter((n) => n.id !== id);
      notesRepository.saveNotes(filtered);
      if (activeNoteId === id) {
        const remaining = filtered.filter((n) => !n.isDeleted);
        const nextActive = remaining[0]?.id || "";
        setActiveNoteId(nextActive);
        notesRepository.saveActiveNoteId(nextActive);
      }
      return filtered;
    });
  }, [activeNoteId]);

  // Empty all trashed notes
  const emptyTrash = useCallback(() => {
    setNotes((prev) => {
      const filtered = prev.filter((n) => !n.isDeleted);
      notesRepository.saveNotes(filtered);
      return filtered;
    });
  }, []);

  // Restore a revision to the note's active content
  const restoreRevision = useCallback((noteId: string, revisionContent: string) => {
    updateNote(noteId, { content: revisionContent }, true);
  }, [updateNote]);

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
    const active = restoredNotes.find((n) => !n.isDeleted) || restoredNotes[0];
    if (active) {
      setActiveNoteId(active.id);
      notesRepository.saveActiveNoteId(active.id);
    }
  }, []);

  // Duplicate an existing note
  const duplicateNote = useCallback((id: string) => {
    const original = notes.find((n) => n.id === id);
    if (!original) return;
    const duplicated: Note = {
      id: `note-${Date.now()}`,
      title: `${original.title || "Untitled"} (Copy)`,
      content: original.content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
      tags: original.tags ? [...original.tags] : [],
      isDeleted: false,
      revisions: [],
    };
    setNotes((prev) => {
      const updated = [duplicated, ...prev];
      notesRepository.saveNotes(updated);
      return updated;
    });
    setActiveNoteId(duplicated.id);
    notesRepository.saveActiveNoteId(duplicated.id);
    return duplicated;
  }, [notes]);

  // Create a note from template
  const createNoteFromTemplate = useCallback((template: { title?: string; defaultTitle?: string; content: string; tags?: string[] }) => {
    return createNote({
      title: template.defaultTitle || template.title || "Untitled",
      content: template.content,
      tags: template.tags || [],
    });
  }, [createNote]);

  // Navigate to or auto-create a note referenced via [[Wiki Link]]
  const navigateOrCreateWikiLink = useCallback((targetTitle: string) => {
    const trimmed = targetTitle.trim();
    if (!trimmed) return;
    const existing = activeNotes.find(
      (n) => (n.title || "").toLowerCase() === trimmed.toLowerCase() || n.id === trimmed
    );
    if (existing) {
      handleSelectNote(existing.id);
      return existing;
    }
    return createNote({
      title: trimmed,
      content: `# ${trimmed}\n\n`,
    });
  }, [activeNotes, handleSelectNote, createNote]);

  // Compute backlinks for the active note (notes that link to this one via [[Title]])
  const backlinks = useMemo(() => {
    if (!activeNote || !activeNote.title) return [];
    const safeTitle = activeNote.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const titleRegex = new RegExp(`\\[\\[${safeTitle}(?:\\|[^\\]]+)?\\]\\]`, "i");
    const idRegex = new RegExp(`\\[\\[${activeNote.id}(?:\\|[^\\]]+)?\\]\\]`, "i");

    return activeNotes
      .filter((n) => n.id !== activeNote.id && (titleRegex.test(n.content) || idRegex.test(n.content)))
      .map((n) => ({ id: n.id, title: n.title || "Untitled" }));
  }, [activeNote, activeNotes]);

  // Compute all unique tags across active notes
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    activeNotes.forEach((n) => {
      if (Array.isArray(n.tags)) {
        n.tags.forEach((t) => tagSet.add(t));
      }
      extractTags(n.content).forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }, [activeNotes]);

  // Filter and sort active notes
  const filteredNotes = useMemo(() => {
    return activeNotes
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
  }, [activeNotes, searchQuery, selectedTag]);

  return {
    notes: filteredNotes,
    allRawNotes: activeNotes,
    trashedNotes,
    trashCount: trashedNotes.length,
    allNotesCount: activeNotes.length,
    activeNote,
    activeNoteId,
    backlinks,
    isLoaded,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    allTags,
    selectNote: handleSelectNote,
    createNote,
    createNoteFromTemplate,
    duplicateNote,
    navigateOrCreateWikiLink,
    updateNote,
    togglePinNote,
    deleteNote: moveToTrash,
    restoreFromTrash,
    purgeNote,
    emptyTrash,
    restoreRevision,
    importNotes,
    restoreBackup,
  };
}

