import { useCallback, useEffect, useRef, useState } from "react";

// Web Speech API — light typings
type SpeechRecognitionCtor = new () => any;
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

export interface VoiceResult {
  transcript: string;
  audioBlob?: Blob;
  durationSec: number;
}

export function isSpeechSupported() {
  return (
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
}

/** Max recording length per dictation. */
export const MAX_RECORDING_MS = 5 * 60 * 1000; // 5 minutes

export function useVoiceRecorder(lang = "es-ES") {
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [finalText, setFinalText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const finalRef = useRef<string>("");
  const recordingRef = useRef<boolean>(false);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onAutoStopRef = useRef<(() => void) | null>(null);

  const cleanup = useCallback(() => {
    recordingRef.current = false;
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    try { 
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop(); 
      }
    } catch {}
    recognitionRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const start = useCallback(
    async (opts?: { onAutoStop?: () => void }) => {
      setError(null);
      setInterim("");
      setFinalText("");
      finalRef.current = "";
      startTimeRef.current = Date.now();
      onAutoStopRef.current = opts?.onAutoStop ?? null;

      // ── Secure context check ─────────────────────────────────────────────
      if (!window.isSecureContext) {
        const msg = "El micrófono requiere HTTPS. Accede desde la URL https:// de tu sitio o usa localhost.";
        setError(msg);
        throw new Error(msg);
      }

      const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Ctor) {
        const msg = "Este navegador no soporta reconocimiento de voz.";
        setError(msg);
        throw new Error(msg);
      }

      const rec = new Ctor();
      rec.lang = lang;
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (ev: any) => {
        let interimT = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const r = ev.results[i];
          if (r.isFinal) {
            finalRef.current += (finalRef.current ? " " : "") + r[0].transcript.trim();
            setFinalText(finalRef.current);
          } else {
            interimT += r[0].transcript;
          }
        }
        setInterim(interimT);
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e.error);
        if (e.error === "network") {
          setError("Error de red: Asegúrate de tener internet y usar HTTPS.");
        } else if (e.error !== "no-speech" && e.error !== "aborted") {
          setError(`Error: ${e.error}`);
        }
      };

      rec.onend = () => {
        if (recordingRef.current) {
          try { rec.start(); } catch {}
        }
      };

      recognitionRef.current = rec;
      recordingRef.current = true;
      
      try {
        rec.start();
        setRecording(true);
      } catch (e) {
        console.error("Speech recognition start error:", e);
        setRecording(false);
        recordingRef.current = false;
        throw e;
      }

      autoStopTimerRef.current = setTimeout(() => {
        autoStopTimerRef.current = null;
        onAutoStopRef.current?.();
      }, MAX_RECORDING_MS);
    },
    [lang]
  );

  const stop = useCallback(async (): Promise<VoiceResult> => {
    setRecording(false);
    recordingRef.current = false;
    
    return new Promise((resolve) => {
      const finish = () => {
        const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
        const finalTranscript = `${finalRef.current} ${interim}`.trim();
        cleanup();
        resolve({ transcript: finalTranscript, durationSec });
      };

      try { 
        if (recognitionRef.current) {
          recognitionRef.current.onend = finish;
          recognitionRef.current.stop(); 
        } else {
          finish();
        }
      } catch (e) {
        console.error("Error stopping recognition:", e);
        finish();
      }
    });
  }, [cleanup, interim]);

  return { recording, interim, finalText, error, start, stop };
}
