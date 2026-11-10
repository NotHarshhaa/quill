"use client";

import React, { useRef, useState, useEffect } from "react";
import { Corners } from "@/components/frame";
import { cn } from "@/lib/utils";
import { SlashCommandMenu, SlashCommand } from "./slash-command-menu";
import { FindReplaceBar } from "./find-replace-bar";
import { EditorToolbar } from "./editor-toolbar";
import { subscribeEditorCommands, setEditorState } from "@/lib/editor/editorCommands";
import { mediaRepository } from "@/lib/storage/mediaRepository";
import { useKeyboardInset } from "@/hooks/useKeyboardInset";
import { toast } from "sonner";

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
  borderRight?: boolean;
  scrollRef?: React.Ref<HTMLDivElement>;
  onScrollContainer?: (scrollTop: number, scrollRatio: number) => void;
  onCursorChange?: (pos: { line: number; col: number }) => void;
}

export function MarkdownEditor({
  content,
  onChange,
  borderRight = true,
  scrollRef,
  onScrollContainer,
  onCursorChange,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [isTypewriter, setIsTypewriter] = useState(false);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const keyboardInset = useKeyboardInset();
  const keyboardVisible = keyboardInset > 0;

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

  // Let app-level surfaces (top bar / More menu / Command Palette) trigger
  // editor commands without hoisting this component's internal state.
  const handlersRef = useRef<{
    undo: () => void;
    redo: () => void;
    openFind: () => void;
    toggleTypewriter: () => void;
    insert: (before: string, after?: string, placeholder?: string) => void;
  }>({
    undo: () => {},
    redo: () => {},
    openFind: () => {},
    toggleTypewriter: () => {},
    insert: () => {},
  });

  useEffect(() => {
    return subscribeEditorCommands((command) => {
      if (command === "find") handlersRef.current.openFind();
      else if (command === "typewriter") handlersRef.current.toggleTypewriter();
      else if (command === "undo") handlersRef.current.undo();
      else if (command === "redo") handlersRef.current.redo();
      else if (command === "bold") handlersRef.current.insert("**", "**", "bold text");
      else if (command === "italic") handlersRef.current.insert("*", "*", "italic text");
      else if (command === "bullet") handlersRef.current.insert("- ", "", "item");
      else if (command === "checklist") handlersRef.current.insert("- [ ] ", "", "task");
      else if (command === "link") handlersRef.current.insert("[", "](url)", "text");
    });
  }, []);

  // Publish a small state snapshot so the app top bar can drive mobile undo/redo
  useEffect(() => {
    setEditorState({ mounted: true });
    return () =>
      setEditorState({
        mounted: false,
        canUndo: false,
        canRedo: false,
        typewriter: false,
      });
  }, []);

  useEffect(() => {
    setEditorState({ canUndo, canRedo, typewriter: isTypewriter });
  }, [canUndo, canRedo, isTypewriter]);

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
        reportCursorPos();
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
        reportCursorPos();
      }, 0);
    }
  };

  const insertSnippet = (before: string, after: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Read the live DOM value: `content` can be stale in async flows
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
      reportCursorPos();
    }, 0);
  };

  // Keep the bridge callbacks pointing at the latest closures
  handlersRef.current = {
    undo: handleUndo,
    redo: handleRedo,
    openFind: () => setIsFindOpen(true),
    toggleTypewriter: () => setIsTypewriter((prev) => !prev),
    insert: (before, after, placeholder) => insertSnippet(before, after, placeholder),
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

  const reportCursorPos = () => {
    const textarea = textareaRef.current;
    if (!textarea || !onCursorChange) return;
    const pos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, pos);
    const lines = textBefore.split("\n");
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    onCursorChange({ line, col });
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
      reportCursorPos();
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

    // Smart List Continuation & List Exit on Enter
    if (e.key === "Enter" && !slashMenu.isOpen && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        if (start === end) {
          const val = textarea.value;
          const textBefore = val.substring(0, start);
          const lastNewline = textBefore.lastIndexOf("\n");
          const currentLine = textBefore.substring(lastNewline + 1);

          // 1. Task item: "- [ ] " or "- [x] "
          const taskMatch = currentLine.match(/^(\s*[-*+]\s+\[[ xX]?\]\s*)(.*)$/);
          if (taskMatch) {
            e.preventDefault();
            const prefix = taskMatch[1];
            const itemContent = taskMatch[2];
            if (!itemContent.trim()) {
              // Empty task line -> exit list by clearing the prefix
              const lineStart = lastNewline + 1;
              const newVal = val.substring(0, lineStart) + val.substring(start);
              pushHistory(newVal, true);
              setTimeout(() => {
                textarea.setSelectionRange(lineStart, lineStart);
                handleCursorScroll();
                reportCursorPos();
              }, 0);
              return;
            } else {
              // Non-empty task line -> continue with unchecked task
              const nextItem = "\n" + prefix.replace(/\[[xX]\]/, "[ ]");
              insertSnippet(nextItem, "", "");
              return;
            }
          }

          // 2. Numbered list item: "1. "
          const numMatch = currentLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
          if (numMatch) {
            e.preventDefault();
            const indent = numMatch[1];
            const num = parseInt(numMatch[2], 10);
            const itemContent = numMatch[3];
            if (!itemContent.trim()) {
              // Empty numbered line -> exit list
              const lineStart = lastNewline + 1;
              const newVal = val.substring(0, lineStart) + val.substring(start);
              pushHistory(newVal, true);
              setTimeout(() => {
                textarea.setSelectionRange(lineStart, lineStart);
                handleCursorScroll();
                reportCursorPos();
              }, 0);
              return;
            } else {
              const nextItem = `\n${indent}${num + 1}. `;
              insertSnippet(nextItem, "", "");
              return;
            }
          }

          // 3. Bullet list item: "- " or "* " or "+ "
          const bulletMatch = currentLine.match(/^(\s*[-*+]\s+)(.*)$/);
          if (bulletMatch) {
            e.preventDefault();
            const prefix = bulletMatch[1];
            const itemContent = bulletMatch[2];
            if (!itemContent.trim()) {
              // Empty bullet line -> exit list
              const lineStart = lastNewline + 1;
              const newVal = val.substring(0, lineStart) + val.substring(start);
              pushHistory(newVal, true);
              setTimeout(() => {
                textarea.setSelectionRange(lineStart, lineStart);
                handleCursorScroll();
                reportCursorPos();
              }, 0);
              return;
            } else {
              const nextItem = `\n${prefix}`;
              insertSnippet(nextItem, "", "");
              return;
            }
          }

          // 4. Blockquote: "> "
          const quoteMatch = currentLine.match(/^(\s*>\s+)(.*)$/);
          if (quoteMatch) {
            e.preventDefault();
            const prefix = quoteMatch[1];
            const quoteContent = quoteMatch[2];
            if (!quoteContent.trim()) {
              const lineStart = lastNewline + 1;
              const newVal = val.substring(0, lineStart) + val.substring(start);
              pushHistory(newVal, true);
              setTimeout(() => {
                textarea.setSelectionRange(lineStart, lineStart);
                handleCursorScroll();
                reportCursorPos();
              }, 0);
              return;
            } else {
              insertSnippet(`\n${prefix}`, "", "");
              return;
            }
          }
        }
      }
    }

    // Auto-pair wrapping when text is selected
    const PAIRS: Record<string, string> = {
      "(": ")",
      "[": "]",
      "{": "}",
      '"': '"',
      "'": "'",
      "`": "`",
      "*": "*",
      "~": "~",
    };

    if (PAIRS[e.key] && !e.ctrlKey && !e.metaKey && !slashMenu.isOpen) {
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const val = textarea.value;
        if (start !== end) {
          e.preventDefault();
          const open = e.key;
          const close = PAIRS[e.key];
          const selected = val.substring(start, end);
          const newVal = val.substring(0, start) + open + selected + close + val.substring(end);
          pushHistory(newVal, true);
          setTimeout(() => {
            textarea.setSelectionRange(start + 1, end + 1);
            reportCursorPos();
          }, 0);
          return;
        }
      }
    }

    // Tab / Shift+Tab for indenting / unindenting
    if (e.key === "Tab" && !slashMenu.isOpen) {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const val = textarea.value;

        if (e.shiftKey) {
          // Unindent lines
          const lineStart = val.lastIndexOf("\n", start - 1) + 1;
          const lineEnd = val.indexOf("\n", end);
          const actualEnd = lineEnd === -1 ? val.length : lineEnd;
          const block = val.substring(lineStart, actualEnd);
          const unindented = block
            .split("\n")
            .map((line) => line.replace(/^ {1,2}/, ""))
            .join("\n");
          const newVal = val.substring(0, lineStart) + unindented + val.substring(actualEnd);
          pushHistory(newVal, true);
          setTimeout(() => {
            textarea.setSelectionRange(
              Math.max(lineStart, start - 2),
              Math.max(lineStart, end - (block.length - unindented.length))
            );
            reportCursorPos();
          }, 0);
          return;
        } else {
          // If multiple lines selected, indent all; otherwise insert 2 spaces
          if (start !== end && val.substring(start, end).includes("\n")) {
            const lineStart = val.lastIndexOf("\n", start - 1) + 1;
            const lineEnd = val.indexOf("\n", end);
            const actualEnd = lineEnd === -1 ? val.length : lineEnd;
            const block = val.substring(lineStart, actualEnd);
            const indented = block
              .split("\n")
              .map((line) => "  " + line)
              .join("\n");
            const newVal = val.substring(0, lineStart) + indented + val.substring(actualEnd);
            pushHistory(newVal, true);
            setTimeout(() => {
              textarea.setSelectionRange(start + 2, end + (indented.length - block.length));
              reportCursorPos();
            }, 0);
            return;
          } else {
            insertSnippet("  ");
            return;
          }
        }
      }
    }
  };

  const handleContainerRef = (node: HTMLDivElement | null) => {
    (scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (typeof scrollRef === "function") {
      scrollRef(node);
    } else if (scrollRef && "current" in scrollRef) {
      (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
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

      {/* Floating formatting toolbar: on mobile devices, hidden while keyboard is active */}
      <div className={cn(keyboardVisible && "hidden md:block")}>
        <EditorToolbar
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onInsert={insertSnippet}
          onInsertImage={() => imageInputRef.current?.click()}
        />
      </div>

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
            reportCursorPos();
          }
        }}
      />

      {/* Editor Textarea with Typewriter Scrolling Mode, Slash Commands & Image Drag/Paste */}
      <div
        ref={handleContainerRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          const max = el.scrollHeight - el.clientHeight;
          const ratio = max > 0 ? el.scrollTop / max : 0;
          onScrollContainer?.(el.scrollTop, ratio);
        }}
        className={cn(
          "flex-1 pt-3.5 px-3.5 pb-8 sm:p-6 overflow-y-auto relative",
          isTypewriter ? "pb-[50vh]" : keyboardVisible ? "pb-20 sm:pb-8" : ""
        )}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            pushHistory(e.target.value, false);
            handleCursorScroll();
            reportCursorPos();
            checkSlashCommand(e.target.value, e.target.selectionStart);
          }}
          onClick={(e) => {
            handleCursorScroll();
            reportCursorPos();
            checkSlashCommand(content, (e.target as HTMLTextAreaElement).selectionStart);
          }}
          onKeyUp={(e) => {
            handleCursorScroll();
            reportCursorPos();
            checkSlashCommand(content, (e.target as HTMLTextAreaElement).selectionStart);
          }}
          onSelect={reportCursorPos}
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
