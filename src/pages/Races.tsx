import { Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CrudPage } from "@/components/CrudPage";
import { db, type Race } from "@/lib/db";

export default function Races() {
  const { t } = useTranslation();
  return (
    <CrudPage<Race>
      title={t("sidebar.races")}
      description={t("crud_pages.races.desc")}
      icon={Trophy}
      table={db.races}
      entity="race"
      defaults={() => ({ date: new Date().toISOString().slice(0, 10), name: "", results: [] })}
      fields={[
        { name: "name", label: t("crud_pages.races.field_name"), required: true, placeholder: t("crud_pages.races.placeholder_name") },
        { name: "date", label: t("crud_pages.races.field_date"), type: "date", required: true },
        { name: "stationId", label: t("crud_pages.races.field_station"), placeholder: "Barcelona" },
        { name: "distanceKm", label: t("crud_pages.races.field_distance"), type: "number" },
        { name: "totalBirds", label: t("crud_pages.races.field_total"), type: "number" },
        { name: "liberationTime", label: t("crud_pages.races.field_time"), placeholder: "08:30" },
        { name: "notes", label: t("crud_pages.races.field_notes"), type: "textarea", full: true },
      ]}
      renderItem={(r) => (
        <div>
          <p className="font-semibold">{r.name}</p>
          <p className="text-xs text-muted-foreground">
            {r.date} {r.distanceKm ? `· ${r.distanceKm} km` : ""} {r.totalBirds ? `· ${r.totalBirds} ${t("crud_pages.races.birds")}` : ""}
          </p>
        </div>
      )}
    />
  );
}
