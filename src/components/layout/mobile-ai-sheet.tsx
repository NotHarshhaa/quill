"use client";

import React, { useState } from "react";
import {
  Sparkles,
  FileText,
  CheckSquare,
  Wand2,
  Hash,
  Settings2,
  Loader2,
} from "lucide-react";
import { BottomSheet, SheetRow } from "@/components/ui/bottom-sheet";
import { AIAction } from "@/lib/ai/types";
import { AI_ACTIONS, useAIActions } from "@/lib/ai/useAIActions";
import { AIStatusModal } from "@/components/ai/ai-status-modal";
import { hapticTap } from "@/lib/ui/haptics";

const ACTION_ICONS: Record<AIAction, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  summarize: FileText,
  action_items: CheckSquare,
  polish: Wand2,
  tags: Hash,
};

export interface MobileAISheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  onChangeContent: (content: string) => void;
  disabled?: boolean;
}

/**
 * Phone "AI" bottom sheet. Same offline actions as the desktop dropdown,
 * presented as full-width rows that are comfortable to tap.
 */
export function MobileAISheet({
  open,
  onOpenChange,
  content,
  onChangeContent,
  disabled = false,
}: MobileAISheetProps) {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const { isProcessing, progress, run, provider } = useAIActions(content, onChangeContent);

  return (
    <>
      <BottomSheet
        open={open}
        onOpenChange={(next) => {
          // Never leave the nested status dialog orphaned behind a closed sheet
          if (!next) setIsStatusOpen(false);
          onOpenChange(next);
        }}
        title="Offline AI"
        icon={<Sparkles className="size-4 text-primary shrink-0" strokeWidth={1.75} />}
        badge={
          <span className="shrink-0 font-mono text-[10px] font-bold text-emerald-500">
            100% Local
          </span>
        }
        snapPoints={["half", "full"]}
        initialSnap="half"
        bodyClassName="px-1"
      >
        {isProcessing && (
          <div className="mx-2 mb-1.5 mt-1 flex items-center gap-2 border border-border/70 bg-muted/30 px-3 py-2 font-mono text-[11px] text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin text-primary" />
            <span>
              Working
              {progress.status === "downloading" && progress.progress
                ? ` · ${progress.progress}%`
                : ""}
            </span>
          </div>
        )}

        {AI_ACTIONS.map(({ action, title, description }) => (
          <SheetRow
            key={action}
            icon={ACTION_ICONS[action]}
            label={title}
            description={description}
            disabled={disabled || isProcessing}
            onClick={() => {
              hapticTap();
              run(action);
            }}
          />
        ))}

        <div className="my-1.5 h-px bg-border/60" />

        <SheetRow
          icon={Settings2}
          label="Model & WebGPU Status…"
          description={`${provider} Backend`}
          onClick={() => {
            hapticTap();
            setIsStatusOpen(true);
          }}
        />
      </BottomSheet>

      <AIStatusModal open={isStatusOpen} onOpenChange={setIsStatusOpen} />
    </>
  );
}
