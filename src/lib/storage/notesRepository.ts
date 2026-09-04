import { INITIAL_NOTES, Note, STORAGE_KEY, ACTIVE_NOTE_KEY } from "./schema";
import { extractTags } from "@/lib/utils";

export type StorageErrorHandler = (error: string) => void;

function generateNoteId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `note-${crypto.randomUUID()}`;
  }
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

let onErrorHandler: StorageErrorHandler | null = null;

export const notesRepository = {
  setErrorHandler(handler: StorageErrorHandler | null) {
    onErrorHandler = handler;
  },
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
        return parsed.map((n) => {
          const isWelcomeLegacy =
            n?.id === "welcome-note" &&
            typeof n?.content === "string" &&
            !n.content.includes("Feature Architecture Ledger");

          return {
            id: n?.id || `note-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            title: typeof n?.title === "string" ? n.title : "Untitled",
            content: isWelcomeLegacy
              ? INITIAL_NOTES[0].content
              : typeof n?.content === "string"
              ? n.content
              : "",
            createdAt: typeof n?.createdAt === "number" ? n.createdAt : Date.now(),
            updatedAt: isWelcomeLegacy
              ? Date.now()
              : typeof n?.updatedAt === "number"
              ? n.updatedAt
              : Date.now(),
            isPinned: n?.id === "welcome-note" ? true : Boolean(n?.isPinned),
            tags: isWelcomeLegacy
              ? INITIAL_NOTES[0].tags
              : Array.isArray(n?.tags)
              ? n.tags
              : [],
            isDeleted: Boolean(n?.isDeleted),
            deletedAt: typeof n?.deletedAt === "number" ? n.deletedAt : undefined,
            revisions: Array.isArray(n?.revisions) ? n.revisions : [],
          };
        });
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
      const error = e as Error & { code?: number };
      console.error("Failed to save notes to localStorage", error);
      const isQuotaError = error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
        error.code === 22 ||
        error.code === 1014;
      if (isQuotaError) {
        const message = "Storage quota exceeded. Some changes may not be saved. Consider exporting your notes or deleting old ones.";
        if (onErrorHandler) {
          onErrorHandler(message);
        }
      } else {
        if (onErrorHandler) {
          onErrorHandler("Failed to save changes. Please export your notes as backup.");
        }
      }
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
  },

  backupAllNotes(notes: Note[]): void {
    if (typeof window === "undefined") return;
    const backupData = {
      app: "quill",
      version: "1.0",
      exportedAt: new Date().toISOString(),
      noteCount: notes.length,
      notes,
    };
    const jsonBlob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(jsonBlob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    link.href = url;
    link.download = `quill-backup-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  restoreNotesFromJSON(jsonString: string): { success: boolean; count: number; notes?: Note[]; error?: string } {
    try {
      const parsed: unknown = JSON.parse(jsonString);
      let candidateNotes: Record<string, unknown>[] = [];

      if (Array.isArray(parsed)) {
        candidateNotes = parsed.filter((n): n is Record<string, unknown> => n !== null && typeof n === "object");
      } else if (parsed && typeof parsed === "object" && Array.isArray((parsed as Record<string, unknown>).notes)) {
        const notes = (parsed as Record<string, unknown>).notes;
        candidateNotes = Array.isArray(notes)
          ? notes.filter((n): n is Record<string, unknown> => n !== null && typeof n === "object")
          : [];
      } else {
        return { success: false, count: 0, error: "Invalid backup format: missing notes array" };
      }

      // Validate and clean notes
      const validNotes: Note[] = candidateNotes
        .filter((n) => typeof n.id === "string")
        .map((n) => ({
          id: n.id as string,
          title: typeof n.title === "string" ? n.title : "Untitled",
          content: typeof n.content === "string" ? n.content : "",
          createdAt: typeof n.createdAt === "number" ? n.createdAt : Date.now(),
          updatedAt: typeof n.updatedAt === "number" ? n.updatedAt : Date.now(),
          isPinned: Boolean(n.isPinned),
          tags: Array.isArray(n.tags) ? n.tags.filter((t: unknown) => typeof t === "string") : [],
          isDeleted: Boolean(n.isDeleted),
          deletedAt: typeof n.deletedAt === "number" ? n.deletedAt : undefined,
          revisions: Array.isArray(n.revisions) ? n.revisions : [],
        }));

      if (validNotes.length === 0) {
        return { success: false, count: 0, error: "No valid notes found in backup file" };
      }

      return { success: true, count: validNotes.length, notes: validNotes };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to parse JSON file";
      return { success: false, count: 0, error: message };
    }
  },

  createNoteFromMarkdown(filename: string, content: string): Note {
    // Derive title from filename without extension or first heading
    let title = filename.replace(/\.(md|markdown|txt)$/i, "").trim();
    const headingMatch = content.match(/^#+\s*(.*)$/m);
    if (headingMatch && headingMatch[1].trim()) {
      title = headingMatch[1].trim();
    }
    if (!title) title = "Imported Note";

    return {
      id: generateNoteId(),
      title,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
      tags: extractTags(content),
      isDeleted: false,
      revisions: [],
    };
  },

  createRevision(content: string, wordCount: number, prevRevisions: Note["revisions"] = []): NonNullable<Note["revisions"]> {
    const list = prevRevisions || [];
    if (list.length > 0 && list[0].content === content) {
      return list;
    }
    const newRev = {
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      content,
      savedAt: Date.now(),
      wordCount,
    };
    return [newRev, ...list].slice(0, 15);
  },
};
