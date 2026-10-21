import { Capacitor } from "@capacitor/core";

/**
 * The app version. `next.config.ts` injects NEXT_PUBLIC_APP_VERSION from
 * package.json at build time; the literal is only a development fallback.
 */
export const CURRENT_APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION || "1.7.0";
export const GITHUB_REPO = "NotHarshhaa/quill";

/**
 * Optional static manifest (hosted next to the APK). When set it is the
 * primary source: it is not rate limited like the GitHub API and can carry
 * the APK size and checksum.
 */
export const UPDATE_MANIFEST_URL =
  process.env.NEXT_PUBLIC_UPDATE_MANIFEST_URL || "";

/** Version the user explicitly chose to skip — never shown again. */
export const DISMISSED_UPDATE_KEY = "quill_dismissed_update_version";
/** Timestamp until which the update prompt stays quiet ("remind me later"). */
export const REMIND_LATER_KEY = "quill_update_remind_later_at";
/** Timestamp of the last successful check — used to rate limit the network. */
export const LAST_CHECK_KEY = "quill_update_last_check_at";
/** How often the app is allowed to hit the network for a release check. */
export const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  downloadUrl: string;
  releaseUrl: string;
  publishedAt?: string;
  /** Size of the APK asset in bytes, when the source reports it. */
  apkSize?: number;
  /** Optional SHA-256 of the APK asset. */
  sha256?: string;
}

export type UpdateStatus =
  | "idle"
  | "checking"
  | "up-to-date"
  | "available"
  | "error";

export interface UpdateCheckResult {
  status: UpdateStatus;
  info?: UpdateInfo;
  /** Human readable explanation (errors, "checked recently", …). */
  message?: string;
}

function cleanVersion(value: string): string {
  return (value || "").trim().replace(/^[vV]/, "");
}

/**
 * Compares two version strings the way semver does: numeric segments first,
 * then a pre-release suffix (`1.7.0-beta` is *older* than `1.7.0`).
 * Returns > 0 when a is newer than b, < 0 when older and 0 when equal.
 */
export function compareVersions(a: string, b: string): number {
  const parse = (value: string) => {
    const [core, pre = ""] = cleanVersion(value).split("-", 2);
    const nums = core.split(".").map((n) => {
      const parsed = parseInt(n, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    });
    return { nums, pre };
  };

  const left = parse(a);
  const right = parse(b);
  const max = Math.max(left.nums.length, right.nums.length);

  for (let i = 0; i < max; i++) {
    const l = left.nums[i] ?? 0;
    const r = right.nums[i] ?? 0;
    if (l !== r) return l > r ? 1 : -1;
  }

  // A pre-release is older than the matching release.
  if (left.pre && !right.pre) return -1;
  if (!left.pre && right.pre) return 1;
  if (left.pre && right.pre && left.pre !== right.pre) {
    return left.pre > right.pre ? 1 : -1;
  }

  return 0;
}

/** True when `remoteVersion` is strictly newer than `localVersion`. */
export function isNewerVersion(remoteVersion: string, localVersion: string): boolean {
  return compareVersions(remoteVersion, localVersion) > 0;
}

/**
 * Checks if the current runtime is inside the native mobile app (Capacitor),
 * or if a test query parameter is provided in development.
 */
export function isNativeAppEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  if (Capacitor.isNativePlatform()) return true;
  if (window.location.search.includes("test_update=true")) return true;
  return false;
}

/* ------------------------------------------------------------------ */
/* Dismiss / remind state                                             */
/* ------------------------------------------------------------------ */

export function getDismissedVersion(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(DISMISSED_UPDATE_KEY);
  } catch {
    return null;
  }
}

/** Never notify about this version again. */
export function dismissVersion(version: string): void {
  if (typeof window === "undefined" || !version) return;
  try {
    localStorage.setItem(DISMISSED_UPDATE_KEY, version);
    localStorage.removeItem(REMIND_LATER_KEY);
  } catch {
    /* storage unavailable */
  }
}

/** Hide the prompt until `timestamp` (used by "remind me later"). */
export function setRemindLaterUntil(timestamp: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REMIND_LATER_KEY, String(timestamp));
  } catch {
    /* storage unavailable */
  }
}

export function getRemindLaterUntil(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem(REMIND_LATER_KEY) || 0) || 0;
  } catch {
    return 0;
  }
}

/** True while the prompt should stay hidden because of "remind me later". */
export function isRemindLaterActive(now: number = Date.now()): boolean {
  const until = getRemindLaterUntil();
  return until > 0 && now < until;
}

function markChecked(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
  } catch {
    /* storage unavailable */
  }
}

export function getLastCheckAt(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem(LAST_CHECK_KEY) || 0) || 0;
  } catch {
    return 0;
  }
}

