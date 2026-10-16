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
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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

  const close = () => onOpenChange(false);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="fixed left-0 right-0 bottom-0 top-auto z-50 w-full max-w-none sm:max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-t border-border/80 bg-card p-0 font-sans"
          style={{ top: "auto", bottom: 0, maxHeight: "85dvh", paddingBottom: "var(--safe-bottom)" }}
        >
          <DialogTitle className="sr-only">AI Assistant</DialogTitle>

          <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="size-4 text-primary shrink-0" strokeWidth={1.75} />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                Offline AI
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-500">100% Local</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              aria-label="Close AI assistant"
              className="size-9 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="size-4" strokeWidth={1.75} />
            </Button>
          </div>

          <div className="overflow-y-auto px-1 py-1.5">
            {isProcessing && (
              <div className="mx-2 mb-1.5 mt-1 flex items-center gap-2 border border-border/70 bg-muted/30 px-3 py-2 text-[11px] font-mono text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span>
                  Working
                  {progress.status === "downloading" && progress.progress
                    ? ` · ${progress.progress}%`
                    : ""}
                </span>
              </div>
            )}

            {AI_ACTIONS.map(({ action, title, description }) => {
              const Icon = ACTION_ICONS[action];
              return (
                <button
                  key={action}
                  type="button"
                  disabled={disabled || isProcessing}
                  onClick={() => {
                    hapticTap();
                    run(action);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 text-left transition-colors motion-reduce:transition-none hover:bg-muted/50 disabled:opacity-40 disabled:pointer-events-none min-h-[44px]"
                >
                  <Icon className="size-4 text-primary shrink-0" strokeWidth={1.75} />
                  <span className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-foreground">{title}</span>
                    <span className="text-[10.5px] text-muted-foreground">{description}</span>
                  </span>
                </button>
              );
            })}

            <div className="h-px bg-border/60 my-1.5" />

            <button
              type="button"
              onClick={() => {
                hapticTap();
                setIsStatusOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 text-left transition-colors motion-reduce:transition-none hover:bg-muted/50 min-h-[44px]"
            >
              <Settings2 className="size-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
              <span className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-foreground">
                  Model &amp; WebGPU Status...
                </span>
                <span className="text-[10.5px] font-mono text-muted-foreground/80">
                  {provider} Backend
                </span>
              </span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <AIStatusModal open={isStatusOpen} onOpenChange={setIsStatusOpen} />
    </>
  );
}
