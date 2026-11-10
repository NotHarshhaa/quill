"use client";

import React, { useMemo, useState } from "react";
import {
  BarChart3,
  Calendar,
  X,
  FileText,
  Clock,
  Mic,
  GraduationCap,
  Sparkles,
  BookOpen,
  TrendingUp,
  Tag,
} from "lucide-react";
import { Note } from "@/lib/storage/schema";
import { Corners } from "@/components/frame";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { activityTracker, DayActivity } from "@/lib/storage/activityTracker";
import { countWords } from "@/lib/utils";

interface WritingInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeNote?: Note;
  notes: Note[];
}

function countSyllablesInWord(word: string): number {
  word = word.toLowerCase().trim();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, "");
  word = word.replace(/^y/, "");
  const syl = word.match(/[aeiouy]{1,2}/g);
  return syl ? syl.length : 1;
}

export function WritingInsightsModal({
  isOpen,
  onClose,
  activeNote,
  notes,
}: WritingInsightsModalProps) {
  const [hoveredDay, setHoveredDay] = useState<DayActivity | null>(null);

  // 1. Current Note Detailed Analytics
  const stats = useMemo(() => {
    const text = activeNote?.content || "";
    const words = countWords(text);
    const charsWithSpaces = text.length;
    const charsNoSpaces = text.replace(/\s/g, "").length;

    const sentenceMatches = text.match(/[^.!?]+[.!?]+(\s|$)/g);
    const sentences = Math.max(1, sentenceMatches ? sentenceMatches.length : 1);

    const paragraphMatches = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const paragraphs = Math.max(1, paragraphMatches.length);

    // Reading & Speaking times
    const readingMinutes = Math.max(1, Math.ceil(words / 200));
    const speakingMinutes = Math.max(1, Math.ceil(words / 130));

    // Syllables & Flesch Reading Ease
    const tokens = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    let totalSyllables = 0;
    tokens.forEach((t) => (totalSyllables += countSyllablesInWord(t)));
    const avgSyllablesPerWord = words > 0 ? totalSyllables / words : 1;
    const wordsPerSentence = words / sentences;

    const fleschScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(206.835 - 1.015 * wordsPerSentence - 84.6 * avgSyllablesPerWord)
      )
    );

    let readingLevel = "Standard (Plain English)";
    if (fleschScore >= 80) readingLevel = "Very Easy (Conversational)";
    else if (fleschScore >= 60) readingLevel = "Standard (Plain English)";
    else if (fleschScore >= 50) readingLevel = "Moderate (High School)";
    else if (fleschScore >= 30) readingLevel = "Complex (College)";
    else readingLevel = "Technical / Academic";

    // Lexical diversity (Unique words / total words)
    const uniqueWords = new Set(tokens).size;
    const lexicalDiversity = words > 0 ? Math.round((uniqueWords / words) * 100) : 100;

    return {
      words,
      charsWithSpaces,
      charsNoSpaces,
      sentences,
      paragraphs,
      readingMinutes,
      speakingMinutes,
      fleschScore,
      readingLevel,
      uniqueWords,
      lexicalDiversity,
    };
  }, [activeNote]);

  // 2. Heatmap History (24 weeks)
  const heatmapDays = useMemo(() => {
    return activityTracker.getHeatmapData(24);
  }, [isOpen]);

  // 3. Global Vault Stats
  const vaultStats = useMemo(() => {
    let totalWords = 0;
    let totalLinks = 0;
    const tagSet = new Set<string>();

    notes.forEach((n) => {
      totalWords += countWords(n.content);
      const matches = n.content.matchAll(/\[\[(.*?)\]\]/g);
      for (const _ of matches) totalLinks++;
      n.tags?.forEach((t) => tagSet.add(t));
    });

    return {
      totalNotes: notes.length,
      totalWords,
      totalLinks,
      totalTags: tagSet.size,
    };
  }, [notes]);

  // 4. 14-Day Velocity Trend
  const velocityData = useMemo(() => {
    const recent = heatmapDays.slice(-14);
    const maxWords = Math.max(...recent.map((d) => d.wordsWritten), 100);
    return { recent, maxWords };
  }, [heatmapDays]);

  // 5. Top Tags Breakdown
  const topTags = useMemo(() => {
    const map = new Map<string, number>();
    notes.forEach((n) => {
      n.tags?.forEach((t) => map.set(t, (map.get(t) || 0) + 1));
    });
    return Array.from(map.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [notes]);

  const getHeatmapColor = (words: number) => {
    if (words === 0) return "bg-muted/40 border border-border/30";
    if (words < 150) return "bg-amber-600/30 border border-amber-600/40";
    if (words < 400) return "bg-amber-600/60 border border-amber-600/70";
    if (words < 800) return "bg-amber-600/85 border border-amber-500";
    return "bg-amber-600 border border-amber-400";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 font-sans select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-card border border-border/80 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <Corners size="sm" offset="border" weight="thin" light />

        {/* Header */}
        <div className="h-12 px-4 border-b border-border/70 flex items-center justify-between bg-muted/30 shrink-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-primary" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              Writing Insights & Analytics
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            className="h-7 w-7 rounded-none text-muted-foreground hover:text-foreground"
            aria-label="Close Insights"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Section 1: Contribution Activity Heatmap */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                <Calendar className="size-3.5 text-primary" />
                <span>Writing Activity Heatmap (24 Weeks)</span>
              </div>
              <span className="text-[10.5px] font-mono text-muted-foreground">
                {hoveredDay
                  ? `${hoveredDay.date}: ${hoveredDay.wordsWritten} words`
                  : "Hover date for details"}
              </span>
            </div>

            {/* 14-Day Velocity Trend Chart */}
            <div className="mb-3 p-3 bg-muted/20 border border-border/70">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <TrendingUp className="size-3.5 text-primary" />
                  14-Day Writing Velocity
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  Peak: {velocityData.maxWords} words/day
                </span>
              </div>
              <div className="h-20 flex items-end gap-1.5 w-full pt-2">
                {velocityData.recent.map((d, i) => {
                  const hPct = Math.max(8, Math.round((d.wordsWritten / velocityData.maxWords) * 100));
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
                      title={`${d.date}: ${d.wordsWritten} words`}
                    >
                      <div className="w-full bg-muted/40 h-14 flex items-end">
                        <div
                          style={{ height: `${hPct}%` }}
                          className={`w-full transition-all ${
                            d.wordsWritten > 0 ? "bg-primary group-hover:bg-primary/80" : "bg-transparent"
                          }`}
                        />
                      </div>
                      <span className="font-mono text-[8.5px] text-muted-foreground/60 truncate max-w-full">
                        {d.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="p-3 bg-muted/20 border border-border/70 overflow-x-auto">
              <div className="grid grid-flow-col grid-rows-7 gap-1 w-max">
                {heatmapDays.map((day, idx) => (
                  <div
                    key={`${day.date}-${idx}`}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`size-3 rounded-none transition-all cursor-pointer ${getHeatmapColor(
                      day.wordsWritten
                    )} hover:ring-1 hover:ring-foreground/50`}
                    title={`${day.date}: ${day.wordsWritten} words`}
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-3 pt-2 border-t border-border/40">
                <span>Daily word output</span>
                <div className="flex items-center gap-1.5">
                  <span>Less</span>
                  <div className="size-2.5 bg-muted/40 border border-border/30" />
                  <div className="size-2.5 bg-amber-600/30" />
                  <div className="size-2.5 bg-amber-600/60" />
                  <div className="size-2.5 bg-amber-600/85" />
                  <div className="size-2.5 bg-amber-600" />
                  <span>More</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Active Note Diagnostics */}
          <div>
            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-foreground mb-2.5">
              <FileText className="size-3.5 text-primary" />
              <span>Document Diagnostics · {activeNote?.title || "Untitled"}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-muted/20 border border-border/60">
                <div className="font-mono text-[10px] text-muted-foreground uppercase">Words</div>
                <div className="font-mono text-xl font-bold text-foreground mt-0.5">{stats.words}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{stats.uniqueWords} unique</div>
              </div>

              <div className="p-2.5 bg-muted/20 border border-border/60">
                <div className="font-mono text-[10px] text-muted-foreground uppercase">Characters</div>
                <div className="font-mono text-xl font-bold text-foreground mt-0.5">{stats.charsWithSpaces}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{stats.charsNoSpaces} (no spaces)</div>
              </div>

              <div className="p-2.5 bg-muted/20 border border-border/60">
                <div className="font-mono text-[10px] text-muted-foreground uppercase">Reading Time</div>
                <div className="font-mono text-xl font-bold text-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="size-4 text-primary shrink-0" />
                  <span>~{stats.readingMinutes}m</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">at 200 wpm</div>
              </div>

              <div className="p-2.5 bg-muted/20 border border-border/60">
                <div className="font-mono text-[10px] text-muted-foreground uppercase">Speaking Time</div>
                <div className="font-mono text-xl font-bold text-foreground mt-0.5 flex items-center gap-1">
                  <Mic className="size-4 text-primary shrink-0" />
                  <span>~{stats.speakingMinutes}m</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">at 130 wpm</div>
              </div>
            </div>

            {/* Readability Score Bar & Visual Gauge */}
            <div className="mt-3 p-3 bg-muted/20 border border-border/60 flex flex-col gap-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground">
                    <GraduationCap className="size-4 text-primary" />
                    <span>Flesch Reading Ease: {stats.fleschScore} / 100</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Classification: <span className="text-foreground font-medium">{stats.readingLevel}</span>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-xs self-start sm:self-auto rounded-none">
                  {stats.lexicalDiversity}% Lexical Variety
                </Badge>
              </div>

              {/* Visual Scale Meter */}
              <div className="space-y-1">
                <div className="h-2 w-full bg-muted flex rounded-none overflow-hidden">
                  <div className="w-[30%] bg-rose-500/80" title="Academic (<30)" />
                  <div className="w-[20%] bg-amber-500/80" title="College (30-50)" />
                  <div className="w-[10%] bg-blue-500/80" title="High School (50-60)" />
                  <div className="w-[20%] bg-emerald-500/80" title="Standard (60-80)" />
                  <div className="w-[20%] bg-teal-400" title="Conversational (80-100)" />
                </div>
                <div className="relative w-full h-2">
                  <div
                    style={{ left: `${Math.min(100, Math.max(0, stats.fleschScore))}%` }}
                    className="absolute -top-1 size-3 bg-foreground border border-background shadow-xs -translate-x-1/2 rotate-45"
                    title={`Current Score: ${stats.fleschScore}`}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-muted-foreground/60 pt-0.5">
                  <span>Academic</span>
                  <span>College</span>
                  <span>High School</span>
                  <span>Standard</span>
                  <span>Conversational</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Global Knowledge Base Stats */}
          <div>
            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-foreground mb-2.5">
              <BookOpen className="size-3.5 text-primary" />
              <span>Global Knowledge Base</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="p-2 bg-muted/20 border border-border/60">
                <div className="font-mono text-lg font-bold text-foreground">{vaultStats.totalNotes}</div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase">Total Notes</div>
              </div>
              <div className="p-2 bg-muted/20 border border-border/60">
                <div className="font-mono text-lg font-bold text-foreground">{vaultStats.totalWords}</div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase">Total Words</div>
              </div>
              <div className="p-2 bg-muted/20 border border-border/60">
                <div className="font-mono text-lg font-bold text-foreground">{vaultStats.totalLinks}</div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase">Wiki-Links</div>
              </div>
              <div className="p-2 bg-muted/20 border border-border/60">
                <div className="font-mono text-lg font-bold text-foreground">{vaultStats.totalTags}</div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase">Unique Tags</div>
              </div>
            </div>

            {/* Top Tags Breakdown */}
            {topTags.length > 0 && (
              <div className="mt-3 p-3 bg-muted/20 border border-border/60">
                <div className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Tag className="size-3 text-primary" />
                  <span>Top Knowledge Domains</span>
                </div>
                <div className="space-y-1.5">
                  {topTags.map((t) => {
                    const pct = Math.round((t.count / Math.max(notes.length, 1)) * 100);
                    return (
                      <div key={t.tag} className="flex items-center gap-2 text-xs font-mono">
                        <span className="w-24 truncate text-foreground font-medium">#{t.tag}</span>
                        <div className="flex-1 h-2 bg-muted/60 overflow-hidden">
                          <div style={{ width: `${pct}%` }} className="h-full bg-primary" />
                        </div>
                        <span className="text-muted-foreground text-[10px] w-14 text-right">
                          {t.count} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
