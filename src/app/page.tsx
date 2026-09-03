"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/header";
import { NotesSidebar } from "@/components/sidebar/notes-sidebar";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { MarkdownPreview } from "@/components/preview/markdown-preview";
import { CommandPalette } from "@/components/command/command-palette";
import { useNotes } from "@/hooks/useNotes";
import { useAutosave } from "@/hooks/useAutosave";
import { countWords } from "@/lib/utils";
import { toggleTaskInMarkdown } from "@/lib/markdown";
import { notesRepository } from "@/lib/storage/notesRepository";
import { activityTracker } from "@/lib/storage/activityTracker";
import { Note } from "@/lib/storage/schema";
import { Minimize2, ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Corners } from "@/components/frame";
import { VersionHistoryDialog } from "@/components/history/version-history-dialog";
import { TemplateDialog } from "@/components/templates/template-dialog";
import { KnowledgeGraphModal } from "@/components/graph/knowledge-graph-modal";
import { TableOfContents } from "@/components/toc/table-of-contents";
import { WritingInsightsModal } from "@/components/analytics/writing-insights-modal";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [writingGoal, setWritingGoal] = useState<number>(0);
  const [hasNotifiedGoal, setHasNotifiedGoal] = useState(false);

  // New Feature Modals State
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

  // Hidden file inputs for .md import and JSON restore
  const markdownInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Responsive defaults on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 768) {
        setViewMode("editor");
        setIsSidebarOpen(false);
      } else if (window.innerWidth < 1024) {
        setViewMode("split");
        setIsSidebarOpen(false);
      } else {
        setViewMode("split");
        setIsSidebarOpen(true);
      }
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

  // Global keyboard shortcuts (Cmd+K for palette, Cmd+Shift+F for Zen, Esc to exit Zen)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsZenMode(false);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

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

  // Close sidebar drawer on mobile/tablet after selecting note
  const handleSelectNote = (id: string) => {
    selectNote(id);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
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
      toast.success(`🎯 Writing goal achieved: ${wordCount} / ${writingGoal} words!`);
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
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
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

      {isZenMode ? (
        /* Zen / Distraction-Free Fullscreen Canvas */
        <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden font-sans">
          <div className="flex-1 max-w-3xl w-full mx-auto h-full p-3 sm:p-8 flex flex-col">
            <MarkdownEditor
              content={localContent}
              onChange={handleEditorChange}
            />
          </div>

          {/* Floating Zen Status Pill with Blueprint Corners */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-2.5 bg-card/95 border border-border/80 shadow-2xl px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-sans select-none max-w-[94vw]">
            <Corners size="sm" offset="border" weight="thin" light />
            <span className="font-semibold text-foreground max-w-28 sm:max-w-44 truncate">
              {activeNote?.title || "Untitled"}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="font-mono text-muted-foreground text-[10.5px] sm:text-[11px] whitespace-nowrap">
              {wordCount} {wordCount === 1 ? "word" : "words"} · ~{Math.max(1, Math.ceil(wordCount / 200))} min read
            </span>
            {writingGoal > 0 && (
              <>
                <span className="text-muted-foreground/40 hidden xs:inline">·</span>
                <span className="font-mono text-[10.5px] sm:text-[11px] text-primary font-semibold hidden xs:inline">
                  🎯 {Math.min(100, Math.round((wordCount / writingGoal) * 100))}%
                </span>
              </>
            )}

            {/* Quick Outline in Zen */}
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setIsTocOpen(true)}
              className="rounded-none h-6 px-2 text-[11px] border border-border/70 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
            >
              <ListTree className="size-3 mr-1 text-primary" />
              <span>Outline</span>
            </Button>

            <Button
              size="xs"
              variant="outline"
              onClick={() => setIsZenMode(false)}
              className="rounded-none h-6 px-2 gap-1 text-[11px] border-border/70 ml-1"
            >
              <Minimize2 className="size-3" />
              <span>Exit (Esc)</span>
            </Button>
          </div>
        </div>
      ) : (
        /* Normal Dual-Pane Layout */
        <>
          {/* Top Navigation Bar */}
          <Header
            activeNote={activeNote}
            wordCount={wordCount}
            saveStatus={saveStatus}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onTogglePin={togglePinNote}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            isSidebarOpen={isSidebarOpen}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onPrintNote={() => window.print()}
            onToggleZen={() => setIsZenMode((prev) => !prev)}
            writingGoal={writingGoal}
            onSetWritingGoal={(goal) => {
              setWritingGoal(goal);
              setHasNotifiedGoal(false);
              if (goal > 0) {
                toast.info(`Session writing goal: ${goal} words`);
              } else {
                toast.info("Session writing goal cleared");
              }
            }}
            onOpenGraph={() => setIsGraphOpen(true)}
            onOpenToc={() => setIsTocOpen(true)}
            onOpenInsights={() => setIsInsightsOpen(true)}
          />

          {/* Main Workspace */}
          <div className="flex-1 flex min-h-0 relative">
            {/* Mobile / Tablet Drawer Backdrop Overlay */}
            {isSidebarOpen && (
              <div
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden fixed inset-0 z-30 bg-black/45 backdrop-blur-xs animate-in fade-in-50 duration-200"
                aria-hidden="true"
              />
            )}

            {/* Sidebar: persistent on desktop, slide-over drawer on mobile/tablet */}
            <div
              className={`h-full z-40 transition-transform duration-200 ease-in-out fixed inset-y-0 left-0 lg:static lg:inset-auto lg:translate-x-0 ${
                isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:hidden"
              }`}
            >
              <NotesSidebar
                notes={notes}
                trashedNotes={trashedNotes}
                activeNoteId={activeNoteId}
                onSelectNote={handleSelectNote}
                onCreateNote={() => {
                  createNote();
                  if (typeof window !== "undefined" && window.innerWidth < 1024) {
                    setIsSidebarOpen(false);
                  }
                }}
                onDeleteNote={deleteNote}
                onRestoreFromTrash={restoreFromTrash}
                onPurgeNote={purgeNote}
                onEmptyTrash={emptyTrash}
                onTogglePin={togglePinNote}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedTag={selectedTag}
                onSelectTag={setSelectedTag}
                allTags={allTags}
                onImportMarkdown={() => markdownInputRef.current?.click()}
                onBackupNotes={handleBackupNotes}
                onRestoreBackup={() => jsonInputRef.current?.click()}
                onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
                onToggleCollapse={() => setIsSidebarOpen(false)}
                onDuplicateNote={(id) => {
                  duplicateNote(id);
                  toast.success("Note duplicated");
                }}
                onOpenTemplates={() => setIsTemplateOpen(true)}
              />
            </div>

            {/* Editor & Preview Panes */}
            <div className="flex-1 flex h-full min-w-0">
              {/* Editor Pane */}
              <div
                className={`editor-pane h-full flex-1 min-w-0 ${
                  viewMode === "editor" || viewMode === "split" ? "flex" : "hidden"
                }`}
              >
                <MarkdownEditor
                  content={localContent}
                  onChange={handleEditorChange}
                />
              </div>

              {/* Preview Pane with Interactive Checklists, Wiki-links & Backlinks */}
              <div
                className={`preview-pane h-full flex-1 min-w-0 ${
                  viewMode === "preview" || viewMode === "split" ? "flex" : "hidden"
                }`}
              >
                <MarkdownPreview
                  content={localContent}
                  onToggleTask={handleToggleTask}
                  onNavigateWikiLink={navigateOrCreateWikiLink}
                  backlinks={backlinks}
                />
              </div>
            </div>
          </div>
        </>
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
        onExportNote={() => {
          if (activeNote) {
            notesRepository.exportNote(activeNote);
            toast.success(`Exported "${activeNote.title || 'Untitled'}.md"`);
          }
        }}
        onImportMarkdown={() => markdownInputRef.current?.click()}
        onBackupNotes={handleBackupNotes}
        onRestoreBackup={() => jsonInputRef.current?.click()}
        onOpenGraph={() => setIsGraphOpen(true)}
        onOpenToc={() => setIsTocOpen(true)}
        onOpenInsights={() => setIsInsightsOpen(true)}
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
    </div>
  );
}
