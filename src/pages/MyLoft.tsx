import { useState, useEffect } from "react";
import { Home, MapPin, ExternalLink, Bird, Plus, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { CrudPage } from "@/components/CrudPage";
import { db, enqueueSync, type Loft } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export default function MyLoft() {
  const { t } = useTranslation();
  return (
    <CrudPage<Loft>
      title={t("sidebar.my_loft")}
      description={t("crud_pages.my_loft.desc")}
      icon={Home}
      table={db.lofts}
      entity="loft"
      defaults={() => ({ name: "" })}
      fields={[
        { name: "name", label: t("crud_pages.my_loft.field_name"), required: true, placeholder: t("crud_pages.my_loft.placeholder_name") },
        { name: "lat", label: t("crud_pages.my_loft.field_lat"), type: "number" },
        { name: "lng", label: t("crud_pages.my_loft.field_lng"), type: "number" },
        { name: "location_map", label: "Selector Visual", type: "location", full: true },
        { name: "capacity", label: t("crud_pages.my_loft.field_capacity"), type: "number" },
        { name: "notes", label: t("crud_pages.my_loft.field_notes"), type: "textarea", full: true },
      ]}
      renderItem={(l) => <LoftItem loft={l} />}
    />
  );
}

function LoftItem({ loft }: { loft: Loft }) {
  const { t } = useTranslation();
  const hasCoords = loft.lat != null && loft.lng != null;
  
  const pigeonCount = useLiveQuery(() => db.pigeons.where("loft").equals(loft.id).count(), [loft.id]) || 0;

  const openInGoogleMaps = () => {
    if (hasCoords) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${loft.lat},${loft.lng}`, "_blank");
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex-1 space-y-1">
        <p className="font-semibold text-lg">{loft.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {hasCoords ? (
            <span>{loft.lat?.toFixed(6)}, {loft.lng?.toFixed(6)}</span>
          ) : (
            <span>{t("crud_pages.stations.no_coords")}</span>
          )}
          {loft.capacity && (
            <span> · {loft.capacity} {t("crud_pages.my_loft.birds")}</span>
          )}
        </div>
        {loft.notes && (
          <p className="text-sm text-muted-foreground italic line-clamp-1 mt-1">{loft.notes}</p>
        )}
        
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {hasCoords && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1.5 text-[10px] uppercase tracking-wider font-bold"
              onClick={openInGoogleMaps}
            >
              <ExternalLink className="h-3 w-3" />
              Google Maps
            </Button>
          )}
          
          <Button 
            variant="secondary"
            size="sm"
            className="h-8 gap-1.5 text-[10px] uppercase tracking-wider font-bold bg-primary/10 text-primary hover:bg-primary/20"
            asChild
          >
            <Link to={`/pigeons?loftId=${loft.id}`}>
              <Bird className="h-3 w-3" />
              {pigeonCount} Palomas
            </Link>
          </Button>

          <LoftPigeonsManager loft={loft} pigeonCount={pigeonCount} />
        </div>
      </div>

      {hasCoords && (
        <div className="relative w-full sm:w-48 shrink-0 overflow-hidden rounded-xl border bg-muted shadow-sm aspect-video">
          <iframe
            title={`Map of ${loft.name}`}
            width="100%"
            height="100%"
            style={{ border: 0, pointerEvents: "none" }}
            src={`https://maps.google.com/maps?q=${loft.lat},${loft.lng}&z=14&t=k&output=embed`}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}
    </div>
  );
}

function LoftPigeonsManager({ loft }: { loft: Loft; pigeonCount: number }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const allPigeons = useLiveQuery(() => db.pigeons.toArray(), []) || [];
  const allLofts = useLiveQuery(() => db.lofts.toArray(), []) || [];
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      const current = allPigeons.filter(p => p.loft === loft.id || p.loft === loft.name).map(p => p.id);
      setSelectedIds(new Set(current));
    }
  }, [open, allPigeons, loft.id, loft.name]);

  const max = loft.capacity;
  const currentCount = selectedIds.size;

  const assignedElsewhere = new Map<string, string>();
  allPigeons.forEach(p => {
    if (selectedIds.has(p.id)) return;
    if (p.loft) {
      const otherLoft = allLofts.find(l => l.id !== loft.id && (l.id === p.loft || l.name === p.loft));
      if (otherLoft) {
        assignedElsewhere.set(p.id, otherLoft.name);
      }
    }
  });

  const handleToggle = (pigeonId: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      if (max && next.size >= max) {
        toast.error(`Capacidad máxima (${max}) alcanzada.`);
        return;
      }
      next.add(pigeonId);
    } else {
      next.delete(pigeonId);
    }
    setSelectedIds(next);
  };

  const handleSave = async () => {
    try {
      const updates = [];
      for (const p of allPigeons) {
        const shouldBeInLoft = selectedIds.has(p.id);
        const isInLoft = p.loft === loft.id || p.loft === loft.name;
        
        if (shouldBeInLoft && !isInLoft) {
          const updated = { ...p, loft: loft.id, updatedAt: Date.now() };
          await db.pigeons.put(updated);
          updates.push(updated);
        } else if (!shouldBeInLoft && isInLoft) {
          const updated = { ...p, loft: "", updatedAt: Date.now() };
          await db.pigeons.put(updated);
          updates.push(updated);
        }
      }

      for (const updated of updates) {
        await enqueueSync({ entity: "pigeon", op: "update", payload: updated });
      }

      toast.success("Palomas asignadas correctamente.");
      setOpen(false);
    } catch (e) {
      toast.error("Error al asignar palomas.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-[10px] uppercase tracking-wider font-bold"
        >
          <Settings2 className="h-3 w-3" />
          Gestionar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gestionar Palomas en {loft.name}</DialogTitle>
          <p className="text-xs text-muted-foreground">
            {max ? `Capacidad: ${currentCount} / ${max}` : `Palomas: ${currentCount}`}
          </p>
        </DialogHeader>
        <ScrollArea className="h-[300px] rounded-md border p-2 bg-background/50">
          {allPigeons.length === 0 && <p className="text-sm text-muted-foreground p-2">No hay palomas en el sistema.</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            {allPigeons.map(p => {
              const otherLoftName = assignedElsewhere.get(p.id);
              const isDisabled = !!otherLoftName;

              return (
                <div 
                  key={p.id} 
                  className={`flex items-center gap-2 rounded-sm px-1.5 py-1 transition-colors ${
                    isDisabled ? "opacity-50 bg-muted/30" : "hover:bg-accent/50"
                  }`}
                >
                  <Checkbox 
                    id={`pigeon-${p.id}`} 
                    checked={selectedIds.has(p.id)}
                    onCheckedChange={(checked) => handleToggle(p.id, checked as boolean)}
                    disabled={isDisabled || (!selectedIds.has(p.id) && max !== undefined && currentCount >= max)}
                  />
                  <label 
                    htmlFor={`pigeon-${p.id}`} 
                    className={`text-sm font-medium leading-none flex-1 truncate ${
                      isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    {p.name || "—"} 
                    <span className="text-[10px] text-muted-foreground font-mono ml-1">{p.ringNumber}</span>
                    {isDisabled && (
                      <span className="block text-[9px] text-destructive font-bold uppercase mt-0.5">
                        En: {otherLoftName}
                      </span>
                    )}
                  </label>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
