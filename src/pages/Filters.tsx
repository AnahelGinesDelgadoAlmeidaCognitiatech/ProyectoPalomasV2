import { Filter } from "lucide-react";
import { CrudPage } from "@/components/CrudPage";
import { db, type SavedFilter } from "@/lib/db";

export default function Filters() {
  return (
    <CrudPage<SavedFilter>
      title="Filters"
      description="Filtros guardados para la lista de palomas."
      icon={Filter}
      table={db.filters}
      entity="filter"
      defaults={() => ({ name: "", module: "pigeons" as const, query: {} })}
      fields={[
        { name: "name", label: "Nombre", required: true, placeholder: "Reproductores 2024" },
        { name: "module", label: "Módulo", placeholder: "pigeons / races / pairs" },
      ]}
      renderItem={(f) => (
        <div>
          <p className="font-semibold">{f.name}</p>
          <p className="text-xs text-muted-foreground">Aplica sobre: {f.module}</p>
        </div>
      )}
    />
  );
}
