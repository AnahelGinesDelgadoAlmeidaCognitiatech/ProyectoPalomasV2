import { Home } from "lucide-react";
import { CrudPage } from "@/components/CrudPage";
import { db, type Loft } from "@/lib/db";

export default function MyLoft() {
  return (
    <CrudPage<Loft>
      title="My Loft"
      description="Tus palomares y sus coordenadas."
      icon={Home}
      table={db.lofts}
      entity="loft"
      defaults={() => ({ name: "" })}
      fields={[
        { name: "name", label: "Nombre", required: true, placeholder: "Main Loft" },
        { name: "lat", label: "Latitud", type: "number" },
        { name: "lng", label: "Longitud", type: "number" },
        { name: "capacity", label: "Capacidad", type: "number" },
        { name: "notes", label: "Notas", type: "textarea", full: true },
      ]}
      renderItem={(l) => (
        <div>
          <p className="font-semibold">{l.name}</p>
          <p className="text-xs text-muted-foreground">
            {l.lat != null && l.lng != null ? `${l.lat.toFixed(4)}, ${l.lng.toFixed(4)}` : "Sin coordenadas"}
            {l.capacity ? ` · ${l.capacity} aves` : ""}
          </p>
        </div>
      )}
    />
  );
}
