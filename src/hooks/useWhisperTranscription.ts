import { useCallback, useEffect, useRef, useState } from "react";

export type WhisperStatus = "idle" | "loading" | "ready" | "transcribing" | "error";

/** Decodes any audio Blob/File to a 16 kHz mono Float32Array in the main thread
 *  (AudioContext is not available inside Web Workers). */
async function decodeAudioTo16kHz(blob: Blob): Promise<Float32Array> {
  const TARGET_SR = 16_000;
  const arrayBuffer = await blob.arrayBuffer();

  // Try to create AudioContext at target sample rate; fall back to default
  let ctx: AudioContext;
  try {
    ctx = new AudioContext({ sampleRate: TARGET_SR });
  } catch {
    ctx = new AudioContext();
  }

  try {
    const decoded = await ctx.decodeAudioData(arrayBuffer);

    // Already at 16 kHz → return channel data directly
    if (decoded.sampleRate === TARGET_SR) {
      return decoded.getChannelData(0);
    }

    // Resample with OfflineAudioContext
    const numFrames = Math.round(decoded.duration * TARGET_SR);
    const offline = new OfflineAudioContext(1, numFrames, TARGET_SR);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start(0);
    const resampled = await offline.startRendering();
    return resampled.getChannelData(0);
  } finally {
    await ctx.close();
  }
}

export function useWhisperTranscription() {
  const [status, setStatus] = useState<WhisperStatus>("idle");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const resolveRef = useRef<((text: string) => void) | null>(null);
  const rejectRef  = useRef<((err: Error) => void) | null>(null);

  // Boot the worker and start pre-loading the model on mount
  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/whisper.worker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (e: MessageEvent) => {
      const { type, value, text, message } = e.data as {
        type: string;
        value?: any;
        text?: string;
        message?: string;
      };

      if (type === "status" && value) {
        setStatus(value as WhisperStatus);
        if (value !== "error") setError(null);
      }

      if (type === "loading-progress") {
        setLoadingProgress(value);
      }

      if (type === "transcript") {
        setTranscript(text ?? "");
        setStatus("ready");
        resolveRef.current?.(text ?? "");
        resolveRef.current = null;
        rejectRef.current  = null;
      }

      if (type === "error") {
        setError(message ?? "Unknown error");
        setStatus("error");
        rejectRef.current?.(new Error(message ?? "Unknown error"));
        resolveRef.current = null;
        rejectRef.current  = null;
      }
    };

    workerRef.current = worker;

    // Pre-load the model in background
    worker.postMessage({ type: "load" });

    return () => worker.terminate();
  }, []);

  /** Transcribes a File or Blob and returns the Spanish text. */
  const transcribe = useCallback(async (audio: File | Blob): Promise<string> => {
    if (!workerRef.current) throw new Error("Worker not initialised");

    let float32: Float32Array;
    try {
      float32 = await decodeAudioTo16kHz(audio);
    } catch (err: any) {
      const msg = err?.message ?? "Audio decode failed";
      setError(msg);
      setStatus("error");
      throw new Error(msg);
    }

    return new Promise<string>((resolve, reject) => {
      resolveRef.current = resolve;
      rejectRef.current  = reject;
      // Transfer the buffer so it doesn't need to be copied
      workerRef.current!.postMessage(
        { type: "transcribe", audio: float32 },
        [float32.buffer]
      );
    });
  }, []);

  return {
    status,
    loading:      status === "loading",
    loadingProgress,
    transcribing: status === "transcribing",
    ready:        status === "ready",
    error,
    transcript,
    transcribe,
  };
}
