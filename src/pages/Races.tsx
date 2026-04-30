import { Trophy } from "lucide-react";
import { CrudPage } from "@/components/CrudPage";
import { db, type Race } from "@/lib/db";

export default function Races() {
  return (
    <CrudPage<Race>
      title="Races"
      description="Crea carreras y registra resultados."
      icon={Trophy}
      table={db.races}
      entity="race"
      defaults={() => ({ date: new Date().toISOString().slice(0, 10), name: "", results: [] })}
      fields={[
        { name: "name", label: "Nombre", required: true, placeholder: "Barcelona Internacional" },
        { name: "date", label: "Fecha", type: "date", required: true },
        { name: "stationId", label: "Suelta (Station)", placeholder: "Barcelona" },
        { name: "distanceKm", label: "Distancia (km)", type: "number" },
        { name: "totalBirds", label: "Total aves", type: "number" },
        { name: "liberationTime", label: "Hora suelta", placeholder: "08:30" },
        { name: "notes", label: "Notas", type: "textarea", full: true },
      ]}
      renderItem={(r) => (
        <div>
          <p className="font-semibold">{r.name}</p>
          <p className="text-xs text-muted-foreground">
            {r.date} {r.distanceKm ? `· ${r.distanceKm} km` : ""} {r.totalBirds ? `· ${r.totalBirds} aves` : ""}
          </p>
        </div>
      )}
    />
  );
}
