export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export const STORAGE_KEY = "quill_notes_data_v1";
export const ACTIVE_NOTE_KEY = "quill_active_note_id_v1";

export const INITIAL_NOTES: Note[] = [
  {
    id: "welcome-note",
    title: "Welcome to Quill",
    content: `# Welcome to Quill

Everything you type is rendered *live* into beautiful typography with zero remote servers.`,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: "groceries-note",
    title: "Groceries",
    content: `# Groceries

- sourdough loaf
- churned butter
- sea salt flakes
- earl grey tea`,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: "ideas-note",
    title: "Ideas",
    content: `# Someday

## Big
A reading lamp that dims as your tea cools.

## Small
A notebook with **no** last page.`,
    createdAt: Date.now() - 1000 * 60 * 60 * 4,
    updatedAt: Date.now() - 1000 * 60 * 20,
  },
  {
    id: "untitled-note",
    title: "Untitled",
    content: "",
    createdAt: Date.now() - 1000 * 60 * 10,
    updatedAt: Date.now() - 1000 * 60 * 10,
  },
];
