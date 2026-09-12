"use client";

import React, { useState, useEffect } from "react";
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
import {
  Sparkles,
  FileText,
  CheckSquare,
  Wand2,
  Hash,
  Settings2,
  Loader2,
} from "lucide-react";
import { aiEngine } from "@/lib/ai/aiEngine";
import { AIAction, AIModelProgress } from "@/lib/ai/types";
import { AIStatusModal } from "./ai-status-modal";
import { toast } from "sonner";

interface AIAssistantMenuProps {
  content: string;
  onChangeContent: (newContent: string) => void;
  disabled?: boolean;
}

export function AIAssistantMenu({
  content,
  onChangeContent,
  disabled = false,
}: AIAssistantMenuProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState<AIAction | null>(null);
  const [progress, setProgress] = useState<AIModelProgress>({ status: "idle" });

  useEffect(() => {
    const unsub = aiEngine.subscribe(setProgress);
    return () => unsub();
  }, []);

  const handleAction = async (action: AIAction) => {
    if (!content.trim()) {
      toast.error("Note is empty. Add some text first!");
      return;
    }

    try {
      setIsProcessing(true);
      setCurrentAction(action);

      const actionLabels: Record<AIAction, string> = {
        summarize: "Generating TL;DR Summary...",
        action_items: "Extracting Action Items...",
        polish: "Polishing Markdown Structure...",
        tags: "Suggesting Tags...",
      };
      toast.info(actionLabels[action]);

      const result = await aiEngine.execute(action, content);

      if (action === "summarize") {
        // Prepend TL;DR alert block at top of note
        const summaryBlock = `> [!NOTE] TL;DR\n${result.content
          .split("\n")
          .map((line) => (line.startsWith(">") ? line : `> ${line}`))
          .join("\n")}\n\n`;

        // If note starts with a # Title, place TL;DR after title
        const titleMatch = content.match(/^#\s+[^\n]+\n+/);
        let updated = "";
        if (titleMatch) {
          const title = titleMatch[0];
          const rest = content.slice(title.length);
          updated = `${title}${summaryBlock}${rest}`;
        } else {
          updated = `${summaryBlock}${content}`;
        }
        onChangeContent(updated);
        toast.success(`TL;DR added (${result.provider.toUpperCase()} in ${result.durationMs}ms)`);
      } else if (action === "action_items") {
        // Append action checklist at bottom
        const checklistBlock = `\n\n### Action Items\n${result.content}\n`;
        onChangeContent(content.trimEnd() + checklistBlock);
        toast.success(`Action items added (${result.provider.toUpperCase()} in ${result.durationMs}ms)`);
      } else if (action === "polish") {
        // Polish full markdown
        onChangeContent(result.content);
        toast.success(`Note polished (${result.provider.toUpperCase()} in ${result.durationMs}ms)`);
      } else if (action === "tags") {
        // Append tags to bottom of note
        const tagsBlock = `\n\n${result.content}\n`;
        onChangeContent(content.trimEnd() + tagsBlock);
        toast.success(`Tags suggested: ${result.content}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "AI action encountered an error");
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="xs"
            variant="ghost"
            disabled={disabled || isProcessing}
            className="relative h-7 px-2 border border-border/70 bg-card/40 hover:bg-muted/50 hover:border-border text-xs font-mono text-muted-foreground hover:text-foreground transition-all shadow-2xs rounded-none cursor-pointer group shrink-0 gap-1.5"
            aria-label="Offline AI Assistant"
          >
            <Corners
              size="sm"
              weight="thin"
              light
              className="opacity-30 group-hover:opacity-100 transition-opacity"
            />
            {isProcessing ? (
              <Loader2 className="size-3.5 text-primary animate-spin" />
            ) : (
              <Sparkles className="size-3.5 text-amber-500 group-hover:text-amber-400 transition-colors" />
            )}
            <span className="hidden md:inline font-sans text-xs text-foreground/80 group-hover:text-foreground">
              {isProcessing
                ? progress.status === "downloading"
                  ? `${progress.progress || 0}%`
                  : "Thinking..."
                : "AI Assistant"}
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-56 p-1.5 bg-card border-border/80 shadow-xl rounded-none font-sans text-xs relative"
        >
          <Corners size="sm" weight="thin" light />

          <DropdownMenuLabel className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Offline AI (WebGPU)</span>
            <span className="text-emerald-500 font-bold">100% Local</span>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="bg-border/60 my-1" />

          <DropdownMenuItem
            onClick={() => handleAction("summarize")}
            disabled={isProcessing}
            className="cursor-pointer gap-2 py-1.5 px-2 rounded-none hover:bg-muted/50 focus:bg-muted/50"
          >
            <FileText className="size-3.5 text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">TL;DR Summary</span>
              <span className="text-[10px] text-muted-foreground">Add key bullet takeaways</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleAction("action_items")}
            disabled={isProcessing}
            className="cursor-pointer gap-2 py-1.5 px-2 rounded-none hover:bg-muted/50 focus:bg-muted/50"
          >
            <CheckSquare className="size-3.5 text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">Extract Action Items</span>
              <span className="text-[10px] text-muted-foreground">Convert to - [ ] checklist</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleAction("polish")}
            disabled={isProcessing}
            className="cursor-pointer gap-2 py-1.5 px-2 rounded-none hover:bg-muted/50 focus:bg-muted/50"
          >
            <Wand2 className="size-3.5 text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">Polish Structure</span>
              <span className="text-[10px] text-muted-foreground">Clean formatting & headings</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleAction("tags")}
            disabled={isProcessing}
            className="cursor-pointer gap-2 py-1.5 px-2 rounded-none hover:bg-muted/50 focus:bg-muted/50"
          >
            <Hash className="size-3.5 text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">Suggest #Tags</span>
              <span className="text-[10px] text-muted-foreground">Extract topic keywords</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-border/60 my-1" />

          <DropdownMenuItem
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer gap-2 py-1.5 px-2 rounded-none hover:bg-muted/50 focus:bg-muted/50 text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="size-3.5 shrink-0" />
            <div className="flex flex-col">
              <span className="font-medium">Model & WebGPU Status...</span>
              <span className="text-[10px] text-muted-foreground/80 font-mono">
                {aiEngine.getPreferredProvider().toUpperCase()} Backend
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AIStatusModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
