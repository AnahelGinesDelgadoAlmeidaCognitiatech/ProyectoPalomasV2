import { Pill } from "lucide-react";
import { CrudPage } from "@/components/CrudPage";
import { db, type Medication } from "@/lib/db";

export default function Medications() {
  return (
    <CrudPage<Medication>
      title="Medications"
      description="Registro de tratamientos."
      icon={Pill}
      table={db.medications}
      entity="medication"
      defaults={() => ({ date: new Date().toISOString().slice(0, 10), name: "" })}
      fields={[
        { name: "date", label: "Fecha", type: "date", required: true },
        { name: "name", label: "Medicamento", required: true, placeholder: "Tricho-Plus" },
        { name: "reason", label: "Motivo", placeholder: "Prevención" },
        { name: "dose", label: "Dosis", placeholder: "5ml/L 3 días" },
        { name: "withdrawalDays", label: "Retirada (días)", type: "number" },
      ]}
      renderItem={(m) => (
        <div>
          <p className="font-semibold">{m.name} <span className="text-muted-foreground font-normal">· {m.date}</span></p>
          <p className="text-xs text-muted-foreground">{[m.reason, m.dose].filter(Boolean).join(" · ") || "—"}</p>
        </div>
      )}
    />
  );
}
