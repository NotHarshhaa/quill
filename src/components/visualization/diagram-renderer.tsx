"use client";

import React, { useState, useMemo, useRef } from "react";
import { Corners } from "@/components/frame";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  Code,
  Network,
  PieChart as PieIcon,
  GitCommit,
  Maximize2,
} from "lucide-react";
import { hapticTap } from "@/lib/ui/haptics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Diagram Model Types
// ---------------------------------------------------------------------------

type DiagramType = "flowchart" | "sequence" | "pie" | "mindmap" | "unknown";

interface FlowNode {
  id: string;
  label: string;
  shape: "rect" | "round" | "circle" | "diamond" | "database";
  layer?: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  style: "arrow" | "dotted" | "thick" | "line";
}

interface SequenceParticipant {
  id: string;
  label: string;
  x: number;
}

interface SequenceMessage {
  from: string;
  to: string;
  text: string;
  dashed?: boolean;
  arrow?: boolean;
}

interface SequenceNote {
  participant: string;
  text: string;
}

interface SequenceItem {
  type: "message" | "note";
  data: SequenceMessage | SequenceNote;
}

interface PieSlice {
  label: string;
  value: number;
  color: string;
  percentage: number;
  startAngle: number;
  endAngle: number;
}

interface MindNode {
  id: string;
  label: string;
  level: number;
  x: number;
  y: number;
  children: MindNode[];
}

// Vibrant theme-adaptive palette
const PALETTE = [
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#10b981", // emerald
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#14b8a6", // teal
];

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

function detectDiagramType(code: string): DiagramType {
  const first = code.trim().split("\n")[0].trim().toLowerCase();
  if (first.startsWith("graph") || first.startsWith("flowchart")) return "flowchart";
  if (first.startsWith("sequencediagram")) return "sequence";
  if (first.startsWith("pie")) return "pie";
  if (first.startsWith("mindmap")) return "mindmap";
  return "unknown";
}

