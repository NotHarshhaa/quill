"use client";

import { useMemo } from "react";
import { parseMarkdown, MarkdownDocument } from "@/lib/markdown";

export function useMarkdownPreview(markdown: string): MarkdownDocument {
  return useMemo(() => {
    return parseMarkdown(markdown);
  }, [markdown]);
}
