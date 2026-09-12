export type AIProvider = "webgpu" | "window_ai" | "heuristic";

export type AIAction = "summarize" | "action_items" | "polish" | "tags";

export interface AIModelProgress {
  status: "idle" | "downloading" | "loading" | "ready" | "generating" | "error";
  modelName?: string;
  file?: string;
  progress?: number; // 0 to 100
  loaded?: number;
  total?: number;
  message?: string;
  error?: string;
}

export interface AIActionResult {
  action: AIAction;
  content: string;
  provider: AIProvider;
  durationMs: number;
}
