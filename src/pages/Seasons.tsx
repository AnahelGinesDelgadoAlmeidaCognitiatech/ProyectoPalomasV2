import { CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CrudPage } from "@/components/CrudPage";
import { db, type Season } from "@/lib/db";

export default function Seasons() {
  const { t } = useTranslation();
  return (
    <CrudPage<Season>
      title={t("sidebar.seasons")}
      description={t("crud_pages.seasons.desc")}
      icon={CalendarDays}
      table={db.seasons}
      entity="season"
      defaults={() => ({ year: String(new Date().getFullYear()), name: "" })}
      fields={[
        { name: "year", label: t("crud_pages.seasons.field_year"), required: true },
        { name: "name", label: t("crud_pages.seasons.field_name"), required: true, placeholder: t("crud_pages.seasons.placeholder_name") },
        { name: "notes", label: t("crud_pages.seasons.field_notes"), type: "textarea", full: true },
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
