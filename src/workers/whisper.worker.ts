import { pipeline, env } from "@huggingface/transformers";

// ── Cache settings ──────────────────────────────────────────────────────────
// Never load from local FS; use IndexedDB so the model survives page reloads
env.allowLocalModels = false;
env.useBrowserCache = true;

// ── State ────────────────────────────────────────────────────────────────────
let asr: Awaited<ReturnType<typeof pipeline>> | null = null;
let loadPromise: Promise<void> | null = null;

// ── Helpers ──────────────────────────────────────────────────────────────────
function post(msg: Record<string, unknown>) {
  self.postMessage(msg);
}

/** Detect the best available backend for this device */
async function detectBackend(): Promise<{ device: "webgpu" | "wasm"; dtype: "fp32" | "q8" }> {
  try {
    if (typeof navigator !== "undefined" && "gpu" in navigator) {
      const adapter = await (navigator as any).gpu?.requestAdapter();
      if (adapter) {
        return { device: "webgpu", dtype: "fp32" };
      }
    }
  } catch (e) {
    console.error("WebGPU detection failed:", e);
  }
  return { device: "wasm", dtype: "q8" };
}

// ── Load ─────────────────────────────────────────────────────────────────────
async function loadModel() {
  if (asr) {
    post({ type: "status", value: "ready" });
    return;
  }
  if (loadPromise) {
    await loadPromise;
    return;
  }

  loadPromise = (async () => {
    post({ type: "status", value: "loading" });

    const { device, dtype } = await detectBackend();
    post({ type: "backend", device, dtype });

    // Back to whisper-tiny for maximum speed on all platforms
    const modelName = "onnx-community/whisper-tiny";

    post({ type: "model", value: modelName });

    asr = await pipeline(
      "automatic-speech-recognition",
      modelName,
      {
        dtype,
        device,
        progress_callback: (progress: any) => {
          if (progress?.status === "progress" && typeof progress.progress === "number") {
            post({ type: "loading-progress", value: Math.round(progress.progress) });
          }
          if (progress?.status === "done") {
            post({ type: "loading-progress", value: 100 });
          }
        },
      }
    );

    post({ type: "status", value: "ready" });
  })().catch((err: unknown) => {
    asr = null;
    loadPromise = null;
    post({ type: "error", message: (err as Error)?.message ?? String(err) });
  });

  await loadPromise;
}

// ── Transcribe ────────────────────────────────────────────────────────────────
async function transcribeAudio(audio: Float32Array, language = "es") {
  if (!asr) {
    if (loadPromise) await loadPromise;
    else await loadModel();
  }

  if (!asr) {
    post({ type: "error", message: "Transcription engine unavailable. Please refresh and try again." });
    return;
  }

  post({ type: "status", value: "transcribing" });

  try {
    const result = await (asr as any)(audio, {
      language,
      task: "transcribe",
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: false,
      // Prompt de contexto para guiar al modelo tiny en temas de palomas
      prompt: "Identificación de palomas mensajeras, números de anilla, nombres, colores y años de nacimiento.",
    });

    let text: string = Array.isArray(result)
      ? (result[0]?.text ?? "")
      : (result?.text ?? "");

    text = text.trim();

    post({ type: "transcript", text });
    post({ type: "status", value: "ready" });
  } catch (err: unknown) {
    post({ type: "error", message: (err as Error)?.message ?? String(err) });
  }
}

// ── Message router ────────────────────────────────────────────────────────────
self.addEventListener("message", async (event: MessageEvent) => {
  const { type, audio, language } = event.data as {
    type: string;
    audio?: Float32Array;
    language?: string;
  };

  if (type === "load") {
    await loadModel();
    return;
  }

  if (type === "transcribe") {
    if (!audio) {
      post({ type: "error", message: "No audio data provided." });
      return;
    }
    if (!asr) await loadModel();
    await transcribeAudio(audio, language ?? "es");
    return;
  }

  if (type === "reset") {
    asr = null;
    loadPromise = null;
    post({ type: "status", value: "idle" });
    return;
  }
});