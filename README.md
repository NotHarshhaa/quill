# Quill 🪶

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg?style=flat-square)](./LICENSE)
[![Offline First](https://img.shields.io/badge/Storage-100%25%20Offline%20First-success?style=flat-square)](#offline-first--privacy)

> A fast, elegant, offline-first Markdown notebook featuring a split editor, live-rendered preview, interactive checklists, and a tactile warm paper aesthetic.

Built with a custom zero-dependency Markdown parser—no external markdown libraries, no remote servers, no account registration. Everything stays in your browser.

---

## ✨ Features

- 📝 **Split Editor & Real-Time Preview**  
  Type Markdown on the left and see it rendered immediately on the right. Responsive layout adapts between **Write**, **Split**, and **Preview** modes across mobile, tablet, and desktop screens.

- ⚡ **Interactive Checklists (`- [ ]` / `- [x]`)**  
  Click checkboxes directly in the preview pane to toggle task state live in your raw Markdown content without desynchronizing cursor position or document state.

- 🔍 **Command Palette (`Cmd + K` / `Ctrl + K`)**  
  Instantly switch notes, search by title or full content, create new notes, toggle pins, export documents, or switch themes using keyboard navigation.

- 📌 **Pinned Notes & Dynamic Hashtags**  
  Anchor essential notes to the top of your list. Type `#tags` anywhere in your text, and Quill will automatically index them into clickable filter badges in the sidebar.

- 💾 **Debounced Autosave (350ms)**  
  Edits persist as you type with intelligent keystroke debouncing. Includes live status badges (`AUTOSAVED` / `SAVING...`) and live word count.

- 📂 **Full Data Ownership & Portability**  
  - **Export Note**: Download any active note as a clean `.md` file.
  - **Bulk Import**: Drag or select multiple `.md`, `.markdown`, or `.txt` files with automatic title derivation and tag extraction.
  - **Full Backup & Restore**: Export complete JSON snapshots and restore them with schema validation at any time.

- 🧘 **Zen / Distraction-Free Focus Mode (`Ctrl+Shift+F` / `⌘Shift+F`)**  
  Immersive writing canvas that eliminates headers, sidebars, and toolbars for distraction-free writing, complete with a floating status pill and `<Esc>` quick exit.

- 📜 **Typewriter Scrolling Mode**  
  Keep your cursor vertically centered on the screen while typing so your gaze never drops to the bottom of the display.

- 🎯 **Session Writing Goals & Reading Time**  
  Set target session word counts (250, 500, 1000 words) with real-time percentage progress and estimated reading time (`~X min read`).

- 🔗 **Bi-Directional Wiki-Links (`[[Note Title]]` or `[[Title|Label]]`)**  
  Link your notes into a personal knowledge web. Click any wiki-link in the preview to jump directly to that note (or auto-create it if it doesn't exist yet).

- 🌐 **Backlinks & Linked Mentions**  
  Every note automatically indexes and displays incoming references at the bottom of the preview pane with one-click navigation chips.

- 📋 **Curated Starter Templates**  
  Spin up structured notes in seconds with built-in templates for **Meeting Notes**, **Daily Journal**, **Project Blueprints**, and **Weekly Reviews**.

- 📑 **1-Click Note Duplication**  
  Clone any note, its tags, and markdown content instantly from the sidebar or Command Palette.

- 📊 **Markdown Tables with Alignment (`| col1 | col2 |`)**  
  Render ledger-style data tables with left, center, or right column alignments (`:---`, `:---:`, `---:`) and blueprint corner accents.

- 💡 **Callout & Alert Blocks (`> [!NOTE]`, `> [!TIP]`, etc.)**  
  GitHub-style colored callout cards with icons for `NOTE`, `TIP`, `WARNING`, `IMPORTANT`, and `CAUTION`.

- 🗑️ **Soft Delete & Trash Can**  
  Deleted notes are protected in a dedicated Trash view. Restore them anytime with 1 click or permanently purge when you're sure.

- ⏳ **Local Version History & Snapshots**  
  Automatic periodic snapshot timeline for every note. Inspect past revisions side-by-side with live preview and restore any snapshot in one click.

- 🖨️ **Print & PDF Export**  
  One-click print button formatted with an optimized `@media print` paper stylesheet—headers, toolbars, and editor panes are stripped cleanly for crisp PDF exports.

- 📱 **Installable Offline PWA**  
  Includes a web app manifest with standalone display configuration so you can install Quill to your desktop or mobile home screen.

- 🎨 **Warm Paper & Blueprint Aesthetic**  
  Crafted parchment palette (`#f7f1e3`-inspired cream tones), subtle sepia borders, serif typographic details, and blueprint-style corner brackets (`Corners`, `Frame`). Full support for **Light**, **Dark**, and **System** themes.

- 🛡️ **Zero-Dependency Markdown Engine**  
  Custom block tokenizer and inline parser turn raw text into a safe Abstract Syntax Tree (AST), rendered natively via React JSX—completely avoiding `dangerouslySetInnerHTML`.

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.18 or higher; 20+ recommended)
- `npm`, `pnpm`, or `yarn`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/NotHarshhaa/quill.git
   cd quill
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**  
   Navigate to [http://localhost:3000](http://localhost:3000) to begin writing.

### Production Build

```bash
# Build optimized production assets
npm run build

# Start the production server
npm run start
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Scope | Action |
|---|---|---|
| <kbd>Cmd</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> | Global | Open Command Palette / Quick switcher |
| <kbd>Cmd</kbd> / <kbd>Ctrl</kbd> + <kbd>B</kbd> | Editor | Wrap selected text in `**bold**` |
| <kbd>Cmd</kbd> / <kbd>Ctrl</kbd> + <kbd>I</kbd> | Editor | Wrap selected text in `*italic*` |
| <kbd>Tab</kbd> | Editor | Insert 2-space indentation |
| <kbd>Esc</kbd> | Dialogs | Close Command Palette / Dialogs |

---

## 📐 Markdown Syntax Support

Quill's hand-written parser translates standard Markdown directly into React components:

| Syntax Element | Markdown Input Example | Rendered Result |
|---|---|---|
| **Headings** | `# H1`, `## H2`, `### H3` ... `###### H6` | Semantic header elements with anchor styling |
| **Bold** | `**bold**` or `__bold__` | **Bold text** |
| **Italic** | `*italic*` or `_italic_` | *Italic text* |
| **Strikethrough** | `~~strikethrough~~` | ~~Strikethrough text~~ |
| **Inline Code** | `` `code` `` | Monospace code chip |
| **Code Blocks** | ```` ```ts \n console.log("hi"); \n ``` ```` | Syntax-styled code container with language tag |
| **Blockquotes** | `> Inspiring quote` | Indented callout with accent bar |
| **Callout Alerts** | `> [!NOTE] Offline First` | Themed alert container with icon and blueprint corner ticks |
| **Tables** | `| A | B |\n| :--- | :---: |\n| 1 | 2 |` | Ledger-style data table with column alignments |
| **Unordered Lists** | `- item` or `* item` or `+ item` | Bullet list |
| **Ordered Lists** | `1. first`, `2. second` | Numbered list |
| **Checklists** | `- [ ] todo` / `- [x] done` | **Interactive, clickable checkbox** |
| **Links** | `[Quill](https://example.com)` | Hyperlink (`target="_blank"`) |
| **Thematic Break** | `---`, `***`, `___` | Divider rule |

---

## 🏗️ Architecture & Technical Design

### 1. Zero-Dependency Markdown Pipeline
1. **Block Tokenization & Parsing (`parser.ts`)**: Input lines are parsed into a block-level Abstract Syntax Tree (`Heading`, `Paragraph`, `List`, `ListItem`, `Blockquote`, `CodeBlock`, `ThematicBreak`).
2. **Inline Lexing (`inline.ts`)**: Text nodes undergo inline tokenization to parse bold, italics, strikethrough, inline code, and links.
3. **Safe JSX Rendering (`markdown-preview.tsx`)**: The AST nodes are transformed directly into standard React DOM elements. No HTML stringification or `dangerouslySetInnerHTML` is used, ensuring complete immunity against cross-site scripting (XSS).
4. **Two-Way Checklist Synchronization (`toggleTaskInMarkdown`)**: When a preview checkbox is toggled, its ordinal position maps back to the raw source text to toggle `[ ]` ↔ `[x]`, updating both state and editor cleanly.

### 2. State & Storage Flow
- **Single Source of Truth**: [`useNotes.ts`](file:///f:/devops/quill/src/hooks/useNotes.ts) manages the active note, filtering, pin toggling, and note mutations.
- **Debounced Autosave**: Keystrokes update local editor state immediately for zero typing latency. [`useAutosave.ts`](file:///f:/devops/quill/src/hooks/useAutosave.ts) flushes content to [`notesRepository`](file:///f:/devops/quill/src/lib/storage/notesRepository.ts) 350ms after the user stops typing.
- **Offline Persistence**: All data is stored in `localStorage` under `quill_notes_data_v1`. No network queries or background analytics are executed.

---

## 🔒 Offline-First & Privacy Guarantee

- **100% Client-Side**: No user data leaves your browser.
- **Zero Tracking**: No Google Analytics, telemetry, cookies, or third-party trackers.
- **Reliable Offline Access**: Works seamlessly without an active internet connection.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom CSS custom properties
- **Components & Icons**: [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
- **Theming**: [next-themes](https://github.com/pacocoursey/next-themes)
- **Toasts**: [Sonner](https://sonner.emilkowal.ski/)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
