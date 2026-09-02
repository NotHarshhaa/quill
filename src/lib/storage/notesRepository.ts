import { INITIAL_NOTES, Note, STORAGE_KEY, ACTIVE_NOTE_KEY } from "./schema";

export const notesRepository = {
  getNotes(): Note[] {
    if (typeof window === "undefined") return INITIAL_NOTES;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTES));
        return INITIAL_NOTES;
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return INITIAL_NOTES;
    } catch {
      return INITIAL_NOTES;
    }
  },

  saveNotes(notes: Note[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error("Failed to save notes to localStorage", e);
    }
  },

  getActiveNoteId(fallbackId: string): string {
    if (typeof window === "undefined") return fallbackId;
    try {
      return localStorage.getItem(ACTIVE_NOTE_KEY) || fallbackId;
    } catch {
      return fallbackId;
    }
  },

  saveActiveNoteId(id: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(ACTIVE_NOTE_KEY, id);
    } catch (e) {
      console.error("Failed to save active note id", e);
    }
  },

  exportNote(note: Note): void {
    if (typeof window === "undefined") return;
    const blob = new Blob([note.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = (note.title.trim() || "untitled").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    link.href = url;
    link.download = `${safeTitle}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
