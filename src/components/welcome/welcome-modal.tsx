"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  FileText,
  Network,
  Maximize2,
  ShieldCheck,
  Compass,
  ArrowRight,
  BookOpen,
  Check,
  X,
  Keyboard,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Corners } from "@/components/frame";
import { cn } from "@/lib/utils";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartWriting: () => void;
  onOpenTemplates?: () => void;
  onOpenGuideNote?: () => void;
}

export const SHOW_WELCOME_KEY = "quill_show_welcome_on_startup";

export function WelcomeModal({
  isOpen,
  onClose,
  onStartWriting,
  onOpenTemplates,
  onOpenGuideNote,
}: WelcomeModalProps) {
  const [showOnStartup, setShowOnStartup] = useState<boolean>(true);

  // Sync preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SHOW_WELCOME_KEY);
      // Default is true if not explicitly set to "false"
      setShowOnStartup(stored !== "false");
    }
  }, []);

  const handleToggleStartup = () => {
    const nextVal = !showOnStartup;
    setShowOnStartup(nextVal);
    if (typeof window !== "undefined") {
      localStorage.setItem(SHOW_WELCOME_KEY, nextVal ? "true" : "false");
    }
  };

  const handleStart = () => {
    onStartWriting();
    onClose();
  };

  const handleTemplates = () => {
    onClose();
    if (onOpenTemplates) {
      onOpenTemplates();
    }
  };

  const handleGuide = () => {
    onClose();
    if (onOpenGuideNote) {
      onOpenGuideNote();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100vw-1.5rem)] max-w-2xl max-h-[88vh] flex flex-col p-0 gap-0 border border-border/90 bg-card shadow-2xl rounded-none font-sans overflow-hidden select-none"
      >
        <Corners size="default" offset="border" weight="normal" light />

        {/* Top Architectural Header Bar */}
        <div className="h-10 px-4 border-b border-border/70 flex items-center justify-between bg-muted/40 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-amber-600/80 animate-pulse" />
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
              Quill Architecture &middot; Offline Thought Canvas
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            className="h-6 w-6 rounded-none text-muted-foreground hover:text-foreground"
            aria-label="Close welcome modal"
          >
            <X className="size-3.5" />
          </Button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 space-y-6">
          {/* Hero Section with Prominent Logo Showcase */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
            {/* Animated Logo Emblem */}
            <div className="relative group shrink-0">
              {/* Subtle ambient warm glow behind logo */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-amber-500/20 via-orange-400/15 to-transparent rounded-full blur-md opacity-70 group-hover:opacity-100 transition duration-500" />

              <div className="relative size-16 sm:size-20 bg-card border border-border/90 flex items-center justify-center shadow-lg p-2.5 transition-transform duration-300 group-hover:scale-105">
                <Corners size="sm" offset="border" weight="thin" light />

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-11 sm:size-13 text-amber-700 dark:text-amber-500 drop-shadow-xs"
                >
                  <path
                    d="M20.5 3.5C18.5 2.5 15 2 12 5C9 8 7 12 5 15L3 21L9 19C12 17 16 15 19 12C22 9 21.5 5.5 20.5 3.5Z"
                    fill="currentColor"
                    fillOpacity="0.22"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3 21L13 11"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 8C11.5 8.5 13 8 15 6"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 12C9.5 12.5 11.5 12 13.5 10"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                  <circle cx="3.2" cy="20.8" r="1.1" fill="currentColor" />
                </svg>
              </div>
            </div>

            {/* Title & Introduction */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans">
                  Welcome to Quill
                </DialogTitle>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] px-1.5 py-0.2 border border-border/80 rounded-none bg-muted/40 uppercase tracking-wide"
                >
                  v1.5.0
                </Badge>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] px-1.5 py-0.2 border border-amber-600/40 text-amber-600 dark:text-amber-400 rounded-none bg-amber-500/5 uppercase tracking-wide"
                >
                  Offline &bull; Private
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A tactile, distraction-free markdown notebook and knowledge canvas.
                Crafted for seamless thinking, lightning-fast typing, and zero cloud lock-in.
              </p>
            </div>
          </div>

          {/* Feature Showcase Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Feature 1 */}
            <div className="relative p-3 bg-muted/20 hover:bg-muted/40 border border-border/70 transition-colors">
              <Corners size="sm" offset="border" weight="thin" light />
              <div className="flex items-start gap-2.5">
                <div className="size-7 shrink-0 rounded-none bg-primary/10 flex items-center justify-center text-primary mt-0.5">
                  <FileText className="size-3.5" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">Tactile Markdown & Live Split</div>
                  <div className="text-[11px] text-muted-foreground leading-snug">
                    Real-time dual pane editing, slash commands (<kbd className="font-mono text-[9.5px] px-1 bg-muted border border-border/60">/</kbd>), and interactive checklists.
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="relative p-3 bg-muted/20 hover:bg-muted/40 border border-border/70 transition-colors">
              <Corners size="sm" offset="border" weight="thin" light />
              <div className="flex items-start gap-2.5">
                <div className="size-7 shrink-0 rounded-none bg-primary/10 flex items-center justify-center text-primary mt-0.5">
                  <Network className="size-3.5" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">Wiki-Links & Knowledge Graph</div>
                  <div className="text-[11px] text-muted-foreground leading-snug">
                    Connect thoughts with <code className="font-mono text-[10px] text-primary">[[Page]]</code> syntax and visualize node clusters in 2D.
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="relative p-3 bg-muted/20 hover:bg-muted/40 border border-border/70 transition-colors">
              <Corners size="sm" offset="border" weight="thin" light />
              <div className="flex items-start gap-2.5">
                <div className="size-7 shrink-0 rounded-none bg-primary/10 flex items-center justify-center text-primary mt-0.5">
                  <Maximize2 className="size-3.5" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">Zen Desk & Ambient Focus</div>
                  <div className="text-[11px] text-muted-foreground leading-snug">
                    Distraction-free drafting grid, binaural ambient soundscapes (Rain, Cafe, Waves) & Pomodoro timer.
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="relative p-3 bg-muted/20 hover:bg-muted/40 border border-border/70 transition-colors">
              <Corners size="sm" offset="border" weight="thin" light />
              <div className="flex items-start gap-2.5">
                <div className="size-7 shrink-0 rounded-none bg-primary/10 flex items-center justify-center text-primary mt-0.5">
                  <ShieldCheck className="size-3.5" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">100% Local & Encrypted</div>
                  <div className="text-[11px] text-muted-foreground leading-snug">
                    Your thoughts never touch remote servers. Stored directly in browser storage with instant export and backup.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Keyboard Shortcuts Bar */}
          <div className="p-2.5 border border-border/70 bg-card/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Keyboard className="size-3.5 text-primary shrink-0" />
              <span className="font-mono text-[11px] uppercase tracking-wide">Key Shortcuts:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1">
                <kbd className="font-mono text-[10px] px-1 py-0.5 bg-muted border border-border/60">Ctrl+K</kbd>
                <span className="text-muted-foreground">Palette</span>
              </span>
              <span className="text-muted-foreground/40">&bull;</span>
              <span className="flex items-center gap-1">
                <kbd className="font-mono text-[10px] px-1 py-0.5 bg-muted border border-border/60">Ctrl+Shift+F</kbd>
                <span className="text-muted-foreground">Zen Desk</span>
              </span>
              <span className="text-muted-foreground/40">&bull;</span>
              <span className="flex items-center gap-1">
                <kbd className="font-mono text-[10px] px-1 py-0.5 bg-muted border border-border/60">/</kbd>
                <span className="text-muted-foreground">Slash Commands</span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer with Startup Checkbox & Actions */}
        <div className="border-t border-border/70 px-4 sm:px-6 py-3.5 bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Startup Toggle */}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none">
            <input
              type="checkbox"
              checked={showOnStartup}
              onChange={handleToggleStartup}
              className="size-3.5 accent-amber-600 rounded-none cursor-pointer"
            />
            <span>Show welcome message on startup</span>
          </label>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {onOpenTemplates && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTemplates}
                className="rounded-none h-8 text-xs gap-1.5 border-border/80"
              >
                <Sparkles className="size-3.5 text-primary" />
                <span>Templates</span>
              </Button>
            )}

            {onOpenGuideNote && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGuide}
                className="rounded-none h-8 text-xs gap-1.5 border-border/80 hidden xs:inline-flex"
              >
                <BookOpen className="size-3.5" />
                <span>Quick Guide</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleStart}
              className="rounded-none h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm px-4"
            >
              <span>Get Started</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
