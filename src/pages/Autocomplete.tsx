import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Tags, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { db, enqueueSync, removeAndSync, uid, type AutocompleteCategory } from "@/lib/db";

const cats: { key: AutocompleteCategory; label: string }[] = [
  { key: "color", label: "Colores" },
  { key: "marking", label: "Marcas" },
  { key: "family", label: "Familias" },
  { key: "loft", label: "Palomares" },
  { key: "breeder", label: "Criadores" },
  { key: "tag", label: "Etiquetas" },
];

export default function Autocomplete() {
  const [tab, setTab] = useState<AutocompleteCategory>("color");
  const [val, setVal] = useState("");
  const items = useLiveQuery(
    () => db.autocomplete.where("category").equals(tab).sortBy("value"),
    [tab]
  ) ?? [];

  async function add() {
    const value = val.trim();
    if (!value) return;
    if (items.some((i) => i.value.toLowerCase() === value.toLowerCase())) {
      toast.error("Ya existe");
      return;
    }
    const now = Date.now();
    const payload = { id: uid(), category: tab, value, createdAt: now, updatedAt: now };
    await db.autocomplete.put(payload);
    await enqueueSync({ entity: "autocomplete", op: "create", payload });
    setVal("");
  }
  async function remove(id: string) {
    await removeAndSync(db.autocomplete, "autocomplete", id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Tags className="h-5 w-5" /></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Autocomplete Values</h1>
          <p className="text-muted-foreground">Valores que aparecen en los desplegables de la app.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as AutocompleteCategory)}>
        <TabsList className="flex-wrap">
          {cats.map((c) => <TabsTrigger key={c.key} value={c.key}>{c.label}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader><CardTitle className="text-base">{cats.find((c) => c.key === tab)?.label}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Añadir valor" onKeyDown={(e) => e.key === "Enter" && add()} />
            <Button onClick={add} className="gap-2"><Plus className="h-4 w-4" /> Añadir</Button>
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin valores en esta categoría.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {items.map((i) => (
                <Badge key={i.id} variant="secondary" className="gap-2 py-1.5 pl-3 pr-1.5">
                  {i.value}
                  <button onClick={() => remove(i.id)} className="rounded-md p-0.5 hover:bg-destructive/20" aria-label="Eliminar">
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
