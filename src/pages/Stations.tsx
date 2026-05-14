import { MapPinned, MapPin, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CrudPage } from "@/components/CrudPage";
import { db, type Station } from "@/lib/db";
import { Button } from "@/components/ui/button";

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
      renderItem={(s) => <StationItem station={s} />}
    />
  );
}

function StationItem({ station }: { station: Station }) {
  const { t } = useTranslation();
  const hasCoords = station.lat != null && station.lng != null;

  const openInGoogleMaps = () => {
    if (hasCoords) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${station.lat},${station.lng}`, "_blank");
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex-1 space-y-1">
        <p className="font-semibold text-lg">
          {station.name} 
          {station.country && <span className="text-muted-foreground font-normal ml-1.5 text-sm">· {station.country}</span>}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {hasCoords ? (
            <span>{station.lat?.toFixed(6)}, {station.lng?.toFixed(6)}</span>
          ) : (
            <span>{t("crud_pages.stations.no_coords")}</span>
          )}
        </div>
        {station.notes && (
          <p className="text-sm text-muted-foreground italic line-clamp-1 mt-1">{station.notes}</p>
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
        <div className="relative h-24 w-full sm:w-48 shrink-0 overflow-hidden rounded-lg border bg-muted shadow-sm">
          <iframe
            title={`Map of ${station.name}`}
            width="100%"
            height="100%"
            style={{ border: 0, pointerEvents: "none" }}
            src={`https://maps.google.com/maps?q=${station.lat},${station.lng}&z=14&t=k&output=embed`}
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}
