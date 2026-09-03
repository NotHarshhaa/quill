"use client";

import React, { useState, useEffect, useRef } from "react";
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
  CheckCircle2,
} from "lucide-react";
import { soundscapes, SoundscapeType } from "@/lib/audio/soundscapes";
import { Corners } from "@/components/frame";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AmbientSoundPlayerProps {
  onSessionComplete?: (sessionsToday: number) => void;
}

export function AmbientSoundPlayer({ onSessionComplete }: AmbientSoundPlayerProps) {
  // Audio state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedSound, setSelectedSound] = useState<SoundscapeType>("rain");
  const [volume, setVolume] = useState(0.35);

  // Pomodoro timer state
  const [timerMode, setTimerMode] = useState<"focus" | "shortBreak" | "longBreak">("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const timerIntervalRef = useRef<number | null>(null);

  const soundOptions: { type: SoundscapeType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { type: "rain", label: "Gentle Rain", icon: CloudRain },
    { type: "vinyl", label: "Warm Vinyl", icon: Disc },
    { type: "clock", label: "Clock Tick", icon: Clock },
    { type: "waves", label: "Ocean Waves", icon: Waves },
    { type: "wind", label: "Night Wind", icon: Wind },
  ];

  // Sound toggle
  const handleToggleSound = (type?: SoundscapeType) => {
    const targetType = type || selectedSound;
    if (isPlayingAudio && targetType === selectedSound) {
      soundscapes.stop();
      setIsPlayingAudio(false);
    } else {
      setSelectedSound(targetType);
      soundscapes.setVolume(volume);
      soundscapes.play(targetType);
      setIsPlayingAudio(true);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    soundscapes.setVolume(newVol);
  };

  // Pomodoro controls
  const setMode = (mode: "focus" | "shortBreak" | "longBreak") => {
    setTimerMode(mode);
    setIsTimerRunning(false);
    if (mode === "focus") setTimeLeft(25 * 60);
    else if (mode === "shortBreak") setTimeLeft(5 * 60);
    else setTimeLeft(15 * 60);
  };

  const toggleTimer = () => {
    setIsTimerRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    if (timerMode === "focus") setTimeLeft(25 * 60);
    else if (timerMode === "shortBreak") setTimeLeft(5 * 60);
    else setTimeLeft(15 * 60);
  };

  // Countdown timer effect
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer expired!
            clearInterval(timerIntervalRef.current!);
            setIsTimerRunning(false);
            soundscapes.playChime();

            if (timerMode === "focus") {
              const newCount = completedSessions + 1;
              setCompletedSessions(newCount);
              onSessionComplete?.(newCount);
              toast.success("🎯 Focus session completed! Take a well-deserved break.");
              setMode("shortBreak");
            } else {
              toast.info("☕ Break finished! Ready to focus again?");
              setMode("focus");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timerMode, completedSessions, onSessionComplete]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      soundscapes.stop();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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
            {completedSessions} {completedSessions === 1 ? "session" : "sessions"}
          </span>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-3 gap-1 bg-muted/50 p-0.5 border border-border/60 mb-3">
          <button
            type="button"
            onClick={() => setMode("focus")}
            className={`py-1 text-[11px] font-sans transition-colors ${
              timerMode === "focus"
                ? "bg-card text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            25m Focus
          </button>
          <button
            type="button"
            onClick={() => setMode("shortBreak")}
            className={`py-1 text-[11px] font-sans transition-colors ${
              timerMode === "shortBreak"
                ? "bg-card text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            5m Break
          </button>
          <button
            type="button"
            onClick={() => setMode("longBreak")}
            className={`py-1 text-[11px] font-sans transition-colors ${
              timerMode === "longBreak"
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
            {formatTime(timeLeft)}
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="xs"
              variant={isTimerRunning ? "secondary" : "default"}
              onClick={toggleTimer}
              className="h-7 px-3 rounded-none font-sans text-xs gap-1.5"
            >
              {isTimerRunning ? <Pause className="size-3" /> : <Play className="size-3" />}
              <span>{isTimerRunning ? "Pause" : "Start"}</span>
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={resetTimer}
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
            {isPlayingAudio ? "Playing" : "Offline"}
          </span>
        </div>

        {/* Sound Selection Grid */}
        <div className="grid grid-cols-2 gap-1 mb-2.5">
          {soundOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedSound === opt.type && isPlayingAudio;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => handleToggleSound(opt.type)}
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
            onClick={() => handleToggleSound()}
            className="text-muted-foreground hover:text-foreground"
            title={isPlayingAudio ? "Mute" : "Play"}
          >
            {isPlayingAudio ? <Volume2 className="size-3.5 text-primary" /> : <VolumeX className="size-3.5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-muted accent-primary cursor-pointer"
          />
          <span className="font-mono text-[10px] text-muted-foreground w-7 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
