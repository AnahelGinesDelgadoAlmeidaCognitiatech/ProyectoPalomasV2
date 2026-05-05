import { Settings as SettingsIcon, FileText, IdCard } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return (
    <SettingsShell title={t("settings.general_title")} icon={SettingsIcon} description={t("settings.general_desc")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("settings.theme")}>
          <Select value={theme} onValueChange={(v) => setTheme(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t("settings.light")}</SelectItem>
              <SelectItem value="dark">{t("settings.dark")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("settings.units")}>
          <Select value={units} onValueChange={(v) => setUnits(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="km">{t("settings.kilometers")}</SelectItem>
              <SelectItem value="mi">{t("settings.miles")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("settings.date_format")}>
          <Select value={dateFormat} onValueChange={setDateFormat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="YYYY-MM-DD">2025-04-30</SelectItem>
              <SelectItem value="DD/MM/YYYY">30/04/2025</SelectItem>
              <SelectItem value="MM/DD/YYYY">04/30/2025</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("settings.language")}>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="es">{t("settings.spanish")}</SelectItem>
              <SelectItem value="en">{t("settings.english")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("settings.default_loft")}>
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
  const { t } = useTranslation();

  return (
    <SettingsShell title={t("settings.pedigree_title")} icon={FileText} description={t("settings.pedigree_desc")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("settings.generations")}>
          <Select value={String(generations)} onValueChange={(v) => setGenerations(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{t("settings.generations_count", { count: n })}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("settings.header_logo")}>
          <Input value={headerLogo} onChange={(e) => setHeaderLogo(e.target.value)} placeholder="URL o texto" />
        </Field>
        <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
          <div>
            <Label>{t("settings.show_photos")}</Label>
            <p className="text-xs text-muted-foreground">{t("settings.show_photos_desc")}</p>
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
  const { t } = useTranslation();

  const items: [string, boolean, (v: boolean) => Promise<void>, string][] = [
    [t("settings.show_stats"), showStats, setShowStats, t("settings.show_stats_desc")],
    [t("settings.show_notes"), showNotes, setShowNotes, t("settings.show_notes_desc")],
    [t("settings.show_family"), showFamily, setShowFamily, t("settings.show_family_desc")],
  ];

  return (
    <SettingsShell title={t("settings.card_title")} icon={IdCard} description={t("settings.card_desc")}>
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
