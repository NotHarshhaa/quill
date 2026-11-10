"use client";

import React, { useState } from "react";
import { Corners } from "@/components/frame";
import { Button } from "@/components/ui/button";
import { Copy, Check, Calculator } from "lucide-react";
import { hapticTap } from "@/lib/ui/haptics";
import { toast } from "sonner";

// Greek letter dictionary
const GREEK_MAP: Record<string, string> = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
  zeta: "ζ",
  eta: "η",
  theta: "θ",
  iota: "ι",
  kappa: "κ",
  lambda: "λ",
  mu: "μ",
  nu: "ν",
  xi: "ξ",
  pi: "π",
  rho: "ρ",
  sigma: "σ",
  tau: "τ",
  upsilon: "υ",
  phi: "φ",
  chi: "χ",
  psi: "ψ",
  omega: "ω",
  Gamma: "Γ",
  Delta: "Δ",
  Theta: "Θ",
  Lambda: "Λ",
  Xi: "Ξ",
  Pi: "Π",
  Sigma: "Σ",
  Phi: "Φ",
  Psi: "Ψ",
  Omega: "Ω",
};

// Math symbol dictionary
const SYMBOL_MAP: Record<string, string> = {
  times: "×",
  div: "÷",
  pm: "±",
  mp: "∓",
  leq: "≤",
  geq: "≥",
  neq: "≠",
  approx: "≈",
  equiv: "≡",
  infty: "∞",
  partial: "∂",
  nabla: "∇",
  forall: "∀",
  exists: "∃",
  in: "∈",
  notin: "∉",
  subset: "⊂",
  cup: "∪",
  cap: "∩",
  rightarrow: "→",
  leftarrow: "←",
  Rightarrow: "⇒",
  Leftarrow: "⇐",
  iff: "⇔",
  cdot: "·",
  ldots: "…",
  cdots: "⋯",
  quad: "  ",
  qquad: "    ",
};

/**
 * Lightweight, robust mathematical formula token renderer.
 * Formats LaTeX syntax into typography with superscripts, subscripts,
 * fractions, roots, and mathematical symbols.
 */
function renderMathTokens(latex: string): React.ReactNode {
  let text = latex.trim();

  // Strip wrapping $$ if present
  if (text.startsWith("$$") && text.endsWith("$$")) {
    text = text.slice(2, -2).trim();
  }

  // 1. Process Fractions: \frac{num}{den}
  const fracRegex = /\\frac\{([^{}]+)\}\{([^{}]+)\}/g;
  if (fracRegex.test(text)) {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    text.replace(fracRegex, (match, num, den, offset) => {
      if (offset > lastIndex) {
        parts.push(renderSimpleTokens(text.slice(lastIndex, offset)));
      }
      parts.push(
        <span key={offset} className="inline-flex flex-col items-center align-middle mx-1 text-center">
          <span className="border-b border-foreground/70 px-1 pb-0.5 text-[0.9em] leading-none">
            {renderMathTokens(num)}
          </span>
          <span className="pt-0.5 px-1 text-[0.9em] leading-none">{renderMathTokens(den)}</span>
        </span>
      );
      lastIndex = offset + match.length;
      return match;
    });
    if (lastIndex < text.length) {
      parts.push(renderSimpleTokens(text.slice(lastIndex)));
    }
    return <>{parts}</>;
  }

  // 2. Process Square Roots: \sqrt{arg} or \sqrt[n]{arg}
  const sqrtRegex = /\\sqrt(?:\[(.*?)\])?\{([^{}]+)\}/g;
  if (sqrtRegex.test(text)) {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    text.replace(sqrtRegex, (match, rootN, inner, offset) => {
      if (offset > lastIndex) {
        parts.push(renderSimpleTokens(text.slice(lastIndex, offset)));
      }
      parts.push(
        <span key={offset} className="inline-flex items-baseline align-middle mx-0.5">
          <span className="text-xs -mr-1 align-top">{rootN ? <sup className="text-[0.7em]">{rootN}</sup> : null}</span>
          <span className="text-[1.2em] font-serif leading-none">√</span>
          <span className="border-t border-foreground/80 px-1 -ml-0.5 pt-0.5 text-[0.95em]">
            {renderMathTokens(inner)}
          </span>
        </span>
      );
      lastIndex = offset + match.length;
      return match;
    });
    if (lastIndex < text.length) {
      parts.push(renderSimpleTokens(text.slice(lastIndex)));
    }
    return <>{parts}</>;
  }

  return renderSimpleTokens(text);
}

