import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { fetchFuelStations, FuelStation } from '../../../../services/firestore';

// Fix for default marker icon issue in Leaflet with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper function to check if station has Diesel option
const hasDieselOption = (station: FuelStation): boolean => {
  const options = station.options || station.formattedLocation?.options || [];
  return options.some((option: any) => {
    if (!option || typeof option !== 'object') return false;
    
    // Check title.ar, title.en, name.ar, name.en, and label fields
    const titleAr = option.title?.ar?.toLowerCase() || '';
    const titleEn = option.title?.en?.toLowerCase() || '';
    const nameAr = option.name?.ar?.toLowerCase() || '';
    const nameEn = option.name?.en?.toLowerCase() || '';
    const label = option.label?.toLowerCase() || '';
    
    return (
      titleAr.includes('ديزيل') ||
      titleEn.includes('diesel') ||
      nameAr.includes('ديزيل') ||
      nameEn.includes('diesel') ||
      label.includes('diesel')
    );
  });
};

// Create custom fuel station icon with Petrolife logo in red pin
const createRedPinIcon = (): L.DivIcon => {
  const logoImg = new Image();
  logoImg.src = '/img/logo-2.png';
  
  return L.divIcon({
    className: 'custom-fuel-marker',
    html: `
      <div style="position: relative; width: 32px; height: 40px; display: inline-block;">
        <svg width="32" height="40" viewBox="0 0 40 50" style="position: absolute; top: 0; left: 0; z-index: 1;">
          <path d="M20 0 C30 0, 38 8, 38 18 C38 28, 20 48, 20 48 C20 48, 2 28, 2 18 C2 8, 10 0, 20 0 Z" fill="#ef4444" stroke="#dc2626" stroke-width="1"/>
        </svg>
        <div style="position: absolute; top: 3px; left: 50%; transform: translateX(-50%); width: 20px; height: 20px; background-color: white; border: 1px solid #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.2); z-index: 2; overflow: hidden;">
          <img src="/img/logo-2.png" alt="P" style="width: 14px; height: 14px; object-fit: contain; display: block;" crossorigin="anonymous" />
        </div>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
};

// Create custom fuel station icon with Petrolife logo in yellow pin
const createYellowPinIcon = (): L.DivIcon => {
  const logoImg = new Image();
  logoImg.src = '/img/logo-2.png';
  
  return L.divIcon({
    className: 'custom-fuel-marker',
    html: `
      <div style="position: relative; width: 32px; height: 40px; display: inline-block;">
        <svg width="32" height="40" viewBox="0 0 40 50" style="position: absolute; top: 0; left: 0; z-index: 1;">
          <path d="M20 0 C30 0, 38 8, 38 18 C38 28, 20 48, 20 48 C20 48, 2 28, 2 18 C2 8, 10 0, 20 0 Z" fill="#fbbf24" stroke="#f59e0b" stroke-width="1"/>
        </svg>
        <div style="position: absolute; top: 3px; left: 50%; transform: translateX(-50%); width: 20px; height: 20px; background-color: white; border: 1px solid #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.2); z-index: 2; overflow: hidden;">
          <img src="/img/logo-2.png" alt="P" style="width: 14px; height: 14px; object-fit: contain; display: block;" crossorigin="anonymous" />
        </div>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
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

export const Map = (): JSX.Element => {
  const [stations, setStations] = useState<FuelStation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load fuel stations function
  const loadFuelStations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFuelStations();
      
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
  }, []);

  // Fetch fuel stations from Firestore
  useEffect(() => {
    loadFuelStations();
  }, [loadFuelStations]);

  // Create icon instances
  const redPinIcon = createRedPinIcon();
  const yellowPinIcon = createYellowPinIcon();
  
  // Default center for Saudi Arabia
  const defaultCenter: [number, number] = [23.8859, 45.0792]; // Riyadh
  const defaultZoom = 6;

  return (
    <section
      className="mb-5 flex flex-col bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] overflow-hidden border-[0.3px] border-solid border-[color:var(--color-mode-text-icons-t-placeholder)]"
      data-model-id="1:7883"
      role="region"
      aria-label="Petrolife stations map"
    >
      <header className="text-right inline-flex justify-end h-5 relative mt-[27px] mr-6 mb-4 items-center gap-1.5">
        <h1 className="relative text-right h-5 mt-[-1.00px] font-subtitle-subtitle-2 font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--subtitle-subtitle-2-font-style)]">
          مواقع محطات بترولايف {!loading && `(${stations.length})`}
        </h1>
        <MapPin className="w-5 h-5 text-gray-500" />
      </header>

      <div className="px-6 pb-6" style={{ height: '300px' }}>
        {loading && (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل المحطات...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full bg-red-50 rounded-lg">
            <div className="text-center">
              <p className="text-red-600 mb-2">{error}</p>
              <button
                onClick={loadFuelStations}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        )}

        {!loading && !error && stations.length === 0 && (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
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
            style={{ height: '100%', width: '100%', borderRadius: '8px' }}
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
                icon={hasDieselOption(station) ? yellowPinIcon : redPinIcon}
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
    </section>
  );
};
