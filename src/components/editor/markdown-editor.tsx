"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListTodo,
  Quote,
  Heading1,
  Heading2,
  Table,
  Feather,
  Undo2,
  Redo2,
  Image as ImageIcon,
  Search as SearchIcon,
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
import { SlashCommandMenu, SlashCommand } from "./slash-command-menu";
import { FindReplaceBar } from "./find-replace-bar";
import { mediaRepository } from "@/lib/storage/mediaRepository";
import { toast } from "sonner";

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
}

export function MarkdownEditor({ content, onChange }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [isTypewriter, setIsTypewriter] = useState(false);
  const [isFindOpen, setIsFindOpen] = useState(false);

  // Slash Command State
  const [slashMenu, setSlashMenu] = useState<{
    isOpen: boolean;
    query: string;
    slashIndex: number;
    position: { top: number; left: number };
  }>({
    isOpen: false,
    query: "",
    slashIndex: -1,
    position: { top: 60, left: 24 },
  });

  // Undo / Redo History Stack
  const historyRef = useRef<string[]>([content]);
  const historyIndexRef = useRef<number>(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const isInternalChangeRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync history if note was switched externally
  useEffect(() => {
    if (!isInternalChangeRef.current) {
      historyRef.current = [content];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    }
    isInternalChangeRef.current = false;
  }, [content]);

  // Push new state to history
  const pushHistory = (newVal: string, immediate = false) => {
    isInternalChangeRef.current = true;
    onChange(newVal);

    const updateStack = () => {
      const history = historyRef.current.slice(0, historyIndexRef.current + 1);
      if (history[history.length - 1] !== newVal) {
        history.push(newVal);
        if (history.length > 50) history.shift();
        historyRef.current = history;
        historyIndexRef.current = history.length - 1;
        setCanUndo(historyIndexRef.current > 0);
        setCanRedo(false);
      }
    };

    if (immediate) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      updateStack();
    } else {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(updateStack, 450);
    }
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      const newIdx = historyIndexRef.current - 1;
      historyIndexRef.current = newIdx;
      const prevVal = historyRef.current[newIdx];
      isInternalChangeRef.current = true;
      onChange(prevVal);
      setCanUndo(newIdx > 0);
      setCanRedo(true);
      setTimeout(() => {
        textareaRef.current?.focus();
        handleCursorScroll();
      }, 0);
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      const newIdx = historyIndexRef.current + 1;
      historyIndexRef.current = newIdx;
      const nextVal = historyRef.current[newIdx];
      isInternalChangeRef.current = true;
      onChange(nextVal);
      setCanUndo(true);
      setCanRedo(newIdx < historyRef.current.length - 1);
      setTimeout(() => {
        textareaRef.current?.focus();
        handleCursorScroll();
      }, 0);
    }
  };

  const handleCursorScroll = () => {
    if (!isTypewriter || !textareaRef.current || !scrollContainerRef.current) return;
    const textarea = textareaRef.current;
    const container = scrollContainerRef.current;
    const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);
    const lineCount = textBeforeCursor.split("\n").length;
    const approxLineHeight = 24;
    const targetScroll = lineCount * approxLineHeight - container.clientHeight / 2;
    container.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: "smooth",
    });
  };

  const insertSnippet = (before: string, after: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || placeholder;

    const newContent =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);

    pushHistory(newContent, true);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
      handleCursorScroll();
    }, 0);
  };

  // Detect `/` on current line to trigger slash command popup
  const checkSlashCommand = (currentText: string, cursorIndex: number) => {
    const textBefore = currentText.substring(0, cursorIndex);
    const lastNewline = textBefore.lastIndexOf("\n");
    const lineBeforeCursor = textBefore.substring(lastNewline + 1);

    const slashMatch = lineBeforeCursor.match(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/);
    if (slashMatch) {
      const matchOffset = lineBeforeCursor.lastIndexOf("/");
      const absoluteSlashIndex = lastNewline + 1 + matchOffset;
      const query = slashMatch[1] || "";

      const lineCount = textBefore.split("\n").length;
      const approxTop = Math.min(
        Math.max(50, lineCount * 24 + 30 - (scrollContainerRef.current?.scrollTop || 0)),
        (scrollContainerRef.current?.clientHeight || 450) - 220
      );

      setSlashMenu({
        isOpen: true,
        query,
        slashIndex: absoluteSlashIndex,
        position: { top: Math.max(45, approxTop), left: 24 },
      });
    } else {
      if (slashMenu.isOpen) {
        setSlashMenu((prev) => ({ ...prev, isOpen: false }));
      }
    }
  };

  const handleSelectSlashCommand = (cmd: SlashCommand) => {
    if (cmd.id === "image") {
      setSlashMenu((prev) => ({ ...prev, isOpen: false }));
      imageInputRef.current?.click();
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = slashMenu.slashIndex >= 0 ? slashMenu.slashIndex : textarea.selectionStart;
    const end = textarea.selectionStart;

    const before = content.substring(0, start);
    const after = content.substring(end);
    const snippet = cmd.snippet;
    const newContent = before + snippet + after;

    pushHistory(newContent, true);
    setSlashMenu((prev) => ({ ...prev, isOpen: false }));

    setTimeout(() => {
      textarea.focus();
      const newCursor = start + snippet.length;
      textarea.setSelectionRange(newCursor, newCursor);
      handleCursorScroll();
    }, 0);
  };

  // Image Upload, Paste & Drop Handler
  const handleUploadImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please provide an image file");
      return;
    }

    try {
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      const { uri } = await mediaRepository.saveImage(file, cleanName);
      const snippet = `\n![${cleanName || "Visual"}](${uri})\n`;
      insertSnippet(snippet, "", "");
      toast.success(`Image "${cleanName || "Visual"}" stored locally`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to store image offline");
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            handleUploadImageFile(file);
          }
          return;
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length > 0) {
        e.preventDefault();
        imageFiles.forEach((file) => handleUploadImageFile(file));
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Undo: Ctrl+Z / Cmd+Z (without shift)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
      return;
    }

    // Redo: Ctrl+Y / Cmd+Y or Ctrl+Shift+Z / Cmd+Shift+Z
    if (
      ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") ||
      ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "z")
    ) {
      e.preventDefault();
      handleRedo();
      return;
    }

    // Find & Replace: Ctrl+F / Cmd+F or Ctrl+H / Cmd+H
    if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === "f" || e.key.toLowerCase() === "h")) {
      e.preventDefault();
      setIsFindOpen(true);
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      insertSnippet("**", "**", "bold text");
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      insertSnippet("*", "*", "italic text");
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      insertSnippet("  ");
      return;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background border-r border-border/70 overflow-hidden relative font-sans">
      <Corners size="sm" offset="border" weight="thin" light />

      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadImageFile(file);
          e.target.value = "";
        }}
        className="hidden"
      />

      {/* Editor Header Bar with comfortable mobile height */}
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
                        onClick={handleUndo}
                        disabled={!canUndo}
                        className="h-8 w-8 sm:h-7 sm:w-7 shrink-0 rounded-none text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:hover:bg-transparent"
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
                        onClick={handleRedo}
                        disabled={!canRedo}
                        className="h-8 w-8 sm:h-7 sm:w-7 shrink-0 rounded-none text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:hover:bg-transparent"
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
                        onClick={() => insertSnippet("# ", "", "Heading")}
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
                        onClick={() => insertSnippet("## ", "", "Heading")}
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

                {/* Group 3: Inline Text Formatting */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => insertSnippet("**", "**", "bold text")}
                        className="h-8 w-8 sm:h-7 sm:w-7 shrink-0 rounded-none text-muted-foreground hover:text-foreground"
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
                        onClick={() => insertSnippet("*", "*", "italic text")}
                        className="h-8 w-8 sm:h-7 sm:w-7 shrink-0 rounded-none text-muted-foreground hover:text-foreground"
                        aria-label="Italic"
                      >
                        <Italic className="size-4 sm:size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-sans text-[11px]">
                      <span>Italic (Ctrl+I)</span>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => insertSnippet("~~", "~~", "strikethrough text")}
                        className="h-8 w-8 sm:h-7 sm:w-7 shrink-0 rounded-none text-muted-foreground hover:text-foreground"
                        aria-label="Strikethrough"
                      >
                        <Strikethrough className="size-4 sm:size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-sans text-[11px]">
                      <span>Strikethrough (~~text~~)</span>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => insertSnippet("`", "`", "code")}
                        className="h-8 w-8 sm:h-7 sm:w-7 shrink-0 rounded-none text-muted-foreground hover:text-foreground"
                        aria-label="Inline Code"
                      >
                        <Code className="size-4 sm:size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-sans text-[11px]">
                      <span>Inline Code (`code`)</span>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <Separator orientation="vertical" className="h-4 mx-0.5 sm:mx-1 shrink-0 opacity-60" />

                {/* Group 4: Structure, Tables & Media */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => insertSnippet("- ", "", "item")}
                        className="h-8 w-8 sm:h-7 sm:w-7 shrink-0 rounded-none text-muted-foreground hover:text-foreground"
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
                        onClick={() => insertSnippet("- [ ] ", "", "task")}
                        className="h-8 w-8 sm:h-7 sm:w-7 shrink-0 rounded-none text-muted-foreground hover:text-foreground"
                        aria-label="Checklist Task"
                      >
                        <ListTodo className="size-4 sm:size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-sans text-[11px]">
                      <span>Task Checklist (- [ ])</span>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => insertSnippet("> ", "", "quote")}
                        className="h-8 w-8 sm:h-7 sm:w-7 shrink-0 rounded-none text-muted-foreground hover:text-foreground"
                        aria-label="Blockquote"
                      >
                        <Quote className="size-4 sm:size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-sans text-[11px]">
                      <span>Blockquote (&gt; text)</span>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() =>
                          insertSnippet(
                            "\n| Column 1 | Column 2 |\n| :--- | :--- |\n| Row 1 | Data |\n| Row 2 | Data |\n",
                            "",
                            ""
                          )
                        }
                        className="h-8 w-8 sm:h-7 sm:w-7 shrink-0 rounded-none text-muted-foreground hover:text-foreground"
                        aria-label="Table"
                      >
                        <Table className="size-4 sm:size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-sans text-[11px]">
                      <span>Data Table</span>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => insertSnippet("[[", "]]", "Note Title")}
                        className="h-8 w-8 sm:h-7 sm:w-7 shrink-0 rounded-none text-primary hover:text-primary hover:bg-primary/10 flex items-center justify-center font-mono text-[10.5px] sm:text-[10px] font-bold"
                        aria-label="Wiki-link"
                      >
                        {"[[]]"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-sans text-[11px]">
                      <span>Wiki-link ([[Note Title]])</span>
                    </TooltipContent>
                  </Tooltip>

                  {/* Insert Image */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => imageInputRef.current?.click()}
                        className="h-8 w-8 sm:h-7 sm:w-7 shrink-0 rounded-none text-muted-foreground hover:text-foreground"
                        aria-label="Insert Image"
                      >
                        <ImageIcon className="size-4 sm:size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-sans text-[11px]">
                      <span>Insert Image (Upload or Paste)</span>
                    </TooltipContent>
                  </Tooltip>

                  {/* Find & Replace */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setIsFindOpen((prev) => !prev)}
                        className={`h-8 w-8 sm:h-7 sm:w-7 shrink-0 rounded-none transition-colors ${
                          isFindOpen ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                        aria-label="Find and Replace"
                      >
                        <SearchIcon className="size-4 sm:size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-sans text-[11px]">
                      <span>Find & Replace (Ctrl+F)</span>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <Separator orientation="vertical" className="h-4 mx-0.5 sm:mx-1 shrink-0 opacity-60" />

                {/* Group 5: Focus / Typewriter Mode */}
                <div className="flex items-center shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setIsTypewriter((prev) => !prev)}
                        className={`h-8 w-8 sm:h-7 sm:w-7 shrink-0 rounded-none flex items-center justify-center transition-all ${
                          isTypewriter
                            ? "bg-primary/15 text-primary border border-primary/40 font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        aria-label="Typewriter Scrolling"
                      >
                        <Feather className="size-4 sm:size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-sans text-[11px]">
                      <span>
                        {isTypewriter
                          ? "Disable Typewriter Mode"
                          : "Enable Typewriter Scrolling Mode"}
                      </span>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </div>

      {/* Find & Replace Bar Dock */}
      <FindReplaceBar
        isOpen={isFindOpen}
        onClose={() => setIsFindOpen(false)}
        content={content}
        onReplace={(newVal) => pushHistory(newVal, true)}
        onHighlightMatch={(start, end) => {
          const textarea = textareaRef.current;
          if (textarea) {
            textarea.focus();
            textarea.setSelectionRange(start, end);
          }
        }}
      />

      {/* Editor Textarea with Typewriter Scrolling Mode, Slash Commands & Image Drag/Paste */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 p-3.5 sm:p-6 overflow-y-auto relative ${
          isTypewriter ? "pb-[50vh]" : ""
        }`}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            pushHistory(e.target.value, false);
            handleCursorScroll();
            checkSlashCommand(e.target.value, e.target.selectionStart);
          }}
          onClick={(e) => {
            handleCursorScroll();
            checkSlashCommand(content, (e.target as HTMLTextAreaElement).selectionStart);
          }}
          onKeyUp={(e) => {
            handleCursorScroll();
            checkSlashCommand(content, (e.target as HTMLTextAreaElement).selectionStart);
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onDrop={handleDrop}
          placeholder="Start typing in markdown, or type / for quick elements..."
          spellCheck={false}
          className="w-full h-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground/40 font-mono text-[14px] leading-relaxed focus:outline-none"
        />

        {/* Floating Slash Command Menu */}
        <SlashCommandMenu
          isOpen={slashMenu.isOpen}
          query={slashMenu.query}
          onSelect={handleSelectSlashCommand}
          onClose={() => setSlashMenu((prev) => ({ ...prev, isOpen: false }))}
          position={slashMenu.position}
        />
      </div>
    </div>
  );
}
