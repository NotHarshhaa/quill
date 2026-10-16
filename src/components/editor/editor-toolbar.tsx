"use client";

import React from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListTodo,
  Quote,
  Table,
  Feather,
  Undo2,
  Redo2,
  Image as ImageIcon,
  Search as SearchIcon,
  MoreHorizontal,
} from "lucide-react";
import { Corners } from "@/components/frame";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuSeparator,
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
  isTypewriter: boolean;
  onToggleTypewriter: () => void;
  isFindOpen: boolean;
  onToggleFind: () => void;
}

const toolbarButton =
  "h-8 w-8 sm:h-7 sm:w-7 shrink-0 rounded-none text-muted-foreground hover:text-foreground";
const overflowItem =
  "gap-2.5 cursor-pointer normal-case tracking-normal font-sans";

/**
 * Editor formatting toolbar. PRIMARY formatting stays inline (always visible);
 * SECONDARY formatting + find/typewriter live behind the editor-local `⋯`
 * overflow so the row never becomes a wall of icons on small screens.
 */
export function EditorToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onInsert,
  onInsertImage,
  isTypewriter,
  onToggleTypewriter,
  isFindOpen,
  onToggleFind,
}: EditorToolbarProps) {
  return (
    <div className="h-14 sm:h-10 px-2 sm:px-3 md:px-4 border-b border-border/70 flex items-center justify-between select-none bg-background/50 gap-2 min-w-0">
      {/* Left Badge: hidden on mobile/tablet to maximize toolbar space */}
      <Badge
        variant="outline"
        className="relative text-[10px] tracking-widest font-mono font-semibold px-1.5 py-0.5 border border-border shrink-0 shadow-xs rounded-none bg-card/60 hidden lg:flex items-center"
      >
        <Corners size="sm" offset="border" weight="thin" light />
        <span className="hidden xl:inline">WRITE · </span>MARKDOWN
      </Badge>

      {/* Action Toolbar with Touch Targets, Full Side Scrollbar, & Blueprint Corners */}
      <TooltipProvider delayDuration={150}>
        <div className="flex-1 min-w-0 flex items-center justify-start sm:justify-end">
          <div className="horizontal-toolbar-scroll max-w-full py-2 sm:py-0.5 px-1.5">
            <div className="relative flex items-center gap-1 sm:gap-1.5 bg-card/85 p-0.5 border border-border/80 shadow-xs rounded-none w-max">
              <Corners size="sm" offset="border" weight="thin" light />

              {/* Group 1: Undo / Redo */}
              <div className="flex items-center gap-0.5 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={onUndo}
                      disabled={!canUndo}
                      className={cn(
                        toolbarButton,
                        "disabled:opacity-25 disabled:hover:bg-transparent"
                      )}
                      aria-label="Undo"
                    >
                      <Undo2 className="size-4 sm:size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-sans text-[11px]">
                    <span>Undo (Ctrl+Z)</span>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={onRedo}
                      disabled={!canRedo}
                      className={cn(
                        toolbarButton,
                        "disabled:opacity-25 disabled:hover:bg-transparent"
                      )}
                      aria-label="Redo"
                    >
                      <Redo2 className="size-4 sm:size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-sans text-[11px]">
                    <span>Redo (Ctrl+Y)</span>
                  </TooltipContent>
                </Tooltip>
              </div>

              <Separator orientation="vertical" className="h-4 mx-0.5 sm:mx-1 shrink-0 opacity-60" />

              {/* Group 2: Headings */}
              <div className="flex items-center gap-0.5 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onInsert("# ", "", "Heading")}
                      className="h-8 w-8 sm:h-7 sm:w-6.5 shrink-0 rounded-none text-muted-foreground hover:text-foreground font-mono font-bold text-xs sm:text-[11px]"
                      aria-label="Heading 1"
                    >
                      H1
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-sans text-[11px]">
                    <span>Heading 1</span>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onInsert("## ", "", "Heading")}
                      className="h-8 w-8 sm:h-7 sm:w-6.5 shrink-0 rounded-none text-muted-foreground hover:text-foreground font-mono font-semibold text-xs sm:text-[11px]"
                      aria-label="Heading 2"
                    >
                      H2
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-sans text-[11px]">
                    <span>Heading 2</span>
                  </TooltipContent>
                </Tooltip>
              </div>

              <Separator orientation="vertical" className="h-4 mx-0.5 sm:mx-1 shrink-0 opacity-60" />

              {/* Group 3: Inline Text Formatting (PRIMARY) */}
              <div className="flex items-center gap-0.5 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onInsert("**", "**", "bold text")}
                      className={toolbarButton}
                      aria-label="Bold"
                    >
                      <Bold className="size-4 sm:size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-sans text-[11px]">
                    <span>Bold (Ctrl+B)</span>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onInsert("*", "*", "italic text")}
                      className={toolbarButton}
                      aria-label="Italic"
                    >
                      <Italic className="size-4 sm:size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-sans text-[11px]">
                    <span>Italic (Ctrl+I)</span>
                  </TooltipContent>
                </Tooltip>
              </div>

              <Separator orientation="vertical" className="h-4 mx-0.5 sm:mx-1 shrink-0 opacity-60" />

              {/* Group 4: Structure (PRIMARY) */}
              <div className="flex items-center gap-0.5 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onInsert("- ", "", "item")}
                      className={toolbarButton}
                      aria-label="Bullet List"
                    >
                      <List className="size-4 sm:size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-sans text-[11px]">
                    <span>Bullet List</span>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onInsert("- [ ] ", "", "task")}
                      className={toolbarButton}
                      aria-label="Checklist Task"
                    >
                      <ListTodo className="size-4 sm:size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-sans text-[11px]">
                    <span>Task Checklist (- [ ])</span>
                  </TooltipContent>
                </Tooltip>
              </div>

              <Separator orientation="vertical" className="h-4 mx-0.5 sm:mx-1 shrink-0 opacity-60" />

              {/* Group 5: Overflow (SECONDARY formatting + find/typewriter) */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className={cn(toolbarButton, "shrink-0")}
                        aria-label="More formatting"
                      >
                        <MoreHorizontal className="size-4 sm:size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-sans text-[11px]">
                    <span>More formatting</span>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent
                  align="end"
                  className="w-56 min-w-56 font-sans text-xs rounded-none border border-border/80 bg-card/95 shadow-md p-1"
                >
                  <DropdownMenuItem
                    className={overflowItem}
                    onClick={() => onInsert("~~", "~~", "strikethrough text")}
                  >
                    <Strikethrough className="size-3.5 text-muted-foreground" />
                    <span>Strikethrough</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={overflowItem}
                    onClick={() => onInsert("`", "`", "code")}
                  >
                    <Code className="size-3.5 text-muted-foreground" />
                    <span>Inline code</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={overflowItem}
                    onClick={() => onInsert("> ", "", "quote")}
                  >
                    <Quote className="size-3.5 text-muted-foreground" />
                    <span>Blockquote</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={overflowItem}
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
                  <DropdownMenuItem
                    className={overflowItem}
                    onClick={() => onInsert("[[", "]]", "Note Title")}
                  >
                    <span className="size-3.5 shrink-0 flex items-center justify-center font-mono text-[10px] font-bold text-primary">
                      [[]]
                    </span>
                    <span>Wiki-link</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className={overflowItem} onClick={onInsertImage}>
                    <ImageIcon className="size-3.5 text-muted-foreground" />
                    <span>Insert image</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="border-border/50" />

                  <DropdownMenuItem
                    className={cn(overflowItem, isFindOpen && "text-primary")}
                    onClick={onToggleFind}
                  >
                    <SearchIcon className="size-3.5 text-muted-foreground" />
                    <span className="flex-1">Find &amp; replace</span>
                    <span className="text-[9.5px] font-mono text-muted-foreground">Ctrl+F</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(overflowItem, isTypewriter && "text-primary")}
                    onClick={onToggleTypewriter}
                  >
                    <Feather className="size-3.5 text-muted-foreground" />
                    <span className="flex-1">Typewriter scrolling</span>
                    {isTypewriter && (
                      <span className="text-[9.5px] font-mono text-primary">ON</span>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
