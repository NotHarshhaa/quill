"use client";

import { useState, useEffect, useRef } from "react";
import { parseMarkdown, MarkdownDocument } from "@/lib/markdown";

const PARSE_DEBOUNCE_MS = 150;

export function useMarkdownPreview(markdown: string): MarkdownDocument {
  const [parsed, setParsed] = useState<MarkdownDocument>(() => parseMarkdown(markdown));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setParsed(parseMarkdown(markdown));
    }, PARSE_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [markdown]);

  return parsed;
}
