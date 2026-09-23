import { useSyncExternalStore } from "react";
import { soundscapes, SoundscapeType } from "./soundscapes";
import { toast } from "sonner";

export type TimerMode = "focus" | "shortBreak" | "longBreak";

export interface FocusSessionState {
  isPlayingAudio: boolean;
  selectedSound: SoundscapeType;
  volume: number;
  timerMode: TimerMode;
  timeLeft: number;
  isTimerRunning: boolean;
  completedSessions: number;
}

const MODE_DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

// Module-level state shared by every AmbientSoundPlayer instance (header, sidebar
// rail, sidebar footer all render one). Keeps the Pomodoro timer and soundscape
// alive when their dropdown menus unmount.
let state: FocusSessionState = {
  isPlayingAudio: false,
  selectedSound: "rain",
  volume: 0.35,
  timerMode: "focus",
  timeLeft: MODE_DURATIONS.focus,
  isTimerRunning: false,
  completedSessions: 0,
};

const listeners = new Set<() => void>();
let tickInterval: number | null = null;

function setState(partial: Partial<FocusSessionState>) {
  state = { ...state, ...partial };
  listeners.forEach((listener) => listener());
}

function clearTick() {
  if (tickInterval !== null) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

function startTick() {
  clearTick();
  tickInterval = window.setInterval(() => {
    if (state.timeLeft <= 1) {
      completeSession();
    } else {
      setState({ timeLeft: state.timeLeft - 1 });
    }
  }, 1000);
}

function completeSession() {
  clearTick();
  soundscapes.playChime();

  if (state.timerMode === "focus") {
    setState({
      isTimerRunning: false,
      completedSessions: state.completedSessions + 1,
      timerMode: "shortBreak",
      timeLeft: MODE_DURATIONS.shortBreak,
    });
    toast.success("🎯 Focus session completed! Take a well-deserved break.");
  } else {
    setState({
      isTimerRunning: false,
      timerMode: "focus",
      timeLeft: MODE_DURATIONS.focus,
    });
    toast.info("☕ Break finished! Ready to focus again?");
  }
}

export const focusSession = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot(): FocusSessionState {
    return state;
  },

  toggleSound(type?: SoundscapeType) {
    const targetType = type || state.selectedSound;
    if (state.isPlayingAudio && targetType === state.selectedSound) {
      soundscapes.stop();
      setState({ isPlayingAudio: false });
    } else {
      soundscapes.play(targetType);
      // Apply volume after play() so the gain node exists on first use
      soundscapes.setVolume(state.volume);
      setState({ selectedSound: targetType, isPlayingAudio: true });
    }
  },

  setVolume(volume: number) {
    soundscapes.setVolume(volume);
    setState({ volume });
  },

  setMode(mode: TimerMode) {
    clearTick();
    setState({ timerMode: mode, isTimerRunning: false, timeLeft: MODE_DURATIONS[mode] });
  },

  toggleTimer() {
    const next = !state.isTimerRunning;
    setState({ isTimerRunning: next });
    if (next) {
      startTick();
    } else {
      clearTick();
    }
  },

  resetTimer() {
    clearTick();
    setState({ isTimerRunning: false, timeLeft: MODE_DURATIONS[state.timerMode] });
  },
};

function getServerSnapshot(): FocusSessionState {
  return state;
}

export function useFocusSession(): FocusSessionState {
  return useSyncExternalStore(focusSession.subscribe, focusSession.getSnapshot, getServerSnapshot);
}
