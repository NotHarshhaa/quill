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
import { MoreMenu } from "@/components/layout/more-menu";
import { DocumentPanel } from "@/components/layout/document-panel";
import {
  InlineEditableTitle,
  TopBarButton,
  TopBarGlyph,
  TopBarSegmentedControl,
  ViewSegment,
} from "@/components/layout/top-bar";
import { AIAssistantMenu } from "@/components/ai/ai-assistant-menu";
import { AIStatusModal } from "@/components/ai/ai-status-modal";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileTabBar, MobileTab } from "@/components/layout/mobile-tab-bar";
import { MobileMoreSheet } from "@/components/layout/mobile-more-sheet";
import { MobileAISheet } from "@/components/layout/mobile-ai-sheet";
import { KeyboardAccessoryBar } from "@/components/editor/keyboard-accessory-bar";
import { emitEditorCommand } from "@/lib/editor/editorCommands";
import { useEditorState } from "@/hooks/useEditorState";
import { useIsMobileShell } from "@/hooks/useMediaQuery";
import { useKeyboardInset } from "@/hooks/useKeyboardInset";
import { hapticTap } from "@/lib/ui/haptics";
import { toast } from "sonner";

type ViewMode = "editor" | "split" | "preview";
type MobileView = "notes" | "editor";

const MOBILE_MEDIA = "(max-width: 767px)";

function isMobileViewport(): boolean {
  return typeof window !== "undefined" && window.matchMedia(MOBILE_MEDIA).matches;
}

