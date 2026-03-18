/**
 * Map component with Leaflet for interactive geography quiz
 */
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { LatLngExpression, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon for bundled assets
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapProps {
  onLocationClick: (lat: number, lon: number) => void;
  correctLocation?: { latitude: number; longitude: number };
  userLocation?: { latitude: number; longitude: number };
  disabled?: boolean;
}

// Fix for default marker icon in React
const createCustomIcon = (color = 'blue') => {
  return new Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

// Component to handle map click events
function ClickHandler({ onLocationClick, disabled }: { onLocationClick: (lat: number, lon: number) => void; disabled?: boolean }) {
  useMapEvents({
    click: (e) => {
      if (!disabled) {
        // Extract coordinates from Leaflet MouseEvent
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        // Validate coordinates are numbers
        if (typeof lat === 'number' && typeof lng === 'number' && 
            !isNaN(lat) && !isNaN(lng)) {
          onLocationClick(lat, lng);
        }
      }
    },
  });
  return null;
}

// Helper to validate location coordinates
function isValidLocation(location?: { latitude: number; longitude: number }): boolean {
  if (!location) return false;
  return (
    typeof location.latitude === 'number' &&
    typeof location.longitude === 'number' &&
    !isNaN(location.latitude) &&
    !isNaN(location.longitude) &&
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    location.longitude >= -180 &&
    location.longitude <= 180
  );
}

export default function Map({ onLocationClick, correctLocation, userLocation, disabled = false }: MapProps) {
  // Default view: world map centered
  const defaultCenter: LatLngExpression = [20, 0];
  const defaultZoom = 2;

  return (
    <div className="map-container" style={{ 
      width: '100%', 
      height: '100%',
      minHeight: '400px'
    }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        minZoom={1}
        maxZoom={8}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Handle click events */}
        <ClickHandler onLocationClick={onLocationClick} disabled={disabled} />

        {/* Correct location marker (shown after answer) */}
        {correctLocation && isValidLocation(correctLocation) && (
          <Marker
            position={[correctLocation.latitude, correctLocation.longitude]}
            icon={createCustomIcon('green')}
          >
            <Popup>Correct Location</Popup>
          </Marker>
        )}

        {/* User's clicked location marker (shown after answer) */}
        {userLocation && isValidLocation(userLocation) && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={createCustomIcon('red')}
          >
            <Popup>Your Answer</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
