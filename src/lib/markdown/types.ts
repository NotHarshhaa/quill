export type InlineNode =
  | { type: "text"; value: string }
  | { type: "bold"; children: InlineNode[] }
  | { type: "italic"; children: InlineNode[] }
  | { type: "strike"; children: InlineNode[] }
  | { type: "code"; value: string }
  | { type: "link"; href: string; children: InlineNode[] };

export type TableAlignment = "left" | "center" | "right" | "default";

export type CalloutVariant = "note" | "tip" | "warning" | "important" | "caution";

export type BlockNode =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; children: InlineNode[] }
  | { type: "paragraph"; children: InlineNode[] }
  | { type: "blockquote"; children: BlockNode[] }
  | { type: "callout"; variant: CalloutVariant; title?: string; children: BlockNode[] }
  | {
      type: "table";
      headers: { children: InlineNode[]; align: TableAlignment }[];
      rows: { children: InlineNode[]; align: TableAlignment }[][];
    }
  | { type: "code_block"; language?: string; code: string }
  | { type: "list"; ordered: boolean; items: { children: InlineNode[]; checked?: boolean; taskIndex?: number }[] }
  | { type: "thematic_break" };

export type MarkdownDocument = BlockNode[];
