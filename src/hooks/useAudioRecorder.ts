/**
 * useAudioRecorder
 *
 * Records audio from the user's microphone using the MediaRecorder API.
 * Returns a Blob when stopped.
 *
 * Mobile compatibility notes:
 * • iOS Safari only supports audio/mp4 (not webm/ogg).  We probe for the best
 *   MIME type at runtime.
 * • We call recorder.start(timeslice) with 250 ms chunks so that ondataavailable
 *   fires reliably on Android WebViews that otherwise deliver no data on stop.
 * • We request { audio: { echoCancellation: true, noiseSuppression: true } }
 *   for better transcription quality on mobile (fewer background sounds).
 */

import { useCallback, useRef, useState } from "react";

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",        // iOS Safari
  "audio/aac",
];

function getBestMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const mime of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return "";
}

const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  sampleRate: { ideal: 16_000 },   // hint — browser may ignore
  channelCount: 1,
};

export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    setError(null);
    chunksRef.current = [];

    // ── Permissions check ────────────────────────────────────────────────────
    if (!window.isSecureContext) {
      const msg = "Microphone access requires HTTPS.";
      setError(msg);
      throw new Error(msg);
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      const msg = "This browser does not support microphone access.";
      setError(msg);
      throw new Error(msg);
    }

    // ── Get microphone stream ────────────────────────────────────────────────
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS });
    } catch (e: any) {
      const name: string = e?.name ?? "";
      let msg = "Could not access microphone.";
      if (name === "NotAllowedError" || name === "SecurityError") {
        msg = "Permission denied. Enable microphone for this site in browser settings.";
      } else if (name === "NotFoundError") {
        msg = "No microphone detected.";
      } else if (name === "NotReadableError") {
        msg = "Microphone is in use by another app.";
      } else if (name === "OverconstrainedError") {
        // Retry without constraints
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
          setError(msg);
          throw new Error(msg);
        }
      }
      if (!stream!) {
        setError(msg);
        throw new Error(msg);
      }
    }
    streamRef.current = stream!;

    // ── Start MediaRecorder ───────────────────────────────────────────────────
    const mimeType = getBestMimeType();
    const recorder = new MediaRecorder(stream!, mimeType ? { mimeType } : undefined);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    // timeslice = 250 ms: ensures ondataavailable fires on Android WebViews
    recorder.start(250);
    recorderRef.current = recorder;
    setRecording(true);
  }, []);

  const stop = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const recorder = recorderRef.current;
      if (!recorder) {
        reject(new Error("No recording in progress."));
        return;
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });

        // Cleanup
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setRecording(false);

        resolve(blob);
      };

      recorder.onerror = (e: any) => {
        const msg = e?.error?.message ?? "MediaRecorder error";
        setError(msg);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setRecording(false);
        reject(new Error(msg));
      };

      recorder.stop();
    });
  }, []);

  return { recording, error, start, stop };
}