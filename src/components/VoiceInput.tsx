import { useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Mic, Square, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWhisperTranscription } from "@/hooks/useWhisperTranscription";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

interface Props {
  /** Called with the transcribed text once Whisper finishes */
  onTranscript: (text: string) => void;
  className?: string;
}

export function VoiceInput({ onTranscript, className = "" }: Props) {
  const { t } = useTranslation();
  const { status, loading, transcribing, error, transcribe } = useWhisperTranscription();
  const { recording, start: startRec, stop: stopRec, error: recorderError } = useAudioRecorder();

  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ─── helpers ─────────────────────────────────────────── */
  const runTranscribe = useCallback(
    async (blob: Blob) => {
      setLocalError(null);
      try {
        const text = await transcribe(blob);
        if (text) onTranscript(text);
      } catch (e: any) {
        setLocalError(e?.message ?? t("voice_input.error_generic"));
      }
    },
    [transcribe, onTranscript, t]
  );

  /* ─── record ───────────────────────────────────────────── */
  const startRecording = useCallback(async () => {
    setLocalError(null);
    try {
      await startRec();
    } catch (e: any) {
      // Error handled by hook, but we can set local state if needed
    }
  }, [startRec]);

  const stopRecording = useCallback(async () => {
    try {
      const blob = await stopRec();
      runTranscribe(blob);
    } catch (e: any) {
      setLocalError(e?.message);
    }
  }, [stopRec, runTranscribe]);

  /* ─── file upload ──────────────────────────────────────── */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";
      runTranscribe(file);
    },
    [runTranscribe]
  );

  /* ─── derived state ────────────────────────────────────── */
  const busy = recording || transcribing || loading;

  let statusText = "";
  let statusColor = "text-muted-foreground";
  if (loading) {
    statusText  = t("voice_input.loading_model");
    statusColor = "text-amber-500";
  } else if (recording) {
    statusText  = t("voice_input.recording");
    statusColor = "text-destructive";
  } else if (transcribing) {
    statusText  = t("voice_input.transcribing");
    statusColor = "text-blue-500";
  } else if (status === "ready") {
    statusText  = t("voice_input.ready");
    statusColor = "text-emerald-500";
  } else if (status === "error" || localError || recorderError) {
    statusText  = localError ?? recorderError ?? error ?? t("voice_input.error_generic");
    statusColor = "text-destructive";
  }

  /* ─── render ───────────────────────────────────────────── */
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Record / Stop button */}
      {!recording ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5 h-8 text-xs"
          disabled={busy}
          onClick={startRecording}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Mic className="h-3.5 w-3.5" />
          )}
          {t("voice_input.record")}
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="gap-1.5 h-8 text-xs animate-pulse"
          onClick={stopRecording}
        >
          <Square className="h-3.5 w-3.5" />
          {t("voice_input.stop")}
        </Button>
      )}

      {/* Upload button */}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="gap-1.5 h-8 text-xs"
        disabled={busy}
        onClick={() => fileInputRef.current?.click()}
      >
        {transcribing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        {t("voice_input.upload")}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.m4a,.wav,.ogg,.webm,audio/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Status indicator */}
      {statusText && (
        <span className={`flex items-center gap-1 text-xs ${statusColor}`}>
          {recording && (
            <span className="inline-block h-2 w-2 rounded-full bg-destructive animate-pulse" />
          )}
          {status === "ready" && !recording && !transcribing && (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          {(status === "error" || localError || recorderError) && (
            <AlertCircle className="h-3.5 w-3.5" />
          )}
          {statusText}
        </span>
      )}
    </div>
  );
}
