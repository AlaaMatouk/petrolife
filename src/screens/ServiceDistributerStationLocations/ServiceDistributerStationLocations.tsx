import { Fuel } from "lucide-react";
import { StationLocationsMap } from "../../components/sections/StationLocationsMap";
import { DataTableSection } from "../../components/sections/DataTableSection";
import { fetchUserFuelStations, FuelStation } from "../../services/firestore";

// Station interface for Service Distributer Station Locations
interface Station {
  id: string;
  stationCode: string;
  stationName: string;
  address: string;
  fuelTypes: string[];
  stationStatus: { active: boolean; text: string };
}

function ServiceDistributerStationLocations() {
  // Define columns for stations table
  const stationColumns = [
    {
      key: "actions",
      label: "",
      width: "w-16 min-w-[60px]",
      priority: "high"
    },
    {
      key: "stationStatus",
      label: "حالة المحطة",
      width: "flex-1 grow min-w-[120px]",
      priority: "high"
    },
    {
      key: "fuelTypes",
      label: "نوع الوقود",
      width: "flex-1 grow min-w-[150px]",
      priority: "high",
      render: (value: string[]) => (
        <div className="text-center">{value.join(" ")}</div>
      )
    },
    {
      key: "address",
      label: "العنوان",
      width: "flex-1 grow min-w-[150px]",
      priority: "medium"
    },
    {
      key: "stationName",
      label: "اسم المحطة",
      width: "flex-1 grow min-w-[150px]",
      priority: "high"
    },
    {
      key: "stationCode",
      label: "كود المحطة",
      width: "flex-1 grow min-w-[120px]",
      priority: "high"
    }
  ];

  // Fetch data function for stations - filtered by current user
  const fetchStationsData = async (): Promise<Station[]> => {
    try {
      // Fetch user's fuel stations from Firestore (same as map)
      const fuelStations = await fetchUserFuelStations();
      
      // Ensure stations are sorted by createdDate (descending - newest first)
      const sortedStations = [...fuelStations].sort((a, b) => {
        const dateA = a.createdDate?.toDate 
          ? a.createdDate.toDate().getTime() 
          : a.createdDate instanceof Date 
          ? a.createdDate.getTime() 
          : 0;
        const dateB = b.createdDate?.toDate 
          ? b.createdDate.toDate().getTime() 
          : b.createdDate instanceof Date 
          ? b.createdDate.getTime() 
          : 0;
        return dateB - dateA; // Descending order (newest first)
      });
      
      // Transform FuelStation data to Station interface format
      return sortedStations.map((station: FuelStation) => {
        // Use Firestore document ID directly (same as Stations.tsx)
        // Generate station code from document ID (first 8 characters, uppercase)
        const stationCode = station.id.substring(0, 8).toUpperCase();
        
        // Build address string from formattedLocation or address object
        let address = '';
        if (station.formattedLocation?.address) {
          const addr = station.formattedLocation.address;
          address = [
            addr?.road,
            addr?.city,
            addr?.state,
            addr?.country
          ].filter(Boolean).join('، ') || station.cityName || '-';
        } else if (station.address) {
          if (typeof station.address === 'string') {
            address = station.address;
          } else if (typeof station.address === 'object' && station.address !== null) {
            const addr = station.address as { road?: string; city?: string; state?: string; country?: string };
            address = [
              addr?.road,
              addr?.city,
              addr?.state,
              addr?.country
            ].filter(Boolean).join('، ') || station.cityName || '-';
          } else {
            address = station.cityName || '-';
          }
        } else {
          address = station.cityName || '-';
        }
        
        // Map fuel types - check if available in station data, otherwise use default
        const options = station.options as { fuelTypes?: string[] } | undefined;
        const fuelTypes = (options?.fuelTypes && Array.isArray(options.fuelTypes)) 
          ? options.fuelTypes
          : (station.type ? [station.type] : ['ديزل', 'بنزين 91']); // Default fuel types
        
        // Map isActive to stationStatus
        const isActive = station.isActive !== false; // Default to true if not specified
        const stationStatus = {
          active: isActive,
          text: isActive ? 'مفعل' : 'معطل'
        };
        
        return {
          id: station.id, // Use Firestore document ID directly (string)
          stationCode,
          stationName: station.stationName || station.name || 'محطة غير معروفة',
          address,
          fuelTypes: Array.isArray(fuelTypes) ? fuelTypes : [fuelTypes].filter(Boolean),
          stationStatus
        };
      });
    } catch (error) {
      console.error('Error fetching user stations:', error);
      // Return empty array on error
      return [];
    }
  };

  // Handle status toggle
  const handleToggleStatus = (stationId: number | string) => {
    console.log(`Toggle status for station ${stationId}`);
    // TODO: Implement actual status toggle API call
  };
  return (
    <div className="flex flex-col w-full items-start gap-5">
      <div className="w-full">
        <StationLocationsMap title="مواقع المحطات" filterByUser={true} />
      </div>
      <DataTableSection<Station>
        title="المحطات"
        entityName="المحطة"
        entityNamePlural="المحطات"
        icon={Fuel}
        columns={stationColumns}
        fetchData={fetchStationsData}
        onToggleStatus={handleToggleStatus}
        addNewRoute="/service-distributer-stations/add"
        viewDetailsRoute={(id) => `/service-distributer-station/${id}`}
        loadingMessage="جاري تحميل بيانات المحطات..."
        errorMessage="فشل في تحميل بيانات المحطات. استخدام البيانات التجريبية."
        itemsPerPage={5}
      />
    </div>
  );
}

export default ServiceDistributerStationLocations;
