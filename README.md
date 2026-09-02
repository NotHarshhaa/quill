# Quill 🪶

A fast, offline-first notes app with a split editor and live-rendered markdown preview. Built with a small hand-written markdown parser — no remote dependencies, no accounts, everything lives in your browser.

Warm paper aesthetic. Type on the left, watch it render on the right.

---

## Features

- **Split editor + live preview** — type markdown, see it rendered instantly, side by side
- **Hand-written markdown parser** — headings, bold, italic, lists (ordered/unordered), inline code + code blocks, blockquotes
- **Offline-first** — all notes persist to `localStorage`, no network calls, works with no connection
- **Autosave** — debounced save-as-you-type, no save button needed
- **Notes sidebar** — create, switch between, rename, and delete notes
- **Warm paper aesthetic** — cream/parchment palette, soft shadows, serif touches for a physical-notebook feel

---

## Architecture Notes

**Markdown parsing** — `tokenizer.ts` splits input into block-level chunks (lines/blank-line groups), `parser.ts` turns those into a small AST (`Heading`, `Paragraph`, `List`, `ListItem`, `Blockquote`, `CodeBlock`), and `inline.ts` does a second pass over text nodes for `**bold**`, `*italic*`, and `` `code` ``. `MarkdownPreview.tsx` walks the AST and renders JSX directly — no `dangerouslySetInnerHTML`.

**State flow** — `useNotes` is the single source of truth for the notes list and active note, backed by `notesRepository` (a thin wrapper over `localStorage.getItem`/`setItem` with JSON serialization). `useAutosave` debounces writes (e.g. 400ms after the user stops typing) so every keystroke doesn't hit storage. `useMarkdownPreview` memoizes the parse so the preview only re-parses when content actually changes.

**Styling** — shadcn's CSS variables (`--background`, `--foreground`, `--border`, etc. in `index.css`) are remapped to a warm paper palette (cream `#f7f1e3`-ish background, warm ink text, soft sepia borders/shadows) rather than the default neutral theme, so every shadcn primitive inherits the aesthetic automatically.

**Offline guarantee** — no fetch calls anywhere in the app; the only I/O is `localStorage`. This also means the app works as a PWA with minimal extra config if you want installability later.

---

## Possible Next Steps

- Export note as `.md` file (download)
- Keyboard shortcuts (Cmd+B / Cmd+I to wrap selection)
- Search across notes
- IndexedDB backend behind the same `notesRepository` interface for larger note collections
