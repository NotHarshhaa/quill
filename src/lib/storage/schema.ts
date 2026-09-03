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

Everything you type is rendered *live* into tactile warm paper typography with zero remote servers and 100% offline privacy.

> [!NOTE] Privacy & Offline-First Guarantee
> All notes, image media (via IndexedDB), revision histories, ambient soundscapes, and writing analytics are computed and stored directly inside your browser. Zero telemetries, zero cloud lock-in.

---

## ⚡ Quick Start Checklist
- [x] Create your first thought or open an existing note
- [ ] Try clicking this interactive checklist item right now
- [ ] Type \`/\` on an empty line to trigger the **In-Editor Slash Command Menu**
- [ ] Press **Ctrl+F** (or **⌘F**) for in-editor **Find & Replace**
- [ ] Press **Ctrl+K** (or **⌘K**) to open the responsive **Command Palette**
- [ ] Open the **Document Outline** drawer via the header or Zen pill
- [ ] Launch the **Interactive Knowledge Graph** via the header network icon
- [ ] Turn on procedural **Ambient Soundscapes** (Rain, Vinyl, Waves) & **Pomodoro Timer**
- [ ] Press **Ctrl+Shift+F** to enter **Zen Focus Desk** with drafting grid and live **Preview Mode**
- [ ] View your **Writing Activity Heatmap & Readability Diagnostics** (Bar chart icon)
- [ ] Tap the **\`···\` three-dot menu** in the sidebar on any note for quick actions

---

## 🗺️ Feature Architecture Ledger

| Domain | Feature | Controls & Shortcuts | Description |
| :--- | :--- | :--- | :--- |
| **Writing Flow** | Slash Menu | Type \`/\` | Fast keyboard insertion of Headings, Tables, Tasks, Code & Alerts |
| **Writing Flow** | Find & Replace | \`Ctrl+F\` / \`⌘F\` | In-editor match counter (\`X of Y\`), case \`Aa\`, whole-word \`\\b\` & Replace All |
| **Writing Flow** | Offline Images | Drag & Drop / \`Ctrl+V\` | Stored in local IndexedDB (\`quill-media://\`) with lightbox zoom |
| **Writing Flow** | Wiki-Links | \`[[Note Title]]\` | Instant bidirectional linking with dynamic backlinks ledger |
| **Writing Flow** | Typewriter Scroll | Feather icon | Keeps active writing line centered on screen |
| **Knowledge Base** | Document Outline | Header Outline / Zen Pill | Hierarchical heading tree (H1–H6) with smooth anchor navigation |
| **Knowledge Base** | 2D Knowledge Graph | Header Network icon | Interactive force-directed canvas with physics, dragging & tag filters |
| **Knowledge Base** | Version Snapshots | Clock icon / \`Ctrl+K\` | Automatic periodic revisions with side-by-side restore |
| **Atmosphere** | Ambient Soundscapes | Headphones icon | 100% client-side Web Audio synthesis: Rain, Vinyl, Clock, Waves, Wind |
| **Atmosphere** | Pomodoro Timer | Headphones dropdown | 25m Focus / 5m Break with gentle 528Hz Tibetan chime transition |
| **Atmosphere** | Zen Focus Desk | \`Ctrl+Shift+F\` / \`Esc\` | Fullscreen paper canvas with drafting grid BG and Edit/Split/Preview switcher |
| **Analytics** | Writing Insights | Bar chart icon | 24-week GitHub contribution heatmap, Flesch readability & vault stats |
| **Sidebar** | Contextual Menu | \`···\` on any note | Touch-optimized menu for Edit, Duplicate, Pin, Export & Delete |

---

## 💡 Pro Tips & Syntax Examples

### Bi-directional Wiki-Links
Jump directly between notes in your notebook by typing double brackets:
Try clicking: [[Market Checklist]] or [[Ideas & Projects]].

### Blueprint Callouts
> [!TIP] Tactile Typography
> Quill uses curated Instrument Sans & monospace fonts paired with blueprint frame corners to evoke the feeling of drafting on architectural linen.

> [!WARNING] Keep Backups
> Because Quill stores everything client-side in your browser, remember to click **Backup All Notes (JSON)** in the sidebar or command palette periodically!

### Tag Organization
Tag your thoughts naturally anywhere in your writing with #guide, #productivity, or #features to filter them instantly in the sidebar and knowledge graph.`,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    isPinned: true,
    tags: ["guide", "features", "productivity"],
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
