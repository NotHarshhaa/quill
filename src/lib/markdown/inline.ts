import { InlineNode } from "./types";

export function parseInline(text: string): InlineNode[] {
  if (!text) return [];

  const nodes: InlineNode[] = [];
  let index = 0;
  const length = text.length;

  while (index < length) {
    // 1. Inline code: `code`
    if (text[index] === "`") {
      const closing = text.indexOf("`", index + 1);
      if (closing !== -1) {
        const codeVal = text.slice(index + 1, closing);
        nodes.push({ type: "code", value: codeVal });
        index = closing + 1;
        continue;
      }
    }

    // 2. Bold: **text** or __text__
    if (
      (text.startsWith("**", index) && text.indexOf("**", index + 2) !== -1) ||
      (text.startsWith("__", index) && text.indexOf("__", index + 2) !== -1)
    ) {
      const marker = text.slice(index, index + 2);
      const closing = text.indexOf(marker, index + 2);
      if (closing !== -1) {
        const inner = text.slice(index + 2, closing);
        nodes.push({ type: "bold", children: parseInline(inner) });
        index = closing + 2;
        continue;
      }
    }

    // 3. Strikethrough: ~~text~~
    if (text.startsWith("~~", index)) {
      const closing = text.indexOf("~~", index + 2);
      if (closing !== -1) {
        const inner = text.slice(index + 2, closing);
        nodes.push({ type: "strike", children: parseInline(inner) });
        index = closing + 2;
        continue;
      }
    }

    // 4. Wiki-links: [[Target Note]] or [[Target Note|Custom Label]]
    if (text.startsWith("[[", index)) {
      const closing = text.indexOf("]]", index + 2);
      if (closing !== -1) {
        const raw = text.slice(index + 2, closing).trim();
        if (raw) {
          const [target, label] = raw.includes("|") ? raw.split("|") : [raw, raw];
          nodes.push({
            type: "wikilink",
            target: target.trim(),
            label: (label || target).trim(),
          });
          index = closing + 2;
          continue;
        }
      }
    }

    // 5. Standard Links: [text](href)
    if (text[index] === "[") {
      const closingBracket = text.indexOf("]", index + 1);
      if (
        closingBracket !== -1 &&
        text[closingBracket + 1] === "("
      ) {
        const closingParen = text.indexOf(")", closingBracket + 2);
        if (closingParen !== -1) {
          const label = text.slice(index + 1, closingBracket);
          const href = text.slice(closingBracket + 2, closingParen);
          nodes.push({
            type: "link",
            href: href.trim(),
            children: parseInline(label),
          });
          index = closingParen + 1;
          continue;
        }
      }
    }

    // 5. Italic: *text* or _text_
    if (
      (text[index] === "*" && !text.startsWith("**", index)) ||
      (text[index] === "_" && !text.startsWith("__", index))
    ) {
      const marker = text[index];
      const closing = text.indexOf(marker, index + 1);
      if (closing !== -1 && closing > index + 1) {
        const inner = text.slice(index + 1, closing);
        nodes.push({ type: "italic", children: parseInline(inner) });
        index = closing + 1;
        continue;
      }
    }

    // Accumulate regular text until next potential markdown symbol
    let nextSpecial = length;
    const specialChars = ["`", "*", "_", "~", "["];
    for (const char of specialChars) {
      const pos = text.indexOf(char, index);
      if (pos !== -1 && pos < nextSpecial) {
        nextSpecial = pos;
      }
    }

    if (nextSpecial === index) {
      // Special char couldn't be parsed as markup, treat as literal character
      nodes.push({ type: "text", value: text[index] });
      index++;
    } else {
      nodes.push({ type: "text", value: text.slice(index, nextSpecial) });
      index = nextSpecial;
    }
  }

  // Merge consecutive text nodes
  const merged: InlineNode[] = [];
  for (const node of nodes) {
    const prev = merged[merged.length - 1];
    if (node.type === "text" && prev && prev.type === "text") {
      prev.value += node.value;
    } else {
      merged.push(node);
    }
  }

  return merged;
}
