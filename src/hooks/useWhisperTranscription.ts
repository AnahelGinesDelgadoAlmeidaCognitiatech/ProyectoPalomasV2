/**
 * useWhisperTranscription
 *
 * Motor de transcripción unificado con fallback automático:
 *
 *   1. Intenta Whisper-tiny vía WebGPU  (PC, Chrome Android experimental)
 *   2. Intenta Whisper-tiny vía WASM q8 (Android gama media/alta)
 *   3. Cae a Web Speech API nativa      (iOS Safari, dispositivos con poca RAM)
 *
 * El fallback a Web Speech ocurre automáticamente si el worker lanza
 * "Out of memory" u otro error irrecuperable.  El componente recibe
 * `engine: "whisper" | "webspeech"` para poder informar al usuario.
 *
 * Singleton: el worker se crea UNA vez por pestaña, independientemente
 * de cuántos componentes monten el hook.
 */

import { useCallback, useState, useSyncExternalStore, useRef, useEffect } from "react";

// ─── Tipos públicos ────────────────────────────────────────────────────────────
export type WhisperStatus = "idle" | "loading" | "ready" | "transcribing" | "error";
export type TranscriptionEngine = "whisper" | "webspeech" | "cloud" | "unknown";

export interface EngineInfo {
  id: TranscriptionEngine;
  name: string;
  reliability: number; // 1-5
  isOffline: boolean;
  isAvailable: boolean;
}

interface WorkerState {
  status: WhisperStatus;
  loadingProgress: number;
  error: string | null;
  backend: string | null;
  model: string | null;
  workerDead: boolean;
}

type Listener = () => void;

// ─── Detección de entorno ─────────────────────────────────────────────────────
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isWebSpeechAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition)
  );
}

// ─── Web Speech Engine ────────────────────────────────────────────────────────
class WebSpeechEngine {
  private rec: any = null;
  private stream: MediaStream | null = null;
  private finalText = "";
  private isRecording = false;
  private lang: string;

  constructor(lang: string) {
    this.lang = lang;
  }

  async start(onInterim?: (text: string) => void): Promise<void> {
    if (typeof window === "undefined") return;
    
    // Check for secure context - more robust check for tunnels/proxies
    const isSecure = window.isSecureContext || 
                     window.location.protocol === "https:" || 
                     window.location.hostname === "localhost" || 
                     window.location.hostname === "127.0.0.1";

    if (!isSecure) {
      throw new Error("El dictado requiere HTTPS (usa la URL https de ngrok).");
    }

    const Ctor: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) throw new Error("Tu navegador no soporta el dictado nativo. Prueba con Chrome.");

    // En Android, a veces SpeechRecognition ya gestiona el permiso. 
    // Solo pedimos el stream si no existe para asegurar que el navegador pida el permiso.
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e: any) {
      console.warn("UserMedia failed, trying SpeechRecognition anyway...", e);
    }

    this.finalText = "";
    this.isRecording = true;
    const rec = new Ctor();
    rec.lang = this.lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (ev: any) => {
      let interimT = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) {
          this.finalText += (this.finalText ? " " : "") + r[0].transcript.trim();
        } else {
          interimT += r[0].transcript;
        }
      }
      if (onInterim) onInterim(this.finalText + (interimT ? " " + interimT : ""));
    };

    rec.onerror = (ev: any) => {
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
        this.isRecording = false;
        // No lanzamos error aquí para no romper el flujo, pero lo logueamos
        console.error("Speech recognition permission denied:", ev.error);
      }
      if (ev.error !== "no-speech" && ev.error !== "aborted") {
        console.error("Speech recognition error:", ev.error);
      }
    };

    rec.onend = () => {
      if (this.isRecording && (this.stream?.active || !this.stream)) {
        try { rec.start(); } catch { }
      }
    };

    this.rec = rec;
    try {
      rec.start();
    } catch (e) {
      this.isRecording = false;
      throw new Error("No se pudo iniciar el reconocimiento de voz.");
    }
  }

  stop(): Promise<string> {
    this.isRecording = false;
    return new Promise((resolve) => {
      const finish = () => {
        this.stream?.getTracks().forEach((t) => t.stop());
        this.stream = null;
        resolve(this.finalText.trim());
        this.rec = null;
      };
      if (this.rec) {
        this.rec.onend = finish;
        try { this.rec.stop(); } catch { finish(); }
      } else {
        finish();
      }
    });
  }

  destroy() {
    this.isRecording = false;
    try { this.rec?.stop(); } catch { }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.rec = null;
  }
}

