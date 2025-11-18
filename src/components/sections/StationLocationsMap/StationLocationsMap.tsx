import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from "lucide-react";
import { fetchFuelStations, fetchUserFuelStations, FuelStation } from '../../../services/firestore';

// Fix for default marker icon issue in Leaflet with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom fuel station icon
const createFuelStationIcon = () => {
  return L.divIcon({
    className: 'custom-fuel-marker',
    html: `
      <div style="position: relative;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background-color: rgba(239, 68, 68, 0.1); border-radius: 50%;"></div>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; background-color: rgba(239, 68, 68, 0.3); border-radius: 50%;"></div>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 12px; height: 12px; background-color: #ef4444; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

// Component to auto-fit map bounds to show all markers
const AutoFitBounds: React.FC<{ stations: FuelStation[] }> = ({ stations }) => {
  const map = useMap();

  useEffect(() => {
    if (stations.length > 0) {
      const bounds = L.latLngBounds(
        stations.map((station) => [station.latitude, station.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [stations, map]);

  return null;
};

export interface StationLocationsMapProps {
  title?: string;
  filterByUser?: boolean; // If true, only show stations belonging to the current user (service distributer)
}

function StationLocationsMap({ title = "مواقع محطات بترولايف", filterByUser = false }: StationLocationsMapProps) {
  const [stations, setStations] = useState<FuelStation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch fuel stations from Firestore
  useEffect(() => {
    const loadFuelStations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use fetchUserFuelStations if filterByUser is true, otherwise use fetchFuelStations
        const data = filterByUser 
          ? await fetchUserFuelStations()
          : await fetchFuelStations();
        
        // Remove duplicate stations based on coordinates
        const uniqueStations = data.reduce((acc: FuelStation[], current) => {
          const isDuplicate = acc.some(
            (station) =>
              station.latitude === current.latitude &&
              station.longitude === current.longitude
          );
          if (!isDuplicate) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        setStations(uniqueStations);
      } catch (err) {
        console.error('Error loading fuel stations:', err);
        setError('فشل تحميل بيانات المحطات');
      } finally {
        setLoading(false);
      }
    };

    loadFuelStations();
  }, [filterByUser]);

  const fuelIcon = createFuelStationIcon();
  
  // Default center for Saudi Arabia (Riyadh)
  const defaultCenter: [number, number] = [23.8859, 45.0792];
  const defaultZoom = 6;

  return (
    <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-1.5">
          <h3 className="relative text-right h-5 mt-[-1.00px] font-subtitle-subtitle-2 font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--subtitle-subtitle-2-font-style)]">
            {title} {!loading && stations.length > 0 && `(${stations.length})`}
          </h3>
          <MapPin className="w-5 h-5 text-gray-500" />
        </div>
      </div>

      <div className="rounded-lg overflow-hidden relative min-h-[347px]">
        {loading && (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg min-h-[347px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل المحطات...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full bg-red-50 rounded-lg min-h-[347px]">
            <div className="text-center">
              <p className="text-red-600 mb-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        )}

        {!loading && !error && stations.length === 0 && (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg min-h-[347px]">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد محطات لعرضها</p>
            </div>
          </div>
        )}

        {!loading && !error && stations.length > 0 && (
          <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            style={{ height: '347px', width: '100%', borderRadius: '8px' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Auto-fit bounds to show all stations */}
            <AutoFitBounds stations={stations} />

            {/* Render markers for each fuel station */}
            {stations.map((station) => (
              <Marker
                key={station.id}
                position={[station.latitude, station.longitude]}
                icon={fuelIcon}
              >
                <Popup>
                  <div className="text-right" dir="rtl" style={{ minWidth: '200px' }}>
                    <div className="font-bold text-lg mb-2 text-gray-800">
                      {station.stationName}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{station.cityName}</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {station.latitude.toFixed(6)}, {station.longitude.toFixed(6)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}

export default StationLocationsMap;
