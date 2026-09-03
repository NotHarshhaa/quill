"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  ChevronUp,
  ChevronDown,
  X,
  Replace,
  ReplaceAll,
} from "lucide-react";
import { Corners } from "@/components/frame";
import { Button } from "@/components/ui/button";

interface FindReplaceBarProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onReplace: (newContent: string) => void;
  onHighlightMatch?: (start: number, end: number) => void;
}

export function FindReplaceBar({
  isOpen,
  onClose,
  content,
  onReplace,
  onHighlightMatch,
}: FindReplaceBarProps) {
  const [query, setQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [matchIndex, setMatchIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Compute matches
  const matches = React.useMemo(() => {
    if (!query) return [];
    try {
      let pattern = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (wholeWord) {
        pattern = `\\b${pattern}\\b`;
      }
      const flags = caseSensitive ? "g" : "gi";
      const regex = new RegExp(pattern, flags);
      const results: { start: number; end: number }[] = [];
      let match;
      while ((match = regex.exec(content)) !== null) {
        results.push({
          start: match.index,
          end: match.index + match[0].length,
        });
        if (!regex.global) break;
      }
      return results;
    } catch {
      return [];
    }
  }, [query, content, caseSensitive, wholeWord]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  // Keep match index within bounds
  useEffect(() => {
    if (matches.length === 0) {
      setMatchIndex(0);
    } else if (matchIndex >= matches.length) {
      setMatchIndex(0);
    }
  }, [matches.length, matchIndex]);

  // Highlight active match in editor
  useEffect(() => {
    if (matches.length > 0 && onHighlightMatch) {
      const current = matches[matchIndex];
      if (current) {
        onHighlightMatch(current.start, current.end);
      }
    }
  }, [matchIndex, matches, onHighlightMatch]);

  const handleNext = () => {
    if (matches.length === 0) return;
    setMatchIndex((prev) => (prev + 1) % matches.length);
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    setMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  };

  const handleReplaceOne = () => {
    if (matches.length === 0) return;
    const match = matches[matchIndex];
    if (!match) return;

    const newContent =
      content.substring(0, match.start) +
      replaceQuery +
      content.substring(match.end);

    onReplace(newContent);
  };

  const handleReplaceAll = () => {
    if (matches.length === 0) return;
    let pattern = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (wholeWord) pattern = `\\b${pattern}\\b`;
    const regex = new RegExp(pattern, caseSensitive ? "g" : "gi");
    const newContent = content.replace(regex, replaceQuery);
    onReplace(newContent);
  };

  if (!isOpen) return null;

  return (
    <div className="border-b border-border/80 bg-card/95 backdrop-blur-md px-3 py-2 text-xs select-none relative font-sans shadow-sm animate-in slide-in-from-top-1 duration-150">
      <Corners size="sm" offset="border" weight="thin" light />

      <div className="flex flex-wrap items-center gap-2">
        {/* Search Input Box */}
        <div className="flex items-center gap-1.5 bg-background border border-border px-2 py-1 rounded-none flex-1 min-w-[200px]">
          <Search className="size-3 text-muted-foreground shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (e.shiftKey) handlePrev();
                else handleNext();
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder="Find in note..."
            className="w-full bg-transparent focus:outline-none text-foreground font-mono text-xs placeholder:text-muted-foreground/40"
          />
          {query && (
            <span className="text-[10.5px] font-mono text-muted-foreground whitespace-nowrap px-1">
              {matches.length > 0 ? `${matchIndex + 1} of ${matches.length}` : "No match"}
            </span>
          )}
        </div>

        {/* Options: Case sensitive & Whole word */}
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant={caseSensitive ? "secondary" : "ghost"}
            size="icon-xs"
            onClick={() => setCaseSensitive((prev) => !prev)}
            className={`h-6 w-6 font-mono font-bold text-[10px] rounded-none ${
              caseSensitive ? "text-primary border border-primary/40" : "text-muted-foreground"
            }`}
            title="Match Case (Aa)"
          >
            Aa
          </Button>
          <Button
            type="button"
            variant={wholeWord ? "secondary" : "ghost"}
            size="icon-xs"
            onClick={() => setWholeWord((prev) => !prev)}
            className={`h-6 w-6 font-mono font-bold text-[10px] rounded-none ${
              wholeWord ? "text-primary border border-primary/40" : "text-muted-foreground"
            }`}
            title="Match Whole Word (\b)"
          >
            \b
          </Button>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handlePrev}
            disabled={matches.length === 0}
            className="h-6 w-6 rounded-none text-muted-foreground hover:text-foreground"
            title="Previous match (Shift+Enter)"
          >
            <ChevronUp className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleNext}
            disabled={matches.length === 0}
            className="h-6 w-6 rounded-none text-muted-foreground hover:text-foreground"
            title="Next match (Enter)"
          >
            <ChevronDown className="size-3.5" />
          </Button>
        </div>

        {/* Toggle Replace */}
        <Button
          type="button"
          variant={showReplace ? "secondary" : "outline"}
          size="xs"
          onClick={() => setShowReplace((prev) => !prev)}
          className="h-6 text-[11px] px-2 rounded-none font-sans"
        >
          Replace
        </Button>

        {/* Close button */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
          className="h-6 w-6 rounded-none text-muted-foreground hover:text-foreground ml-auto"
          title="Close (Esc)"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {/* Replace Row */}
      {showReplace && (
        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 bg-background border border-border px-2 py-1 rounded-none flex-1 min-w-[200px]">
            <Replace className="size-3 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleReplaceOne();
                } else if (e.key === "Escape") {
                  onClose();
                }
              }}
              placeholder="Replace with..."
              className="w-full bg-transparent focus:outline-none text-foreground font-mono text-xs placeholder:text-muted-foreground/40"
            />
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleReplaceOne}
              disabled={matches.length === 0}
              className="h-6 text-[11px] px-2 rounded-none font-sans gap-1"
            >
              <Replace className="size-3" />
              <span>Replace</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleReplaceAll}
              disabled={matches.length === 0}
              className="h-6 text-[11px] px-2 rounded-none font-sans gap-1"
            >
              <ReplaceAll className="size-3" />
              <span>Replace All</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
