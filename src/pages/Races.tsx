import { Trophy, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { CrudPage } from "@/components/CrudPage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db, type Race } from "@/lib/db";

export default function Races() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const teams = useLiveQuery(() => db.teams.toArray()) || [];

  return (
    <CrudPage<Race>
      title={t("sidebar.races")}
      description={t("crud_pages.races.desc")}
      icon={Trophy}
      table={db.races}
      entity="race"
      defaults={() => ({
        date: new Date().toISOString().slice(0, 10),
        name: "",
        results: [],
        teamId: "",
        archived: false,
      })}
      fields={[
        { name: "name", label: t("crud_pages.races.field_name"), required: true, placeholder: t("crud_pages.races.placeholder_name"), full: true },
        { name: "date", label: t("crud_pages.races.field_date"), type: "date", required: true },
        {
          name: "teamId",
          label: t("crud_pages.races.field_team"),
          type: "custom",
          render: (value, onChange) => (
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("crud_pages.races.field_team")} />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        },
        { name: "stationId", label: t("crud_pages.races.field_station"), placeholder: "Barcelona" },
        { name: "distanceKm", label: t("crud_pages.races.field_distance"), type: "number" },
        { name: "liberationTime", label: t("crud_pages.races.field_time"), placeholder: "08:30" },
        {
          name: "archived",
          label: t("races.field_status", "Estado"),
          type: "custom",
          render: (value, onChange) => (
            <Select
              value={value ? "inactive" : "active"}
              onValueChange={(v) => onChange(v === "inactive")}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t("races.status_active", "Activo")}</SelectItem>
                <SelectItem value="inactive">{t("races.status_inactive", "Inactivo")}</SelectItem>
              </SelectContent>
            </Select>
          ),
        },
        { name: "notes", label: t("crud_pages.races.field_notes"), type: "textarea", full: true },
      ]}
      renderItem={(r) => {
        const team = teams.find(t => t.id === r.teamId);
        const isActive = !r.archived;
        return (
          <div className="flex items-center justify-between w-full">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-lg">{r.name}</p>
                <Badge variant={isActive ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 h-5">
                  {isActive ? t("races.status_active", "Activo") : t("races.status_inactive", "Inactivo")}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                <span className="font-medium text-primary">{r.date}</span>
                {r.distanceKm && <span>· {r.distanceKm} km</span>}
                {team && (
                  <span className="flex items-center gap-1 text-primary">
                    <Users className="h-3 w-3" /> {team.name}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/races/${r.id}`);
              }}
              className="flex items-center gap-2"
            >
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="hidden sm:inline">{t("crud_pages.races.view_full")}</span>
            </Button>
          </div>
        );
      }}
    />
  );
}

