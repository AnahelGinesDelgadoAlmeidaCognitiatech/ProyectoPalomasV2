import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { CrudPage } from "@/components/CrudPage";
import { db, type Team } from "@/lib/db";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Teams() {
  const { t } = useTranslation();

  return (
    <CrudPage<Team>
      title={t("sidebar.teams")}
      description={t("crud_pages.teams.desc")}
      icon={Users}
      table={db.teams}
      entity="team"
      defaults={() => ({ name: "", pigeonIds: [] })}
      fields={[
        { name: "name", label: t("crud_pages.teams.field_name"), required: true, placeholder: t("crud_pages.teams.placeholder_name") },
        { 
          name: "pigeonIds", 
          label: t("crud_pages.teams.pigeons"), 
          type: "custom", 
          full: true,
          render: (value, onChange) => <PigeonSelector selectedIds={value || []} onChange={onChange} />
        },
        { name: "notes", label: t("crud_pages.teams.field_notes"), type: "textarea", full: true },
      ]}
      renderItem={(tm) => <TeamItem team={tm} />}
    />
  );
}

function TeamItem({ team }: { team: Team }) {
  const { t } = useTranslation();
  const pigeons = useLiveQuery(
    () => db.pigeons.where("id").anyOf(team.pigeonIds || []).toArray(),
    [team.pigeonIds]
  ) ?? [];

  return (
    <div className="space-y-2">
      <div>
        <p className="font-semibold text-lg">{team.name}</p>
        {team.notes && (
          <p className="text-sm text-muted-foreground line-clamp-1">{team.notes}</p>
        )}
      </div>
      
      {pigeons.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {pigeons.map((p) => (
            <Link 
              key={p.id} 
              to={`/pigeons/${p.id}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/5 border border-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary transition-all hover:bg-primary/20 hover:scale-105 active:scale-95"
            >
              <span className="max-w-[120px] truncate">{p.name || "—"}</span>
              <span className="text-[10px] opacity-60 font-mono">{p.ringNumber}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">{t("crud.empty")}</p>
      )}
    </div>
  );
}

function PigeonSelector({ selectedIds, onChange }: { selectedIds: string[]; onChange: (ids: string[]) => void }) {
  const pigeons = useLiveQuery(() => db.pigeons.toArray(), []) ?? [];
  const allTeams = useLiveQuery(() => db.teams.toArray(), []) ?? [];
  const { t } = useTranslation();

  // Mapeo de palomas que ya están en otros equipos
  const assignedElsewhere = new Map<string, string>(); // pigeonId -> teamName
  allTeams.forEach(team => {
    // Si estamos editando un equipo, no queremos bloquear las palomas que ya tiene ESTE equipo
    const isCurrentTeam = team.pigeonIds?.every(id => selectedIds.includes(id)) && team.pigeonIds?.length === selectedIds.length;
    
    // Un método más fiable: si la paloma está en un equipo pero NO es el set que estamos manejando ahora
    team.pigeonIds?.forEach(pId => {
      if (!selectedIds.includes(pId)) {
        assignedElsewhere.set(pId, team.name);
      }
    });
  });

  if (pigeons.length === 0) return <p className="text-xs text-muted-foreground italic">{t("pigeons.empty")}</p>;

  return (
    <ScrollArea className="h-48 rounded-md border border-input p-2 bg-background/50">
      <div className="grid gap-2 sm:grid-cols-2">
        {pigeons.map((p) => {
          const otherTeamName = assignedElsewhere.get(p.id);
          const isDisabled = !!otherTeamName;

          return (
            <div 
              key={p.id} 
              className={`flex items-center gap-2 rounded-sm px-1.5 py-1 transition-colors ${
                isDisabled ? "opacity-50 bg-muted/30" : "hover:bg-accent/50"
              }`}
            >
              <Checkbox
                id={`pigeon-${p.id}`}
                checked={selectedIds.includes(p.id)}
                disabled={isDisabled}
                onCheckedChange={(checked) => {
                  if (checked) onChange([...selectedIds, p.id]);
                  else onChange(selectedIds.filter((id) => id !== p.id));
                }}
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
                    En: {otherTeamName}
                  </span>
                )}
              </label>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
