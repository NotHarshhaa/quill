import { pipeline, env } from "@huggingface/transformers";

// Ensure models are fetched from Hugging Face Hub and cached in browser Cache API
env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL_ID = "HuggingFaceTB/SmolLM2-135M-Instruct";

let generator: any = null;
let currentDevice: "webgpu" | "wasm" = "webgpu";

async function getGenerator() {
  if (generator) return generator;

  const hasWebGPU = typeof navigator !== "undefined" && !!(navigator as any).gpu;
  currentDevice = hasWebGPU ? "webgpu" : "wasm";

  self.postMessage({
    type: "status",
    data: {
      status: "loading",
      message: `Initializing on ${currentDevice.toUpperCase()}...`,
      modelName: MODEL_ID
    }
  });

  try {
    generator = await pipeline("text-generation", MODEL_ID, {
      device: currentDevice,
      dtype: "q4",
      progress_callback: (progress: any) => {
        self.postMessage({
          type: "progress",
          data: progress
        });
      }
    });
  } catch (err: any) {
    // If WebGPU failed (e.g. unsupported adapter in WebView), fallback to WASM
    if (currentDevice === "webgpu") {
      console.warn("WebGPU initialization failed, falling back to WASM:", err);
      currentDevice = "wasm";
      self.postMessage({
        type: "status",
        data: {
          status: "loading",
          message: "WebGPU unavailable. Falling back to CPU/WASM...",
          modelName: MODEL_ID
        }
      });
      generator = await pipeline("text-generation", MODEL_ID, {
        device: "wasm",
        dtype: "q4",
        progress_callback: (progress: any) => {
          self.postMessage({
            type: "progress",
            data: progress
          });
        }
      });
    } else {
      throw err;
    }
  }

  self.postMessage({
    type: "status",
    data: {
      status: "ready",
      message: `Model ready (${currentDevice.toUpperCase()})`,
      modelName: MODEL_ID
    }
  });

  return generator;
}

self.addEventListener("message", async (e: MessageEvent) => {
  const { id, type, prompt, maxNewTokens = 128 } = e.data;

  if (type === "preload") {
    try {
      await getGenerator();
      self.postMessage({ id, type: "preload_done", success: true, device: currentDevice });
    } catch (err: any) {
      self.postMessage({ id, type: "preload_done", success: false, error: err?.message || String(err) });
    }
    return;
  }

  if (type === "generate") {
    try {
      const gen = await getGenerator();

      const messages = [
        {
          role: "system",
          content: "You are a concise offline writing assistant for Quill note-taking app. Always output clean Markdown directly without conversational filler."
        },
        { role: "user", content: prompt }
      ];

      const output = await gen(messages, {
        max_new_tokens: maxNewTokens,
        temperature: 0.3,
        do_sample: false
      });

      let generatedText = "";
      if (Array.isArray(output) && output[0]?.generated_text) {
        const last = output[0].generated_text[output[0].generated_text.length - 1];
        generatedText = last?.content || "";
      } else {
        generatedText = String(output);
      }

      self.postMessage({
        id,
        type: "generate_done",
        result: generatedText.trim(),
        device: currentDevice
      });
    } catch (err: any) {
      self.postMessage({
        id,
        type: "generate_done",
        error: err?.message || String(err)
      });
    }
  }
});
