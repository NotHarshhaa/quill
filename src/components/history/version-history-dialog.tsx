"use client";

import React, { useState, useEffect } from "react";
import { Note, NoteRevision } from "@/lib/storage/schema";
import { Corners } from "@/components/frame";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, RotateCcw, Clock, FileText } from "lucide-react";
import { useMarkdownPreview } from "@/hooks/useMarkdownPreview";
import { RenderBlock } from "@/components/preview/preview-elements";

interface VersionHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeNote?: Note;
  onRestoreRevision: (noteId: string, content: string) => void;
}

export function VersionHistoryDialog({
  isOpen,
  onClose,
  activeNote,
  onRestoreRevision,
}: VersionHistoryDialogProps) {
  const revisions = activeNote?.revisions || [];
  const [selectedRevisionId, setSelectedRevisionId] = useState<string>("");

  useEffect(() => {
    if (isOpen && revisions.length > 0) {
      setSelectedRevisionId(revisions[0].id);
    }
  }, [isOpen, revisions]);

  const selectedRevision = revisions.find((r) => r.id === selectedRevisionId) || revisions[0];
  const ast = useMarkdownPreview(selectedRevision?.content || "");

  if (!activeNote) return null;

  const handleRestore = () => {
    if (selectedRevision) {
      onRestoreRevision(activeNote.id, selectedRevision.content);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl h-[75vh] flex flex-col p-0 gap-0 border border-border bg-background shadow-2xl rounded-none font-sans overflow-hidden">
        <Corners size="sm" offset="border" weight="thin" light />

        {/* Dialog Header */}
        <div className="h-12 px-4 sm:px-6 border-b border-border flex items-center justify-between bg-muted/40 select-none shrink-0">
          <div className="flex items-center gap-2">
            <History className="size-4 text-muted-foreground" />
            <DialogTitle className="text-sm font-semibold text-foreground font-sans">
              Version History
            </DialogTitle>
            <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0.5 border border-border rounded-none">
              {revisions.length} {revisions.length === 1 ? "SNAPSHOT" : "SNAPSHOTS"}
            </Badge>
          </div>
          {selectedRevision && (
            <Button
              size="xs"
              variant="default"
              onClick={handleRestore}
              className="gap-1.5 font-sans rounded-none h-7 px-3 text-xs"
            >
              <RotateCcw className="size-3" />
              <span>Restore This Version</span>
            </Button>
          )}
        </div>

        {/* Main Content Area */}
        {revisions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <Clock className="size-8 mb-2 opacity-30" />
            <p className="font-sans text-sm">No snapshots recorded yet.</p>
            <p className="text-xs text-muted-foreground/70 mt-1 max-w-sm">
              As you write in Quill, periodic snapshots will automatically be captured here for 1-click recovery.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex min-h-0">
            {/* Revision List (Left) */}
            <div className="w-56 sm:w-64 border-r border-border/70 overflow-y-auto bg-muted/20 select-none p-2 space-y-1 shrink-0">
              {revisions.map((rev, idx) => {
                const isSelected = rev.id === selectedRevisionId;
                const date = new Date(rev.savedAt);
                const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });

                return (
                  <button
                    key={rev.id}
                    onClick={() => setSelectedRevisionId(rev.id)}
                    className={`relative w-full text-left p-2.5 transition-colors border ${
                      isSelected
                        ? "bg-card border-border shadow-xs text-foreground"
                        : "bg-transparent border-transparent hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {isSelected && <Corners size="sm" offset="border" weight="thin" light />}
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>{idx === 0 ? "Latest Snapshot" : timeStr}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{rev.wordCount} words</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground/70 mt-0.5 font-sans">
                      {dateStr} · {timeStr}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Revision Preview (Right) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
              {selectedRevision ? (
                <div className="max-w-xl mx-auto font-sans">
                  {ast.map((block, idx) => (
                    <RenderBlock key={idx} block={block} />
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Select a snapshot to preview
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
