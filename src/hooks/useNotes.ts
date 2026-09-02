"use client";

import { useState, useEffect, useCallback } from "react";
import { Note } from "@/lib/storage/schema";
import { notesRepository } from "@/lib/storage/notesRepository";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize from storage on mount
  useEffect(() => {
    const loadedNotes = notesRepository.getNotes();
    setNotes(loadedNotes);
    const initialActive = notesRepository.getActiveNoteId(
      loadedNotes[2]?.id || loadedNotes[0]?.id || ""
    );
    setActiveNoteId(initialActive);
    setIsLoaded(true);
  }, []);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];

  const handleSelectNote = useCallback((id: string) => {
    setActiveNoteId(id);
    notesRepository.saveActiveNoteId(id);
  }, []);

  const createNote = useCallback(() => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: "Untitled",
      content: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
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

  const updateNote = useCallback((id: string, partial: Partial<Pick<Note, "title" | "content">>) => {
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

        return {
          ...note,
          ...partial,
          title: derivedTitle,
          updatedAt: Date.now(),
        };
      });
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

  const filteredNotes = notes.filter((n) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(query) ||
      n.content.toLowerCase().includes(query)
    );
  });

  return {
    notes: filteredNotes,
    allNotesCount: notes.length,
    activeNote,
    activeNoteId,
    isLoaded,
    searchQuery,
    setSearchQuery,
    selectNote: handleSelectNote,
    createNote,
    updateNote,
    deleteNote,
  };
}
