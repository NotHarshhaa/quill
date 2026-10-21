"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  Check,
  Download,
  ExternalLink,
  HardDriveDownload,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReleaseNotesMarkdown } from "@/components/update/release-notes";
import {
  CURRENT_APP_VERSION,
  UpdateInfo,
  UpdateStatus,
  checkForAppUpdate,
  dismissVersion,
  setRemindLaterUntil,
} from "@/lib/updater/update-checker";
import {
  InstallProgress,
  downloadAndInstallApk,
  isNativeInstallerAvailable,
  openReleasePage,
} from "@/lib/updater/apk-installer";

export interface UpdateCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Skip the "remind me later" window and always re-check when opened. */
  checkOnOpen?: boolean;
  /** Bypass the six-hour rate limit (the user asked for this explicitly). */
  forceCheck?: boolean;
}

const REMIND_LATER_MS = 24 * 60 * 60 * 1000;

function formatBytes(bytes?: number): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * The app's update surface: checks for a newer release, shows the notes and
 * drives the in-app APK download + install.
 *
 * On phones it is a bottom sheet, on desktop a side drawer.
 */
export function UpdateCenter({
  open,
  onOpenChange,
  checkOnOpen = true,
  forceCheck = false,
}: UpdateCenterProps) {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [progress, setProgress] = useState<InstallProgress | null>(null);
  const [busy, setBusy] = useState(false);

  const runCheck = async (force: boolean) => {
    setBusy(true);
    setStatus("checking");
    setMessage(undefined);
    const result = await checkForAppUpdate({ force });
    setStatus(result.status);
    setInfo(result.info ?? null);
    setMessage(result.message);
    setBusy(false);
  };

  useEffect(() => {
    if (!open || !checkOnOpen) return;
    void runCheck(forceCheck);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, checkOnOpen, forceCheck]);

  const downloading = progress?.stage === "downloading";
  const installing = progress?.stage === "installing";
  const needsPermission = progress?.stage === "needs-permission";
  const failed = progress?.stage === "error";

  const apkSize = useMemo(() => formatBytes(info?.apkSize), [info?.apkSize]);
  const published = useMemo(() => formatDate(info?.publishedAt), [info?.publishedAt]);

  const handleInstall = () => {
    if (!info?.downloadUrl) return;
    setProgress({ stage: "downloading", percent: 0 });
    downloadAndInstallApk(info.downloadUrl, info.latestVersion, setProgress);
  };

  const handleRemindLater = () => {
    if (info) setRemindLaterUntil(Date.now() + REMIND_LATER_MS);
    onOpenChange(false);
  };

  const handleSkip = () => {
    if (info) dismissVersion(info.latestVersion);
    onOpenChange(false);
  };

  const stateTitle = (() => {
    if (status === "checking") return "Checking for updates…";
    if (status === "error") return "Update check failed";
    if (status === "up-to-date") return "You're up to date";
    if (status === "available") return `Version ${info?.latestVersion} is available`;
    return "Update Center";
  })();

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Update Center"
      icon={<Sparkles className="size-icon text-brand shrink-0" strokeWidth={1.75} />}
      badge={
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          v{CURRENT_APP_VERSION}
        </span>
      }
      drawerWidth="md"
      snapPoints={["half", "full"]}
      bodyClassName="px-0 py-0"
    >
      <div className="px-4 py-3 space-y-3">
        {/* Status header */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "size-11 shrink-0 flex items-center justify-center bg-brand-soft text-brand",
              "rounded-none"
            )}
          >
            {status === "up-to-date" ? (
              <ShieldCheck className="size-5" strokeWidth={1.75} />
            ) : status === "error" ? (
              <TriangleAlert className="size-5" strokeWidth={1.75} />
            ) : (
              <ArrowDownToLine className="size-5" strokeWidth={1.75} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-foreground">{stateTitle}</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {status === "checking" && "Contacting the release server…"}
              {status === "up-to-date" &&
                `Quill ${CURRENT_APP_VERSION} is the latest release.`}
              {status === "available" &&
                `Your build is ${info?.currentVersion}. The new release adds:`}
              {status === "error" && (message || "Could not reach the release server.")}
              {status === "idle" && (message || "Check the release feed for a newer build.")}
            </p>
          </div>
        </div>

        {/* Version pills + metadata */}
        {info && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] px-2 py-1 bg-muted/60 text-muted-foreground">
              CURRENT {info.currentVersion}
            </span>
            {info.hasUpdate && (
              <>
                <span className="text-muted-foreground text-xs">→</span>
                <span className="font-mono text-[10px] px-2 py-1 bg-brand-soft text-brand font-semibold">
                  LATEST {info.latestVersion}
                </span>
              </>
            )}
            {published && (
              <span className="font-mono text-[10px] text-muted-foreground/70">
                {published}
              </span>
            )}
            {apkSize && (
              <span className="font-mono text-[10px] text-muted-foreground/70">
                · {apkSize}
              </span>
            )}
          </div>
        )}

        {/* Release notes */}
        {info?.hasUpdate && info.releaseNotes && (
          <div className="bg-muted/30 p-3 text-left max-h-52 overflow-y-auto [scrollbar-width:thin]">
            <ReleaseNotesMarkdown content={info.releaseNotes} />
          </div>
        )}

        {/* Download progress */}
        {progress && progress.stage !== "idle" && (
          <div className="bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-foreground">
                {failed ? (
                  <TriangleAlert className="size-3.5 text-destructive" />
                ) : (
                  <Download className="size-3.5 text-brand" />
                )}
                {downloading && "Downloading update…"}
                {installing && "Opening the installer…"}
                {needsPermission && "Allow installs, then try again"}
                {failed && (progress.message || "Download failed")}
                {progress.stage === "ready" && "Ready to install"}
              </span>
              {progress.percent >= 0 && downloading && (
                <span className="font-mono text-muted-foreground">
                  {progress.percent}%
                </span>
              )}
            </div>
            <div className="h-1.5 bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full transition-[width] duration-200",
                  failed ? "bg-destructive" : "bg-brand"
                )}
                style={{
                  width:
                    progress.percent >= 0
                      ? `${Math.max(4, progress.percent)}%`
                      : "45%",
                }}
              />
            </div>
            {needsPermission && (
              <p className="text-[10.5px] text-muted-foreground">
                Android needs permission to install this app. We opened the
                setting — enable it and tap download again.
              </p>
            )}
            {failed && (
              <Button
                size="xs"
                variant="outline"
                onClick={handleInstall}
                className="h-7 px-2 text-[10.5px] gap-1"
              >
                <RefreshCw className="size-3" />
                Retry
              </Button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-1.5">
          {info?.hasUpdate && !downloading && !installing && (
            <Button
              size="default"
              variant="default"
              onClick={handleInstall}
              disabled={!info.downloadUrl}
              className="w-full h-10 rounded-none text-xs gap-1.5 font-mono tracking-wider uppercase bg-brand text-brand-foreground hover:bg-brand/90"
            >
              <HardDriveDownload className="size-4" />
              <span>
                {isNativeInstallerAvailable()
                  ? "Download & Install"
                  : "Download APK"}
              </span>
            </Button>
          )}

          {info?.hasUpdate && info.releaseUrl && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => openReleasePage(info.releaseUrl)}
              className="w-full h-8 rounded-none text-[11px] gap-1 font-mono tracking-wider uppercase"
            >
              <ExternalLink className="size-3" />
              <span>View Release</span>
            </Button>
          )}

          <Button
            size="xs"
            variant="ghost"
            onClick={() => runCheck(true)}
            disabled={busy}
            className="w-full h-8 rounded-none text-[11px] gap-1 font-mono tracking-wider uppercase text-muted-foreground"
          >
            <RefreshCw className={cn("size-3", busy && "animate-spin")} />
            <span>{busy ? "Checking…" : "Check for updates"}</span>
          </Button>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 ds-hairline-t bg-muted/20">
        {info?.hasUpdate ? (
          <button
            type="button"
            onClick={handleSkip}
            className="flex items-center gap-1.5 text-[10.5px] font-mono text-muted-foreground hover:text-foreground"
          >
            <Check className="size-3" />
            <span>Skip v{info.latestVersion}</span>
          </button>
        ) : (
          <span className="text-[10.5px] font-mono text-muted-foreground/60">
            v{CURRENT_APP_VERSION}
          </span>
        )}

        <div className="flex items-center gap-2">
          {info?.hasUpdate && (
            <button
              type="button"
              onClick={handleRemindLater}
              className="text-[10.5px] font-mono text-muted-foreground hover:text-foreground"
            >
              Remind me later
            </button>
          )}
          <Button
            size="xs"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-7 px-2 text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground rounded-none"
          >
            Close
          </Button>
        </div>
      </div>
    </ResponsiveSheet>
  );
}
