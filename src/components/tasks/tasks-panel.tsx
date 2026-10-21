"use client";

import React, { useMemo, useState } from "react";
import { ListTodo, Check, Circle } from "lucide-react";

import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { cn } from "@/lib/utils";
import { extractTasks, stripInlineMarkdown, NoteTask } from "@/lib/tasks";
import { Note } from "@/lib/storage/schema";
import { hapticTap } from "@/lib/ui/haptics";

export type TaskFilter = "open" | "all" | "done";

export interface TasksPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notes: Note[];
  /** Toggle a task inside its own note. */
  onToggleTask: (noteId: string, taskIndex: number, checked: boolean) => void;
  /** Jump to the note that owns the task. */
  onOpenNote: (noteId: string) => void;
}

interface TaskGroup {
  note: Note;
  tasks: NoteTask[];
}

/**
 * Every checklist item in the vault, in one list.
 *
 * Tasks are grouped by their source note, can be checked straight from the
 * list (the note's markdown is rewritten in place) and jump to the note when
 * the title is tapped. Presented as a bottom sheet on phones and a side
 * drawer on desktop.
 */
export function TasksPanel({
  open,
  onOpenChange,
  notes,
  onToggleTask,
  onOpenNote,
}: TasksPanelProps) {
  const [filter, setFilter] = useState<TaskFilter>("open");

  const groups = useMemo<TaskGroup[]>(() => {
    const result: TaskGroup[] = [];
    for (const note of notes) {
      const tasks = extractTasks(note.content);
      if (tasks.length === 0) continue;
      const kept =
        filter === "open"
          ? tasks.filter((t) => !t.checked)
          : filter === "done"
          ? tasks.filter((t) => t.checked)
          : tasks;
      if (kept.length === 0) continue;
      result.push({ note, tasks: kept });
    }
    return result.sort(
      (a, b) => (b.note.updatedAt || 0) - (a.note.updatedAt || 0)
    );
  }, [notes, filter]);

  const totals = useMemo(() => {
    let open = 0;
    let done = 0;
    for (const note of notes) {
      for (const task of extractTasks(note.content)) {
        if (task.checked) done++;
        else open++;
      }
    }
    return { open, done, total: open + done };
  }, [notes]);

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Open Tasks"
      icon={<ListTodo className="size-icon text-brand shrink-0" strokeWidth={1.75} />}
      badge={
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {totals.open} open
        </span>
      }
      drawerWidth="md"
      snapPoints={["half", "full"]}
      bodyClassName="px-0 py-0"
    >
      {/* Filter + summary */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm px-3 pt-2 pb-2 ds-hairline-b">
        <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 w-full">
          {(
            [
              { id: "open" as const, label: "Open", count: totals.open },
              { id: "all" as const, label: "All", count: totals.total },
              { id: "done" as const, label: "Done", count: totals.done },
            ]
          ).map((seg) => {
            const active = filter === seg.id;
            return (
              <button
                key={seg.id}
                type="button"
                onClick={() => setFilter(seg.id)}
                aria-pressed={active}
                className={cn(
                  "flex h-8 flex-1 items-center justify-center gap-1.5 rounded-none text-[11px] transition-colors motion-reduce:transition-none",
                  active
                    ? "bg-background text-foreground shadow-soft font-semibold"
                    : "text-muted-foreground"
                )}
              >
                {seg.label}
                <span className="font-mono text-[10px] opacity-60">{seg.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <ListTodo className="size-8 mx-auto mb-3 opacity-25" strokeWidth={1.5} />
          <p className="text-xs text-muted-foreground">
            {totals.total === 0
              ? "No checklists in your notes yet."
              : filter === "open"
              ? "Everything is ticked off. Nice work."
              : filter === "done"
              ? "No completed tasks yet."
              : "No tasks found."}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground/70">
            Add <span className="font-mono">- [ ]</span> to any note to collect
            it here.
          </p>
        </div>
      ) : (
        <div>
          {groups.map((group) => (
            <section key={group.note.id} className="px-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  onOpenNote(group.note.id);
                  onOpenChange(false);
                }}
                className="group flex w-full items-center gap-1.5 text-left"
              >
                <span className="truncate font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
                  {group.note.title || "Untitled"}
                </span>
                <span className="shrink-0 font-mono text-[9.5px] text-muted-foreground/50">
                  {group.tasks.length}
                </span>
              </button>

              <ul className="mt-1 space-y-0.5">
                {group.tasks.map((task) => (
                  <li key={`${group.note.id}-${task.index}`}>
                    <div className="flex items-start gap-2.5 py-1.5">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={task.checked}
                        aria-label={task.text || "Task"}
                        onClick={() => {
                          hapticTap();
                          onToggleTask(group.note.id, task.index, !task.checked);
                        }}
                        className={cn(
                          "mt-px flex size-5 shrink-0 items-center justify-center rounded-[3px] transition-colors motion-reduce:transition-none",
                          task.checked
                            ? "bg-brand text-brand-foreground"
                            : "bg-background text-transparent border border-border hover:border-foreground/40"
                        )}
                      >
                        {task.checked ? (
                          <Check className="size-3.5" strokeWidth={2.5} />
                        ) : (
                          <Circle className="size-3 opacity-0" strokeWidth={1.75} />
                        )}
                      </button>

                      <span
                        className={cn(
                          "min-w-0 flex-1 text-[12.5px] leading-snug",
                          task.checked
                            ? "text-muted-foreground/60 line-through"
                            : "text-foreground"
                        )}
                      >
                        {stripInlineMarkdown(task.text) || (
                          <em className="not-italic opacity-50">Untitled task</em>
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </ResponsiveSheet>
  );
}
