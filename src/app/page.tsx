"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { NotesSidebar } from "@/components/sidebar/notes-sidebar";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { MarkdownPreview } from "@/components/preview/markdown-preview";
import { useNotes } from "@/hooks/useNotes";
import { useAutosave } from "@/hooks/useAutosave";
import { countWords } from "@/lib/utils";
import { Edit3, Eye, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuillPage() {
  const {
    notes,
    activeNote,
    activeNoteId,
    isLoaded,
    searchQuery,
    setSearchQuery,
    selectNote,
    createNote,
    updateNote,
    deleteNote,
  } = useNotes();

  // Local editor content for immediate keystroke feedback
  const [localContent, setLocalContent] = useState<string>("");
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Sync local editor content when active note switches
  useEffect(() => {
    if (activeNote) {
      setLocalContent(activeNote.content);
    } else {
      setLocalContent("");
    }
  }, [activeNoteId, activeNote]);

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
      {/* Top Navigation Bar */}
      <Header
        activeNote={activeNote}
        wordCount={wordCount}
        saveStatus={saveStatus}
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
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
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

          {/* Preview Pane */}
          <div
            className={`h-full flex-1 min-w-0 ${
              mobileTab === "preview" ? "flex" : "hidden md:flex"
            }`}
          >
            <MarkdownPreview content={localContent} />
          </div>
        </div>
      </div>
    </div>
  );
}
