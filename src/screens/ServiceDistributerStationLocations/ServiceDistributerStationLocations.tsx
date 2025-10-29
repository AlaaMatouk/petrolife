import { stationsData } from "../../constants/data";
import { Fuel } from "lucide-react";
import { StationLocationsMap } from "../../components/sections/StationLocationsMap";
import { DataTableSection } from "../../components/sections/DataTableSection";

// Station interface for Service Distributer Station Locations
interface Station {
  id: number;
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

  // Fetch data function for stations
  const fetchStationsData = async (): Promise<Station[]> => {
    // TODO: Replace with actual API call when ready
    // Transform the data to match the new Station interface
    return Promise.resolve(
      stationsData.map((station) => ({
        id: station.id,
        stationCode: station.stationCode,
        stationName: station.stationName,
        address: station.location,
        fuelTypes: station.fuelTypes,
        stationStatus: station.accountStatus
      }))
    );
  };

  // Handle status toggle
  const handleToggleStatus = (stationId: number) => {
    console.log(`Toggle status for station ${stationId}`);
    // TODO: Implement actual status toggle API call
  };
  return (
    <div className="flex flex-col w-full items-start gap-5">
      <div className="w-full">
        <StationLocationsMap title="مواقع المحطات"/>
      </div>
      <DataTableSection<Station>
        title="المحطات"
        entityName="المحطة"
        entityNamePlural="المحطات"
        icon={Fuel}
        columns={stationColumns}
        fetchData={fetchStationsData}
        onToggleStatus={handleToggleStatus}
        addNewRoute="/add-station"
        viewDetailsRoute={(id) => `/station/${id}`}
        loadingMessage="جاري تحميل بيانات المحطات..."
        errorMessage="فشل في تحميل بيانات المحطات. استخدام البيانات التجريبية."
        itemsPerPage={5}
      />
    </div>
  );
}

export default ServiceDistributerStationLocations;
