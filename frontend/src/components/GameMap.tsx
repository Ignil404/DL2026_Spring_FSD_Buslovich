import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon for bundled assets
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Normalize longitude to range [-180, 180]
function normalizeLon(lon: number): number {
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;
  return lon;
}

// Custom icons
const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface Props {
  selectedPos: { lat: number; lng: number } | null;
  onSelect: (pos: { lat: number; lng: number }) => void;
  answerPos?: { lat: number; lng: number };
}

function ClickHandler({ onSelect }: { onSelect: Props["onSelect"] }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: normalizeLon(e.latlng.lng) });
    },
  });
  return null;
}

const GameMap = ({ selectedPos, onSelect, answerPos }: Props) => {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (answerPos && mapRef.current) {
      const bounds = L.latLngBounds([
        selectedPos ? [selectedPos.lat, selectedPos.lng] : [answerPos.lat, answerPos.lng],
        [answerPos.lat, answerPos.lng],
      ]);
      mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 6 });
    }
  }, [answerPos, selectedPos]);

  return (
    <div className="h-full w-full" style={{ zIndex: 0 }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        className="h-full w-full"
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={true}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <ClickHandler onSelect={onSelect} />
        {selectedPos && <Marker position={[selectedPos.lat, selectedPos.lng]} icon={blueIcon} />}
        {answerPos && <Marker position={[answerPos.lat, answerPos.lng]} icon={greenIcon} />}
        {answerPos && selectedPos && (
          <Polyline
            positions={[
              [selectedPos.lat, selectedPos.lng],
              [answerPos.lat, answerPos.lng],
            ]}
            pathOptions={{ color: "#3b82f6", weight: 2, dashArray: "8 4" }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default GameMap;
