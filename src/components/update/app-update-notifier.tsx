"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  checkForAppUpdate,
  UpdateInfo,
  DISMISSED_UPDATE_KEY,
  isNativeAppEnvironment,
} from "@/lib/updater/update-checker";
import { parseMarkdown } from "@/lib/markdown/parser";
import { BlockNode } from "@/lib/markdown/types";
import { RenderInline } from "@/components/preview/preview-elements";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Corners, CornerBadge } from "@/components/frame";
import {
  ArrowDownToLine,
  ExternalLink,
  Sparkles,
  X,
  Check,
} from "lucide-react";

/**
 * Custom compact block renderer for GitHub Release Notes
 */
function ReleaseNoteBlock({ block }: { block: BlockNode }) {
  switch (block.type) {
    case "heading": {
      const isTop = block.level <= 2;
      return (
        <div
          className={
            isTop
              ? "font-semibold text-xs sm:text-sm text-foreground mt-2.5 mb-1 pt-1 border-t border-border/40 first:border-t-0 first:pt-0"
              : "font-medium text-[11px] uppercase tracking-wider text-muted-foreground mt-2 mb-0.5"
          }
        >
          {block.children.map((child, i) => (
            <RenderInline key={i} node={child} />
          ))}
        </div>
      );
    }

    case "paragraph":
      return (
        <p className="text-[11px] text-muted-foreground leading-relaxed my-1">
          {block.children.map((child, i) => (
            <RenderInline key={i} node={child} />
          ))}
        </p>
      );

    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag
          className={`space-y-1 my-1.5 pl-4 text-[11px] text-muted-foreground marker:text-amber-600/70 ${
            block.ordered ? "list-decimal" : "list-disc"
          }`}
        >
          {block.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {item.children.map((child, i) => (
                <RenderInline key={i} node={child} />
              ))}
            </li>
          ))}
        </Tag>
      );
    }

    case "thematic_break":
      return <div className="h-px bg-border/50 my-2" />;

    case "code_block":
      return (
        <pre className="p-2 bg-muted/60 border border-border text-[10px] font-mono overflow-x-auto my-1.5 rounded-none [scrollbar-width:thin]">
          <code>{block.code}</code>
        </pre>
      );

    case "blockquote":
      return (
        <blockquote className="border-l-2 border-primary/40 pl-2.5 my-1.5 italic text-muted-foreground font-sans text-[11px]">
          {block.children.map((child, i) => (
            <ReleaseNoteBlock key={i} block={child} />
          ))}
        </blockquote>
      );

    default:
      return null;
  }
}

/**
 * Formats and renders raw markdown into styled blueprint HTML nodes
 */
function ReleaseNotesMarkdown({ content }: { content: string }) {
  const ast = useMemo(() => {
    try {
      return parseMarkdown(content);
    } catch {
      return [];
    }
  }, [content]);

  if (!ast.length) {
    return (
      <p className="text-[11px] text-muted-foreground italic">
        No release notes provided.
      </p>
    );
  }

  return (
    <div className="space-y-1 text-left font-sans">
      {ast.map((block, idx) => (
        <ReleaseNoteBlock key={idx} block={block} />
      ))}
    </div>
  );
}

