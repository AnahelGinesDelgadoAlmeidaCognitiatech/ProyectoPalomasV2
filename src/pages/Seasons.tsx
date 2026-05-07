import { CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
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
        <Link to={`/seasons/${s.id}/pairs`} className="group block w-full">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold group-hover:text-primary transition-colors">
                {s.name} <span className="text-muted-foreground font-normal">· {s.year}</span>
              </p>
              {s.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{s.notes}</p>}
            </div>
            <div className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              {t("seasons.view_pairs", "Ver parejas")} →
            </div>
          </div>
        </Link>
      )}
    />
  );
}
