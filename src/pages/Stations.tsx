import { MapPinned } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CrudPage } from "@/components/CrudPage";
import { db, type Station } from "@/lib/db";

export default function Stations() {
  const { t } = useTranslation();
  return (
    <CrudPage<Station>
      title={t("sidebar.stations")}
      description={t("crud_pages.stations.desc")}
      icon={MapPinned}
      table={db.stations}
      entity="station"
      defaults={() => ({ name: "" })}
      fields={[
        { name: "name", label: t("crud_pages.stations.field_name"), required: true, placeholder: t("crud_pages.stations.placeholder_name") },
        { name: "country", label: t("crud_pages.stations.field_country") },
        { name: "lat", label: t("crud_pages.stations.field_lat"), type: "number", placeholder: "41.3851" },
        { name: "lng", label: t("crud_pages.stations.field_lng"), type: "number", placeholder: "2.1734" },
        { name: "notes", label: t("crud_pages.stations.field_notes"), type: "textarea", full: true },
      ]}
      renderItem={(s) => (
        <div>
          <p className="font-semibold">{s.name} {s.country && <span className="text-muted-foreground font-normal">· {s.country}</span>}</p>
          <p className="text-xs text-muted-foreground">
            {s.lat != null && s.lng != null ? `${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}` : t("crud_pages.stations.no_coords")}
          </p>
        </div>
      )}
    />
  );
}
