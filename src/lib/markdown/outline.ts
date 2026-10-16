import { slugify } from "./parser";

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

/**
 * Extracts markdown headings (#..######) from raw note content, producing
 * anchor ids that match the ids the preview renderer assigns (via slugify,
 * de-duplicated with a numeric suffix). Shared by the Outline drawer and the
 * desktop Document Panel so both agree on anchors.
 */
export function extractHeadings(content: string): TocHeading[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const list: TocHeading[] = [];
  const counts = new Map<string, number>();

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.*)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim().replace(/[*_~`]/g, "");
      if (text) {
        const baseSlug = slugify(text);
        const count = counts.get(baseSlug) || 0;
        counts.set(baseSlug, count + 1);
        const id = count === 0 ? baseSlug : `${baseSlug}-${count}`;
        list.push({ id, text, level });
      }
    }
  }
  return list;
}