// --- Flowchart Parser ---
function parseFlowchart(code: string): {
  direction: "TD" | "LR";
  nodes: FlowNode[];
  edges: FlowEdge[];
} {
  const lines = code
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("%%"));

  let direction: "TD" | "LR" = "TD";
  const firstLine = lines[0] || "";
  if (firstLine.includes("LR")) direction = "LR";

  const nodeMap = new Map<string, FlowNode>();
  const edges: FlowEdge[] = [];

  const getOrCreateNode = (
    id: string,
    label?: string,
    shape: FlowNode["shape"] = "rect"
  ): FlowNode => {
    let node = nodeMap.get(id);
    if (!node) {
      const cleanLabel = (label || id).trim();
      const width = Math.max(90, cleanLabel.length * 8.5 + 28);
      const height = shape === "diamond" ? 56 : shape === "circle" ? 64 : 44;
      node = {
        id,
        label: cleanLabel,
        shape,
        x: 0,
        y: 0,
        width,
        height,
      };
      nodeMap.set(id, node);
    } else if (label && node.label === node.id) {
      node.label = label.trim();
      node.shape = shape;
      node.width = Math.max(90, node.label.length * 8.5 + 28);
    }
    return node;
  };

  const parseNodeToken = (token: string): string => {
    token = token.trim();
    // Database: A[(Database)]
    const dbMatch = token.match(/^([a-zA-Z0-9_-]+)\[\((.*?)\)\]$/);
    if (dbMatch) {
      getOrCreateNode(dbMatch[1], dbMatch[2], "database");
      return dbMatch[1];
    }
    // Circle: A((Circle))
    const circleMatch = token.match(/^([a-zA-Z0-9_-]+)\(\((.*?)\)\)$/);
    if (circleMatch) {
      getOrCreateNode(circleMatch[1], circleMatch[2], "circle");
      return circleMatch[1];
    }
    // Diamond: A{Decision}
    const diamondMatch = token.match(/^([a-zA-Z0-9_-]+)\{(.*?)\}$/);
    if (diamondMatch) {
      getOrCreateNode(diamondMatch[1], diamondMatch[2], "diamond");
      return diamondMatch[1];
    }
    // Rounded: A(Rounded)
    const roundMatch = token.match(/^([a-zA-Z0-9_-]+)\((.*?)\)$/);
    if (roundMatch) {
      getOrCreateNode(roundMatch[1], roundMatch[2], "round");
      return roundMatch[1];
    }
    // Rect: A[Rectangle]
    const rectMatch = token.match(/^([a-zA-Z0-9_-]+)\[(.*?)\]$/);
    if (rectMatch) {
      getOrCreateNode(rectMatch[1], rectMatch[2], "rect");
      return rectMatch[1];
    }
    // Bare id
    const bareMatch = token.match(/^([a-zA-Z0-9_-]+)$/);
    if (bareMatch) {
      getOrCreateNode(bareMatch[1]);
      return bareMatch[1];
    }
    return token;
  };

  // Edge pattern: e.g. NodeA -->|label| NodeB or NodeA --> NodeB
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Split by arrows: -->, -.-> , ==>, ---
    const edgeMatch = line.match(
      /(.*?)\s*(-->|-.->|==>|---|--\s*.*?\s*-->)\s*(.*)/
    );
    if (edgeMatch) {
      const leftPart = edgeMatch[1].trim();
      const arrowRaw = edgeMatch[2].trim();
      let rightPart = edgeMatch[3].trim();
      let edgeLabel: string | undefined;

      // Check pipe label: |label|
      const pipeMatch = rightPart.match(/^\|(.*?)\|\s*(.*)$/);
      if (pipeMatch) {
        edgeLabel = pipeMatch[1].trim();
        rightPart = pipeMatch[2].trim();
      } else if (arrowRaw.startsWith("--") && arrowRaw.endsWith("-->")) {
        // e.g. -- Yes -->
        const inlineLabel = arrowRaw.slice(2, -3).trim();
        if (inlineLabel) edgeLabel = inlineLabel;
      }

      const fromId = parseNodeToken(leftPart);
      const toId = parseNodeToken(rightPart);

      let style: FlowEdge["style"] = "arrow";
      if (arrowRaw.includes("-.->")) style = "dotted";
      else if (arrowRaw.includes("==>")) style = "thick";
      else if (arrowRaw === "---") style = "line";

      if (fromId && toId) {
        edges.push({ from: fromId, to: toId, label: edgeLabel, style });
      }
    } else {
      // Just a standalone node definition
      parseNodeToken(line);
    }
  }

  // Layer assignment layout (Topological layering)
  const nodes = Array.from(nodeMap.values());
  const inDegree = new Map<string, number>();
  nodes.forEach((n) => inDegree.set(n.id, 0));
  edges.forEach((e) => inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1));

  const layers: FlowNode[][] = [];
  const assigned = new Set<string>();

  // Layer 0: roots (in-degree 0)
  let currentLayer = nodes.filter((n) => (inDegree.get(n.id) || 0) === 0);
  if (currentLayer.length === 0 && nodes.length > 0) currentLayer = [nodes[0]];

  while (currentLayer.length > 0) {
    layers.push(currentLayer);
    currentLayer.forEach((n) => assigned.add(n.id));

    const nextLayer: FlowNode[] = [];
    currentLayer.forEach((parent) => {
      edges
        .filter((e) => e.from === parent.id && !assigned.has(e.to))
        .forEach((e) => {
          const targetNode = nodeMap.get(e.to);
          if (targetNode && !nextLayer.includes(targetNode)) {
            nextLayer.push(targetNode);
          }
        });
    });

    // Pick remaining if graph has cycles or disconnected components
    if (nextLayer.length === 0 && assigned.size < nodes.length) {
      const remaining = nodes.filter((n) => !assigned.has(n.id));
      if (remaining.length > 0) nextLayer.push(remaining[0]);
    }

    currentLayer = nextLayer;
  }

  // Calculate coordinates
  const PADDING = 40;
  const GAP_LAYER = direction === "TD" ? 75 : 90;
  const GAP_SIBLING = direction === "TD" ? 40 : 35;

  if (direction === "TD") {
    let y = PADDING;
    layers.forEach((layer) => {
      const layerHeight = Math.max(...layer.map((n) => n.height), 44);
      const totalWidth =
        layer.reduce((sum, n) => sum + n.width, 0) + (layer.length - 1) * GAP_SIBLING;
      let x = PADDING;
      layer.forEach((node) => {
        node.x = x;
        node.y = y;
        x += node.width + GAP_SIBLING;
      });
      y += layerHeight + GAP_LAYER;
    });
  } else {
    // Left-to-Right
    let x = PADDING;
    layers.forEach((layer) => {
      const layerWidth = Math.max(...layer.map((n) => n.width), 90);
      let y = PADDING;
      layer.forEach((node) => {
        node.x = x;
        node.y = y;
        y += node.height + GAP_SIBLING;
      });
      x += layerWidth + GAP_LAYER;
    });
  }

  return { direction, nodes, edges };
}

