export interface LineToken {
  type: "heading" | "list_item" | "blockquote" | "code_fence" | "thematic_break" | "blank" | "text";
  raw: string;
  indent: number;
}

export function tokenizeLines(markdown: string): LineToken[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  return lines.map((raw) => {
    const trimmed = raw.trim();
    const indent = raw.search(/\S|$/);

    if (!trimmed) {
      return { type: "blank", raw, indent };
    }
    if (trimmed.startsWith("```")) {
      return { type: "code_fence", raw, indent };
    }
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      return { type: "thematic_break", raw, indent };
    }
    if (/^#{1,6}\s+/.test(trimmed)) {
      return { type: "heading", raw, indent };
    }
    if (trimmed.startsWith(">")) {
      return { type: "blockquote", raw, indent };
    }
    if (/^(\s*)([-*+]|\d+\.)\s+/.test(raw)) {
      return { type: "list_item", raw, indent };
    }
    return { type: "text", raw, indent };
  });
}
