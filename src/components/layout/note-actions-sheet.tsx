"use client";

import React from "react";
import { Pin, PinOff, Copy, Trash2, FileText } from "lucide-react";

import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { SheetRow } from "@/components/ui/bottom-sheet";
import { Note } from "@/lib/storage/schema";
import { hapticTap } from "@/lib/ui/haptics";

export interface NoteActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: Note;
  onTogglePin: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMoveToTrash: (id: string) => void;
}

/**
 * Phone presentation of a note's "···" actions. The desktop/tablet rail keeps
 * its anchored dropdown; on touch devices the same three actions open as a
 * bottom sheet so they sit under the thumb.
 */
export function NoteActionsSheet({
  open,
  onOpenChange,
  note,
  onTogglePin,
  onDuplicate,
  onMoveToTrash,
}: NoteActionsSheetProps) {
  const close = () => onOpenChange(false);
  const run = (fn: (id: string) => void) => () => {
    if (!note) return;
    hapticTap();
    fn(note.id);
    close();
  };

  return (
    <ResponsiveSheet
      open={open && !!note}
      onOpenChange={onOpenChange}
      title="Note actions"
      icon={<FileText className="size-icon text-brand" strokeWidth={1.75} />}
      drawerWidth="sm"
      snapPoints={["half", "full"]}
      bodyClassName="py-1.5"
    >
      <div className="truncate px-4 pb-1 pt-2 font-mono text-[10.5px] text-muted-foreground">
        {note?.title || "Untitled"}
      </div>

      <SheetRow
        icon={note?.isPinned ? PinOff : Pin}
        label={note?.isPinned ? "Unpin" : "Pin to top"}
        description={note?.isPinned ? "Return to its date group" : "Keep at the top of the list"}
        onClick={run(onTogglePin)}
      />
      <SheetRow
        icon={Copy}
        label="Duplicate"
        description="Create a copy of this note"
        onClick={run(onDuplicate)}
      />
      <SheetRow
        icon={Trash2}
        label="Move to trash"
        description="Recoverable from the Trash panel"
        destructive
        onClick={run(onMoveToTrash)}
      />
    </ResponsiveSheet>
  );
}
