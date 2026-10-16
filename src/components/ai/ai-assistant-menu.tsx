"use client";

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Corners } from "@/components/frame";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, FileText, CheckSquare, Wand2, Hash, Settings2, Loader2 } from "lucide-react";
import { AIAction } from "@/lib/ai/types";
import { AI_ACTIONS, useAIActions } from "@/lib/ai/useAIActions";
import { AIStatusModal } from "./ai-status-modal";

interface AIAssistantMenuProps {
  content: string;
  onChangeContent: (newContent: string) => void;
  disabled?: boolean;
}

const ACTION_ICONS: Record<AIAction, React.ComponentType<{ className?: string }>> = {
  summarize: FileText,
  action_items: CheckSquare,
  polish: Wand2,
  tags: Hash,
};

export function AIAssistantMenu({
  content,
  onChangeContent,
  disabled = false,
}: AIAssistantMenuProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isProcessing, progress, run, provider } = useAIActions(content, onChangeContent);

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                disabled={disabled || isProcessing}
                className="relative size-9 rounded-none bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shrink-0"
                aria-label="AI Assistant"
              >
                {isProcessing ? (
                  <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
                ) : (
                  <Sparkles className="size-4 text-primary-foreground" strokeWidth={1.75} />
                )}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="font-sans text-xs">
            AI Assistant
            {isProcessing && progress.status === "downloading" ? ` · ${progress.progress || 0}%` : ""}
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent
          align="end"
          className="w-56 max-w-[calc(100vw-1.5rem)] p-1.5 bg-card border-border/80 shadow-xl rounded-none font-sans text-xs relative"
        >
          <Corners size="sm" weight="thin" light />

          <DropdownMenuLabel className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Offline AI</span>
            <span className="text-emerald-500 font-bold">100% Local</span>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="bg-border/60 my-1" />

          {AI_ACTIONS.map(({ action, title, description }) => {
            const Icon = ACTION_ICONS[action];
            return (
              <DropdownMenuItem
                key={action}
                onClick={() => run(action)}
                disabled={isProcessing}
                className="cursor-pointer gap-2.5 py-2 sm:py-1.5 px-2.5 sm:px-2 rounded-none hover:bg-muted/50 focus:bg-muted/50 min-h-[36px] sm:min-h-0"
              >
                <Icon className="size-3.5 text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">{title}</span>
                  <span className="text-[10px] text-muted-foreground">{description}</span>
                </div>
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator className="bg-border/60 my-1" />

          <DropdownMenuItem
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer gap-2 py-1.5 px-2 rounded-none hover:bg-muted/50 focus:bg-muted/50 text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="size-3.5 shrink-0" />
            <div className="flex flex-col">
              <span className="font-medium">Model &amp; WebGPU Status...</span>
              <span className="text-[10px] text-muted-foreground/80 font-mono">
                {provider} Backend
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AIStatusModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
