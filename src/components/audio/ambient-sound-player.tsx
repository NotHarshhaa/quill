"use client";

import React from "react";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  CloudRain,
  Disc,
  Clock,
  Waves,
  Wind,
  Timer,
} from "lucide-react";
import { SoundscapeType } from "@/lib/audio/soundscapes";
import { useFocusSession, focusSession } from "@/lib/audio/focusSession";
import { Corners } from "@/components/frame";
import { Button } from "@/components/ui/button";

const soundOptions: { type: SoundscapeType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: "rain", label: "Gentle Rain", icon: CloudRain },
  { type: "vinyl", label: "Warm Vinyl", icon: Disc },
  { type: "clock", label: "Clock Tick", icon: Clock },
  { type: "waves", label: "Ocean Waves", icon: Waves },
  { type: "wind", label: "Night Wind", icon: Wind },
];

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export function AmbientSoundPlayer() {
  // State lives in a shared store so the timer & audio survive dropdown
  // close/unmount and stay in sync across every player instance
  const session = useFocusSession();

  return (
    <div className="w-80 p-3 font-sans select-none text-xs bg-card/95 text-foreground relative">
      <Corners size="sm" offset="border" weight="thin" light />

      {/* Tab Header: Pomodoro Timer */}
      <div className="mb-3">
        <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1.5 font-semibold text-foreground">
            <Timer className="size-3 text-primary" /> Pomodoro Timer
          </span>
          <span className="text-primary font-semibold">
            {session.completedSessions} {session.completedSessions === 1 ? "session" : "sessions"}
          </span>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-3 gap-1 bg-muted/50 p-0.5 border border-border/60 mb-3">
          <button
            type="button"
            onClick={() => focusSession.setMode("focus")}
            className={`py-1 text-[11px] font-sans transition-colors ${
              session.timerMode === "focus"
                ? "bg-card text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            25m Focus
          </button>
          <button
            type="button"
            onClick={() => focusSession.setMode("shortBreak")}
            className={`py-1 text-[11px] font-sans transition-colors ${
              session.timerMode === "shortBreak"
                ? "bg-card text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            5m Break
          </button>
          <button
            type="button"
            onClick={() => focusSession.setMode("longBreak")}
            className={`py-1 text-[11px] font-sans transition-colors ${
              session.timerMode === "longBreak"
                ? "bg-card text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            15m Break
          </button>
        </div>

        {/* Big Time Display & Controls */}
        <div className="flex items-center justify-between bg-muted/20 border border-border/60 p-2.5">
          <div className="font-mono text-2xl font-bold tracking-tight text-foreground">
            {formatTime(session.timeLeft)}
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="xs"
              variant={session.isTimerRunning ? "secondary" : "default"}
              onClick={focusSession.toggleTimer}
              className="h-7 px-3 rounded-none font-sans text-xs gap-1.5"
            >
              {session.isTimerRunning ? <Pause className="size-3" /> : <Play className="size-3" />}
              <span>{session.isTimerRunning ? "Pause" : "Start"}</span>
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={focusSession.resetTimer}
              className="h-7 w-7 rounded-none text-muted-foreground hover:text-foreground"
              title="Reset Timer"
            >
              <RotateCcw className="size-3" />
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 my-2.5" />

      {/* Section 2: Ambient Soundscapes */}
      <div>
        <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1.5 font-semibold text-foreground">
            <Volume2 className="size-3 text-primary" /> Ambient Soundscapes
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {session.isPlayingAudio ? "Playing" : "Offline"}
          </span>
        </div>

        {/* Sound Selection Grid */}
        <div className="grid grid-cols-2 gap-1 mb-2.5">
          {soundOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = session.selectedSound === opt.type && session.isPlayingAudio;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => focusSession.toggleSound(opt.type)}
                className={`flex items-center gap-2 p-1.5 text-left text-xs border transition-all rounded-none ${
                  isSelected
                    ? "bg-primary/10 border-primary text-primary font-semibold"
                    : "bg-card/60 border-border/70 text-foreground hover:border-foreground/40"
                }`}
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Volume & Master Toggle */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => focusSession.toggleSound()}
            className="text-muted-foreground hover:text-foreground"
            title={session.isPlayingAudio ? "Mute" : "Play"}
          >
            {session.isPlayingAudio ? <Volume2 className="size-3.5 text-primary" /> : <VolumeX className="size-3.5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={session.volume}
            onChange={(e) => focusSession.setVolume(parseFloat(e.target.value))}
            className="w-full h-1 bg-muted accent-primary cursor-pointer"
          />
          <span className="font-mono text-[10px] text-muted-foreground w-7 text-right">
            {Math.round(session.volume * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
