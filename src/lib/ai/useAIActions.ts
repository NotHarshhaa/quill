"use client";

import { useEffect, useState } from "react";
import { aiEngine } from "@/lib/ai/aiEngine";
import { AIAction, AIModelProgress } from "@/lib/ai/types";
import { toast } from "sonner";

export interface AIActionDescriptor {
  action: AIAction;
  title: string;
  description: string;
}

/** Ordered list of offline AI actions shown in both the desktop menu and mobile sheet. */
export const AI_ACTIONS: AIActionDescriptor[] = [
  { action: "summarize", title: "TL;DR Summary", description: "Add key bullet takeaways" },
  { action: "action_items", title: "Extract Action Items", description: "Convert to - [ ] checklist" },
  { action: "polish", title: "Polish Structure", description: "Clean formatting & headings" },
  { action: "tags", title: "Suggest #Tags", description: "Extract topic keywords" },
];

export const AI_ACTION_LABELS: Record<AIAction, string> = {
  summarize: "Generating TL;DR Summary...",
  action_items: "Extracting Action Items...",
  polish: "Polishing Markdown Structure...",
  tags: "Suggesting Tags...",
};

/**
 * Shared offline-AI action runner. Owns the model progress subscription and
 * the note-mutation logic so the dropdown menu and the mobile bottom sheet
 * stay in lock-step.
 */
export function useAIActions(
  content: string,
  onChangeContent: (newContent: string) => void
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<AIModelProgress>({ status: "idle" });

  useEffect(() => {
    return aiEngine.subscribe(setProgress);
  }, []);

  const run = async (action: AIAction) => {
    if (!content.trim()) {
      toast.error("Note is empty. Add some text first!");
      return;
    }

    try {
      setIsProcessing(true);
      toast.info(AI_ACTION_LABELS[action]);

      const result = await aiEngine.execute(action, content);

      if (action === "summarize") {
        // Prepend TL;DR alert block at top of note
        const summaryBlock = `> [!NOTE] TL;DR\n${result.content
          .split("\n")
          .map((line) => (line.startsWith(">") ? line : `> ${line}`))
          .join("\n")}\n\n`;

        // If note starts with a # Title, place TL;DR after title
        const titleMatch = content.match(/^#\s+[^\n]+\n+/);
        if (titleMatch) {
          const title = titleMatch[0];
          const rest = content.slice(title.length);
          onChangeContent(`${title}${summaryBlock}${rest}`);
        } else {
          onChangeContent(`${summaryBlock}${content}`);
        }
        toast.success(`TL;DR added (${result.provider.toUpperCase()} in ${result.durationMs}ms)`);
      } else if (action === "action_items") {
        // Append action checklist at bottom
        const checklistBlock = `\n\n### Action Items\n${result.content}\n`;
        onChangeContent(content.trimEnd() + checklistBlock);
        toast.success(`Action items added (${result.provider.toUpperCase()} in ${result.durationMs}ms)`);
      } else if (action === "polish") {
        onChangeContent(result.content);
        toast.success(`Note polished (${result.provider.toUpperCase()} in ${result.durationMs}ms)`);
      } else if (action === "tags") {
        const tagsBlock = `\n\n${result.content}\n`;
        onChangeContent(content.trimEnd() + tagsBlock);
        toast.success(`Tags suggested: ${result.content}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI action encountered an error";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const provider = aiEngine.getPreferredProvider().toUpperCase();

  return { isProcessing, progress, run, provider };
}
