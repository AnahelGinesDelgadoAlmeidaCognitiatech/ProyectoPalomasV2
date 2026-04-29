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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const finalRef = useRef<string>("");
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onAutoStopRef = useRef<(() => void) | null>(null);

  const cleanup = useCallback(() => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    try { recognitionRef.current?.stop?.(); } catch {}
    try {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current?.stop();
      }
    } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const start = useCallback(
    async (opts?: { onAutoStop?: () => void }) => {
      setError(null);
      setInterim("");
      setFinalText("");
      finalRef.current = "";
      chunksRef.current = [];
      startTimeRef.current = Date.now();
      onAutoStopRef.current = opts?.onAutoStop ?? null;

      if (!window.isSecureContext) {
        const msg = "Microphone requires HTTPS. Open the app on its secure URL.";
        setError(msg);
        throw new Error(msg);
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        const msg = "This browser does not support microphone access.";
        setError(msg);
        throw new Error(msg);
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e: any) {
        const name = e?.name || "";
        let msg = "Could not access microphone";
        if (name === "NotAllowedError" || name === "SecurityError") {
          msg = "Permission denied. Enable microphone for this site in browser settings.";
        } else if (name === "NotFoundError") {
          msg = "No microphone detected.";
        } else if (name === "NotReadableError") {
          msg = "Microphone is being used by another app.";
        }
        setError(msg);
        throw new Error(msg);
      }
      streamRef.current = stream;
      try {
        const mr = new MediaRecorder(stream);
        mediaRecorderRef.current = mr;
        mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
        mr.start();
      } catch {
        mediaRecorderRef.current = null;
      }

      const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (Ctor) {
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
          if (e.error !== "no-speech" && e.error !== "aborted") {
            setError(`Recognition: ${e.error}`);
          }
        };
        rec.onend = () => {
          if (mediaRecorderRef.current?.state === "recording") {
            try { rec.start(); } catch {}
          }
        };
        recognitionRef.current = rec;
        try { rec.start(); } catch {}
      }

      setRecording(true);

      autoStopTimerRef.current = setTimeout(() => {
        autoStopTimerRef.current = null;
        onAutoStopRef.current?.();
      }, MAX_RECORDING_MS);
    },
    [lang]
  );

  const stop = useCallback(async (): Promise<VoiceResult> => {
    setRecording(false);
    return new Promise((resolve) => {
      const mr = mediaRecorderRef.current;
      const finish = () => {
        const blob = chunksRef.current.length
          ? new Blob(chunksRef.current, { type: mr?.mimeType || "audio/webm" })
          : undefined;
        const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
        cleanup();
        resolve({ transcript: finalRef.current.trim(), audioBlob: blob, durationSec });
      };
      try { recognitionRef.current?.stop?.(); } catch {}
      if (mr && mr.state === "recording") {
        mr.onstop = finish;
        mr.stop();
      } else {
        finish();
      }
    });
  }, [cleanup]);

  return { recording, interim, finalText, error, start, stop };
}
