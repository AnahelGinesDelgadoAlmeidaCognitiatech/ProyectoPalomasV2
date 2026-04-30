import { MapPinned } from "lucide-react";
import { CrudPage } from "@/components/CrudPage";
import { db, type Station } from "@/lib/db";

export default function Stations() {
  return (
    <CrudPage<Station>
      title="Stations"
      description="Estaciones de suelta con coordenadas."
      icon={MapPinned}
      table={db.stations}
      entity="station"
      defaults={() => ({ name: "" })}
      fields={[
        { name: "name", label: "Nombre", required: true, placeholder: "Barcelona" },
        { name: "country", label: "País" },
        { name: "lat", label: "Latitud", type: "number", placeholder: "41.3851" },
        { name: "lng", label: "Longitud", type: "number", placeholder: "2.1734" },
        { name: "notes", label: "Notas", type: "textarea", full: true },
      ]}
      renderItem={(s) => (
        <div>
          <p className="font-semibold">{s.name} {s.country && <span className="text-muted-foreground font-normal">· {s.country}</span>}</p>
          <p className="text-xs text-muted-foreground">
            {s.lat != null && s.lng != null ? `${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}` : "Sin coordenadas"}
          </p>
        </div>
      )}
    />
  );
}