// ─── Whisper Worker Singleton ─────────────────────────────────────────────────
class WhisperWorkerSingleton {
  private static instance: WhisperWorkerSingleton | null = null;
  private worker: Worker | null = null;
  private listeners: Set<Listener> = new Set();
  private resolveRef: ((text: string) => void) | null = null;
  private rejectRef: ((err: Error) => void) | null = null;

  state: WorkerState = {
    status: "idle",
    loadingProgress: 0,
    error: null,
    backend: null,
    model: null,
    workerDead: false,
  };

  static getInstance(): WhisperWorkerSingleton {
    if (!WhisperWorkerSingleton.instance) {
      WhisperWorkerSingleton.instance = new WhisperWorkerSingleton();
    }
    return WhisperWorkerSingleton.instance;
  }

  private notify() { this.listeners.forEach((l) => l()); }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    this.ensureWorker();
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): WorkerState { return this.state; }

  private ensureWorker() {
    if (this.worker || this.state.workerDead) return;
    this.worker = new Worker(new URL("../workers/whisper.worker.ts", import.meta.url), { type: "module" });
    this.worker.onmessage = (e: MessageEvent) => {
      const { type, value, text, message, device, dtype } = e.data;
      if (type === "model") this.state = { ...this.state, model: value };
      if (type === "status") {
        this.state = { ...this.state, status: value as WhisperStatus };
        if (value !== "error") this.state = { ...this.state, error: null };
      }
      if (type === "loading-progress") this.state = { ...this.state, loadingProgress: value };
      if (type === "backend") this.state = { ...this.state, backend: `${device} / ${dtype}` };
      if (type === "transcript") {
        this.state = { ...this.state, status: "ready" };
        this.resolveRef?.(text ?? "");
        this.resolveRef = null;
        this.rejectRef = null;
      }
      if (type === "error") {
        const isOOM = message?.includes("Out of memory") || message?.includes("No available backend");
        this.state = { ...this.state, status: "error", error: message, workerDead: isOOM };
        this.rejectRef?.(new Error(message));
        this.resolveRef = null;
        this.rejectRef = null;
        if (isOOM) { try { this.worker?.terminate(); } catch { } this.worker = null; }
      }
      this.notify();
    };
    this.worker.postMessage({ type: "load" });
  }

  transcribe(audio: Float32Array, language = "es"): Promise<string> {
    this.ensureWorker();
    if (this.state.workerDead) return Promise.reject(new Error("Worker unavailable"));
    return new Promise<string>((resolve, reject) => {
      this.resolveRef = resolve;
      this.rejectRef = reject;
      this.worker!.postMessage({ type: "transcribe", audio, language }, [audio.buffer]);
    });
  }
}

// ─── Audio Decode Helper ──────────────────────────────────────────────────────
async function decodeAudioTo16kHz(blob: Blob): Promise<Float32Array> {
  const TARGET_SR = 16_000;
  const arrayBuffer = await blob.arrayBuffer();
  let ctx = new AudioContext({ sampleRate: TARGET_SR });
  try {
    let decoded = await ctx.decodeAudioData(arrayBuffer);
    if (decoded.sampleRate === TARGET_SR) {
      await ctx.close();
      return decoded.getChannelData(0).slice();
    }
    const numFrames = Math.ceil(decoded.duration * TARGET_SR);
    const offline = new OfflineAudioContext(1, numFrames, TARGET_SR);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start(0);
    const resampled = await offline.startRendering();
    await ctx.close();
    return resampled.getChannelData(0).slice();
  } catch (e) { await ctx.close(); throw e; }
}

