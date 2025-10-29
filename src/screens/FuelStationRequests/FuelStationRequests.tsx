import { Fuel } from 'lucide-react'
import { DataTableSection } from '../../components/sections/DataTableSection'
import { fetchFuelStationRequests } from '../../services/firestore'
import { auth } from '../../config/firebase'

// Fuel Station Request interface
interface FuelStationRequest {
  id: string;
  transactionNumber: string;
  stationName: string;
  clientName: string;
  workerName: string;
  fuelType: string;
  totalLiters: string;
  creationDate: string;
}

function FuelStationRequests() {
  // Define columns for fuel station requests table
  const fuelStationRequestColumns = [
    {
      key: "actions",
      label: "",
      width: "w-16 min-w-[60px]",
      priority: "high"
    },
    {
      key: "creationDate",
      label: "تاريخ الانشاء",
      width: "flex-1 grow min-w-[150px]",
      priority: "medium"
    },
    {
      key: "totalLiters",
      label: "اجمالي اللترات",
      width: "flex-1 grow min-w-[120px]",
      priority: "high"
    },
    {
      key: "fuelType",
      label: "نوع الوقود",
      width: "flex-1 grow min-w-[150px]",
      priority: "high"
    },
    {
      key: "workerName",
      label: "اسم العامل",
      width: "flex-1 grow min-w-[120px]",
      priority: "medium"
    },
    {
      key: "clientName",
      label: "اسم العميل",
      width: "flex-1 grow min-w-[120px]",
      priority: "medium"
    },
    {
      key: "stationName",
      label: "اسم المحطة",
      width: "flex-1 grow min-w-[100px]",
      priority: "high"
    },
    {
      key: "transactionNumber",
      label: "رقم المعاملة",
      width: "flex-1 grow min-w-[100px]",
      priority: "high"
    }
  ];

  // Fetch data function for fuel station requests
  const fetchFuelStationRequestsData = async (): Promise<FuelStationRequest[]> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.email) {
        console.error('No user logged in');
        return [];
      }

      const orders = await fetchFuelStationRequests(currentUser.email);
      return orders as FuelStationRequest[];
    } catch (error) {
      console.error('Error fetching fuel station requests:', error);
      return [];
    }
  };

  // Handle status toggle (if needed)
  const handleToggleStatus = (requestId: string | number) => {
    console.log(`Toggle status for fuel station request ${requestId}`);
    // TODO: Implement actual status toggle API call
  };

  return (
    <div className="flex flex-col w-full items-start gap-5">
      <DataTableSection<FuelStationRequest>
        title="طلبات محطات الوقود"
        entityName="طلب محطة الوقود"
        entityNamePlural="طلبات محطات الوقود"
        icon={Fuel}
        columns={fuelStationRequestColumns}
        fetchData={fetchFuelStationRequestsData}
        onToggleStatus={handleToggleStatus}
        addNewRoute="/add-fuel-station-request"
        viewDetailsRoute={(id) => `/fuel-station-request/${id}`}
        loadingMessage="جاري تحميل بيانات طلبات محطات الوقود..."
        errorMessage="فشل في تحميل بيانات طلبات محطات الوقود. استخدام البيانات التجريبية."
        itemsPerPage={5}
        showTimeFilter={true}
      />
    </div>
  )
}

export default FuelStationRequests