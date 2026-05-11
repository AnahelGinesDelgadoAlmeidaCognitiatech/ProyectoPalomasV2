import { pipeline, env } from "@huggingface/transformers";

// Use IndexedDB cache, never load from local filesystem
env.allowLocalModels = false;
env.useBrowserCache = true;

let asr: any = null;

self.addEventListener("message", async (event: MessageEvent) => {
  const { type, audio } = event.data as { type: string; audio?: Float32Array };

  if (type === "load") {
    try {
      postMessage({ type: "status", value: "loading" });
      
      const isWebGPUAvailable = !!navigator.gpu;
      const device = isWebGPUAvailable ? "webgpu" : "wasm";
      const dtype = isWebGPUAvailable ? "fp32" : "q8";

      asr = await pipeline(
        "automatic-speech-recognition",
        "onnx-community/whisper-tiny",
        { 
          dtype,
          device,
          progress_callback: (progress: any) => {
            if (progress.status === "progress") {
              postMessage({ type: "loading-progress", value: progress.progress });
            }
          }
        }
      );
      postMessage({ type: "status", value: "ready" });
    } catch (err: any) {
      postMessage({ type: "error", message: err?.message ?? String(err) });
    }
    return;
  }

  if (type === "transcribe") {
    if (!asr) {
      postMessage({ type: "error", message: "Model not loaded" });
      return;
    }
    try {
      postMessage({ type: "status", value: "transcribing" });
      const result = await asr(audio, {
        language: "es",
        task: "transcribe",
      });
      const text: string = Array.isArray(result)
        ? (result[0]?.text ?? "")
        : (result?.text ?? "");
      postMessage({ type: "transcript", text: text.trim() });
    } catch (err: any) {
      postMessage({ type: "error", message: err?.message ?? String(err) });
    }
  }
});
