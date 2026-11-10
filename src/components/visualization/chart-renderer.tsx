"use client";

import React, { useState, useMemo, useRef } from "react";
import { Corners } from "@/components/frame";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  LineChart as LineIcon,
  PieChart as DonutIcon,
  Copy,
  Check,
  TrendingUp,
  Activity,
  Code,
} from "lucide-react";
import { hapticTap } from "@/lib/ui/haptics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type ChartType = "bar" | "line" | "area" | "donut";

interface ChartConfig {
  type: ChartType;
  title: string;
  labels: string[];
  data: number[];
  unit?: string;
  colorTheme?: string;
}

const COLOR_MAP: Record<string, { stroke: string; fill: string; bg: string }> = {
  amber: { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.25)", bg: "#f59e0b" },
  blue: { stroke: "#3b82f6", fill: "rgba(59, 130, 246, 0.25)", bg: "#3b82f6" },
  emerald: { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.25)", bg: "#10b981" },
  purple: { stroke: "#8b5cf6", fill: "rgba(139, 92, 246, 0.25)", bg: "#8b5cf6" },
  rose: { stroke: "#f43f5e", fill: "rgba(244, 63, 94, 0.25)", bg: "#f43f5e" },
};

function parseChartConfig(code: string): ChartConfig {
  const lines = code.trim().split("\n");
  const config: ChartConfig = {
    type: "bar",
    title: "Data Metric",
    labels: [],
    data: [],
    unit: "",
    colorTheme: "amber",
  };

  lines.forEach((line) => {
    const match = line.match(/^([a-zA-Z_-]+)\s*:\s*(.*)$/);
    if (!match) return;
    const key = match[1].toLowerCase().trim();
    const val = match[2].trim();

    if (key === "type") {
      const lower = val.toLowerCase();
      if (lower === "line" || lower === "area" || lower === "donut" || lower === "bar") {
        config.type = lower;
      }
    } else if (key === "title") {
      config.title = val;
    } else if (key === "labels" || key === "categories") {
      config.labels = val.split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
    } else if (key === "data" || key === "values") {
      config.data = val.split(",").map((s) => Number.parseFloat(s.trim()) || 0);
    } else if (key === "unit") {
      config.unit = val;
    } else if (key === "color") {
      config.colorTheme = val.toLowerCase();
    }
  });

  // Ensure arrays align
  if (config.labels.length === 0 && config.data.length > 0) {
    config.labels = config.data.map((_, i) => `Item ${i + 1}`);
  }

  return config;
}

