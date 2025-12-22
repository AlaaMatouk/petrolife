import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from "lucide-react";

// Fix for default marker icon issue in Leaflet with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon
const createMarkerIcon = () => {
  return L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41]
  });
};

interface LocationMarkerProps {
  position: [number, number] | null;
  setPosition: (position: [number, number]) => void;
}

// Component to handle map clicks and update marker position
function LocationMarker({ position, setPosition }: LocationMarkerProps) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={createMarkerIcon()} />
  );
}

interface StationLocationPickerProps {
  onLocationSelect: (coordinates: { lat: number; lng: number } | null) => void;
  initialCoordinates?: { lat: number; lng: number } | null;
}

export const StationLocationPicker: React.FC<StationLocationPickerProps> = ({
  onLocationSelect,
  initialCoordinates = null,
}) => {
  // Default center for Saudi Arabia (Riyadh)
  const defaultCenter: [number, number] = [23.8859, 45.0792];
  const defaultZoom = 6;

  const [position, setPosition] = useState<[number, number] | null>(
    initialCoordinates ? [initialCoordinates.lat, initialCoordinates.lng] : null
  );

  // Store the latest callback in a ref to avoid including it in dependencies
  const onLocationSelectRef = React.useRef(onLocationSelect);
  React.useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // Track if we're updating from props (shouldn't trigger callback) vs user interaction (should trigger callback)
  const isUpdatingFromPropsRef = React.useRef(false);
  const lastInitialCoordsRef = React.useRef<{ lat: number; lng: number } | null>(null);

  // Update position when initialCoordinates change (only if different)
  // This is when parent updates us, so we shouldn't call the callback back
  useEffect(() => {
    if (initialCoordinates) {
      const newPos: [number, number] = [initialCoordinates.lat, initialCoordinates.lng];
      // Only update if the coordinates actually changed
      const lastCoords = lastInitialCoordsRef.current;
      if (!lastCoords || lastCoords.lat !== newPos[0] || lastCoords.lng !== newPos[1]) {
        lastInitialCoordsRef.current = { lat: newPos[0], lng: newPos[1] };
        if (!position || position[0] !== newPos[0] || position[1] !== newPos[1]) {
          isUpdatingFromPropsRef.current = true;
          setPosition(newPos);
        }
      }
    } else {
      lastInitialCoordsRef.current = null;
    }
  }, [initialCoordinates?.lat, initialCoordinates?.lng]); // Remove position from deps

  // Track previous position to avoid calling callback unnecessarily
  const prevPositionRef = React.useRef<[number, number] | null>(position);
  
  // Update parent when position changes (but only if it's from user interaction, not from props)
  useEffect(() => {
    // Skip if this update came from props
    if (isUpdatingFromPropsRef.current) {
      prevPositionRef.current = position;
      isUpdatingFromPropsRef.current = false; // Reset flag
      return;
    }
    
    // Check if position actually changed
    const positionChanged = 
      !prevPositionRef.current && position ||
      prevPositionRef.current && (!position || 
        prevPositionRef.current[0] !== position[0] || 
        prevPositionRef.current[1] !== position[1]);
    
    if (positionChanged && position) {
      prevPositionRef.current = position;
      onLocationSelectRef.current({ lat: position[0], lng: position[1] });
    }
  }, [position]);

  const mapCenter = position || defaultCenter;

  return (
    <div className="w-full h-[400px] relative rounded-lg overflow-hidden border border-gray-300">
      <MapContainer
        center={mapCenter}
        zoom={position ? 15 : defaultZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
      {!position && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[400]">
          <div className="text-center p-4 bg-white bg-opacity-80 rounded-lg border border-gray-200">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm font-medium" dir="rtl">
              انقر لتحديد الموقع علي الخريطه
            </p>
            <p className="text-gray-500 text-xs mt-1" dir="rtl">
              او اسحب وافلت لتحديد الموقع الدقيق
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationLocationPicker;

