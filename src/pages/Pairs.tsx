import { Heart, Calendar, ArrowLeft, Dna, Info } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { CrudPage } from "@/components/CrudPage";
import { db, type Pair, type Pigeon } from "@/lib/db";
import { calculateHypotheticalCOI } from "@/lib/genetics";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Pairs() {
  const { t } = useTranslation();
  const { seasonId } = useParams();
  
  const allPigeons = useLiveQuery(() => db.pigeons.toArray(), []) ?? [];
  const allPairs = useLiveQuery(() => db.pairs.toArray(), []) ?? [];
  const season = useLiveQuery(() => seasonId ? db.seasons.get(seasonId) : undefined, [seasonId]);

  const [calculatedCOI, setCalculatedCOI] = useState<Record<string, number>>({});

  const handleCalculateCOI = (p: Pair) => {
    if (!p.cockId || !p.henId) {
      toast.error(t("pairs.error_need_both_parents", "Necesitas seleccionar ambos padres para calcular el COI"));
      return;
    }
    const coi = calculateHypotheticalCOI(p.cockId, p.henId, allPigeons);
    setCalculatedCOI(prev => ({ ...prev, [p.id]: coi }));
    toast.success(t("pairs.coi_calculated", "COI calculado con éxito"));
  };

  const validateExclusivity = (editingPair: any) => {
    if (!editingPair.cockId && !editingPair.henId) return null;

    // Helper to normalize a date string or timestamp to the start of the day (00:00:00 UTC)
    const normalizeDate = (d: any) => {
      if (!d) return null;
      const date = new Date(d);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    };

    const start = normalizeDate(editingPair.startDate) || normalizeDate(new Date());
    const end = editingPair.endDate 
      ? normalizeDate(editingPair.endDate) 
      : (editingPair.status === "active" ? Infinity : start);

    if (start === null) return null;

    // Helper to check if another pair 'p' overlaps with our 'editingPair'
    const isOverlapping = (p: Pair) => {
      const pStart = normalizeDate(p.startDate) || normalizeDate(p.createdAt);
      if (!pStart) return false;

      const pEnd = p.endDate 
        ? normalizeDate(p.endDate) 
        : (p.status === "active" ? Infinity : pStart);

      // (StartA <= EndB) && (EndA >= StartB)
      return (start <= pEnd && (end === Infinity || end >= pStart));
    };

    // Find conflicting pairs (any pair that overlaps in time)
    const conflicts = allPairs.filter(p => p.id !== editingPair.id && isOverlapping(p));

    // Check Cock
    if (editingPair.cockId) {
      const conflict = conflicts.find(p => p.cockId === editingPair.cockId && p.henId !== editingPair.henId);
      if (conflict) {
        const pigeon = allPigeons.find(p => p.id === editingPair.cockId);
        const partner = allPigeons.find(p => p.id === conflict.henId);
        return t("pairs.error_cock_busy", { 
          name: pigeon?.name || pigeon?.ringNumber || "Macho",
          partner: partner?.name || partner?.ringNumber || "otra hembra",
          defaultValue: `El macho ${pigeon?.name || pigeon?.ringNumber} ya tiene una pareja activa con ${partner?.name || partner?.ringNumber} en este periodo.` 
        });
      }
    }

    // Check Hen
    if (editingPair.henId) {
      const conflict = conflicts.find(p => p.henId === editingPair.henId && p.cockId !== editingPair.cockId);
      if (conflict) {
        const pigeon = allPigeons.find(p => p.id === editingPair.henId);
        const partner = allPigeons.find(p => p.id === conflict.cockId);
        return t("pairs.error_hen_busy", { 
          name: pigeon?.name || pigeon?.ringNumber || "Hembra",
          partner: partner?.name || partner?.ringNumber || "otro macho",
          defaultValue: `La hembra ${pigeon?.name || pigeon?.ringNumber} ya tiene una pareja activa con ${partner?.name || partner?.ringNumber} en este periodo.` 
        });
      }
    }

    return null;
  };

  const PigeonSelector = ({ sex, value, onChange }: { sex: "cock" | "hen", value: string, onChange: (v: string) => void }) => {
    const options = allPigeons.filter(p => p.sex === sex);
    return (
      <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
        <SelectTrigger>
          <SelectValue placeholder={t("pairs.select_pigeon", "Seleccionar paloma")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t("pairs.none", "Ninguna")}</SelectItem>
          {options.map(p => (
            <SelectItem key={p.id} value={p.id}>
              {p.ringNumber} {p.name ? `(${p.name})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const getPigeonInfo = (id?: string) => {
    if (!id) return "—";
    const p = allPigeons.find(p => p.id === id);
    if (!p) return id;
    return `${p.ringNumber} ${p.name ? `(${p.name})` : ""}`;
  };

  return (
    <div className="space-y-4">
      {seasonId && (
        <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2">
          <Link to="/seasons">
            <ArrowLeft className="h-4 w-4" /> {t("pairs.back_to_seasons", "Volver a temporadas")}
          </Link>
        </Button>
      )}

      <CrudPage<Pair>
        title={seasonId ? `${t("sidebar.pairs")} - ${season?.name || ""}` : t("sidebar.pairs")}
        description={seasonId ? t("pairs.season_desc", "Parejas formadas en esta temporada") : t("crud_pages.pairs.desc")}
        icon={Heart}
        table={db.pairs}
        entity="pair"
        query={async () => {
          if (seasonId) {
            return db.pairs.where("seasonId").equals(seasonId).reverse().toArray();
          }
          return db.pairs.orderBy("updatedAt").reverse().toArray();
        }}
        defaults={() => ({ 
          seasonId: seasonId || "", 
          status: "active",
          startDate: new Date().toISOString().split("T")[0]
        })}
        validate={validateExclusivity}
        fields={[
          { 
            name: "cockId", 
            label: t("pigeon_detail.cock"), 
            type: "custom", 
            render: (v, onChange) => <PigeonSelector sex="cock" value={v} onChange={onChange} /> 
          },
          { 
            name: "henId", 
            label: t("pigeon_detail.hen"), 
            type: "custom", 
            render: (v, onChange) => <PigeonSelector sex="hen" value={v} onChange={onChange} /> 
          },
          { name: "nestBox", label: t("crud_pages.pairs.field_nestbox"), placeholder: "A-12" },
          { name: "startDate", label: t("pairs.start_date", "Fecha Inicio"), type: "date" },
          { name: "endDate", label: t("pairs.end_date", "Fecha Fin"), type: "date" },
          { 
            name: "status", 
            label: t("pigeon_edit.field_status"), 
            type: "custom", 
            render: (v, onChange) => (
              <Select value={v} onValueChange={onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("pairs.status_active", "Activa")}</SelectItem>
                  <SelectItem value="separated">{t("pairs.status_separated", "Separada")}</SelectItem>
                  <SelectItem value="resting">{t("pairs.status_resting", "En descanso")}</SelectItem>
                </SelectContent>
              </Select>
            )
          },
          { name: "notes", label: t("crud_pages.pairs.field_notes"), type: "textarea", full: true },
        ]}
        renderItem={(p) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {p.nestBox ? `${t("crud_pages.pairs.nest_prefix")} ${p.nestBox}` : t("pairs.pair", "Pareja")}
                </span>
                <Badge variant={p.status === "active" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 h-5">
                  {t(`pairs.status_${p.status}`, p.status)}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                {calculatedCOI[p.id] !== undefined && (
                  <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                    COI: {calculatedCOI[p.id].toFixed(2)}%
                  </Badge>
                )}
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                  <Calendar className="h-3 w-3" />
                  {p.startDate || "?"} — {p.endDate || (p.status === "active" ? t("pairs.present", "Presente") : "?")}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm mt-1">
              {p.cockId ? (
                <Link 
                  to={`/pigeons/${p.cockId}`} 
                  className="flex-1 bg-primary/5 p-2 rounded-md border border-primary/10 hover:bg-primary/10 transition-colors group/pigeon"
                >
                  <p className="text-[10px] text-primary/70 uppercase font-bold">{t("pigeon_detail.cock")}</p>
                  <p className="truncate font-medium group-hover/pigeon:text-primary transition-colors">{getPigeonInfo(p.cockId)}</p>
                </Link>
              ) : (
                <div className="flex-1 bg-muted/30 p-2 rounded-md border border-muted">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">{t("pigeon_detail.cock")}</p>
                  <p className="truncate font-medium text-muted-foreground">—</p>
                </div>
              )}
              
              <div className="flex flex-col items-center gap-1 px-1">
                <div className="text-muted-foreground text-xs font-bold">×</div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full hover:bg-primary/20 hover:text-primary"
                        onClick={(e) => { e.preventDefault(); handleCalculateCOI(p); }}
                      >
                        <Dna className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{t("pairs.calculate_coi", "Calcular consanguinidad hipotética")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {p.henId ? (
                <Link 
                  to={`/pigeons/${p.henId}`} 
                  className="flex-1 bg-accent/5 p-2 rounded-md border border-accent/10 hover:bg-accent/10 transition-colors group/pigeon"
                >
                  <p className="text-[10px] text-accent/70 uppercase font-bold">{t("pigeon_detail.hen")}</p>
                  <p className="truncate font-medium group-hover/pigeon:text-accent transition-colors">{getPigeonInfo(p.henId)}</p>
                </Link>
              ) : (
                <div className="flex-1 bg-muted/30 p-2 rounded-md border border-muted">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">{t("pigeon_detail.hen")}</p>
                  <p className="truncate font-medium text-muted-foreground">—</p>
                </div>
              )}
            </div>

            {p.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-1 italic">"{p.notes}"</p>}
          </div>
        )}
      />
    </div>
  );
}
