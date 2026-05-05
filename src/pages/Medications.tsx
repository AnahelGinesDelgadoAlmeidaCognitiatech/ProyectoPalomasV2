import { Pill } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CrudPage } from "@/components/CrudPage";
import { db, type Medication } from "@/lib/db";

export default function Medications() {
  const { t } = useTranslation();
  return (
    <CrudPage<Medication>
      title={t("sidebar.medications")}
      description={t("crud_pages.medications.desc")}
      icon={Pill}
      table={db.medications}
      entity="medication"
      defaults={() => ({ date: new Date().toISOString().slice(0, 10), name: "" })}
      fields={[
        { name: "date", label: t("crud_pages.medications.field_date"), type: "date", required: true },
        { name: "name", label: t("crud_pages.medications.field_name"), required: true, placeholder: t("crud_pages.medications.placeholder_name") },
        { name: "reason", label: t("crud_pages.medications.field_reason"), placeholder: t("crud_pages.medications.placeholder_reason") },
        { name: "dose", label: t("crud_pages.medications.field_dose"), placeholder: t("crud_pages.medications.placeholder_dose") },
        { name: "withdrawalDays", label: t("crud_pages.medications.field_withdrawal"), type: "number" },
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
