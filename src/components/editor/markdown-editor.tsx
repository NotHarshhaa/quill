"use client";

import React, { useRef, useState, useEffect } from "react";
import { Corners } from "@/components/frame";
import { cn } from "@/lib/utils";
import { SlashCommandMenu, SlashCommand } from "./slash-command-menu";
import { FindReplaceBar } from "./find-replace-bar";
import { EditorToolbar } from "./editor-toolbar";
import { subscribeEditorCommands } from "@/lib/editor/editorCommands";
import { mediaRepository } from "@/lib/storage/mediaRepository";
import { toast } from "sonner";

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
  borderRight?: boolean;
}

export function MarkdownEditor({
  content,
  onChange,
  borderRight = true,
}: MarkdownEditorProps) {
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
      // Drop any pending history push from the previous note so it can't
      // contaminate the new note's undo stack
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      historyRef.current = [content];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    }
    isInternalChangeRef.current = false;
  }, [content]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  // Let app-level surfaces (More menu / Command Palette) trigger editor commands
  useEffect(() => {
    return subscribeEditorCommands((command) => {
      if (command === "find") setIsFindOpen(true);
      if (command === "typewriter") setIsTypewriter((prev) => !prev);
    });
  }, []);

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

    // Read the live DOM value: `content` can be stale in async flows (e.g. image
    // upload finishing after the user kept typing)
    const liveContent = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = liveContent.substring(start, end) || placeholder;

    const newContent =
      liveContent.substring(0, start) +
      before +
      selectedText +
      after +
      liveContent.substring(end);

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
    const liveContent = textarea.value;

    const before = liveContent.substring(0, start);
    const after = liveContent.substring(end);
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

    // 5MB size limit
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(`Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 5MB.`);
      return;
    }

    try {
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      const { uri } = await mediaRepository.saveImage(file, cleanName);
      const snippet = `\n![${cleanName || "Visual"}](${uri})\n`;
      insertSnippet(snippet, "", "");
      toast.success(`Image "${cleanName || "Visual"}" stored locally`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to store image offline";
      toast.error(message);
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

    if (e.key === "Tab" && !slashMenu.isOpen) {
      e.preventDefault();
      insertSnippet("  ");
      return;
    }
  };

  return (
    <div
      className={cn(
        "flex-1 flex flex-col h-full bg-background overflow-hidden relative font-sans",
        borderRight && "border-r border-border/70"
      )}
    >
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
      <EditorToolbar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onInsert={insertSnippet}
        onInsertImage={() => imageInputRef.current?.click()}
        isTypewriter={isTypewriter}
        onToggleTypewriter={() => setIsTypewriter((prev) => !prev)}
        isFindOpen={isFindOpen}
        onToggleFind={() => setIsFindOpen((prev) => !prev)}
      />

      {/* Find & Replace Bar Dock */}
      <FindReplaceBar
        isOpen={isFindOpen}
        onClose={() => setIsFindOpen(false)}
        content={content}
        onReplace={(newVal) => pushHistory(newVal, true)}
        onHighlightMatch={(start, end, focusEditor = true) => {
          const textarea = textareaRef.current;
          if (textarea) {
            if (focusEditor) {
              textarea.focus();
            }
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
          className="w-full h-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground/40 font-mono text-[16px] sm:text-[14px] leading-relaxed focus:outline-none"
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
