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
import { Note } from "@/lib/storage/schema";
import { Edit3, Eye, Columns, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ViewMode = "editor" | "split" | "preview";

export default function QuillPage() {
  const {
    notes,
    allRawNotes,
    activeNote,
    activeNoteId,
    isLoaded,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    allTags,
    selectNote,
    createNote,
    updateNote,
    togglePinNote,
    deleteNote,
    importNotes,
    restoreBackup,
  } = useNotes();

  // Local editor content for immediate keystroke feedback
  const [localContent, setLocalContent] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

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

  // Global keyboard shortcuts (Cmd+K / Ctrl+K for command palette)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Debounced autosave to repository
  const { status: saveStatus } = useAutosave(
    localContent,
    (content) => {
      if (activeNote) {
        updateNote(activeNote.id, { content });
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

      {/* Top Navigation Bar */}
      <Header
        activeNote={activeNote}
        wordCount={wordCount}
        saveStatus={saveStatus}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onTogglePin={togglePinNote}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
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

        {/* Expand sidebar button when collapsed on desktop */}
        {!isSidebarOpen && (
          <div className="hidden lg:block absolute left-2 top-2 z-20">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="h-7 w-7 text-muted-foreground/70 hover:text-foreground bg-background/80 border border-border/60 shadow-xs"
              title="Show sidebar"
            >
              <PanelLeftOpen className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Sidebar: persistent on desktop, slide-over drawer on mobile/tablet */}
        <div
          className={`h-full z-40 transition-transform duration-200 ease-in-out fixed inset-y-0 left-0 lg:static lg:inset-auto lg:translate-x-0 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:hidden"
          }`}
        >
          <NotesSidebar
            notes={notes}
            activeNoteId={activeNoteId}
            onSelectNote={handleSelectNote}
            onCreateNote={() => {
              createNote();
              if (typeof window !== "undefined" && window.innerWidth < 1024) {
                setIsSidebarOpen(false);
              }
            }}
            onDeleteNote={deleteNote}
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
          />
        </div>

        {/* Mobile & Tablet Mode Selector */}
        <div className="lg:hidden absolute top-2 right-2.5 z-20 flex items-center bg-card/90 backdrop-blur-md p-0.5 border border-border/80 shadow-xs gap-0.5">
          <Button
            size="xs"
            variant={viewMode === "editor" ? "default" : "ghost"}
            onClick={() => setViewMode("editor")}
            className="h-6 px-2 text-[11px] font-sans"
            title="Write mode"
          >
            <Edit3 className="size-3 mr-1" />
            <span>Write</span>
          </Button>
          <Button
            size="xs"
            variant={viewMode === "split" ? "default" : "ghost"}
            onClick={() => setViewMode("split")}
            className="hidden md:inline-flex h-6 px-2 text-[11px] font-sans"
            title="Split mode"
          >
            <Columns className="size-3 mr-1" />
            <span>Split</span>
          </Button>
          <Button
            size="xs"
            variant={viewMode === "preview" ? "default" : "ghost"}
            onClick={() => setViewMode("preview")}
            className="h-6 px-2 text-[11px] font-sans"
            title="Preview mode"
          >
            <Eye className="size-3 mr-1" />
            <span>Preview</span>
          </Button>
        </div>

        {/* Editor & Preview Panes */}
        <div className="flex-1 flex h-full min-w-0">
          {/* Editor Pane */}
          <div
            className={`h-full flex-1 min-w-0 ${
              viewMode === "editor" || viewMode === "split" ? "flex" : "hidden"
            }`}
          >
            <MarkdownEditor
              content={localContent}
              onChange={handleEditorChange}
            />
          </div>

          {/* Preview Pane with Interactive Checklists */}
          <div
            className={`h-full flex-1 min-w-0 ${
              viewMode === "preview" || viewMode === "split" ? "flex" : "hidden"
            }`}
          >
            <MarkdownPreview
              content={localContent}
              onToggleTask={handleToggleTask}
            />
          </div>
        </div>
      </div>

      {/* Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        notes={allRawNotes}
        activeNote={activeNote}
        onSelectNote={selectNote}
        onCreateNote={createNote}
        onTogglePin={togglePinNote}
        onExportNote={() => {
          if (activeNote) {
            notesRepository.exportNote(activeNote);
            toast.success(`Exported "${activeNote.title || 'Untitled'}.md"`);
          }
        }}
        onImportMarkdown={() => markdownInputRef.current?.click()}
        onBackupNotes={handleBackupNotes}
        onRestoreBackup={() => jsonInputRef.current?.click()}
      />
    </div>
  );
}
