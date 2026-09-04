"use client";

import React, { useState, useEffect, useRef } from "react";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { MarkdownPreview } from "@/components/preview/markdown-preview";
import { CommandPalette } from "@/components/command/command-palette";
import { useNotes } from "@/hooks/useNotes";
import { useAutosave } from "@/hooks/useAutosave";
import { countWords, cn } from "@/lib/utils";
import { toggleTaskInMarkdown } from "@/lib/markdown";
import { notesRepository } from "@/lib/storage/notesRepository";
import { activityTracker } from "@/lib/storage/activityTracker";
import { Note } from "@/lib/storage/schema";
import {
  Eye,
  PenLine,
  Columns2,
  Maximize2,
  Command,
  Pin,
  PinOff,
  Star,
  Trash2,
  ListTree,
  History,
  Download,
  FileText,
  Sun,
  Moon,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VersionHistoryDialog } from "@/components/history/version-history-dialog";
import { TemplateDialog } from "@/components/templates/template-dialog";
import { KnowledgeGraphModal } from "@/components/graph/knowledge-graph-modal";
import { TableOfContents } from "@/components/toc/table-of-contents";
import { WritingInsightsModal } from "@/components/analytics/writing-insights-modal";
import { WelcomeModal, SHOW_WELCOME_KEY } from "@/components/welcome/welcome-modal";
import { AppUpdateNotifier } from "@/components/update/app-update-notifier";
import { ErrorBoundary } from "@/components/error-boundary";
import { VerticalSidebar, SidebarPanel } from "@/components/layout/vertical-sidebar";
import { SlidingPanel } from "@/components/layout/sliding-panel";
import { NotesPanel } from "@/components/layout/notes-panel";
import { StatusBar } from "@/components/layout/status-bar";
import { toast } from "sonner";

type ViewMode = "editor" | "split" | "preview";

