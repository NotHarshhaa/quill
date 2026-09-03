"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Corners, CornerBadge } from "@/components/frame";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  PenLine,
  BookOpen,
  Command,
  Network,
  Headphones,
  ShieldCheck,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  Clock,
  Search,
  Check,
  Flame,
} from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartWriting?: () => void;
  onOpenTemplates?: () => void;
  onOpenGuideNote?: () => void;
}

export const SHOW_WELCOME_KEY = "quill_show_welcome_on_startup";

const TOTAL_SLIDES = 5;

const SLIDE_METADATA = [
  { id: "sanctuary", category: "OVERVIEW", step: "01", tag: "SANCTUARY" },
  { id: "flow", category: "FLOW", step: "02", tag: "ERGONOMICS" },
  { id: "network", category: "SYNTHESIS", step: "03", tag: "NETWORK" },
  { id: "atmosphere", category: "FOCUS", step: "04", tag: "ATMOSPHERE" },
  { id: "launchpad", category: "LAUNCH", step: "05", tag: "START" },
];

export function WelcomeModal({
  isOpen,
  onClose,
  onStartWriting,
  onOpenTemplates,
  onOpenGuideNote,
}: WelcomeModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dontShowOnStartup, setDontShowOnStartup] = useState(false);

  // Initialize preference from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const pref = localStorage.getItem(SHOW_WELCOME_KEY);
      setDontShowOnStartup(pref === "false");
    }
  }, [isOpen]);

  // Reset slide index when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
    }
  }, [isOpen]);

  const toggleDontShow = () => {
    const nextVal = !dontShowOnStartup;
    setDontShowOnStartup(nextVal);
    if (typeof window !== "undefined") {
      localStorage.setItem(SHOW_WELCOME_KEY, nextVal ? "false" : "true");
    }
  };

  const handleNext = useCallback(() => {
    if (currentSlide < TOTAL_SLIDES - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      if (onStartWriting) {
        onStartWriting();
      }
      onClose();
    }
  }, [currentSlide, onStartWriting, onClose]);

  const handlePrev = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  }, [currentSlide]);

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNext, handlePrev]);

  const handleAction = (action?: () => void) => {
    if (action) {
      action();
    }
    onClose();
  };

  const currentMeta = SLIDE_METADATA[currentSlide];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100vw-1.5rem)] max-w-[360px] sm:max-w-[520px] md:max-w-2xl h-[480px] sm:h-[470px] md:h-[490px] max-h-[88vh] p-0 flex flex-col border border-border bg-card shadow-2xl rounded-none font-sans select-none overflow-hidden"
      >
        {/* Outer Frame Corner Brackets */}
        <Corners
          size="sm"
          offset="border"
          weight="thin"
          className="border-foreground/75 dark:border-foreground/80"
        />

        {/* Modal Top Bar */}
        <div className="h-10 sm:h-11 md:h-12 px-3 sm:px-5 md:px-6 border-b border-border flex items-center justify-between bg-muted/40 shrink-0 gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <CornerBadge size="sm" className="whitespace-nowrap shrink-0 text-[9px] sm:text-[10px] md:text-[11px] px-1.5 sm:px-2 py-0.5">
              STEP {currentMeta.step} // {currentMeta.category}
            </CornerBadge>
            <span className="hidden sm:inline-block text-[10px] md:text-[11px] font-mono text-muted-foreground/80 uppercase tracking-wider whitespace-nowrap">
              [ {currentMeta.tag} ]
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="xs"
              variant="ghost"
              onClick={onClose}
              className="h-6 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground rounded-none"
            >
              Skip
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={onClose}
              className="h-6 w-6 sm:h-7 sm:w-7 rounded-none text-muted-foreground hover:text-foreground"
              aria-label="Close dialog"
            >
              <X className="size-3 sm:size-3.5" />
            </Button>
          </div>
        </div>

        {/* Modal Body / Slide Viewport (Uniform height across all slides, scrollbar if content overflows) */}
        <div className="relative flex-1 min-h-0 p-3.5 sm:p-5 md:p-6 overflow-y-auto overflow-x-hidden flex flex-col [scrollbar-width:thin] [scrollbar-color:oklch(var(--muted-foreground)/0.25)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent">
          {/* SLIDE 0: Welcome & Philosophy */}
          {currentSlide === 0 && (
            <div className="flex-1 flex flex-col items-center text-center animate-in fade-in duration-200 my-auto">
              {/* Central Emblem */}
              <div className="relative mb-2.5 sm:mb-3 flex items-center justify-center">
                <div className="relative size-12 sm:size-14 md:size-16 bg-muted/40 border border-border flex items-center justify-center shadow-sm">
                  <Corners
                    size="default"
                    offset="border"
                    weight="normal"
                    className="border-foreground/70 dark:border-foreground/75"
                  />
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-7 sm:size-9 md:size-10 text-amber-700 dark:text-amber-500"
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

              {/* Title & Tagline */}
              <div className="space-y-1 mb-3 sm:mb-4 max-w-md">
                <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground font-sans">
                  Welcome to Quill
                </DialogTitle>
                <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground leading-relaxed">
                  A distraction-free markdown notebook and knowledge canvas crafted for clear thinking and tactile editorial elegance.
                </p>
              </div>

              {/* Architecture Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 w-full text-left">
                <div className="relative p-2.5 sm:p-3 bg-muted/20 border border-border flex flex-col justify-between">
                  <Corners size="sm" offset="border" weight="thin" light />
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="size-3.5 sm:size-4 text-amber-700 dark:text-amber-500 shrink-0" />
                    <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-foreground">
                      100% Offline
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                    Zero remote servers and zero telemetry. Notes and media stay strictly in your browser.
                  </p>
                </div>

                <div className="relative p-2.5 sm:p-3 bg-muted/20 border border-border flex flex-col justify-between">
                  <Corners size="sm" offset="border" weight="thin" light />
                  <div className="flex items-center gap-1.5 mb-1">
                    <PenLine className="size-3.5 sm:size-4 text-amber-700 dark:text-amber-500 shrink-0" />
                    <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-foreground">
                      Tactile Craft
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                    Live split-screen preview, paper typography, and drafting grids designed for deep focus.
                  </p>
                </div>

                <div className="relative p-2.5 sm:p-3 bg-muted/20 border border-border flex flex-col justify-between">
                  <Corners size="sm" offset="border" weight="thin" light />
                  <div className="flex items-center gap-1.5 mb-1">
                    <Layers className="size-3.5 sm:size-4 text-amber-700 dark:text-amber-500 shrink-0" />
                    <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-foreground">
                      Zero Lock-In
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                    Pure standard Markdown storage, instant JSON vault backups, and clean exports.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 1: Fluid Writing & Keyboard Ergonomics */}
          {currentSlide === 1 && (
            <div className="flex-1 flex flex-col text-left animate-in fade-in duration-200 my-auto">
              <div className="flex items-center gap-2.5 mb-2.5 sm:mb-3">
                <div className="size-8 sm:size-9 md:size-10 bg-muted/40 border border-border flex items-center justify-center shrink-0">
                  <Command className="size-4 sm:size-5 text-amber-700 dark:text-amber-500" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground font-sans">
                    Fluid Writing & Commands
                  </DialogTitle>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Speed-oriented keyboard ergonomics that keep your fingers on the home row.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 w-full">
                <div className="relative p-2.5 sm:p-3 bg-muted/20 border border-border">
                  <Corners size="sm" offset="border" weight="thin" light />
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-foreground">
                      In-Editor Slash Menu
                    </span>
                    <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 rounded-none border-border">
                      TYPE /
                    </Badge>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed">
                    Type <code className="text-foreground font-mono bg-muted px-1">/</code> on any blank line for instant insertion of headings, tables, alerts, checklists, and code blocks.
                  </p>
                </div>

                <div className="relative p-2.5 sm:p-3 bg-muted/20 border border-border">
                  <Corners size="sm" offset="border" weight="thin" light />
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-foreground">
                      Find & Replace
                    </span>
                    <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 rounded-none border-border">
                      CTRL + F
                    </Badge>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed">
                    Fast in-editor search with live match counters (<code className="text-foreground font-mono bg-muted px-1">X of Y</code>), case toggle, and batch Replace All.
                  </p>
                </div>

                <div className="relative p-2.5 sm:p-3 bg-muted/20 border border-border">
                  <Corners size="sm" offset="border" weight="thin" light />
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-foreground">
                      Omni Command HUD
                    </span>
                    <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 rounded-none border-border">
                      CTRL + K
                    </Badge>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed">
                    Universal keyboard switcher to jump between notes, apply templates, toggle soundscapes, and launch tools.
                  </p>
                </div>

                <div className="relative p-2.5 sm:p-3 bg-muted/20 border border-border">
                  <Corners size="sm" offset="border" weight="thin" light />
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-foreground">
                      Offline Media Storage
                    </span>
                    <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 rounded-none border-border">
                      DRAG & DROP
                    </Badge>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed">
                    Paste or drop image attachments directly into notes. Media is indexed locally in IndexedDB with zoomable lightbox.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 2: Interlinked Thought Network */}
          {currentSlide === 2 && (
            <div className="flex-1 flex flex-col text-left animate-in fade-in duration-200 my-auto">
              <div className="flex items-center gap-2.5 mb-2.5 sm:mb-3">
                <div className="size-8 sm:size-9 md:size-10 bg-muted/40 border border-border flex items-center justify-center shrink-0">
                  <Network className="size-4 sm:size-5 text-amber-700 dark:text-amber-500" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground font-sans">
                    Interlinked Thought Network
                  </DialogTitle>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Connect ideas together into an organic, living constellation of knowledge.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 w-full">
                <div className="relative p-2.5 sm:p-3 bg-muted/20 border border-border">
                  <Corners size="sm" offset="border" weight="thin" light />
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-foreground">
                      Wiki-Links & Backlinks
                    </span>
                    <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 rounded-none border-border">
                      [[NOTE]]
                    </Badge>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed">
                    Type <code className="text-foreground font-mono bg-muted px-1">[[Note Title]]</code> to link notes with autocomplete and an automated backlinks explorer.
                  </p>
                </div>

                <div className="relative p-2.5 sm:p-3 bg-muted/20 border border-border">
                  <Corners size="sm" offset="border" weight="thin" light />
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-foreground">
                      2D Knowledge Graph
                    </span>
                    <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 rounded-none border-border">
                      CANVAS PHYSICS
                    </Badge>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed">
                    Interactive force-directed graph visualizing note clusters with physics, node dragging, and tag filters.
                  </p>
                </div>

                <div className="relative p-2.5 sm:p-3 bg-muted/20 border border-border">
                  <Corners size="sm" offset="border" weight="thin" light />
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-foreground">
                      Document Outline Tree
                    </span>
                    <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 rounded-none border-border">
                      H1 — H6
                    </Badge>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed">
                    Automatic hierarchical table of contents drawer to seamlessly navigate long-form essays and specs.
                  </p>
                </div>

                <div className="relative p-2.5 sm:p-3 bg-muted/20 border border-border">
                  <Corners size="sm" offset="border" weight="thin" light />
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-foreground">
                      Version Snapshots
                    </span>
                    <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 rounded-none border-border">
                      TIMELINE DIFF
                    </Badge>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed">
                    Periodic automatic snapshots with side-by-side historical diff viewing and single-click restoration.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 3: Atmosphere & Sensory Focus */}
          {currentSlide === 3 && (
            <div className="flex-1 flex flex-col text-left animate-in fade-in duration-200 my-auto">
              <div className="flex items-center gap-2.5 mb-2.5 sm:mb-3">
                <div className="size-8 sm:size-9 md:size-10 bg-muted/40 border border-border flex items-center justify-center shrink-0">
                  <Headphones className="size-4 sm:size-5 text-amber-700 dark:text-amber-500" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground font-sans">
                    Atmosphere & Focused Rituals
                  </DialogTitle>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Sensory instruments engineered to induce flow state and protect your attention.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 w-full">
                <div className="relative p-2.5 sm:p-3 bg-muted/20 border border-border">
                  <Corners size="sm" offset="border" weight="thin" light />
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-foreground">
                      Procedural Soundscapes
                    </span>
                    <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 rounded-none border-border">
                      WEB AUDIO
                    </Badge>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed">
                    Generative, loop-free soundscapes synthesized client-side: Gentle Rain, Vinyl Crackle, Cafe, Surf, and Wind.
                  </p>
                </div>

                <div className="relative p-2.5 sm:p-3 bg-muted/20 border border-border">
                  <Corners size="sm" offset="border" weight="thin" light />
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-foreground">
                      Singing Bowl Pomodoro
                    </span>
                    <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 rounded-none border-border">
                      528Hz BELL
                    </Badge>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed">
                    25m Focus / 5m Break rhythm accompanied by gentle 528Hz acoustic chime intervals for focused sessions.
                  </p>
                </div>

                <div className="relative p-2.5 sm:p-3 bg-muted/20 border border-border">
                  <Corners size="sm" offset="border" weight="thin" light />
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-foreground">
                      Zen Focus Desk
                    </span>
                    <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 rounded-none border-border">
                      CTRL + SHIFT + F
                    </Badge>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed">
                    Fullscreen writing sanctuary with drafting grid paper canvas, typewriter line centering, and minimal chrome.
                  </p>
                </div>

                <div className="relative p-2.5 sm:p-3 bg-muted/20 border border-border">
                  <Corners size="sm" offset="border" weight="thin" light />
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-foreground">
                      Habit Heatmap & Insights
                    </span>
                    <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 rounded-none border-border">
                      24-WEEK GRID
                    </Badge>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed">
                    GitHub-style writing activity heatmap, word count velocity tracking, and Flesch reading ease diagnostics.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 4: Launchpad / Quick Start */}
          {currentSlide === 4 && (
            <div className="flex-1 flex flex-col text-left animate-in fade-in duration-200 my-auto">
              <div className="flex items-center gap-2.5 mb-2.5 sm:mb-3">
                <div className="size-8 sm:size-9 md:size-10 bg-muted/40 border border-border flex items-center justify-center shrink-0">
                  <Sparkles className="size-4 sm:size-5 text-amber-700 dark:text-amber-500" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground font-sans">
                    Ready to Begin?
                  </DialogTitle>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Choose your path to enter the notebook workspace.
                  </p>
                </div>
              </div>

              {/* 3 Interactive Launchpad Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 w-full">
                {/* Option 1: Start Fresh */}
                <button
                  type="button"
                  onClick={() => handleAction(onStartWriting)}
                  className="group relative p-2.5 sm:p-3 bg-muted/20 hover:bg-muted/50 border border-border hover:border-foreground/50 transition-all text-left flex flex-col justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <Corners size="sm" offset="border" weight="thin" light />
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="size-7 sm:size-8 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
                        <PenLine className="size-3.5 sm:size-4" />
                      </div>
                      <span className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">
                        CANVAS
                      </span>
                    </div>
                    <h4 className="font-semibold text-[11px] sm:text-xs text-foreground mb-0.5 group-hover:text-primary transition-colors">
                      Start Blank Note
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                      Begin drafting immediately on a clean markdown slate.
                    </p>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-border/60 flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-medium text-primary uppercase tracking-wider">
                    <span>Draft Now</span>
                    <ArrowRight className="size-2.5 sm:size-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* Option 2: Explore Templates */}
                <button
                  type="button"
                  onClick={() => handleAction(onOpenTemplates)}
                  className="group relative p-2.5 sm:p-3 bg-muted/20 hover:bg-muted/50 border border-border hover:border-foreground/50 transition-all text-left flex flex-col justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <Corners size="sm" offset="border" weight="thin" light />
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="size-7 sm:size-8 bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Sparkles className="size-3.5 sm:size-4" />
                      </div>
                      <span className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">
                        LIBRARY
                      </span>
                    </div>
                    <h4 className="font-semibold text-[11px] sm:text-xs text-foreground mb-0.5 group-hover:text-primary transition-colors">
                      Browse Templates
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                      Choose from meeting notes, journals, specs, or book summaries.
                    </p>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-border/60 flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-medium text-primary uppercase tracking-wider">
                    <span>Open Library</span>
                    <ArrowRight className="size-2.5 sm:size-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* Option 3: Guide Note */}
                <button
                  type="button"
                  onClick={() => handleAction(onOpenGuideNote)}
                  className="group relative p-2.5 sm:p-3 bg-muted/20 hover:bg-muted/50 border border-border hover:border-foreground/50 transition-all text-left flex flex-col justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <Corners size="sm" offset="border" weight="thin" light />
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="size-7 sm:size-8 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <BookOpen className="size-3.5 sm:size-4" />
                      </div>
                      <span className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">
                        TUTORIAL
                      </span>
                    </div>
                    <h4 className="font-semibold text-[11px] sm:text-xs text-foreground mb-0.5 group-hover:text-primary transition-colors">
                      Interactive Guide
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                      Explore the sample note with live markdown checklists.
                    </p>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-border/60 flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-medium text-primary uppercase tracking-wider">
                    <span>Read Note</span>
                    <ArrowRight className="size-2.5 sm:size-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer / Navigation */}
        <div className="border-t border-border px-3 sm:px-5 md:px-6 py-2 sm:py-2.5 bg-muted/20 flex items-center justify-between shrink-0 gap-2 sm:gap-3">
          {/* Left: Step Indicators & Startup Checkbox */}
          <div className="flex items-center gap-2 sm:gap-3.5">
            {/* Slide Tracker Dots */}
            <div className="flex items-center gap-1 sm:gap-1.5" role="tablist" aria-label="Welcome tour slides">
              {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => {
                const isActive = idx === currentSlide;
                return (
                  <button
                    key={idx}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Slide ${idx + 1}`}
                    onClick={() => setCurrentSlide(idx)}
                    className={`transition-all rounded-none border ${
                      isActive
                        ? "w-4 sm:w-6 h-1.5 sm:h-2 bg-amber-600 dark:bg-amber-500 border-amber-600 dark:border-amber-500"
                        : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-muted hover:bg-muted-foreground/30 border-border"
                    }`}
                  />
                );
              })}
            </div>

            {/* Don't show on startup toggle */}
            <button
              type="button"
              onClick={toggleDontShow}
              aria-pressed={dontShowOnStartup}
              className="flex items-center gap-1 sm:gap-1.5 cursor-pointer text-[10px] sm:text-[11px] font-mono text-muted-foreground hover:text-foreground select-none focus-visible:outline-none"
            >
              <span
                className={`size-3 sm:size-3.5 border flex items-center justify-center transition-colors ${
                  dontShowOnStartup
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background"
                }`}
              >
                {dontShowOnStartup && <Check className="size-2 sm:size-2.5 stroke-[3]" />}
              </span>
              <span className="hidden sm:inline">
                Don&apos;t show on startup
              </span>
              <span className="sm:hidden">
                No startup
              </span>
            </button>
          </div>

          {/* Right: Back & Next Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {currentSlide > 0 && (
              <Button
                size="xs"
                variant="outline"
                onClick={handlePrev}
                className="h-7 sm:h-8 px-2 sm:px-3 rounded-none text-[10px] sm:text-xs gap-1 font-mono tracking-wider uppercase border-border hover:bg-muted"
              >
                <ChevronLeft className="size-3 sm:size-3.5" />
                <span className="hidden xs:inline">Back</span>
              </Button>
            )}

            {currentSlide < TOTAL_SLIDES - 1 ? (
              <Button
                size="xs"
                variant="default"
                onClick={handleNext}
                className="h-7 sm:h-8 px-3 sm:px-4 rounded-none text-[10px] sm:text-xs gap-1 sm:gap-1.5 font-mono tracking-wider uppercase bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <span>Next</span>
                <ChevronRight className="size-3 sm:size-3.5" />
              </Button>
            ) : (
              <Button
                size="xs"
                variant="default"
                onClick={handleNext}
                className="h-7 sm:h-8 px-3 sm:px-4 rounded-none text-[10px] sm:text-xs gap-1 sm:gap-1.5 font-mono tracking-wider uppercase bg-amber-700 hover:bg-amber-800 text-white dark:bg-amber-600 dark:hover:bg-amber-500 shadow-sm"
              >
                <span>Get Started</span>
                <ArrowRight className="size-3 sm:size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
