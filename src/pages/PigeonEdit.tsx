import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Save, Trash2, Wand2, Mic, Square, Loader2 } from "lucide-react";
import { VoiceInput } from "@/components/VoiceInput";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { db, enqueueSync, uid, type Pigeon } from "@/lib/db";
import { useWhisperTranscription } from "@/hooks/useWhisperTranscription";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { supabase } from "@/integrations/supabase/client";

const emptyPigeon = (): Pigeon => ({
  id: uid(),
  ringNumber: "",
  name: "",
  sex: "cock",
  color: "",
  bornYear: undefined,
  status: "young",
  loft: "",
  breeder: "",
  notes: "",
  wins: 0,
  races: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export default function PigeonEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isNew = !id;

  const existing = useLiveQuery(() => (id ? db.pigeons.get(id) : undefined), [id]);
  const [form, setForm] = useState<Pigeon>(emptyPigeon);

  useEffect(() => {
    if (existing) setForm(existing);
  }, [existing]);

  const set = <K extends keyof Pigeon>(k: K, v: Pigeon[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ---------------- Voice assistant (Local Whisper) ----------------
  const { i18n } = useTranslation();
  const { transcribe, transcribing, status } = useWhisperTranscription();
  const { recording, start: startRec, stop: stopRec, error: recError } = useAudioRecorder();
  
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardBusy, setWizardBusy] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!recording) {
      setElapsedSec(0);
      return;
    }
    const startedAt = Date.now();
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);
    return () => clearInterval(timer);
  }, [recording]);

  async function startWizard() {
    setWizardOpen(true);
    try {
      await startRec();
    } catch (e: any) {
      toast.error(e?.message || t("pigeon_edit.voice_mic_error"));
      setWizardOpen(false);
    }
  }

  async function stopWizardAndApply() {
    let blob: Blob;
    try {
      blob = await stopRec();
    } catch (e) {
      setWizardOpen(false);
      return;
    }

    setWizardBusy(true);
    try {
      const text = await transcribe(blob);
      if (!text) {
        toast.message(t("pigeon_edit.voice_no_voice"));
        setWizardOpen(false);
        return;
      }
      setWizardOpen(false);
      const { data, error } = await supabase.functions.invoke("parse-pigeon", {
        body: { 
          transcript: text,
          language: i18n.language
        },
      });
      if (error) throw error;
      const parsed = (data?.fields ?? {}) as Partial<Pigeon>;
      setForm((f) => ({
        ...f,
        name: parsed.name?.toString().trim() || f.name,
        ringNumber: parsed.ringNumber?.toString().trim() || f.ringNumber,
        sex: (parsed.sex as Pigeon["sex"]) || f.sex,
        bornYear: typeof parsed.bornYear === "number" ? parsed.bornYear : f.bornYear,
        color: parsed.color?.toString().trim() || f.color,
        loft: parsed.loft?.toString().trim() || f.loft,
        breeder: parsed.breeder?.toString().trim() || f.breeder,
        status: (parsed.status as Pigeon["status"]) || f.status,
        notes: parsed.notes
          ? f.notes
            ? `${f.notes}\n${parsed.notes}`
            : String(parsed.notes)
          : f.notes
            ? `${f.notes}\n${text}`
            : text,
      }));
      const filled = Object.keys(parsed).length;
      if (filled === 0) {
        toast.message(t("pigeon_edit.voice_no_fields"));
      } else {
        toast.success(t("pigeon_edit.voice_filled", { count: filled }));
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || t("pigeon_edit.voice_process_error"));
      setForm((f) => ({ ...f, notes: f.notes ? `${f.notes}\n${text}` : text }));
    } finally {
      setWizardBusy(false);
    }
  }

  // ---------------- Persistence ----------------
  async function handleSave() {
    if (!form.name.trim() && !form.ringNumber.trim()) {
      toast.error(t("pigeon_edit.save_error_name_ring"));
      return;
    }
    const data: Pigeon = { ...form, updatedAt: Date.now() };
    await db.pigeons.put(data);
    await enqueueSync({ entity: "pigeon", op: isNew ? "create" : "update", payload: data });
    toast.success(isNew ? t("pigeon_edit.save_created") : t("pigeon_edit.save_updated"));
    navigate(`/pigeons/${data.id}`);
  }

  async function handleDelete() {
    if (!id) return;
    if (!confirm(t("pigeon_edit.delete_confirm"))) return;
    await db.pigeons.delete(id);
    await enqueueSync({ entity: "pigeon", op: "delete", payload: { id } });
    toast.success(t("pigeon_edit.deleted"));
    navigate("/pigeons");
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2">
        <Link to={isNew ? "/pigeons" : `/pigeons/${id}`}>
          <ArrowLeft className="h-4 w-4" /> {t("pigeon_edit.back")}
        </Link>
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {isNew ? t("pigeon_edit.title_new") : t("pigeon_edit.title_edit")}
        </h1>
      </div>

      {/* Voice assistant card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">{t("pigeon_edit.voice_title")}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("pigeon_edit.voice_desc")}
          </p>

          {wizardOpen && recording && (
            <div className="rounded-md bg-background border p-3 text-sm">
              <p>
                <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-destructive align-middle" />
                {t("voice_input.recording")}...
              </p>
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                {formatTime(elapsedSec)}
              </p>
            </div>
          )}
          {(recError || status === "error") && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
              {recError || t("voice_input.error_generic")}
            </p>
          )}

          <div>
            {!recording ? (
              <Button
                type="button"
                onClick={startWizard}
                disabled={wizardBusy || transcribing || status === "loading"}
                className="gap-2"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> 
                    {t("pigeon_edit.voice_processing")} ({Math.round(loadingProgress)}%)
                  </>
                ) : transcribing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> {t("voice_input.transcribing")}...
                  </>
                ) : wizardBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> {t("pigeon_edit.voice_processing")} (IA)
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" /> {t("pigeon_edit.voice_start")}
                  </>
                )}
              </Button>
            ) : (
              <Button type="button" variant="destructive" onClick={stopWizardAndApply} className="gap-2">
                <Square className="h-4 w-4" /> {t("pigeon_edit.voice_stop")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardContent className="pt-6 grid gap-4 sm:grid-cols-2">
          <Field label={t("pigeon_edit.field_name")}>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Apollo" />
          </Field>
          <Field label={t("pigeon_edit.field_band")}>
            <Input
              value={form.ringNumber}
              onChange={(e) => set("ringNumber", e.target.value)}
              placeholder="BE-2024-1234567"
            />
          </Field>

          <Field label={t("pigeon_edit.field_sex")}>
            <Select value={form.sex} onValueChange={(v) => set("sex", v as Pigeon["sex"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cock">{t("pigeon_detail.cock")}</SelectItem>
                <SelectItem value="hen">{t("pigeon_detail.hen")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("pigeon_edit.field_born")}>
            <Input
              type="number"
              inputMode="numeric"
              value={form.bornYear ?? ""}
              onChange={(e) => set("bornYear", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="2024"
            />
          </Field>

          <Field label={t("pigeon_edit.field_status")}>
            <Select value={form.status} onValueChange={(v) => set("status", v as Pigeon["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="breeder">{t("status.breeder")}</SelectItem>
                <SelectItem value="racer">{t("status.racer")}</SelectItem>
                <SelectItem value="young">{t("status.young")}</SelectItem>
                <SelectItem value="lost">{t("status.lost")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("pigeon_edit.field_color")}>
            <Input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="Blue Bar" />
          </Field>

          <Field label={t("pigeon_edit.field_loft")}>
            <Input value={form.loft} onChange={(e) => set("loft", e.target.value)} placeholder="Main Loft" />
          </Field>
          <Field label={t("pigeon_edit.field_breeder")}>
            <Input value={form.breeder} onChange={(e) => set("breeder", e.target.value)} placeholder="Van der Berg" />
          </Field>

          <Field label={t("pigeon_edit.field_father")}>
            <PigeonParentSelect
              sex="cock"
              value={form.fatherId}
              currentId={id}
              onChange={(val) => set("fatherId", val)}
            />
          </Field>
          <Field label={t("pigeon_edit.field_mother")}>
            <PigeonParentSelect
              sex="hen"
              value={form.motherId}
              currentId={id}
              onChange={(val) => set("motherId", val)}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label={t("pigeon_edit.field_notes")}>
              <Textarea
                value={form.notes ?? ""}
                onChange={(e) => set("notes", e.target.value)}
                className="min-h-32"
                placeholder={t("pigeon_edit.notes_placeholder")}
              />
              <VoiceInput
                className="mt-1.5"
                onTranscript={(text) =>
                  set("notes", form.notes ? `${form.notes} ${text}` : text)
                }
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" /> {isNew ? t("pigeon_edit.btn_create") : t("pigeon_edit.btn_save")}
        </Button>
        {!isNew && (
          <Button variant="destructive" onClick={handleDelete} className="gap-2">
            <Trash2 className="h-4 w-4" /> {t("pigeon_edit.btn_delete")}
          </Button>
        )}
        <Button asChild variant="outline">
          <Link to={isNew ? "/pigeons" : `/pigeons/${id}`}>{t("pigeon_edit.btn_cancel")}</Link>
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function formatTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function PigeonParentSelect({ 
  sex, 
  value, 
  currentId, 
  onChange 
}: { 
  sex: "cock" | "hen"; 
  value?: string; 
  currentId?: string; 
  onChange: (val: string | undefined) => void 
}) {
  const { t } = useTranslation();
  const allPigeons = useLiveQuery(() => db.pigeons.toArray(), []) ?? [];

  // Filter by sex and exclude the current pigeon being edited
  const filtered = allPigeons.filter(p => p.sex === sex && p.id !== currentId);

  return (
    <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? undefined : v)}>
      <SelectTrigger>
        <SelectValue placeholder={t("pedigree_tree.unknown")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">{t("pedigree_tree.unknown")}</SelectItem>
        {filtered.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name || "—"} <span className="text-[10px] text-muted-foreground ml-1">({p.ringNumber})</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
