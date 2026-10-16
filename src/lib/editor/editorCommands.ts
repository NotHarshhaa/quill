"use client";

/**
 * Tiny decoupling bridge so app-level surfaces (More menu, Command Palette)
 * can trigger commands that live inside the MarkdownEditor without hoisting
 * the editor's internal state (textarea ref, undo stack, typewriter flag).
 */
export type EditorCommand = "find" | "typewriter";

const EDITOR_COMMAND_EVENT = "quill:editor-command";

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
