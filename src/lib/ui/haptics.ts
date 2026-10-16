"use client";

/**
 * Fire a short haptic tap for bottom-navigation presses.
 *
 * Prefers the native Capacitor Haptics plugin when present (available on the
 * APK without adding a JS dependency), and otherwise falls back to the
 * Vibration API. Both paths are best-effort and never throw.
 */
export function hapticTap(strength: "light" | "medium" = "light"): void {
  if (typeof window === "undefined") return;

  try {
    const haptics = (
      window as unknown as {
        Capacitor?: {
          Plugins?: {
            Haptics?: {
              impact?: (opts: { style: string }) => Promise<void>;
            };
          };
        };
      }
    ).Capacitor?.Plugins?.Haptics;

    if (haptics?.impact) {
      void haptics.impact({ style: strength === "medium" ? "MEDIUM" : "LIGHT" });
      return;
    }
  } catch {
    /* fall through to the Vibration API */
  }

  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(strength === "medium" ? 15 : 8);
    }
  } catch {
    /* ignore */
  }
}
