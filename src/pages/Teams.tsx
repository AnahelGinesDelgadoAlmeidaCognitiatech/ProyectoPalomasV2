import { Users } from "lucide-react";
import { CrudPage } from "@/components/CrudPage";
import { db, type Team } from "@/lib/db";

export default function Teams() {
  return (
    <CrudPage<Team>
      title="Teams"
      description="Agrupa tus palomas en equipos de carrera."
      icon={Users}
      table={db.teams}
      entity="team"
      defaults={() => ({ name: "", pigeonIds: [] })}
      fields={[
        { name: "name", label: "Nombre", required: true, placeholder: "Equipo Velocidad 2025" },
        { name: "notes", label: "Notas", type: "textarea", full: true },
      ]}
      renderItem={(t) => (
        <div>
          <p className="font-semibold">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.pigeonIds?.length ?? 0} palomas</p>
        </div>
      )}
    />
  );
}
