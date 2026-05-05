import { Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CrudPage } from "@/components/CrudPage";
import { db, type SavedFilter } from "@/lib/db";

export default function Filters() {
  const { t } = useTranslation();
  return (
    <CrudPage<SavedFilter>
      title={t("sidebar.filters")}
      description={t("crud_pages.filters.desc")}
      icon={Filter}
      table={db.filters}
      entity="filter"
      defaults={() => ({ name: "", module: "pigeons" as const, query: {} })}
      fields={[
        { name: "name", label: t("crud_pages.filters.field_name"), required: true, placeholder: t("crud_pages.filters.placeholder_name") },
        { name: "module", label: t("crud_pages.filters.field_module"), placeholder: "pigeons / races / pairs" },
      ]}
      renderItem={(f) => (
        <div>
          <p className="font-semibold">{f.name}</p>
          <p className="text-xs text-muted-foreground">{t("crud_pages.filters.applies_to")} {f.module}</p>
        </div>
      )}
    />
  );
}
