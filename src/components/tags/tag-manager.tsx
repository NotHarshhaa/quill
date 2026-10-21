"use client";

import React, { useMemo, useState } from "react";
import { Hash, Pencil, GitMerge, Check, X, Tags } from "lucide-react";

import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { cn } from "@/lib/utils";
import { hapticTap } from "@/lib/ui/haptics";

export interface TagSummary {
  tag: string;
  /** How many notes carry this tag. */
  count: number;
}

export interface TagManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: TagSummary[];
  /** Rename a tag everywhere (note bodies + note metadata). */
  onRenameTag: (from: string, to: string) => void;
  /** Merge `from` into `into` — `from` disappears, `into` keeps both sets. */
  onMergeTag: (from: string, into: string) => void;
}

type Mode = { tag: string; kind: "rename" | "merge" } | null;

/**
 * Vault-wide tag maintenance.
 *
 * Tags are derived from the note bodies (`#tag`), so renaming one has to
 * rewrite every occurrence across every note — both the `#tag` in the
 * markdown and the cached `note.tags` array. Merging folds one tag into
 * another the same way.
 */
export function TagManager({
  open,
  onOpenChange,
  tags,
  onRenameTag,
  onMergeTag,
}: TagManagerProps) {
  const [mode, setMode] = useState<Mode>(null);
  const [draft, setDraft] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");

  const others = useMemo(
    () => tags.filter((t) => t.tag !== mode?.tag),
    [tags, mode]
  );

  const startRename = (tag: string) => {
    hapticTap();
    setMode({ tag, kind: "rename" });
    setDraft(tag);
  };

  const startMerge = (tag: string) => {
    hapticTap();
    setMode({ tag, kind: "merge" });
    setMergeTarget(others[0]?.tag ?? "");
  };

  const cancel = () => {
    setMode(null);
    setDraft("");
    setMergeTarget("");
  };

  const commitRename = () => {
    if (!mode) return;
    const next = draft.trim().replace(/^#/, "").toLowerCase();
    if (next && next !== mode.tag) onRenameTag(mode.tag, next);
    cancel();
  };

  const commitMerge = () => {
    if (!mode || !mergeTarget) return;
    if (mergeTarget !== mode.tag) onMergeTag(mode.tag, mergeTarget);
    cancel();
  };

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Manage Tags"
      icon={<Tags className="size-icon text-brand shrink-0" strokeWidth={1.75} />}
      badge={
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {tags.length}
        </span>
      }
      drawerWidth="md"
      snapPoints={["half", "full"]}
      bodyClassName="px-0 py-0"
    >
      {tags.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <Hash className="size-8 mx-auto mb-3 opacity-25" strokeWidth={1.5} />
          <p className="text-xs text-muted-foreground">No tags yet.</p>
          <p className="mt-1 text-[11px] text-muted-foreground/70">
            Write <span className="font-mono">#ideas</span> in a note to create
            one.
          </p>
        </div>
      ) : (
        <ul className="px-2 py-2">
          {tags.map(({ tag, count }) => {
            const editing = mode?.tag === tag;
            return (
              <li
                key={tag}
                className={cn(
                  "flex items-center gap-2 px-2 py-2",
                  editing && "bg-muted/50"
                )}
              >
                {editing ? (
                  <div className="flex min-w-0 flex-1 flex-col gap-2 py-1">
                    {mode?.kind === "rename" ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">#</span>
                          <input
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitRename();
                              if (e.key === "Escape") cancel();
                            }}
                            aria-label={`Rename ${tag}`}
                            className="min-w-0 flex-1 bg-background px-2 py-1.5 text-xs font-mono outline-none ring-1 ring-ring/60"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={commitRename}
                            className="flex h-8 items-center gap-1 bg-brand px-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-brand-foreground"
                          >
                            <Check className="size-3.5" />
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancel}
                            className="flex h-8 items-center gap-1 bg-muted/60 px-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground"
                          >
                            <X className="size-3.5" />
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-[11px] text-muted-foreground">
                          Merge <span className="font-mono text-foreground">#{mode?.tag}</span>{" "}
                          into:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {others.map((t) => (
                            <button
                              key={t.tag}
                              type="button"
                              onClick={() => setMergeTarget(t.tag)}
                              className={cn(
                                "h-8 px-2.5 font-mono text-[11px] transition-colors",
                                mergeTarget === t.tag
                                  ? "bg-brand-soft text-brand font-semibold"
                                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              #{t.tag}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={commitMerge}
                            disabled={!mergeTarget}
                            className="flex h-8 items-center gap-1 bg-brand px-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-brand-foreground disabled:opacity-40"
                          >
                            <GitMerge className="size-3.5" />
                            Merge
                          </button>
                          <button
                            type="button"
                            onClick={cancel}
                            className="flex h-8 items-center gap-1 bg-muted/60 px-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground"
                          >
                            <X className="size-3.5" />
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <span className="flex min-w-0 flex-1 items-center gap-1.5">
                      <Hash className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                      <span className="truncate font-mono text-xs text-foreground">
                        {tag}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {count}
                    </span>
                    <button
                      type="button"
                      onClick={() => startRename(tag)}
                      aria-label={`Rename #${tag}`}
                      className="flex size-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="size-3.5" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      onClick={() => startMerge(tag)}
                      disabled={tags.length < 2}
                      aria-label={`Merge #${tag} into another tag`}
                      className="flex size-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                    >
                      <GitMerge className="size-3.5" strokeWidth={1.75} />
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </ResponsiveSheet>
  );
}
