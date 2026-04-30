import { Database } from "lucide-react";
import { CrudPage } from "@/components/CrudPage";
import { db, type BandCollection } from "@/lib/db";

export default function Bands() {
  return (
    <CrudPage<BandCollection>
      title="Band Collections"
      description="Gestiona tus series de anillas registradas."
      icon={Database}
      table={db.bands}
      entity="band"
      defaults={() => ({ countryPrefix: "", year: String(new Date().getFullYear()), fromNumber: 1, toNumber: 100 })}
      fields={[
        { name: "countryPrefix", label: "Prefijo país", required: true, placeholder: "BE / NL / ES" },
        { name: "year", label: "Año", required: true, placeholder: "2025" },
        { name: "fromNumber", label: "Desde", type: "number", required: true },
        { name: "toNumber", label: "Hasta", type: "number", required: true },
        { name: "notes", label: "Notas", type: "textarea", full: true },
      ]}
      renderItem={(b) => (
        <div>
          <p className="font-semibold">{b.countryPrefix}-{b.year}-{String(b.fromNumber).padStart(7,"0")} → {String(b.toNumber).padStart(7,"0")}</p>
          <p className="text-xs text-muted-foreground">{b.toNumber - b.fromNumber + 1} anillas en la serie</p>
        </div>
      )}
    />
  );
}
