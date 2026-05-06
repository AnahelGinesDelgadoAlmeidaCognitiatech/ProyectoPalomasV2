import { Home, MapPin, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CrudPage } from "@/components/CrudPage";
import { db, type Loft } from "@/lib/db";
import { Button } from "@/components/ui/button";

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
      renderItem={(l) => <LoftItem loft={l} />}
    />
  );
}

function LoftItem({ loft }: { loft: Loft }) {
  const { t } = useTranslation();
  const hasCoords = loft.lat != null && loft.lng != null;

  const openInGoogleMaps = () => {
    if (hasCoords) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${loft.lat},${loft.lng}`, "_blank");
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex-1 space-y-1">
        <p className="font-semibold text-lg">{loft.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {hasCoords ? (
            <span>{loft.lat?.toFixed(6)}, {loft.lng?.toFixed(6)}</span>
          ) : (
            <span>{t("crud_pages.stations.no_coords")}</span>
          )}
          {loft.capacity && (
            <span> · {loft.capacity} {t("crud_pages.my_loft.birds")}</span>
          )}
        </div>
        {loft.notes && (
          <p className="text-sm text-muted-foreground italic line-clamp-1 mt-1">{loft.notes}</p>
        )}
        
        {hasCoords && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 h-7 gap-1.5 text-[10px] uppercase tracking-wider font-bold"
            onClick={openInGoogleMaps}
          >
            <ExternalLink className="h-3 w-3" />
            Google Maps
          </Button>
        )}
      </div>

      {hasCoords && (
        <div className="relative h-24 w-full sm:w-40 shrink-0 overflow-hidden rounded-lg border bg-muted shadow-sm">
          <iframe
            title={`Map of ${loft.name}`}
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0, pointerEvents: "none" }}
            src={`https://www.google.com/maps/embed/v1/view?key=NOT_REQUIRED_FOR_SIMPLE_EMBED&center=${loft.lat},${loft.lng}&zoom=15&maptype=satellite`}
            // Note: Some embed features might require a key, but we can use a simpler version if needed
            // Falling back to a standard search embed which is more permissive
            srcDoc={`
              <style>body{margin:0;overflow:hidden}iframe{border:0}</style>
              <iframe 
                width="100%" 
                height="100%" 
                src="https://maps.google.com/maps?q=${loft.lat},${loft.lng}&z=15&t=k&output=embed">
              </iframe>
            `}
          />
        </div>
      )}
    </div>
  );
}