// --- Sequence Diagram Parser ---
function parseSequenceDiagram(code: string): {
  participants: SequenceParticipant[];
  items: SequenceItem[];
} {
  const lines = code
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("%%"));

  const partMap = new Map<string, SequenceParticipant>();
  const items: SequenceItem[] = [];

  const getOrCreatePart = (id: string, label?: string): SequenceParticipant => {
    let part = partMap.get(id);
    if (!part) {
      part = { id, label: label || id, x: 0 };
      partMap.set(id, part);
    }
    return part;
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // participant Alice as "Alice Admin"
    const partMatch = line.match(/^(?:participant|actor)\s+([a-zA-Z0-9_-]+)(?:\s+as\s+(.*))?$/i);
    if (partMatch) {
      getOrCreatePart(partMatch[1], partMatch[2]?.replace(/^["']|["']$/g, ""));
      continue;
    }

    // Note over A: text or Note right of A: text
    const noteMatch = line.match(/^Note\s+(?:over|right of|left of)\s+([a-zA-Z0-9_-]+)\s*:\s*(.*)$/i);
    if (noteMatch) {
      getOrCreatePart(noteMatch[1]);
      items.push({
        type: "note",
        data: { participant: noteMatch[1], text: noteMatch[2] },
      });
      continue;
    }

    // Message: A->>B: message or A-->>B: message
    const msgMatch = line.match(
      /^([a-zA-Z0-9_-]+)\s*(-->>|->>|-->|->)\s*([a-zA-Z0-9_-]+)\s*:\s*(.*)$/
    );
    if (msgMatch) {
      const from = msgMatch[1];
      const arrowStr = msgMatch[2];
      const to = msgMatch[3];
      const text = msgMatch[4];

      getOrCreatePart(from);
      getOrCreatePart(to);

      items.push({
        type: "message",
        data: {
          from,
          to,
          text,
          dashed: arrowStr.startsWith("--"),
          arrow: arrowStr.endsWith(">>") || arrowStr.endsWith(">"),
        },
      });
    }
  }

  const participants = Array.from(partMap.values());
  const PART_GAP = 140;
  const START_X = 70;
  participants.forEach((p, idx) => {
    p.x = START_X + idx * PART_GAP;
  });

  return { participants, items };
}

// --- Pie Chart Parser ---
function parsePie(code: string): { title: string; slices: PieSlice[] } {
  const lines = code
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("%%"));

  let title = "Data Distribution";
  const first = lines[0] || "";
  const titleMatch = first.match(/^pie(?:\s+title\s+(.*))?$/i);
  if (titleMatch && titleMatch[1]) title = titleMatch[1].trim();

  const rawSlices: { label: string; value: number }[] = [];
  let total = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^"([^"]+)"\s*:\s*([0-9.]+)/) || line.match(/^([^:]+)\s*:\s*([0-9.]+)/);
    if (match) {
      const label = match[1].trim();
      const value = Number.parseFloat(match[2]) || 0;
      rawSlices.push({ label, value });
      total += value;
    }
  }

  if (total <= 0) total = 1;

  let currentAngle = 0;
  const slices: PieSlice[] = rawSlices.map((s, idx) => {
    const percentage = Math.round((s.value / total) * 100);
    const sliceAngle = (s.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    return {
      label: s.label,
      value: s.value,
      percentage,
      color: PALETTE[idx % PALETTE.length],
      startAngle,
      endAngle,
    };
  });

  return { title, slices };
}

// --- Mindmap Parser ---
function parseMindmap(code: string): MindNode {
  const lines = code
    .trim()
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("%%") && !l.trim().startsWith("mindmap"));

  const root: MindNode = {
    id: "root",
    label: "Central Idea",
    level: 0,
    x: 0,
    y: 0,
    children: [],
  };

  if (lines.length === 0) return root;

  const stack: { node: MindNode; indent: number }[] = [];

  lines.forEach((line, idx) => {
    const indent = line.search(/\S/);
    let text = line.trim();
    // Strip root((...)) or id[...]
    text = text.replace(/^root\(\((.*?)\)\)$/, "$1");
    text = text.replace(/^[a-zA-Z0-9_-]+\[(.*?)\]$/, "$1");
    text = text.replace(/^[a-zA-Z0-9_-]+\((.*?)\)$/, "$1");

    const node: MindNode = {
      id: `m_${idx}`,
      label: text,
      level: 0,
      x: 0,
      y: 0,
      children: [],
    };

    if (stack.length === 0) {
      root.label = text;
      stack.push({ node: root, indent });
    } else {
      while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }
      const parent = stack.length > 0 ? stack[stack.length - 1].node : root;
      node.level = stack.length;
      parent.children.push(node);
      stack.push({ node, indent });
    }
  });

  return root;
}

