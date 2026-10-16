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
  Command,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { MoreMenu } from "@/components/layout/more-menu";
import { DocumentPanel } from "@/components/layout/document-panel";
import { Corners } from "@/components/frame";
import { AIAssistantMenu } from "@/components/ai/ai-assistant-menu";
import { AIStatusModal } from "@/components/ai/ai-status-modal";
import { emitEditorCommand } from "@/lib/editor/editorCommands";
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
  const { resolvedTheme } = useTheme();

  // New Feature Modals State
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isAIStatusOpen, setIsAIStatusOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isDocPanelOpen, setIsDocPanelOpen] = useState(false);

  // Hidden file inputs for .md import and JSON restore
  const markdownInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Responsive defaults on mount & check welcome modal startup preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 768) {
        // Mobile phones: start in clean preview, sidebar off-canvas
        setViewMode("preview");
        setSideVisible(false);
      } else if (window.innerWidth < 1024) {
        // Tablet devices (768px-1023px): start with sleek 48px rail + split view
        setViewMode("split");
        setSideVisible(false);
      } else {
        // Desktop monitors (1024px+): full expanded library + split view
        setViewMode("split");
        setSideVisible(true);
        setIsDocPanelOpen(true);
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

  // Synchronize Android native status bar icon appearance when theme changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const isDark = resolvedTheme === "dark";
        (window as any).AndroidBridge?.setDarkMode?.(isDark);
      } catch {}
    }
  }, [resolvedTheme]);

  // Latest editor content & active note, readable from effect cleanups
  const latestEditorRef = useRef({ id: activeNoteId, content: localContent, note: activeNote });
  useEffect(() => {
    latestEditorRef.current = { id: activeNoteId, content: localContent, note: activeNote };
  });

  // Sync local editor content when the active note switches. Deliberately keyed on
  // activeNoteId only: re-syncing on every activeNote identity change would clobber
  // keystrokes typed while an autosave is committing. The cleanup flushes unsaved
  // edits of the outgoing note so the autosave debounce can't drop them.
  useEffect(() => {
    setLocalContent(activeNote ? activeNote.content : "");
    return () => {
      const { id, content, note } = latestEditorRef.current;
      if (note && id && content !== note.content) {
        updateNote(id, { content }, true);
        activityTracker.logWords(countWords(content));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNoteId]);

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

  // Android hardware back button: close the topmost overlay first (mirrors the
  // Escape behavior), then close the mobile drawer / zen mode, and only exit
  // the app when nothing is left to close — like a native app
  useEffect(() => {
    const cap = (window as any).Capacitor;
    if (!cap?.isNativePlatform?.()) return;

    let cancelled = false;
    let handle: { remove: () => void } | null = null;

    import("@capacitor/app")
      .then(({ App }) => {
        if (cancelled) return;
        App.addListener("backButton", () => {
          if (isAIStatusOpen) return setIsAIStatusOpen(false);
          if (isMoreOpen) return setIsMoreOpen(false);
          if (isWelcomeOpen) return setIsWelcomeOpen(false);
          if (isInsightsOpen) return setIsInsightsOpen(false);
          if (isTocOpen) return setIsTocOpen(false);
          if (isGraphOpen) return setIsGraphOpen(false);
          if (isTemplateOpen) return setIsTemplateOpen(false);
          if (isHistoryOpen) return setIsHistoryOpen(false);
          if (isCommandPaletteOpen) return setIsCommandPaletteOpen(false);
          if (isZenMode) return setIsZenMode(false);
          if (
            sideVisible &&
            typeof window !== "undefined" &&
            window.matchMedia("(max-width: 767px)").matches
          ) {
            return setSideVisible(false);
          }
          App.exitApp();
        }).then((h) => {
          handle = h;
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      try {
        handle?.remove?.();
      } catch {}
    };
  }, [
    isAIStatusOpen,
    isMoreOpen,
    isWelcomeOpen,
    isInsightsOpen,
    isTocOpen,
    isGraphOpen,
    isTemplateOpen,
    isHistoryOpen,
    isCommandPaletteOpen,
    isZenMode,
    sideVisible,
  ]);

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
      const finish = () => {
        processed++;
        if (processed === files.length) {
          importNotes(importedNotes);
          if (importedNotes.length > 0) {
            toast.success(
              `Imported ${importedNotes.length} note${importedNotes.length > 1 ? "s" : ""}`
            );
          }
        }
      };
      reader.onload = (event) => {
        const text = (event.target?.result as string) || "";
        const note = notesRepository.createNoteFromMarkdown(file.name, text);
        importedNotes.push(note);
        finish();
      };
      reader.onerror = () => {
        toast.error(`Failed to read "${file.name}"`);
        finish();
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

  // Export the active note as a .md file (used by the More menu)
  const handleExportActiveNote = () => {
    if (!activeNote) return;
    notesRepository.exportNote(activeNote);
    toast.success(`Exported "${activeNote.title || "Untitled"}.md"`);
  };

  // Outline: dock the desktop document panel, or open the drawer on smaller screens
  const handleOpenOutline = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setIsDocPanelOpen((prev) => !prev);
    } else {
      setIsTocOpen(true);
    }
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
      {/* App shell: shrinks above the on-screen keyboard (Android injects --kb-height)
          and avoids landscape display cutouts via safe-left/right padding. h-screen is
          the fallback for WebViews without dvh support (invalid calc ignores the style). */}
      <div
        className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden"
        style={{
          height: "calc(100dvh - var(--kb-height, 0px))",
          paddingLeft: "var(--safe-left)",
          paddingRight: "var(--safe-right)",
        }}
      >
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
            onOpen={() => setSideVisible(true)}
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
            {/* Top Bar (Edge-to-edge header with safe-area clearance for camera cutout/status bar) */}
            <header
              className="border-b border-border/80 shrink-0 bg-background/95 backdrop-blur-xs select-none"
              style={{
                paddingTop: "var(--safe-top)",
              }}
            >
              <div className="h-12 px-3 flex items-center justify-between gap-3 shrink-0">
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
                  className="min-w-0 text-xs font-semibold text-foreground truncate max-w-[160px] sm:max-w-xs font-sans tracking-tight"
                  title={activeNote?.title}
                >
                  {activeNote?.title || "Untitled"}
                </span>
              </div>

              {/* Zone 2: Center (view mode switcher - spacious & default variant) */}
              <div className="flex items-center justify-center shrink-0">
                <div className="relative flex items-center bg-card/60 border border-border/80 p-1 gap-1 shrink-0 rounded-none shadow-xs">
                  <Corners size="sm" weight="thin" light />
                  <Button
                    size="xs"
                    variant={viewMode === "editor" ? "default" : "ghost"}
                    onClick={() => setViewMode("editor")}
                    className={cn(
                      "h-7 sm:h-7.5 px-3 sm:px-3.5 text-xs font-mono font-medium tracking-wide gap-1.5 rounded-none transition-all",
                      viewMode === "editor"
                        ? "shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                    title="Editor (Ctrl+1)"
                  >
                    <PenLine className="size-3.5" />
                    <span className="hidden md:inline">WRITE</span>
                  </Button>
                  <Button
                    size="xs"
                    variant={viewMode === "split" ? "default" : "ghost"}
                    onClick={() => setViewMode("split")}
                    className={cn(
                      "hidden md:inline-flex h-7 sm:h-7.5 px-3 sm:px-3.5 text-xs font-mono font-medium tracking-wide gap-1.5 rounded-none transition-all",
                      viewMode === "split"
                        ? "shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                    title="Split (Ctrl+2)"
                  >
                    <Columns2 className="size-3.5" />
                    <span>SPLIT</span>
                  </Button>
                  <Button
                    size="xs"
                    variant={viewMode === "preview" ? "default" : "ghost"}
                    onClick={() => setViewMode("preview")}
                    className={cn(
                      "h-7 sm:h-7.5 px-3 sm:px-3.5 text-xs font-mono font-medium tracking-wide gap-1.5 rounded-none transition-all",
                      viewMode === "preview"
                        ? "shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                    title="Preview (Ctrl+3)"
                  >
                    <Eye className="size-3.5" />
                    <span className="hidden md:inline">PREVIEW</span>
                  </Button>
                </div>
              </div>

              {/* Zone 3: Right (Command palette, Offline AI, and More menu) */}
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
                  <kbd className="hidden lg:inline-flex items-center font-mono text-[9px] px-1 py-0.2 bg-muted/60 border border-border/70 text-muted-foreground">
                    ⌘K
                  </kbd>
                </button>

                {/* Offline AI Assistant (WebGPU / Local) */}
                <AIAssistantMenu
                  content={localContent}
                  onChangeContent={handleEditorChange}
                  disabled={!activeNote}
                />

                {/* Secondary actions — Templates, Outline, History, Export, Print, Zen, Ambient, Goal */}
                <MoreMenu
                  open={isMoreOpen}
                  onOpenChange={setIsMoreOpen}
                  activeNote={activeNote}
                  onOpenTemplates={() => setIsTemplateOpen(true)}
                  onOpenOutline={handleOpenOutline}
                  onOpenHistory={() => setIsHistoryOpen(true)}
                  onFindReplace={() => emitEditorCommand("find")}
                  onExportNote={handleExportActiveNote}
                  onPrintNote={() => window.print()}
                  onToggleZen={() => setIsZenMode(true)}
                  writingGoal={writingGoal}
                  onSetWritingGoal={(goal) => {
                    setWritingGoal(goal);
                    if (goal > 0) {
                      toast.info(`Session writing goal: ${goal} words`);
                    } else {
                      toast.info("Session writing goal cleared");
                    }
                  }}
                />

              </div>
            </div>
          </header>

            {/* Editor/Preview Content */}
            <div className="flex-1 flex min-h-0">
              {isZenMode ? (
                /* Zen Mode - Centered Focus */
                <div className="flex-1 flex flex-col h-full bg-drafting-grid relative overflow-hidden">
                  <div
                    className="flex-1 flex items-center justify-center p-4 sm:p-8 h-full min-h-0 overflow-hidden"
                    style={{
                      paddingTop: "max(1rem, var(--safe-top))",
                      paddingBottom: "max(3.5rem, calc(3.5rem + var(--safe-bottom)))",
                    }}
                  >
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
                  <div
                    className="no-print absolute left-1/2 -translate-x-1/2 flex items-center gap-2 bg-card/95 border border-border/80 shadow-lg px-3 py-1.5 text-xs"
                    style={{
                      bottom: "calc(1rem + var(--safe-bottom))",
                    }}
                  >
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
                      variant="default"
                      onClick={() => setIsZenMode(false)}
                      className="h-5 px-2 text-[10px] ml-1 shadow-2xs"
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
                      "editor-pane h-full min-w-0 flex flex-col",
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
                      "preview-pane h-full min-w-0 overflow-y-auto",
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

                  {/* Document Panel (desktop): outline, backlinks, stats, history */}
                  {isDocPanelOpen && (
                    <DocumentPanel
                      className="hidden lg:flex"
                      content={localContent}
                      wordCount={wordCount}
                      backlinks={backlinks}
                      onNavigateWikiLink={navigateOrCreateWikiLink}
                      onOpenHistory={() => setIsHistoryOpen(true)}
                      onClose={() => setIsDocPanelOpen(false)}
                    />
                  )}
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
          onExportNote={handleExportActiveNote}
          onImportMarkdown={() => markdownInputRef.current?.click()}
          onBackupNotes={handleBackupNotes}
          onRestoreBackup={() => jsonInputRef.current?.click()}
          onOpenGraph={() => setIsGraphOpen(true)}
          onOpenToc={handleOpenOutline}
          onOpenInsights={() => setIsInsightsOpen(true)}
          onOpenWelcome={() => setIsWelcomeOpen(true)}
          onOpenAIStatus={() => setIsAIStatusOpen(true)}
          onViewModeChange={setViewMode}
          currentViewMode={viewMode}
          onToggleSidebar={() => setSideVisible((prev) => !prev)}
          onSetWritingGoal={(goal) => {
            setWritingGoal(goal);
            if (goal > 0) {
              toast.info(`Session writing goal: ${goal} words`);
            } else {
              toast.info("Session writing goal cleared");
            }
          }}
          onSelectPanel={setActivePanel}
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

        {/* Offline AI Model Manager & WebGPU Status Dialog */}
        <AIStatusModal
          open={isAIStatusOpen}
          onOpenChange={setIsAIStatusOpen}
        />

        {/* In-App Update Notifier (Only active in native mobile app) */}
        <AppUpdateNotifier />
      </div>
    </ErrorBoundary>
  );
}
