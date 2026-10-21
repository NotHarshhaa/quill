"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ArrowDownToLine, X } from "lucide-react";

import {
  UpdateInfo,
  checkForAppUpdate,
  getDismissedVersion,
  isNativeAppEnvironment,
  isRemindLaterActive,
} from "@/lib/updater/update-checker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AppUpdateNotifierProps {
  /** Pause the prompt (e.g. while the user is writing). */
  paused?: boolean;
  /** Called when the user opens the full Update Center. */
  onOpenCenter?: (info: UpdateInfo) => void;
  /** How long the quiet banner stays on screen. */
  autoHideMs?: number;
}

/**
 * A quiet, non-blocking update prompt for the Android build.
 *
 * It deliberately does *not* interrupt: the check runs once per launch (and
 * at most every six hours), the banner waits until the user is idle, it never
 * covers the editor and it disappears on its own. Everything else lives in
 * the Update Center.
 */
export function AppUpdateNotifier({
  paused = false,
  onOpenCenter,
  autoHideMs = 12000,
}: AppUpdateNotifierProps) {
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [visible, setVisible] = useState(false);

  const native = isNativeAppEnvironment();

  const runCheck = useCallback(async () => {
    if (!native) return;
    const result = await checkForAppUpdate();
    if (result.status !== "available" || !result.info) return;
    if (getDismissedVersion() === result.info.latestVersion) return;
    if (isRemindLaterActive()) return;
    setInfo(result.info);
  }, [native]);

  useEffect(() => {
    if (!native) return;
    // Wait a moment so the first paint of the editor is never delayed.
    const timer = setTimeout(() => void runCheck(), 3500);
    return () => clearTimeout(timer);
  }, [native, runCheck]);

  // Only show the banner when the user is not busy writing.
  useEffect(() => {
    if (!info || paused) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), autoHideMs);
    return () => clearTimeout(timer);
  }, [info, paused, autoHideMs]);

  if (!native || !info || !visible) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 max-w-[92vw] w-auto animate-in fade-in slide-in-from-top-3 duration-300
                 top-[calc(var(--safe-top,0px)+4rem)] md:top-[calc(var(--safe-top,0px)+3.5rem)]"
    >
      <div
        className={cn(
          "relative flex items-center gap-2.5 bg-card/95 backdrop-blur-md shadow-soft-lg",
          "px-2.5 py-2 text-foreground font-sans"
        )}
      >
        <div className="size-7 bg-brand-soft text-brand flex items-center justify-center shrink-0">
          <ArrowDownToLine className="size-3.5" strokeWidth={1.75} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs font-medium truncate">
            Quill{" "}
            <span className="font-mono font-bold text-brand">v{info.latestVersion}</span>{" "}
            is ready
          </p>
          <p className="text-[10px] text-muted-foreground truncate hidden sm:block">
            Tap to review the changes and install
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="xs"
            variant="default"
            onClick={() => {
              setVisible(false);
              onOpenCenter?.(info);
            }}
            className="h-7 px-2.5 rounded-none text-[10px] font-mono tracking-wider uppercase bg-brand text-brand-foreground hover:bg-brand/90"
          >
            Update
          </Button>
          <button
            type="button"
            onClick={() => setVisible(false)}
            aria-label="Dismiss update notification"
            className="flex size-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
