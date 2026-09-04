import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function countWords(text: string): number {
  const clean = text.trim();
  if (!clean) return 0;
  return clean.split(/\s+/).filter(Boolean).length;
}

/**
 * Extract tags from markdown content
 */
export function extractTags(content?: string | null): string[] {
  if (!content || typeof content !== "string") return [];
  const matches = content.match(/(?:^|\s)#([a-zA-Z0-9_\-]+)\b/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.trim().replace(/^#/, "").toLowerCase())));
}

/**
 * Sanitize a URL to prevent XSS via javascript: or data: URIs
 * Returns null if the URL is unsafe
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null;

  const trimmed = url.trim().toLowerCase();

  // Block javascript: and data: URIs
  if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:")) {
    return null;
  }

  // Allow http:, https:, mailto:, tel:, and relative URLs
  if (/^(https?:|mailto:|\/|#)/i.test(trimmed)) {
    return url.trim();
  }

  // For other protocols, return null to be safe
  return null;
}
