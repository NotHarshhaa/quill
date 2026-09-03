export interface NoteRevision {
  id: string;
  content: string;
  savedAt: number;
  wordCount: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  tags?: string[];
  isDeleted?: boolean;
  deletedAt?: number;
  revisions?: NoteRevision[];
}

export const STORAGE_KEY = "quill_notes_data_v1";
export const ACTIVE_NOTE_KEY = "quill_active_note_id_v1";

export const INITIAL_NOTES: Note[] = [
  {
    id: "welcome-note",
    title: "Welcome to Quill",
    content: `# Welcome to Quill

Everything you type is rendered *live* into warm paper typography with zero remote servers.

> [!NOTE] Offline-First Guarantee
> Your notes, revision histories, and checklist states are stored directly in your browser with zero telemetries.

## Quick Start
- [x] Create your first thought
- [ ] Try toggling this checklist in the preview
- [ ] Press **Ctrl+K** (or **⌘K**) for the Command Palette
- [ ] Pin your favorite notes to the top

## Feature Ledger
| Feature | Capabilities | Status |
| :--- | :--- | :---: |
| Tables | Ledger-style columns with alignment | Active |
| Callouts | [!NOTE], [!TIP], [!WARNING], [!CAUTION] | Active |
| Trash Can | Soft delete with 1-click restore | Active |
| Version History | Timestamped snapshot timeline | Active |
| Print & PDF | Clean printer stylesheet | Active |

Tag your thoughts naturally with #guide or #productivity anywhere in the text.`,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    isPinned: true,
    tags: ["guide", "productivity"],
  },
  {
    id: "groceries-note",
    title: "Market Checklist",
    content: `# Market Checklist

Fresh artisan ingredients for Sunday brunch:

- [x] sourdough loaf
- [x] churned salted butter
- [ ] sea salt flakes
- [ ] earl grey tea
- [ ] organic clover honey

#groceries #recipes`,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    isPinned: false,
    tags: ["groceries", "recipes"],
  },
  {
    id: "ideas-note",
    title: "Ideas & Projects",
    content: `# Someday Ideas

## Big
A reading lamp that gently dims as your tea cools.

## Small
A physical notebook with **no** last page.

#ideas #creative`,
    createdAt: Date.now() - 1000 * 60 * 60 * 4,
    updatedAt: Date.now() - 1000 * 60 * 20,
    isPinned: false,
    tags: ["ideas", "creative"],
  },
  {
    id: "untitled-note",
    title: "Untitled",
    content: "",
    createdAt: Date.now() - 1000 * 60 * 10,
    updatedAt: Date.now() - 1000 * 60 * 10,
  },
];