export default function QuillPage() {
  const {
    notes,
    allRawNotes,
    trashedNotes,
    activeNote,
    activeNoteId,
    backlinks,
    isLoaded,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    allTags,
    selectNote,
    createNote,
    createNoteFromTemplate,
    duplicateNote,
    navigateOrCreateWikiLink,
    updateNote,
    togglePinNote,
    deleteNote,
    restoreFromTrash,
    purgeNote,
    emptyTrash,
    restoreRevision,
    importNotes,
    restoreBackup,
  } = useNotes();

  // Local editor content for immediate keystroke feedback
  const [localContent, setLocalContent] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [zenViewMode, setZenViewMode] = useState<ViewMode>("editor");
  const [writingGoal, setWritingGoal] = useState<number>(0);
  const [hasNotifiedGoal, setHasNotifiedGoal] = useState(false);
  const [activePanel, setActivePanel] = useState<SidebarPanel | null>(null);
  const { resolvedTheme, setTheme } = useTheme();
  const dockOpen = activePanel !== null;

  // New Feature Modals State
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);

  // Hidden file inputs for .md import and JSON restore
  const markdownInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Responsive defaults on mount & check welcome modal startup preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 768) {
        setViewMode("preview");
      } else if (window.innerWidth < 1024) {
        setViewMode("split");
      } else {
        setViewMode("split");
      }

      // Show welcome popup modal by default unless user opted out
      const showPref = localStorage.getItem(SHOW_WELCOME_KEY);
      if (showPref !== "false") {
        setIsWelcomeOpen(true);
      }

      // Set up storage error handler
      notesRepository.setErrorHandler((message) => {
        toast.error(message, { duration: 10000 });
      });
    }
  }, []);

  // Sync local editor content when active note switches
  useEffect(() => {
    if (activeNote) {
      setLocalContent(activeNote.content);
    } else {
      setLocalContent("");
    }
  }, [activeNoteId, activeNote]);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Command Palette: Cmd+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // Zen Mode: Cmd+Shift+F
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      }
      // New Note: Cmd+N
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n" && !e.shiftKey) {
        e.preventDefault();
        createNote();
      }
      // View Modes: Cmd+1/2/3
      if ((e.metaKey || e.ctrlKey) && e.key === "1") {
        e.preventDefault();
        setViewMode("editor");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "2") {
        e.preventDefault();
        setViewMode("split");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "3") {
        e.preventDefault();
        setViewMode("preview");
      }
      // Toggle library dock: Ctrl+B
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setActivePanel((prev) => (prev ? null : "notes"));
      }
      // Escape to close panels/modals
      if (e.key === "Escape") {
        if (isZenMode) {
          setIsZenMode(false);
        } else if (activePanel) {
          setActivePanel(null);
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [activePanel, isZenMode, createNote]);

  // Debounced autosave to repository + periodic revision snapshots + activity tracking
  const { status: saveStatus } = useAutosave(
    localContent,
    (content) => {
      if (activeNote) {
        updateNote(activeNote.id, { content }, true);
        activityTracker.logWords(countWords(content));
      }
    },
    350
  );

  const handleEditorChange = (newContent: string) => {
    setLocalContent(newContent);
  };

  // Close panel after selecting note
  const handleSelectNote = (id: string) => {
    selectNote(id);
    setActivePanel(null);
  };

  // Interactive Checklist: toggle [ ] <-> [x] in preview
  const handleToggleTask = (taskIndex: number) => {
    const updated = toggleTaskInMarkdown(localContent, taskIndex);
    handleEditorChange(updated);
    if (activeNote) {
      updateNote(activeNote.id, { content: updated });
    }
  };

  // Import markdown file(s)
  const handleImportMarkdownFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const importedNotes: Note[] = [];
    let processed = 0;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || "";
        const note = notesRepository.createNoteFromMarkdown(file.name, text);
        importedNotes.push(note);
        processed++;
        if (processed === files.length) {
          importNotes(importedNotes);
          toast.success(
            `Imported ${importedNotes.length} note${importedNotes.length > 1 ? "s" : ""}`
          );
        }
      };
      reader.readAsText(file);
    });

    e.target.value = "";
  };

  // Backup all notes to JSON file
  const handleBackupNotes = () => {
    notesRepository.backupAllNotes(allRawNotes);
    toast.success(`Backup saved (${allRawNotes.length} notes)`);
  };

  // Restore notes from JSON backup file
  const handleRestoreJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || "";
      const result = notesRepository.restoreNotesFromJSON(text);
      if (result.success && result.notes) {
        restoreBackup(result.notes);
        toast.success(`Restored ${result.count} note${result.count > 1 ? "s" : ""} from backup`);
      } else {
        toast.error(result.error || "Failed to restore backup");
      }
    };
    reader.readAsText(file);

    e.target.value = "";
  };

  const wordCount = countWords(localContent);

  // Trigger celebration toast once when session writing goal is reached
  useEffect(() => {
    if (writingGoal > 0 && wordCount >= writingGoal && !hasNotifiedGoal) {
      toast.success(`Writing goal achieved: ${wordCount} / ${writingGoal} words!`);
      setHasNotifiedGoal(true);
    } else if (writingGoal > 0 && wordCount < writingGoal && hasNotifiedGoal) {
      setHasNotifiedGoal(false);
    }
  }, [wordCount, writingGoal, hasNotifiedGoal]);

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
        <div className="flex items-center gap-2 animate-pulse text-muted-foreground font-serif text-lg">
          <span>Loading Quill...</span>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen h-[100dvh] w-screen flex flex-col bg-background text-foreground overflow-hidden">
        {/* Hidden File Inputs for Import & Restore */}
        <input
          type="file"
          ref={markdownInputRef}
          onChange={handleImportMarkdownFiles}
          accept=".md,.markdown,.txt"
          multiple
          className="hidden"
        />
        <input
          type="file"
          ref={jsonInputRef}
          onChange={handleRestoreJSONFile}
          accept=".json"
          className="hidden"
        />

        {/* Main Layout */}
        <div className="flex-1 flex min-h-0">
          {/* Vertical Sidebar */}
          <VerticalSidebar
            activePanel={activePanel}
            onSelectPanel={setActivePanel}
            onNewNote={createNote}
            onSearch={() => setIsCommandPaletteOpen(true)}
            onOpenGraph={() => setIsGraphOpen(true)}
            onOpenInsights={() => setIsInsightsOpen(true)}
            trashCount={trashedNotes.length}
            dockOpen={dockOpen}
          />

          {/* Dockable Library Panel (Notes / Favorites / Trash / Settings) */}
          <SlidingPanel
            isOpen={activePanel !== null}
            onClose={() => setActivePanel(null)}
            title={
              activePanel === "notes"
                ? "Notes"
                : activePanel === "favorites"
                ? "Favorites"
                : activePanel === "trash"
                ? "Trash"
                : activePanel === "settings"
                ? "Settings"
                : ""
            }
          >
            {activePanel === "notes" && (
              <NotesPanel
                notes={notes}
                activeNoteId={activeNoteId}
                onSelectNote={handleSelectNote}
                onCreateNote={createNote}
                onDeleteNote={deleteNote}
                onTogglePin={togglePinNote}
                onDuplicateNote={duplicateNote}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}

            {activePanel === "favorites" && (
              <div className="flex flex-col h-full">
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {notes.filter((n) => n.isPinned).length === 0 ? (
                      <div className="py-12 text-center">
                        <Star className="size-8 text-muted-foreground/25 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">No favorites yet</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          Pin notes to add them here
                        </p>
                      </div>
                    ) : (
                      notes
                        .filter((n) => n.isPinned)
                        .map((note) => (
                          <button
                            key={note.id}
                            onClick={() => handleSelectNote(note.id)}
                            className={cn(
                              "w-full text-left p-2.5 rounded-none transition-colors border",
                              activeNoteId === note.id
                                ? "bg-card border-border shadow-sm"
                                : "border-transparent hover:bg-muted/40 hover:border-border/40"
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <Star className="size-3 text-amber-500 fill-amber-500 shrink-0" />
                              <span className="text-xs font-medium text-foreground truncate">
                                {note.title || "Untitled"}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">
                              {note.content.slice(0, 60) || "Empty"}
                            </p>
                          </button>
                        ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {activePanel === "trash" && (
              <div className="flex flex-col h-full">
                {trashedNotes.length > 0 && (
                  <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/40">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
                      {trashedNotes.length} deleted
                    </span>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={emptyTrash}
                      className="text-[10px] text-destructive hover:text-destructive h-6"
                    >
                      Empty Trash
                    </Button>
                  </div>
                )}
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {trashedNotes.length === 0 ? (
                      <div className="py-12 text-center">
                        <Trash2 className="size-8 text-muted-foreground/25 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Trash is empty</p>
                      </div>
                    ) : (
                      trashedNotes.map((note) => (
                        <div
                          key={note.id}
                          className="p-2.5 rounded-none border border-border/50 bg-muted/20"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-medium text-foreground truncate flex-1">
                              {note.title || "Untitled"}
                            </span>
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              onClick={() => restoreFromTrash(note.id)}
                              className="size-6 text-muted-foreground hover:text-foreground"
                              title="Restore"
                            >
                              <X className="size-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {activePanel === "settings" && (
              <div className="flex flex-col h-full overflow-y-auto">
                <div className="p-3 space-y-3">
                  <div className="border border-border/50 p-3 rounded-none bg-muted/20">
                    <h4 className="text-xs font-semibold text-foreground mb-2">Writing Goal</h4>
                    <div className="flex flex-wrap gap-1">
                      {[0, 250, 500, 1000].map((goal) => (
                        <Button
                          key={goal}
                          size="xs"
                          variant={writingGoal === goal ? "default" : "outline"}
                          onClick={() => {
                            setWritingGoal(goal);
                            if (goal > 0) {
                              toast.info(`Session writing goal: ${goal} words`);
                            }
                          }}
                          className="text-[10px] h-6 px-2"
                        >
                          {goal === 0 ? "None" : goal}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="border border-border/50 p-3 rounded-none bg-muted/20">
                    <h4 className="text-xs font-semibold text-foreground mb-2">Data</h4>
                    <div className="flex flex-col gap-1">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={handleBackupNotes}
                        className="text-[10px] h-7 justify-start"
                      >
                        <FileText className="size-3 mr-1.5" />
                        Export All Notes
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => jsonInputRef.current?.click()}
                        className="text-[10px] h-7 justify-start"
                      >
                        <FileText className="size-3 mr-1.5" />
                        Import Backup
                      </Button>
                    </div>
                  </div>

                  <div className="border border-border/50 p-3 rounded-none bg-muted/20">
                    <h4 className="text-xs font-semibold text-foreground mb-2">About</h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Quill v1.5.0 — Offline-first markdown notes
                    </p>
                  </div>
                </div>
              </div>
            )}
          </SlidingPanel>

          
          
          
          
          
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Bar */}
            <div className="h-11 px-3 border-b border-border/50 flex items-center justify-between gap-3 shrink-0 bg-background/60">
              {/* Left: note title + pin */}
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {activeNote && (
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => togglePinNote(activeNote.id)}
                    className={cn(
                      "size-7 shrink-0",
                      activeNote.isPinned
                        ? "text-amber-500 hover:text-amber-400"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-label={activeNote.isPinned ? "Unpin note" : "Pin note"}
                    aria-pressed={activeNote.isPinned}
                    title={activeNote.isPinned ? "Unpin note" : "Pin note"}
                  >
                    {activeNote.isPinned ? (
                      <Pin className="size-3.5 fill-current" />
                    ) : (
                      <PinOff className="size-3.5" />
                    )}
                  </Button>
                )}
                <span
                  className="text-sm font-medium text-foreground truncate"
                  title={activeNote?.title}
                >
                  {activeNote?.title || "Untitled"}
                </span>
              </div>

              {/* Center: view mode switcher */}
              <div className="flex items-center bg-muted/40 border border-border/50 p-0.5 shrink-0">
                <Button
                  size="xs"
                  variant={viewMode === "editor" ? "secondary" : "ghost"}
                  onClick={() => setViewMode("editor")}
                  className="h-6 px-2 text-[11px] gap-1"
                  title="Editor (Ctrl+1)"
                >
                  <PenLine className="size-3" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
                <Button
                  size="xs"
                  variant={viewMode === "split" ? "secondary" : "ghost"}
                  onClick={() => setViewMode("split")}
                  className="hidden sm:inline-flex h-6 px-2 text-[11px] gap-1"
                  title="Split (Ctrl+2)"
                >
                  <Columns2 className="size-3" />
                  <span>Split</span>
                </Button>
                <Button
                  size="xs"
                  variant={viewMode === "preview" ? "secondary" : "ghost"}
                  onClick={() => setViewMode("preview")}
                  className="h-6 px-2 text-[11px] gap-1"
                  title="Preview (Ctrl+3)"
                >
                  <Eye className="size-3" />
                  <span className="hidden sm:inline">Preview</span>
                </Button>
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-0.5 shrink-0">
                {/* Command palette */}
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="h-7 px-2 text-[11px] gap-1.5 text-muted-foreground hover:text-foreground"
                  title="Command palette (Ctrl+K)"
                >
                  <Command className="size-3.5" />
                  <span className="hidden sm:inline">Commands</span>
                  <kbd className="hidden xl:inline-block font-mono text-[9px] px-1 py-0.5 rounded-xs bg-muted border border-border/60 text-muted-foreground">
                    ⌘K
                  </kbd>
                </Button>

                {/* Document outline */}
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => setIsTocOpen(true)}
                  className="size-7 text-muted-foreground hover:text-foreground"
                  aria-label="Document outline"
                  title="Document outline"
                >
                  <ListTree className="size-3.5" />
                </Button>

                {/* Version history */}
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => setIsHistoryOpen(true)}
                  className="size-7 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
                  aria-label="Version history"
                  title="Version history"
                >
                  <History className="size-3.5" />
                </Button>

                {/* Export markdown */}
                {activeNote && (
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => {
                      notesRepository.exportNote(activeNote);
                      toast.success(`Exported "${activeNote.title || "Untitled"}.md"`);
                    }}
                    className="size-7 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
                    aria-label="Export note as Markdown"
                    title="Export as .md"
                  >
                    <Download className="size-3.5" />
                  </Button>
                )}

                {/* Zen mode */}
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => setIsZenMode(true)}
                  className="size-7 text-muted-foreground hover:text-foreground"
                  aria-label="Focus mode"
                  title="Focus mode (Ctrl+Shift+F)"
                >
                  <Maximize2 className="size-3.5" />
                </Button>

                <div className="w-px h-4 bg-border/60 mx-0.5" />

                {/* Theme toggle */}
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="relative size-7 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle theme"
                  title={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                >
                  <Sun className="size-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute size-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
              </div>
            </div>

            {/* Editor/Preview Content */}
            <div className="flex-1 flex min-h-0">
              {isZenMode ? (
                /* Zen Mode - Centered Focus */
                <div className="flex-1 flex flex-col h-full bg-drafting-grid relative overflow-hidden">
                  <div className="flex-1 flex items-center justify-center p-4 sm:p-8 h-full min-h-0 overflow-hidden">
                    <div className="w-full max-w-3xl h-full bg-card border border-border/80 shadow-2xl relative flex flex-col overflow-hidden">
                      {zenViewMode === "editor" && (
                        <MarkdownEditor
                          content={localContent}
                          onChange={handleEditorChange}
                          borderRight={false}
                        />
                      )}
                      {zenViewMode === "preview" && (
                        <div className="flex-1 h-full min-h-0 overflow-y-auto">
                          <MarkdownPreview
                            content={localContent}
                            onToggleTask={handleToggleTask}
                            onNavigateWikiLink={navigateOrCreateWikiLink}
                            backlinks={backlinks}
                          />
                        </div>
                      )}
                      {zenViewMode === "split" && (
                        <div className="flex-1 flex h-full min-w-0 divide-x divide-border/70">
                          <div className="flex-1 h-full min-w-0 flex flex-col">
                            <MarkdownEditor
                              content={localContent}
                              onChange={handleEditorChange}
                              borderRight={false}
                            />
                          </div>
                          <div className="flex-1 h-full min-w-0 overflow-y-auto">
                            <MarkdownPreview
                              content={localContent}
                              onToggleTask={handleToggleTask}
                              onNavigateWikiLink={navigateOrCreateWikiLink}
                              backlinks={backlinks}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Zen Mode Bottom Bar */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-card/95 border border-border/80 shadow-lg px-3 py-1.5 text-xs">
                    <span className="font-medium text-foreground truncate max-w-[200px]">
                      {activeNote?.title || "Untitled"}
                    </span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="font-mono text-muted-foreground text-[10px]">
                      {wordCount} words
                    </span>
                    <div className="flex items-center border border-border/50 p-0.5 bg-muted/40 ml-2">
                      <Button
                        size="xs"
                        variant={zenViewMode === "editor" ? "default" : "ghost"}
                        onClick={() => setZenViewMode("editor")}
                        className="h-5 px-1.5 text-[10px]"
                      >
                        <PenLine className="size-2.5" />
                      </Button>
                      <Button
                        size="xs"
                        variant={zenViewMode === "split" ? "default" : "ghost"}
                        onClick={() => setZenViewMode("split")}
                        className="h-5 px-1.5 text-[10px]"
                      >
                        <Columns2 className="size-2.5" />
                      </Button>
                      <Button
                        size="xs"
                        variant={zenViewMode === "preview" ? "default" : "ghost"}
                        onClick={() => setZenViewMode("preview")}
                        className="h-5 px-1.5 text-[10px]"
                      >
                        <Eye className="size-2.5" />
                      </Button>
                    </div>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setIsZenMode(false)}
                      className="h-5 px-2 text-[10px] border-border/50 ml-1"
                    >
                      Exit
                    </Button>
                  </div>
                </div>
              ) : (
                /* Normal Mode - Editor/Preview Panes */
                <>
                  {/* Editor Pane */}
                  <div
                    className={cn(
                      "h-full min-w-0 flex flex-col",
                      viewMode === "editor"
                        ? "flex-1"
                        : viewMode === "split"
                        ? "flex-1 border-r border-border/70"
                        : "hidden"
                    )}
                  >
                    {viewMode === "editor" ? (
                      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-background">
                        <div className="w-full max-w-3xl h-full">
                          <MarkdownEditor
                            content={localContent}
                            onChange={handleEditorChange}
                            borderRight={false}
                          />
                        </div>
                      </div>
                    ) : (
                      <MarkdownEditor
                        content={localContent}
                        onChange={handleEditorChange}
                      />
                    )}
                  </div>

                  {/* Preview Pane */}
                  <div
                    className={cn(
                      "h-full min-w-0 overflow-y-auto",
                      viewMode === "preview"
                        ? "flex-1"
                        : viewMode === "split"
                        ? "flex-1"
                        : "hidden"
                    )}
                  >
                    <MarkdownPreview
                      content={localContent}
                      onToggleTask={handleToggleTask}
                      onNavigateWikiLink={navigateOrCreateWikiLink}
                      backlinks={backlinks}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <StatusBar
          saveStatus={saveStatus}
          wordCount={wordCount}
          activeNoteTitle={activeNote?.title}
          tags={activeNote?.tags}
        />

        {/* Command Palette (Cmd+K / Ctrl+K) */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          notes={allRawNotes}
          activeNote={activeNote}
          onSelectNote={selectNote}
          onCreateNote={createNote}
          onTogglePin={togglePinNote}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onPrintNote={() => window.print()}
          onOpenTemplates={() => setIsTemplateOpen(true)}
          onToggleZen={() => setIsZenMode((prev) => !prev)}
          onDuplicateActiveNote={() => {
            if (activeNote) {
              duplicateNote(activeNote.id);
              toast.success("Note duplicated");
            }
          }}
          onExportNote={() => {
            if (activeNote) {
              notesRepository.exportNote(activeNote);
              toast.success(`Exported "${activeNote.title || "Untitled"}.md"`);
            }
          }}
          onImportMarkdown={() => markdownInputRef.current?.click()}
          onBackupNotes={handleBackupNotes}
          onRestoreBackup={() => jsonInputRef.current?.click()}
          onOpenGraph={() => setIsGraphOpen(true)}
          onOpenToc={() => setIsTocOpen(true)}
          onOpenInsights={() => setIsInsightsOpen(true)}
          onOpenWelcome={() => setIsWelcomeOpen(true)}
        />

        {/* Version History Dialog */}
        <VersionHistoryDialog
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          activeNote={activeNote}
          onRestoreRevision={(noteId, content) => {
            restoreRevision(noteId, content);
            setLocalContent(content);
            toast.success("Snapshot restored successfully");
          }}
        />

        {/* Note Template Dialog */}
        <TemplateDialog
          isOpen={isTemplateOpen}
          onClose={() => setIsTemplateOpen(false)}
          onSelectTemplate={(tmpl) => {
            createNoteFromTemplate(tmpl);
            toast.success(`Created note from "${tmpl.title}" template`);
          }}
        />

        {/* Interactive Knowledge Graph View Modal */}
        <KnowledgeGraphModal
          isOpen={isGraphOpen}
          onClose={() => setIsGraphOpen(false)}
          notes={allRawNotes}
          activeNoteId={activeNoteId}
          onSelectNote={selectNote}
        />

        {/* Document Outline / Table of Contents Drawer */}
        <TableOfContents
          isOpen={isTocOpen}
          onClose={() => setIsTocOpen(false)}
          content={localContent}
        />

        {/* Writing Insights & Heatmap Modal */}
        <WritingInsightsModal
          isOpen={isInsightsOpen}
          onClose={() => setIsInsightsOpen(false)}
          activeNote={activeNote}
          notes={allRawNotes}
        />

        {/* Welcome Popup Modal with Logo & Feature Launchpad */}
        <WelcomeModal
          isOpen={isWelcomeOpen}
          onClose={() => setIsWelcomeOpen(false)}
          onStartWriting={() => {
            setIsWelcomeOpen(false);
            if (typeof window !== "undefined" && window.innerWidth < 768) {
              setViewMode("editor");
            }
          }}
          onOpenTemplates={() => {
            setIsWelcomeOpen(false);
            setIsTemplateOpen(true);
          }}
          onOpenGuideNote={() => {
            setIsWelcomeOpen(false);
            const welcomeNote = allRawNotes.find((n) => n.id === "welcome-note");
            if (welcomeNote) {
              selectNote(welcomeNote.id);
            }
          }}
        />

        {/* In-App Update Notifier (Only active in native mobile app) */}
        <AppUpdateNotifier />
      </div>
    </ErrorBoundary>
  );
}
