"use client";

import React, { useState, useMemo } from "react";
import { Corners } from "@/components/frame";
import { Button } from "@/components/ui/button";
import { Copy, Check, Terminal, ChevronDown, ChevronUp } from "lucide-react";
import { hapticTap } from "@/lib/ui/haptics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CodeBlockRendererProps {
  language?: string;
  code: string;
}

// Common language keyword sets for lightweight token styling
const JS_KEYWORDS = new Set([
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "for",
  "while",
  "import",
  "export",
  "from",
  "default",
  "async",
  "await",
  "try",
  "catch",
  "class",
  "interface",
  "type",
  "extends",
  "implements",
  "new",
  "this",
  "super",
  "true",
  "false",
  "null",
  "undefined",
]);

const PY_KEYWORDS = new Set([
  "def",
  "return",
  "if",
  "elif",
  "else",
  "for",
  "while",
  "import",
  "from",
  "as",
  "class",
  "try",
  "except",
  "finally",
  "with",
  "yield",
  "lambda",
  "pass",
  "True",
  "False",
  "None",
]);

export function CodeBlockRenderer({ language, code }: CodeBlockRendererProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const lines = useMemo(() => code.replace(/\r\n/g, "\n").split("\n"), [code]);
  const isLong = lines.length > 28;
  const visibleLines = isLong && !isExpanded ? lines.slice(0, 22) : lines;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      hapticTap("light");
      setCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const langDisplay = (language || "TEXT").toUpperCase();

  // Basic syntax highlighter for tokenized lines
  const renderHighlightedLine = (line: string) => {
    // Check comment
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("/*")) {
      return <span className="text-muted-foreground/60 italic">{line}</span>;
    }

    // Split line into tokens preserving delimiters
    const tokens = line.split(/([a-zA-Z0-9_$]+|"[^"]*"|'[^']*'|`[^`]*`|[^\s\w])/g).filter(Boolean);

    return (
      <>
        {tokens.map((tok, i) => {
          // Strings
          if (
            (tok.startsWith('"') && tok.endsWith('"')) ||
            (tok.startsWith("'") && tok.endsWith("'")) ||
            (tok.startsWith("`") && tok.endsWith("`"))
          ) {
            return (
              <span key={i} className="text-emerald-600 dark:text-emerald-400">
                {tok}
              </span>
            );
          }

          // Numbers
          if (/^[0-9]+(?:\.[0-9]+)?$/.test(tok)) {
            return (
              <span key={i} className="text-amber-600 dark:text-amber-400">
                {tok}
              </span>
            );
          }

          // Keywords
          const isKeyword =
            JS_KEYWORDS.has(tok) ||
            PY_KEYWORDS.has(tok) ||
            tok === "SELECT" ||
            tok === "FROM" ||
            tok === "WHERE";

          if (isKeyword) {
            return (
              <span key={i} className="text-purple-600 dark:text-purple-400 font-semibold">
                {tok}
              </span>
            );
          }

          // Function calls
          if (i + 1 < tokens.length && tokens[i + 1] === "(") {
            return (
              <span key={i} className="text-blue-600 dark:text-blue-400 font-medium">
                {tok}
              </span>
            );
          }

          return <span key={i}>{tok}</span>;
        })}
      </>
    );
  };

  return (
    <div className="relative my-5 border border-border/80 bg-card/75 shadow-xs rounded-none font-mono text-xs select-text overflow-hidden">
      <Corners size="sm" offset="border" weight="thin" light />

      {/* Header Bar */}
      <div className="px-3 py-1.5 border-b border-border/60 bg-muted/50 flex items-center justify-between gap-2 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="size-3 text-primary" />
          <span className="font-mono text-[10.5px] font-semibold text-foreground tracking-wider uppercase">
            {langDisplay}
          </span>
          <span className="text-[10px] text-muted-foreground/60 font-mono">
            {lines.length} {lines.length === 1 ? "line" : "lines"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={handleCopy}
            title="Copy code"
            className="size-6 rounded-none text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
          </Button>
        </div>
      </div>

      {/* Code Text with Line Numbers */}
      <div className="p-3 overflow-x-auto [scrollbar-width:thin]">
        <table className="w-full border-collapse font-mono text-[12px] leading-relaxed">
          <tbody>
            {visibleLines.map((line, idx) => (
              <tr key={idx} className="hover:bg-muted/20">
                <td className="w-8 pr-3 text-right text-muted-foreground/40 select-none font-mono text-[11px] align-top">
                  {idx + 1}
                </td>
                <td className="text-foreground whitespace-pre font-mono pl-1">
                  {renderHighlightedLine(line)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expand / Collapse Footer for long blocks */}
      {isLong && (
        <div className="p-1.5 border-t border-border/40 bg-muted/40 flex items-center justify-center select-none">
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 text-[10.5px] font-mono gap-1 text-muted-foreground hover:text-foreground rounded-none"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="size-3" /> Collapse
              </>
            ) : (
              <>
                <ChevronDown className="size-3" /> Show all {lines.length} lines
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
