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
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  ListTree,
  History,
  Download,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { VersionHistoryDialog } from "@/components/history/version-history-dialog";
import { TemplateDialog } from "@/components/templates/template-dialog";
import { KnowledgeGraphModal } from "@/components/graph/knowledge-graph-modal";
import { TableOfContents } from "@/components/toc/table-of-contents";
import { WritingInsightsModal } from "@/components/analytics/writing-insights-modal";
import { WelcomeModal, SHOW_WELCOME_KEY } from "@/components/welcome/welcome-modal";
import { AppUpdateNotifier } from "@/components/update/app-update-notifier";
import { ErrorBoundary } from "@/components/error-boundary";
import { AppSidebar, SidebarPanel } from "@/components/layout/app-sidebar";
import { StatusBar } from "@/components/layout/status-bar";
import { Corners } from "@/components/frame";
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
  const [activePanel, setActivePanel] = useState<SidebarPanel>("all");
  const [sideVisible, setSideVisible] = useState(true);
  const { resolvedTheme, setTheme } = useTheme();

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
        setSideVisible(false);
      } else if (window.innerWidth < 1024) {
        setViewMode("split");
        setSideVisible(true);
      } else {
        setViewMode("split");
        setSideVisible(true);
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
      // Toggle sidebar visibility: Ctrl+B (skipped while typing so Ctrl+B stays "bold" in the editor)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        const target = e.target as HTMLElement | null;
        const isTyping =
          !!target &&
          (target.isContentEditable ||
            ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
        if (isTyping) return;
        e.preventDefault();
        setSideVisible((prev) => !prev);
      }
      // Escape to close mobile sidebar drawer / exit zen mode
      if (e.key === "Escape") {
        if (isZenMode) {
          setIsZenMode(false);
        } else if (
          sideVisible &&
          typeof window !== "undefined" &&
          window.matchMedia("(max-width: 767px)").matches
        ) {
          setSideVisible(false);
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isZenMode, sideVisible, createNote]);

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

  // Select note; on mobile also close the sidebar drawer
  const handleSelectNote = (id: string) => {
    selectNote(id);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setSideVisible(false);
    }
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
          {/* Unified Library Sidebar (All / Favorites / Trash / Settings) */}
          <AppSidebar
            open={sideVisible}
            onClose={() => setSideVisible(false)}
            activePanel={activePanel}
            onSelectPanel={setActivePanel}
            notes={notes}
            trashedNotes={trashedNotes}
            activeNoteId={activeNoteId}
            onSelectNote={handleSelectNote}
            onCreateNote={createNote}
            onDeleteNote={deleteNote}
            onTogglePin={togglePinNote}
            onDuplicateNote={duplicateNote}
            onRestoreNote={restoreFromTrash}
            onEmptyTrash={emptyTrash}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenGraph={() => setIsGraphOpen(true)}
            onOpenInsights={() => setIsInsightsOpen(true)}
            writingGoal={writingGoal}
            onWritingGoalChange={(goal) => {
              setWritingGoal(goal);
              if (goal > 0) {
                toast.info(`Session writing goal: ${goal} words`);
              }
            }}
            onExportAll={handleBackupNotes}
            onImportBackup={() => jsonInputRef.current?.click()}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Bar */}
            <div className="h-11 px-3 border-b border-border/50 flex items-center justify-between gap-3 shrink-0 bg-background/60">
              {/* Left: sidebar toggle + note title + pin */}
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => setSideVisible((prev) => !prev)}
                  className="size-7 text-muted-foreground hover:text-foreground shrink-0"
                  aria-label={sideVisible ? "Hide sidebar" : "Show sidebar"}
                  title={sideVisible ? "Hide sidebar (Ctrl+B)" : "Show sidebar (Ctrl+B)"}
                >
                  {sideVisible ? (
                    <PanelLeftClose className="size-3.5" />
                  ) : (
                    <PanelLeftOpen className="size-3.5" />
                  )}
                </Button>
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
              <div className="relative flex items-center bg-muted/40 border border-border/50 p-0.5 shrink-0">
                <Corners size="sm" weight="thin" light />
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
                  className="size-7 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
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
                  className="size-7 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
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
