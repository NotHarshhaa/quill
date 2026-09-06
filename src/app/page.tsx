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
  Printer,
  Headphones,
  LayoutTemplate,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AmbientSoundPlayer } from "@/components/audio/ambient-sound-player";
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
            onOpenTemplates={() => setIsTemplateOpen(true)}
            onDeleteNote={deleteNote}
            onTogglePin={togglePinNote}
            onDuplicateNote={(id) => {
              duplicateNote(id);
              toast.success("Note duplicated");
            }}
            onRestoreNote={restoreFromTrash}
            onPurgeNote={purgeNote}
            onEmptyTrash={emptyTrash}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
            allTags={allTags}
            onOpenGraph={() => setIsGraphOpen(true)}
            onOpenInsights={() => setIsInsightsOpen(true)}
            onOpenWelcome={() => setIsWelcomeOpen(true)}
            writingGoal={writingGoal}
            onWritingGoalChange={(goal) => {
              setWritingGoal(goal);
              if (goal > 0) {
                toast.info(`Session writing goal: ${goal} words`);
              } else {
                toast.info("Session writing goal cleared");
              }
            }}
            onExportAll={handleBackupNotes}
            onImportBackup={() => jsonInputRef.current?.click()}
            onImportMarkdown={() => markdownInputRef.current?.click()}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Bar (Unified h-12 height matching sidebar, balanced 3-zone layout) */}
            <div className="h-12 px-3 border-b border-border/80 flex items-center justify-between gap-3 shrink-0 bg-background/80 backdrop-blur-xs select-none">
              {/* Zone 1: Left (Sidebar toggle, Note title, Pin, Wordcount) */}
              <div className="flex items-center gap-2 min-w-0 flex-1 basis-0 justify-start">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => setSideVisible((prev) => !prev)}
                      className="relative size-7.5 rounded-none border border-border/70 bg-card/40 hover:bg-muted/50 hover:border-border text-muted-foreground hover:text-foreground shrink-0 group transition-all"
                      aria-label={sideVisible ? "Hide sidebar" : "Show sidebar"}
                    >
                      <Corners size="sm" weight="thin" light className="opacity-30 group-hover:opacity-100 transition-opacity" />
                      {sideVisible ? (
                        <PanelLeftClose className="size-3.5" />
                      ) : (
                        <PanelLeftOpen className="size-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-sans text-xs">
                    {sideVisible ? "Hide Library (Ctrl+B)" : "Show Library (Ctrl+B)"}
                  </TooltipContent>
                </Tooltip>

                {activeNote && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => togglePinNote(activeNote.id)}
                        className={cn(
                          "size-7 rounded-none shrink-0",
                          activeNote.isPinned
                            ? "text-amber-500 hover:text-amber-400"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        aria-label={activeNote.isPinned ? "Unpin note" : "Pin note"}
                      >
                        {activeNote.isPinned ? (
                          <Pin className="size-3.5 fill-current" />
                        ) : (
                          <PinOff className="size-3.5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-sans text-xs">
                      {activeNote.isPinned ? "Unpin from top" : "Pin to top"}
                    </TooltipContent>
                  </Tooltip>
                )}

                <span
                  className="text-xs font-semibold text-foreground truncate max-w-[160px] sm:max-w-xs font-sans tracking-tight"
                  title={activeNote?.title}
                >
                  {activeNote?.title || "Untitled"}
                </span>

                {/* Word count & Reading time & Goal Progress Badge */}
                <div className="relative hidden 2xl:inline-flex items-center gap-1.5 px-2 py-0.5 border border-border/70 bg-card/60 font-mono text-[10px] tracking-wider shrink-0 text-muted-foreground ml-1">
                  <Corners size="sm" weight="thin" light />
                  <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
                  <span className="opacity-40">·</span>
                  <span>~{Math.max(1, Math.ceil(wordCount / 200))}m read</span>
                  {writingGoal > 0 && (
                    <>
                      <span className="opacity-40">·</span>
                      <span className="text-primary font-bold">
                        🎯 {Math.min(100, Math.round((wordCount / writingGoal) * 100))}%
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Zone 2: Center (view mode switcher - mathematically centered) */}
              <div className="flex items-center justify-center shrink-0">
                <div className="relative flex items-center bg-card/40 border border-border/70 p-0.5 shrink-0 rounded-none shadow-2xs">
                  <Corners size="sm" weight="thin" light />
                  <Button
                    size="xs"
                    variant={viewMode === "editor" ? "secondary" : "ghost"}
                    onClick={() => setViewMode("editor")}
                    className={cn(
                      "h-6.5 px-2.5 text-[11px] font-sans gap-1 rounded-none transition-colors",
                      viewMode === "editor" && "shadow-xs border border-border/80 font-medium bg-background text-foreground"
                    )}
                    title="Editor (Ctrl+1)"
                  >
                    <PenLine className="size-3" />
                    <span className="hidden sm:inline font-mono tracking-tight text-[10.5px]">WRITE</span>
                  </Button>
                  <Button
                    size="xs"
                    variant={viewMode === "split" ? "secondary" : "ghost"}
                    onClick={() => setViewMode("split")}
                    className={cn(
                      "hidden sm:inline-flex h-6.5 px-2.5 text-[11px] font-sans gap-1 rounded-none transition-colors",
                      viewMode === "split" && "shadow-xs border border-border/80 font-medium bg-background text-foreground"
                    )}
                    title="Split (Ctrl+2)"
                  >
                    <Columns2 className="size-3" />
                    <span className="font-mono tracking-tight text-[10.5px]">SPLIT</span>
                  </Button>
                  <Button
                    size="xs"
                    variant={viewMode === "preview" ? "secondary" : "ghost"}
                    onClick={() => setViewMode("preview")}
                    className={cn(
                      "h-6.5 px-2.5 text-[11px] font-sans gap-1 rounded-none transition-colors",
                      viewMode === "preview" && "shadow-xs border border-border/80 font-medium bg-background text-foreground"
                    )}
                    title="Preview (Ctrl+3)"
                  >
                    <Eye className="size-3" />
                    <span className="hidden sm:inline font-mono tracking-tight text-[10.5px]">PREVIEW</span>
                  </Button>
                </div>
              </div>

              {/* Zone 3: Right (Framed Commands, Action Tools Cluster, and Theme Switcher) */}
              <div className="flex items-center gap-2 min-w-0 flex-1 basis-0 justify-end">
                {/* Command palette */}
                <button
                  type="button"
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="relative flex items-center gap-1.5 h-7 px-2 border border-border/70 bg-card/40 hover:bg-muted/50 hover:border-border text-xs font-mono text-muted-foreground hover:text-foreground transition-all shadow-2xs rounded-none cursor-pointer group shrink-0"
                  title="Command palette (Ctrl+K)"
                >
                  <Corners size="sm" weight="thin" light className="opacity-30 group-hover:opacity-100 transition-opacity" />
                  <Command className="size-3.5 text-primary shrink-0" />
                  <span className="hidden xl:inline font-sans text-xs text-foreground/80 group-hover:text-foreground">Commands</span>
                  <kbd className="hidden sm:inline-flex items-center font-mono text-[9px] px-1 py-0.2 bg-muted/60 border border-border/70 text-muted-foreground">
                    ⌘K
                  </kbd>
                </button>

                {/* Framed Action Tools Cluster */}
                <div className="relative flex items-center bg-card/40 border border-border/70 p-0.5 shadow-2xs rounded-none shrink-0">
                  <Corners size="sm" weight="thin" light />

                  {/* Templates picker button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => setIsTemplateOpen(true)}
                        className="size-6.5 text-muted-foreground hover:text-foreground rounded-none hidden sm:inline-flex"
                        aria-label="Note Templates"
                      >
                        <LayoutTemplate className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-sans text-xs">
                      Note Templates
                    </TooltipContent>
                  </Tooltip>

                  {/* Ambient Soundscapes & Pomodoro Dropdown */}
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            className="size-6.5 text-muted-foreground hover:text-foreground rounded-none"
                            aria-label="Ambient Soundscapes & Focus"
                          >
                            <Headphones className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="font-sans text-xs">
                        Ambient Soundscapes & Focus Timer
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent side="bottom" align="end" className="p-0 border-none bg-transparent shadow-none w-auto">
                      <AmbientSoundPlayer />
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="w-px h-3.5 bg-border/40 mx-0.5 hidden sm:block" />

                  {/* Document outline */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => setIsTocOpen(true)}
                        className="size-6.5 text-muted-foreground hover:text-foreground rounded-none hidden sm:inline-flex"
                        aria-label="Document outline"
                      >
                        <ListTree className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-sans text-xs">
                      Document Outline
                    </TooltipContent>
                  </Tooltip>

                  {/* Version history */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => setIsHistoryOpen(true)}
                        className="size-6.5 text-muted-foreground hover:text-foreground rounded-none hidden sm:inline-flex"
                        aria-label="Version history"
                      >
                        <History className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-sans text-xs">
                      Snapshots & History
                    </TooltipContent>
                  </Tooltip>

                  {/* Export markdown */}
                  {activeNote && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={() => {
                            notesRepository.exportNote(activeNote);
                            toast.success(`Exported "${activeNote.title || "Untitled"}.md"`);
                          }}
                          className="size-6.5 text-muted-foreground hover:text-foreground rounded-none hidden md:inline-flex"
                          aria-label="Export as Markdown"
                        >
                          <Download className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="font-sans text-xs">
                        Export Note (.md)
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Print / PDF Export */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => window.print()}
                        className="size-6.5 text-muted-foreground hover:text-foreground rounded-none hidden md:inline-flex"
                        aria-label="Print Note"
                      >
                        <Printer className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-sans text-xs">
                      Print / Export PDF (Ctrl+P)
                    </TooltipContent>
                  </Tooltip>

                  <div className="w-px h-3.5 bg-border/40 mx-0.5 hidden sm:block" />

                  {/* Zen mode */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => setIsZenMode(true)}
                        className="size-6.5 text-muted-foreground hover:text-foreground rounded-none hidden sm:inline-flex"
                        aria-label="Focus mode"
                      >
                        <Maximize2 className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-sans text-xs">
                      Zen Focus Desk (Ctrl+Shift+F)
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Theme toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                      className="relative size-7.5 border border-border/70 bg-card/40 hover:bg-muted/50 hover:border-border rounded-none text-muted-foreground hover:text-foreground shadow-2xs group transition-all shrink-0"
                      aria-label="Toggle theme"
                    >
                      <Corners size="sm" weight="thin" light className="opacity-30 group-hover:opacity-100 transition-opacity" />
                      <Sun className="size-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute size-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-sans text-xs">
                    {resolvedTheme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
                  </TooltipContent>
                </Tooltip>
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
          writingGoal={writingGoal}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
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
