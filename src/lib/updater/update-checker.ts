import { Capacitor } from "@capacitor/core";

export const CURRENT_APP_VERSION = "1.5.0";
export const GITHUB_REPO = "NotHarshhaa/quill";
export const DISMISSED_UPDATE_KEY = "quill_dismissed_update_version";

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  downloadUrl: string;
  releaseUrl: string;
  publishedAt?: string;
}

/**
 * Strips 'v' prefix and compares two semantic version strings.
 * Returns true if remoteVersion is strictly greater than localVersion.
 */
export function isNewerVersion(remoteVersion: string, localVersion: string): boolean {
  const clean = (v: string) => v.replace(/^[vV]/, "").trim();
  const remoteParts = clean(remoteVersion).split(".").map((n) => parseInt(n, 10) || 0);
  const localParts = clean(localVersion).split(".").map((n) => parseInt(n, 10) || 0);

  const maxLen = Math.max(remoteParts.length, localParts.length);
  for (let i = 0; i < maxLen; i++) {
    const r = remoteParts[i] || 0;
    const l = localParts[i] || 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

/**
 * Checks if the current runtime is inside the native mobile app (Capacitor),
 * or if test query parameter is provided in development.
 */
export function isNativeAppEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  if (Capacitor.isNativePlatform()) return true;
  if (window.location.search.includes("test_update=true")) return true;
  return false;
}

/**
 * Checks GitHub Releases for the latest version.
 * Runs only in the native app environment.
 */
export async function checkForAppUpdate(ignoreDismissed = false): Promise<UpdateInfo | null> {
  // Never run or show on web browsers unless explicitly testing
  if (!isNativeAppEnvironment()) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        signal: controller.signal,
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const rawTag = data.tag_name || "";
    const latestVersion = rawTag.replace(/^[vV]/, "");

    // Check if dismissed before
    if (!ignoreDismissed && typeof window !== "undefined") {
      const dismissed = localStorage.getItem(DISMISSED_UPDATE_KEY);
      if (dismissed === latestVersion) {
        return null;
      }
    }

    const hasUpdate = isNewerVersion(rawTag, CURRENT_APP_VERSION);
    if (!hasUpdate) {
      return {
        hasUpdate: false,
        currentVersion: CURRENT_APP_VERSION,
        latestVersion,
        releaseName: data.name || rawTag,
        releaseNotes: data.body || "",
        downloadUrl: data.html_url || "",
        releaseUrl: data.html_url || "",
      };
    }

    // Find direct APK asset if available
    let apkDownloadUrl = data.html_url;
    if (Array.isArray(data.assets)) {
      const apkAsset = data.assets.find((asset: { name?: string; browser_download_url?: string }) =>
        asset.name?.toLowerCase().endsWith(".apk")
      );
      if (apkAsset?.browser_download_url) {
        apkDownloadUrl = apkAsset.browser_download_url;
      }
    }

    return {
      hasUpdate: true,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion,
      releaseName: data.name || rawTag,
      releaseNotes: data.body || "",
      downloadUrl: apkDownloadUrl,
      releaseUrl: data.html_url || "",
      publishedAt: data.published_at,
    };
  } catch {
    // Network offline or failed request
    return null;
  }
}
