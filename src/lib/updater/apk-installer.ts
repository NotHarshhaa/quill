/**
 * In-app APK download + install for the Android build.
 *
 * The WebView cannot install an APK itself, so the native shell does the
 * work: `AndroidBridge.downloadAndInstall(url, fileName)` streams the APK to
 * the app cache and hands it to the system package installer, reporting
 * progress back through `window.__quillUpdateProgress(percent, stage)`.
 *
 * When the native bridge is unavailable (web preview, or an older build) the
 * download falls back to a plain browser download so the flow still ends
 * somewhere sensible instead of silently doing nothing.
 */

export type InstallStage =
  | "idle"
  | "downloading"
  | "ready"
  | "installing"
  | "needs-permission"
  | "error";

export interface InstallProgress {
  stage: InstallStage;
  /** 0–100, or -1 when the total size is unknown. */
  percent: number;
  message?: string;
}

interface AndroidUpdateBridge {
  downloadAndInstall?: (url: string, fileName: string) => void;
  installApk?: (path: string) => void;
}

declare global {
  interface Window {
    AndroidBridge?: AndroidUpdateBridge;
    __quillUpdateProgress?: (percent: number, stage: string) => void;
  }
}

/** True when the native installer bridge is present. */
export function isNativeInstallerAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return typeof window.AndroidBridge?.downloadAndInstall === "function";
}

function fileNameFor(url: string, version: string): string {
  try {
    const path = new URL(url).pathname;
    const name = path.split("/").pop();
    if (name && name.toLowerCase().endsWith(".apk")) return name;
  } catch {
    /* not a parsable url */
  }
  return `quill-${version || "update"}.apk`;
}

/**
 * Downloads and installs the APK.
 *
 * `onProgress` receives every state change, including native download
 * progress and the "needs-permission" hand-off to Android's install settings.
 */
export function downloadAndInstallApk(
  url: string,
  version: string,
  onProgress?: (progress: InstallProgress) => void
): void {
  if (typeof window === "undefined" || !url) {
    onProgress?.({ stage: "error", percent: 0, message: "No download available." });
    return;
  }

  const report = (percent: number, stage: string) => {
    const normalized: InstallStage =
      stage === "downloading" || stage === "ready" || stage === "installing" || stage === "needs-permission"
        ? stage
        : stage.startsWith("error")
        ? "error"
        : "idle";
    const message =
      normalized === "error" ? friendlyError(stage) : undefined;
    onProgress?.({ stage: normalized, percent, message });
  };

  if (isNativeInstallerAvailable()) {
    window.__quillUpdateProgress = report;
    try {
      window.AndroidBridge?.downloadAndInstall?.(url, fileNameFor(url, version));
      return;
    } catch (error) {
      onProgress?.({
        stage: "error",
        percent: 0,
        message: "The installer could not be started.",
      });
      return;
    }
  }

  // Fallback: let the browser handle the download.
  onProgress?.({ stage: "downloading", percent: -1 });
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.rel = "noopener";
    anchor.download = fileNameFor(url, version);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    onProgress?.({ stage: "ready", percent: 100 });
  } catch {
    window.open(url, "_blank");
    onProgress?.({ stage: "ready", percent: 100 });
  }
}

function friendlyError(stage: string): string {
  if (stage.startsWith("error:http-")) {
    const code = stage.split("-")[1];
    if (code === "403" || code === "404") {
      return "The release file is not reachable right now.";
    }
    return `The download failed (HTTP ${code}).`;
  }
  switch (stage) {
    case "error:missing-file":
      return "The downloaded file went missing.";
    case "error:install-failed":
      return "Android could not open the installer.";
    case "error:storage":
      return "Not enough space to download the update.";
    default:
      return "The update could not be downloaded.";
  }
}

/** Opens the release page in the system browser. */
export function openReleasePage(url: string): void {
  if (!url || typeof window === "undefined") return;
  window.open(url, "_blank", "noopener");
}
