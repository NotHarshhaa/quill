"use client";

import React from "react";
import {
  Bold,
  Italic,
  List,
  ListTodo,
  Link2,
  Plus,
  ChevronDown,
  Heading,
  Heading1,
  Heading2,
  Heading3,
  Undo2,
  Redo2,
  Table,
  Code,
  Quote,
  Strikethrough,
  Minus,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface EditorToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onInsert: (before: string, after?: string, placeholder?: string) => void;
  onInsertImage: () => void;
}

const buttonBase =
  "h-8 w-8 sm:h-7 sm:w-7 shrink-0 rounded-none text-muted-foreground hover:text-foreground";
const dropdownItem =
  "gap-2.5 cursor-pointer normal-case tracking-normal font-sans";

/**
 * Floating, sticky markdown formatting toolbar.
 *
 * Keeps only the highest-frequency formatting inline (Bold, Italic, Heading,
 * Bullet list, Checklist, Link) plus an "Insert +" dropdown. Everything else
 * (table, image, code block, quote, wiki-link, strikethrough, horizontal rule)
 * lives in Insert + or the `/` slash-command menu. Undo/redo stay in the bar on
 * desktop and move to the app top bar on phones.
 */
export function EditorToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onInsert,
  onInsertImage,
}: EditorToolbarProps) {
  return (
    <div className="shrink-0 sticky top-0 z-20 px-2 sm:px-3 py-1.5 flex items-center justify-start sm:justify-end select-none">
      <TooltipProvider delayDuration={150}>
        <div
          role="toolbar"
          aria-label="Markdown formatting"
          aria-orientation="horizontal"
          className="flex flex-wrap items-center gap-0.5 max-w-full bg-card/90 backdrop-blur-sm shadow-soft-md px-1 py-0.5 rounded-none ds-panel-md"
        >
          {/* Undo / Redo — desktop only. Phones get undo/redo from the keyboard
              accessory bar and keep this pill on a single row. */}
          <div className="hidden sm:flex items-center gap-0.5">
            <ToolbarButton
              icon={Undo2}
              label="Undo"
              shortcut="Ctrl+Z"
              onClick={onUndo}
              disabled={!canUndo}
            />
            <ToolbarButton
              icon={Redo2}
              label="Redo"
              shortcut="Ctrl+Y"
              onClick={onRedo}
              disabled={!canRedo}
            />
            <Separator orientation="vertical" className="h-4 mx-0.5 shrink-0 opacity-60" />
          </div>

          {/* Heading dropdown (H1/H2/H3) */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Heading"
                    className={cn(buttonBase, "w-auto px-1.5 gap-0.5")}
                  >
                    <Heading className="size-4 sm:size-3.5" />
                    <ChevronDown className="size-2.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans text-[11px]">
                <span>Heading</span>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              align="start"
              className="w-40 min-w-40 font-sans text-xs rounded-none border border-border/80 bg-card/95 shadow-md p-1"
            >
              <DropdownMenuItem className={dropdownItem} onClick={() => onInsert("# ", "", "Heading 1")}>
                <Heading1 className="size-3.5 text-muted-foreground" />
                <span>Heading 1</span>
              </DropdownMenuItem>
              <DropdownMenuItem className={dropdownItem} onClick={() => onInsert("## ", "", "Heading 2")}>
                <Heading2 className="size-3.5 text-muted-foreground" />
                <span>Heading 2</span>
              </DropdownMenuItem>
              <DropdownMenuItem className={dropdownItem} onClick={() => onInsert("### ", "", "Heading 3")}>
                <Heading3 className="size-3.5 text-muted-foreground" />
                <span>Heading 3</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-4 mx-0.5 shrink-0 opacity-60" />

          {/* Inline text formatting */}
          <ToolbarButton
            icon={Bold}
            label="Bold"
            shortcut="Ctrl+B"
            onClick={() => onInsert("**", "**", "bold text")}
          />
          <ToolbarButton
            icon={Italic}
            label="Italic"
            shortcut="Ctrl+I"
            onClick={() => onInsert("*", "*", "italic text")}
          />

          <Separator orientation="vertical" className="h-4 mx-0.5 shrink-0 opacity-60" />

          {/* Structure */}
          <ToolbarButton
            icon={List}
            label="Bullet list"
            onClick={() => onInsert("- ", "", "item")}
          />
          <ToolbarButton
            icon={ListTodo}
            label="Checklist"
            onClick={() => onInsert("- [ ] ", "", "task")}
          />
          <ToolbarButton
            icon={Link2}
            label="Link"
            onClick={() => onInsert("[", "](url)", "text")}
          />

          <Separator orientation="vertical" className="h-4 mx-0.5 shrink-0 opacity-60" />

          {/* Insert + dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Insert"
                    className={cn(buttonBase, "w-auto px-1.5 gap-0.5")}
                  >
                    <Plus className="size-4 sm:size-3.5" />
                    <ChevronDown className="size-2.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans text-[11px]">
                <span>Insert</span>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              align="end"
              className="w-56 min-w-56 font-sans text-xs rounded-none border border-border/80 bg-card/95 shadow-md p-1"
            >
              <DropdownMenuItem
                className={dropdownItem}
                onClick={() =>
                  onInsert(
                    "\n| Column 1 | Column 2 |\n| :--- | :--- |\n| Row 1 | Data |\n| Row 2 | Data |\n",
                    "",
                    ""
                  )
                }
              >
                <Table className="size-3.5 text-muted-foreground" />
                <span>Table</span>
              </DropdownMenuItem>
              <DropdownMenuItem className={dropdownItem} onClick={onInsertImage}>
                <ImageIcon className="size-3.5 text-muted-foreground" />
                <span>Image</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={dropdownItem}
                onClick={() => onInsert("```\n", "\n```", "code")}
              >
                <Code className="size-3.5 text-muted-foreground" />
                <span>Code block</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={dropdownItem}
                onClick={() => onInsert("> ", "", "quote")}
              >
                <Quote className="size-3.5 text-muted-foreground" />
                <span>Quote</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={dropdownItem}
                onClick={() => onInsert("[[", "]]", "Note Title")}
              >
                <span className="size-3.5 shrink-0 flex items-center justify-center font-mono text-[10px] font-bold text-primary">
                  [[]]
                </span>
                <span>Wiki-link</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={dropdownItem}
                onClick={() => onInsert("~~", "~~", "strikethrough text")}
              >
                <Strikethrough className="size-3.5 text-muted-foreground" />
                <span>Strikethrough</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={dropdownItem}
                onClick={() => onInsert("\n---\n\n", "", "")}
              >
                <Minus className="size-3.5 text-muted-foreground" />
                <span>Horizontal rule</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TooltipProvider>
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  shortcut,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className={cn(
            buttonBase,
            disabled && "disabled:opacity-25 disabled:hover:bg-transparent"
          )}
        >
          <Icon className="size-4 sm:size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="font-sans text-[11px]">
        <span>
          {label}
          {shortcut ? ` (${shortcut})` : ""}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
