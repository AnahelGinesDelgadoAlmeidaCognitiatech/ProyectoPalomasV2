import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Save, Trash2, Wand2, Mic, Square, Loader2 } from "lucide-react";
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
import { useVoiceRecorder, MAX_RECORDING_MS, isSpeechSupported } from "@/hooks/useVoiceRecorder";
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
  const isNew = !id;

  const existing = useLiveQuery(() => (id ? db.pigeons.get(id) : undefined), [id]);
  const [form, setForm] = useState<Pigeon>(emptyPigeon);

  useEffect(() => {
    if (existing) setForm(existing);
  }, [existing]);

  const set = <K extends keyof Pigeon>(k: K, v: Pigeon[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ---------------- Voice wizard ----------------
  const wizard = useVoiceRecorder("es-ES");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardBusy, setWizardBusy] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!wizard.recording) {
      setElapsedSec(0);
      return;
    }
    const startedAt = Date.now();
    const t = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);
    return () => clearInterval(t);
  }, [wizard.recording]);

  async function startWizard() {
    if (!isSpeechSupported()) {
      toast.error("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
      return;
    }
    setWizardOpen(true);
    try {
      await wizard.start({
        onAutoStop: () => {
          toast.message("Tiempo máximo (5 min) alcanzado. Procesando...");
          stopWizardAndApply();
        },
      });
    } catch (e: any) {
      toast.error(e?.message || "No se pudo iniciar el micrófono");
      setWizardOpen(false);
    }
  }

  async function stopWizardAndApply() {
    const res = await wizard.stop();
    const text = res.transcript.trim();
    setWizardOpen(false);
    if (!text) {
      toast.message("No se detectó voz");
      return;
    }
    setWizardBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-pigeon", {
        body: { transcript: text },
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
        toast.message("La IA no detectó campos claros. Revisa el texto en notas.");
      } else {
        toast.success(`Datos rellenados (${filled} campos)`);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "No se pudo procesar la transcripción");
      setForm((f) => ({ ...f, notes: f.notes ? `${f.notes}\n${text}` : text }));
    } finally {
      setWizardBusy(false);
    }
  }

  // ---------------- Persistence ----------------
  async function handleSave() {
    if (!form.name.trim() && !form.ringNumber.trim()) {
      toast.error("Necesitas al menos un nombre o un número de anilla");
      return;
    }
    const data: Pigeon = { ...form, updatedAt: Date.now() };
    await db.pigeons.put(data);
    await enqueueSync({ entity: "pigeon", op: isNew ? "create" : "update", payload: data });
    toast.success(isNew ? "Paloma añadida" : "Cambios guardados");
    navigate(`/pigeons/${data.id}`);
  }

  async function handleDelete() {
    if (!id) return;
    if (!confirm("¿Eliminar esta paloma?")) return;
    await db.pigeons.delete(id);
    await enqueueSync({ entity: "pigeon", op: "delete", payload: { id } });
    toast.success("Eliminada");
    navigate("/pigeons");
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2">
        <Link to={isNew ? "/pigeons" : `/pigeons/${id}`}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {isNew ? "New pigeon" : "Edit pigeon"}
        </h1>
      </div>

      {/* Voice assistant card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Rellenar por voz (IA)</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Dicta una nota natural en español o inglés. La IA separará los datos y los colocará en cada campo. Ejemplo:{" "}
            <em>
              "Apollo, macho, anilla BE 2024 1234567, color blue bar, palomar Main Loft, criador Van der Berg, criador, nacido en 2024".
            </em>
          </p>

          {wizardOpen && wizard.recording && (
            <div className="rounded-md bg-background border p-3 text-sm">
              <p>
                <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-destructive align-middle" />
                {wizard.finalText}{" "}
                <span className="text-muted-foreground">{wizard.interim}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                {formatTime(elapsedSec)} / {formatTime(MAX_RECORDING_MS / 1000)} (máx)
              </p>
            </div>
          )}
          {wizard.error && !wizard.recording && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
              {wizard.error}
            </p>
          )}

          <div>
            {!wizard.recording ? (
              <Button
                type="button"
                onClick={startWizard}
                disabled={wizardBusy}
                className="gap-2"
              >
                {wizardBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Procesando con IA...
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" /> Empezar dictado
                  </>
                )}
              </Button>
            ) : (
              <Button type="button" variant="destructive" onClick={stopWizardAndApply} className="gap-2">
                <Square className="h-4 w-4" /> Detener y rellenar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardContent className="pt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Apollo" />
          </Field>
          <Field label="Band number">
            <Input
              value={form.ringNumber}
              onChange={(e) => set("ringNumber", e.target.value)}
              placeholder="BE-2024-1234567"
            />
          </Field>

          <Field label="Sex">
            <Select value={form.sex} onValueChange={(v) => set("sex", v as Pigeon["sex"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cock">♂ Cock</SelectItem>
                <SelectItem value="hen">♀ Hen</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Born year">
            <Input
              type="number"
              inputMode="numeric"
              value={form.bornYear ?? ""}
              onChange={(e) => set("bornYear", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="2024"
            />
          </Field>

          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set("status", v as Pigeon["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="breeder">Breeder</SelectItem>
                <SelectItem value="racer">Racer</SelectItem>
                <SelectItem value="young">Young</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Color">
            <Input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="Blue Bar" />
          </Field>

          <Field label="Loft">
            <Input value={form.loft} onChange={(e) => set("loft", e.target.value)} placeholder="Main Loft" />
          </Field>
          <Field label="Breeder">
            <Input value={form.breeder} onChange={(e) => set("breeder", e.target.value)} placeholder="Van der Berg" />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea
                value={form.notes ?? ""}
                onChange={(e) => set("notes", e.target.value)}
                className="min-h-32"
                placeholder="Observations, lineage, behaviour..."
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" /> {isNew ? "Create pigeon" : "Save changes"}
        </Button>
        {!isNew && (
          <Button variant="destructive" onClick={handleDelete} className="gap-2">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        )}
        <Button asChild variant="outline">
          <Link to={isNew ? "/pigeons" : `/pigeons/${id}`}>Cancel</Link>
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
