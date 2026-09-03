"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Network,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Maximize2,
  Minimize2,
  Tag,
  FileText,
} from "lucide-react";
import { Note } from "@/lib/storage/schema";
import { Corners } from "@/components/frame";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { countWords } from "@/lib/utils";

interface KnowledgeGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  activeNoteId?: string;
  onSelectNote: (id: string) => void;
}

interface GraphNode {
  id: string;
  title: string;
  tags: string[];
  wordCount: number;
  isPinned: boolean;
  isCurrent: boolean;
  linkCount: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

export function KnowledgeGraphModal({
  isOpen,
  onClose,
  notes,
  activeNoteId,
  onSelectNote,
}: KnowledgeGraphModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Transform scale and pan offset
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const isDraggingCanvasRef = useRef(false);
  const draggedNodeRef = useRef<GraphNode | null>(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [notes]);

  // Build Graph Nodes and Edges
  const graphData = useMemo(() => {
    // Map note title (lowercase) to note ID
    const titleToId = new Map<string, string>();
    notes.forEach((n) => {
      if (n.title) {
        titleToId.set(n.title.toLowerCase().trim(), n.id);
      }
      titleToId.set(n.id, n.id);
    });

    const edges: GraphEdge[] = [];
    const linkCounts = new Map<string, number>();

    // Extract [[wiki-links]] from each note
    notes.forEach((note) => {
      const matches = note.content.matchAll(/\[\[(.*?)\]\]/g);
      for (const m of matches) {
        const raw = m[1];
        const [target] = raw.includes("|") ? raw.split("|") : [raw];
        const cleanTarget = target.trim().toLowerCase();
        const targetId = titleToId.get(cleanTarget);
        if (targetId && targetId !== note.id) {
          edges.push({ source: note.id, target: targetId });
          linkCounts.set(note.id, (linkCounts.get(note.id) || 0) + 1);
          linkCounts.set(targetId, (linkCounts.get(targetId) || 0) + 1);
        }
      }
    });

    // Initialize nodes around a circle
    const numNodes = notes.length;
    const initialRadius = Math.min(250, 40 + numNodes * 15);
    const nodesList: GraphNode[] = notes.map((n, i) => {
      const angle = (i / Math.max(1, numNodes)) * 2 * Math.PI;
      const count = linkCounts.get(n.id) || 0;
      const words = countWords(n.content);
      const isCurrent = n.id === activeNoteId;
      const radius = Math.min(20, Math.max(7, 7 + count * 2.5 + (isCurrent ? 3 : 0)));

      return {
        id: n.id,
        title: n.title || "Untitled",
        tags: n.tags || [],
        wordCount: words,
        isPinned: Boolean(n.isPinned),
        isCurrent,
        linkCount: count,
        x: Math.cos(angle) * initialRadius + (Math.random() - 0.5) * 40,
        y: Math.sin(angle) * initialRadius + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
        radius,
      };
    });

    return { nodes: nodesList, edges };
  }, [notes, activeNoteId]);

  // Keep live reference to nodes for animation loop
  const nodesRef = useRef<GraphNode[]>([]);
  useEffect(() => {
    nodesRef.current = graphData.nodes;
    transformRef.current = { x: 0, y: 0, scale: 1 };
  }, [graphData]);

  // Force-Directed Physics Simulation & Canvas Rendering Loop
  useEffect(() => {
    if (!isOpen) return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to container
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    handleResize();

    const simulateAndRender = () => {
      const nodes = nodesRef.current;
      const edges = graphData.edges;
      const numNodes = nodes.length;

      // 1. Physics: Coulomb Repulsion between all nodes
      for (let i = 0; i < numNodes; i++) {
        for (let j = i + 1; j < numNodes; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distSq = dx * dx + dy * dy + 100;
          const dist = Math.sqrt(distSq);
          const force = 1200 / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          n1.vx -= fx;
          n1.vy -= fy;
          n2.vx += fx;
          n2.vy += fy;
        }
      }

      // 2. Physics: Hooke's Spring Attraction along edges
      const nodeMap = new Map<string, GraphNode>();
      nodes.forEach((n) => nodeMap.set(n.id, n));

      const restLength = 110;
      const springK = 0.04;
      edges.forEach((edge) => {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const delta = dist - restLength;
          const force = delta * springK;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          source.vx += fx;
          source.vy += fy;
          target.vx -= fx;
          target.vy -= fy;
        }
      });

      // 3. Physics: Center Gravity & Velocity Damping
      const gravity = 0.015;
      nodes.forEach((n) => {
        if (draggedNodeRef.current === n) return; // Don't move actively dragged node
        n.vx -= n.x * gravity;
        n.vy -= n.y * gravity;
        n.vx *= 0.86;
        n.vy *= 0.86;
        n.x += n.vx;
        n.y += n.vy;
      });

      // 4. Render Canvas
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.scale(dpr, dpr);
      const centerX = (canvas.width / dpr) / 2 + transformRef.current.x;
      const centerY = (canvas.height / dpr) / 2 + transformRef.current.y;
      ctx.translate(centerX, centerY);
      ctx.scale(transformRef.current.scale, transformRef.current.scale);

      // Draw subtle grid dots
      ctx.fillStyle = "rgba(120, 120, 120, 0.12)";
      const gridSize = 40;
      const extent = 1200;
      for (let gx = -extent; gx <= extent; gx += gridSize) {
        for (let gy = -extent; gy <= extent; gy += gridSize) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Edges
      edges.forEach((edge) => {
        const s = nodeMap.get(edge.source);
        const t = nodeMap.get(edge.target);
        if (!s || !t) return;

        const isHighlighted =
          (hoveredNode && (hoveredNode.id === s.id || hoveredNode.id === t.id)) ||
          s.isCurrent ||
          t.isCurrent;

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = isHighlighted
          ? "rgba(180, 120, 60, 0.75)"
          : "rgba(150, 150, 150, 0.25)";
        ctx.lineWidth = isHighlighted ? 2 : 1;
        ctx.stroke();
      });

      // Draw Nodes
      nodes.forEach((n) => {
        const isHovered = hoveredNode?.id === n.id;
        const matchesSearch =
          searchQuery && n.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag = selectedTag && n.tags.includes(selectedTag);

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);

        // Fill color
        if (n.isCurrent) {
          ctx.fillStyle = "#d97706"; // warm primary amber
        } else if (matchesSearch || matchesTag) {
          ctx.fillStyle = "#10b981"; // emerald match
        } else if (isHovered) {
          ctx.fillStyle = "#b45309";
        } else {
          ctx.fillStyle = "rgba(100, 100, 100, 0.85)";
        }
        ctx.fill();

        // Stroke ring
        ctx.lineWidth = isHovered || n.isCurrent ? 3 : 1.5;
        ctx.strokeStyle = isHovered ? "#f59e0b" : "rgba(240, 240, 240, 0.6)";
        ctx.stroke();

        // Node Title Label
        ctx.font = isHovered || n.isCurrent ? "bold 11px sans-serif" : "10px sans-serif";
        ctx.fillStyle = isHovered || n.isCurrent ? "rgba(240, 240, 240, 0.95)" : "rgba(180, 180, 180, 0.75)";
        ctx.textAlign = "center";
        ctx.fillText(n.title, n.x, n.y + n.radius + 12);
      });

      ctx.restore();
      animId = requestAnimationFrame(simulateAndRender);
    };

    animId = requestAnimationFrame(simulateAndRender);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, graphData, hoveredNode, searchQuery, selectedTag]);

