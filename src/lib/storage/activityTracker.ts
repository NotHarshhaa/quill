/**
 * Writing Activity Tracker for Quill
 * Tracks daily writing contributions and word count changes locally
 * to generate a GitHub-style activity heatmap.
 */

const ACTIVITY_KEY = "quill_activity_log_v1";

export interface DayActivity {
  date: string; // YYYY-MM-DD
  wordsWritten: number;
  notesModified: number;
}

export const activityTracker = {
  getTodayDateString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  },

  getAllActivity(): Record<string, DayActivity> {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(ACTIVITY_KEY);
      if (!raw) {
        // Initialize with default historical days based on sample notes
        const initial = this.seedInitialActivity();
        this.saveAllActivity(initial);
        return initial;
      }
      return JSON.parse(raw) || {};
    } catch {
      return {};
    }
  },

  saveAllActivity(data: Record<string, DayActivity>): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save writing activity", e);
    }
  },

  seedInitialActivity(): Record<string, DayActivity> {
    const data: Record<string, DayActivity> = {};
    const now = new Date();

    // Generate simulated gentle activity for past 4 weeks
    for (let i = 28; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

      if (i % 3 === 0 || i === 0) {
        data[dateStr] = {
          date: dateStr,
          wordsWritten: Math.floor(120 + ((i * 37) % 380)),
          notesModified: Math.floor(1 + ((i * 7) % 3)),
        };
      }
    }
    return data;
  },

  logWords(wordsCount: number): void {
    if (typeof window === "undefined") return;
    const today = this.getTodayDateString();
    const all = this.getAllActivity();
    const current = all[today] || { date: today, wordsWritten: 0, notesModified: 0 };

    all[today] = {
      date: today,
      wordsWritten: Math.max(current.wordsWritten, wordsCount),
      notesModified: current.notesModified + 1,
    };

    this.saveAllActivity(all);
  },

  getHeatmapData(weeks = 24): DayActivity[] {
    const all = this.getAllActivity();
    const totalDays = weeks * 7;
    const list: DayActivity[] = [];
    const now = new Date();

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

      list.push(
        all[dateStr] || {
          date: dateStr,
          wordsWritten: 0,
          notesModified: 0,
        }
      );
    }

    return list;
  },
};