const VIEW_SEGMENTS: ViewSegment[] = [
  { value: "editor", label: "Write", icon: PenLine, shortcut: "Ctrl+1" },
  { value: "split", label: "Split", icon: Columns2, shortcut: "Ctrl+2" },
  { value: "preview", label: "Preview", icon: Eye, shortcut: "Ctrl+3" },
];

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
  const isDark = resolvedTheme === "dark";
  const editorState = useEditorState();

  // New Feature Modals State
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isAIStatusOpen, setIsAIStatusOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isDocPanelOpen, setIsDocPanelOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ----- Mobile shell (<768px / Android APK) -----
  const isMobileShell = useIsMobileShell();
  const keyboardInset = useKeyboardInset();
  const keyboardVisible = keyboardInset > 0;
  const [mobileView, setMobileView] = useState<MobileView>("editor");
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isMobileAIOpen, setIsMobileAIOpen] = useState(false);
  const [searchFocusSignal, setSearchFocusSignal] = useState(0);
  // True while the markdown textarea owns focus (drives the accessory bar)
  const [editorFocused, setEditorFocused] = useState(false);

  // Hidden file inputs for .md import and JSON restore
  const markdownInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Responsive defaults on mount & check welcome modal startup preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 768) {
        // Mobile phones: editor-first shell; the notes list is a full-screen page
        setViewMode("editor");
        setSideVisible(false);
        setMobileView("editor");
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

  // Track fullscreen state so the More menu can reflect / exit it
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Mobile has no Split view — collapse it to the Write pane when we land on a phone
  useEffect(() => {
    if (isMobileShell && viewMode === "split") setViewMode("editor");
  }, [isMobileShell, viewMode]);

  // Track whether the markdown textarea owns focus so the keyboard accessory bar
  // only appears for the editor (not for the search / title / settings fields).
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      setEditorFocused(!!target && target.tagName === "TEXTAREA");
    };
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, []);

  // Keep the shell's mobile view and the desktop sidebar flag in sync
  const gotoMobileView = (next: MobileView) => {
    setMobileView(next);
    setSideVisible(next === "notes");
  };

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
      // Escape: exit zen mode, or step back from the editor to the notes list
      if (e.key === "Escape") {
        if (isZenMode) {
          setIsZenMode(false);
        } else if (isMobileMoreOpen || isMobileAIOpen) {
          // The bottom sheet owns Escape (Radix closes it) — don't also navigate
        } else if (isMobileViewport() && mobileView === "editor") {
          setMobileView("notes");
          setSideVisible(true);
        } else if (sideVisible && isMobileViewport()) {
          setSideVisible(false);
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isZenMode, sideVisible, createNote, mobileView, isMobileMoreOpen, isMobileAIOpen]);

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
          if (isMobileMoreOpen) return setIsMobileMoreOpen(false);
          if (isMobileAIOpen) return setIsMobileAIOpen(false);
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
          // Shell navigation: editor → notes list → exit
          if (isMobileViewport() && mobileView === "editor") {
            setSideVisible(true);
            setMobileView("notes");
            return;
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
    isMobileMoreOpen,
    isMobileAIOpen,
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
    mobileView,
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

  // Select note; on mobile also return from the notes list to the editor
  const handleSelectNote = (id: string) => {
    selectNote(id);
    if (isMobileViewport()) {
      setSideVisible(false);
      setMobileView("editor");
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

  // Inline rename from the top bar — renames the note only, never the body
  const handleRenameNote = (title: string) => {
    if (!activeNote) return;
    updateNote(activeNote.id, { title });
  };

  // Real browser fullscreen (View → Fullscreen in the More menu)
  const handleToggleFullscreen = () => {
    if (typeof document === "undefined") return;
    if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => {});
    } else {
      void document.documentElement.requestFullscreen?.().catch(() => {});
    }
  };

  /* --------------------------- Mobile shell wiring --------------------------- */

  const handleMobileTab = (tab: MobileTab) => {
    if (tab === "notes") {
      gotoMobileView("notes");
    } else if (tab === "editor") {
      gotoMobileView("editor");
    } else if (tab === "ai") {
      setIsMobileAIOpen(true);
    } else {
      setIsMobileMoreOpen(true);
    }
  };

  const handleMobileNewNote = () => {
    createNote();
    gotoMobileView("editor");
  };

  const openNotesPanel = (panel: SidebarPanel) => {
    setActivePanel(panel);
    gotoMobileView("notes");
  };

  const handleMobileSearch = () => {
    setActivePanel("all");
    gotoMobileView("notes");
    setSearchFocusSignal((n) => n + 1);
  };

  const mobileTab: MobileTab = isMobileMoreOpen
    ? "more"
    : isMobileAIOpen
    ? "ai"
    : mobileView === "notes"
    ? "notes"
    : "editor";

  // Accessory bar swaps in for the tab bar only while typing in the editor
  const showAccessoryBar = keyboardVisible && editorFocused;

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
        <div className="relative flex-1 flex min-h-0">
          {/* Unified Library Sidebar (All / Favorites / Trash / Settings).
              On phones it becomes a full-screen "Notes" page. */}
          <AppSidebar
            open={sideVisible}
            onClose={() => {
              // Phone: the X on the full-screen Notes page returns to the editor.
              // Desktop: it collapses the expanded sidebar to the rail.
              if (isMobileViewport()) gotoMobileView("editor");
              else setSideVisible(false);
            }}
            onOpen={() => setSideVisible(true)}
            mobilePage={mobileView === "notes"}
            searchFocusSignal={searchFocusSignal}
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
              className="max-md:hidden border-b border-border/80 shrink-0 bg-background/95 backdrop-blur-xs select-none"
              style={{
                paddingTop: "var(--safe-top)",
              }}
            >
              <div className="h-12 px-2 sm:px-3 flex items-center gap-2 shrink-0">
                {/* Zone 1: Left — sidebar toggle · pin · title · word count */}
                <div className="flex items-center gap-2 min-w-0 flex-1 basis-0 justify-start">
                  <TopBarButton
                    label={sideVisible ? "Hide sidebar" : "Show sidebar"}
                    shortcut="Ctrl+B"
                    onClick={() => setSideVisible((prev) => !prev)}
                    active={sideVisible}
                  >
                    <TopBarGlyph icon={sideVisible ? PanelLeftClose : PanelLeftOpen} />
                  </TopBarButton>

                  {activeNote && (
                    <TopBarButton
                      label={activeNote.isPinned ? "Unpin note" : "Pin note"}
                      onClick={() => togglePinNote(activeNote.id)}
                      className={cn(
                        "hidden sm:inline-flex",
                        activeNote.isPinned && "text-amber-500 hover:text-amber-400"
                      )}
                    >
                      <TopBarGlyph
                        icon={activeNote.isPinned ? Pin : PinOff}
                        className={activeNote.isPinned ? "fill-current" : undefined}
                      />
                    </TopBarButton>
                  )}

                  {activeNote && (
                    <InlineEditableTitle
                      value={activeNote.title}
                      onCommit={handleRenameNote}
                      className="hidden min-[420px]:inline-flex"
                    />
                  )}

                  <span className="hidden sm:inline shrink-0 pl-1 text-[11px] font-mono text-muted-foreground/60 tabular-nums">
                    {wordCount} words
                  </span>
                </div>

              {/* Zone 2: Center — segmented Write | Split | Preview.
                  Hidden only on very small phones (<360px), where the layout
                  switcher lives in the ⋯ More sheet instead. */}
              <div className="hidden min-[360px]:flex items-center justify-center shrink-0">
                <TopBarSegmentedControl
                  value={viewMode}
                  onChange={(v) => setViewMode(v as ViewMode)}
                  segments={VIEW_SEGMENTS}
                />
              </div>

              {/* Zone 3: Right — AI · Command palette · ⋯ More · theme toggle.
                  On phones it takes its natural width so the left zone can absorb
                  the mobile undo/redo buttons without clipping. */}
              <div className="flex items-center gap-2 min-w-0 flex-none sm:flex-1 sm:basis-0 justify-end">
                {/* Offline AI Assistant (WebGPU / Local) — primary accent */}
                <AIAssistantMenu
                  content={localContent}
                  onChangeContent={handleEditorChange}
                  disabled={!activeNote}
                />

                {/* Command palette */}
                <TopBarButton
                  label="Command palette"
                  shortcut="Ctrl+K"
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="hidden sm:inline-flex"
                >
                  <TopBarGlyph icon={Command} />
                </TopBarButton>

                {/* Secondary actions — View / Note / Export / Tools */}
                <MoreMenu
                  open={isMoreOpen}
                  onOpenChange={setIsMoreOpen}
                  activeNote={activeNote}
                  onOpenOutline={handleOpenOutline}
                  onOpenHistory={() => setIsHistoryOpen(true)}
                  onFindReplace={() => emitEditorCommand("find")}
                  onExportNote={handleExportActiveNote}
                  onPrintNote={() => window.print()}
                  onToggleZen={() => setIsZenMode(true)}
                  onToggleFullscreen={handleToggleFullscreen}
                  fullscreen={isFullscreen}
                  onOpenGraph={() => setIsGraphOpen(true)}
                  onOpenInsights={() => setIsInsightsOpen(true)}
                  onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
                  onToggleTypewriter={() => emitEditorCommand("typewriter")}
                  typewriter={editorState.typewriter}
                  viewMode={viewMode}
                  onChangeViewMode={(m) => setViewMode(m as ViewMode)}
                />

                {/* Theme quick-toggle (hidden on phone widths — available in ⋯ More + Settings) */}
                <TopBarButton
                  label={isDark ? "Switch to light theme" : "Switch to dark theme"}
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  className="hidden lg:inline-flex"
                >
                  <TopBarGlyph icon={isDark ? Sun : Moon} />
                </TopBarButton>
              </div>
            </div>
          </header>

            {/* Phone top bar: back · title · Write/Preview · ⋯ */}
            <MobileHeader
              className={cn(isZenMode && "hidden")}
              title={activeNote?.title}
              onRename={handleRenameNote}
              onBack={() => gotoMobileView("notes")}
              viewMode={viewMode === "preview" ? "preview" : "editor"}
              onViewModeChange={setViewMode}
              onOpenMore={() => setIsMobileMoreOpen(true)}
            />

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

        {/* Phone bottom bar — swaps to the keyboard accessory while typing */}
        {!isZenMode && (
          <div
            className={cn(
              "md:hidden shrink-0",
              keyboardVisible && !showAccessoryBar && "hidden"
            )}
            style={{ paddingBottom: keyboardVisible ? 0 : "var(--safe-bottom)" }}
          >
            {showAccessoryBar ? (
              <KeyboardAccessoryBar
                onDismiss={() => (document.activeElement as HTMLElement | null)?.blur?.()}
              />
            ) : (
              <MobileTabBar
                active={mobileTab}
                onNavigate={handleMobileTab}
                onNewNote={handleMobileNewNote}
              />
            )}
          </div>
        )}

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

        {/* Phone bottom sheets (AI · More) */}
        <MobileAISheet
          open={isMobileAIOpen}
          onOpenChange={setIsMobileAIOpen}
          content={localContent}
          onChangeContent={handleEditorChange}
          disabled={!activeNote}
        />

        <MobileMoreSheet
          open={isMobileMoreOpen}
          onOpenChange={setIsMobileMoreOpen}
          activeNote={activeNote}
          onOpenSearch={handleMobileSearch}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenTemplates={() => setIsTemplateOpen(true)}
          onOpenFavorites={() => openNotesPanel("favorites")}
          onOpenTrash={() => openNotesPanel("trash")}
          onOpenSettings={() => openNotesPanel("settings")}
          onOpenGraph={() => setIsGraphOpen(true)}
          onOpenInsights={() => setIsInsightsOpen(true)}
          onOpenOutline={handleOpenOutline}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onFindReplace={() => emitEditorCommand("find")}
          onExportNote={handleExportActiveNote}
          onPrintNote={() => window.print()}
          onToggleZen={() => setIsZenMode(true)}
          onToggleFullscreen={handleToggleFullscreen}
          fullscreen={isFullscreen}
          onToggleTypewriter={() => emitEditorCommand("typewriter")}
          typewriter={editorState.typewriter}
        />

        {/* In-App Update Notifier (Only active in native mobile app) */}
        <AppUpdateNotifier />
      </div>
    </ErrorBoundary>
  );
}
