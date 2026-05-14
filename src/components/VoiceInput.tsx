/**
 * VoiceInput — botón de micrófono con fallback automático iOS.
 *
 * • Android / PC  → Whisper-tiny local (WASM o WebGPU)
 * • iOS Safari    → Web Speech API nativa (motor Siri)
 *
 * El componente detecta el motor activo y adapta su UI y flujo sin
 * que el usuario tenga que hacer nada diferente.
 */

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";

interface Props {
  onTranscript: (text: string) => void;
  language?: string;
  className?: string;
  showControls?: boolean;
}

export function VoiceInput({ onTranscript, language, className = "", showControls = true }: Props) {
  const { t, i18n } = useTranslation();
  const lang = language ?? i18n.language === "pt" ? "pt-PT" : i18n.language === "en" ? "en-US" : "es-ES";
  const { recording, interim, finalText, error, start, stop } = useVoiceRecorder(lang);

  const handleToggle = useCallback(async () => {
    if (recording) {
      const res = await stop();
      if (res.transcript) onTranscript(res.transcript);
    } else {
      try {
        await start();
      } catch (e) {
        console.error(e);
      }
    }
  }, [recording, start, stop, onTranscript]);

  if (!showControls) return null;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        {!recording ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-2 h-8 text-xs"
            onClick={handleToggle}
          >
            <Mic className="h-3.5 w-3.5" />
            {t("voice_input.record")}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="gap-2 h-8 text-xs animate-pulse"
            onClick={handleToggle}
          >
            <Square className="h-3.5 w-3.5" />
            {t("voice_input.stop")}
          </Button>
        )}

        {(recording || interim || finalText) && (
          <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
            {finalText} <span className="opacity-70">{interim}</span>
          </p>
        )}
        
        {error && (
          <p className="text-[10px] text-destructive truncate max-w-[200px]">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}