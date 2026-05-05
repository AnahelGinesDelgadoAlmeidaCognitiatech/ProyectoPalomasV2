import { Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CrudPage } from "@/components/CrudPage";
import { db, type Loft } from "@/lib/db";

export default function MyLoft() {
  const { t } = useTranslation();
  return (
    <CrudPage<Loft>
      title={t("sidebar.my_loft")}
      description={t("crud_pages.my_loft.desc")}
      icon={Home}
      table={db.lofts}
      entity="loft"
      defaults={() => ({ name: "" })}
      fields={[
        { name: "name", label: t("crud_pages.my_loft.field_name"), required: true, placeholder: t("crud_pages.my_loft.placeholder_name") },
        { name: "lat", label: t("crud_pages.my_loft.field_lat"), type: "number" },
        { name: "lng", label: t("crud_pages.my_loft.field_lng"), type: "number" },
        { name: "capacity", label: t("crud_pages.my_loft.field_capacity"), type: "number" },
        { name: "notes", label: t("crud_pages.my_loft.field_notes"), type: "textarea", full: true },
      ]}
      renderItem={(l) => (
        <div>
          <p className="font-semibold">{l.name}</p>
          <p className="text-xs text-muted-foreground">
            {l.lat != null && l.lng != null ? `${l.lat.toFixed(4)}, ${l.lng.toFixed(4)}` : t("crud_pages.stations.no_coords")}
            {l.capacity ? ` · ${l.capacity} ${t("crud_pages.my_loft.birds")}` : ""}
          </p>
        </div>
      )}
    />
  );
}
