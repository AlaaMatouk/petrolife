import { DataTableSection } from "../../components/sections/DataTableSection";
import { Fuel } from "lucide-react";
import { fetchUserFuelStations } from "../../services/firestore";
import { useAuth } from "../../hooks/useGlobalState";

// Station interface
interface Station {
  id: string;
  stationCode: string;
  stationName: string;
  address: string;
  phone: string;
  fuelTypes: string[];
  stationStatus: { active: boolean; text: string };
}

export const Stations = (): JSX.Element => {
  const { user } = useAuth(); // Get current user from global state
  
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
      priority: "low",
      render: (value: string[]) => (
        <div className="text-center">
          {value.join(', ')}
        </div>
      )
    },
    {
      key: "address",
      label: "العنوان",
      width: "flex-1 grow min-w-[100px]",
      priority: "medium"
    },
    {
      key: "phone",
      label: "رقم الهاتف",
      width: "flex-1 grow min-w-[120px]",
      priority: "low"
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
      width: "flex-1 grow min-w-[100px]",
      priority: "high"
    }
  ];

  // Fetch data function for stations
  const fetchStationsData = async (): Promise<Station[]> => {
    try {
      console.log('📍 Fetching user fuel stations from Firestore...');
      console.log('👤 Current user:', user?.email);
      
      // Fetch filtered data from Firestore (only user's stations)
      const fuelStations = await fetchUserFuelStations();
      
      console.log(`✅ Fetched ${fuelStations.length} fuel stations for current user`);
      
      // Transform FuelStation data to match Station interface
      return fuelStations.map((station: any) => {
        // Debug: Log the raw station data to see what we're getting
        console.log('📊 Processing station:', {
          id: station.id,
          name: station.name || station.stationName,
          phoneNumber: station.phoneNumber,
          hasOptions: !!station.options,
          hasFormattedLocation: !!station.formattedLocation,
          isActive: station.isActive
        });
        
        // Extract fuel types from options array
        const fuelTypes: string[] = [];
        if (station.formattedLocation?.options && Array.isArray(station.formattedLocation.options)) {
          station.formattedLocation.options.forEach((option: any) => {
            if (option.title?.ar) {
              fuelTypes.push(option.title.ar);
            } else if (option.title?.en) {
              // Map English fuel types to Arabic
              const fuelName = option.title.en;
              if (fuelName === '91') fuelTypes.push('بنزين 91');
              else if (fuelName === '95') fuelTypes.push('بنزين 95');
              else if (fuelName.toLowerCase().includes('diesel')) fuelTypes.push('ديزل');
              else fuelTypes.push(fuelName);
            }
          });
        }
        
        // If no fuel types found in formattedLocation, check root level options
        if (fuelTypes.length === 0 && station.options && Array.isArray(station.options)) {
          station.options.forEach((option: any) => {
            if (option.title?.ar) {
              fuelTypes.push(option.title.ar);
            } else if (option.title?.en) {
              const fuelName = option.title.en;
              if (fuelName === '91') fuelTypes.push('بنزين 91');
              else if (fuelName === '95') fuelTypes.push('بنزين 95');
              else if (fuelName.toLowerCase().includes('diesel')) fuelTypes.push('ديزل');
              else fuelTypes.push(fuelName);
            }
          });
        }
        
        // Default fuel types if none found
        if (fuelTypes.length === 0) {
          fuelTypes.push("-");
        }
        
        // Extract address (prefer formattedLocation address fields)
        let address = station.cityName;
        if (!address && station.formattedLocation?.address) {
          const addr = station.formattedLocation.address;
          address = addr.city || addr.state || addr.country || 'غير محدد';
        }
        if (!address && station.address) {
          address = station.address;
        }
        if (!address) {
          address = 'غير محدد';
        }
        
        // Extract phone number
        const phone = station.phoneNumber || '-';
        
        // Extract station status
        const isActive = station.isActive === true;
        
        return {
          id: station.id,
          stationCode: station.id.substring(0, 8).toUpperCase(),
          stationName: station.stationName || station.name || 'محطة غير مسماة',
          address,
          phone,
          fuelTypes,
          stationStatus: { 
            active: isActive,
            text: isActive ? 'مفعل' : 'معطل'
          },
        };
      });
    } catch (error) {
      console.error('❌ Error fetching stations:', error);
      // Return empty array on error
      return [];
    }
  };

  // Handle status toggle
  const handleToggleStatus = (stationId: string | number) => {
    console.log(`Toggle status for station ${stationId}`);
    // TODO: Implement actual status toggle API call with Firestore
  };

  return (
    <div className="flex flex-col w-full items-start gap-5">
      <DataTableSection
        title="المحطات"
        entityName="المحطة"
        entityNamePlural="المحطات"
        icon={Fuel}
        columns={stationColumns}
        fetchData={fetchStationsData}
        onToggleStatus={handleToggleStatus}
        addNewRoute="/service-distributer-stations/add"
        viewDetailsRoute={(id) => `/service-distributer-station/${id}`}
        errorMessage="فشل في تحميل بيانات المحطات."
        itemsPerPage={5}
      />
    </div>
  );
};