export function ChartRenderer({ code }: { code: string }) {
  const initialConfig = useMemo(() => parseChartConfig(code), [code]);
  const [activeType, setActiveType] = useState<ChartType>(initialConfig.type);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const theme = COLOR_MAP[initialConfig.colorTheme || "amber"] || COLOR_MAP.amber;

  // Stats calculation
  const stats = useMemo(() => {
    const vals = initialConfig.data;
    if (vals.length === 0) return { max: 0, min: 0, avg: 0, sum: 0 };
    const sum = vals.reduce((a, b) => a + b, 0);
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    const avg = Math.round((sum / vals.length) * 10) / 10;
    return { max, min, avg, sum };
  }, [initialConfig.data]);

  const handleCopySvg = async () => {
    if (!svgRef.current) return;
    try {
      const xml = new XMLSerializer().serializeToString(svgRef.current);
      await navigator.clipboard.writeText(xml);
      hapticTap("light");
      setCopied(true);
      toast.success("Chart SVG copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy SVG");
    }
  };

  const WIDTH = 560;
  const HEIGHT = 240;
  const PAD_TOP = 25;
  const PAD_BOT = 35;
  const PAD_LEFT = 45;
  const PAD_RIGHT = 25;
  const CHART_W = WIDTH - PAD_LEFT - PAD_RIGHT;
  const CHART_H = HEIGHT - PAD_TOP - PAD_BOT;

  const maxVal = Math.max(stats.max, 1) * 1.15;

  return (
    <div className="relative my-6 border border-border/80 bg-card/60 shadow-xs rounded-none font-sans overflow-hidden select-none">
      <Corners size="sm" offset="border" weight="thin" light />

      {/* Header Bar */}
      <div className="px-3.5 py-2 border-b border-border/60 bg-muted/40 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="size-3.5 text-primary" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
            {initialConfig.title}
          </span>
          {initialConfig.unit && (
            <span className="text-[10px] font-mono text-muted-foreground/80 px-1 py-0.2 bg-muted">
              {initialConfig.unit}
            </span>
          )}
        </div>

        {/* View Switcher & Controls */}
        <div className="flex items-center gap-1">
          <div className="flex items-center bg-muted/60 p-0.5 rounded-none border border-border/40">
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setActiveType("bar")}
              title="Bar Chart"
              className={cn("size-6 rounded-none", activeType === "bar" && "bg-card text-primary shadow-xs")}
            >
              <BarChart3 className="size-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setActiveType("line")}
              title="Line Chart"
              className={cn("size-6 rounded-none", activeType === "line" && "bg-card text-primary shadow-xs")}
            >
              <LineIcon className="size-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setActiveType("donut")}
              title="Donut Chart"
              className={cn("size-6 rounded-none", activeType === "donut" && "bg-card text-primary shadow-xs")}
            >
              <DonutIcon className="size-3.5" />
            </Button>
          </div>

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

      {/* Chart Canvas Area */}
      <div className="p-4 sm:p-5 flex flex-col items-center justify-center">
        {activeType === "donut" ? (
          <DonutChartView
            config={initialConfig}
            svgRef={svgRef}
            stats={stats}
            hoveredIdx={hoveredIdx}
            setHoveredIdx={setHoveredIdx}
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <svg
              ref={svgRef}
              width={WIDTH}
              height={HEIGHT}
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="w-full h-auto text-foreground font-mono"
            >
              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                const y = PAD_TOP + CHART_H * (1 - pct);
                const val = Math.round(maxVal * pct);
                return (
                  <g key={pct}>
                    <line
                      x1={PAD_LEFT}
                      y1={y}
                      x2={WIDTH - PAD_RIGHT}
                      y2={y}
                      stroke="var(--border)"
                      strokeWidth="0.8"
                      strokeDasharray="3 3"
                      className="opacity-50"
                    />
                    <text
                      x={PAD_LEFT - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      className="fill-muted-foreground text-[9.5px]"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Render Bar Chart */}
              {activeType === "bar" &&
                initialConfig.data.map((val, idx) => {
                  const barWidth = Math.min(36, CHART_W / initialConfig.data.length - 8);
                  const x =
                    PAD_LEFT +
                    (idx + 0.5) * (CHART_W / initialConfig.data.length) -
                    barWidth / 2;
                  const barHeight = (val / maxVal) * CHART_H;
                  const y = PAD_TOP + CHART_H - barHeight;
                  const isHovered = hoveredIdx === idx;

                  return (
                    <g
                      key={idx}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      className="cursor-pointer transition-opacity"
                    >
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx="2"
                        fill={isHovered ? theme.stroke : theme.fill}
                        stroke={theme.stroke}
                        strokeWidth="1.5"
                        className="transition-all"
                      />
                      {/* Label below */}
                      <text
                        x={x + barWidth / 2}
                        y={HEIGHT - 12}
                        textAnchor="middle"
                        className="fill-muted-foreground text-[9px]"
                      >
                        {initialConfig.labels[idx]}
                      </text>
                      {/* Hover value indicator */}
                      {isHovered && (
                        <g>
                          <rect
                            x={x + barWidth / 2 - 24}
                            y={y - 20}
                            width="48"
                            height="16"
                            rx="2"
                            fill="var(--card)"
                            stroke="var(--border)"
                            strokeWidth="1"
                          />
                          <text
                            x={x + barWidth / 2}
                            y={y - 8}
                            textAnchor="middle"
                            className="fill-foreground text-[9px] font-bold"
                          >
                            {val}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

              {/* Render Line or Area Chart */}
              {activeType === "line" && (
                <LineChartView
                  config={initialConfig}
                  maxVal={maxVal}
                  padLeft={PAD_LEFT}
                  padTop={PAD_TOP}
                  padRight={PAD_RIGHT}
                  chartW={CHART_W}
                  chartH={CHART_H}
                  height={HEIGHT}
                  theme={theme}
                  hoveredIdx={hoveredIdx}
                  setHoveredIdx={setHoveredIdx}
                />
              )}
            </svg>
          </div>
        )}

        {/* Footer Metrics Summary Strip */}
        <div className="grid grid-cols-4 gap-2 w-full pt-3 mt-3 border-t border-border/40 text-center font-mono text-xs">
          <div className="bg-muted/20 p-1.5 border border-border/30">
            <span className="text-[9px] text-muted-foreground uppercase block">Total</span>
            <span className="font-bold text-foreground">{stats.sum}</span>
          </div>
          <div className="bg-muted/20 p-1.5 border border-border/30">
            <span className="text-[9px] text-muted-foreground uppercase block">Avg</span>
            <span className="font-bold text-foreground">{stats.avg}</span>
          </div>
          <div className="bg-muted/20 p-1.5 border border-border/30">
            <span className="text-[9px] text-muted-foreground uppercase block">Peak</span>
            <span className="font-bold text-foreground text-amber-500">{stats.max}</span>
          </div>
          <div className="bg-muted/20 p-1.5 border border-border/30">
            <span className="text-[9px] text-muted-foreground uppercase block">Low</span>
            <span className="font-bold text-foreground text-muted-foreground">{stats.min}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LineChartView({
  config,
  maxVal,
  padLeft,
  padTop,
  padRight,
  chartW,
  chartH,
  height,
  theme,
  hoveredIdx,
  setHoveredIdx,
}: {
  config: ChartConfig;
  maxVal: number;
  padLeft: number;
  padTop: number;
  padRight: number;
  chartW: number;
  chartH: number;
  height: number;
  theme: { stroke: string; fill: string; bg: string };
  hoveredIdx: number | null;
  setHoveredIdx: (idx: number | null) => void;
}) {
  const points = config.data.map((val, idx) => {
    const x = padLeft + (idx / Math.max(1, config.data.length - 1)) * chartW;
    const y = padTop + chartH - (val / maxVal) * chartH;
    return { x, y, val };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[idx - 1];
    const cx1 = (prev.x + pt.x) / 2;
    return `${acc} C ${cx1} ${prev.y}, ${cx1} ${pt.y}, ${pt.x} ${pt.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`;

  return (
    <g>
      {/* Area gradient fill */}
      <path d={areaD} fill={theme.fill} opacity="0.6" />
      {/* Smooth line */}
      <path d={pathD} fill="none" stroke={theme.stroke} strokeWidth="2.5" />

      {/* Point dots */}
      {points.map((pt, idx) => {
        const isHovered = hoveredIdx === idx;
        return (
          <g
            key={idx}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="cursor-pointer"
          >
            <circle
              cx={pt.x}
              cy={pt.y}
              r={isHovered ? 6 : 4}
              fill={isHovered ? theme.stroke : "var(--card)"}
              stroke={theme.stroke}
              strokeWidth="2"
              className="transition-all"
            />
            {/* Label below */}
            <text
              x={pt.x}
              y={height - 12}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {config.labels[idx]}
            </text>
            {isHovered && (
              <g>
                <rect
                  x={pt.x - 22}
                  y={pt.y - 22}
                  width="44"
                  height="16"
                  rx="2"
                  fill="var(--card)"
                  stroke="var(--border)"
                  strokeWidth="1"
                />
                <text
                  x={pt.x}
                  y={pt.y - 10}
                  textAnchor="middle"
                  className="fill-foreground text-[9px] font-bold"
                >
                  {pt.val}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

function DonutChartView({
  config,
  svgRef,
  stats,
  hoveredIdx,
  setHoveredIdx,
}: {
  config: ChartConfig;
  svgRef: React.RefObject<SVGSVGElement | null>;
  stats: { sum: number };
  hoveredIdx: number | null;
  setHoveredIdx: (idx: number | null) => void;
}) {
  const SIZE = 200;
  const CENTER = SIZE / 2;
  const RADIUS = 80;
  const INNER_RADIUS = 50;

  const total = Math.max(stats.sum, 1);
  const PALETTE = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4"];

  let currentAngle = 0;
  const slices = config.data.map((val, idx) => {
    const angle = (val / total) * 360;
    const start = currentAngle;
    const end = currentAngle + angle;
    currentAngle = end;
    return {
      label: config.labels[idx] || `Item ${idx}`,
      val,
      pct: Math.round((val / total) * 100),
      start,
      end,
      color: PALETTE[idx % PALETTE.length],
    };
  });

  const getArc = (start: number, end: number, expand: boolean) => {
    const r = expand ? RADIUS + 4 : RADIUS;
    const ir = expand ? INNER_RADIUS - 2 : INNER_RADIUS;
    const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
    const x1 = CENTER + r * Math.cos(rad(start));
    const y1 = CENTER + r * Math.sin(rad(start));
    const x2 = CENTER + r * Math.cos(rad(end));
    const y2 = CENTER + r * Math.sin(rad(end));
    const x3 = CENTER + ir * Math.cos(rad(end));
    const y3 = CENTER + ir * Math.sin(rad(end));
    const x4 = CENTER + ir * Math.cos(rad(start));
    const y4 = CENTER + ir * Math.sin(rad(start));
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${ir} ${ir} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 my-2">
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
            d={getArc(slice.start, slice.end, hoveredIdx === idx)}
            fill={slice.color}
            stroke="var(--background)"
            strokeWidth="2"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="cursor-pointer transition-all"
          />
        ))}
        <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS - 4} fill="var(--card)" />
        <text
          x={CENTER}
          y={CENTER - 2}
          textAnchor="middle"
          className="fill-foreground font-mono text-sm font-bold"
        >
          {hoveredIdx !== null ? slices[hoveredIdx].val : stats.sum}
        </text>
        <text
          x={CENTER}
          y={CENTER + 12}
          textAnchor="middle"
          className="fill-muted-foreground font-mono text-[9px] uppercase"
        >
          {hoveredIdx !== null ? slices[hoveredIdx].label : "TOTAL"}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-1.5 min-w-[150px]">
        {slices.map((slice, idx) => (
          <div
            key={idx}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className={cn(
              "flex items-center justify-between gap-4 text-xs font-sans p-1 cursor-pointer transition-colors",
              hoveredIdx === idx && "bg-muted/60"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-xs" style={{ backgroundColor: slice.color }} />
              <span className="text-foreground font-medium">{slice.label}</span>
            </div>
            <span className="font-mono text-muted-foreground">{slice.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
