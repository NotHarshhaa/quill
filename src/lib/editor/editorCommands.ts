"use client";

/**
 * Tiny decoupling bridge so app-level surfaces (top bar, More menu, mobile
 * tab bar / keyboard accessory bar, Command Palette) can trigger commands that
 * live inside the MarkdownEditor without hoisting the editor's internal state
 * (textarea ref, undo stack, typewriter flag) — and so those surfaces can
 * *read* a small snapshot of that state.
 */
export type EditorCommand =
  | "find"
  | "typewriter"
  | "undo"
  | "redo"
  | "bold"
  | "italic"
  | "bullet"
  | "checklist"
  | "link";

const EDITOR_COMMAND_EVENT = "quill:editor-command";
const EDITOR_STATE_EVENT = "quill:editor-state";

export function emitEditorCommand(command: EditorCommand): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<EditorCommand>(EDITOR_COMMAND_EVENT, { detail: command })
  );
}

export function subscribeEditorCommands(
  handler: (command: EditorCommand) => void
): () => void {
  const listener = (event: Event) => {
    handler((event as CustomEvent<EditorCommand>).detail);
  };
  window.addEventListener(EDITOR_COMMAND_EVENT, listener);
  return () => window.removeEventListener(EDITOR_COMMAND_EVENT, listener);
}

export interface EditorState {
  /** True while a MarkdownEditor is mounted somewhere in the tree. */
  mounted: boolean;
  canUndo: boolean;
  canRedo: boolean;
  typewriter: boolean;
}

const EMPTY_EDITOR_STATE: EditorState = {
  mounted: false,
  canUndo: false,
  canRedo: false,
  typewriter: false,
};

let currentEditorState: EditorState = EMPTY_EDITOR_STATE;

export function getEditorState(): EditorState {
  return currentEditorState;
}

/** Publish a partial update to the shared editor state snapshot. */
export function setEditorState(patch: Partial<EditorState>): void {
  currentEditorState = { ...currentEditorState, ...patch };
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<EditorState>(EDITOR_STATE_EVENT, { detail: currentEditorState })
  );
}

export function subscribeEditorState(
  handler: (state: EditorState) => void
): () => void {
  const listener = (event: Event) => {
    handler((event as CustomEvent<EditorState>).detail);
  };
  window.addEventListener(EDITOR_STATE_EVENT, listener);
  return () => window.removeEventListener(EDITOR_STATE_EVENT, listener);
}