function renderSimpleTokens(str: string): React.ReactNode {
  // Replace Greek letters and math symbols
  let out = str;
  Object.keys(GREEK_MAP).forEach((k) => {
    out = out.replace(new RegExp(`\\\\${k}\\b`, "g"), GREEK_MAP[k]);
  });
  Object.keys(SYMBOL_MAP).forEach((k) => {
    out = out.replace(new RegExp(`\\\\${k}\\b`, "g"), SYMBOL_MAP[k]);
  });

  // Integrals and Summations
  out = out.replace(/\\int\b/g, "∫");
  out = out.replace(/\\sum\b/g, "∑");
  out = out.replace(/\\prod\b/g, "∏");
  out = out.replace(/\\lim\b/g, "lim");

  // Format superscripts: ^{...} or ^x
  const superRegex = /\^\{([^}]+)\}|\^([a-zA-Z0-9+-])/g;
  // Format subscripts: _{...} or _x
  const subRegex = /_\{([^}]+)\}|_([a-zA-Z0-9+-])/g;

  // Split and render
  const elements: React.ReactNode[] = [];
  let buffer = "";

  for (let i = 0; i < out.length; i++) {
    if (out[i] === "^") {
      if (buffer) {
        elements.push(buffer);
        buffer = "";
      }
      let supContent = "";
      if (out[i + 1] === "{") {
        const close = out.indexOf("}", i + 2);
        if (close !== -1) {
          supContent = out.slice(i + 2, close);
          i = close;
        } else {
          supContent = out[++i];
        }
      } else {
        supContent = out[++i];
      }
      elements.push(
        <sup key={`sup-${i}`} className="text-[0.75em] text-foreground font-semibold">
          {supContent}
        </sup>
      );
    } else if (out[i] === "_") {
      if (buffer) {
        elements.push(buffer);
        buffer = "";
      }
      let subContent = "";
      if (out[i + 1] === "{") {
        const close = out.indexOf("}", i + 2);
        if (close !== -1) {
          subContent = out.slice(i + 2, close);
          i = close;
        } else {
          subContent = out[++i];
        }
      } else {
        subContent = out[++i];
      }
      elements.push(
        <sub key={`sub-${i}`} className="text-[0.75em] text-muted-foreground font-medium">
          {subContent}
        </sub>
      );
    } else {
      buffer += out[i];
    }
  }

  if (buffer) elements.push(buffer);

  return <>{elements}</>;
}

export function MathBlockRenderer({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.trim());
      hapticTap("light");
      setCopied(true);
      toast.success("Formula copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy formula");
    }
  };

  return (
    <div className="relative my-5 p-4 border border-border/80 bg-card/60 shadow-xs rounded-none font-serif select-text flex flex-col items-center justify-center text-center">
      <Corners size="sm" offset="border" weight="thin" light />

      {/* Copy button top right */}
      <div className="absolute top-2 right-2 flex items-center gap-1 select-none">
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={handleCopy}
          title="Copy LaTeX"
          className="size-6 rounded-none text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
        </Button>
      </div>

      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-2 select-none self-start">
        <Calculator className="size-3 text-primary" />
        <span>EQUATION</span>
      </div>

      {/* Rendered Math Formula */}
      <div className="text-lg sm:text-xl md:text-2xl tracking-wide text-foreground py-2 font-serif overflow-x-auto max-w-full">
        {renderMathTokens(code)}
      </div>
    </div>
  );
}

export function InlineMathRenderer({ latex }: { latex: string }) {
  return (
    <span className="inline-block px-1 py-0.2 mx-0.5 bg-muted/40 border border-border/40 font-serif text-[1.05em] align-baseline rounded-none select-text">
      {renderMathTokens(latex)}
    </span>
  );
}
