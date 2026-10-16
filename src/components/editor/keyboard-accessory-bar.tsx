"use client";

import React from "react";
import { Bold, Italic, List, ListTodo, Link2, Undo2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { emitEditorCommand } from "@/lib/editor/editorCommands";
import { useEditorState } from "@/hooks/useEditorState";
import { hapticTap } from "@/lib/ui/haptics";

interface KeyboardAccessoryBarProps {
  /** Blur the focused field to dismiss the soft keyboard. */
  onDismiss?: () => void;
}

/**
 * Compact formatting strip docked directly above the on-screen keyboard while
 * the user is typing on a phone. Replaces the bottom tab bar so the two never
 * fight for the same space. Buttons keep focus in the textarea via
 * `onPointerDown` preventDefault.
 */
export function KeyboardAccessoryBar({ onDismiss }: KeyboardAccessoryBarProps) {
  const { mounted, canUndo } = useEditorState();

  const keepFocus = (e: React.PointerEvent) => e.preventDefault();

  const action = (command: Parameters<typeof emitEditorCommand>[0]) => (
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    hapticTap();
    emitEditorCommand(command);
  };

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="h-12 border-t border-border/80 bg-card/95 backdrop-blur-sm flex items-center gap-0.5 px-1.5 no-scrollbar overflow-x-auto"
    >
      <BarButton label="Bold" icon={Bold} onPointerDown={keepFocus} onClick={action("bold")} />
      <BarButton label="Italic" icon={Italic} onPointerDown={keepFocus} onClick={action("italic")} />
      <BarButton label="Bullet list" icon={List} onPointerDown={keepFocus} onClick={action("bullet")} />
      <BarButton
        label="Checklist"
        icon={ListTodo}
        onPointerDown={keepFocus}
        onClick={action("checklist")}
      />
      <BarButton label="Link" icon={Link2} onPointerDown={keepFocus} onClick={action("link")} />
      <BarButton
        label="Undo"
        icon={Undo2}
        onPointerDown={keepFocus}
        onClick={action("undo")}
        disabled={!mounted || !canUndo}
      />

      <div className="flex-1 min-w-2" />

      <BarButton
        label="Dismiss keyboard"
        icon={ChevronDown}
        onPointerDown={keepFocus}
        onClick={(e) => {
          e.preventDefault();
          hapticTap();
          onDismiss?.();
        }}
      />
    </div>
  );
}

function BarButton({
  label,
  icon: Icon,
  onClick,
  onPointerDown,
  disabled,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  onClick: (e: React.MouseEvent) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onPointerDown={onPointerDown}
      onClick={onClick}
      className={cn(
        "flex size-10 shrink-0 items-center justify-center text-muted-foreground transition-colors motion-reduce:transition-none hover:text-foreground active:bg-muted rounded-none",
        disabled && "opacity-30 pointer-events-none"
      )}
    >
      <Icon className="size-[18px]" strokeWidth={1.75} />
    </button>
  );
}
