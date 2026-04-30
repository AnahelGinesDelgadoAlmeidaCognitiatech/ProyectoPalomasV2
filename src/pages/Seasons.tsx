import { CalendarDays } from "lucide-react";
import { CrudPage } from "@/components/CrudPage";
import { db, type Season } from "@/lib/db";

export default function Seasons() {
  return (
    <CrudPage<Season>
      title="Seasons"
      description="Planifica y registra tus temporadas de cría."
      icon={CalendarDays}
      table={db.seasons}
      entity="season"
      defaults={() => ({ year: String(new Date().getFullYear()), name: "" })}
      fields={[
        { name: "year", label: "Año", required: true },
        { name: "name", label: "Nombre", required: true, placeholder: "Temporada 2025" },
        { name: "notes", label: "Notas", type: "textarea", full: true },
      ]}
      renderItem={(s) => (
        <div>
          <p className="font-semibold">{s.name} <span className="text-muted-foreground font-normal">· {s.year}</span></p>
          {s.notes && <p className="text-xs text-muted-foreground mt-1">{s.notes}</p>}
        </div>
      )}
    />
  );
}
