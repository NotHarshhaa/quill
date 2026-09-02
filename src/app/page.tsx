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
import { Edit3, Eye, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Hidden file inputs for .md import and JSON restore
  const markdownInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

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
      />

      {/* Main Workspace */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Expand sidebar button when collapsed */}
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

        {/* Sidebar */}
        <div
          className={`h-full transition-all duration-200 ease-in-out ${
            isSidebarOpen ? "block" : "hidden"
          }`}
        >
          <NotesSidebar
            notes={notes}
            activeNoteId={activeNoteId}
            onSelectNote={selectNote}
            onCreateNote={createNote}
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

        {/* Mobile View Toggle Bar */}
        <div className="md:hidden absolute top-2 right-2 z-30 flex items-center bg-muted/80 backdrop-blur-xs p-1 border border-border gap-1">
          <Button
            size="xs"
            variant={mobileTab === "editor" ? "default" : "ghost"}
            onClick={() => setMobileTab("editor")}
          >
            <Edit3 />
            <span>Write</span>
          </Button>
          <Button
            size="xs"
            variant={mobileTab === "preview" ? "default" : "ghost"}
            onClick={() => setMobileTab("preview")}
          >
            <Eye />
            <span>Preview</span>
          </Button>
        </div>

        {/* Editor & Preview Split Panes */}
        <div className="flex-1 flex h-full min-w-0">
          {/* Editor Pane */}
          <div
            className={`h-full flex-1 min-w-0 ${
              mobileTab === "editor" ? "flex" : "hidden md:flex"
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
              mobileTab === "preview" ? "flex" : "hidden md:flex"
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
