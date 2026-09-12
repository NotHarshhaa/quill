"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Corners } from "@/components/frame";
import { aiEngine } from "@/lib/ai/aiEngine";
import { AIModelProgress, AIProvider } from "@/lib/ai/types";
import { Cpu, Zap, DownloadCloud, CheckCircle2, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface AIStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIStatusModal({ open, onOpenChange }: AIStatusModalProps) {
  const [gpuInfo, setGpuInfo] = useState<{ supported: boolean; adapterName?: string }>({
    supported: false,
  });
  const [hasWindowAI, setHasWindowAI] = useState(false);
  const [provider, setProvider] = useState<AIProvider>("webgpu");
  const [progress, setProgress] = useState<AIModelProgress>({
    status: "idle",
  });
  const [isPreloading, setIsPreloading] = useState(false);

  useEffect(() => {
    if (!open) return;

    aiEngine.checkWebGPUSupport().then(setGpuInfo);
    aiEngine.checkWindowAISupport().then(setHasWindowAI);
    setProvider(aiEngine.getPreferredProvider());

    const unsubscribe = aiEngine.subscribe(setProgress);
    return () => unsubscribe();
  }, [open]);

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    aiEngine.setPreferredProvider(newProvider);
    toast.success(`Active AI provider set to ${newProvider.toUpperCase()}`);
  };

  const handlePreload = async () => {
    try {
      setIsPreloading(true);
      toast.info("Starting model download into browser cache...");
      await aiEngine.preloadModel();
      toast.success("Model cached offline in browser!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to cache model");
    } finally {
      setIsPreloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-[360px] sm:max-w-md max-h-[88vh] overflow-y-auto bg-card border-border/80 shadow-2xl p-4 sm:p-6 rounded-none font-sans">
        <Corners size="default" weight="normal" />

        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="size-5" />
            <DialogTitle className="text-base font-bold font-sans tracking-tight">
              Offline AI Engine (WebGPU)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Zero API keys, zero cloud servers, zero telemetry. Runs 100% locally on your device hardware.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Hardware Acceleration Status */}
          <div className="p-3 border border-border/70 bg-muted/20 relative">
            <Corners size="sm" weight="thin" light />
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Cpu className="size-4 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-foreground">
                    Hardware Backend
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {gpuInfo.supported
                    ? `WebGPU Active • ${gpuInfo.adapterName || "GPU Accelerated"}`
                    : "WebGPU unavailable • CPU/WASM Fallback Active"}
                </p>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 border ${
                  gpuInfo.supported
                    ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/10"
                    : "border-amber-500/40 text-amber-500 bg-amber-500/10"
                }`}
              >
                {gpuInfo.supported ? "HARDWARE GPU" : "CPU WASM"}
              </span>
            </div>
          </div>

          {/* Model Cache State & Preload */}
          <div className="p-3 border border-border/70 bg-card/60 relative space-y-2.5">
            <Corners size="sm" weight="thin" light />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-foreground">
                  Model: SmolLM2-135M-Instruct
                </span>
                <p className="text-[11px] text-muted-foreground">
                  ~85 MB quantized ONNX • Cached in browser storage
                </p>
              </div>
              {progress.status === "ready" ? (
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-500">
                  <CheckCircle2 className="size-3.5" />
                  Ready
                </span>
              ) : null}
            </div>

            {/* Download Progress Bar */}
            {progress.status === "downloading" && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                  <span>{progress.message || "Downloading..."}</span>
                  <span>{progress.progress || 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted/60 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{ width: `${progress.progress || 0}%` }}
                  />
                </div>
              </div>
            )}

            <Button
              size="sm"
              variant="outline"
              disabled={isPreloading || progress.status === "downloading"}
              onClick={handlePreload}
              className="w-full text-xs font-mono gap-1.5 rounded-none border-border/80"
            >
              <DownloadCloud className="size-3.5" />
              {progress.status === "ready"
                ? "Re-verify Cached Model"
                : isPreloading
                ? "Caching Model..."
                : "Pre-load Model Offline (85 MB)"}
            </Button>
          </div>

          {/* Engine Selection */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-foreground">
              Inference Mode
            </span>
            <div className="grid grid-cols-1 gap-1.5 text-xs font-mono">
              <label
                onClick={() => handleProviderChange("webgpu")}
                className={`p-2.5 border cursor-pointer flex items-center justify-between transition-colors ${
                  provider === "webgpu"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border/60 hover:bg-muted/30 text-muted-foreground"
                }`}
              >
                <div>
                  <div className="font-semibold text-foreground">
                    WebGPU Local Model (SmolLM2)
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Deep generative reasoning, 100% in browser
                  </div>
                </div>
                <input
                  type="radio"
                  name="provider"
                  checked={provider === "webgpu"}
                  onChange={() => handleProviderChange("webgpu")}
                  className="accent-primary"
                />
              </label>

              {hasWindowAI && (
                <label
                  onClick={() => handleProviderChange("window_ai")}
                  className={`p-2.5 border cursor-pointer flex items-center justify-between transition-colors ${
                    provider === "window_ai"
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border/60 hover:bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-foreground">
                      Browser Gemini Nano (window.ai)
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Built-in OS model, 0 MB download
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="provider"
                    checked={provider === "window_ai"}
                    onChange={() => handleProviderChange("window_ai")}
                    className="accent-primary"
                  />
                </label>
              )}

              <label
                onClick={() => handleProviderChange("heuristic")}
                className={`p-2.5 border cursor-pointer flex items-center justify-between transition-colors ${
                  provider === "heuristic"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border/60 hover:bg-muted/30 text-muted-foreground"
                }`}
              >
                <div>
                  <div className="font-semibold text-foreground">
                    Instant Heuristic Engine
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Instant (&lt;5ms), 0 MB download, zero battery impact
                  </div>
                </div>
                <input
                  type="radio"
                  name="provider"
                  checked={provider === "heuristic"}
                  onChange={() => handleProviderChange("heuristic")}
                  className="accent-primary"
                />
              </label>
            </div>
          </div>

          {/* Privacy Guarantee Pill */}
          <div className="flex items-center gap-2 pt-2 text-[11px] text-muted-foreground/80 border-t border-border/50">
            <Shield className="size-3.5 text-emerald-500 shrink-0" />
            <span>
              Your notes never leave your device. All calculations occur on your local hardware.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
