/**
 * Tag rewriting helpers. Tags live inside the note body (`#tag`), so
 * renaming or merging one has to touch the markdown itself — the cached
 * `note.tags` array is only a mirror of what the body contains.
 */

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replace every `#from` occurrence with `#to`.
 * `to` may be empty, which removes the tag from the body.
 */
export function replaceTagInContent(
  content: string,
  from: string,
  to: string
): string {
  if (!content || !from) return content;
  const pattern = new RegExp(
    `(^|[\\s(])#${escapeRegExp(from)}(?![\\w-])`,
    "g"
  );
  return content.replace(pattern, (_match, prefix: string) =>
    to ? `${prefix}#${to}` : prefix
  );
}

/**
 * Collapse hashtags that sit next to each other (`#creative #creative` →
 * `#creative`). Replacing one tag with another can produce such a pair when
 * the target tag was already present; far-apart mentions in prose are left
 * untouched.
 */
export function dedupeAdjacentTags(content: string): string {
  if (!content) return content;
  return content.replace(/(#[\w-]+)(\s+\1)+/g, "$1");
}

/** Mirror of {@link replaceTagInContent} for the cached tag list. */
export function renameTagInList(
  tags: string[] | undefined,
  from: string,
  to: string
): string[] {
  const list = Array.isArray(tags) ? tags : [];
  const next = list.map((t) => (t.toLowerCase() === from.toLowerCase() ? to : t));
  return Array.from(new Set(next.filter(Boolean)));
}

/** Merge `from` into `into`: `from` disappears, `into` keeps both sets. */
export function mergeTagInList(
  tags: string[] | undefined,
  from: string,
  into: string
): string[] {
  const list = Array.isArray(tags) ? tags : [];
  const next = list
    .filter((t) => t.toLowerCase() !== from.toLowerCase())
    .map((t) => (t.toLowerCase() === into.toLowerCase() ? into : t));
  if (!next.some((t) => t.toLowerCase() === into.toLowerCase())) {
    next.push(into);
  }
  return Array.from(new Set(next.filter(Boolean)));
}
