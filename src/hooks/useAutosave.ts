"use client";

import { useState, useEffect, useRef } from "react";

export type SaveStatus = "saved" | "saving";

export function useAutosave(
  content: string,
  onSave: (content: string) => void,
  delay: number = 350
) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const onSaveRef = useRef(onSave);
  const isFirstRender = useRef(true);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setStatus("saving");
    const timer = setTimeout(() => {
      onSaveRef.current(content);
      setStatus("saved");
    }, delay);

    return () => clearTimeout(timer);
  }, [content, delay]);

  return { status };
}
