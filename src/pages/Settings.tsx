import { useEffect, useState } from "react";
import { Settings as SettingsIcon, FileText, IdCard } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { db, enqueueSync } from "@/lib/db";
import { useTheme } from "@/components/ThemeProvider";

function useSetting<T>(key: string, fallback: T) {
  const v = useLiveQuery(() => db.settings.get(key), [key]);
  const value = (v?.value ?? fallback) as T;
  const set = async (next: T) => {
    const payload = { key, value: next, updatedAt: Date.now() };
    await db.settings.put(payload);
    await enqueueSync({ entity: "setting", op: "update", payload });
  };
  return [value, set] as const;
}

export function GeneralSettings() {
  const { theme, setTheme } = useTheme();
  const [units, setUnits] = useSetting<"km" | "mi">("units", "km");
  const [dateFormat, setDateFormat] = useSetting<string>("dateFormat", "YYYY-MM-DD");
  const [defaultLoft, setDefaultLoft] = useSetting<string>("defaultLoft", "");
  const [language, setLanguage] = useSetting<string>("language", "es");

  return (
    <SettingsShell title="General Options" icon={SettingsIcon} description="Unidades, idioma, defaults.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tema">
          <Select value={theme} onValueChange={(v) => setTheme(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Claro</SelectItem>
              <SelectItem value="dark">Oscuro</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Unidades">
          <Select value={units} onValueChange={(v) => setUnits(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="km">Kilómetros</SelectItem>
              <SelectItem value="mi">Millas</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Formato de fecha">
          <Select value={dateFormat} onValueChange={setDateFormat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="YYYY-MM-DD">2025-04-30</SelectItem>
              <SelectItem value="DD/MM/YYYY">30/04/2025</SelectItem>
              <SelectItem value="MM/DD/YYYY">04/30/2025</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Idioma">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Palomar por defecto">
          <Input value={defaultLoft} onChange={(e) => setDefaultLoft(e.target.value)} placeholder="Main Loft" />
        </Field>
      </div>
    </SettingsShell>
  );
}

export function PedigreeSettings() {
  const [generations, setGenerations] = useSetting<number>("pedigree.generations", 4);
  const [showPhotos, setShowPhotos] = useSetting<boolean>("pedigree.showPhotos", true);
  const [headerLogo, setHeaderLogo] = useSetting<string>("pedigree.headerLogo", "");

  return (
    <SettingsShell title="Pedigree Options" icon={FileText} description="Personaliza el layout de pedigree impreso.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Generaciones">
          <Select value={String(generations)} onValueChange={(v) => setGenerations(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n} generaciones</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Logo cabecera">
          <Input value={headerLogo} onChange={(e) => setHeaderLogo(e.target.value)} placeholder="URL o texto" />
        </Field>
        <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
          <div>
            <Label>Mostrar fotos</Label>
            <p className="text-xs text-muted-foreground">Incluye foto de cada paloma en el pedigree.</p>
          </div>
          <Switch checked={showPhotos} onCheckedChange={setShowPhotos} />
        </div>
      </div>
    </SettingsShell>
  );
}

export function CardSettings() {
  const [showStats, setShowStats] = useSetting<boolean>("card.showStats", true);
  const [showNotes, setShowNotes] = useSetting<boolean>("card.showNotes", true);
  const [showFamily, setShowFamily] = useSetting<boolean>("card.showFamily", false);

  const items: [string, boolean, (v: boolean) => Promise<void>, string][] = [
    ["Mostrar estadísticas", showStats, setShowStats, "Wins, races, posiciones."],
    ["Mostrar notas", showNotes, setShowNotes, "Comentarios y observaciones."],
    ["Mostrar familia", showFamily, setShowFamily, "Linaje resumido."],
  ];

  return (
    <SettingsShell title="Information Card Options" icon={IdCard} description="Layout de la ficha de paloma.">
      <div className="grid gap-3">
        {items.map(([label, val, on, desc]) => (
          <div key={label} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>{label}</Label>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <Switch checked={val} onCheckedChange={on} />
          </div>
        ))}
      </div>
    </SettingsShell>
  );
}

function SettingsShell({ title, icon: Icon, description, children }: { title: string; icon: any; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
      <Card><CardContent className="p-6">{children}</CardContent></Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>{children}</div>;
}
