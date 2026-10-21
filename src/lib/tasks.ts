/**
 * Cross-note checklist helpers.
 *
 * The task pattern below is deliberately identical to the one used by
 * `toggleTaskInMarkdown` in the markdown parser: tasks are counted in
 * document order across unordered AND ordered lists, including
 * blockquote-prefixed lines. Keeping both in sync means the index this
 * module reports is exactly the index the preview's checkboxes toggle.
 */
export interface NoteTask {
  /** 0-based sequential task index inside the note (matches the preview). */
  index: number;
  /** Task text with the leading `[ ]` / `[x]` marker removed. */
  text: string;
  checked: boolean;
  /** 0-based line number of the task inside the note. */
  line: number;
}

const TASK_PATTERN =
  /^([ \t]*(?:>[ \t]*)*(?:[-*+]|\d+\.)[ \t]+\[)([ xX])(\](?:[ \t]+.*)?)$/;

/** Extract every checklist item of a note, in document order. */
export function extractTasks(content?: string | null): NoteTask[] {
  if (!content) return [];
  const lines = content.split("\n");
  const tasks: NoteTask[] = [];
  let index = 0;

  for (let line = 0; line < lines.length; line++) {
    const match = lines[line].match(TASK_PATTERN);
    if (!match) continue;
    tasks.push({
      index: index++,
      text: match[3].replace(/^\]\s*/, "").trim(),
      checked: match[2].toLowerCase() === "x",
      line,
    });
  }

  return tasks;
}

/**
 * Set a checklist item to an explicit state (`[ ]` / `[x]`) by its
 * sequential task index. Unlike `toggleTaskInMarkdown` this is idempotent,
 * which is what a task list needs when the user taps a checkbox that is
 * already in the requested state.
 */
export function setTaskCheckedInMarkdown(
  markdown: string,
  targetTaskIndex: number,
  checked: boolean
): string {
  const lines = markdown.split("\n");
  let current = 0;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(TASK_PATTERN);
    if (!match) continue;
    if (current === targetTaskIndex) {
      const marker = checked ? "x" : " ";
      lines[i] = `${match[1]}${marker}${match[3]}`;
      return lines.join("\n");
    }
    current++;
  }

  return markdown;
}

/**
 * Remove the inline markdown markers from a task label so a list reads as
 * plain text (`**bold**` → `bold`, `` `code` `` → `code`).
 */
export function stripInlineMarkdown(text: string): string {
  return text
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/(^|\s)\*([^*]+)\*/g, "$1$2")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
}
