import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type { Table } from "dexie";
import { Plus, Pencil, Trash2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { db, enqueueSync, removeAndSync, uid, type SyncEntity } from "@/lib/db";

export type FieldDef =
  | { name: string; label: string; type?: "text" | "number" | "date"; placeholder?: string; required?: boolean; full?: boolean }
  | { name: string; label: string; type: "textarea"; placeholder?: string; required?: boolean; full?: boolean };

interface Props<T> {
  title: string;
  description: string;
  icon: LucideIcon;
  table: Table<T, string>;
  entity: SyncEntity;
  fields: FieldDef[];
  /** how to render an item in the list */
  renderItem: (item: T) => React.ReactNode;
  /** initial values for "new" record */
  defaults?: () => Partial<T>;
  /** custom validation */
  validate?: (item: any) => string | null;
}

export function CrudPage<T extends { id: string; createdAt: number; updatedAt: number }>({
  title, description, icon: Icon, table, entity, fields, renderItem, defaults, validate,
}: Props<T>) {
  const items = useLiveQuery(() => table.orderBy("updatedAt").reverse().toArray(), []) ?? [];
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  function newItem() {
    const now = Date.now();
    setEditing({ id: uid(), createdAt: now, updatedAt: now, ...(defaults?.() ?? {}) });
    setOpen(true);
  }
  function editItem(it: T) { setEditing({ ...it }); setOpen(true); }

  async function save() {
    const err = validate?.(editing);
    if (err) { toast.error(err); return; }
    for (const f of fields) {
      if ((f as any).required && !String(editing[f.name] ?? "").trim()) {
        toast.error(`Campo requerido: ${f.label}`);
        return;
      }
    }
    const isNew = !(await table.get(editing.id));
    const payload = { ...editing, updatedAt: Date.now() } as T;
    await table.put(payload);
    await enqueueSync({ entity, op: isNew ? "create" : "update", payload });
    toast.success(isNew ? "Creado" : "Guardado");
    setOpen(false);
    setEditing(null);
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este registro?")) return;
    await removeAndSync(table as any, entity, id);
    toast.success("Eliminado");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={newItem} className="gap-2"><Plus className="h-4 w-4" /> Nuevo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing && items.find((i) => i.id === editing.id) ? "Editar" : "Nuevo"} {title.toLowerCase()}</DialogTitle></DialogHeader>
            {editing && (
              <div className="grid gap-3 sm:grid-cols-2">
                {fields.map((f) => (
                  <div key={f.name} className={(f as any).full ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">{f.label}</Label>
                    {f.type === "textarea" ? (
                      <Textarea
                        value={editing[f.name] ?? ""}
                        onChange={(e) => setEditing({ ...editing, [f.name]: e.target.value })}
                        placeholder={f.placeholder}
                      />
                    ) : (
                      <Input
                        type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                        value={editing[f.name] ?? ""}
                        onChange={(e) => {
                          const v = f.type === "number" ? (e.target.value === "" ? undefined : Number(e.target.value)) : e.target.value;
                          setEditing({ ...editing, [f.name]: v });
                        }}
                        placeholder={f.placeholder}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">Sin registros. Pulsa "Nuevo" para añadir el primero.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {items.map((it) => (
            <Card key={it.id} className="shadow-soft">
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">{renderItem(it)}</div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => editItem(it)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(it.id)} aria-label="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// re-export db for convenience
export { db };
