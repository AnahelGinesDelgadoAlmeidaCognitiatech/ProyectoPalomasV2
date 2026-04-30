import { Heart } from "lucide-react";
import { CrudPage } from "@/components/CrudPage";
import { db, type Pair } from "@/lib/db";

export default function Pairs() {
  return (
    <CrudPage<Pair>
      title="Pairs"
      description="Parejas reproductoras y sus nidadas."
      icon={Heart}
      table={db.pairs}
      entity="pair"
      defaults={() => ({ season: String(new Date().getFullYear()), pigeonIds: [] as any })}
      fields={[
        { name: "season", label: "Temporada", required: true, placeholder: "2025" },
        { name: "nestBox", label: "Nido / Casilla", placeholder: "A-12" },
        { name: "cockId", label: "ID macho (paloma)", placeholder: "p-101" },
        { name: "henId", label: "ID hembra (paloma)", placeholder: "p-102" },
        { name: "notes", label: "Notas", type: "textarea", full: true },
      ]}
      renderItem={(p) => (
        <div>
          <p className="font-semibold">Temporada {p.season} {p.nestBox && <span className="text-muted-foreground font-normal">· Nido {p.nestBox}</span>}</p>
          <p className="text-xs text-muted-foreground">♂ {p.cockId || "—"} × ♀ {p.henId || "—"}</p>
          {p.notes && <p className="text-xs mt-1">{p.notes}</p>}
        </div>
      )}
    />
  );
}