/* ------------------------------------------------------------------ */
/* Release sources                                                    */
/* ------------------------------------------------------------------ */

interface ReleasePayload {
  version: string;
  releaseName: string;
  releaseNotes: string;
  downloadUrl: string;
  releaseUrl: string;
  publishedAt?: string;
  apkSize?: number;
  sha256?: string;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Static manifest first (no rate limits), GitHub releases as the fallback. */
async function fetchReleasePayload(): Promise<ReleasePayload> {
  if (UPDATE_MANIFEST_URL) {
    try {
      const response = await fetchWithTimeout(
        UPDATE_MANIFEST_URL,
        { headers: { Accept: "application/json" } },
        10000
      );
      if (response.ok) {
        const data = await response.json();
        const version = cleanVersion(data.version || data.tag || "");
        if (version) {
          return {
            version,
            releaseName: data.name || `v${version}`,
            releaseNotes: data.notes || data.body || "",
            downloadUrl: data.url || data.downloadUrl || "",
            releaseUrl: data.releaseUrl || data.html_url || "",
            publishedAt: data.publishedAt || data.published_at,
            apkSize:
              typeof data.apkSize === "number"
                ? data.apkSize
                : typeof data.size === "number"
                ? data.size
                : undefined,
            sha256: data.sha256 || data.checksum,
          };
        }
      }
    } catch {
      // Fall through to GitHub.
    }
  }

  const response = await fetchWithTimeout(
    `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
    { headers: { Accept: "application/vnd.github.v3+json" } },
    10000
  );

  if (response.status === 403) {
    throw new Error("rate-limited");
  }
  if (!response.ok) {
    throw new Error(`http-${response.status}`);
  }

  const data = await response.json();
  const rawTag = data.tag_name || "";
  const version = cleanVersion(rawTag);

  // Prefer the direct APK asset over the release page.
  let apkDownloadUrl = data.html_url;
  let apkSize: number | undefined;
  let sha256: string | undefined;
  if (Array.isArray(data.assets)) {
    const apkAsset = data.assets.find((asset: { name?: string; browser_download_url?: string }) =>
      asset.name?.toLowerCase().endsWith(".apk")
    );
    if (apkAsset?.browser_download_url) {
      apkDownloadUrl = apkAsset.browser_download_url;
      if (typeof apkAsset.size === "number") apkSize = apkAsset.size;
    }
  }

  return {
    version,
    releaseName: data.name || rawTag,
    releaseNotes: data.body || "",
    downloadUrl: apkDownloadUrl,
    releaseUrl: data.html_url || "",
    publishedAt: data.published_at,
    apkSize,
    sha256,
  };
}

export interface CheckOptions {
  /** Ignore the rate limit and the "remind me later" window. */
  force?: boolean;
  /** Ignore the "skip this version" preference. */
  ignoreDismissed?: boolean;
}

/**
 * Checks for a newer release.
 *
 * Returns a status instead of `null` so the UI can explain *why* nothing
 * happened (offline, rate limited, up to date, …).
 */
export async function checkForAppUpdate(
  options: CheckOptions = {}
): Promise<UpdateCheckResult> {
  const { force = false, ignoreDismissed = false } = options;

  if (!isNativeAppEnvironment()) {
    return { status: "idle", message: "Updates are only offered in the mobile app." };
  }

  if (!force) {
    const last = getLastCheckAt();
    if (last && Date.now() - last < CHECK_INTERVAL_MS) {
      return { status: "idle", message: "Checked recently — will look again later." };
    }
  }

  try {
    const payload = await fetchReleasePayload();
    markChecked();

    const latestVersion = cleanVersion(payload.version);
    if (!latestVersion) {
      return { status: "error", message: "The release feed did not contain a version." };
    }

    const hasUpdate = isNewerVersion(latestVersion, CURRENT_APP_VERSION);

    const info: UpdateInfo = {
      hasUpdate,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion,
      releaseName: payload.releaseName,
      releaseNotes: payload.releaseNotes,
      downloadUrl: payload.downloadUrl,
      releaseUrl: payload.releaseUrl,
      publishedAt: payload.publishedAt,
      apkSize: payload.apkSize,
      sha256: payload.sha256,
    };

    if (!hasUpdate) {
      return { status: "up-to-date", info };
    }

    if (!ignoreDismissed && getDismissedVersion() === latestVersion) {
      return { status: "idle", info, message: `You skipped v${latestVersion}.` };
    }

    if (!force && isRemindLaterActive()) {
      return { status: "idle", info, message: "Reminder snoozed." };
    }

    return { status: "available", info };
  } catch (error) {
    const message =
      error instanceof Error && error.message === "rate-limited"
        ? "GitHub rate limit reached — try again later."
        : "Could not reach the release server.";
    return { status: "error", message };
  }
}