export function AppUpdateNotifier() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Only execute inside native app environment
    if (!isNativeAppEnvironment()) {
      return;
    }

    // Delay check 3.5 seconds after launch to ensure initial render is completely fluid
    const checkTimer = setTimeout(async () => {
      const info = await checkForAppUpdate();
      if (info && info.hasUpdate) {
        setUpdateInfo(info);
        setIsBannerVisible(true);
      }
    }, 3500);

    return () => clearTimeout(checkTimer);
  }, []);

  if (!isNativeAppEnvironment() || !updateInfo || !updateInfo.hasUpdate) {
    return null;
  }

  const handleOpenModal = () => {
    setIsBannerVisible(false);
    setIsModalOpen(true);
  };

  const handleDismissBanner = () => {
    setIsBannerVisible(false);
  };

  const handleDownloadApk = () => {
    if (updateInfo.downloadUrl) {
      window.open(updateInfo.downloadUrl, "_blank");
    }
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem(DISMISSED_UPDATE_KEY, updateInfo.latestVersion);
    }
    setIsModalOpen(false);
  };

  const handleOpenReleasePage = () => {
    if (updateInfo.releaseUrl) {
      window.open(updateInfo.releaseUrl, "_blank");
    }
  };

  const handleDismissModal = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem(DISMISSED_UPDATE_KEY, updateInfo.latestVersion);
    }
    setIsModalOpen(false);
  };

  const toggleDontShow = () => {
    setDontShowAgain((prev) => !prev);
  };

  return (
    <>
      {/* 1. Sleek Floating Blueprint Pill Notification (Non-Intrusive) */}
      {isBannerVisible && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-[95vw] w-auto animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="relative bg-card/95 backdrop-blur-md border border-amber-600/40 dark:border-amber-500/50 shadow-2xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-3 text-foreground font-sans">
            <Corners size="sm" offset="border" weight="thin" light />

            <div className="size-7 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-400">
              <Sparkles className="size-3.5" />
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              <CornerBadge size="sm" className="hidden sm:inline-flex text-[9px] px-1.5 py-0.5 whitespace-nowrap">
                UPDATE v{updateInfo.latestVersion}
              </CornerBadge>
              <p className="text-[11px] sm:text-xs font-medium truncate">
                <span className="sm:hidden font-mono font-bold text-amber-600 dark:text-amber-400 mr-1">
                  v{updateInfo.latestVersion}:
                </span>
                New version available
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-1">
              <Button
                size="xs"
                variant="default"
                onClick={handleOpenModal}
                className="h-6 sm:h-7 px-2 sm:px-2.5 rounded-none text-[10px] sm:text-[11px] font-mono tracking-wider uppercase bg-amber-700 hover:bg-amber-800 text-white dark:bg-amber-600 dark:hover:bg-amber-500"
              >
                <span>View</span>
                <ArrowDownToLine className="size-3 ml-1" />
              </Button>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={handleDismissBanner}
                className="h-6 w-6 sm:h-7 sm:w-7 rounded-none text-muted-foreground hover:text-foreground"
                aria-label="Dismiss update notification"
              >
                <X className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Detailed Blueprint Update Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleDismissModal()}>
        <DialogContent
          showCloseButton={false}
          className="w-[calc(100vw-1.5rem)] max-w-md p-0 flex flex-col border border-border bg-card shadow-2xl rounded-none font-sans select-none overflow-hidden"
        >
          {/* Outer Frame Corners */}
          <Corners
            size="sm"
            offset="border"
            weight="thin"
            className="border-foreground/75 dark:border-foreground/80"
          />

          {/* Top Bar */}
          <div className="h-10 sm:h-11 px-3 sm:px-4 border-b border-border flex items-center justify-between bg-muted/40 shrink-0 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <CornerBadge size="sm" className="whitespace-nowrap shrink-0 text-[10px] px-1.5 py-0.5">
                SYSTEM UPDATE // v{updateInfo.latestVersion}
              </CornerBadge>
            </div>

            <Button
              size="icon-xs"
              variant="ghost"
              onClick={handleDismissModal}
              className="h-6 w-6 sm:h-7 sm:w-7 rounded-none text-muted-foreground hover:text-foreground"
              aria-label="Close dialog"
            >
              <X className="size-3.5" />
            </Button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5 flex flex-col gap-3">
            {/* Header with Emblem */}
            <div className="flex items-start gap-3">
              <div className="relative size-12 bg-muted/40 border border-border flex items-center justify-center shrink-0 shadow-sm">
                <Corners size="sm" offset="border" weight="thin" light />
                <ArrowDownToLine className="size-6 text-amber-700 dark:text-amber-500" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground font-sans">
                  New Update Available
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="font-mono text-[9px] px-1.5 py-0 rounded-none border-border text-muted-foreground">
                    CURRENT: v{updateInfo.currentVersion}
                  </Badge>
                  <span className="text-muted-foreground text-xs">→</span>
                  <Badge variant="outline" className="font-mono text-[9px] px-1.5 py-0 rounded-none border-amber-600/40 text-amber-700 dark:text-amber-400 bg-amber-500/10">
                    LATEST: v{updateInfo.latestVersion}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Formatted Release Notes Preview */}
            {updateInfo.releaseNotes && (
              <div className="relative border border-border bg-muted/20 p-3 text-left">
                <Corners size="sm" offset="border" weight="thin" light />
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border/40">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Release Notes // {updateInfo.releaseName || `v${updateInfo.latestVersion}`}
                  </span>
                  {updateInfo.publishedAt && (
                    <span className="font-mono text-[9px] text-muted-foreground/70">
                      {new Date(updateInfo.publishedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
                <div className="max-h-48 sm:max-h-56 overflow-y-auto pr-1 font-sans [scrollbar-width:thin] [scrollbar-color:oklch(var(--muted-foreground)/0.25)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25">
                  <ReleaseNotesMarkdown content={updateInfo.releaseNotes} />
                </div>
              </div>
            )}

            {/* Primary Action Button: Direct Download APK */}
            <Button
              size="default"
              variant="default"
              onClick={handleDownloadApk}
              className="w-full h-9 rounded-none text-xs gap-1.5 font-mono tracking-wider uppercase bg-amber-700 hover:bg-amber-800 text-white dark:bg-amber-600 dark:hover:bg-amber-500 shadow-sm"
            >
              <ArrowDownToLine className="size-3.5" />
              <span>Download & Install APK</span>
            </Button>

            {/* Secondary Action: View on GitHub */}
            <Button
              size="xs"
              variant="outline"
              onClick={handleOpenReleasePage}
              className="w-full h-7 rounded-none text-[11px] gap-1 font-mono tracking-wider uppercase border-border hover:bg-muted"
            >
              <ExternalLink className="size-3" />
              <span>View Release on GitHub</span>
            </Button>
          </div>

          {/* Footer */}
          <div className="border-t border-border px-3 sm:px-4 py-2 bg-muted/20 flex items-center justify-between shrink-0">
            {/* Don't show again toggle */}
            <button
              type="button"
              onClick={toggleDontShow}
              aria-pressed={dontShowAgain}
              className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono text-muted-foreground hover:text-foreground select-none focus-visible:outline-none"
            >
              <span
                className={`size-3 border flex items-center justify-center transition-colors ${
                  dontShowAgain
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background"
                }`}
              >
                {dontShowAgain && <Check className="size-2 stroke-[3]" />}
              </span>
              <span>Don&apos;t notify for v{updateInfo.latestVersion}</span>
            </button>

            <Button
              size="xs"
              variant="ghost"
              onClick={handleDismissModal}
              className="h-6 px-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground rounded-none"
            >
              Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
