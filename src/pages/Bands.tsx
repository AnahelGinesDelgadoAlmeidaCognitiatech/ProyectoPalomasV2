import { Database } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CrudPage } from "@/components/CrudPage";
import { db, type BandCollection } from "@/lib/db";

export default function Bands() {
  const { t } = useTranslation();
  return (
    <CrudPage<BandCollection>
      title={t("sidebar.bands")}
      description={t("crud_pages.bands.desc")}
      icon={Database}
      table={db.bands}
      entity="band"
      defaults={() => ({ countryPrefix: "", year: String(new Date().getFullYear()), fromNumber: 1, toNumber: 100 })}
      fields={[
        { name: "countryPrefix", label: t("crud_pages.bands.field_prefix"), required: true, placeholder: t("crud_pages.bands.placeholder_prefix") },
        { name: "year", label: t("crud_pages.bands.field_year"), required: true, placeholder: t("crud_pages.bands.placeholder_year") },
        { name: "fromNumber", label: t("crud_pages.bands.field_from"), type: "number", required: true },
        { name: "toNumber", label: t("crud_pages.bands.field_to"), type: "number", required: true },
        { name: "notes", label: t("crud_pages.bands.field_notes"), type: "textarea", full: true },
      ]}
      renderItem={(b) => (
        <div>
          <p className="font-semibold">{b.countryPrefix}-{b.year}-{String(b.fromNumber).padStart(7,"0")} → {String(b.toNumber).padStart(7,"0")}</p>
          <p className="text-xs text-muted-foreground">{b.toNumber - b.fromNumber + 1} {t("crud_pages.bands.bands_in_series")}</p>
        </div>
      )}
    />
  );
}
