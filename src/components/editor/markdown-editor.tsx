"use client";

import React, { useRef, useState } from "react";
import { Bold, Italic, Code, List, ListTodo, Quote, Heading1, Heading2, Table, Feather, Link2 } from "lucide-react";
import { Corners } from "@/components/frame";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
}

export function MarkdownEditor({ content, onChange }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isTypewriter, setIsTypewriter] = useState(false);

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

    onChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
      handleCursorScroll();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "b") {
      e.preventDefault();
      insertSnippet("**", "**", "bold text");
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "i") {
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
      {/* Editor Header Bar */}
      <div className="h-10 px-3 sm:px-6 border-b border-border/70 flex items-center justify-between select-none bg-background/50 gap-2">
        <Badge variant="outline" className="relative text-[10px] tracking-widest font-mono font-semibold px-1.5 py-0.5 border border-border shrink-0 shadow-xs">
          <Corners size="sm" offset="border" weight="thin" light />
          <span className="hidden sm:inline">WRITE · </span>MARKDOWN
        </Badge>

        {/* Quick format action buttons using shadcn Button */}
        <div className="relative flex items-center gap-0.5 sm:gap-1 text-muted-foreground overflow-x-auto no-scrollbar bg-card/80 p-0.5 border border-border/80 shadow-xs">
          <Corners size="sm" offset="border" weight="thin" light />
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => insertSnippet("# ", "", "Heading")}
            className="text-muted-foreground hover:text-foreground"
            title="Heading 1"
          >
            <Heading1 className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => insertSnippet("## ", "", "Heading")}
            className="text-muted-foreground hover:text-foreground"
            title="Heading 2"
          >
            <Heading2 className="size-3.5" />
          </Button>
          <Separator orientation="vertical" className="h-3.5 mx-0.5" />
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => insertSnippet("**", "**", "bold text")}
            className="text-muted-foreground hover:text-foreground"
            title="Bold (Ctrl+B)"
          >
            <Bold className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => insertSnippet("*", "*", "italic text")}
            className="text-muted-foreground hover:text-foreground"
            title="Italic (Ctrl+I)"
          >
            <Italic className="size-3.5" />
          </Button>
          <Separator orientation="vertical" className="h-3.5 mx-0.5" />
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => insertSnippet("- ", "", "item")}
            className="text-muted-foreground hover:text-foreground"
            title="List"
          >
            <List className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => insertSnippet("- [ ] ", "", "task")}
            className="text-muted-foreground hover:text-foreground"
            title="Checklist (- [ ])"
          >
            <ListTodo className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => insertSnippet("> ", "", "quote")}
            className="text-muted-foreground hover:text-foreground"
            title="Quote"
          >
            <Quote className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => insertSnippet("`", "`", "code")}
            className="text-muted-foreground hover:text-foreground"
            title="Inline Code"
          >
            <Code className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => insertSnippet("\n| Column 1 | Column 2 |\n| :--- | :--- |\n| Row 1 | Data |\n| Row 2 | Data |\n", "", "")}
            className="text-muted-foreground hover:text-foreground"
            title="Table"
          >
            <Table className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => insertSnippet("[[", "]]", "Note Title")}
            className="text-muted-foreground hover:text-foreground font-mono text-[10.5px] font-bold px-1"
            title="Wiki-link ([[Note Title]])"
          >
            {"[[ ]]"}
          </Button>
          <Separator orientation="vertical" className="h-3.5 mx-0.5" />
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsTypewriter((prev) => !prev)}
            className={
              isTypewriter
                ? "text-primary bg-primary/15 hover:bg-primary/25"
                : "text-muted-foreground hover:text-foreground"
            }
            title={isTypewriter ? "Disable Typewriter Mode" : "Enable Typewriter Scrolling Mode"}
          >
            <Feather className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Editor Textarea with Typewriter Scrolling Mode support */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 p-3.5 sm:p-6 overflow-y-auto ${isTypewriter ? "pb-[50vh]" : ""}`}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            onChange(e.target.value);
            handleCursorScroll();
          }}
          onClick={handleCursorScroll}
          onKeyUp={handleCursorScroll}
          onKeyDown={handleKeyDown}
          placeholder="Start typing in markdown..."
          spellCheck={false}
          className="w-full h-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground/40 font-mono text-[14px] leading-relaxed focus:outline-none"
        />
      </div>
    </div>
  );
}
