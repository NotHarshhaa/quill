# Quill 🪶

A fast, offline-first notes app with a split editor and live-rendered markdown preview. Built with a small hand-written markdown parser — no remote dependencies, no accounts, everything lives in your browser.

Warm paper aesthetic. Type on the left, watch it render on the right.

## Features

- **Split editor + live preview** — type markdown, see it rendered instantly, side by side
- **Hand-written markdown parser** — headings, bold, italic, lists (ordered/unordered), inline code + code blocks, blockquotes
- **Offline-first** — all notes persist to `localStorage`, no network calls, works with no connection
- **Autosave** — debounced save-as-you-type, no save button needed
- **Notes sidebar** — create, switch between, rename, and delete notes
- **Warm paper aesthetic** — cream/parchment palette, soft shadows, serif touches for a physical-notebook feel

## Tech Stack

- **React 18 + TypeScript** — component structure and type safety
- **Vite** — dev server / bundler
- **shadcn/ui** — accessible unstyled primitives (Button, Input, ScrollArea, Dialog, DropdownMenu, Separator, Tooltip, Sonner/Toast) themed to the paper palette
- **Tailwind CSS** — styling, driven by shadcn's CSS variable theming
- **lucide-react** — icons (already a shadcn dependency)
- **localStorage** — persistence layer, wrapped behind a small storage service so it can be swapped later (e.g. IndexedDB) without touching components

No markdown library, no state-management library — parser and state are hand-rolled to keep the app small and dependency-light.

## Getting Started

```bash
# create the app
npm create vite@latest quill -- --template react-ts
cd quill

# tailwind + shadcn
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npx shadcn@latest init

# add the shadcn components used by the app
npx shadcn@latest add button input scroll-area dialog dropdown-menu separator tooltip sonner

# run
npm run dev
```

## Project Structure

```
quill/
├── public/
│   └── favicon.svg
│
├── src/
│   ├── main.tsx                     # app entry
│   ├── App.tsx                      # top-level layout: Sidebar + Editor + Preview
│   ├── index.css                    # tailwind base + paper theme CSS variables
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn-generated primitives (button, input, dialog, ...)
│   │   │
│   │   ├── layout/
│   │   │   ├── AppShell.tsx         # overall grid: sidebar | editor | preview
│   │   │   └── PaperSurface.tsx     # reusable "paper card" wrapper (shadow, texture, edges)
│   │   │
│   │   ├── sidebar/
│   │   │   ├── NotesSidebar.tsx     # scrollable list, uses ScrollArea
│   │   │   ├── NoteListItem.tsx     # title, preview snippet, active state
│   │   │   ├── NewNoteButton.tsx
│   │   │   └── DeleteNoteDialog.tsx # confirm-delete, uses shadcn Dialog
│   │   │
│   │   ├── editor/
│   │   │   ├── MarkdownEditor.tsx   # textarea, controlled, emits onChange
│   │   │   └── EditorToolbar.tsx    # optional: bold/italic/list quick-insert buttons
│   │   │
│   │   └── preview/
│   │       ├── MarkdownPreview.tsx  # renders parsed AST to JSX
│   │       └── preview-elements.tsx # styled mappings: h1-h3, p, ul/ol, blockquote, code
│   │
│   ├── lib/
│   │   ├── markdown/
│   │   │   ├── tokenizer.ts         # splits raw text into block-level tokens
│   │   │   ├── parser.ts            # tokens -> small AST (headings, lists, quotes, code, paragraphs)
│   │   │   ├── inline.ts            # inline pass: **bold**, *italic*, `code`
│   │   │   ├── types.ts             # AST node types
│   │   │   └── index.ts             # public parse(markdown: string): AstNode[]
│   │   │
│   │   ├── storage/
│   │   │   ├── notesRepository.ts   # get/save/delete notes in localStorage
│   │   │   └── schema.ts            # Note type, storage key, versioning
│   │   │
│   │   └── utils.ts                 # cn() helper (shadcn convention), debounce, id generation
│   │
│   ├── hooks/
│   │   ├── useNotes.ts              # CRUD + active-note state, backed by notesRepository
│   │   ├── useAutosave.ts           # debounced save-on-change
│   │   └── useMarkdownPreview.ts    # memoized parse(content) -> AST
│   │
│   └── types/
│       └── note.ts                  # { id, title, content, createdAt, updatedAt }
│
├── index.html
├── tailwind.config.ts               # paper color tokens (cream, ink, sepia accents)
├── components.json                  # shadcn config
├── tsconfig.json
├── vite.config.ts
├── package.json
└── README.md
```

## Architecture Notes

**Markdown parsing** — `tokenizer.ts` splits input into block-level chunks (lines/blank-line groups), `parser.ts` turns those into a small AST (`Heading`, `Paragraph`, `List`, `ListItem`, `Blockquote`, `CodeBlock`), and `inline.ts` does a second pass over text nodes for `**bold**`, `*italic*`, and `` `code` ``. `MarkdownPreview.tsx` walks the AST and renders JSX directly — no `dangerouslySetInnerHTML`.

**State flow** — `useNotes` is the single source of truth for the notes list and active note, backed by `notesRepository` (a thin wrapper over `localStorage.getItem`/`setItem` with JSON serialization). `useAutosave` debounces writes (e.g. 400ms after the user stops typing) so every keystroke doesn't hit storage. `useMarkdownPreview` memoizes the parse so the preview only re-parses when content actually changes.

**Styling** — shadcn's CSS variables (`--background`, `--foreground`, `--border`, etc. in `index.css`) are remapped to a warm paper palette (cream `#f7f1e3`-ish background, warm ink text, soft sepia borders/shadows) rather than the default neutral theme, so every shadcn primitive inherits the aesthetic automatically.

**Offline guarantee** — no fetch calls anywhere in the app; the only I/O is `localStorage`. This also means the app works as a PWA with minimal extra config if you want installability later.

## Possible Next Steps

- Export note as `.md` file (download)
- Keyboard shortcuts (Cmd+B / Cmd+I to wrap selection)
- Search across notes
- IndexedDB backend behind the same `notesRepository` interface for larger note collections