  // Mouse Interaction: Pan, Drag Node & Hover Detection
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const dpr = 1;
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    const centerX = rect.width / 2 + transformRef.current.x;
    const centerY = rect.height / 2 + transformRef.current.y;
    const worldX = (mouseX - centerX) / transformRef.current.scale;
    const worldY = (mouseY - centerY) / transformRef.current.scale;
    return { x: worldX, y: worldY };
  };

  const findNodeAt = (x: number, y: number): GraphNode | null => {
    for (const node of nodesRef.current) {
      const dx = node.x - x;
      const dy = node.y - y;
      if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 6) {
        return node;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const node = findNodeAt(x, y);
    if (node) {
      draggedNodeRef.current = node;
    } else {
      isDraggingCanvasRef.current = true;
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = x;
      draggedNodeRef.current.y = y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
    } else if (isDraggingCanvasRef.current) {
      const dx = e.clientX - dragStartPosRef.current.x;
      const dy = e.clientY - dragStartPosRef.current.y;
      transformRef.current.x += dx;
      transformRef.current.y += dy;
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    } else {
      const node = findNodeAt(x, y);
      setHoveredNode(node);
    }
  };

  const handleMouseUp = () => {
    if (draggedNodeRef.current) {
      draggedNodeRef.current = null;
    }
    isDraggingCanvasRef.current = false;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const node = findNodeAt(x, y);
    if (node) {
      onSelectNote(node.id);
      onClose();
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(3, Math.max(0.3, transformRef.current.scale * zoomFactor));
    transformRef.current.scale = newScale;
  };

  const handleResetView = () => {
    transformRef.current = { x: 0, y: 0, scale: 1 };
  };

  const isolatedCount = graphData.nodes.filter((n) => n.linkCount === 0).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col font-sans select-none animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="h-12 border-b border-border/80 px-4 flex items-center justify-between bg-card/90 shrink-0">
        <div className="flex items-center gap-2.5">
          <Network className="size-4 text-primary" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
            Interactive Knowledge Graph
          </span>
          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 rounded-none">
            {graphData.nodes.length} Notes · {graphData.edges.length} Links
          </Badge>
          {isolatedCount > 0 && (
            <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 rounded-none hidden sm:inline-flex">
              {isolatedCount} Isolated
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search Filter */}
          <div className="hidden sm:flex items-center gap-1.5 bg-background border border-border px-2 py-0.5 text-xs">
            <Search className="size-3 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search graph..."
              className="bg-transparent text-foreground focus:outline-none font-mono text-[11px] w-28"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground">
                <X className="size-3" />
              </button>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            className="h-7 w-7 rounded-none text-muted-foreground hover:text-foreground"
            aria-label="Close Graph View"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-background">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
          onWheel={handleWheel}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />

        {/* Floating Controls Pill */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 bg-card/90 border border-border/80 p-1 shadow-md">
          <Corners size="sm" offset="border" weight="thin" light />
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => (transformRef.current.scale = Math.min(3, transformRef.current.scale * 1.2))}
            className="h-6 w-6 rounded-none text-muted-foreground hover:text-foreground"
            title="Zoom In"
          >
            <ZoomIn className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => (transformRef.current.scale = Math.max(0.3, transformRef.current.scale * 0.8))}
            className="h-6 w-6 rounded-none text-muted-foreground hover:text-foreground"
            title="Zoom Out"
          >
            <ZoomOut className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleResetView}
            className="h-6 w-6 rounded-none text-muted-foreground hover:text-foreground"
            title="Reset View"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>

        {/* Tag Filters Pill */}
        {allTags.length > 0 && (
          <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-1 max-w-[70vw]">
            <Button
              size="xs"
              variant={selectedTag === null ? "default" : "outline"}
              onClick={() => setSelectedTag(null)}
              className="h-6 text-[10.5px] font-mono rounded-none"
            >
              All Tags
            </Button>
            {allTags.slice(0, 8).map((t) => (
              <Button
                key={t}
                size="xs"
                variant={selectedTag === t ? "default" : "outline"}
                onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                className="h-6 text-[10.5px] font-mono rounded-none gap-1 bg-card/80"
              >
                <Tag className="size-2.5" />
                <span>#{t}</span>
              </Button>
            ))}
          </div>
        )}

        {/* Hovered Node Detail Tooltip Card */}
        {hoveredNode && (
          <div className="absolute bottom-4 right-4 z-10 w-64 bg-card/95 border border-border/80 p-3 shadow-xl pointer-events-none animate-in fade-in duration-100">
            <Corners size="sm" offset="border" weight="thin" light />
            <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground mb-1">
              <FileText className="size-3 text-primary shrink-0" />
              <span className="truncate">{hoveredNode.title}</span>
            </div>
            <div className="text-[11px] font-mono text-muted-foreground space-y-0.5">
              <div>Connections: <span className="text-foreground">{hoveredNode.linkCount}</span></div>
              <div>Words: <span className="text-foreground">{hoveredNode.wordCount}</span></div>
              {hoveredNode.tags.length > 0 && (
                <div className="truncate">
                  Tags: {hoveredNode.tags.map((t) => `#${t}`).join(" ")}
                </div>
              )}
            </div>
            <div className="text-[10px] text-primary/80 mt-2 font-mono">
              Click node to open note ↗
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
