import { parseInline } from "./inline";
import { BlockNode, MarkdownDocument } from "./types";

export function parseMarkdown(markdown: string): MarkdownDocument {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: BlockNode[] = [];
  let index = 0;
  let taskCounter = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    // 1. Skip empty lines
    if (!trimmed) {
      index++;
      continue;
    }

    // 2. Fenced code block: ```[language]
    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim() || undefined;
      const codeLines: string[] = [];
      index++;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index++;
      }
      if (index < lines.length) {
        index++; // skip closing ```
      }
      blocks.push({
        type: "code_block",
        language,
        code: codeLines.join("\n"),
      });
      continue;
    }

    // 3. Thematic break: ---, ***, ___
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: "thematic_break" });
      index++;
      continue;
    }

    // 4. Headings: # Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      const text = headingMatch[2].trim();
      blocks.push({
        type: "heading",
        level,
        children: parseInline(text),
      });
      index++;
      continue;
    }

    // 5. Blockquote: > text
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index++;
      }
      blocks.push({
        type: "blockquote",
        children: parseMarkdown(quoteLines.join("\n")),
      });
      continue;
    }

    // 6. Lists: unordered or ordered
    const unorderedMatch = line.match(/^(\s*)([-*+])\s+(.*)$/);
    const orderedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);

    if (unorderedMatch || orderedMatch) {
      const isOrdered = Boolean(orderedMatch);
      const items: { children: ReturnType<typeof parseInline>; checked?: boolean; taskIndex?: number }[] = [];

      while (index < lines.length) {
        const curLine = lines[index];
        const uMatch = curLine.match(/^(\s*)([-*+])\s+(.*)$/);
        const oMatch = curLine.match(/^(\s*)(\d+)\.\s+(.*)$/);

        if (isOrdered ? oMatch : uMatch) {
          const content = (isOrdered ? oMatch![3] : uMatch![3]).trim();
          // Check for task item [ ] or [x]
          let checked: boolean | undefined = undefined;
          let taskIndex: number | undefined = undefined;
          let text = content;
          const taskMatch = content.match(/^\[([ xX])\](?:\s+(.*))?$/);
          if (taskMatch) {
            checked = taskMatch[1].toLowerCase() === "x";
            taskIndex = taskCounter++;
            text = taskMatch[2] || "";
          }

          items.push({
            children: parseInline(text),
            checked,
            taskIndex,
          });
          index++;
        } else if (curLine.trim() === "") {
          // Check if next non-empty line continues the list
          let peek = index + 1;
          while (peek < lines.length && lines[peek].trim() === "") {
            peek++;
          }
          if (peek < lines.length && (isOrdered ? lines[peek].match(/^(\s*)(\d+)\.\s+(.*)$/) : lines[peek].match(/^(\s*)([-*+])\s+(.*)$/))) {
            index = peek;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      blocks.push({
        type: "list",
        ordered: isOrdered,
        items,
      });
      continue;
    }

    // 7. Paragraph
    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const cur = lines[index];
      const curTrimmed = cur.trim();
      if (!curTrimmed) break;
      if (
        curTrimmed.startsWith("```") ||
        /^(\*{3,}|-{3,}|_{3,})$/.test(curTrimmed) ||
        cur.match(/^#{1,6}\s+/) ||
        curTrimmed.startsWith(">") ||
        cur.match(/^(\s*)([-*+]|\d+\.)\s+/)
      ) {
        break;
      }
      paragraphLines.push(curTrimmed);
      index++;
    }

    if (paragraphLines.length > 0) {
      blocks.push({
        type: "paragraph",
        children: parseInline(paragraphLines.join(" ")),
      });
    }
  }

  return blocks;
}

/**
 * Toggles a checklist item's state [ ] <-> [x] by its 0-based sequential task index
 */
export function toggleTaskInMarkdown(markdown: string, targetTaskIndex: number): string {
  const lines = markdown.split("\n");
  let currentTaskIdx = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^([ \t]*[-*+][ \t]+\[)([ xX])(\](?:[ \t]+.*)?)$/);
    if (match) {
      if (currentTaskIdx === targetTaskIndex) {
        const isChecked = match[2].toLowerCase() === "x";
        const newChar = isChecked ? " " : "x";
        lines[i] = `${match[1]}${newChar}${match[3]}`;
        return lines.join("\n");
      }
      currentTaskIdx++;
    }
  }

  return markdown;
}
