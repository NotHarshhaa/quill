"use client";

import { useEffect, useState } from "react";
import {
  EditorState,
  getEditorState,
  subscribeEditorState,
} from "@/lib/editor/editorCommands";

/**
 * Read the MarkdownEditor's shared state snapshot (mounted / canUndo / canRedo
 * / typewriter) from any component. Updated via the editorCommands bridge.
 */
export function useEditorState(): EditorState {
  const [state, setState] = useState<EditorState>(() => getEditorState());

  useEffect(() => {
    // Re-sync in case the editor published before this hook mounted.
    setState(getEditorState());
    return subscribeEditorState(setState);
  }, []);

  return state;
}
