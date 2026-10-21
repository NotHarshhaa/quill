/**
 * Daily note helpers — one note per calendar day, opened from the command
 * palette or the More sheet. The note is tagged `daily` so it can be
 * filtered like any other tag.
 */
export const DAILY_TAG = "daily";

/** Human title for a day, e.g. "Wednesday, 21 October 2026". */
export function formatDailyTitle(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * True when the note is the daily note for the given day.
 *
 * The title is the reliable marker: a daily note is the only note titled
 * with the full date. The `daily` tag is a convenience filter, but tags are
 * derived from the note body, so the title is what we match on.
 */
export function isDailyNoteFor(
  note: { title?: string; tags?: string[] },
  date: Date = new Date()
): boolean {
  return note.title === formatDailyTitle(date);
}

/**
 * Starting content for a freshly created daily note.
 *
 * The `#daily` tag lives in the body so it survives the automatic tag
 * extraction that runs on every save.
 */
export function dailyNoteContent(title: string): string {
  return `# ${title}\n\n#${DAILY_TAG}\n`;
}
