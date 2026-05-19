import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix missing default marker images in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface Props {
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number) => void;
}

function LocationMarker({ lat, lng, onChange }: Props) {
  const [position, setPosition] = useState<L.LatLng | null>(
    lat !== undefined && lng !== undefined ? new L.LatLng(lat, lng) : null
  );

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (lat !== undefined && lng !== undefined) {
      const newPos = new L.LatLng(lat, lng);
      // Avoid flyTo if we just dragged or clicked
      if (!position || !newPos.equals(position)) {
        setPosition(newPos);
        map.flyTo(newPos, map.getZoom(), { animate: true, duration: 0.5 });
      }
    }
  }, [lat, lng, map, position]);

  return position === null ? null : (
    <Marker 
      position={position} 
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition(pos);
          onChange(pos.lat, pos.lng);
        }
      }}
    />
  );
}

export function LocationPicker({ lat, lng, onChange }: Props) {
  // Default to somewhere near the center of Spain/Europe if empty
  const defaultCenter = { lat: 40.4168, lng: -3.7038 }; 
  const center = lat !== undefined && lng !== undefined ? { lat, lng } : defaultCenter;

  return (
    <div className="h-[300px] w-full overflow-hidden rounded-xl border bg-muted z-10 relative isolate">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%", zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker lat={lat} lng={lng} onChange={onChange} />
      </MapContainer>
    </div>
  );
}
