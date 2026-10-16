"use client";

import React from "react";
import { Download, Printer, Database, FileText } from "lucide-react";

import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { SheetLabel, SheetRow } from "@/components/ui/bottom-sheet";
import { Note } from "@/lib/storage/schema";
import { hapticTap } from "@/lib/ui/haptics";

export interface ExportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeNote?: Note;
  /** Download the active note as a `.md` file. */
  onDownloadMarkdown: () => void;
  /** Print / save the active note as PDF. */
  onPrint: () => void;
  /** Download every note as a single JSON backup. */
  onBackupAll: () => void;
}

/**
 * Export surface. A bottom sheet on phones and a right-side drawer on desktop,
 * sharing one row list so the two presentations never drift apart.
 */
export function ExportSheet({
  open,
  onOpenChange,
  activeNote,
  onDownloadMarkdown,
  onPrint,
  onBackupAll,
}: ExportSheetProps) {
  const close = () => onOpenChange(false);
  const run = (fn: () => void) => () => {
    hapticTap();
    fn();
    close();
  };
  const title = activeNote?.title || "Untitled";

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Export"
      icon={<Download className="size-4 text-primary" strokeWidth={1.75} />}
      badge={
        <span className="shrink-0 border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          .MD · PDF · JSON
        </span>
      }
      drawerWidth="sm"
      snapPoints={["half", "full"]}
      bodyClassName="py-1.5"
    >
      <div className="flex items-center gap-2 px-4 pb-1 pt-2 text-[10.5px] text-muted-foreground">
        <FileText className="size-3 shrink-0" strokeWidth={1.75} />
        <span className="truncate font-mono">
          {activeNote ? title : "No note selected"}
        </span>
      </div>

      <SheetLabel>This note</SheetLabel>
      <SheetRow
        icon={Download}
        label="Download .md"
        description="Plain markdown file with front-matter metadata"
        disabled={!activeNote}
        onClick={run(onDownloadMarkdown)}
      />
      <SheetRow
        icon={Printer}
        label="Print / PDF"
        hint="Ctrl+P"
        description="Send the rendered note to the print dialog"
        disabled={!activeNote}
        onClick={run(onPrint)}
      />

      <SheetLabel>Whole library</SheetLabel>
      <SheetRow
        icon={Database}
        label="Backup all notes"
        description="Single .json archive you can restore later"
        onClick={run(onBackupAll)}
      />
    </ResponsiveSheet>
  );
}