// ─── Hook principal ────────────────────────────────────────────────────────────
export function useWhisperTranscription() {
  const singleton = WhisperWorkerSingleton.getInstance();
  const workerState = useSyncExternalStore<WorkerState>(
    singleton.subscribe.bind(singleton),
    singleton.getSnapshot.bind(singleton)
  );

  const [localError, setLocalError] = useState<string | null>(null);
  const [activeEngine, setActiveEngine] = useState<TranscriptionEngine>("webspeech");
  const [interimText, setInterimText] = useState("");

  const webSpeechRef = useRef<WebSpeechEngine | null>(null);
  const [webSpeechRecording, setWebSpeechRecording] = useState(false);

  useEffect(() => {
    return () => { webSpeechRef.current?.destroy(); };
  }, []);

  const engines: EngineInfo[] = [
    { id: "webspeech", name: "Sistema (Online)", reliability: 5, isOffline: false, isAvailable: isWebSpeechAvailable() },
    { id: "cloud", name: "IA Cloud (Gemini)", reliability: 5, isOffline: false, isAvailable: true },
    { id: "whisper", name: "Local (Privado)", reliability: 3, isOffline: true, isAvailable: !workerState.workerDead },
  ];

  /** transcribe(blob) — para audio ya grabado */
  const transcribe = useCallback(
    async (audio: File | Blob, language = "es"): Promise<{ transcript: string; fields?: any }> => {
      setLocalError(null);

      // Si el motor es Cloud, usamos la función de Supabase
      if (activeEngine === "cloud") {
        try {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
          });
          reader.readAsDataURL(audio);
          const base64 = await base64Promise;

          const { supabase } = await import("@/integrations/supabase/client");
          const { data, error } = await supabase.functions.invoke("parse-pigeon", {
            body: { audio: base64, language },
          });
          if (error) throw error;
          return {
            transcript: data.transcript || "",
            fields: data.fields || {}
          };
        } catch (err: any) {
          setLocalError("Cloud transcription failed: " + err.message);
          return { transcript: "" };
        }
      }

      if (activeEngine === "webspeech") {
        setLocalError("Usa el botón de micrófono para el motor de sistema.");
        return { transcript: "" };
      }

      try {
        const float32 = await decodeAudioTo16kHz(audio);
        const text = await singleton.transcribe(float32, language);
        return { transcript: text };
      } catch (err: any) {
        setLocalError(err?.message ?? "Transcription failed");
        throw err;
      }
    },
    [singleton, activeEngine]
  );

  const startWebSpeech = useCallback(async (lang = "es-ES") => {
    if (!isWebSpeechAvailable()) {
      setLocalError("Web Speech API no disponible.");
      return;
    }
    setInterimText("");
    const ws = new WebSpeechEngine(lang);
    webSpeechRef.current = ws;
    await ws.start((text) => setInterimText(text));
    setWebSpeechRecording(true);
  }, []);

  const stopWebSpeech = useCallback(async (): Promise<string> => {
    setWebSpeechRecording(false);
    const text = await webSpeechRef.current?.stop() ?? "";
    webSpeechRef.current = null;
    setInterimText("");
    return text;
  }, []);

  const error = localError ?? workerState.error;
  const effectiveStatus = activeEngine === "whisper" ? workerState.status : "ready";

  return {
    status: effectiveStatus,
    loading: effectiveStatus === "loading",
    loadingProgress: workerState.loadingProgress,
    transcribing: effectiveStatus === "transcribing",
    ready: effectiveStatus === "ready",
    backend: workerState.backend,
    model: workerState.model,
    error,

    // Motor activo
    engine: activeEngine,
    setEngine: setActiveEngine,
    availableEngines: engines,
    isIOS: isIOS(),
    webSpeechAvailable: isWebSpeechAvailable(),

    // Métodos
    transcribe,
    startWebSpeech,
    stopWebSpeech,
    webSpeechRecording,
    interimText,
  };
}