// ---------------------------------------------------------------------------
// Diagram Renderer Component
// ---------------------------------------------------------------------------

export function DiagramRenderer({ code }: { code: string }) {
  const type = useMemo(() => detectDiagramType(code), [code]);
  const [scale, setScale] = useState(1);
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleZoomIn = () => setScale((s) => Math.min(2.5, s + 0.15));
  const handleZoomOut = () => setScale((s) => Math.max(0.5, s - 0.15));
  const handleResetZoom = () => setScale(1);

  const handleCopySvg = async () => {
    if (!svgRef.current) return;
    try {
      const xml = new XMLSerializer().serializeToString(svgRef.current);
      await navigator.clipboard.writeText(xml);
      hapticTap("light");
      setCopied(true);
      toast.success("Diagram SVG copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy SVG");
    }
  };

  const badgeText = {
    flowchart: "FLOWCHART",
    sequence: "SEQUENCE DIAGRAM",
    pie: "PIE CHART",
    mindmap: "MIND MAP",
    unknown: "DIAGRAM",
  }[type];

  const badgeIcon = {
    flowchart: Network,
    sequence: GitCommit,
    pie: PieIcon,
    mindmap: Maximize2,
    unknown: Network,
  }[type];

  const IconComp = badgeIcon;

  return (
    <div className="relative my-6 border border-border/80 bg-card/60 shadow-xs rounded-none font-sans overflow-hidden select-none">
      <Corners size="sm" offset="border" weight="thin" light />

      {/* Header Bar */}
      <div className="px-3.5 py-2 border-b border-border/60 bg-muted/40 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <IconComp className="size-3.5 text-primary" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
            {badgeText}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground/60 hidden sm:inline">
            Mermaid Engine
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1">
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={handleZoomIn}
            title="Zoom In"
            className="size-7 rounded-none text-muted-foreground hover:text-foreground"
          >
            <ZoomIn className="size-3.5" />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="size-7 rounded-none text-muted-foreground hover:text-foreground"
          >
            <ZoomOut className="size-3.5" />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={handleResetZoom}
            title="Reset Scale"
            className="size-7 rounded-none text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
          </Button>
          <div className="h-3.5 w-px bg-border/80 mx-0.5" />
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={handleCopySvg}
            title="Copy SVG"
            className="size-7 rounded-none text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={() => setShowCode(!showCode)}
            title="View Raw Source"
            className={cn(
              "size-7 rounded-none transition-colors",
              showCode ? "text-primary bg-muted" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Code className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Source Code Drawer */}
      {showCode && (
        <div className="p-3 bg-muted/60 border-b border-border/80 font-mono text-xs text-muted-foreground overflow-x-auto select-text">
          <pre>{code}</pre>
        </div>
      )}

      {/* SVG Canvas Viewport */}
      <div className="p-4 sm:p-6 overflow-x-auto flex items-center justify-center min-h-[220px]">
        <div
          style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
          className="transition-transform duration-150"
        >
          {type === "flowchart" && <FlowchartView code={code} svgRef={svgRef} />}
          {type === "sequence" && <SequenceView code={code} svgRef={svgRef} />}
          {type === "pie" && <PieView code={code} svgRef={svgRef} />}
          {type === "mindmap" && <MindmapView code={code} svgRef={svgRef} />}
          {type === "unknown" && (
            <div className="text-center py-8 text-xs text-muted-foreground font-mono">
              Unrecognized Mermaid diagram syntax. Check raw source.
            </div>
          )}
        </div>
      </div>

      {/* Footer Instructions on Mobile */}
      <div className="sm:hidden flex items-center justify-between px-3 py-1 bg-muted/40 border-t border-border/40 text-[10px] font-mono text-muted-foreground">
        <span>INTERACTIVE DIAGRAM</span>
        <span>Pinch or use zoom controls</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Flowchart SVG View
// ---------------------------------------------------------------------------

function FlowchartView({
  code,
  svgRef,
}: {
  code: string;
  svgRef: React.RefObject<SVGSVGElement | null>;
}) {
  const { direction, nodes, edges } = useMemo(() => parseFlowchart(code), [code]);

  if (nodes.length === 0) {
    return <div className="text-xs text-muted-foreground font-mono">Empty flowchart</div>;
  }

  const maxX = Math.max(...nodes.map((n) => n.x + n.width), 200) + 40;
  const maxY = Math.max(...nodes.map((n) => n.y + n.height), 120) + 40;

  return (
    <svg
      ref={svgRef}
      width={maxX}
      height={maxY}
      viewBox={`0 0 ${maxX} ${maxY}`}
      className="max-w-none text-foreground"
    >
      <defs>
        <marker
          id="flow-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="currentColor" opacity="0.8" />
        </marker>
        <marker
          id="flow-arrow-thick"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
      </defs>

      {/* Render Edges */}
      {edges.map((e, idx) => {
        const fromNode = nodes.find((n) => n.id === e.from);
        const toNode = nodes.find((n) => n.id === e.to);
        if (!fromNode || !toNode) return null;

        let startX = fromNode.x + fromNode.width / 2;
        let startY = fromNode.y + fromNode.height;
        let endX = toNode.x + toNode.width / 2;
        let endY = toNode.y;

        if (direction === "LR") {
          startX = fromNode.x + fromNode.width;
          startY = fromNode.y + fromNode.height / 2;
          endX = toNode.x;
          endY = toNode.y + toNode.height / 2;
        }

        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;

        const pathD =
          direction === "TD"
            ? `M ${startX} ${startY} C ${startX} ${startY + 30}, ${endX} ${endY - 30}, ${endX} ${endY}`
            : `M ${startX} ${startY} C ${startX + 30} ${startY}, ${endX - 30} ${endY}, ${endX} ${endY}`;

        return (
          <g key={idx}>
            <path
              d={pathD}
              fill="none"
              stroke="currentColor"
              strokeWidth={e.style === "thick" ? "2.5" : "1.5"}
              strokeDasharray={e.style === "dotted" ? "4 3" : undefined}
              markerEnd={
                e.style !== "line"
                  ? e.style === "thick"
                    ? "url(#flow-arrow-thick)"
                    : "url(#flow-arrow)"
                  : undefined
              }
              className="opacity-70 transition-opacity hover:opacity-100"
            />
            {e.label && (
              <g transform={`translate(${midX}, ${midY})`}>
                <rect
                  x={-(e.label.length * 3.5 + 8)}
                  y={-9}
                  width={e.label.length * 7 + 16}
                  height={18}
                  fill="var(--background)"
                  stroke="var(--border)"
                  strokeWidth="0.8"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  className="fill-foreground font-mono text-[10px] font-medium"
                >
                  {e.label}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Render Nodes */}
      {nodes.map((node) => {
        const cx = node.x + node.width / 2;
        const cy = node.y + node.height / 2;

        return (
          <g key={node.id} className="cursor-pointer group">
            {node.shape === "diamond" ? (
              <polygon
                points={`${cx},${node.y} ${node.x + node.width},${cy} ${cx},${node.y + node.height} ${node.x},${cy}`}
                fill="var(--card)"
                stroke="var(--border)"
                strokeWidth="1.5"
                className="group-hover:stroke-primary transition-colors"
              />
            ) : node.shape === "circle" ? (
              <circle
                cx={cx}
                cy={cy}
                r={Math.min(node.width, node.height) / 2}
                fill="var(--card)"
                stroke="var(--border)"
                strokeWidth="1.5"
                className="group-hover:stroke-primary transition-colors"
              />
            ) : node.shape === "database" ? (
              <g>
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  rx="6"
                  fill="var(--card)"
                  stroke="var(--border)"
                  strokeWidth="1.5"
                  className="group-hover:stroke-primary transition-colors"
                />
                <line
                  x1={node.x}
                  y1={node.y + 10}
                  x2={node.x + node.width}
                  y2={node.y + 10}
                  stroke="var(--border)"
                  strokeWidth="1.2"
                />
              </g>
            ) : (
              <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                rx={node.shape === "round" ? "12" : "2"}
                fill="var(--card)"
                stroke="var(--border)"
                strokeWidth="1.5"
                className="group-hover:stroke-primary group-hover:shadow-sm transition-all"
              />
            )}
            <text
              x={cx}
              y={cy + 4}
              textAnchor="middle"
              className="fill-foreground font-sans text-xs font-medium tracking-tight pointer-events-none"
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 2. Sequence Diagram SVG View
// ---------------------------------------------------------------------------

function SequenceView({
  code,
  svgRef,
}: {
  code: string;
  svgRef: React.RefObject<SVGSVGElement | null>;
}) {
  const { participants, items } = useMemo(() => parseSequenceDiagram(code), [code]);

  if (participants.length === 0) {
    return <div className="text-xs text-muted-foreground font-mono">Empty sequence diagram</div>;
  }

  const HEADER_Y = 30;
  const STEP_Y = 55;
  const totalHeight = HEADER_Y + 50 + items.length * STEP_Y + 40;
  const totalWidth = Math.max(
    ...participants.map((p) => p.x + 80),
    participants.length * 150 + 60
  );

  return (
    <svg
      ref={svgRef}
      width={totalWidth}
      height={totalHeight}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="max-w-none text-foreground"
    >
      <defs>
        <marker
          id="seq-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="currentColor" />
        </marker>
      </defs>

      {/* Lifelines */}
      {participants.map((p) => (
        <line
          key={`line-${p.id}`}
          x1={p.x}
          y1={HEADER_Y + 30}
          x2={p.x}
          y2={totalHeight - 40}
          stroke="var(--border)"
          strokeDasharray="4 4"
          strokeWidth="1.2"
        />
      ))}

      {/* Top Participant Badges */}
      {participants.map((p) => (
        <g key={`top-${p.id}`} transform={`translate(${p.x}, ${HEADER_Y})`}>
          <rect
            x="-50"
            y="-16"
            width="100"
            height="32"
            fill="var(--card)"
            stroke="var(--border)"
            strokeWidth="1.2"
            rx="2"
          />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            className="fill-foreground font-sans text-xs font-semibold"
          >
            {p.label}
          </text>
        </g>
      ))}

      {/* Messages & Notes */}
      {items.map((item, idx) => {
        const y = HEADER_Y + 60 + idx * STEP_Y;

        if (item.type === "message") {
          const msg = item.data as SequenceMessage;
          const fromPart = participants.find((p) => p.id === msg.from);
          const toPart = participants.find((p) => p.id === msg.to);
          if (!fromPart || !toPart) return null;

          const isSelf = msg.from === msg.to;
          const midX = (fromPart.x + toPart.x) / 2;

          return (
            <g key={idx}>
              {isSelf ? (
                <path
                  d={`M ${fromPart.x} ${y} H ${fromPart.x + 35} V ${y + 24} H ${fromPart.x}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  markerEnd="url(#seq-arrow)"
                />
              ) : (
                <line
                  x1={fromPart.x}
                  y1={y}
                  x2={toPart.x}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray={msg.dashed ? "4 3" : undefined}
                  markerEnd={msg.arrow ? "url(#seq-arrow)" : undefined}
                />
              )}
              <text
                x={isSelf ? fromPart.x + 42 : midX}
                y={y - 6}
                textAnchor={isSelf ? "start" : "middle"}
                className="fill-foreground font-sans text-[11.5px] font-medium"
              >
                {msg.text}
              </text>
            </g>
          );
        }

        if (item.type === "note") {
          const note = item.data as SequenceNote;
          const part = participants.find((p) => p.id === note.participant);
          if (!part) return null;

          return (
            <g key={idx} transform={`translate(${part.x}, ${y})`}>
              <rect
                x="-45"
                y="-12"
                width="90"
                height="26"
                fill="var(--muted)"
                stroke="var(--border)"
                strokeWidth="1"
                rx="2"
              />
              <text
                x="0"
                y="5"
                textAnchor="middle"
                className="fill-foreground font-mono text-[10px]"
              >
                {note.text}
              </text>
            </g>
          );
        }

        return null;
      })}

      {/* Bottom Participant Badges */}
      {participants.map((p) => (
        <g key={`bot-${p.id}`} transform={`translate(${p.x}, ${totalHeight - 30})`}>
          <rect
            x="-50"
            y="-16"
            width="100"
            height="32"
            fill="var(--card)"
            stroke="var(--border)"
            strokeWidth="1.2"
            rx="2"
          />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            className="fill-foreground font-sans text-xs font-semibold"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 3. Pie Chart SVG View
// ---------------------------------------------------------------------------

function PieView({ code, svgRef }: { code: string; svgRef: React.RefObject<SVGSVGElement | null> }) {
  const { title, slices } = useMemo(() => parsePie(code), [code]);

  if (slices.length === 0) {
    return <div className="text-xs text-muted-foreground font-mono">Empty pie chart</div>;
  }

  const SIZE = 240;
  const CENTER = SIZE / 2;
  const RADIUS = 90;
  const INNER_RADIUS = 46; // Donut style

  const getArc = (start: number, end: number) => {
    const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
    const x1 = CENTER + RADIUS * Math.cos(rad(start));
    const y1 = CENTER + RADIUS * Math.sin(rad(start));
    const x2 = CENTER + RADIUS * Math.cos(rad(end));
    const y2 = CENTER + RADIUS * Math.sin(rad(end));

    const x3 = CENTER + INNER_RADIUS * Math.cos(rad(end));
    const y3 = CENTER + INNER_RADIUS * Math.sin(rad(end));
    const x4 = CENTER + INNER_RADIUS * Math.cos(rad(start));
    const y4 = CENTER + INNER_RADIUS * Math.sin(rad(start));

    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg
        ref={svgRef}
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="max-w-none"
      >
        {slices.map((slice, idx) => (
          <path
            key={idx}
            d={getArc(slice.startAngle, slice.endAngle)}
            fill={slice.color}
            stroke="var(--background)"
            strokeWidth="2"
            className="transition-transform hover:opacity-90 cursor-pointer"
          />
        ))}
        <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS - 2} fill="var(--card)" />
        <text
          x={CENTER}
          y={CENTER + 4}
          textAnchor="middle"
          className="fill-foreground font-mono text-xs font-bold"
        >
          {title}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-2 min-w-[160px]">
        {slices.map((slice, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4 text-xs font-sans">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-xs shrink-0" style={{ backgroundColor: slice.color }} />
              <span className="text-foreground font-medium">{slice.label}</span>
            </div>
            <span className="font-mono text-muted-foreground">{slice.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Mindmap SVG View
// ---------------------------------------------------------------------------

function MindmapView({
  code,
  svgRef,
}: {
  code: string;
  svgRef: React.RefObject<SVGSVGElement | null>;
}) {
  const root = useMemo(() => parseMindmap(code), [code]);

  const WIDTH = 480;
  const HEIGHT = 260;
  const CENTER_X = WIDTH / 2;
  const CENTER_Y = HEIGHT / 2;

  // Position branches radially around center
  const branches = root.children;
  const branchCount = Math.max(1, branches.length);

  return (
    <svg
      ref={svgRef}
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="max-w-none text-foreground"
    >
      {branches.map((b, idx) => {
        const angle = (idx / branchCount) * Math.PI * 2;
        const bx = CENTER_X + Math.cos(angle) * 140;
        const by = CENTER_Y + Math.sin(angle) * 75;

        return (
          <g key={b.id}>
            {/* Branch Curved Link */}
            <path
              d={`M ${CENTER_X} ${CENTER_Y} Q ${(CENTER_X + bx) / 2} ${by}, ${bx} ${by}`}
              fill="none"
              stroke={PALETTE[idx % PALETTE.length]}
              strokeWidth="2"
              className="opacity-60"
            />
            {/* Branch Node */}
            <rect
              x={bx - (b.label.length * 4 + 14)}
              y={by - 14}
              width={b.label.length * 8 + 28}
              height="28"
              rx="14"
              fill="var(--card)"
              stroke={PALETTE[idx % PALETTE.length]}
              strokeWidth="1.5"
            />
            <text
              x={bx}
              y={by + 4}
              textAnchor="middle"
              className="fill-foreground font-sans text-xs font-medium"
            >
              {b.label}
            </text>
          </g>
        );
      })}

      {/* Central Root Node */}
      <circle
        cx={CENTER_X}
        cy={CENTER_Y}
        r="42"
        fill="var(--card)"
        stroke="var(--primary)"
        strokeWidth="2.5"
      />
      <text
        x={CENTER_X}
        y={CENTER_Y + 4}
        textAnchor="middle"
        className="fill-foreground font-sans text-xs font-bold"
      >
        {root.label}
      </text>
    </svg>
  );
}
