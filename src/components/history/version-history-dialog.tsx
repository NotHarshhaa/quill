"use client";

import React, { useState, useEffect } from "react";
import { Note } from "@/lib/storage/schema";
import { Corners } from "@/components/frame";
import { Button } from "@/components/ui/button";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { History, RotateCcw, Clock } from "lucide-react";
import { useMarkdownPreview } from "@/hooks/useMarkdownPreview";
import { RenderBlock } from "@/components/preview/preview-elements";

interface VersionHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeNote?: Note;
  onRestoreRevision: (noteId: string, content: string) => void;
}

/**
 * Version history. Bottom sheet on phones (snapshot chips + preview), right-side
 * drawer on desktop (side-by-side list + preview) — same content either way.
 */
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
      // Keep the user's selection while the sheet is open (the revisions array
      // gets a new identity on every autosave); only reset if it disappeared
      setSelectedRevisionId((prev) =>
        revisions.some((r) => r.id === prev) ? prev : revisions[0].id
      );
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
    <ResponsiveSheet
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Version History"
      icon={<History className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />}
      badge={
        <span className="shrink-0 border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {revisions.length} {revisions.length === 1 ? "SNAPSHOT" : "SNAPSHOTS"}
        </span>
      }
      headerActions={
        selectedRevision ? (
          <Button
            size="xs"
            variant="default"
            onClick={handleRestore}
            className="h-7 gap-1.5 rounded-none px-2.5 text-xs font-sans sm:px-3"
          >
            <RotateCcw className="size-3" />
            <span className="hidden min-[420px]:inline">Restore Snapshot</span>
            <span className="min-[420px]:hidden">Restore</span>
          </Button>
        ) : undefined
      }
      drawerWidth="lg"
      snapPoints={["half", "full"]}
      initialSnap="full"
      bodyClassName="flex min-h-0 flex-col overflow-hidden p-0"
    >
      {revisions.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <Clock className="mb-2 size-8 opacity-30" />
          <p className="font-sans text-sm">No snapshots recorded yet.</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground/70">
            As you write in Quill, periodic snapshots will automatically be captured here for
            1-click recovery.
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Revision list — horizontal chips on phones, vertical column on desktop */}
          <div className="shrink-0 border-b border-border/70 bg-muted/20 p-2 select-none md:w-64 md:overflow-y-auto md:border-r md:border-b-0">
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 md:flex-col md:gap-1 md:overflow-visible md:pb-0">
              {revisions.map((rev, idx) => {
                const isSelected = rev.id === selectedRevisionId;
                const date = new Date(rev.savedAt);
                const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });

                return (
                  <button
                    key={rev.id}
                    onClick={() => setSelectedRevisionId(rev.id)}
                    className={`relative w-[9.5rem] shrink-0 border p-2.5 text-left transition-colors md:w-full ${
                      isSelected
                        ? "border-border bg-card text-foreground shadow-xs"
                        : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    {isSelected && <Corners size="sm" offset="border" weight="thin" light />}
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                      <span className="truncate">
                        {idx === 0 ? "Latest Snapshot" : timeStr}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                        {rev.wordCount}w
                      </span>
                    </div>
                    <div className="mt-0.5 font-sans text-[11px] text-muted-foreground/70">
                      {dateStr} · {timeStr}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Revision preview */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-background p-4 sm:p-6">
            {selectedRevision ? (
              <div className="mx-auto max-w-xl font-sans">
                {ast.map((block, idx) => (
                  <RenderBlock key={idx} block={block} />
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select a snapshot to preview
              </div>
            )}
          </div>
        </div>
      )}
    </ResponsiveSheet>
  );
}
