import {
  AIAction,
  AIActionResult,
  AIModelProgress,
  AIProvider
} from "./types";
import {
  heuristicSummarize,
  heuristicExtractActions,
  heuristicExtractTags,
  heuristicPolishMarkdown
} from "./heuristic";

type ProgressListener = (progress: AIModelProgress) => void;

class AIEngine {
  private worker: Worker | null = null;
  private workerReady = false;
  private pendingRequests = new Map<
    string,
    { resolve: (val: any) => void; reject: (err: any) => void }
  >();
  private listeners = new Set<ProgressListener>();
  private currentProgress: AIModelProgress = {
    status: "idle",
    message: "Ready"
  };
  private preferredProvider: AIProvider = "webgpu";

  constructor() {
    // Check preferred provider from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("quill_ai_preferred_provider") as AIProvider | null;
      if (saved && ["webgpu", "window_ai", "heuristic"].includes(saved)) {
        this.preferredProvider = saved;
      }
    }
  }

  public getPreferredProvider(): AIProvider {
    return this.preferredProvider;
  }

  public setPreferredProvider(provider: AIProvider) {
    this.preferredProvider = provider;
    if (typeof window !== "undefined") {
      localStorage.setItem("quill_ai_preferred_provider", provider);
    }
  }

  public subscribe(fn: ProgressListener): () => void {
    this.listeners.add(fn);
    fn(this.currentProgress);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify(progress: Partial<AIModelProgress>) {
    this.currentProgress = { ...this.currentProgress, ...progress };
    this.listeners.forEach(fn => fn(this.currentProgress));
  }

  public getStatus(): AIModelProgress {
    return this.currentProgress;
  }

  /**
   * Checks whether WebGPU hardware acceleration is available in current browser/device.
   */
  public async checkWebGPUSupport(): Promise<{ supported: boolean; adapterName?: string }> {
    if (typeof navigator === "undefined" || !(navigator as any).gpu) {
      return { supported: false };
    }
    try {
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (!adapter) return { supported: false };
      return { supported: true, adapterName: adapter.info?.description || "Generic WebGPU Device" };
    } catch {
      return { supported: false };
    }
  }

  /**
   * Checks whether Chromium window.ai (Gemini Nano) is built-in and available.
   */
  public async checkWindowAISupport(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    const ai = (window as any).ai;
    if (!ai?.languageModel) return false;
    try {
      const capabilities = await ai.languageModel.capabilities();
      return capabilities.available === "readily" || capabilities.available === "after-download";
    } catch {
      return false;
    }
  }

  /**
   * Initializes the WebGPU Web Worker on-demand.
   */
  private initWorker(): Promise<Worker> {
    if (this.worker) return Promise.resolve(this.worker);

    return new Promise((resolve, reject) => {
      try {
        // Construct worker with module syntax
        this.worker = new Worker(new URL("./ai.worker.ts", import.meta.url), {
          type: "module"
        });

        this.worker.onmessage = (e: MessageEvent) => {
          const { id, type, data, result, error, device } = e.data;

          if (type === "status") {
            this.notify(data);
          } else if (type === "progress") {
            // Transformers.js download progress payload
            if (data?.status === "progress" && data?.total) {
              const pct = Math.round((data.loaded / data.total) * 100);
              this.notify({
                status: "downloading",
                progress: pct,
                loaded: data.loaded,
                total: data.total,
                file: data.file,
                message: `Downloading model (${pct}%)...`
              });
            } else if (data?.status === "done") {
              this.notify({
                status: "ready",
                progress: 100,
                message: "Model cached offline"
              });
            }
          } else if (type === "preload_done" || type === "generate_done") {
            const req = this.pendingRequests.get(id);
            if (req) {
              this.pendingRequests.delete(id);
              if (error) {
                req.reject(new Error(error));
              } else {
                req.resolve({ result, device });
              }
            }
          }
        };

        this.worker.onerror = (err) => {
          console.error("AI Worker error:", err);
          this.notify({
            status: "error",
            error: "Worker initialization error"
          });
          reject(err);
        };

        this.workerReady = true;
        resolve(this.worker);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Pre-downloads and caches model in IndexedDB/Cache API so it is ready offline.
   */
  public async preloadModel(): Promise<void> {
    this.notify({ status: "downloading", progress: 0, message: "Preparing model download..." });
    const worker = await this.initWorker();
    const id = "preload_" + Date.now();

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, {
        resolve: () => {
          this.notify({ status: "ready", progress: 100, message: "Model cached offline" });
          resolve();
        },
        reject: (err) => {
          this.notify({ status: "error", error: err.message, message: "Download failed" });
          reject(err);
        }
      });
      worker.postMessage({ id, type: "preload" });
    });
  }

  /**
   * Execute an AI action on the provided markdown text.
   */
  public async execute(action: AIAction, markdown: string): Promise<AIActionResult> {
    const startTime = performance.now();

    // 1. If preferred is heuristic or text is very small, use heuristic immediately
    if (this.preferredProvider === "heuristic") {
      const content = this.runHeuristic(action, markdown);
      return {
        action,
        content,
        provider: "heuristic",
        durationMs: Math.round(performance.now() - startTime)
      };
    }

    // 2. Check window.ai (Gemini Nano)
    if (this.preferredProvider === "window_ai") {
      const windowAIAvailable = await this.checkWindowAISupport();
      if (windowAIAvailable) {
        try {
          const content = await this.runWindowAI(action, markdown);
          return {
            action,
            content,
            provider: "window_ai",
            durationMs: Math.round(performance.now() - startTime)
          };
        } catch (err) {
          console.warn("window.ai failed, falling back to heuristic:", err);
        }
      }
    }

    // 3. WebGPU / Local Model
    try {
      this.notify({ status: "generating", message: "Processing with WebGPU..." });
      const worker = await this.initWorker();
      const id = "gen_" + Date.now();

      const prompt = this.buildPrompt(action, markdown);

      const responsePromise = new Promise<{ result: string; device: string }>((resolve, reject) => {
        this.pendingRequests.set(id, { resolve, reject });
        worker.postMessage({
          id,
          type: "generate",
          prompt,
          maxNewTokens: action === "tags" ? 48 : 200
        });
      });

      // Timeout fallback after 25s if first download takes too long or device stalls
      const timeoutPromise = new Promise<{ result: string; device: string }>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 25000)
      );

      const { result, device } = await Promise.race([responsePromise, timeoutPromise]);
      this.notify({ status: "ready", message: `Completed on ${device.toUpperCase()}` });

      return {
        action,
        content: result,
        provider: "webgpu",
        durationMs: Math.round(performance.now() - startTime)
      };
    } catch (err: any) {
      console.warn("WebGPU generation failed or timed out, using heuristic fallback:", err);
      this.notify({
        status: "idle",
        message: "Applied instant offline fallback"
      });
      // Graceful fallback to heuristic engine
      const content = this.runHeuristic(action, markdown);
      return {
        action,
        content,
        provider: "heuristic",
        durationMs: Math.round(performance.now() - startTime)
      };
    }
  }

  private buildPrompt(action: AIAction, markdown: string): string {
    const trimmed = markdown.slice(0, 1500); // Keep within fast inference context window
    switch (action) {
      case "summarize":
        return `Summarize the following notes into 2 to 3 concise bullet points:\n\n${trimmed}`;
      case "action_items":
        return `Extract actionable tasks from this note into a markdown checklist using "- [ ] task" syntax:\n\n${trimmed}`;
      case "tags":
        return `List 3 to 5 relevant hashtags (e.g. #project #meeting) for this text:\n\n${trimmed}`;
      case "polish":
        return `Format and clean up this note into structured Markdown with clear headings and bullet points:\n\n${trimmed}`;
    }
  }

  private runHeuristic(action: AIAction, markdown: string): string {
    switch (action) {
      case "summarize":
        return heuristicSummarize(markdown);
      case "action_items":
        return heuristicExtractActions(markdown);
      case "tags":
        return heuristicExtractTags(markdown).join(" ");
      case "polish":
        return heuristicPolishMarkdown(markdown);
    }
  }

  private async runWindowAI(action: AIAction, markdown: string): Promise<string> {
    const ai = (window as any).ai;
    const session = await ai.languageModel.create({
      systemPrompt: "You are a concise assistant for a markdown notes app. Output markdown directly without preamble."
    });
    const prompt = this.buildPrompt(action, markdown);
    const result = await session.prompt(prompt);
    session.destroy?.();
    return result.trim();
  }
}

export const aiEngine = new AIEngine();
